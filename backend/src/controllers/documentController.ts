// backend/src/controllers/documentController.ts
// Version without MongoDB - uses in-memory storage from server.ts

import { Request, Response } from 'express';
import { performOCR } from '../services/performOCR';
import { EnhancedDocumentAIOCRService } from '../services/EnhancedDocumentAIOCRService';

// Import your extractors
import { PANCardExtractor } from '../services/PANCardExtractor';
import { AadhaarExtractor } from '../services/AadhaarExtractor';
import { PassportExtractor } from '../services/PassportExtractor';
import { DrivingLicenceExtractor } from '../services/DrivingLicenceExtractor';
import { VoterIDExtractor } from '../services/VoterIDExtractor';
import { SmartDocumentClassifier } from '../services/SmartDocumentClassifier';

// Import storage functions from server (in-memory)
import { getUserById, updateUserUsage, saveHistory, getHistory } from '../server';

/**
 * Main endpoint for Chrome Extension
 * POST /api/document/extract
 */
export async function extractDocument(req: Request, res: Response) {
  try {
    const { documents } = req.body;
    const userId = req.user?.id;

    console.log('📄 Document extraction request:', {
      userId,
      documentCount: documents?.length,
      timestamp: new Date().toISOString()
    });

    // Validation
    if (!documents || documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'NO_DOCUMENTS',
        message: 'No documents provided'
      });
    }

    // Get user from in-memory storage
    const user = getUserById(userId!);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not found'
      });
    }

    // Check subscription status
    if (user.subscriptionStatus === 'expired') {
      return res.status(403).json({
        success: false,
        error: 'SUBSCRIPTION_EXPIRED',
        message: 'Your subscription has expired. Please renew to continue.'
      });
    }

    // Check monthly limit
    if (user.documentsUsed >= user.documentLimit) {
      return res.status(403).json({
        success: false,
        error: 'LIMIT_EXCEEDED',
        message: `Monthly limit of ${user.documentLimit} documents exceeded.`
      });
    }

    const remainingLimit = user.documentLimit - user.documentsUsed;
    if (documents.length > remainingLimit) {
      return res.status(403).json({
        success: false,
        error: 'LIMIT_EXCEEDED',
        message: `You can only upload ${remainingLimit} more document(s) this month.`
      });
    }

    // Process documents
    console.log('🔄 Starting document processing...');
    
    const allExtractedData: Record<string, any> = {};
    const documentResults: any[] = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      try {
        console.log(`📄 Processing ${i + 1}/${documents.length}: ${doc.name}`);

        // Convert base64 to Buffer
        const base64Data = doc.content.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Create File-like object
        const file = bufferToFile(buffer, doc.name, doc.type);

        // Step 1: Perform OCR with Google Vision
        console.log('🔍 Running Google Vision OCR...');
        const ocrResult = await performOCR(file, 'auto', 'en');

        if (!ocrResult.text || ocrResult.confidence < 0.3) {
          console.warn(`⚠️ Low confidence in ${doc.name}`);
          documentResults.push({
            fileName: doc.name,
            success: false,
            error: 'Low OCR confidence or no text detected'
          });
          continue;
        }

        // Step 2: Classify document type
        console.log('🏷️ Classifying document...');
        const classifier = new SmartDocumentClassifier();
        const docType = await classifier.classify(ocrResult.text);

        console.log(`✅ Detected: ${docType}`);

        // Step 3: Extract structured data
        let structuredData: Record<string, any> = {};
        
        switch (docType) {
          case 'PAN_CARD':
          case 'PAN':
            const panExtractor = new PANCardExtractor();
            structuredData = await panExtractor.extract(ocrResult.text);
            break;

          case 'AADHAAR':
          case 'AADHAAR_CARD':
            const aadhaarExtractor = new AadhaarExtractor();
            structuredData = await aadhaarExtractor.extract(ocrResult.text);
            break;

          case 'PASSPORT':
            const passportExtractor = new PassportExtractor();
            structuredData = await passportExtractor.extract(ocrResult.text);
            break;

          case 'DRIVING_LICENSE':
          case 'DL':
            const dlExtractor = new DrivingLicenceExtractor();
            structuredData = await dlExtractor.extract(ocrResult.text);
            break;

          case 'VOTER_ID':
          case 'EPIC':
            const voterExtractor = new VoterIDExtractor();
            structuredData = await voterExtractor.extract(ocrResult.text);
            break;

          default:
            console.log('🔄 Using universal processor');
            const universalResult = await EnhancedDocumentAIOCRService.processDocument(file);
            structuredData = universalResult.extractedFields;
        }

        // Merge extracted data
        Object.assign(allExtractedData, structuredData);

        documentResults.push({
          fileName: doc.name,
          documentType: docType,
          success: true,
          confidence: ocrResult.confidence,
          fieldsExtracted: Object.keys(structuredData).length
        });

        console.log(`✅ Processed: ${doc.name}`);

      } catch (docError) {
        console.error(`❌ Error processing ${doc.name}:`, docError);
        documentResults.push({
          fileName: doc.name,
          success: false,
          error: docError instanceof Error ? docError.message : 'Processing failed'
        });
      }
    }

    // Update usage count (in-memory)
    const newUsageCount = updateUserUsage(userId!, documents.length);

    // Save history (in-memory)
    saveHistory(userId!, {
      documents: documentResults,
      extractedData: allExtractedData,
      timestamp: new Date()
    });

    const successfulDocs = documentResults.filter(d => d.success).length;
    
    console.log('✅ Extraction completed:', {
      total: documents.length,
      successful: successfulDocs,
      failed: documents.length - successfulDocs
    });

    res.json({
      success: true,
      data: allExtractedData,
      metadata: {
        totalDocuments: documents.length,
        processedSuccessfully: successfulDocs,
        failed: documents.length - successfulDocs,
        documentDetails: documentResults,
        newUsageCount: newUsageCount,
        remainingLimit: user.documentLimit - newUsageCount
      }
    });

  } catch (error) {
    console.error('❌ Document extraction failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'EXTRACTION_FAILED',
      message: error instanceof Error ? error.message : 'Document extraction failed'
    });
  }
}

/**
 * Get document extraction history
 * GET /api/document/history
 */
export async function getExtractionHistory(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { limit = 10, offset = 0 } = req.query;

    // Get history from in-memory storage
    const history = getHistory(userId!, Number(limit));

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to fetch extraction history'
    });
  }
}

/**
 * Update usage count
 * POST /api/usage/increment
 */
export async function incrementUsage(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { count } = req.body;

    // Update in in-memory storage
    const newCount = updateUserUsage(userId!, count);

    res.json({
      success: true,
      newUsageCount: newCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'UPDATE_FAILED'
    });
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert Buffer to File-like object for Node.js
 */
function bufferToFile(buffer: Buffer, fileName: string, mimeType: string): any {
  // For Node.js, create a File-like object
  return Object.assign(buffer, {
    name: fileName,
    type: mimeType,
    arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  });
}

export default {
  extractDocument,
  getExtractionHistory,
  incrementUsage
};
