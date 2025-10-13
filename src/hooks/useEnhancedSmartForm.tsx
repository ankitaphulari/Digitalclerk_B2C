import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProfileDatabaseService, UserProfile, ProfileData } from '@/services/ProfileDatabaseService';
import { supabase } from '@/integrations/supabase/client';
import { normalizeInput } from '@/utils/inputNormalization';

interface ExtractedData {
  [key: string]: any;
}

interface EnhancedSmartFormData {
  [key: string]: string;
}

interface FieldValidation {
  isValid: boolean;
  error?: string;
  confidence?: number;
  source?: 'manual' | 'document' | 'profile';
}

interface UseEnhancedSmartFormReturn {
  formData: EnhancedSmartFormData;
  fieldValidations: Record<string, FieldValidation>;
  isLoading: boolean;
  availableProfiles: UserProfile[];
  selectedProfile: UserProfile | null;
  dataSource: Record<string, 'manual' | 'document' | 'profile'>;
  confidence: Record<string, number>;
  handleInputChange: (field: string, value: string) => void;
  handleInputBlur: (field: string, value: string) => void;
  validateAllFields: () => boolean;
  autoFillFromProfile: (profileId: string) => Promise<void>;
  autoFillFromDocuments: () => Promise<void>;
  autoFillFromExtractedData: (data: ExtractedData) => void;
  setSelectedProfile: (profile: UserProfile | null) => void;
  getFieldConfidence: (field: string) => number;
  getFieldSource: (field: string) => string;
  resetForm: () => void;
}

