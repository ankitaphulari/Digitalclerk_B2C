// Enhanced OCR Upload Component with Industry-Standard Processing
// Replaces multiple upload components with single, reliable solution

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, Eye, Trash2 } from 'lucide-react';
import { LocalOCRService } from '@/services/LocalOCRService';
import { DocumentStorageService, StoredDocument } from '@/services/DocumentStorageService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Component interfaces
export interface ExtractedData {
  [key: string]: string | undefined;
  documentType?: string;
  detectedLanguage?: string;
  qualityScore?: string;
}

export interface ProcessingResult {
  extractedData: ExtractedData;
  confidence: number;
}

export interface EnhancedOCRUploadProps {
  onDataExtracted?: (data: ProcessingResult) => void;
  onFileUpload?: (file: File) => void;
  onMultipleFilesUpload?: (files: File[]) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  documentType?: string;
  showPreview?: boolean;
  enableRealTimeExtraction?: boolean;
  enableMultipleFiles?: boolean;
  className?: string;
}

interface UploadedDocument {
  id: string;
  file: File;
  isProcessing: boolean;
  progress: number;
  stage: string;
  result: {
    text: string;
    confidence: number;
    extracted: ExtractedData;
  } | null;
  error: string | null;
  storedDocument?: StoredDocument;
}

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  stage: string;
  file: File | null;
  result: {
    text: string;
    confidence: number;
    extracted: ExtractedData;
  } | null;
  error: string | null;
}

// Field display names for better UX
const FIELD_DISPLAY_NAMES: Record<string, string> = {
  name: 'Full Name',
  fatherName: 'Father\'s Name',
  motherName: 'Mother\'s Name',
  dateOfBirth: 'Date of Birth',
  aadhaarNumber: 'Aadhaar Number',
  panNumber: 'PAN Number',
  passportNumber: 'Passport Number',
  voterNumber: 'Voter ID Number',
  licenseNumber: 'License Number',
  gender: 'Gender',
  address: 'Address',
  phoneNumber: 'Phone Number',
  email: 'Email Address'
};

