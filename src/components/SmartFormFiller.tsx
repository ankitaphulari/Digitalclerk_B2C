import React from 'react';
import { GovernmentPortalLinks } from './GovernmentPortalLinks';
import { EnhancedOCRUpload, ProcessingResult } from './EnhancedOCRUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck, ExternalLink } from 'lucide-react';

interface SmartFormFillerIntegratedProps {
  documentType?: string;
  onDataExtracted?: (data: ProcessingResult) => void;
  className?: string;
}

export const SmartFormFillerIntegrated: React.FC<SmartFormFillerIntegratedProps> = ({
  documentType = 'auto',
  onDataExtracted,
  className = ''
}) => {
  const [extractedData, setExtractedData] = React.useState<ProcessingResult | null>(null);

  const handleDataExtraction = (data: ProcessingResult) => {
    setExtractedData(data);
    onDataExtracted?.(data);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary" />
            Step 1: Upload Your Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedOCRUpload
            documentType={documentType}
            onDataExtracted={handleDataExtraction}
            enableMultipleFiles={false}
            showPreview={true}
            enableRealTimeExtraction={true}
          />
        </CardContent>
      </Card>

      {/* Government Portal Integration */}
      {extractedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-primary" />
              Step 2: Fill Official Forms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your document has been processed successfully. Select an official government portal below to automatically fill forms with your extracted data.
              </p>
              
              <GovernmentPortalLinks
                documentType={extractedData.extractedData.documentType || documentType}
                onPortalSelect={(portal) => {
                  console.log('Selected portal:', portal);
                   // Send extracted data to Chrome extension using dynamic extension detection
                   if ((window as any).chrome?.runtime?.sendMessage) {
                     try {
                       // Try to detect the extension dynamically
                       const extensionIds = [
                         'extension-id', // Default fallback
                         'YOUR_EXTENSION_ID_HERE' // Replace with actual extension ID
                       ];
                       
                       for (const extensionId of extensionIds) {
                         try {
                           (window as any).chrome.runtime.sendMessage(
                             extensionId,
                             {
                               action: 'setDocumentData',
                               data: {
                                 extractedFields: extractedData.extractedData,
                                 documentType: extractedData.extractedData.documentType,
                                 confidence: extractedData.confidence,
                                 timestamp: Date.now()
                               }
                             },
                             (response: any) => {
                               if (response?.success) {
                                 console.log('Document data sent to extension successfully');
                                 return; // Exit on first successful send
                               }
                             }
                           );
                           break; // Exit loop on successful send
                         } catch (error) {
                           console.log(`Extension ${extensionId} communication failed:`, error);
                         }
                       }
                     } catch (error) {
                       console.log('Extension communication failed:', error);
                     }
                   }
                }}
              />

              {/* Data Summary */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Extracted Data Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Document Type:</span>
                    <span className="ml-2 font-medium">{extractedData.extractedData.documentType || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className="ml-2 font-medium">{Math.round(extractedData.confidence)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fields Extracted:</span>
                    <span className="ml-2 font-medium">
                      {Object.keys(extractedData.extractedData).filter(k => 
                        !k.includes('_') && 
                        extractedData.extractedData[k] && 
                        !['documentType', 'qualityScore', 'text'].includes(k)
                      ).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};