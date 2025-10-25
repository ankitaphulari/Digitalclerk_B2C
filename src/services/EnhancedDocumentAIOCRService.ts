// Enhanced Document AI OCR Service with Google Cloud Vision API
// Complete implementation with real OCR

import vision from '@google-cloud/vision';
import { UniversalDocumentProcessor, UniversalProcessingResult, ProcessingOptions } from './UniversalDocumentProcessor';
import { intelligentExtraction } from './IntelligentExtraction';

export interface DocumentAIOCRResult {
  // Legacy fields for backward compatibility
  text: string;
  confidence: number;
  detectedLanguage?: string;
  qualityScore?: number;
  
  // Enhanced universal processing results
  universalResult?: UniversalProcessingResult;
  processingMode: 'legacy' | 'universal';
  
  // Structured extracted fields
  extractedFields: Record<string, any>;
  fieldMappings?: any[];
  
  // Quality and confidence metrics
  overallConfidence: number;
  processingNotes: string[];
}

export interface ProcessingConfig {
  // OCR settings
  language: string;
  hintDocumentType: string;
  
  // Universal processing settings
  useUniversalProcessor: boolean;
  useAI: boolean;
  includeImage: boolean;
  confidenceThreshold: number;
  
  // Form integration
  targetFormFields?: any[];
  enableLearning: boolean;
}

export class EnhancedDocumentAIOCRService {
  
  // Google Cloud Vision API client with your API key
  private static visionClient = new vision.ImageAnnotatorClient({
    credentials: {
      type: 'service_account',
      project_id: 'digitalclerk',
      private_key_id: 'key-id',
      private_key: '-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n',
      client_email: 'vision-api@digitalclerk.iam.gserviceaccount.com',
      client_id: 'client-id',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/...'
    },
    // Alternative: Use API Key directly (simpler but less secure)
    apiKey: 'AIzaSyDMqFu3DCMFo-q1_BCxhlzXJQP-OQRQxXM'
  });
  
