// Local OCR Service using only Google Cloud Vision API
// No other third-party AI dependencies

import { AadhaarExtractor } from './AadhaarExtractor';
import { PANCardExtractor } from './PANCardExtractor';

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes?: Array<{
    text: string;
    coordinates: { x: number; y: number; width: number; height: number };
  }>;
}

export interface DocumentClassification {
  documentType: string;
  confidence: number;
  detectedFields: string[];
}

export interface ExtractedField {
  value: string;
  confidence: number;
  source: 'pattern' | 'position' | 'context';
}

export class LocalOCRService {
  private static instance: LocalOCRService;

  static getInstance(): LocalOCRService {
    if (!LocalOCRService.instance) {
      LocalOCRService.instance = new LocalOCRService();
    }
    return LocalOCRService.instance;
  }

  /**
   * Process document using only Google Vision API for OCR
   * All other processing is done locally with pattern matching
   */
  async processDocument(file: File): Promise<{
    ocr: OCRResult;
    classification: DocumentClassification;
    extractedFields: Record<string, ExtractedField>;
    processingTime: number;
  }> {
    const startTime = Date.now();
    console.log('🔍 Starting local document processing (Google Vision OCR only)...');

    try {
      // Step 1: Extract text using Google Vision API only
      const ocrResult = await this.performOCR(file);
      
      // Step 2: Classify document using local pattern matching
      const classification = this.classifyDocument(ocrResult.text);
      
      // Step 3: Extract fields using local pattern recognition
      const extractedFields = this.extractFieldsLocally(ocrResult.text, classification.documentType);
      
      const processingTime = Date.now() - startTime;
      
      console.log('✅ Local processing completed:', {
        documentType: classification.documentType,
        fieldsExtracted: Object.keys(extractedFields).length,
        processingTime: `${processingTime}ms`
      });

      return {
        ocr: ocrResult,
        classification,
        extractedFields,
        processingTime
      };

    } catch (error) {
      console.error('❌ Local processing failed:', error);
      throw error;
    }
  }

  /**
   * Use Google Vision API for OCR only
   */
  private async performOCR(file: File): Promise<OCRResult> {
    const base64 = await this.fileToBase64(file);
    
    try {
      // Use Supabase edge function for Vision API
      const response = await fetch('https://mftzlxhtghtmwvtxgbki.supabase.co/functions/v1/vision-ocr-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mdHpseGh0Z2h0bXd2dHhnYmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MTU1NzcsImV4cCI6MjA2OTE5MTU3N30.XbASqLF8wL_vno0iWQpSRl8abgziUg2xCettKJ_Cnr0`
        },
        body: JSON.stringify({
          imageBase64: base64
        })
      });

