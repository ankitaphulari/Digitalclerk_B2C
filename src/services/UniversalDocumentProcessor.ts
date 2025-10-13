// Universal Document Processor - Orchestrates the complete AI-powered document processing workflow
// Handles any document type with intelligent field extraction and form mapping

import { UniversalFieldDetector, DetectedField, UniversalExtractionResult } from './UniversalFieldDetector';
import { SmartDocumentClassifier, DocumentClassification } from './SmartDocumentClassifier';
import { IntelligentFieldMapper, FieldMapping, FormFieldInfo } from './IntelligentFieldMapper';
import { performOCR } from './performOCR';

export interface UniversalProcessingResult {
  // Document analysis
  documentClassification: DocumentClassification;
  extractionResult: UniversalExtractionResult;
  
  // Field processing
  detectedFields: DetectedField[];
  fieldMappings: FieldMapping[];
  
  // Quality metrics
  overallConfidence: number;
  processingNotes: string[];
  
  // Form integration
  formReadyData: Record<string, any>;
  unmappedFields: DetectedField[];
  
  // Processing metadata
  processingTime: number;
  aiUsed: boolean;
  fallbackUsed: boolean;
}

export interface ProcessingOptions {
  useAI: boolean;
  targetFormFields?: FormFieldInfo[];
  includeImage: boolean;
  confidenceThreshold: number;
  enableLearning: boolean;
}

export class UniversalDocumentProcessor {
  
