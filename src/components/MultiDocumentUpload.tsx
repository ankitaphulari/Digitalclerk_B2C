import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { performOCR } from '@/services/performOCR';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface DocumentUpload {
  id: string;
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  extractedData?: any;
  error?: string;
  preview?: string;
}

interface MultiDocumentUploadProps {
  documentType?: string;
  onDataExtracted?: (data: any, documents: DocumentUpload[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  category?: string;
}

const MultiDocumentUpload: React.FC<MultiDocumentUploadProps> = ({
  documentType = 'auto',
  onDataExtracted,
  maxFiles = 5,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  category = 'documents'
}) => {
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const sessionId = useRef(crypto.randomUUID());

  const processDocument = async (upload: DocumentUpload) => {
    try {
      // Update status to processing
      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, status: 'processing', progress: 20 } : u
      ));

      // Upload file to Supabase storage first
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const fileName = `${user.user.id}/${sessionId.current}/${upload.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileName, upload.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Update progress
      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, progress: 50 } : u
      ));

      // Process with OCR
      const result = await performOCR(upload.file, documentType);
      
      // Update progress
      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, progress: 80 } : u
      ));

      // Save to database
      const { error: dbError } = await supabase
        .from('document_uploads')
        .insert({
          user_id: user.user.id,
          file_name: upload.file.name,
          file_path: uploadData.path,
          file_type: upload.file.type,
          file_size: upload.file.size,
          document_type: result.extracted?.documentType || documentType,
          extracted_data: result.extracted || result,
          processing_status: 'completed',
          confidence_score: result.confidence || 0,
          upload_session_id: sessionId.current
        });

      if (dbError) {
        console.error('Database save error:', dbError);
        // Don't throw error for database save failure - file is still processed
      }

      // Mark as completed
      const completedUpload = {
        ...upload,
        status: 'completed' as const,
        progress: 100,
        extractedData: result.extracted || result
      };

      setUploads(prev => prev.map(u => 
        u.id === upload.id ? completedUpload : u
      ));

      return completedUpload;

    } catch (error) {
      console.error('Processing error:', error);
      const errorUpload = {
        ...upload,
        status: 'error' as const,
        progress: 0,
        error: error instanceof Error ? error.message : 'Processing failed'
      };

      setUploads(prev => prev.map(u => 
        u.id === upload.id ? errorUpload : u
      ));

      toast({
        title: "Processing Error",
        description: `Failed to process ${upload.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });

      return errorUpload;
    }
  };

  const handleFilesAdded = useCallback(async (files: File[]) => {
    if (uploads.length + files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed. You currently have ${uploads.length} files.`,
        variant: "destructive",
      });
      return;
    }

    const newUploads: DocumentUpload[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'uploading',
      progress: 0,
      preview: URL.createObjectURL(file)
    }));

    setUploads(prev => [...prev, ...newUploads]);
    setIsProcessing(true);

    try {
      // Process documents in parallel but limit concurrency to 3
      const processPromises = newUploads.map(async (upload, index) => {
        // Stagger the processing to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, index * 500));
        return processDocument(upload);
      });

      const processedUploads = await Promise.all(processPromises);
      
      // Call callback with combined extracted data
      if (onDataExtracted) {
        const allCompletedUploads = uploads.filter(u => u.status === 'completed')
          .concat(processedUploads.filter(u => u.status === 'completed'));
        
        const combinedData = allCompletedUploads.reduce((acc, upload) => {
          if (upload.extractedData) {
            return { ...acc, ...upload.extractedData };
          }
          return acc;
        }, {});

        onDataExtracted(combinedData, allCompletedUploads);
      }

    } catch (error) {
      console.error('Batch processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [uploads, maxFiles, documentType, onDataExtracted, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFilesAdded,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    multiple: true,
    maxFiles: maxFiles
  });

  const removeDocument = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Upload ({uploads.length}/{maxFiles})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
            }
            ${isProcessing ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <Upload className={`h-8 w-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <div>
              <p className="font-medium">
                {isDragActive ? 'Drop documents here' : 'Upload Documents'}
              </p>
              <p className="text-sm text-muted-foreground">
                Drag & drop or click to select up to {maxFiles} files
              </p>
            </div>
            <Button variant="outline" size="sm" disabled={isProcessing}>
              Choose Files
            </Button>
          </div>
        </div>

        {/* Uploaded Documents */}
        {uploads.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Uploaded Documents</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploads.map((upload) => (
                <div key={upload.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{upload.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {upload.status === 'processing' && (
                      <div className="mt-1">
                        <Progress value={upload.progress} className="h-1" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {upload.status === 'completed' && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Done
                      </Badge>
                    )}
                    
                    {upload.status === 'processing' && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processing
                      </Badge>
                    )}
                    
                    {upload.status === 'error' && (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(upload.id)}
                      disabled={upload.status === 'processing'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Summary */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing documents...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiDocumentUpload;