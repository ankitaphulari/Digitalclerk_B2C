// Local OCR Service using Google Cloud Vision API directly
// SECURE VERSION - Uses environment variables

import { GOOGLE_VISION_CONFIG } from '../config/vision-config';
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
  
  // Load API key from secure configuration
  private static readonly GOOGLE_VISION_API_KEY = GOOGLE_VISION_CONFIG.apiKey;
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
   * Use Google Vision API directly with API key from environment
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

  // [Rest of the methods remain the same - classifyDocument, extractFieldsLocally, etc.]
  // Copy the remaining methods from your original file...

  private classifyDocument(text: string): DocumentClassification {
    // ... your existing implementation
  }

  private extractFieldsLocally(text: string, documentType: string): Record<string, ExtractedField> {
    // ... your existing implementation
  }

  private extractAadhaarFields(text: string): Record<string, ExtractedField> {
    // ... your existing implementation
  }

  private extractPANFields(text: string): Record<string, ExtractedField> {
    // ... your existing implementation
  }

  private extractPassportFields(text: string): Record<string, ExtractedField> {
    // ... your existing implementation
  }

  private extractDrivingLicenseFields(text: string): Record<string, ExtractedField> {
    // ... your existing implementation
  }

  private extractVoterIDFields(text: string): Record<string, ExtractedField> {
    // ... your existing implementation
  }

  private extractGSTFields(text: string): Record<string, ExtractedField> {
    // ... your existing implementation
  }

  private extractGenericFields(text: string): Record<string, ExtractedField> {
    // ... your existing implementation
  }

  private getExpectedFields(documentType: string): string[] {
    // ... your existing implementation
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
