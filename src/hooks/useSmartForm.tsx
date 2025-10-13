import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
import { normalizeInput } from "@/utils/inputNormalization";

interface ExtractedData {
  name?: string;
  dob?: string;
  address?: string;
  phone?: string;
  [key: string]: unknown;
}

interface SmartFormData {
  name: string;
  dob: string;
  address: string;
  phone: string;
}

interface FieldValidation {
  isValid: boolean;
  confidence: number;
  source: 'manual' | 'extracted' | 'profile';
  error?: string;
}

interface UseSmartFormReturn {
  formData: SmartFormData;
  fieldValidations: Record<string, FieldValidation>;
  isLoading: boolean;
  handleInputChange: (field: string, value: string) => void;
  handleInputBlur: (field: string, value: string) => void;
  validateField: (field: string, value: string) => FieldValidation;
  autoFillFromDocuments: () => Promise<void>;
}

export const useSmartForm = (formType: string): UseSmartFormReturn => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<SmartFormData>({
    name: "",
    dob: "",
    address: "",
    phone: ""
  });
  
  const [fieldValidations, setFieldValidations] = useState<Record<string, FieldValidation>>({
    name: { isValid: false, confidence: 0, source: 'manual' },
    dob: { isValid: false, confidence: 0, source: 'manual' },
    address: { isValid: false, confidence: 0, source: 'manual' },
    phone: { isValid: false, confidence: 0, source: 'manual' }
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Load user profile data and extracted document data on mount
   
  const loadInitialData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load user profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Load extracted data from documents
      const { data: documents } = await supabase
        .from('documents')
        .select('extracted_data, extraction_status')
        .eq('user_id', user.id)
        .eq('extraction_status', 'completed')
        .order('created_at', { ascending: false });

      // Pre-fill from profile if available
      if (profile) {
        const profileData = {
          name: profile.full_name || "",
          dob: profile.date_of_birth || "",
          address: profile.address || "",
          phone: profile.phone || ""
        };
        
        setFormData(prev => ({ ...prev, ...profileData }));
        
        // Mark profile fields as valid with medium confidence
        Object.keys(profileData).forEach(field => {
          if (profileData[field as keyof typeof profileData]) {
            setFieldValidations(prev => ({
              ...prev,
              [field]: { 
                isValid: true, 
                confidence: 0.7, 
                source: 'profile' 
              }
            }));
          }
        });
      }

      // Pre-fill from extracted documents (higher priority)
      if (documents && documents.length > 0) {
        await autoFillFromExtractedData(documents);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to aggregate and fill from extracted document data
  const autoFillFromExtractedData = async (
    documents: { extracted_data: Json; extraction_status: string | null }[]
  ) => {
    const extractedData: Record<string, unknown> = {};
    const bestConfidence: Record<string, number> = {};

    // Aggregate data from all documents, keeping highest confidence values
    documents.forEach(doc => {
      if (
        typeof doc === 'object' &&
        doc !== null &&
        'extracted_data' in doc &&
        typeof (doc as { extracted_data?: unknown }).extracted_data === 'object' &&
        (doc as { extracted_data?: unknown }).extracted_data !== null
      ) {
        const extracted = (doc as { extracted_data: Record<string, unknown> }).extracted_data;
        Object.keys(extracted).forEach(key => {
          const confidence = Number((extracted as Record<string, unknown>)[key + '_confidence']) || 0.5;
          if (!bestConfidence[key] || confidence > bestConfidence[key]) {
            extractedData[key] = extracted[key];
            bestConfidence[key] = confidence;
          }
        });
      }
    });

    // Update form data with extracted information
    const updates: Partial<SmartFormData> = {};
    const validationUpdates: Record<string, FieldValidation> = {};

    // Check multiple field name variations for better mapping
    const fieldMappings = {
      name: ['name', 'fullName', 'full_name', 'student_name', 'account_holder'],
      dob: ['dob', 'date_of_birth', 'dateOfBirth', 'birth_date'],
      address: ['address', 'bank_address'],
      phone: ['phone', 'mobile', 'contact']
    };

    Object.entries(fieldMappings).forEach(([formField, extractedFields]) => {
      for (const extractedField of extractedFields) {
        if (extractedData[extractedField]) {
          let value = String(extractedData[extractedField] ?? "");
          
          // For text fields (name, address), only trim leading/trailing spaces
          if (['name', 'address'].includes(formField)) {
            value = value.trim();
          }
          
          updates[formField as keyof SmartFormData] = value;
          validationUpdates[formField] = {
            isValid: true,
            confidence: bestConfidence[extractedField] || 0.5,
            source: 'extracted'
          };
          break;
        }
      }
    });

    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }));
      setFieldValidations(prev => ({ ...prev, ...validationUpdates }));

      toast.success(`Auto-filled ${Object.keys(updates).length} fields from your documents!`);
    }
  };

  // Autofill from documents on demand
  const autoFillFromDocuments = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: documents } = await supabase
        .from('documents')
        .select('extracted_data, extraction_status')
        .eq('user_id', user.id)
        .eq('extraction_status', 'completed')
        .order('created_at', { ascending: false });

      if (documents && documents.length > 0) {
        await autoFillFromExtractedData(documents);
      } else {
        toast.info("No extracted document data available for auto-fill.");
      }
    } catch (error) {
      console.error("Error auto-filling from documents:", error);
      toast.error("Failed to auto-fill from documents.");
    } finally {
      setIsLoading(false);
    }
  };

  // Field validation logic
  const validateField = (field: string, value: string): FieldValidation => {
    let isValid = false;
    let error: string | undefined;

    switch (field) {
      case 'name':
        const trimmedName = value.trim();
        isValid = trimmedName.length >= 2 && /^[A-Za-z]+( [A-Za-z]+)*$/.test(trimmedName);
        error = isValid ? undefined : "Name should contain only letters and single spaces between words";
        break;
      case 'dob':
        isValid = /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value) < new Date();
        error = isValid ? undefined : "Please enter a valid past date";
        break;
      case 'address':
        const trimmedAddress = value.trim();
        isValid = trimmedAddress.length >= 10;
        error = isValid ? undefined : "Address should be at least 10 characters";
        break;
      case 'phone':
        isValid = /^[+]?[\d\s\-()]{10,}$/.test(value);
        error = isValid ? undefined : "Please enter a valid phone number";
        break;
      default:
        isValid = value.length > 0;
    }

    return {
      isValid,
      confidence: isValid ? 1.0 : 0,
      source: 'manual',
      error
    };
  };

  // Handle manual input changes
  const handleInputChange = (field: string, value: string) => {
    // Don't trim while typing to preserve user input, only validate trimmed version
    setFormData(prev => ({ ...prev, [field]: value }));

    // Update validation when user manually changes a field
    const validation = validateField(field, value);
    setFieldValidations(prev => ({
      ...prev,
      [field]: validation
    }));
  };

  // Handle input blur for normalization
  const handleInputBlur = (field: string, value: string) => {
    // Normalize input on blur (trim and collapse consecutive spaces)
    const normalizedValue = normalizeInput(value);
    setFormData(prev => ({ ...prev, [field]: normalizedValue }));
    
    // Re-validate with normalized value
    const validation = validateField(field, normalizedValue);
    setFieldValidations(prev => ({
      ...prev,
      [field]: validation
    }));
  };

  // Load initial data on mount or when user/formType changes
  useEffect(() => {
    if (user) {
      loadInitialData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, formType]);

  return {
    formData,
    fieldValidations,
    isLoading,
    handleInputChange,
    handleInputBlur,
    validateField: validateField,
    autoFillFromDocuments
  };
};