export const EnhancedOCRUpload: React.FC<EnhancedOCRUploadProps> = ({
  onDataExtracted,
  onFileUpload,
  onMultipleFilesUpload,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxSizeMB = 15,
  documentType = 'auto',
  showPreview = true,
  enableRealTimeExtraction = true,
  enableMultipleFiles = true, // Enable multiple files by default
  className = ''
}) => {
  const { user } = useAuth();
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    stage: '',
    file: null,
    result: null,
    error: null
  });

  // Generate unique ID for documents
  const generateId = () => `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Handle single file upload and processing
  const handleSingleFileUpload = useCallback(async (file: File) => {
    console.log(`Processing single file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    setProcessing({
      isProcessing: true,
      progress: 15,
      stage: 'Initializing OCR processing...',
      file,
      result: null,
      error: null
    });

    onFileUpload?.(file);

    if (!enableRealTimeExtraction) {
      setProcessing(prev => ({ ...prev, isProcessing: false, progress: 100, stage: 'Upload complete' }));
      return;
    }

    try {
      // Real-time progress updates during OCR processing
      setProcessing(prev => ({ ...prev, progress: 30, stage: 'Processing document with AI...' }));
      
      const ocrService = LocalOCRService.getInstance();
      const ocrResult = await ocrService.processDocument(file);
      
      // Convert to expected format with proper typing
      const result = {
        text: ocrResult.ocr.text,
        confidence: ocrResult.classification.confidence * 100, // Convert to percentage
        extracted: {
          text: ocrResult.ocr.text,
          documentType: ocrResult.classification.documentType,
          qualityScore: (ocrResult.classification.confidence * 100).toString(),
          confidence: ocrResult.classification.confidence.toString(),
          ...Object.fromEntries(
            Object.entries(ocrResult.extractedFields).map(([key, field]) => [key, field.value])
          )
        } as ExtractedData
      };
      
      // Immediate completion - no artificial delays
      setProcessing(prev => ({ 
        ...prev, 
        isProcessing: false, 
        progress: 100, 
        stage: 'Processing complete',
        result 
      }));

      // Notify parent component
      if (onDataExtracted) {
        onDataExtracted({
          extractedData: result.extracted,
          confidence: result.confidence
        });
      }

      // Show success toast with safe property access
      const qualityScore = parseInt(result.extracted.qualityScore || '80');
      const confidenceLevel = result.confidence >= 85 ? 'High' : result.confidence >= 70 ? 'Medium' : 'Low';
      
      toast.success(
        `Document processed successfully! Confidence: ${confidenceLevel} (${Math.round(result.confidence)}%)`,
        {
          description: `Quality Score: ${qualityScore}% • ${Object.keys(result.extracted).filter(k => !k.includes('_') && result.extracted[k as keyof ExtractedData]).length} fields extracted`
        }
      );

    } catch (error) {
      console.error('OCR processing failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setProcessing(prev => ({
        ...prev,
        isProcessing: false,
        progress: 0,
        stage: '',
        error: errorMessage
      }));

      toast.error('Document processing failed', {
        description: errorMessage
      });
    }
  }, [documentType, enableRealTimeExtraction, onDataExtracted, onFileUpload]);

  // Handle multiple file upload with parallel processing
  const handleMultipleFileUpload = useCallback(async (files: File[]) => {
    console.log(`Processing ${files.length} files in parallel`);
    
    if (!user) {
      toast.error('Please log in to upload documents');
      return;
    }
    
    const newDocuments: UploadedDocument[] = files.map(file => ({
      id: generateId(),
      file,
      isProcessing: false,
      progress: 0,
      stage: '',
      result: null,
      error: null
    }));

    setUploadedDocuments(prev => [...prev, ...newDocuments]);
    onMultipleFilesUpload?.(files);

    // Upload files to storage first
    try {
      const storedDocs = await DocumentStorageService.uploadAndStoreDocuments(files, user.id, sessionId);
      
      // Update documents with storage info
      setUploadedDocuments(prev => prev.map(doc => {
        const storedDoc = storedDocs.find(stored => stored.file_name === doc.file.name);
        return storedDoc ? { ...doc, storedDocument: storedDoc } : doc;
      }));

      toast.success(`${files.length} documents uploaded and stored successfully`);
    } catch (error) {
      console.error('Failed to store documents:', error);
      toast.error('Failed to store documents');
    }

    // Process files in parallel with concurrency control (max 3 concurrent)
    if (enableRealTimeExtraction) {
      const concurrencyLimit = 3;
      const batches: UploadedDocument[][] = [];
      
      for (let i = 0; i < newDocuments.length; i += concurrencyLimit) {
        batches.push(newDocuments.slice(i, i + concurrencyLimit));
      }
      
      for (const batch of batches) {
        await Promise.all(batch.map(doc => processDocument(doc.id)));
      }
    }
  }, [enableRealTimeExtraction, onMultipleFilesUpload, user, sessionId]);

  // Process individual document with optimized speed
  const processDocument = useCallback(async (documentId: string) => {
    // Get current document state to avoid stale closure
    const currentDoc = uploadedDocuments.find(doc => doc.id === documentId);
    if (!currentDoc) return;

    setUploadedDocuments(prev => prev.map(doc => 
      doc.id === documentId
        ? { ...doc, isProcessing: true, progress: 15, stage: 'Starting OCR processing...', error: null }
        : doc
    ));

    try {
      // Real-time progress update during processing
      setUploadedDocuments(prev => prev.map(doc => 
        doc.id === documentId
          ? { ...doc, progress: 40, stage: 'Processing with AI OCR...' }
          : doc
      ));
      
      const ocrService = LocalOCRService.getInstance();
      const ocrResult = await ocrService.processDocument(currentDoc.file);
      
      // Convert to expected format with proper typing
      const result = {
        text: ocrResult.ocr.text,
        confidence: ocrResult.classification.confidence * 100, // Convert to percentage
        extracted: {
          text: ocrResult.ocr.text,
          documentType: ocrResult.classification.documentType,
          qualityScore: (ocrResult.classification.confidence * 100).toString(),
          confidence: ocrResult.classification.confidence.toString(),
          ...Object.fromEntries(
            Object.entries(ocrResult.extractedFields).map(([key, field]) => [key, field.value])
          )
        } as ExtractedData
      };
      
      // Immediate completion
      setUploadedDocuments(prev => prev.map(doc => 
        doc.id === documentId
          ? { 
              ...doc, 
              isProcessing: false, 
              progress: 100, 
              stage: 'Processing complete',
              result 
            }
          : doc
      ));

      // Update stored document with extracted data
      if (currentDoc.storedDocument && user) {
        try {
          await DocumentStorageService.updateDocumentWithExtractedData(
            currentDoc.storedDocument.id,
            result.extracted,
            result.confidence,
            result.extracted.documentType
          );
        } catch (error) {
          console.error('Failed to update stored document:', error);
        }
      }

      // Show success toast with safe property access
      const qualityScore = parseInt(result.extracted.qualityScore || '80');
      const confidenceLevel = result.confidence >= 85 ? 'High' : result.confidence >= 70 ? 'Medium' : 'Low';
      
      toast.success(
        `${currentDoc.file.name} processed! Confidence: ${confidenceLevel} (${Math.round(result.confidence)}%)`,
        {
          description: `Quality Score: ${qualityScore}% • ${Object.keys(result.extracted).filter(k => !k.includes('_') && result.extracted[k as keyof ExtractedData]).length} fields extracted`
        }
      );

    } catch (error) {
      console.error('OCR processing failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Update stored document with error
      if (currentDoc.storedDocument) {
        try {
          await DocumentStorageService.markDocumentAsFailed(currentDoc.storedDocument.id, errorMessage);
        } catch (updateError) {
          console.error('Failed to update stored document error:', updateError);
        }
      }
      
      setUploadedDocuments(prev => prev.map(doc => 
        doc.id === documentId
          ? {
              ...doc,
              isProcessing: false,
              progress: 0,
              stage: '',
              error: errorMessage
            }
          : doc
      ));

      toast.error(`Processing failed for ${currentDoc.file.name}`, {
        description: errorMessage
      });
    }
  }, [documentType, uploadedDocuments, user]);

  // File validation
  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} not supported. Please upload: ${acceptedTypes.join(', ')}`;
    }
    
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > maxSizeMB) {
      return `File size (${sizeMB.toFixed(2)}MB) exceeds maximum (${maxSizeMB}MB)`;
    }
    
    return null;
  };

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        toast.error('File rejected', { description: error.message });
        return;
      }
      
      if (acceptedFiles.length > 0) {
        // Validate all files
        const invalidFiles = acceptedFiles.filter(file => validateFile(file) !== null);
        if (invalidFiles.length > 0) {
          const error = validateFile(invalidFiles[0]);
          toast.error('Invalid file', { description: error });
          return;
        }

        // Handle multiple or single file upload
        if (enableMultipleFiles) {
          handleMultipleFileUpload(acceptedFiles);
        } else {
          handleSingleFileUpload(acceptedFiles[0]);
        }
      }
    },
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: enableMultipleFiles ? undefined : 1,
    multiple: enableMultipleFiles
  });

  // Remove document from multiple files list
  const removeDocument = async (documentId: string) => {
    const doc = uploadedDocuments.find(d => d.id === documentId);
    if (doc?.storedDocument) {
      try {
        await DocumentStorageService.deleteDocument(doc.storedDocument.id);
        toast.success('Document removed from storage');
      } catch (error) {
        console.error('Failed to delete stored document:', error);
        toast.error('Failed to remove document from storage');
      }
    }
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  // Clear current file
  const clearFile = () => {
    setProcessing({
      isProcessing: false,
      progress: 0,
      stage: '',
      file: null,
      result: null,
      error: null
    });
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 85) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enhanced Document Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
              }
              ${processing.isProcessing ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center gap-4">
              <Upload className={`h-12 w-12 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              
              <div>
                <p className="text-lg font-medium">
                  {isDragActive 
                    ? `Drop your ${enableMultipleFiles ? 'documents' : 'document'} here` 
                    : `Upload ${enableMultipleFiles ? 'Documents' : 'Document'}`
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag & drop or click to select {enableMultipleFiles ? 'multiple files' : 'a file'} • {acceptedTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()} • Max {maxSizeMB}MB each
                </p>
              </div>
              
              <Button variant="outline" size="sm" disabled={processing.isProcessing}>
                Choose File
              </Button>
            </div>
          </div>

          {/* Processing Status */}
          {processing.isProcessing && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{processing.stage}</span>
                <span className="text-sm text-muted-foreground">{processing.progress}%</span>
              </div>
              <Progress value={processing.progress} className="h-2" />
            </div>
          )}

          {/* Current File Info (Single File Mode) */}
          {!enableMultipleFiles && processing.file && !processing.isProcessing && (
            <div className="mt-4 flex items-center justify-between p-3 bg-accent rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{processing.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(processing.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFile}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Multiple Files Display */}
          {enableMultipleFiles && uploadedDocuments.length > 0 && (
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-medium">Uploaded Documents ({uploadedDocuments.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {uploadedDocuments.map((doc) => (
                  <Card key={doc.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {doc.result && (
                          <Badge className={getConfidenceColor(doc.result.confidence)} variant="outline">
                            {doc.result.confidence}%
                          </Badge>
                        )}
                        {doc.error && (
                          <Badge variant="destructive">
                            Error
                          </Badge>
                        )}
                        {doc.isProcessing && (
                          <Badge variant="secondary">
                            Processing...
                          </Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeDocument(doc.id)}
                          disabled={doc.isProcessing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Processing Progress */}
                    {doc.isProcessing && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{doc.stage}</span>
                          <span className="text-xs text-muted-foreground">{doc.progress}%</span>
                        </div>
                        <Progress value={doc.progress} className="h-1" />
                      </div>
                    )}

                    {/* Error Display */}
                    {doc.error && (
                      <Alert className="mt-3" variant="destructive">
                        <AlertCircle className="h-3 w-3" />
                        <AlertDescription className="text-xs">{doc.error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Extracted Data Preview */}
                    {doc.result && showPreview && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {doc.result.extracted.documentType || 'Unknown'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {Object.keys(doc.result.extracted).filter(k => 
                              !k.includes('_') && 
                              doc.result?.extracted[k] && 
                              !['documentType', 'detectedLanguage', 'qualityScore', 'error'].includes(k)
                            ).length} fields extracted
                          </span>
                        </div>
                        
                        {/* Show top 3 extracted fields */}
                        <div className="space-y-1">
                          {Object.entries(doc.result.extracted)
                            .filter(([key, value]) => 
                              value && 
                              !key.includes('_confidence') && 
                              !['documentType', 'detectedLanguage', 'qualityScore', 'error'].includes(key)
                            )
                            .slice(0, 3)
                            .map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {FIELD_DISPLAY_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1)}:
                                </span>
                                <span className="font-medium truncate ml-2 max-w-[150px]">{String(value)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Error Display (Single File Mode) */}
          {!enableMultipleFiles && processing.error && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{processing.error}</AlertDescription>
            </Alert>
          )}

          {/* Results Display (Single File Mode) */}
          {!enableMultipleFiles && processing.result && showPreview && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Extracted Data</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {processing.result.extracted.documentType || 'Unknown'}
                  </Badge>
                  <Badge className={getConfidenceColor(processing.result.confidence)}>
                    {processing.result.confidence}% Confidence
                  </Badge>
                </div>
              </div>

              {/* Extracted Fields */}
              <div className="grid gap-3">
                {Object.entries(processing.result.extracted)
                  .filter(([key, value]) => 
                    value && 
                    !key.includes('_confidence') && 
                    !['documentType', 'detectedLanguage', 'qualityScore', 'error'].includes(key)
                  )
                  .map(([key, value]) => {
                    const confidenceKey = `${key}_confidence`;
                    const fieldConfidence = processing.result?.extracted[confidenceKey];
                    
                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">
                            {FIELD_DISPLAY_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                          </p>
                          <p className="text-sm text-muted-foreground">{String(value)}</p>
                        </div>
                        {fieldConfidence && (
                          <Badge variant="outline" className="text-xs">
                            {fieldConfidence}%
                          </Badge>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Quality Metrics */}
              {processing.result.extracted.qualityScore && (
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span>Document Quality</span>
                    <span className="font-medium">{processing.result.extracted.qualityScore}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Detected Language</span>
                    <span className="font-medium">{processing.result.extracted.detectedLanguage?.toUpperCase()}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedOCRUpload;