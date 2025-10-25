// Enhanced OCR with Google Cloud Vision API
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
 * Enhanced OCR function with Google Cloud Vision API
 * Now supports any document type with intelligent field extraction
 */
export async function performOCR(
  file: File,
  hintDocType: string = 'auto',
  targetLanguage: string = 'en'
): Promise<PerformOCRResult> {
  console.log('🔍 Starting Google Vision OCR...', {
    fileName: file.name,
    fileSize: `${(file.size / 1024).toFixed(2)} KB`,
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

    console.log('✅ Google Vision OCR completed successfully:', {
      documentType: performOCRResult.documentType,
      confidence: `${Math.round(result.overallConfidence * 100)}%`,
      fieldsExtracted: Object.keys(result.extractedFields).length,
      textLength: result.text.length
    });

    return performOCRResult;
    
  } catch (error) {
    console.error('❌ Google Vision OCR failed:', error);
    
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

/**
 * Quick OCR for simple text extraction (no processing)
 */
export async function quickOCR(file: File): Promise<string> {
  try {
    return await EnhancedDocumentAIOCRService.extractTextFromImage(
      Buffer.from(await file.arrayBuffer())
    );
  } catch (error) {
    console.error('Quick OCR failed:', error);
    return '';
  }
}

/**
 * Batch OCR processing for multiple documents
 */
export async function batchOCR(
  files: File[],
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<PerformOCRResult[]> {
  console.log(`📚 Starting batch OCR for ${files.length} documents...`);
  
  const results: PerformOCRResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (onProgress) {
      onProgress(i + 1, files.length, file.name);
    }
    
    try {
      const result = await performOCR(file);
      results.push(result);
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
      results.push({
        text: '',
        confidence: 0,
        extracted: {
          text: '',
          confidence: 0,
          error: `Failed to process: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      });
    }
  }
  
  console.log(`✅ Batch OCR completed: ${results.filter(r => r.confidence > 0.5).length}/${files.length} successful`);
  
  return results;
}
