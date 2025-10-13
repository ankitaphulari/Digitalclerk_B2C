// Enhanced OCR Demo Page
// Demonstrates the new industry-standard OCR processing capabilities

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Zap, 
  Shield, 
  Target, 
  CheckCircle, 
  ArrowLeft,
  Brain,
  Eye,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import EnhancedOCRUpload, { ProcessingResult } from '@/components/EnhancedOCRUpload';

const EnhancedOCRDemo = () => {
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('auto');

  const handleDataExtracted = (result: ProcessingResult) => {
    setProcessingResult(result);
    console.log('Enhanced OCR Result:', result);
  };

  const documentTypes = [
    { value: 'auto', label: 'Auto-Detect', description: 'Automatically detect document type' },
    { value: 'aadhaar', label: 'Aadhaar Card', description: 'Indian national ID card' },
    { value: 'pan', label: 'PAN Card', description: 'Permanent Account Number card' },
    { value: 'passport', label: 'Passport', description: 'International travel document' },
    { value: 'driving_license', label: 'Driving License', description: 'Driving license document' },
    { value: 'voter_id', label: 'Voter ID', description: 'Electoral identity card' }
  ];

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered OCR',
      description: 'Uses Google Document AI for superior text extraction with 95%+ accuracy'
    },
    {
      icon: Shield,
      title: 'Smart Validation',
      description: 'Real-time field validation with confidence scoring and error detection'
    },
    {
      icon: Target,
      title: 'Precise Extraction',
      description: 'Contextual field detection using document structure analysis'
    },
    {
      icon: Eye,
      title: 'Quality Assessment',
      description: 'Automatic document quality scoring with enhancement suggestions'
    },
    {
      icon: Zap,
      title: 'Fast Processing',
      description: 'Optimized pipeline processes documents in 2-3 seconds'
    },
    {
      icon: Clock,
      title: 'Real-time Feedback',
      description: 'Live processing status with detailed progress tracking'
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Enhanced OCR Engine</h1>
            <p className="text-muted-foreground">
              Industry-standard document processing with AI-powered text extraction
            </p>
          </div>
        </div>
        
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Main Upload Area */}
        <div className="space-y-6">
          {/* Document Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Document Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="auto">Auto-Detect</TabsTrigger>
                  <TabsTrigger value="aadhaar">Aadhaar</TabsTrigger>
                  <TabsTrigger value="pan">PAN Card</TabsTrigger>
                </TabsList>
                <TabsContent value="auto" className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    The system will automatically detect the document type using AI pattern recognition.
                  </p>
                </TabsContent>
                <TabsContent value="aadhaar" className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Optimized for Aadhaar cards with enhanced name extraction and validation.
                  </p>
                </TabsContent>
                <TabsContent value="pan" className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Specialized extraction for PAN cards with PAN number validation.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Upload Component */}
          <EnhancedOCRUpload
            documentType={selectedDocumentType}
            onDataExtracted={handleDataExtracted}
            showPreview={true}
            enableRealTimeExtraction={true}
            enableMultipleFiles={true}
            maxSizeMB={15}
            className="w-full"
          />

          {/* Processing Results */}
          {processingResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Processing Summary
                  <Badge 
                    variant="outline" 
                    className={
                      processingResult.confidence >= 85 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : processingResult.confidence >= 70 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }
                  >
                    {processingResult.confidence}% Overall Confidence
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Document Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Document Type:</span>
                      <span className="ml-2">{processingResult.extractedData.documentType || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Language:</span>
                      <span className="ml-2">{processingResult.extractedData.detectedLanguage?.toUpperCase() || 'EN'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Quality Score:</span>
                      <span className="ml-2">{processingResult.extractedData.qualityScore || 'N/A'}%</span>
                    </div>
                    <div>
                      <span className="font-medium">Fields Extracted:</span>
                      <span className="ml-2">
                        {Object.keys(processingResult.extractedData).filter(k => 
                          !['documentType', 'detectedLanguage', 'qualityScore', 'error'].includes(k) && 
                          !k.includes('_confidence') &&
                          processingResult.extractedData[k]
                        ).length}
                      </span>
                    </div>
                  </div>

                  {/* Validation Status */}
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Validation Status</h4>
                    <div className="grid gap-2">
                      {Object.entries(processingResult.extractedData)
                        .filter(([key, value]) => 
                          value && 
                          !key.includes('_confidence') && 
                          !['documentType', 'detectedLanguage', 'qualityScore', 'error'].includes(key)
                        )
                        .map(([key, value]) => {
                          const confidenceKey = `${key}_confidence`;
                          const confidence = parseInt(processingResult.extractedData[confidenceKey] || '0');
                          
                          return (
                            <div key={key} className="flex items-center justify-between text-sm">
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <Badge 
                                variant="outline" 
                                className={
                                  confidence >= 85 ? 'text-green-600' : 
                                  confidence >= 70 ? 'text-yellow-600' : 'text-red-600'
                                }
                              >
                                {confidence}%
                              </Badge>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedOCRDemo;