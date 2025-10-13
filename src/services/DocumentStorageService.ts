// Document Storage Service for persistent document management
import { supabase } from '@/integrations/supabase/client';

export interface StoredDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  document_type?: string | null;
  extracted_data?: any;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  confidence_score?: number | null;
  upload_session_id?: string | null;
  created_at: string;
  updated_at: string;
}

export class DocumentStorageService {
  // Upload file to Supabase Storage
  static async uploadFile(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('user-documents')
      .upload(filePath, file);

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    return data.path;
  }

  // Store document metadata in database
  static async storeDocumentMetadata(
    userId: string,
    file: File,
    filePath: string,
    sessionId?: string
  ): Promise<StoredDocument> {
    const documentData = {
      user_id: userId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      processing_status: 'pending' as const,
      upload_session_id: sessionId
    };

    const { data, error } = await supabase
      .from('document_uploads')
      .insert(documentData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store document metadata: ${error.message}`);
    }

    return data as StoredDocument;
  }

  // Update document with extracted data
  static async updateDocumentWithExtractedData(
    documentId: string,
    extractedData: any,
    confidence: number,
    documentType?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('document_uploads')
      .update({
        extracted_data: extractedData,
        confidence_score: confidence,
        document_type: documentType,
        processing_status: 'completed'
      })
      .eq('id', documentId);

    if (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  // Mark document as failed
  static async markDocumentAsFailed(documentId: string, error: string): Promise<void> {
    const { error: updateError } = await supabase
      .from('document_uploads')
      .update({
        processing_status: 'failed',
        extracted_data: { error }
      })
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Failed to mark document as failed: ${updateError.message}`);
    }
  }

  // Get user's documents
  static async getUserDocuments(userId: string): Promise<StoredDocument[]> {
    const { data, error } = await supabase
      .from('document_uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    return (data || []) as StoredDocument[];
  }

  // Delete document
  static async deleteDocument(documentId: string): Promise<void> {
    // First get the document to find the file path
    const { data: document, error: fetchError } = await supabase
      .from('document_uploads')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch document: ${fetchError.message}`);
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('user-documents')
      .remove([document.file_path]);

    if (storageError) {
      console.error('Failed to delete file from storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('document_uploads')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw new Error(`Failed to delete document: ${dbError.message}`);
    }
  }

  // Upload and store multiple documents
  static async uploadAndStoreDocuments(
    files: File[],
    userId: string,
    sessionId?: string
  ): Promise<StoredDocument[]> {
    const results: StoredDocument[] = [];

    for (const file of files) {
      try {
        const filePath = await this.uploadFile(file, userId);
        const storedDoc = await this.storeDocumentMetadata(userId, file, filePath, sessionId);
        results.push(storedDoc);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    return results;
  }
}