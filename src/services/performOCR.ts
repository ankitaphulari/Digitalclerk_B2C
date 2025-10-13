// Enhanced OCR with Universal AI Processing
import { EnhancedDocumentAIOCRService } from './EnhancedDocumentAIOCRService';

export interface PerformOCRResult {
  // Legacy properties for backward compatibility
  text: string;
  confidence: number;
  
  // New structure
  extracted: {
    text: string;
    confidence: number;
    [key: string]: any;
  };
  documentType?: string;
  detectedLanguage?: string;
  qualityScore?: number;
}

/**
 * Enhanced OCR function with Universal AI processing capabilities
 * Now supports any document type with intelligent field extraction
 */
export async function performOCR(
  file: File,
  hintDocType: string = 'auto',
  targetLanguage: string = 'en'
): Promise<PerformOCRResult> {
  console.log('🔍 Starting enhanced OCR with Universal AI...', {
    fileName: file.name,
    hintDocType,
    targetLanguage
  });

  try {
    // Use the enhanced service with universal processing
    const result = await EnhancedDocumentAIOCRService.processDocument(file, {
      language: targetLanguage,
      hintDocumentType: hintDocType,
      useUniversalProcessor: true,
      useAI: true,
      includeImage: true,
      confidenceThreshold: 0.6,
      enableLearning: true
    });

    // Convert to legacy format for backward compatibility
    const performOCRResult: PerformOCRResult = {
      // Legacy properties
      text: result.text,
      confidence: result.confidence,
      
      // New structure
      extracted: {
        text: result.text,
        confidence: result.confidence,
        
        // Include all extracted fields for enhanced functionality
        ...result.extractedFields,
        
        // Add universal processing metadata
        documentType: result.universalResult?.documentClassification.documentType,
        category: result.universalResult?.documentClassification.category,
        detectedFields: result.universalResult?.detectedFields,
        fieldMappings: result.fieldMappings,
        processingNotes: result.processingNotes
      },
      documentType: result.universalResult?.documentClassification.documentType,
      detectedLanguage: result.detectedLanguage,
      qualityScore: result.qualityScore
    };

    console.log('✅ Enhanced OCR completed successfully:', {
      documentType: performOCRResult.documentType,
      confidence: result.overallConfidence,
      fieldsExtracted: Object.keys(result.extractedFields).length
    });

    return performOCRResult;

  } catch (error) {
    console.error('❌ Enhanced OCR failed:', error);
    
    // Return error result in expected format
    return {
      // Legacy properties
      text: '',
      confidence: 0.1,
      
      // New structure
      extracted: {
        text: '',
        confidence: 0.1,
        error: error instanceof Error ? error.message : 'OCR processing failed'
      },
      documentType: 'unknown',
      detectedLanguage: targetLanguage,
      qualityScore: 0.1
    };
  }
}
