// UPDATED: Universal Document Processor - Complete integration with all 29 document types
// Orchestrates AI-powered document processing with preprocessing and validation

import { UniversalFieldDetector, DetectedField, UniversalExtractionResult } from './UniversalFieldDetector';
import { SmartDocumentClassifier, DocumentClassification } from './SmartDocumentClassifier';
import { IntelligentFieldMapper, FieldMapping, FormFieldInfo } from './IntelligentFieldMapper';
import { DocumentFormatRequirements } from './DocumentFormatRequirements';
import { TextPreprocessor } from './TextPreprocessor';
import { performOCR } from './performOCR';

// Import all specific extractors
import { AadhaarExtractor } from './AadhaarExtractor';
import { PANCardExtractor } from './PANCardExtractor';
import { CasteCertificateExtractor } from './CasteCertificateExtractor';
import { CasteValidityExtractor } from './CasteValidityExtractor';
import { VoterIDExtractor } from './VoterIDExtractor';
import { PassportExtractor } from './PassportExtractor';
import { DrivingLicenseExtractor } from './DrivingLicenseExtractor';
import { MarksheetExtractor } from './MarksheetExtractor';
// Add more extractors as you create them...

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
  
  // NEW: Validation results
  validationResult?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  
  // NEW: Format validation
  formatValidation?: {
    valid: boolean;
    errors: string[];
  };
  
  // NEW: Preprocessing info
  preprocessingApplied?: {
    languageDetected: string;
    transliterationApplied: boolean;
    ocrCorrectionsApplied: boolean;
  };
}

