import { DocumentTypeDetector } from './DocumentTypeDetector';
import { PANCardExtractor } from './PANCardExtractor';
import { AadhaarExtractor } from './AadhaarExtractor';
import { cleanOCRText } from '@/utils/inputNormalization';

export type IntelligentExtractionResult = {
  documentType: string;
  extractedFields: Record<string, unknown>;
  confidence: number;
};

// Enhanced intelligent extraction with comprehensive document type detection and field extraction
export const intelligentExtraction = (
  ocrText: string,
  documentType: 'auto' | 'aadhaar' | 'pan' | 'passport' | 'license' | 'voter_id' | 'birth_certificate' | 'bank_statement' | 'electricity_bill' | string = 'auto',
  context?: { formType?: string; documentCategory?: string }
): IntelligentExtractionResult => {
  const results: IntelligentExtractionResult = {
    documentType: 'unknown',
    extractedFields: {},
    confidence: 0,
  };

  if (!ocrText || ocrText.trim().length === 0) {
    return results;
  }

  // Clean OCR text while preserving meaningful spaces
  const text = cleanOCRText(ocrText);
  console.log('Cleaned OCR Text for extraction:', text);

  // Auto-detect document type if needed
  if (documentType === 'auto') {
    const detection = DocumentTypeDetector.detectDocumentType(text);
    
    // Use form context to hint at document type if detection is uncertain
    if (detection.confidence < 0.7 && context?.formType) {
      const formTypeHints: Record<string, string> = {
        'aadhaar': 'aadhaar',
        'pan': 'pan',
        'passport': 'passport',
        'driving_license': 'license',
        'driving': 'license',
        'scholarship': 'auto', // Could be various docs
        'gst': 'auto' // Could be various business docs
      };
      
      const hintedType = formTypeHints[context.formType];
      if (hintedType && hintedType !== 'auto') {
        console.log(`Using form type hint: ${context.formType} -> ${hintedType}`);
        documentType = hintedType;
      } else {
        documentType = detection.type;
      }
    } else {
      documentType = detection.type;
    }
    
    console.log(`Document type detected: ${documentType} (confidence: ${detection.confidence})`);
    console.log('Detection indicators:', detection.indicators);
  }

  // Now extract data based on detected document type
  let extractionResult;
  
  switch (documentType) {
    case 'pan':
      extractionResult = PANCardExtractor.extractFromPANCard(text);
      results.extractedFields = extractionResult.extractedFields;
      results.confidence = extractionResult.confidence / 100; // Normalize to 0-1
      break;
      
    case 'aadhaar':
      extractionResult = AadhaarExtractor.extractFromAadhaarCard(text);
      results.extractedFields = extractionResult.extractedFields;
      results.confidence = extractionResult.confidence / 100; // Normalize to 0-1
      break;
      
    default:
      // Fallback to legacy extraction for other document types
      results.extractedFields = legacyExtraction(text, documentType);
      results.confidence = 0.5;
      break;
  }

  results.documentType = documentType;
  console.log('Final extraction results:', results);
  return results;
};

// Legacy extraction function for backward compatibility
function legacyExtraction(text: string, documentType: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  
  // Basic extraction patterns for other document types
  if (documentType === 'aadhaar') {
    const aadhaarPattern = /\b(\d{4}\s?\d{4}\s?\d{4})\b/;
    const aadhaarMatch = text.match(aadhaarPattern);
    if (aadhaarMatch) {
      const aadhaar = aadhaarMatch[1].replace(/\s/g, '');
      fields.aadhaar = aadhaar;
      fields.aadhaarNumber = aadhaar;
    }

    // Enhanced name extraction with better space preservation
    const namePatterns = [
      /(?:Name|नाम)[:\s]*([A-Za-z][A-Za-z\s.'-]+?)(?:\n|DOB|D\.O\.B|Date of Birth|Year of Birth|Address|पता)/i,
      /^([A-Z][A-Za-z\s.'-]+)$/m
    ];

    for (const pattern of namePatterns) {
      const nameMatch = text.match(pattern);
      if (nameMatch) {
        let name = nameMatch[1].trim();
        name = name.replace(/^(?:Name|नाम)[:\s]*/, '').trim();
        name = name.replace(/[^A-Za-z\s]/g, '')
                  .replace(/\b[a-z]\b/g, '')
                  .replace(/\b[A-Z]{1}\b(?!\s+[A-Z])/g, '')
                  .replace(/\s{2,}/g, ' ')
                  .trim();
        
        if (name.length > 2 && name.length < 60 && /^[A-Za-z\s]+$/.test(name)) {
          fields.name = name;
          fields.fullName = name;
          break;
        }
      }
    }

    // Extract DOB
    const dobPatterns = [
      /(?:DOB|Date of Birth|D\.O\.B)[:\s]*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i,
      /(?:Year of Birth|YOB)[:\s]*(\d{4})/i,
      /\b([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})\b/
    ];

    for (const pattern of dobPatterns) {
      const dobMatch = text.match(pattern);
      if (dobMatch) {
        fields.dob = dobMatch[1];
        fields.date_of_birth = dobMatch[1];
        break;
      }
    }

    // Extract address
    const addressPattern = /(?:Address|पता)[:\s]*(.+?)(?=\d{6}|\n\n|$)/is;
    const addressMatch = text.match(addressPattern);
    if (addressMatch) {
      let address = addressMatch[1].trim()
        .replace(/\s+/g, ' ')
        .replace(/,+/g, ',')
        .replace(/\s*,\s*/g, ', ')
        .replace(/,\s*$/, '');
      
      if (address.length > 10) {
        fields.address = address;
      }
    }
  }

  // Generic PAN extraction
  if (documentType === 'pan' || documentType === 'auto') {
    const panPattern = /\b([A-Z]{5}[0-9]{4}[A-Z])\b/;
    const panMatch = text.match(panPattern);
    if (panMatch) {
      fields.pan = panMatch[1];
      fields.panNumber = panMatch[1];
    }

    // Extract name from PAN-like documents
    const namePatterns = [
      /^([A-Z][A-Z\s.'-]+)$/m,
      /(?:Name)[:\s]*([A-Z][A-Za-z\s.'-]+)/i
    ];

    for (const pattern of namePatterns) {
      const nameMatch = text.match(pattern);
      if (nameMatch && nameMatch[1].trim().length > 2) {
        let name = nameMatch[1].trim();
        if (!name.includes('INCOME') && !name.includes('TAX') && !name.includes('GOVT')) {
          name = name.replace(/[^A-Za-z\s]/g, '')
                    .replace(/\s{2,}/g, ' ')
                    .trim();
          
          if (name.length > 2 && name.length < 60) {
            fields.name = name;
            fields.fullName = name;
            break;
          }
        }
      }
    }

    // Extract DOB from PAN
    const dobPattern = /\b([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})\b/;
    const dobMatch = text.match(dobPattern);
    if (dobMatch) {
      fields.dob = dobMatch[1];
      fields.date_of_birth = dobMatch[1];
    }
  }

  return fields;
}

// Export as a class for compatibility with existing code
export default class IntelligentExtraction {
  static async extractData(
    text: string,
    documentType?: string,
    context?: { formType?: string; documentCategory?: string }
  ) {
    const result = intelligentExtraction(text, documentType || 'auto', context);
    return result.extractedFields;
  }
}