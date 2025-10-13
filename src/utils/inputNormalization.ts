// Input normalization utility for preserving spaces and proper validation
// Handles trimming and space normalization for form inputs

export interface ValidationPattern {
  regex: RegExp;
  errorMessage: string;
}

// Validation patterns that allow spaces
export const VALIDATION_PATTERNS: Record<string, ValidationPattern> = {
  name: {
    regex: /^[A-Za-z.'\- ]{2,60}$/,
    errorMessage: "Name must be 2-60 characters and contain only letters, spaces, dots, apostrophes, and hyphens"
  },
  fathersName: {
    regex: /^[A-Za-z.'\- ]{2,60}$/,
    errorMessage: "Father's name must be 2-60 characters and contain only letters, spaces, dots, apostrophes, and hyphens"
  },
  address: {
    regex: /^[A-Za-z0-9#.,'\/\-() ]{5,200}$/,
    errorMessage: "Address must be 5-200 characters and contain valid address characters"
  },
  city: {
    regex: /^[A-Za-z\- ]{2,50}$/,
    errorMessage: "City must be 2-50 characters and contain only letters, spaces, and hyphens"
  },
  state: {
    regex: /^[A-Za-z\- ]{2,50}$/,
    errorMessage: "State must be 2-50 characters and contain only letters, spaces, and hyphens"
  },
  pan: {
    regex: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    errorMessage: "PAN must be in format ABCDE1234F"
  },
  aadhaar: {
    regex: /^\d{12}$/,
    errorMessage: "Aadhaar must be 12 digits"
  },
  pincode: {
    regex: /^\d{6}$/,
    errorMessage: "PIN code must be 6 digits"
  },
  phone: {
    regex: /^(\+91[\s\-]?)?[6-9]\d{9}$/,
    errorMessage: "Phone number must be a valid Indian mobile number"
  },
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    errorMessage: "Please enter a valid email address"
  }
};

/**
 * Normalizes input text by trimming leading/trailing spaces and collapsing multiple consecutive spaces
 * Used when user finishes editing (onBlur) but not while typing
 */
export const normalizeInput = (value: string): string => {
  if (!value) return '';
  return value.trim().replace(/\s{2,}/g, ' ');
};

/**
 * Validates field value against pattern and returns validation result
 */
export const validateField = (fieldName: string, value: string): { isValid: boolean; error?: string } => {
  if (!value || value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const normalizedValue = normalizeInput(value);
  const pattern = VALIDATION_PATTERNS[fieldName];
  
  if (!pattern) {
    return { isValid: true }; // No specific validation pattern
  }

  const isValid = pattern.regex.test(normalizedValue);
  return {
    isValid,
    error: isValid ? undefined : pattern.errorMessage
  };
};

/**
 * Formats Aadhaar number for display with spaces (XXXX XXXX XXXX)
 */
export const formatAadhaarForDisplay = (aadhaar: string): string => {
  const cleaned = aadhaar.replace(/\D/g, '');
  if (cleaned.length !== 12) return aadhaar;
  return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
};

/**
 * Extracts digits-only from Aadhaar for storage
 */
export const extractAadhaarDigits = (aadhaar: string): string => {
  return aadhaar.replace(/\D/g, '');
};

/**
 * Formats name for display (Title Case)
 */
export const formatNameForDisplay = (name: string): string => {
  if (!name) return '';
  return normalizeInput(name)
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Cleans OCR text while preserving meaningful spaces
 */
export const cleanOCRText = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/\s{3,}/g, ' ') // Replace 3+ consecutive spaces with single space
    .replace(/\t/g, ' ') // Replace tabs with spaces
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')
    .replace(/[^\w\s\n\/\-.,():]/g, ' ') // Remove special characters except common ones
    .replace(/\s*\n\s*/g, '\n') // Clean line breaks
    .replace(/\s{2,}/g, ' ') // Replace multiple consecutive spaces with single space
    .trim();
};