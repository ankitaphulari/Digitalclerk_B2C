import { Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Legacy interfaces for compatibility
interface SmartFieldMatch {
  field: string;
  value: string;
  confidence: number;
  source: string;
}

interface GoogleLensUploadProps {
  onFieldsExtracted?: (fields: SmartFieldMatch[]) => void;
  onTextExtracted?: (fullText: string) => void;
  className?: string;
}

export const GoogleLensUpload = ({ 
  onFieldsExtracted, 
  onTextExtracted,
  className 
}: GoogleLensUploadProps) => {

  return (
    <div className={cn("space-y-4", className)}>
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Smart Document Scanner</h3>
          <Badge variant="secondary" className="ml-auto">
            Enhanced OCR
          </Badge>
        </div>
        
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Smart document scanning is now available via Enhanced OCR</p>
          <Button 
            onClick={() => window.open('/enhanced-ocr', '_blank')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Open Enhanced OCR
          </Button>
        </div>
      </Card>
    </div>
  );
};