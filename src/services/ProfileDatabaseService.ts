import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  user_id: string;
  profile_type: 'student' | 'job_seeker' | 'general';
  profile_name: string;
  photo_url?: string | null;
  completion_percentage: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileData {
  id: string;
  profile_id: string;
  field_key: string;
  field_value: string | null;
  field_category: string | null;
  data_source: 'manual' | 'document' | 'form_submission' | null;
  confidence_score: number | null;
  source_document_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileDocument {
  id: string;
  profile_id: string;
  document_id: string;
  document_type?: string | null;
  is_primary: boolean | null;
  created_at: string;
}

export interface FormSubmissionProfile {
  id: string;
  user_id: string;
  form_type: string;
  form_url?: string | null;
  profile_id?: string | null;
  submission_data: any;
  should_save_profile: boolean | null;
  created_at: string;
}

export class ProfileDatabaseService {
  // Profile Management
  static async createProfile(profileData: {
    profile_type: 'student' | 'job_seeker' | 'general';
    profile_name: string;
    photo_url?: string;
  }): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        ...profileData,
      })
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  }

  static async updateProfile(profileId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data as UserProfile;
  }

  static async getUserProfiles(): Promise<UserProfile[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as UserProfile[];
  }

  static async getProfilesByType(profileType: 'student' | 'job_seeker' | 'general'): Promise<UserProfile[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('profile_type', profileType)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as UserProfile[];
  }

  static async deleteProfile(profileId: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: false })
      .eq('id', profileId);

    if (error) throw error;
  }

  // Profile Data Management
  static async saveProfileData(profileId: string, fields: Array<{
    field_key: string;
    field_value: string;
    field_category: string;
    data_source?: 'manual' | 'document' | 'form_submission';
    confidence_score?: number;
    source_document_id?: string;
  }>): Promise<ProfileData[]> {
    const fieldsToInsert = fields.map(field => ({
      profile_id: profileId,
      data_source: field.data_source || 'manual',
      confidence_score: field.confidence_score || 100,
      ...field,
    }));

    const { data, error } = await supabase
      .from('profile_data')
      .upsert(fieldsToInsert, { 
        onConflict: 'profile_id,field_key',
        ignoreDuplicates: false 
      })
      .select();

    if (error) throw error;
    return (data || []) as ProfileData[];
  }

  static async getProfileData(profileId: string): Promise<ProfileData[]> {
    const { data, error } = await supabase
      .from('profile_data')
      .select('*')
      .eq('profile_id', profileId)
      .order('field_category', { ascending: true })
      .order('field_key', { ascending: true });

    if (error) throw error;
    return (data || []) as ProfileData[];
  }

  static async updateProfileCompletion(profileId: string): Promise<void> {
    const profileData = await this.getProfileData(profileId);
    const totalFields = profileData.length;
    const filledFields = profileData.filter(field => 
      field.field_value && field.field_value.trim() !== ''
    ).length;
    
    const completionPercentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    await this.updateProfile(profileId, { completion_percentage: completionPercentage });
  }

  // Document Linking
  static async linkDocumentToProfile(profileId: string, documentId: string, documentType?: string, isPrimary = false): Promise<ProfileDocument> {
    const { data, error } = await supabase
      .from('profile_documents')
      .insert({
        profile_id: profileId,
        document_id: documentId,
        document_type: documentType,
        is_primary: isPrimary,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getProfileDocuments(profileId: string): Promise<ProfileDocument[]> {
    const { data, error } = await supabase
      .from('profile_documents')
      .select('*')
      .eq('profile_id', profileId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Form Submission Tracking
  static async saveFormSubmission(formData: {
    form_type: string;
    form_url?: string;
    profile_id?: string;
    submission_data: any;
    should_save_profile: boolean;
  }): Promise<FormSubmissionProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('form_submission_profiles')
      .insert({
        user_id: user.id,
        ...formData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserFormSubmissions(): Promise<FormSubmissionProfile[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('form_submission_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Combined Data Retrieval
  static async getCombinedProfileData(profileType?: 'student' | 'job_seeker' | 'general'): Promise<{
    profiles: UserProfile[];
    recentDocuments: any[];
    formHistory: FormSubmissionProfile[];
  }> {
    const [profiles, formHistory] = await Promise.all([
      profileType ? this.getProfilesByType(profileType) : this.getUserProfiles(),
      this.getUserFormSubmissions(),
    ]);

    // Get recent documents for active profiles
    let recentDocuments: any[] = [];
    if (profiles.length > 0) {
      const { data: documents } = await supabase
        .from('document_uploads')
        .select('*')
        .eq('user_id', profiles[0].user_id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      recentDocuments = documents || [];
    }

    return {
      profiles,
      recentDocuments,
      formHistory,
    };
  }

  // Photo Management
  static async uploadProfilePhoto(file: File, profileId: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${profileId}/photo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    // Update profile with photo URL
    await this.updateProfile(profileId, { photo_url: publicUrl });

    return publicUrl;
  }

  // Smart Profile Creation from Documents
  static async createProfileFromDocument(documentData: any, documentType: string): Promise<{
    suggestedProfileType: 'student' | 'job_seeker' | 'general';
    suggestedName: string;
    extractedFields: Array<{
      field_key: string;
      field_value: string;
      field_category: string;
      confidence_score: number;
    }>;
  }> {
    // Determine profile type based on document
    let suggestedProfileType: 'student' | 'job_seeker' | 'general' = 'general';
    if (documentType.toLowerCase().includes('student') || documentType.toLowerCase().includes('id')) {
      suggestedProfileType = 'student';
    } else if (documentType.toLowerCase().includes('experience') || documentType.toLowerCase().includes('resume')) {
      suggestedProfileType = 'job_seeker';
    }

    // Extract common fields
    const extractedFields: Array<{
      field_key: string;
      field_value: string;
      field_category: string;
      confidence_score: number;
    }> = [];

    if (documentData.fullName) {
      extractedFields.push({
        field_key: 'full_name',
        field_value: documentData.fullName,
        field_category: 'personal',
        confidence_score: documentData.confidence || 95,
      });
    }

    if (documentData.dateOfBirth || documentData.dob) {
      extractedFields.push({
        field_key: 'date_of_birth',
        field_value: documentData.dateOfBirth || documentData.dob,
        field_category: 'personal',
        confidence_score: documentData.confidence || 90,
      });
    }

    if (documentData.address) {
      extractedFields.push({
        field_key: 'address',
        field_value: documentData.address,
        field_category: 'personal',
        confidence_score: documentData.confidence || 85,
      });
    }

    if (documentData.aadhaarNumber) {
      extractedFields.push({
        field_key: 'aadhaar_number',
        field_value: documentData.aadhaarNumber,
        field_category: 'identification',
        confidence_score: documentData.confidence || 95,
      });
    }

    if (documentData.panNumber) {
      extractedFields.push({
        field_key: 'pan_number',
        field_value: documentData.panNumber,
        field_category: 'identification',
        confidence_score: documentData.confidence || 95,
      });
    }

    const suggestedName = documentData.fullName ? 
      `${documentData.fullName} - ${suggestedProfileType}` : 
      `Auto-generated ${suggestedProfileType} profile`;

    return {
      suggestedProfileType,
      suggestedName,
      extractedFields,
    };
  }
}