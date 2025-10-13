import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface FieldHistory {
  field_name: string;
  field_value: string;
  form_type: string;
  confidence: number;
  usage_count: number;
  last_used: string;
}

interface SmartSuggestion {
  value: string;
  confidence: number;
  source: 'history' | 'document' | 'ai_prediction';
  description?: string;
}

interface FieldPattern {
  pattern: string;
  field_type: string;
  examples: string[];
  validation_regex?: string;
}

export const useSmartFieldMatching = () => {
  const [fieldHistory, setFieldHistory] = useState<FieldHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

// Common field patterns for intelligent matching
// eslint-disable-next-line react-hooks/exhaustive-deps
const FIELD_PATTERNS: FieldPattern[] = [
  {
    pattern: 'name|full_name|applicant_name|student_name',
    field_type: 'name',
    examples: ['John Doe', 'Priya Sharma', 'Mohammed Ali'],
    validation_regex: '^[A-Za-z]+( [A-Za-z]+)*$'
  },
    {
      pattern: 'phone|mobile|contact|telephone',
      field_type: 'phone',
      examples: ['+91 98765 43210', '9876543210', '(91) 98765-43210'],
      validation_regex: '^(\\+91[\\s\\-]?)?[6-9]\\d{9}$'
    },
    {
      pattern: 'email|mail|e_mail',
      field_type: 'email',
      examples: ['user@example.com', 'john.doe@gmail.com'],
      validation_regex: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
    },
  {
    pattern: 'address|permanent_address|current_address|residential_address',
    field_type: 'address',
    examples: ['123 Main Street, City, State - 110001'],
    validation_regex: '^.{10,200}$'
  },
    {
      pattern: 'pincode|pin_code|postal_code|zip',
      field_type: 'pincode',
      examples: ['110001', '400001', '600001'],
      validation_regex: '^[1-9][0-9]{5}$'
    },
    {
      pattern: 'dob|date_of_birth|birth_date',
      field_type: 'date',
      examples: ['01/01/1990', '1990-01-01', '01-Jan-1990'],
      validation_regex: '^(\\d{1,2}[/-]\\d{1,2}[/-]\\d{4})|(\\d{4}[/-]\\d{1,2}[/-]\\d{1,2})$'
    },
    {
      pattern: 'aadhaar|aadhar|uid',
      field_type: 'aadhaar',
      examples: ['1234 5678 9012', '123456789012'],
      validation_regex: '^[0-9]{12}$'
    },
    {
      pattern: 'pan|pan_number|pan_card',
      field_type: 'pan',
      examples: ['ABCDE1234F', 'XYZAB5678C'],
      validation_regex: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
    }
  ];

  // Load field history on component mount
const loadFieldHistory = useCallback(async () => {
  setIsLoading(true);
  try {
    if (user?.id) {
      const localHistory = localStorage.getItem(`field_history_${user.id}`);
      if (localHistory) {
        setFieldHistory(JSON.parse(localHistory));
      }
    }
  } catch (error) {
    console.error('Error loading field history:', error);
  } finally {
    setIsLoading(false);
  }
}, [user]);

useEffect(() => {
  if (user) {
    loadFieldHistory();
  }
}, [loadFieldHistory, user]);

const saveFieldValue = useCallback(
  async (fieldName: string, fieldValue: string, formType: string) => {
    const trimmedValue = fieldValue.trim();
    if (!user || !trimmedValue || trimmedValue.length < 2) return;
    try {
      let updatedHistory = [...fieldHistory];
      const existingIndex = updatedHistory.findIndex(
        (h) =>
          h.field_name === fieldName &&
          h.form_type === formType &&
          h.field_value === trimmedValue
      );
      if (existingIndex !== -1) {
        updatedHistory[existingIndex] = {
          ...updatedHistory[existingIndex],
          confidence: Math.min(updatedHistory[existingIndex].confidence + 0.05, 0.99),
          usage_count: updatedHistory[existingIndex].usage_count + 1,
          last_used: new Date().toISOString(),
        };
      } else {
        updatedHistory = [
          ...fieldHistory,
          {
            field_name: fieldName,
            field_value: trimmedValue,
            form_type: formType,
            confidence: 0.9,
            usage_count: 1,
            last_used: new Date().toISOString(),
          },
        ];
      }

      setFieldHistory(updatedHistory);

      // Save to localStorage immediately
      localStorage.setItem(
        `field_history_${user.id}`,
        JSON.stringify(updatedHistory)
      );

      // Note: field_history table integration will be added once the table is available
      console.log('Field history saved to localStorage');
    } catch (error) {
      console.error('Error saving field value:', error);
    }
  },
  [fieldHistory, user]
);
const getSmartSuggestions = useCallback(
  (fieldName: string): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = [];

    const historySuggestions = fieldHistory
      .filter((h) => {
        // Match by field name
        const nameMatch =
          h.field_name.toLowerCase().includes(fieldName.toLowerCase()) ||
          fieldName.toLowerCase().includes(h.field_name.toLowerCase());

        // Match by field type if pattern found
        const typeMatch =
          FIELD_PATTERNS &&
          FIELD_PATTERNS.some(
            (p) =>
              p.field_type === h.field_name &&
              new RegExp(p.pattern, 'i').test(h.field_name)
          );

        return nameMatch || typeMatch;
      })
      .sort((a, b) => {
        // Sort by usage count and recency
        const scoreA =
          a.usage_count * 0.7 +
          ((Date.now() - new Date(a.last_used).getTime()) /
            (1000 * 60 * 60 * 24)) *
            -0.3;
        const scoreB =
          b.usage_count * 0.7 +
          ((Date.now() - new Date(b.last_used).getTime()) /
            (1000 * 60 * 60 * 24)) *
            -0.3;
        return scoreB - scoreA;
      })
      .slice(0, 3)
      .map((h) => ({
        value: h.field_value,
        confidence: Math.min(h.confidence + h.usage_count * 0.1, 0.95),
        source: 'history' as const,
        description: `Used ${h.usage_count} time(s) in ${h.form_type}`,
      }));

    suggestions.push(...historySuggestions);

    // Add pattern-based examples if no history or low confidence
    if (FIELD_PATTERNS && suggestions.length < 2) {
      // Find the pattern for this fieldName
      const patternObj = FIELD_PATTERNS.find((pattern) =>
        new RegExp(pattern.pattern, 'i').test(fieldName)
      );
      if (patternObj) {
        const exampleSuggestions = patternObj.examples
          .filter((example: string) => !suggestions.some((s) => s.value === example))
          .slice(0, 2 - suggestions.length)
          .map((example: string) => ({
            value: example,
            confidence: 0.6,
            source: 'ai_prediction' as const,
            description: `Common format for ${patternObj.field_type}`,
          }));

        suggestions.push(...exampleSuggestions);
      }
    }

    return suggestions;
  },
  [FIELD_PATTERNS, fieldHistory]
);

