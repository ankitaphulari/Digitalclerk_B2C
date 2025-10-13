import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, User, GraduationCap, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ProfileDatabaseService } from '@/services/ProfileDatabaseService';
import { toast } from "sonner";

interface AutoSaveDisplayProps {
  formType: string;
  formData: Record<string, string>;
}

export const AutoSaveDisplay: React.FC<AutoSaveDisplayProps> = ({
  formType,
  formData
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileType, setProfileType] = useState<'student' | 'job_seeker' | 'general'>('general');
  const [isSaving, setIsSaving] = useState(false);

  const hasData = Object.values(formData).some(value => value && value.trim() !== '');

  const handleSaveProfile = async () => {
    if (!user || !profileName.trim()) return;

    setIsSaving(true);
    try {
      // Create a new profile
      const profile = await ProfileDatabaseService.createProfile({
        profile_type: profileType,
        profile_name: profileName.trim()
      });

      // Save form data to the profile
      for (const [key, value] of Object.entries(formData)) {
        if (value && value.trim() !== '') {
          await ProfileDatabaseService.saveProfileData(profile.id, [{
            field_key: key,
            field_value: value,
            field_category: 'form_data',
            data_source: 'manual',
            confidence_score: 100
          }]);
        }
      }

      toast.success('Form data saved to profile!');
      setIsOpen(false);
      setProfileName('');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || !hasData) return null;

  return (
    <Card className="border-dashed border-2 border-blue-200 bg-blue-50/50">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">Save your progress</p>
            <p className="text-xs text-blue-700">
              Save this form data to a profile for future use
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Save size={16} />
                Save to Profile
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Form Data to Profile</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="profile-name">Profile Name</Label>
                  <Input
                    id="profile-name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder={`My ${formType} Profile`}
                  />
                </div>
                
                <div>
                  <Label htmlFor="profile-type">Profile Type</Label>
                  <Select value={profileType} onValueChange={(value: any) => setProfileType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select profile type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">
                        <div className="flex items-center gap-2">
                          <GraduationCap size={16} />
                          Student
                        </div>
                      </SelectItem>
                      <SelectItem value="job_seeker">
                        <div className="flex items-center gap-2">
                          <Briefcase size={16} />
                          Job Seeker
                        </div>
                      </SelectItem>
                      <SelectItem value="general">
                        <div className="flex items-center gap-2">
                          <User size={16} />
                          General
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={!profileName.trim() || isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};