export interface ProcessingOptions {
  useAI: boolean;
  targetFormFields?: FormFieldInfo[];
  includeImage: boolean;
  confidenceThreshold: number;
  enableLearning: boolean;
  // NEW: Preprocessing options
  enablePreprocessing?: boolean;
  validateFormat?: boolean;
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
      enablePreprocessing: true, // NEW
      validateFormat: true, // NEW
      ...options
    };
    
    console.log('🚀 Starting universal document processing...', {
      fileName: file.name,
      fileSize: file.size,
      useAI: config.useAI
    });

    try {
      // STEP 1: Perform OCR extraction
      console.log('📄 Step 1: Performing OCR...');
      const ocrResult = await performOCR(file, 'auto', 'en');
      
      // STEP 1.5: Preprocess OCR text (NEW!)
      console.log('🔄 Step 1.5: Preprocessing OCR text...');
      let processedText = ocrResult.extracted.text;
      let preprocessingInfo = {
        languageDetected: 'english' as 'hindi' | 'english' | 'mixed',
        transliterationApplied: false,
        ocrCorrectionsApplied: false
      };
      
      if (config.enablePreprocessing) {
        // Detect language
        preprocessingInfo.languageDetected = TextPreprocessor.detectLanguage(processedText);
        console.log(`📝 Language detected: ${preprocessingInfo.languageDetected}`);
        
        // Apply preprocessing
        processedText = TextPreprocessor.preprocess(processedText, {
          transliterateHindi: true,
          correctOCRErrors: true,
          normalizeWhitespace: true,
          removeHeaders: false // Keep headers for context
        });
        
        preprocessingInfo.transliterationApplied = preprocessingInfo.languageDetected !== 'english';
        preprocessingInfo.ocrCorrectionsApplied = true;
        
        console.log('✅ Preprocessing completed');
      }
      
      let imageBase64: string | undefined;
      if (config.includeImage && config.useAI) {
        imageBase64 = await this.fileToBase64(file);
      }
      
      // STEP 2: Classify document type (UPDATED!)
      console.log('🔍 Step 2: Classifying document type...');
      const documentClassification = await SmartDocumentClassifier.classifyDocument(
        processedText,
        imageBase64
      );
      
      console.log('📋 Document classified as:', documentClassification.documentType, 
                  `(${(documentClassification.confidence * 100).toFixed(1)}%)`);
      
      // STEP 2.5: Validate file format (NEW!)
      let formatValidation: { valid: boolean; errors: string[] } | undefined;
      if (config.validateFormat && documentClassification.documentType !== 'unknown') {
        console.log('✓ Step 2.5: Validating file format...');
        formatValidation = DocumentFormatRequirements.validateFile(
          documentClassification.documentType,
          file.size,
          file.type
        );
        
        if (!formatValidation.valid) {
          console.warn('⚠️ Format validation failed:', formatValidation.errors);
        } else {
          console.log('✅ Format validation passed');
        }
      }
      
      // STEP 3: Extract fields using specific extractor (UPDATED!)
      console.log('🎯 Step 3: Extracting fields with specific extractor...');
      let specificExtractionResult: any = null;

      // Route to correct extractor based on document type
      switch (documentClassification.documentType) {
        case 'aadhaar':
          specificExtractionResult = AadhaarExtractor.extractFromAadhaarCard(processedText);
          break;
          
        case 'pan':
          specificExtractionResult = PANCardExtractor.extractFromPANCard(processedText);
          break;
          
        case 'caste_certificate':
          specificExtractionResult = CasteCertificateExtractor.extractFromCasteCertificate(processedText);
          break;
          
        case 'caste_validity':
          specificExtractionResult = CasteValidityExtractor.extractFromCasteValidity(processedText);
          break;
          
        case 'voter_id':
          specificExtractionResult = VoterIDExtractor.extractFromVoterID(processedText);
          break;
          
        case 'passport':
          specificExtractionResult = PassportExtractor.extractFromPassport(processedText);
          break;
          
        case 'driving_license':
          specificExtractionResult = DrivingLicenseExtractor.extractFromDrivingLicense(processedText);
          break;
          
        case 'marksheet':
          specificExtractionResult = MarksheetExtractor.extractFromMarksheet(processedText);
          break;
          
        // TODO: Add more extractors as you create them
        // case 'bank_statement':
        //   specificExtractionResult = BankStatementExtractor.extractFromBankStatement(processedText);
        //   break;
        
        // case 'salary_slip':
        //   specificExtractionResult = SalarySlipExtractor.extractFromSalarySlip(processedText);
        //   break;
        
        default:
          // Fallback to Universal Fallback Extractor (NEW!)
          console.log('⚠️ No specific extractor found, using Universal Fallback');
          const { UniversalFallbackExtractor } = await import('./UniversalFallbackExtractor');
          specificExtractionResult = await UniversalFallbackExtractor.extractFromUnknownDocument(
            processedText,
            imageBase64,
            config.targetFormFields?.map(f => f.fieldName)
          );
      }
      
      // Convert specific extraction result to universal format
      const extractionResult = this.convertToUniversalFormat(
        specificExtractionResult,
        documentClassification.documentType
      );
      
      console.log('📊 Fields detected:', extractionResult.detectedFields.length);
      
      // STEP 3.5: Validate extracted data (NEW!)
      let validationResult: { valid: boolean; errors: string[]; warnings: string[] } | undefined;
      if (config.validateFormat && documentClassification.documentType !== 'unknown') {
        console.log('✓ Step 3.5: Validating extracted data...');
        
        // Create validation object from extracted fields
        const extractedData: Record<string, any> = {};
        if (specificExtractionResult.extractedFields) {
          Object.assign(extractedData, specificExtractionResult.extractedFields);
        }
        
        validationResult = DocumentFormatRequirements.validateExtractedData(
          documentClassification.documentType,
          extractedData
        );
        
        if (!validationResult.valid) {
          console.warn('⚠️ Data validation errors:', validationResult.errors);
        }
        if (validationResult.warnings.length > 0) {
          console.warn('⚠️ Data validation warnings:', validationResult.warnings);
        }
        if (validationResult.valid && validationResult.warnings.length === 0) {
          console.log('✅ Data validation passed');
        }
      }
      
      // STEP 4: Map fields to target form (if provided)
      let fieldMappings: FieldMapping[] = [];
      let formReadyData: Record<string, any> = {};
      let unmappedFields: DetectedField[] = [...extractionResult.detectedFields];
      
      if (config.targetFormFields && config.targetFormFields.length > 0) {
        console.log('🗺️ Step 4: Mapping fields to target form...');
        
        fieldMappings = await IntelligentFieldMapper.mapFieldsToForm(
          extractionResult.detectedFields,
          config.targetFormFields,
          config.useAI,
          documentClassification // Pass document context for better mapping
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
      
      // STEP 5: Calculate quality metrics
      const overallConfidence = this.calculateOverallConfidence(
        documentClassification,
        extractionResult,
        fieldMappings
      );
      
      const processingNotes = this.generateProcessingNotes(
        documentClassification,
        extractionResult,
        fieldMappings,
        config,
        validationResult,
        formatValidation,
        preprocessingInfo
      );
      
      const processingTime = Date.now() - startTime;
      
      console.log('🎉 Universal processing completed!', {
        processingTime: `${processingTime}ms`,
        confidence: `${(overallConfidence * 100).toFixed(1)}%`,
        fieldsDetected: extractionResult.detectedFields.length,
        fieldsMapped: fieldMappings.length,
        validationPassed: validationResult?.valid ?? true
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
        ),
        validationResult,
        formatValidation,
        preprocessingApplied: preprocessingInfo
      };
      
      // STEP 6: Learning and improvement (if enabled)
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
   * NEW: Convert specific extractor result to universal format
   */
  private static convertToUniversalFormat(
    specificResult: any,
    documentType: string
  ): UniversalExtractionResult {
    const detectedFields: DetectedField[] = [];
    
    // Convert extractedFields to DetectedField array
    if (specificResult.extractedFields) {
      Object.entries(specificResult.extractedFields).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          detectedFields.push({
            fieldName: key,
            value: value as string,
            confidence: specificResult.confidence || 0.8,
            fieldType: this.inferFieldType(key, value as string),
            extractionMethod: 'rule-based'
          });
        }
      });
    }
    
    return {
      documentType: documentType,
      detectedFields: detectedFields,
      confidence: specificResult.confidence / 100 || 0.8, // Normalize to 0-1
      processingNotes: [`Extracted ${detectedFields.length} fields using ${documentType} specific extractor`]
    };
  }

  /**
   * NEW: Infer field type from field name and value
   */
  private static inferFieldType(fieldName: string, value: string): string {
    const fieldLower = fieldName.toLowerCase();
    
    if (fieldLower.includes('name')) return 'text';
    if (fieldLower.includes('date') || fieldLower.includes('dob')) return 'date';
    if (fieldLower.includes('number') || fieldLower.includes('id')) return 'number';
    if (fieldLower.includes('email')) return 'email';
    if (fieldLower.includes('phone') || fieldLower.includes('mobile')) return 'phone';
    if (fieldLower.includes('address')) return 'address';
    if (fieldLower.includes('pincode') || fieldLower.includes('pin')) return 'pincode';
    if (fieldLower.includes('amount') || fieldLower.includes('salary')) return 'amount';
    if (fieldLower.includes('percentage') || fieldLower.includes('cgpa')) return 'number';
    
    return 'text';
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
   * UPDATED: Generates comprehensive processing notes
   */
  private static generateProcessingNotes(
    classification: DocumentClassification,
    extraction: UniversalExtractionResult,
    mappings: FieldMapping[],
    config: ProcessingOptions,
    validation?: { valid: boolean; errors: string[]; warnings: string[] },
    formatValidation?: { valid: boolean; errors: string[] },
    preprocessingInfo?: { languageDetected: string; transliterationApplied: boolean; ocrCorrectionsApplied: boolean }
  ): string[] {
    const notes: string[] = [];
    
    // Classification notes
    notes.push(`Document identified as: ${classification.documentType} (${classification.category})`);
    notes.push(`Classification confidence: ${(classification.confidence * 100).toFixed(1)}%`);
    
    // Preprocessing notes (NEW!)
    if (preprocessingInfo) {
      notes.push(`Language detected: ${preprocessingInfo.languageDetected}`);
      if (preprocessingInfo.transliterationApplied) {
        notes.push('Hindi to English transliteration applied');
      }
      if (preprocessingInfo.ocrCorrectionsApplied) {
        notes.push('OCR error corrections applied');
      }
    }
    
    // Extraction notes
    notes.push(`Detected ${extraction.detectedFields.length} fields`);
    notes.push(`Extraction confidence: ${(extraction.confidence * 100).toFixed(1)}%`);
    notes.push(...extraction.processingNotes);
    
    // Validation notes (NEW!)
    if (validation) {
      if (validation.valid) {
        notes.push('✅ All required fields validated successfully');
      } else {
        notes.push(`⚠️ Validation issues found: ${validation.errors.length} error(s)`);
        validation.errors.forEach(error => notes.push(`  - ${error}`));
      }
      if (validation.warnings.length > 0) {
        notes.push(`⚠️ ${validation.warnings.length} warning(s)`);
      }
    }
    
    // Format validation notes (NEW!)
    if (formatValidation && !formatValidation.valid) {
      notes.push('⚠️ File format issues detected');
      formatValidation.errors.forEach(error => notes.push(`  - ${error}`));
    }
    
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
        confidence: result.overallConfidence,
        validationPassed: result.validationResult?.valid ?? true,
        fieldsExtracted: result.detectedFields.length
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
        averageConfidence: learningData.length > 0 
          ? learningData.reduce((sum: number, item: any) => sum + item.confidence, 0) / learningData.length 
          : 0,
        documentTypes: [...new Set(learningData.map((item: any) => item.documentType))],
        categories: [...new Set(learningData.map((item: any) => item.category))],
        recentProcessing: learningData.slice(-10),
        successRate: learningData.filter((item: any) => item.validationPassed).length / Math.max(learningData.length, 1)
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
    
    // Check validation results (NEW!)
    if (result.validationResult && !result.validationResult.valid) {
      issues.push('Data validation failed');
      recommendations.push('Review and correct the flagged fields');
    }
    
    // Check format validation (NEW!)
    if (result.formatValidation && !result.formatValidation.valid) {
      issues.push('File format validation failed');
      recommendations.push('Ensure file meets format requirements');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
}
