import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Plus, Edit, Eye, User, GraduationCap, Briefcase, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ProfileDatabaseService, UserProfile, ProfileData } from '@/services/ProfileDatabaseService';

const PROFILE_ICONS = {
  student: GraduationCap,
  job_seeker: Briefcase,
  general: User
};

const PROFILE_COLORS = {
  student: 'bg-blue-100 text-blue-700',
  job_seeker: 'bg-green-100 text-green-700',
  general: 'bg-purple-100 text-purple-700'
};

interface ProfileStorageProps {
  profileType?: string;
  selectedTemplate?: any;
  isTemplateContext?: boolean;
}

export const ProfileStorage: React.FC<ProfileStorageProps> = ({ 
  profileType, 
  selectedTemplate, 
  isTemplateContext = false 
}) => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [selectedProfileData, setSelectedProfileData] = useState<ProfileData[]>([]);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [creatingType, setCreatingType] = useState<'student' | 'job_seeker' | 'general' | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedProfileType, setFocusedProfileType] = useState<string | null>(
    isTemplateContext ? profileType || null : null
  );

  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user]);

  const loadProfiles = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userProfiles = await ProfileDatabaseService.getUserProfiles();
      setProfiles(userProfiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load profiles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSelect = async (profile: UserProfile) => {
    setSelectedProfile(profile);
    try {
      const profileData = await ProfileDatabaseService.getProfileData(profile.id);
      setSelectedProfileData(profileData);
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveProfile = async (profileData: UserProfile) => {
    if (!user) return;
    
    try {
      if (profileData.id && profiles.find(p => p.id === profileData.id)) {
        await ProfileDatabaseService.updateProfile(profileData.id, {
          profile_name: profileData.profile_name,
          is_active: profileData.is_active
        });
      } else {
        await ProfileDatabaseService.createProfile({
          profile_type: profileData.profile_type,
          profile_name: profileData.profile_name
        });
      }
      
      await loadProfiles();
      toast({
        title: "Success",
        description: "Profile saved successfully!",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteProfile = async (profileId: string) => {
    try {
      await ProfileDatabaseService.deleteProfile(profileId);
      
      if (selectedProfile?.id === profileId) {
        setSelectedProfile(null);
        setSelectedProfileData([]);
      }
      
      await loadProfiles();
      toast({
        title: "Success",
        description: "Profile deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: "Error",
        description: "Failed to delete profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getProfilesByType = (type: 'student' | 'job_seeker' | 'general') => {
    return profiles.filter(profile => profile.profile_type === type);
  };

  const calculateFieldCount = (profile: UserProfile) => {
    return profile.completion_percentage || 0;
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const renderProfileCard = (profile: UserProfile) => {
    const Icon = PROFILE_ICONS[profile.profile_type as keyof typeof PROFILE_ICONS];
    const fieldCount = calculateFieldCount(profile);
    
    return (
      <Card key={profile.id} className="relative group hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${PROFILE_COLORS[profile.profile_type as keyof typeof PROFILE_COLORS]}`}>
                <Icon size={16} />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">{profile.profile_name}</CardTitle>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile.profile_type.replace('_', ' ')} Profile
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {profile.completion_percentage}% Complete
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{fieldCount}% completion</span>
              <span>{formatLastUpdated(profile.updated_at || profile.created_at)}</span>
            </div>
            
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleProfileSelect(profile)}
                className="flex-1 h-7 text-xs"
              >
                <Eye size={12} className="mr-1" />
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingProfile(profile)}
                className="flex-1 h-7 text-xs"
              >
                <Edit size={12} className="mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteProfile(profile.id)}
                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCreateButton = (type: 'student' | 'job_seeker' | 'general', label: string) => (
    <Dialog open={creatingType === type} onOpenChange={(open) => !open && setCreatingType(null)}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCreatingType(type)}
          className="gap-2"
        >
          <Plus size={16} />
          Create New {label}
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New {label} Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="profile-name">Profile Name</Label>
            <Input
              id="profile-name"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder={`My ${label} Profile`}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreatingType(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (newProfileName.trim() && user) {
                  try {
                    const createdProfile = await ProfileDatabaseService.createProfile({
                      profile_type: type,
                      profile_name: newProfileName.trim()
                    });
                    
                    // If we're in template context, pre-populate with template fields
                    if (isTemplateContext && selectedTemplate && createdProfile) {
                      const templateFields = selectedTemplate.fields?.map((field: any) => ({
                        field_key: field.key,
                        field_value: field.defaultValue || '',
                        field_category: field.category || 'general',
                        data_source: 'manual' as const
                      })).filter((field: any) => field.field_value) || [];
                      
                      if (templateFields.length > 0) {
                        await ProfileDatabaseService.saveProfileData(createdProfile.id, templateFields);
                      }
                    }
                    
                    await loadProfiles();
                    setNewProfileName('');
                    setCreatingType(null);
                    
                    toast({
                      title: "Profile created",
                      description: isTemplateContext ? 
                        "Profile created with template fields pre-populated." : 
                        "Your new profile has been created successfully.",
                    });
                  } catch (error) {
                    console.error('Error creating profile:', error);
                    toast({
                      title: "Error",
                      description: "Failed to create profile. Please try again.",
                      variant: "destructive",
                    });
                  }
                }
              }}
              disabled={!newProfileName.trim() || !user}
            >
              Create Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const shouldShowSection = (type: string) => {
    return !focusedProfileType || focusedProfileType === type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Please Log In</h3>
          <p className="text-muted-foreground text-center mb-4">
            You need to be logged in to access your profile database.
          </p>
          <Button onClick={() => window.location.href = '/auth'} className="gap-2">
            <User className="w-4 h-4" />
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profiles...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profile Database</h2>
          <p className="text-muted-foreground">
            Manage your personal profiles for automatic form filling ({profiles.length} total)
          </p>
        </div>
      </div>

      {/* Student Profiles */}
      {shouldShowSection('student') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap size={20} className="text-blue-600" />
                Student Profiles
              </h3>
              {isTemplateContext && profileType === 'student' && (
                <p className="text-sm text-primary font-medium mt-1">Template context active</p>
              )}
            </div>
            {renderCreateButton('student', 'Student')}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getProfilesByType('student').map(renderProfileCard)}
            {getProfilesByType('student').length === 0 && (
              <Card className="col-span-full">
                <CardContent className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">
                    {isTemplateContext && profileType === 'student' ? 
                      'Create your first student profile using the template above' : 
                      'No student profiles yet'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Job Seeker Profiles */}
      {shouldShowSection('job_seeker') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase size={20} className="text-green-600" />
                Job Seeker Profiles
              </h3>
              {isTemplateContext && profileType === 'job_seeker' && (
                <p className="text-sm text-primary font-medium mt-1">Template context active</p>
              )}
            </div>
            {renderCreateButton('job_seeker', 'Job Seeker')}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getProfilesByType('job_seeker').map(renderProfileCard)}
            {getProfilesByType('job_seeker').length === 0 && (
              <Card className="col-span-full">
                <CardContent className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">
                    {isTemplateContext && profileType === 'job_seeker' ? 
                      'Create your first job seeker profile using the template above' : 
                      'No job seeker profiles yet'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* General Profiles */}
      {shouldShowSection('general') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User size={20} className="text-purple-600" />
                General Profiles
              </h3>
              {isTemplateContext && profileType === 'general' && (
                <p className="text-sm text-primary font-medium mt-1">Template context active</p>
              )}
            </div>
            {renderCreateButton('general', 'General')}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getProfilesByType('general').map(renderProfileCard)}
            {getProfilesByType('general').length === 0 && (
              <Card className="col-span-full">
                <CardContent className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">
                    {isTemplateContext && profileType === 'general' ? 
                      'Create your first general profile using the template above' : 
                      'No general profiles yet'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {profiles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Profiles Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first profile to start saving and organizing your personal information for automatic form filling.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Profile Preview */}
      {selectedProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye size={20} />
              Profile Preview: {selectedProfile.profile_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {selectedProfileData.map((data) => (
                <div key={data.field_key}>
                  <Label className="text-sm font-medium capitalize">
                    {data.field_key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Label>
                  <p className="text-sm text-muted-foreground">{data.field_value || 'Not provided'}</p>
                </div>
              ))}
              {selectedProfileData.length === 0 && (
                <p className="col-span-2 text-muted-foreground">No data saved in this profile yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};