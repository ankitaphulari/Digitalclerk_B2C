// Enhanced Document AI OCR Service with Universal Processing
// Now supports any document type with AI-powered field detection

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
      detectedLanguage: 'en', // Could be enhanced to detect actual language
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
      // Use existing legacy extraction
      const legacyResult = intelligentExtraction(
        await this.fileToText(file),
        config.hintDocumentType === 'auto' ? 'auto' : config.hintDocumentType
      );
      
      return {
        text: await this.fileToText(file),
        confidence: legacyResult.confidence,
        extractedFields: legacyResult.extractedFields,
        processingMode: 'legacy',
        overallConfidence: legacyResult.confidence,
        processingNotes: ['Used legacy processing system']
      };
    } catch (error) {
      console.error('Legacy processing failed:', error);
      throw error;
    }
  }

  /**
   * Converts file to text (placeholder - would use actual OCR)
   */
  private static async fileToText(file: File): Promise<string> {
    // This is a placeholder - in real implementation would use OCR service
    return `OCR text from ${file.name}`;
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
}