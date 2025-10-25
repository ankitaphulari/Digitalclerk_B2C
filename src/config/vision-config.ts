// Google Cloud Vision API Configuration
// For DigitalClerk OCR Service
// SECURITY: API key is loaded from environment variables

export const GOOGLE_VISION_CONFIG = {
  // Load API key from environment variable (NEVER hardcode it!)
  apiKey: process.env.GOOGLE_VISION_API_KEY || '',
  
  // Project ID (optional)
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
};

// Validate configuration on startup
if (!GOOGLE_VISION_CONFIG.apiKey) {
  throw new Error(
    '❌ GOOGLE_VISION_API_KEY is not set in environment variables. ' +
    'Please add it to your .env file or deployment environment.'
  );
}

// OCR Processing Options
export const OCR_OPTIONS = {
  // Supported languages (English + Hindi for Indian documents)
  defaultLanguages: ['en', 'hi'],
  
  // Confidence threshold (0-1)
  minConfidence: 0.6,
  
  // Max file size (10MB)
  maxFileSize: 10 * 1024 * 1024,
  
  // Supported file types
  supportedTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ],
  
  // OCR Features to enable
  features: {
    textDetection: true,
    documentTextDetection: true,
    languageDetection: true,
    confidenceScores: true
  }
};

// Document Type Patterns for Indian Documents
export const DOCUMENT_PATTERNS = {
  PAN_CARD: [
    /PAN/i,
    /PERMANENT ACCOUNT NUMBER/i,
    /INCOME TAX DEPARTMENT/i,
    /[A-Z]{5}[0-9]{4}[A-Z]{1}/  // PAN format: ABCDE1234F
  ],
  
  AADHAAR: [
    /AADHAAR/i,
    /आधार/i,
    /UNIQUE IDENTIFICATION/i,
    /UIDAI/i,
    /\d{4}\s?\d{4}\s?\d{4}/  // Aadhaar format: 1234 5678 9012
  ],
  
  PASSPORT: [
    /PASSPORT/i,
    /REPUBLIC OF INDIA/i,
    /भारत गणराज्य/i,
    /[A-Z]\d{7}/  // Passport format: A1234567
  ],
  
  DRIVING_LICENSE: [
    /DRIVING LICENCE/i,
    /DRIVING LICENSE/i,
    /DL NO/i,
    /FORM OF LICENCE/i
  ],
  
  VOTER_ID: [
    /VOTER/i,
    /ELECTION/i,
    /ELECTORAL/i,
    /EPIC NO/i
  ],
  
  GST_CERTIFICATE: [
    /GSTIN/i,
    /GST/i,
    /GOODS AND SERVICES TAX/i,
    /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/  // GST format
  ],
  
  BANK_STATEMENT: [
    /BANK STATEMENT/i,
    /ACCOUNT STATEMENT/i,
    /IFSC/i,
    /ACCOUNT NUMBER/i
  ],
  
  ITR: [
    /INCOME TAX RETURN/i,
    /ITR/i,
    /ACKNOWLEDGEMENT NUMBER/i,
    /ASSESSMENT YEAR/i
  ]
};

// Rate Limiting Configuration
export const RATE_LIMITS = {
  // Free tier: 1000 requests/month
  monthlyLimit: 1000,
  
  // Requests per minute
  perMinute: 60,
  
  // Requests per second
  perSecond: 10
};

export default GOOGLE_VISION_CONFIG;
