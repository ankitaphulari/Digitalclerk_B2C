import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ProfileDatabaseService, UserProfile } from '@/services/ProfileDatabaseService';
import { Save, User, BookOpen, Briefcase, Plus, X } from 'lucide-react';

interface AutoSavePromptProps {
  isOpen: boolean;
  onClose: () => void;
  formData: Record<string, any>;
  formType: string;
  extractedData?: Record<string, any>;
  documentType?: string;
  onProfileCreated?: (profile: UserProfile) => void;
}

export const AutoSavePrompt: React.FC<AutoSavePromptProps> = ({
  isOpen,
  onClose,
  formData,
  formType,
  extractedData,
  documentType,
  onProfileCreated,
}) => {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<'new' | 'existing' | 'skip'>('new');
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileType, setNewProfileType] = useState<'student' | 'job_seeker' | 'general'>('general');
  const [existingProfiles, setExistingProfiles] = useState<UserProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      loadExistingProfiles();
      suggestProfileDetails();
    }
  }, [isOpen, formType, documentType]);

  const loadExistingProfiles = async () => {
    try {
      const profiles = await ProfileDatabaseService.getUserProfiles();
      setExistingProfiles(profiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const suggestProfileDetails = () => {
    // Auto-suggest profile name and type based on form and document
    let suggestedType: 'student' | 'job_seeker' | 'general' = 'general';
    let suggestedName = '';

    if (formType.toLowerCase().includes('student') || 
        formType.toLowerCase().includes('scholarship') ||
        documentType?.toLowerCase().includes('student')) {
      suggestedType = 'student';
      suggestedName = `Student Profile - ${new Date().getFullYear()}`;
    } else if (formType.toLowerCase().includes('job') || 
               formType.toLowerCase().includes('employment') ||
               documentType?.toLowerCase().includes('experience')) {
      suggestedType = 'job_seeker';
      suggestedName = 'Job Application Profile';
    } else {
      suggestedName = `${formType} Profile`;
    }

    if (extractedData?.fullName) {
      suggestedName = `${extractedData.fullName} - ${suggestedType}`;
    }

    setNewProfileType(suggestedType);
    setNewProfileName(suggestedName);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      let profile: UserProfile;

      if (selectedOption === 'new') {
        // Create new profile
        if (!newProfileName.trim()) {
          toast({
            title: "Error",
            description: "Please enter a profile name",
            variant: "destructive",
          });
          return;
        }

        profile = await ProfileDatabaseService.createProfile({
          profile_type: newProfileType,
          profile_name: newProfileName.trim(),
        });
      } else if (selectedOption === 'existing') {
        // Use existing profile
        if (!selectedProfileId) {
          toast({
            title: "Error",
            description: "Please select a profile",
            variant: "destructive",
          });
          return;
        }

        profile = existingProfiles.find(p => p.id === selectedProfileId)!;
      } else {
        // Skip saving
        await saveFormSubmission();
        onClose();
        return;
      }

      // Extract and save profile data
      const fieldsToSave = extractFieldsFromFormData();
      if (fieldsToSave.length > 0) {
        await ProfileDatabaseService.saveProfileData(profile.id, fieldsToSave);
        await ProfileDatabaseService.updateProfileCompletion(profile.id);
      }

      // Save form submission
      await saveFormSubmission(profile.id);

      toast({
        title: "Success",
        description: `Profile ${selectedOption === 'new' ? 'created' : 'updated'} successfully!`,
      });

      if (onProfileCreated) {
        onProfileCreated(profile);
      }

      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveFormSubmission = async (profileId?: string) => {
    try {
      await ProfileDatabaseService.saveFormSubmission({
        form_type: formType,
        profile_id: profileId,
        submission_data: { ...formData, extracted_data: extractedData },
        should_save_profile: selectedOption !== 'skip',
      });
    } catch (error) {
      console.error('Error saving form submission:', error);
    }
  };

  const extractFieldsFromFormData = () => {
    const fields: Array<{
      field_key: string;
      field_value: string;
      field_category: string;
      data_source: 'manual' | 'document' | 'form_submission';
      confidence_score?: number;
    }> = [];

    // Combine form data and extracted data
    const allData = { ...formData, ...extractedData };

    // Map common fields
    const fieldMappings = {
      fullName: { key: 'full_name', category: 'personal' },
      name: { key: 'full_name', category: 'personal' },
      email: { key: 'email', category: 'contact' },
      phone: { key: 'phone', category: 'contact' },
      address: { key: 'address', category: 'personal' },
      dateOfBirth: { key: 'date_of_birth', category: 'personal' },
      dob: { key: 'date_of_birth', category: 'personal' },
      aadhaarNumber: { key: 'aadhaar_number', category: 'identification' },
      panNumber: { key: 'pan_number', category: 'identification' },
      gender: { key: 'gender', category: 'personal' },
      qualification: { key: 'education', category: 'education' },
      experience: { key: 'work_experience', category: 'professional' },
    };

    Object.entries(allData).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        const mapping = fieldMappings[key as keyof typeof fieldMappings];
        if (mapping) {
          fields.push({
            field_key: mapping.key,
            field_value: value.trim(),
            field_category: mapping.category,
            data_source: extractedData && extractedData[key] ? 'document' : 'form_submission',
            confidence_score: extractedData && extractedData[key] ? 85 : 100,
          });
        }
      }
    });

    return fields;
  };

  const getProfileIcon = (type: string) => {
    switch (type) {
      case 'student':
        return <BookOpen className="w-4 h-4" />;
      case 'job_seeker':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const dataFields = extractFieldsFromFormData();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Save Your Information
          </DialogTitle>
          <DialogDescription>
            We noticed you filled out comprehensive information. Would you like to save this data 
            to create or update a profile for faster form filling in the future?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data Preview */}
          <Card className="p-4">
            <h4 className="font-medium mb-3">Data to be saved ({dataFields.length} fields):</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {dataFields.map((field, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">
                    {field.field_key.replace('_', ' ')}
                  </Badge>
                  <span className="truncate">{field.field_value}</span>
                  {field.data_source === 'document' && (
                    <Badge variant="secondary" className="text-xs">Document</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Save Options */}
          <div className="space-y-4">
            <h4 className="font-medium">How would you like to save this data?</h4>

            {/* Create New Profile */}
            <Card 
              className={`p-4 cursor-pointer transition-colors ${
                selectedOption === 'new' ? 'ring-2 ring-primary bg-accent/50' : 'hover:bg-accent/30'
              }`}
              onClick={() => setSelectedOption('new')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedOption === 'new' ? 'bg-primary border-primary' : 'border-muted-foreground'
                }`} />
                <Plus className="w-5 h-5" />
                <div className="flex-1">
                  <h5 className="font-medium">Create New Profile</h5>
                  <p className="text-sm text-muted-foreground">
                    Create a fresh profile with this information
                  </p>
                </div>
              </div>

              {selectedOption === 'new' && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <div>
                    <Label htmlFor="newProfileName">Profile Name</Label>
                    <Input
                      id="newProfileName"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="Enter profile name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newProfileType">Profile Type</Label>
                    <Select value={newProfileType} onValueChange={(value: any) => setNewProfileType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="job_seeker">Job Seeker</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </Card>

            {/* Update Existing Profile */}
            {existingProfiles.length > 0 && (
              <Card 
                className={`p-4 cursor-pointer transition-colors ${
                  selectedOption === 'existing' ? 'ring-2 ring-primary bg-accent/50' : 'hover:bg-accent/30'
                }`}
                onClick={() => setSelectedOption('existing')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedOption === 'existing' ? 'bg-primary border-primary' : 'border-muted-foreground'
                  }`} />
                  <User className="w-5 h-5" />
                  <div className="flex-1">
                    <h5 className="font-medium">Update Existing Profile</h5>
                    <p className="text-sm text-muted-foreground">
                      Add this data to one of your existing profiles
                    </p>
                  </div>
                </div>

                {selectedOption === 'existing' && (
                  <div className="mt-4 border-t pt-4">
                    <Label htmlFor="existingProfile">Select Profile</Label>
                    <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingProfiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            <div className="flex items-center gap-2">
                              {getProfileIcon(profile.profile_type)}
                              <span>{profile.profile_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {profile.completion_percentage}% complete
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </Card>
            )}

            {/* Skip */}
            <Card 
              className={`p-4 cursor-pointer transition-colors ${
                selectedOption === 'skip' ? 'ring-2 ring-primary bg-accent/50' : 'hover:bg-accent/30'
              }`}
              onClick={() => setSelectedOption('skip')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedOption === 'skip' ? 'bg-primary border-primary' : 'border-muted-foreground'
                }`} />
                <X className="w-5 h-5" />
                <div className="flex-1">
                  <h5 className="font-medium">Skip for Now</h5>
                  <p className="text-sm text-muted-foreground">
                    Don't save this data, I'll enter it manually next time
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSaveProfile} 
              disabled={isLoading}
              className="flex-1 gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : 
                selectedOption === 'new' ? 'Create Profile' :
                selectedOption === 'existing' ? 'Update Profile' : 'Skip & Continue'}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};