  /**
   * Processes any document with full AI-powered analysis
   */
  static async processDocument(
    file: File, 
    options: Partial<ProcessingOptions> = {}
  ): Promise<UniversalProcessingResult> {
    const startTime = Date.now();
    
    const config: ProcessingOptions = {
      useAI: true,
      includeImage: true,
      confidenceThreshold: 0.6,
      enableLearning: true,
      ...options
    };
    
    console.log('🚀 Starting universal document processing...', {
      fileName: file.name,
      fileSize: file.size,
      useAI: config.useAI
    });

    try {
      // Step 1: Perform OCR extraction
      console.log('📄 Step 1: Performing OCR...');
      const ocrResult = await performOCR(file, 'auto', 'en');
      
      let imageBase64: string | undefined;
      if (config.includeImage && config.useAI) {
        imageBase64 = await this.fileToBase64(file);
      }
      
      // Step 2: Classify document type
      console.log('🔍 Step 2: Classifying document type...');
      const documentClassification = await SmartDocumentClassifier.classifyDocument(
        ocrResult.extracted.text,
        imageBase64
      );
      
      console.log('📋 Document classified as:', documentClassification);
      
      // Step 3: Extract fields using AI
      console.log('🎯 Step 3: Detecting fields universally...');
      const extractionResult = await UniversalFieldDetector.detectFieldsWithAI(
        ocrResult.extracted.text,
        imageBase64
      );
      
      console.log('📊 Fields detected:', extractionResult.detectedFields.length);
      
      // Step 4: Map fields to target form (if provided)
      let fieldMappings: FieldMapping[] = [];
      let formReadyData: Record<string, any> = {};
      let unmappedFields: DetectedField[] = [...extractionResult.detectedFields];
      
      if (config.targetFormFields && config.targetFormFields.length > 0) {
        console.log('🗺️ Step 4: Mapping fields to target form...');
        
        fieldMappings = await IntelligentFieldMapper.mapFieldsToForm(
          extractionResult.detectedFields,
          config.targetFormFields,
          config.useAI
        );
        
        // Create form-ready data
        formReadyData = this.createFormReadyData(
          extractionResult.detectedFields,
          fieldMappings,
          config.confidenceThreshold
        );
        
        // Identify unmapped fields
        const mappedFieldNames = fieldMappings.map(m => m.sourceField);
        unmappedFields = extractionResult.detectedFields.filter(
          field => !mappedFieldNames.includes(field.fieldName)
        );
        
        console.log('✅ Mapped fields:', fieldMappings.length);
        console.log('❓ Unmapped fields:', unmappedFields.length);
      }
      
      // Step 5: Calculate quality metrics
      const overallConfidence = this.calculateOverallConfidence(
        documentClassification,
        extractionResult,
        fieldMappings
      );
      
      const processingNotes = this.generateProcessingNotes(
        documentClassification,
        extractionResult,
        fieldMappings,
        config
      );
      
      const processingTime = Date.now() - startTime;
      
      console.log('🎉 Universal processing completed!', {
        processingTime: `${processingTime}ms`,
        confidence: overallConfidence,
        fieldsDetected: extractionResult.detectedFields.length,
        fieldsMapped: fieldMappings.length
      });
      
      const result: UniversalProcessingResult = {
        documentClassification,
        extractionResult,
        detectedFields: extractionResult.detectedFields,
        fieldMappings,
        overallConfidence,
        processingNotes,
        formReadyData,
        unmappedFields,
        processingTime,
        aiUsed: config.useAI,
        fallbackUsed: extractionResult.processingNotes.some(note => 
          note.includes('fallback') || note.includes('rule-based')
        )
      };
      
      // Step 6: Learning and improvement (if enabled)
      if (config.enableLearning) {
        this.learnFromProcessing(result);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Universal document processing failed:', error);
      
      // Return minimal fallback result
      return {
        documentClassification: {
          documentType: 'unknown',
          category: 'other',
          confidence: 0.1,
          characteristics: ['Processing failed'],
          suggestedForms: []
        },
        extractionResult: {
          documentType: 'unknown',
          detectedFields: [],
          confidence: 0.1,
          processingNotes: [`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
        },
        detectedFields: [],
        fieldMappings: [],
        overallConfidence: 0.1,
        processingNotes: [`Critical error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        formReadyData: {},
        unmappedFields: [],
        processingTime: Date.now() - startTime,
        aiUsed: config.useAI,
        fallbackUsed: true
      };
    }
  }

  /**
   * Processes multiple documents in batch
   */
  static async processBatchDocuments(
    files: File[],
    options: Partial<ProcessingOptions> = {}
  ): Promise<UniversalProcessingResult[]> {
    console.log(`📚 Processing ${files.length} documents in batch...`);
    
    const results = await Promise.all(
      files.map(file => this.processDocument(file, options))
    );
    
    console.log('✅ Batch processing completed');
    return results;
  }

  /**
   * Converts file to base64 for AI vision processing
   */
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Creates form-ready data from detected fields and mappings
   */
  private static createFormReadyData(
    detectedFields: DetectedField[],
    fieldMappings: FieldMapping[],
    confidenceThreshold: number
  ): Record<string, any> {
    const formData: Record<string, any> = {};
    
    fieldMappings.forEach(mapping => {
      if (mapping.confidence >= confidenceThreshold) {
        const sourceField = detectedFields.find(f => f.fieldName === mapping.sourceField);
        if (sourceField) {
          const transformedValue = IntelligentFieldMapper.transformValue(mapping, sourceField.value);
          formData[mapping.targetField] = transformedValue;
        }
      }
    });
    
    return formData;
  }

  /**
   * Calculates overall processing confidence
   */
  private static calculateOverallConfidence(
    classification: DocumentClassification,
    extraction: UniversalExtractionResult,
    mappings: FieldMapping[]
  ): number {
    const weights = {
      classification: 0.3,
      extraction: 0.4,
      mapping: 0.3
    };
    
    const classificationScore = classification.confidence;
    const extractionScore = extraction.confidence;
    const mappingScore = mappings.length > 0 
      ? mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length
      : 0.5; // Neutral score when no mappings
    
    return (
      classificationScore * weights.classification +
      extractionScore * weights.extraction +
      mappingScore * weights.mapping
    );
  }

  /**
   * Generates comprehensive processing notes
   */
  private static generateProcessingNotes(
    classification: DocumentClassification,
    extraction: UniversalExtractionResult,
    mappings: FieldMapping[],
    config: ProcessingOptions
  ): string[] {
    const notes: string[] = [];
    
    // Classification notes
    notes.push(`Document identified as: ${classification.documentType} (${classification.category})`);
    notes.push(`Classification confidence: ${(classification.confidence * 100).toFixed(1)}%`);
    
    // Extraction notes
    notes.push(`Detected ${extraction.detectedFields.length} fields`);
    notes.push(`Extraction confidence: ${(extraction.confidence * 100).toFixed(1)}%`);
    notes.push(...extraction.processingNotes);
    
    // Mapping notes
    if (mappings.length > 0) {
      notes.push(`Mapped ${mappings.length} fields to target form`);
      const highConfidenceMappings = mappings.filter(m => m.confidence > 0.8).length;
      notes.push(`${highConfidenceMappings} high-confidence mappings`);
    }
    
    // AI usage notes
    if (config.useAI) {
      notes.push('AI-powered processing enabled');
    } else {
      notes.push('Rule-based processing only');
    }
    
    return notes;
  }

  /**
   * Learning system - stores successful patterns for future improvement
   */
  private static learnFromProcessing(result: UniversalProcessingResult): void {
    try {
      // Store successful patterns in localStorage for now
      // In a real system, this would be stored in a database
      const learningData = {
        documentType: result.documentClassification.documentType,
        category: result.documentClassification.category,
        successfulMappings: result.fieldMappings.filter(m => m.confidence > 0.8),
        timestamp: new Date().toISOString(),
        confidence: result.overallConfidence
      };
      
      const existingData = JSON.parse(localStorage.getItem('documentProcessingLearning') || '[]');
      existingData.push(learningData);
      
      // Keep only last 100 entries
      if (existingData.length > 100) {
        existingData.splice(0, existingData.length - 100);
      }
      
      localStorage.setItem('documentProcessingLearning', JSON.stringify(existingData));
      
      console.log('📚 Learning data stored for future improvements');
    } catch (error) {
      console.warn('Learning system error:', error);
    }
  }

  /**
   * Gets processing statistics and insights
   */
  static getProcessingInsights(): any {
    try {
      const learningData = JSON.parse(localStorage.getItem('documentProcessingLearning') || '[]');
      
      const stats = {
        totalProcessed: learningData.length,
        averageConfidence: learningData.reduce((sum: number, item: any) => sum + item.confidence, 0) / learningData.length,
        documentTypes: [...new Set(learningData.map((item: any) => item.documentType))],
        categories: [...new Set(learningData.map((item: any) => item.category))],
        recentProcessing: learningData.slice(-10)
      };
      
      return stats;
    } catch (error) {
      console.warn('Failed to get processing insights:', error);
      return null;
    }
  }

  /**
   * Validates processing result quality
   */
  static validateProcessingQuality(result: UniversalProcessingResult): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check overall confidence
    if (result.overallConfidence < 0.5) {
      issues.push('Low overall processing confidence');
      recommendations.push('Consider manual review of extracted data');
    }
    
    // Check field detection
    if (result.detectedFields.length === 0) {
      issues.push('No fields detected');
      recommendations.push('Verify document quality and try re-uploading');
    }
    
    // Check mappings
    if (result.fieldMappings.length === 0 && result.detectedFields.length > 0) {
      issues.push('Fields detected but no mappings created');
      recommendations.push('Verify target form fields are properly defined');
    }
    
    // Check for fallback usage
    if (result.fallbackUsed) {
      issues.push('AI processing failed, used fallback');
      recommendations.push('Check AI service availability and try again');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
}