      if (!response.ok) {
        throw new Error(`Vision API failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        text: result.text || '',
        confidence: result.confidence || 0.8,
        boundingBoxes: result.boundingBoxes || []
      };
    } catch (error) {
      console.error('Google Vision API error:', error);
      throw new Error('OCR processing failed');
    }
  }

  /**
   * Local document classification using pattern matching
   * No external AI APIs needed
   */
  private classifyDocument(text: string): DocumentClassification {
    const patterns = {
      aadhaar: [
        /aadhaar/i,
        /आधार/,
        /\b\d{4}\s\d{4}\s\d{4}\b/, // Aadhaar number pattern
        /unique identification authority/i,
        /government of india/i
      ],
      pan: [
        /permanent account number/i,
        /income tax department/i,
        /\b[A-Z]{5}\d{4}[A-Z]{1}\b/, // PAN pattern
        /pan card/i
      ],
      passport: [
        /passport/i,
        /republic of india/i,
        /\bP\d{7}\b/, // Passport number pattern
        /ministry of external affairs/i,
        /immigration/i
      ],
      drivingLicense: [
        /driving license/i,
        /driving licence/i,
        /\b[A-Z]{2}\d{2}\s?\d{11}\b/, // DL number pattern
        /transport department/i,
        /motor vehicle/i
      ],
      voterID: [
        /voter.*id/i,
        /election commission/i,
        /\b[A-Z]{3}\d{7}\b/, // Voter ID pattern
        /electoral/i
      ]
    };

    let bestMatch = { type: 'unknown', score: 0, matches: 0 };

    for (const [docType, patternList] of Object.entries(patterns)) {
      let matches = 0;
      let score = 0;

      for (const pattern of patternList) {
        const match = text.match(pattern);
        if (match) {
          matches++;
          score += match[0].length / text.length; // Weight by match length
        }
      }

      const finalScore = matches * 0.3 + score * 0.7;
      if (finalScore > bestMatch.score) {
        bestMatch = { type: docType, score: finalScore, matches };
      }
    }

    const confidence = Math.min(bestMatch.score * 2, 0.95); // Scale confidence
    
    return {
      documentType: bestMatch.type,
      confidence,
      detectedFields: this.getExpectedFields(bestMatch.type)
    };
  }

  /**
   * Extract fields using local pattern matching and rules
   */
  private extractFieldsLocally(text: string, documentType: string): Record<string, ExtractedField> {
    const extractors = {
      aadhaar: this.extractAadhaarFields.bind(this),
      pan: this.extractPANFields.bind(this),
      passport: this.extractPassportFields.bind(this),
      drivingLicense: this.extractDrivingLicenseFields.bind(this),
      voterID: this.extractVoterIDFields.bind(this)
    };

    const extractor = extractors[documentType as keyof typeof extractors];
    return extractor ? extractor(text) : this.extractGenericFields(text);
  }

  private extractAadhaarFields(text: string): Record<string, ExtractedField> {
    // Use specialized AadhaarExtractor for better accuracy
    const extracted = AadhaarExtractor.extractFromAadhaarCard(text);
    const fields: Record<string, ExtractedField> = {};

    // Convert AadhaarExtractor results to LocalOCRService format
    if (extracted.aadhaar) {
      fields.aadhaarNumber = {
        value: extracted.aadhaar,
        confidence: 0.95,
        source: 'pattern'
      };
    }

    if (extracted.name) {
      fields.name = {
        value: extracted.name,
        confidence: 0.9,
        source: 'pattern'
      };
    }

    if (extracted.dob) {
      fields.dateOfBirth = {
        value: extracted.dob,
        confidence: 0.85,
        source: 'pattern'
      };
    } else if (extracted.yob) {
      fields.yearOfBirth = {
        value: extracted.yob,
        confidence: 0.8,
        source: 'pattern'
      };
    }

    if (extracted.address) {
      fields.address = {
        value: extracted.address,
        confidence: 0.8,
        source: 'pattern'
      };
    }

    if (extracted.pincode) {
      fields.pincode = {
        value: extracted.pincode,
        confidence: 0.9,
        source: 'pattern'
      };
    }

    // Fix gender detection - properly handle "Female" vs "Male"
    const genderMatch = text.match(/(?:male|female|पुरुष|महिला)/i);
    if (genderMatch) {
      const matchedText = genderMatch[0].toLowerCase();
      let gender: string;
      
      if (matchedText.includes('female') || matchedText.includes('महिला')) {
        gender = 'Female';
      } else if (matchedText.includes('male') || matchedText.includes('पुरुष')) {
        gender = 'Male';
      } else {
        gender = 'Unknown';
      }
      
      fields.gender = {
        value: gender,
        confidence: 0.9,
        source: 'pattern'
      };
    }

    return fields;
  }

  private extractPANFields(text: string): Record<string, ExtractedField> {
    // Use specialized PANCardExtractor for better accuracy
    const extracted = PANCardExtractor.extractFromPANCard(text);
    const fields: Record<string, ExtractedField> = {};

    // Convert PANCardExtractor results to LocalOCRService format
    if (extracted.pan) {
      fields.panNumber = {
        value: extracted.pan,
        confidence: 0.95,
        source: 'pattern'
      };
    }

    if (extracted.name) {
      fields.name = {
        value: extracted.name,
        confidence: 0.9,
        source: 'pattern'
      };
    }

    if (extracted.fathersName) {
      fields.fatherName = {
        value: extracted.fathersName,
        confidence: 0.85,
        source: 'pattern'
      };
    }

    if (extracted.dob) {
      fields.dateOfBirth = {
        value: extracted.dob,
        confidence: 0.85,
        source: 'pattern'
      };
    }

    return fields;
  }

  private extractPassportFields(text: string): Record<string, ExtractedField> {
    const fields: Record<string, ExtractedField> = {};

    // Passport number
    const passportMatch = text.match(/\b(P\d{7})\b/);
    if (passportMatch) {
      fields.passportNumber = {
        value: passportMatch[1],
        confidence: 0.95,
        source: 'pattern'
      };
    }

    // Name extraction
    const nameMatch = text.match(/(?:given name|surname)[:\s]+([a-zA-Z\s]+)/i);
    if (nameMatch) {
      fields.name = {
        value: nameMatch[1].trim(),
        confidence: 0.8,
        source: 'pattern'
      };
    }

    return fields;
  }

  private extractDrivingLicenseFields(text: string): Record<string, ExtractedField> {
    const fields: Record<string, ExtractedField> = {};

    // DL number
    const dlMatch = text.match(/\b([A-Z]{2}\d{2}\s?\d{11})\b/);
    if (dlMatch) {
      fields.dlNumber = {
        value: dlMatch[1],
        confidence: 0.95,
        source: 'pattern'
      };
    }

    return fields;
  }

  private extractVoterIDFields(text: string): Record<string, ExtractedField> {
    const fields: Record<string, ExtractedField> = {};

    // Voter ID number
    const voterMatch = text.match(/\b([A-Z]{3}\d{7})\b/);
    if (voterMatch) {
      fields.voterID = {
        value: voterMatch[1],
        confidence: 0.95,
        source: 'pattern'
      };
    }

    return fields;
  }

  private extractGenericFields(text: string): Record<string, ExtractedField> {
    const fields: Record<string, ExtractedField> = {};

    // Improved generic name extraction - avoid headers and single words
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Find valid name lines (avoid common header patterns)
    const headerBlacklist = ['GOVERNMENT', 'INDIA', 'DEPARTMENT', 'AUTHORITY', 'CARD', 'NUMBER'];
    
    for (const line of lines) {
      // Must be mostly alphabetic with spaces
      if (!/^[A-Za-z .'-]{3,50}$/.test(line)) continue;
      
      // Must have at least one space (multi-word names)
      if (!line.includes(' ')) continue;
      
      // Exclude obvious headers
      const upperLine = line.toUpperCase();
      if (headerBlacklist.some(header => upperLine.includes(header))) continue;
      
      // This looks like a valid name
      fields.name = {
        value: line.trim(),
        confidence: 0.6,
        source: 'pattern'
      };
      break;
    }

    return fields;
  }

  private getExpectedFields(documentType: string): string[] {
    const fieldMappings = {
      aadhaar: ['name', 'aadhaarNumber', 'dateOfBirth', 'gender', 'address'],
      pan: ['name', 'panNumber', 'fatherName', 'dateOfBirth'],
      passport: ['name', 'passportNumber', 'dateOfBirth', 'placeOfBirth'],
      drivingLicense: ['name', 'dlNumber', 'dateOfBirth', 'address'],
      voterID: ['name', 'voterID', 'address'],
      unknown: ['name']
    };

    return fieldMappings[documentType as keyof typeof fieldMappings] || fieldMappings.unknown;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}