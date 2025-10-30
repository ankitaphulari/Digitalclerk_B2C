// Mock user for MVP - in production, this would come from authentication
const MOCK_USER_ID = 'mvp-user-001';

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

// Helper functions for localStorage
const getFromStorage = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export class ProfileDatabaseService {
  // Profile Management
  static async createProfile(profileData: {
    profile_type: 'student' | 'job_seeker' | 'general';
    profile_name: string;
    photo_url?: string;
  }): Promise<UserProfile> {
    const profiles = getFromStorage<UserProfile>('user_profiles');
    
    const newProfile: UserProfile = {
      id: generateId(),
      user_id: MOCK_USER_ID,
      ...profileData,
      completion_percentage: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    profiles.push(newProfile);
    saveToStorage('user_profiles', profiles);
    
    return newProfile;
  }

  static async updateProfile(profileId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const profiles = getFromStorage<UserProfile>('user_profiles');
    const index = profiles.findIndex(p => p.id === profileId);
    
    if (index === -1) throw new Error('Profile not found');
    
    profiles[index] = {
      ...profiles[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    saveToStorage('user_profiles', profiles);
    return profiles[index];
  }

  static async getUserProfiles(): Promise<UserProfile[]> {
    const profiles = getFromStorage<UserProfile>('user_profiles');
    return profiles
      .filter(p => p.user_id === MOCK_USER_ID && p.is_active)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  static async getProfilesByType(profileType: 'student' | 'job_seeker' | 'general'): Promise<UserProfile[]> {
    const profiles = await this.getUserProfiles();
    return profiles.filter(p => p.profile_type === profileType);
  }

  static async deleteProfile(profileId: string): Promise<void> {
    await this.updateProfile(profileId, { is_active: false });
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
    const profileDataList = getFromStorage<ProfileData>('profile_data');
    const newDataList: ProfileData[] = [];

    fields.forEach(field => {
      // Check if field already exists (upsert logic)
      const existingIndex = profileDataList.findIndex(
        pd => pd.profile_id === profileId && pd.field_key === field.field_key
      );

      const newData: ProfileData = {
        id: existingIndex !== -1 ? profileDataList[existingIndex].id : generateId(),
        profile_id: profileId,
        field_key: field.field_key,
        field_value: field.field_value,
        field_category: field.field_category,
        data_source: field.data_source || 'manual',
        confidence_score: field.confidence_score || 100,
        source_document_id: field.source_document_id,
        created_at: existingIndex !== -1 ? profileDataList[existingIndex].created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingIndex !== -1) {
        profileDataList[existingIndex] = newData;
      } else {
        profileDataList.push(newData);
      }

      newDataList.push(newData);
    });

    saveToStorage('profile_data', profileDataList);
    return newDataList;
  }

  static async getProfileData(profileId: string): Promise<ProfileData[]> {
    const profileDataList = getFromStorage<ProfileData>('profile_data');
    return profileDataList
      .filter(pd => pd.profile_id === profileId)
      .sort((a, b) => {
        const categoryCompare = (a.field_category || '').localeCompare(b.field_category || '');
        if (categoryCompare !== 0) return categoryCompare;
        return (a.field_key || '').localeCompare(b.field_key || '');
      });
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
    const profileDocuments = getFromStorage<ProfileDocument>('profile_documents');
    
    const newDoc: ProfileDocument = {
      id: generateId(),
      profile_id: profileId,
      document_id: documentId,
      document_type: documentType,
      is_primary: isPrimary,
      created_at: new Date().toISOString(),
    };

    profileDocuments.push(newDoc);
    saveToStorage('profile_documents', profileDocuments);
    
    return newDoc;
  }

  static async getProfileDocuments(profileId: string): Promise<ProfileDocument[]> {
    const profileDocuments = getFromStorage<ProfileDocument>('profile_documents');
    return profileDocuments
      .filter(pd => pd.profile_id === profileId)
      .sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }

  // Form Submission Tracking
  static async saveFormSubmission(formData: {
    form_type: string;
    form_url?: string;
    profile_id?: string;
    submission_data: any;
    should_save_profile: boolean;
  }): Promise<FormSubmissionProfile> {
    const submissions = getFromStorage<FormSubmissionProfile>('form_submissions');
    
    const newSubmission: FormSubmissionProfile = {
      id: generateId(),
      user_id: MOCK_USER_ID,
      form_type: formData.form_type,
      form_url: formData.form_url,
      profile_id: formData.profile_id,
      submission_data: formData.submission_data,
      should_save_profile: formData.should_save_profile,
      created_at: new Date().toISOString(),
    };

    submissions.push(newSubmission);
    saveToStorage('form_submissions', submissions);
    
    return newSubmission;
  }

  static async getUserFormSubmissions(): Promise<FormSubmissionProfile[]> {
    const submissions = getFromStorage<FormSubmissionProfile>('form_submissions');
    return submissions
      .filter(s => s.user_id === MOCK_USER_ID)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

    // Get recent documents (mock data for MVP)
    const recentDocuments = getFromStorage<any>('document_uploads')
      .filter((doc: any) => doc.user_id === MOCK_USER_ID)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return {
      profiles,
      recentDocuments,
      formHistory,
    };
  }

  // Photo Management
  static async uploadProfilePhoto(file: File, profileId: string): Promise<string> {
    // Convert file to base64 for localStorage (MVP only - not recommended for production)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;
        
        // Save to localStorage (simplified for MVP)
        const photos = getFromStorage<{profileId: string, photoUrl: string}>('profile_photos');
        photos.push({ profileId, photoUrl: base64String });
        saveToStorage('profile_photos', photos);
        
        // Update profile with photo URL
        await this.updateProfile(profileId, { photo_url: base64String });
        
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