const validateFieldValue = useCallback(
  (fieldName: string, value: string): boolean => {
    const fieldPattern = FIELD_PATTERNS.find((pattern) =>
      new RegExp(pattern.pattern, 'i').test(fieldName)
    );

    if (fieldPattern?.validation_regex) {
      // For most fields, preserve spaces. Only remove for specific fields like Aadhaar/PAN
      const testValue = ['aadhaar', 'pan', 'pincode'].some(type => 
        fieldPattern.field_type === type
      ) ? value.replace(/\s/g, '') : value.trim();
      
      return new RegExp(fieldPattern.validation_regex).test(testValue);
    }

    return true;
  },
  [FIELD_PATTERNS]
);

const getValidationError = useCallback(
  (fieldName: string, value: string): string | null => {
    const fieldPattern = FIELD_PATTERNS.find((pattern) =>
      new RegExp(pattern.pattern, 'i').test(fieldName)
    );

    if (!fieldPattern || !value.trim()) return null;

    if (!validateFieldValue(fieldName, value)) {
      const fieldType = fieldPattern.field_type;
      const examples = fieldPattern.examples.join(', ');

      return `Invalid ${fieldType} format. Examples: ${examples}`;
    }

    return null;
  },
  [FIELD_PATTERNS, validateFieldValue]
);

  const clearFieldHistory = useCallback(async () => {
    try {
      setFieldHistory([]);
      if (user?.id) {
        localStorage.removeItem(`field_history_${user.id}`);
      }

      toast({
        title: 'Field History Cleared',
        description: 'All saved field suggestions have been removed.',
      });
    } catch (error) {
      console.error('Error clearing field history:', error);
    }
  }, [user, toast]);

  return {
    fieldHistory,
    isLoading,
    saveFieldValue,
    getSmartSuggestions,
    validateFieldValue,
    getValidationError,
    clearFieldHistory,
  };
};