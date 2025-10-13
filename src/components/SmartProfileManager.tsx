import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ProfileDatabaseService, UserProfile, ProfileData } from '@/services/ProfileDatabaseService';
import { useAuth } from '@/hooks/useAuth';
import { Plus, User, BookOpen, Briefcase, Upload, Save, X, CheckCircle } from 'lucide-react';

interface SmartProfileManagerProps {
  onProfileSelect?: (profile: UserProfile) => void;
  showCreateButton?: boolean;
  filterByType?: 'student' | 'job_seeker' | 'general';
}

export const SmartProfileManager: React.FC<SmartProfileManagerProps> = ({
  onProfileSelect,
  showCreateButton = true,
  filterByType,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profileData, setProfileData] = useState<ProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileType, setNewProfileType] = useState<'student' | 'job_seeker' | 'general'>('general');

  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user, filterByType]);

  const loadProfiles = async () => {
    try {
      setIsLoading(true);
      const loadedProfiles = filterByType 
        ? await ProfileDatabaseService.getProfilesByType(filterByType)
        : await ProfileDatabaseService.getUserProfiles();
      setProfiles(loadedProfiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a profile name",
        variant: "destructive",
      });
      return;
    }

    try {
      const newProfile = await ProfileDatabaseService.createProfile({
        profile_type: newProfileType,
        profile_name: newProfileName.trim(),
      });

      setProfiles([newProfile, ...profiles]);
      setShowCreateDialog(false);
      setNewProfileName('');
      setNewProfileType('general');

      toast({
        title: "Success",
        description: "Profile created successfully",
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: "Failed to create profile",
        variant: "destructive",
      });
    }
  };

  const handleProfileSelect = async (profile: UserProfile) => {
    setSelectedProfile(profile);
    if (onProfileSelect) {
      onProfileSelect(profile);
    }

    try {
      const data = await ProfileDatabaseService.getProfileData(profile.id);
      setProfileData(data);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const getProfileIcon = (type: string) => {
    switch (type) {
      case 'student':
        return <BookOpen className="w-5 h-5" />;
      case 'job_seeker':
        return <Briefcase className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getProfileColor = (type: string) => {
    switch (type) {
      case 'student':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'job_seeker':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    }
  };

  const getCompletionColor = (percentage: number | null) => {
    if (!percentage) return 'text-muted-foreground';
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Your Profiles</h3>
          <p className="text-sm text-muted-foreground">
            Manage your personal information for faster form filling
          </p>
        </div>
        {showCreateButton && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Profile
          </Button>
        )}
      </div>

      {/* Profiles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <Card className="p-8 text-center">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="text-lg font-medium mb-2">No profiles yet</h4>
          <p className="text-muted-foreground mb-4">
            Create your first profile to start saving time on forms
          </p>
          {showCreateButton && (
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Profile
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <Card
              key={profile.id}
              className={`p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                selectedProfile?.id === profile.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleProfileSelect(profile)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getProfileIcon(profile.profile_type)}
                  <h4 className="font-medium truncate">{profile.profile_name}</h4>
                </div>
                <Badge className={getProfileColor(profile.profile_type)}>
                  {profile.profile_type.replace('_', ' ')}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion:</span>
                  <span className={`font-medium ${getCompletionColor(profile.completion_percentage)}`}>
                    {profile.completion_percentage || 0}%
                  </span>
                </div>

                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${profile.completion_percentage || 0}%` }}
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  Updated: {new Date(profile.updated_at).toLocaleDateString()}
                </div>
              </div>

              {profile.photo_url && (
                <div className="mt-3 flex justify-center">
                  <img
                    src={profile.photo_url}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover border-2 border-border"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Selected Profile Details */}
      {selectedProfile && profileData.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Profile Data Preview</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProfile(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profileData
              .filter(data => data.field_value && data.field_value.trim() !== '')
              .map((data) => (
                <div key={data.id} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {data.field_key.replace('_', ' ').toUpperCase()}
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{data.field_value}</span>
                    {data.data_source === 'document' && (
                      <Badge variant="outline" className="text-xs">
                        From Document
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Create Profile Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="profileName">Profile Name</Label>
              <Input
                id="profileName"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="e.g., My Student Profile"
              />
            </div>

            <div>
              <Label htmlFor="profileType">Profile Type</Label>
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

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateProfile} className="flex-1 gap-2">
                <Save className="w-4 h-4" />
                Create Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};