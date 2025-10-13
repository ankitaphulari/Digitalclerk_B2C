import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, HelpCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface ErrorInfo {
  type: 'extraction' | 'validation' | 'upload' | 'network';
  field?: string;
  message: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
  autoFixable: boolean;
}

interface ErrorRecoveryProps {
  errors: ErrorInfo[];
  onRetry: (errorType: string, field?: string) => Promise<boolean>;
  onAutoFix: (errorType: string, field?: string) => Promise<boolean>;
  className?: string;
}

const ERROR_SOLUTIONS = {
  extraction: {
    title: 'Data Extraction Failed',
    icon: AlertTriangle,
    solutions: [
      'Improve document quality and try again',
      'Ensure document is well-lit and clear',
      'Try a different image angle',
      'Upload a higher resolution scan'
    ]
  },
  validation: {
    title: 'Validation Error',
    icon: HelpCircle,
    solutions: [
      'Check field format requirements',
      'Verify data matches document',
      'Use auto-correction suggestions',
      'Manually correct the field'
    ]
  },
  upload: {
    title: 'Upload Failed',
    icon: RefreshCw,
    solutions: [
      'Check internet connection',
      'Reduce file size if too large',
      'Try a different file format',
      'Refresh and try again'
    ]
  },
  network: {
    title: 'Network Error',
    icon: RefreshCw,
    solutions: [
      'Check internet connection',
      'Wait and retry automatically',
      'Switch to different network',
      'Contact support if persistent'
    ]
  }
};

export default function ErrorRecovery({ 
  errors, 
  onRetry, 
  onAutoFix, 
  className = '' 
}: ErrorRecoveryProps) {
  const [processingErrors, setProcessingErrors] = useState<Set<string>>(new Set());

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'outline';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const handleRetry = async (error: ErrorInfo, index: number) => {
    const errorKey = `${error.type}-${index}`;
    setProcessingErrors(prev => new Set(prev).add(errorKey));

    try {
      const success = await onRetry(error.type, error.field);
      if (success) {
        toast.success('Error resolved successfully!');
      } else {
        toast.error('Retry failed. Please try manual fix.');
      }
    } catch (err) {
      toast.error('Retry operation failed');
    } finally {
      setProcessingErrors(prev => {
        const newSet = new Set(prev);
        newSet.delete(errorKey);
        return newSet;
      });
    }
  };

  const handleAutoFix = async (error: ErrorInfo, index: number) => {
    const errorKey = `${error.type}-${index}`;
    setProcessingErrors(prev => new Set(prev).add(errorKey));

    try {
      const success = await onAutoFix(error.type, error.field);
      if (success) {
        toast.success('Auto-fix applied successfully!');
      } else {
        toast.error('Auto-fix failed. Manual correction required.');
      }
    } catch (err) {
      toast.error('Auto-fix operation failed');
    } finally {
      setProcessingErrors(prev => {
        const newSet = new Set(prev);
        newSet.delete(errorKey);
        return newSet;
      });
    }
  };

  const groupedErrors = errors.reduce((acc, error) => {
    if (!acc[error.type]) {
      acc[error.type] = [];
    }
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, ErrorInfo[]>);

  if (errors.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8 text-center">
            <div className="space-y-2">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h3 className="font-medium text-green-900">All Good!</h3>
              <p className="text-sm text-green-700">No errors detected in your form submission.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-600" />
          Smart Error Recovery
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-powered error detection and automatic fixes
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedErrors).map(([errorType, errorList]) => {
          const solutionInfo = ERROR_SOLUTIONS[errorType as keyof typeof ERROR_SOLUTIONS];
          const ErrorIcon = solutionInfo.icon;

          return (
            <div key={errorType} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <ErrorIcon className="h-4 w-4" />
                <h4 className="font-medium">{solutionInfo.title}</h4>
                <Badge variant="outline">{errorList.length}</Badge>
              </div>

              {errorList.map((error, index) => {
                const errorKey = `${error.type}-${index}`;
                const isProcessing = processingErrors.has(errorKey);

                return (
                  <Alert key={index} className="border-l-4 border-l-orange-500">
                    <AlertDescription>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {error.field && (
                                <Badge variant="outline" className="text-xs">
                                  {error.field}
                                </Badge>
                              )}
                              <Badge variant={getSeverityColor(error.severity)} className="text-xs">
                                {error.severity.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium mb-1">{error.message}</p>
                            <p className="text-xs text-muted-foreground">{error.suggestion}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(error, index)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3 mr-1" />
                            )}
                            Retry
                          </Button>

                          {error.autoFixable && (
                            <Button
                              size="sm"
                              onClick={() => handleAutoFix(error, index)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Zap className="h-3 w-3 mr-1 animate-pulse" />
                              ) : (
                                <Zap className="h-3 w-3 mr-1" />
                              )}
                              Auto-Fix
                            </Button>
                          )}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })}

              {/* Solutions */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h5 className="font-medium text-blue-900 text-sm mb-2">💡 Solutions:</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  {solutionInfo.solutions.map((solution, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                      {solution}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}

        {/* Global Actions */}
        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                errors.forEach((error, index) => handleRetry(error, index));
              }}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry All
            </Button>
            
            <Button
              onClick={() => {
                errors.filter(e => e.autoFixable).forEach((error, index) => handleAutoFix(error, index));
              }}
              className="flex-1"
            >
              <Zap className="h-4 w-4 mr-2" />
              Auto-Fix All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}