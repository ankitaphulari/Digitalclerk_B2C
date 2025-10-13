import React, { useState } from 'react';
import { FileImage, Download, Settings, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface ConversionOptions {
  format: 'jpeg' | 'png' | 'pdf' | 'webp';
  quality: number;
  maxWidth: number;
  maxHeight: number;
  compression: number;
}

interface DocumentFile {
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
}

interface DocumentFormatConverterProps {
  documents: DocumentFile[];
  onConvertedDocuments: (documents: DocumentFile[]) => void;
  requirements?: {
    maxSize?: number; // in MB
    acceptedFormats?: string[];
    maxDimensions?: { width: number; height: number };
  };
}

export default function DocumentFormatConverter({ 
  documents, 
  onConvertedDocuments,
  requirements = {}
}: DocumentFormatConverterProps) {
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>({
    format: 'jpeg',
    quality: 85,
    maxWidth: 1920,
    maxHeight: 1080,
    compression: 80
  });
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);

  const defaultRequirements = {
    maxSize: 5, // 5MB default
    acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    maxDimensions: { width: 2048, height: 2048 },
    ...requirements
  };

  const checkDocumentCompliance = (doc: DocumentFile) => {
    const issues: string[] = [];
    
    // Check file size
    if (doc.size > (defaultRequirements.maxSize! * 1024 * 1024)) {
      issues.push(`File size exceeds ${defaultRequirements.maxSize}MB`);
    }
    
    // Check format
    if (!defaultRequirements.acceptedFormats!.includes(doc.type)) {
      issues.push('Unsupported file format');
    }

    return {
      isCompliant: issues.length === 0,
      issues
    };
  };

  const convertImageToCanvas = (file: File, options: ConversionOptions): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const maxWidth = options.maxWidth;
        const maxHeight = options.maxHeight;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image with potential quality adjustments
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with specified quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Conversion failed'));
            }
          },
          `image/${options.format}`,
          options.quality / 100
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleConvertDocuments = async () => {
    setIsConverting(true);
    setConversionProgress(0);

    try {
      const convertedDocuments: DocumentFile[] = [];
      const totalDocuments = documents.length;

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        setConversionProgress((i / totalDocuments) * 100);

        if (doc.type.startsWith('image/')) {
          try {
            const convertedBlob = await convertImageToCanvas(doc.file, conversionOptions);
            const convertedFile = new File(
              [convertedBlob], 
              `${doc.name.split('.')[0]}.${conversionOptions.format}`,
              { type: `image/${conversionOptions.format}` }
            );

            convertedDocuments.push({
              file: convertedFile,
              preview: URL.createObjectURL(convertedBlob),
              name: convertedFile.name,
              size: convertedFile.size,
              type: convertedFile.type
            });
          } catch (error) {
            console.error('Conversion failed for', doc.name, error);
            convertedDocuments.push(doc); // Keep original if conversion fails
          }
        } else {
          convertedDocuments.push(doc); // Keep non-image files as is
        }
      }

      setConversionProgress(100);
      onConvertedDocuments(convertedDocuments);
      toast.success('Documents converted successfully!');
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Document conversion failed');
    } finally {
      setIsConverting(false);
      setConversionProgress(0);
    }
  };

  const getTotalSize = () => {
    return documents.reduce((total, doc) => total + doc.size, 0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Document Format Optimizer
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Optimize your documents to meet official requirements
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Document Compliance Check */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Document Compliance</h4>
          <div className="space-y-2">
            {documents.map((doc, index) => {
              const compliance = checkDocumentCompliance(doc);
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileImage className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">{doc.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(doc.size)} • {doc.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {compliance.isCompliant ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Compliant
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Needs Conversion
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Requirements Display */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Official Requirements:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Maximum file size: {defaultRequirements.maxSize}MB per document</li>
            <li>• Accepted formats: {defaultRequirements.acceptedFormats!.map(f => f.split('/')[1]).join(', ').toUpperCase()}</li>
            <li>• Maximum dimensions: {defaultRequirements.maxDimensions!.width}x{defaultRequirements.maxDimensions!.height}</li>
            <li>• Total size: {formatFileSize(getTotalSize())}</li>
          </ul>
        </div>

        {/* Conversion Options */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Conversion Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Output Format</label>
              <Select
                value={conversionOptions.format}
                onValueChange={(value: 'jpeg' | 'png' | 'pdf' | 'webp') =>
                  setConversionOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jpeg">JPEG (Recommended)</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Quality: {conversionOptions.quality}%
              </label>
              <Slider
                value={[conversionOptions.quality]}
                onValueChange={([value]) =>
                  setConversionOptions(prev => ({ ...prev, quality: value }))
                }
                max={100}
                min={50}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Max Width: {conversionOptions.maxWidth}px
              </label>
              <Slider
                value={[conversionOptions.maxWidth]}
                onValueChange={([value]) =>
                  setConversionOptions(prev => ({ ...prev, maxWidth: value }))
                }
                max={2048}
                min={800}
                step={100}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Max Height: {conversionOptions.maxHeight}px
              </label>
              <Slider
                value={[conversionOptions.maxHeight]}
                onValueChange={([value]) =>
                  setConversionOptions(prev => ({ ...prev, maxHeight: value }))
                }
                max={2048}
                min={600}
                step={100}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Conversion Progress */}
        {isConverting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Converting documents...</span>
              <span>{Math.round(conversionProgress)}%</span>
            </div>
            <Progress value={conversionProgress} className="h-2" />
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleConvertDocuments}
          disabled={isConverting}
          className="w-full"
          size="lg"
        >
          {isConverting ? (
            <>
              <Settings className="h-4 w-4 mr-2 animate-spin" />
              Converting Documents...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Optimize Documents for Submission
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}