export const useEnhancedSmartForm = (
  formType: string,
  initialData: EnhancedSmartFormData = {}
): UseEnhancedSmartFormReturn => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<EnhancedSmartFormData>(initialData);
  const [fieldValidations, setFieldValidations] = useState<Record<string, FieldValidation>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState<UserProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [dataSource, setDataSource] = useState<Record<string, 'manual' | 'document' | 'profile'>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user, formType]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Load available profiles
      const profiles = await ProfileDatabaseService.getUserProfiles();
      setAvailableProfiles(profiles);

      // Auto-select best matching profile
      const bestMatch = findBestMatchingProfile(profiles);
      if (bestMatch) {
        setSelectedProfile(bestMatch);
        await autoFillFromProfile(bestMatch.id);
      }

      // Load recent documents for auto-fill
      await autoFillFromDocuments();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const findBestMatchingProfile = (profiles: UserProfile[]): UserProfile | null => {
    if (profiles.length === 0) return null;

    // Try to match by form type
    const formTypeLower = formType.toLowerCase();
    
    if (formTypeLower.includes('student') || formTypeLower.includes('scholarship')) {
      const studentProfile = profiles.find(p => p.profile_type === 'student');
      if (studentProfile) return studentProfile;
    }
    
    if (formTypeLower.includes('job') || formTypeLower.includes('employment')) {
      const jobProfile = profiles.find(p => p.profile_type === 'job_seeker');
      if (jobProfile) return jobProfile;
    }

    // Return the most complete profile
    return profiles.reduce((best, current) => {
      const bestCompletion = best.completion_percentage || 0;
      const currentCompletion = current.completion_percentage || 0;
      return currentCompletion > bestCompletion ? current : best;
    });
  };

  const autoFillFromProfile = async (profileId: string) => {
    try {
      const profileData = await ProfileDatabaseService.getProfileData(profileId);
      const newFormData = { ...formData };
      const newDataSource = { ...dataSource };
      const newConfidence = { ...confidence };

      profileData.forEach((data) => {
        if (data.field_value && data.field_value.trim() !== '') {
          // Map profile fields to form fields
          const formField = mapProfileFieldToFormField(data.field_key);
          if (formField && !newFormData[formField]) { // Don't overwrite existing data
            newFormData[formField] = data.field_value;
            newDataSource[formField] = 'profile';
            newConfidence[formField] = data.confidence_score || 100;
          }
        }
      });

      setFormData(newFormData);
      setDataSource(newDataSource);
      setConfidence(newConfidence);
      
      // Validate all filled fields
      Object.keys(newFormData).forEach(field => {
        validateField(field, newFormData[field]);
      });

    } catch (error) {
      console.error('Error auto-filling from profile:', error);
    }
  };

  const autoFillFromDocuments = async () => {
    try {
      if (!user) return;

      // Get recent documents with extracted data
      const { data: documents, error } = await supabase
        .from('document_uploads')
        .select('*')
        .eq('user_id', user.id)
        .eq('processing_status', 'completed')
        .not('extracted_data', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (documents && documents.length > 0) {
        // Combine data from all documents, prioritizing more recent ones
        const combinedData: ExtractedData = {};
        const combinedSources: Record<string, 'document'> = {};
        const combinedConfidence: Record<string, number> = {};

        documents.forEach((doc) => {
          if (doc.extracted_data) {
            Object.entries(doc.extracted_data as any).forEach(([key, value]) => {
              if (value && typeof value === 'string' && value.trim() !== '') {
                const formField = mapExtractedFieldToFormField(key);
                if (formField && !combinedData[formField]) { // Don't overwrite with older data
                  combinedData[formField] = value;
                  combinedSources[formField] = 'document';
                  combinedConfidence[formField] = doc.confidence_score || 85;
                }
              }
            });
          }
        });

        // Apply document data only to empty fields
        const newFormData = { ...formData };
        const newDataSource = { ...dataSource };
        const newConfidence = { ...confidence };

        Object.entries(combinedData).forEach(([field, value]) => {
          if (!newFormData[field]) { // Only fill empty fields
            newFormData[field] = value as string;
            newDataSource[field] = 'document';
            newConfidence[field] = combinedConfidence[field] || 85;
          }
        });

        setFormData(newFormData);
        setDataSource(newDataSource);
        setConfidence(newConfidence);
      }

    } catch (error) {
      console.error('Error auto-filling from documents:', error);
    }
  };

  const autoFillFromExtractedData = (data: ExtractedData) => {
    const newFormData = { ...formData };
    const newDataSource = { ...dataSource };
    const newConfidence = { ...confidence };

    Object.entries(data).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        const formField = mapExtractedFieldToFormField(key);
        if (formField) {
          // Document data has higher priority than profile data but lower than manual input
          if (!newFormData[formField] || newDataSource[formField] === 'profile') {
            newFormData[formField] = value;
            newDataSource[formField] = 'document';
            newConfidence[formField] = 90; // High confidence for fresh extraction
          }
        }
      }
    });

    setFormData(newFormData);
    setDataSource(newDataSource);
    setConfidence(newConfidence);

    // Validate all filled fields
    Object.keys(newFormData).forEach(field => {
      validateField(field, newFormData[field]);
    });
  };

  const mapProfileFieldToFormField = (profileField: string): string | null => {
    const mappings: Record<string, string> = {
      'full_name': 'fullName',
      'date_of_birth': 'dateOfBirth',
      'email': 'email',
      'phone': 'phone',
      'address': 'address',
      'aadhaar_number': 'aadhaarNumber',
      'pan_number': 'panNumber',
      'gender': 'gender',
      'father_name': 'fatherName',
      'mother_name': 'motherName',
      'education': 'qualification',
      'work_experience': 'experience',
    };

    return mappings[profileField] || null;
  };

  const mapExtractedFieldToFormField = (extractedField: string): string | null => {
    const mappings: Record<string, string> = {
      'fullName': 'fullName',
      'name': 'fullName',
      'dateOfBirth': 'dateOfBirth',
      'dob': 'dateOfBirth',
      'email': 'email',
      'phone': 'phone',
      'mobile': 'phone',
      'address': 'address',
      'aadhaarNumber': 'aadhaarNumber',
      'aadhaar': 'aadhaarNumber',
      'panNumber': 'panNumber',
      'pan': 'panNumber',
      'gender': 'gender',
      'fatherName': 'fatherName',
      'motherName': 'motherName',
    };

    return mappings[extractedField] || null;
  };

  const validateField = (field: string, value: string): FieldValidation => {
    let validation: FieldValidation = { isValid: true };

    if (!value || value.trim() === '') {
      validation = { isValid: false, error: 'This field is required' };
    } else {
      switch (field) {
        case 'fullName':
        case 'fatherName':
        case 'motherName':
          if (!/^[a-zA-Z\s]{2,50}$/.test(value)) {
            validation = { isValid: false, error: 'Name should contain only letters and be 2-50 characters long' };
          }
          break;
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            validation = { isValid: false, error: 'Please enter a valid email address' };
          }
          break;
        case 'phone':
          if (!/^\d{10}$/.test(value.replace(/\D/g, ''))) {
            validation = { isValid: false, error: 'Please enter a valid 10-digit phone number' };
          }
          break;
        case 'aadhaarNumber':
          if (!/^\d{12}$/.test(value.replace(/\D/g, ''))) {
            validation = { isValid: false, error: 'Aadhaar number should be 12 digits' };
          }
          break;
        case 'panNumber':
          if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.toUpperCase())) {
            validation = { isValid: false, error: 'Please enter a valid PAN number' };
          }
          break;
        case 'dateOfBirth':
          const date = new Date(value);
          const now = new Date();
          if (isNaN(date.getTime()) || date >= now) {
            validation = { isValid: false, error: 'Please enter a valid date of birth' };
          }
          break;
      }
    }

    // Add confidence and source info
    validation.confidence = confidence[field] || 100;
    validation.source = dataSource[field] || 'manual';

    setFieldValidations(prev => ({
      ...prev,
      [field]: validation
    }));

    return validation;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Mark as manual input
    setDataSource(prev => ({
      ...prev,
      [field]: 'manual'
    }));

    setConfidence(prev => ({
      ...prev,
      [field]: 100
    }));

    // Validate on change
    validateField(field, value);
  };

  const handleInputBlur = (field: string, value: string) => {
    const normalizedValue = normalizeInput(value);
    if (normalizedValue !== value) {
      setFormData(prev => ({
        ...prev,
        [field]: normalizedValue
      }));
      validateField(field, normalizedValue);
    }
  };

  const validateAllFields = (): boolean => {
    let isValid = true;
    Object.entries(formData).forEach(([field, value]) => {
      const fieldValidation = validateField(field, value);
      if (!fieldValidation.isValid) {
        isValid = false;
      }
    });
    return isValid;
  };

  const getFieldConfidence = (field: string): number => {
    return confidence[field] || 100;
  };

  const getFieldSource = (field: string): string => {
    const source = dataSource[field] || 'manual';
    switch (source) {
      case 'document':
        return 'From Document';
      case 'profile':
        return 'From Profile';
      default:
        return 'Manual Entry';
    }
  };

  const resetForm = () => {
    setFormData({});
    setFieldValidations({});
    setDataSource({});
    setConfidence({});
    setSelectedProfile(null);
  };

  return {
    formData,
    fieldValidations,
    isLoading,
    availableProfiles,
    selectedProfile,
    dataSource,
    confidence,
    handleInputChange,
    handleInputBlur,
    validateAllFields,
    autoFillFromProfile,
    autoFillFromDocuments,
    autoFillFromExtractedData,
    setSelectedProfile,
    getFieldConfidence,
    getFieldSource,
    resetForm,
  };
};