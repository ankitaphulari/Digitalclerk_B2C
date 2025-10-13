// Processing status component with detailed progress steps
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, Upload, ScanText, Brain, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProcessingStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
}

interface ProcessingStatusProps {
  steps: ProcessingStep[];
  currentStep: string;
  overallProgress: number;
  processingTime?: number;
  error?: string;
}

const STEP_ICONS = {
  upload: Upload,
  ocr: ScanText,
  extraction: Brain,
  validation: FileCheck
};

export function ProcessingStatus({
  steps,
  currentStep,
  overallProgress,
  processingTime,
  error
}: ProcessingStatusProps) {
  const getStepIcon = (stepId: string, status: ProcessingStep['status']) => {
    const IconComponent = STEP_ICONS[stepId as keyof typeof STEP_ICONS] || Clock;
    
    if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === 'error') return <AlertCircle className="h-5 w-5 text-red-600" />;
    if (status === 'processing') return (
      <div className="relative">
        <IconComponent className="h-5 w-5 text-blue-600" />
        <div className="absolute inset-0 animate-ping">
          <IconComponent className="h-5 w-5 text-blue-400 opacity-75" />
        </div>
      </div>
    );
    
    return <IconComponent className="h-5 w-5 text-gray-400" />;
  };

  const getStepStatus = (stepId: string, status: ProcessingStep['status']) => {
    if (status === 'completed') return 'bg-green-50 border-green-200';
    if (status === 'error') return 'bg-red-50 border-red-200';
    if (status === 'processing') return 'bg-blue-50 border-blue-200 animate-pulse';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanText className="h-5 w-5" />
          Document Processing
        </CardTitle>
        {processingTime && (
          <p className="text-sm text-gray-600">
            Processing time: {(processingTime / 1000).toFixed(1)}s
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Processing Error</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Processing Steps */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Processing Steps</h3>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border transition-all duration-300",
                  getStepStatus(step.id, step.status)
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step.id, step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{step.label}</h4>
                    {step.duration && step.status === 'completed' && (
                      <span className="text-xs text-gray-500">
                        {(step.duration / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  
                  {/* Step Progress Indicator */}
                  {step.status === 'processing' && (
                    <div className="mt-2">
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '70%' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        {currentStep && !error && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Processing Tips:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              {currentStep === 'upload' && (
                <p>• Uploading your document securely to our servers</p>
              )}
              {currentStep === 'ocr' && (
                <>
                  <p>• Using Google Cloud Vision AI for text recognition</p>
                  <p>• Processing may take 5-15 seconds for high-quality extraction</p>
                </>
              )}
              {currentStep === 'extraction' && (
                <>
                  <p>• Analyzing document structure and extracting fields</p>
                  <p>• Calculating confidence scores for each field</p>
                </>
              )}
              {currentStep === 'validation' && (
                <>
                  <p>• Validating extracted information</p>
                  <p>• Preparing results for your review</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Completion Message */}
        {overallProgress === 100 && !error && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Processing Complete!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Document has been successfully processed. You can now review the extracted information.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}