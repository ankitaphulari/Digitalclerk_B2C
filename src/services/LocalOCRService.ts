// Local OCR Service using Google Cloud Vision API directly
// Updated to use your API key

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
  
  // Your Google Vision API Key
  private static readonly GOOGLE_VISION_API_KEY = 'AIzaSyDMqFu3DCMFo-q1_BCxhlzXJQP-OQRQxXM';
  private static readonly GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

  static getInstance(): LocalOCRService {
    if (!LocalOCRService.instance) {
      LocalOCRService.instance = new LocalOCRService();
    }
    return LocalOCRService.instance;
  }

  /**
   * Process document using Google Vision API for OCR
   * All other processing is done locally with pattern matching
   */
  async processDocument(file: File): Promise<{
    ocr: OCRResult;
    classification: DocumentClassification;
    extractedFields: Record<string, ExtractedField>;
    processingTime: number;
  }> {
    const startTime = Date.now();
    console.log('🔍 Starting local document processing (Google Vision OCR)...');

    try {
      // Step 1: Extract text using Google Vision API
      const ocrResult = await this.performOCR(file);
      
      // Step 2: Classify document using local pattern matching
      const classification = this.classifyDocument(ocrResult.text);
      
      // Step 3: Extract fields using local pattern recognition
      const extractedFields = this.extractFieldsLocally(ocrResult.text, classification.documentType);
      
      const processingTime = Date.now() - startTime;
      
      console.log('✅ Local processing completed:', {
        documentType: classification.documentType,
        fieldsExtracted: Object.keys(extractedFields).length,
        processingTime: `${processingTime}ms`,
        confidence: classification.confidence
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
   * Use Google Vision API directly with your API key
   */
  private async performOCR(file: File): Promise<OCRResult> {
    const base64 = await this.fileToBase64(file);
    
    try {
      console.log('📡 Calling Google Vision API...');
      
      // Call Google Vision API directly
      const response = await fetch(
        `${LocalOCRService.GOOGLE_VISION_API_URL}?key=${LocalOCRService.GOOGLE_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64
                },
                features: [
                  {
                    type: 'DOCUMENT_TEXT_DETECTION', // Best for documents
                    maxResults: 1
                  }
                ],
                imageContext: {
                  languageHints: ['en', 'hi'] // English and Hindi
                }
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Vision API error:', errorData);
        throw new Error(`Vision API failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.responses || !result.responses[0]) {
        throw new Error('No response from Vision API');
      }

      const visionResponse = result.responses[0];
      
      // Check for errors
      if (visionResponse.error) {
        throw new Error(`Vision API error: ${visionResponse.error.message}`);
      }

      // Extract text from fullTextAnnotation (most accurate for documents)
      const fullTextAnnotation = visionResponse.fullTextAnnotation;
      const textAnnotations = visionResponse.textAnnotations;
      
      if (!fullTextAnnotation && (!textAnnotations || textAnnotations.length === 0)) {
        console.warn('⚠️ No text detected in image');
        return {
          text: '',
          confidence: 0,
          boundingBoxes: []
        };
      }

      // Get full text
      const text = fullTextAnnotation?.text || textAnnotations?.[0]?.description || '';
      
      // Calculate average confidence from pages
      let confidence = 0.8; // Default
      if (fullTextAnnotation?.pages) {
        let totalConfidence = 0;
        let count = 0;
        
        fullTextAnnotation.pages.forEach((page: any) => {
          page.blocks?.forEach((block: any) => {
            if (block.confidence) {
              totalConfidence += block.confidence;
              count++;
            }
          });
        });
        
        if (count > 0) {
          confidence = totalConfidence / count;
        }
      }

      // Extract bounding boxes
      const boundingBoxes = textAnnotations?.slice(1).map((annotation: any) => ({
        text: annotation.description,
        coordinates: {
          x: annotation.boundingPoly?.vertices?.[0]?.x || 0,
          y: annotation.boundingPoly?.vertices?.[0]?.y || 0,
          width: (annotation.boundingPoly?.vertices?.[2]?.x || 0) - (annotation.boundingPoly?.vertices?.[0]?.x || 0),
          height: (annotation.boundingPoly?.vertices?.[2]?.y || 0) - (annotation.boundingPoly?.vertices?.[0]?.y || 0)
        }
      })) || [];

      console.log('✅ Google Vision OCR completed:', {
        textLength: text.length,
        confidence: Math.round(confidence * 100) + '%',
        boundingBoxes: boundingBoxes.length
      });

      return {
        text,
        confidence,
        boundingBoxes
      };
      
    } catch (error) {
      console.error('❌ Google Vision API error:', error);
      
      // Check if it's a quota error
      if (error instanceof Error && error.message.includes('quota')) {
        throw new Error('Google Vision API quota exceeded. Please check your API limits.');
      }
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('Google Vision API authentication failed. Please check your API key.');
      }
      
      throw new Error('OCR processing failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
        /government of india/i,
        /uidai/i
      ],
      pan: [
        /permanent account number/i,
        /income tax department/i,
        /\b[A-Z]{5}\d{4}[A-Z]{1}\b/, // PAN pattern
        /pan card/i,
        /income tax/i
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
        /electoral/i,
        /epic/i
      ],
      gst: [
        /gstin/i,
        /goods and services tax/i,
        /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/,
        /gst certificate/i
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
    
    console.log('🏷️ Document classified:', {
      type: bestMatch.type,
      confidence: Math.round(confidence * 100) + '%',
      matches: bestMatch.matches
    });
    
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
      voterID: this.extractVoterIDFields.bind(this),
      gst: this.extractGSTFields.bind(this)
    };

    const extractor = extractors[documentType as keyof typeof extractors];
    return extractor ? extractor(text) : this.extractGenericFields(text);
  }

  private extractAadhaarFields(text: string): Record<string, ExtractedField> {
    // Use specialized AadhaarExtractor for better accuracy
    const extracted = AadhaarExtractor.extractFromAadhaarCard(text);
    const fields: Record<string, ExtractedField> = {};

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

    // Fix gender detection
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
    const extracted = PANCardExtractor.extractFromPANCard(text);
    const fields: Record<string, ExtractedField> = {};

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

    const passportMatch = text.match(/\b(P\d{7})\b/);
    if (passportMatch) {
      fields.passportNumber = {
        value: passportMatch[1],
        confidence: 0.95,
        source: 'pattern'
      };
    }

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

  private extractGSTFields(text: string): Record<string, ExtractedField> {
    const fields: Record<string, ExtractedField> = {};

    const gstMatch = text.match(/\b(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1})\b/);
    if (gstMatch) {
      fields.gstin = {
        value: gstMatch[1],
        confidence: 0.95,
        source: 'pattern'
      };
    }

    return fields;
  }

  private extractGenericFields(text: string): Record<string, ExtractedField> {
    const fields: Record<string, ExtractedField> = {};

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const headerBlacklist = ['GOVERNMENT', 'INDIA', 'DEPARTMENT', 'AUTHORITY', 'CARD', 'NUMBER'];
    
    for (const line of lines) {
      if (!/^[A-Za-z .'-]{3,50}$/.test(line)) continue;
      if (!line.includes(' ')) continue;
      
      const upperLine = line.toUpperCase();
      if (headerBlacklist.some(header => upperLine.includes(header))) continue;
      
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
      aadhaar: ['name', 'aadhaarNumber', 'dateOfBirth', 'gender', 'address', 'pincode'],
      pan: ['name', 'panNumber', 'fatherName', 'dateOfBirth'],
      passport: ['name', 'passportNumber', 'dateOfBirth', 'placeOfBirth'],
      drivingLicense: ['name', 'dlNumber', 'dateOfBirth', 'address'],
      voterID: ['name', 'voterID', 'address'],
      gst: ['gstin', 'businessName', 'address'],
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