  /**
   * Enhanced document processing with universal AI capabilities
   */
  static async processDocument(
    file: File, 
    config: Partial<ProcessingConfig> = {}
  ): Promise<DocumentAIOCRResult> {
    const processingConfig: ProcessingConfig = {
      language: 'en',
      hintDocumentType: 'auto',
      useUniversalProcessor: true,
      useAI: true,
      includeImage: true,
      confidenceThreshold: 0.6,
      enableLearning: true,
      ...config
    };
    
    console.log('📄 Starting enhanced document processing...', {
      fileName: file.name,
      useUniversal: processingConfig.useUniversalProcessor,
      useAI: processingConfig.useAI
    });

    try {
      // Use Universal Processor for comprehensive AI-powered processing
      if (processingConfig.useUniversalProcessor) {
        return await this.processWithUniversalProcessor(file, processingConfig);
      }
      
      // Fallback to legacy processing
      return await this.processWithLegacyProcessor(file, processingConfig);
      
    } catch (error) {
      console.error('Document processing failed:', error);
      
      // Return minimal error result
      return {
        text: '',
        confidence: 0.1,
        extractedFields: {},
        processingMode: 'legacy',
        overallConfidence: 0.1,
        processingNotes: [`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Process document using Universal AI-powered processor
   */
  private static async processWithUniversalProcessor(
    file: File, 
    config: ProcessingConfig
  ): Promise<DocumentAIOCRResult> {
    console.log('🚀 Using Universal AI Processor...');
    
    const options: Partial<ProcessingOptions> = {
      useAI: config.useAI,
      targetFormFields: config.targetFormFields,
      includeImage: config.includeImage,
      confidenceThreshold: config.confidenceThreshold,
      enableLearning: config.enableLearning
    };
    
    const universalResult = await UniversalDocumentProcessor.processDocument(file, options);
    
    // Convert universal result to legacy format for backward compatibility
    const extractedFields: Record<string, any> = {};
    universalResult.detectedFields.forEach(field => {
      extractedFields[field.fieldName] = field.value;
    });
    
    // Add form-ready data if available
    Object.assign(extractedFields, universalResult.formReadyData);
    
    const result: DocumentAIOCRResult = {
      // Legacy compatibility
      text: this.reconstructTextFromFields(universalResult.detectedFields),
      confidence: universalResult.overallConfidence,
      detectedLanguage: 'en',
      qualityScore: universalResult.overallConfidence,
      
      // Enhanced universal results
      universalResult,
      processingMode: 'universal',
      
      // Extracted data
      extractedFields,
      fieldMappings: universalResult.fieldMappings,
      
      // Quality metrics
      overallConfidence: universalResult.overallConfidence,
      processingNotes: universalResult.processingNotes
    };
    
    console.log('✅ Universal processing completed:', {
      documentType: universalResult.documentClassification.documentType,
      fieldsDetected: universalResult.detectedFields.length,
      confidence: universalResult.overallConfidence
    });
    
    return result;
  }

  /**
   * Fallback to legacy processing for compatibility
   */
  private static async processWithLegacyProcessor(
    file: File, 
    config: ProcessingConfig
  ): Promise<DocumentAIOCRResult> {
    console.log('📝 Using Legacy Processor...');
    
    try {
      // Use Google Vision OCR to extract text
      const ocrResult = await this.performAdvancedOCR(file);
      
      // Use existing legacy extraction
      const legacyResult = intelligentExtraction(
        ocrResult.text,
        config.hintDocumentType === 'auto' ? 'auto' : config.hintDocumentType
      );
      
      return {
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        detectedLanguage: ocrResult.language,
        qualityScore: ocrResult.confidence,
        extractedFields: legacyResult.extractedFields,
        processingMode: 'legacy',
        overallConfidence: legacyResult.confidence,
        processingNotes: ['Used legacy processing with Google Vision OCR']
      };
    } catch (error) {
      console.error('Legacy processing failed:', error);
      throw error;
    }
  }

  /**
   * REAL OCR using Google Cloud Vision API
   */
  private static async fileToText(file: File): Promise<string> {
    try {
      console.log('🔍 Performing OCR with Google Vision API...');
      
      // Convert File to Buffer
      const buffer = await file.arrayBuffer();
      const imageBuffer = Buffer.from(buffer);
      
      // Perform text detection
      const [result] = await this.visionClient.textDetection(imageBuffer);
      const detections = result.textAnnotations;
      
      if (!detections || detections.length === 0) {
        console.warn('⚠️ No text detected in image');
        return '';
      }
      
      // First annotation contains all detected text
      const fullText = detections[0].description || '';
      
      console.log('✅ OCR completed:', {
        textLength: fullText.length,
        linesDetected: fullText.split('\n').length
      });
      
      return fullText;
      
    } catch (error) {
      console.error('❌ Google Vision OCR failed:', error);
      throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhanced OCR with document type detection and confidence scores
   */
  private static async performAdvancedOCR(file: File): Promise<{
    text: string;
    confidence: number;
    language: string;
  }> {
    try {
      console.log('🔍 Performing advanced OCR...');
      
      const buffer = await file.arrayBuffer();
      const imageBuffer = Buffer.from(buffer);
      
      // Use document text detection for better accuracy on documents
      const [result] = await this.visionClient.documentTextDetection(imageBuffer);
      
      if (!result.fullTextAnnotation) {
        console.warn('⚠️ No text annotation found');
        return {
          text: '',
          confidence: 0,
          language: 'en'
        };
      }
      
      const fullText = result.fullTextAnnotation.text || '';
      
      // Calculate average confidence
      const pages = result.fullTextAnnotation.pages || [];
      let totalConfidence = 0;
      let confidenceCount = 0;
      
      pages.forEach(page => {
        page.blocks?.forEach(block => {
          if (block.confidence) {
            totalConfidence += block.confidence;
            confidenceCount++;
          }
        });
      });
      
      const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0.5;
      
      // Detect language
      const detectedLanguage = pages[0]?.property?.detectedLanguages?.[0]?.languageCode || 'en';
      
      console.log('✅ Advanced OCR completed:', {
        textLength: fullText.length,
        confidence: Math.round(avgConfidence * 100) + '%',
        language: detectedLanguage
      });
      
      return {
        text: fullText,
        confidence: avgConfidence,
        language: detectedLanguage
      };
      
    } catch (error) {
      console.error('❌ Advanced OCR failed:', error);
      
      // Fallback to simple text detection
      try {
        const text = await this.fileToText(file);
        return {
          text,
          confidence: 0.7,
          language: 'en'
        };
      } catch (fallbackError) {
        throw error;
      }
    }
  }

  /**
   * Reconstructs text from detected fields for legacy compatibility
   */
  private static reconstructTextFromFields(detectedFields: any[]): string {
    return detectedFields
      .map(field => `${field.label || field.fieldName}: ${field.value}`)
      .join('\n');
  }

  /**
   * Validates document processing quality
   */
  static validateProcessingResult(result: DocumentAIOCRResult): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check confidence levels
    if (result.overallConfidence < 0.5) {
      issues.push('Low processing confidence');
      recommendations.push('Consider re-uploading with better image quality');
    }
    
    // Check extracted fields
    if (Object.keys(result.extractedFields).length === 0) {
      issues.push('No fields extracted');
      recommendations.push('Verify document contains readable text');
    }
    
    // Check for errors in processing
    const hasErrors = result.processingNotes.some(note => 
      note.toLowerCase().includes('error') || 
      note.toLowerCase().includes('failed')
    );
    
    if (hasErrors) {
      issues.push('Processing errors detected');
      recommendations.push('Review processing notes for details');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Gets processing insights and statistics
   */
  static getProcessingInsights(): any {
    return UniversalDocumentProcessor.getProcessingInsights();
  }

  /**
   * Batch process multiple documents
   */
  static async processBatchDocuments(
    files: File[],
    config: Partial<ProcessingConfig> = {}
  ): Promise<DocumentAIOCRResult[]> {
    console.log(`📚 Batch processing ${files.length} documents...`);
    
    if (config.useUniversalProcessor !== false) {
      // Use universal processor for batch processing
      const universalResults = await UniversalDocumentProcessor.processBatchDocuments(files, {
        useAI: config.useAI,
        targetFormFields: config.targetFormFields,
        includeImage: config.includeImage,
        confidenceThreshold: config.confidenceThreshold,
        enableLearning: config.enableLearning
      });
      
      return universalResults.map(universalResult => ({
        text: this.reconstructTextFromFields(universalResult.detectedFields),
        confidence: universalResult.overallConfidence,
        extractedFields: universalResult.formReadyData,
        processingMode: 'universal' as const,
        universalResult,
        fieldMappings: universalResult.fieldMappings,
        overallConfidence: universalResult.overallConfidence,
        processingNotes: universalResult.processingNotes
      }));
    }
    
    // Fallback to individual legacy processing
    return Promise.all(
      files.map(file => this.processDocument(file, { ...config, useUniversalProcessor: false }))
    );
  }

  /**
   * Enhanced field detection for any document type
   */
  static async detectDocumentFields(
    file: File,
    useAI: boolean = true
  ): Promise<any[]> {
    const result = await this.processDocument(file, {
      useUniversalProcessor: true,
      useAI,
      includeImage: true
    });
    
    return result.universalResult?.detectedFields || [];
  }

  /**
   * Smart form field mapping
   */
  static async mapFieldsToForm(
    file: File,
    formFields: any[],
    useAI: boolean = true
  ): Promise<any> {
    const result = await this.processDocument(file, {
      useUniversalProcessor: true,
      useAI,
      targetFormFields: formFields,
      includeImage: true
    });
    
    return {
      mappings: result.fieldMappings || [],
      formData: result.universalResult?.formReadyData || {},
      confidence: result.overallConfidence
    };
  }

  /**
   * Extract text from specific image (direct OCR)
   */
  static async extractTextFromImage(imageData: string | Buffer): Promise<string> {
    try {
      const [result] = await this.visionClient.textDetection(imageData);
      return result.textAnnotations?.[0]?.description || '';
    } catch (error) {
      console.error('Text extraction failed:', error);
      return '';
    }
  }

  /**
   * Detect document type using Google Vision
   */
  static async detectDocumentType(file: File): Promise<string> {
    try {
      const text = await this.fileToText(file);
      
      // Simple pattern matching for common Indian documents
      if (/PAN|PERMANENT ACCOUNT NUMBER/i.test(text)) return 'PAN_CARD';
      if (/AADHAAR|आधार/i.test(text)) return 'AADHAAR';
      if (/PASSPORT/i.test(text)) return 'PASSPORT';
      if (/DRIVING LICENCE|DL/i.test(text)) return 'DRIVING_LICENSE';
      if (/GSTIN|GST/i.test(text)) return 'GST_CERTIFICATE';
      if (/VOTER|ELECTION/i.test(text)) return 'VOTER_ID';
      
      return 'UNKNOWN';
    } catch (error) {
      console.error('Document type detection failed:', error);
      return 'UNKNOWN';
    }
  }
}
