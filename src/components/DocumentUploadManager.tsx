import React, { useState, useCallback } from 'react';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Camera, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { EnhancedOCRUpload, ProcessingResult } from '@/components/EnhancedOCRUpload';

interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  selectOne: boolean;
  documentType: string;
  documents: string[];
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  categoryId: string;
  extractedData?: any;
  uploadedAt: Date;
  status: 'uploading' | 'completed' | 'failed' | 'processing';
  confidence?: number;
}

interface DocumentUploadManagerProps {
  formType: string;
  categories: DocumentCategory[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  onAllDataExtracted: (combinedData: any) => void;
}

export default function DocumentUploadManager({ 
  formType, 
  categories, 
  onDocumentsChange,
  onAllDataExtracted 
}: DocumentUploadManagerProps) {
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '');
  const [processing, setProcessing] = useState<boolean>(false);

  const currentCategory = categories.find(cat => cat.id === activeCategory);
  const categoryDocuments = uploadedDocuments.filter(doc => doc.categoryId === activeCategory);

  // Calculate progress
  const requiredCategories = categories.filter(cat => cat.required);
  const completedCategories = requiredCategories.filter(cat => 
    uploadedDocuments.some(doc => 
      doc.categoryId === cat.id && doc.status === 'completed'
    )
  );
  const progressPercentage = (completedCategories.length / requiredCategories.length) * 100;

  // Intelligent data merger that handles conflicts and prioritizes confidence
  const intelligentDataMerger = (documents: UploadedDocument[]): any => {
    const mergedData: Record<string, any> = {};
    const fieldConfidences: Record<string, number> = {};
    
    documents.forEach(doc => {
      if (!doc.extractedData) return;
      
      Object.entries(doc.extractedData).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          const currentConfidence = doc.confidence || 85;
          
          // If field doesn't exist or current has higher confidence, use it
          if (!mergedData[key] || currentConfidence > (fieldConfidences[key] || 0)) {
            mergedData[key] = value;
            fieldConfidences[key] = currentConfidence;
          }
          // If same confidence, prefer longer/more complete value
          else if (currentConfidence === fieldConfidences[key] && value.length > (mergedData[key]?.length || 0)) {
            mergedData[key] = value;
          }
        }
      });
    });
    
    return mergedData;
  };

  const handleDataExtracted = useCallback((result: ProcessingResult, categoryId: string, fileName: string) => {
    console.log(`Document extraction result for ${fileName}:`, result);
    
    const newDocument: UploadedDocument = {
      id: `${categoryId}-${Date.now()}`,
      name: fileName,
      type: 'document',
      size: 0,
      categoryId,
      extractedData: result.extractedData,
      uploadedAt: new Date(),
      status: 'completed',
      confidence: result.confidence
    };

    setUploadedDocuments(prev => {
      const updated = [...prev, newDocument];
      onDocumentsChange(updated);
      
      // Use intelligent data merger instead of simple object spread
      const combinedData = intelligentDataMerger(updated);
      
      console.log('Intelligently merged data from all documents:', combinedData);
      onAllDataExtracted(combinedData);
      return updated;
    });

    toast.success(`Document processed successfully! Confidence: ${result.confidence}%`);
  }, [onDocumentsChange, onAllDataExtracted]);

  const removeDocument = useCallback((documentId: string) => {
    setUploadedDocuments(prev => {
      const updated = prev.filter(doc => doc.id !== documentId);
      onDocumentsChange(updated);
      
      // Recalculate combined data using intelligent merger
      const combinedData = intelligentDataMerger(updated);
      
      console.log('Recalculated data after document removal:', combinedData);
      onAllDataExtracted(combinedData);
      return updated;
    });
    
    toast.success('Document removed successfully');
  }, [onDocumentsChange, onAllDataExtracted]);

  const getCategoryStatus = (category: DocumentCategory) => {
    const docs = uploadedDocuments.filter(doc => doc.categoryId === category.id && doc.status === 'completed');
    if (docs.length === 0) return 'pending';
    if (category.selectOne && docs.length >= 1) return 'completed';
    if (!category.selectOne && docs.length > 0) return 'completed';
    return 'pending';
  };

  const getCategoryStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Collection Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {completedCategories.length} of {requiredCategories.length} required categories completed
              </span>
              <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Category Navigation */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const status = getCategoryStatus(category);
          const isActive = activeCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              className={`relative ${isActive ? '' : getCategoryStatusColor(status)}`}
            >
              <span className="flex items-center gap-2">
                {status === 'completed' && <CheckCircle className="h-4 w-4" />}
                {status === 'pending' && <AlertCircle className="h-4 w-4" />}
                {category.name}
                {category.required && <span className="text-red-500">*</span>}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Active Category Upload */}
      {currentCategory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{currentCategory.name}</span>
              <Badge variant={currentCategory.required ? "destructive" : "secondary"}>
                {currentCategory.required ? "Required" : "Optional"}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">{currentCategory.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Document Type Requirements */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Required Documents (choose {currentCategory.selectOne ? 'one' : 'any'}):</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentCategory.documents.map((doc, index) => (
                  <div key={index} className="text-sm text-blue-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    {doc}
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Component */}
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
              <EnhancedOCRUpload
                onDataExtracted={(result) => handleDataExtracted(result, currentCategory.id, `${currentCategory.name} Document`)}
                documentType={formType}
                enableRealTimeExtraction={true}
                showPreview={true}
                enableMultipleFiles={false}
                acceptedTypes={['image/jpeg', 'image/png', 'image/webp', 'application/pdf']}
                maxSizeMB={15}
                className="w-full"
              />
            </div>

            {/* Uploaded Documents for this Category */}
            {categoryDocuments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Uploaded Documents:</h4>
                {categoryDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-sm">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Uploaded {doc.uploadedAt.toLocaleTimeString()}
                          {doc.confidence && ` • Confidence: ${doc.confidence}%`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(doc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Extracted Data Preview */}
            {categoryDocuments.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Extracted Data Preview:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {categoryDocuments.map(doc => 
                    doc.extractedData && Object.entries(doc.extractedData).map(([key, value]) => (
                      <div key={`${doc.id}-${key}`} className="text-blue-800">
                        <span className="font-medium">{key}:</span> {String(value).substring(0, 30)}
                        {String(value).length > 30 && '...'}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Category Completion Status */}
            {currentCategory.selectOne && categoryDocuments.length >= 1 && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    This category is complete! You can upload more documents or move to the next category.
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      <Card>
        <CardContent className="pt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📋 Upload Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ensure documents are clear, well-lit, and all text is readable</li>
              <li>• Take photos straight-on (avoid angles) for better OCR results</li>
              <li>• Supported formats: JPEG, PNG, WebP, PDF</li>
              <li>• Maximum file size: 15MB per document</li>
              <li>• AI will automatically extract relevant information from your documents</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}