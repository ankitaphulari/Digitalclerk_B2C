import React from 'react';
import { CheckCircle, Circle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Step {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'error';
  estimatedTime?: string;
  completedAt?: Date;
}

interface ProgressTrackerProps {
  steps: Step[];
  currentStepId: string;
  className?: string;
}

export default function ProgressTracker({ steps, currentStepId, className = '' }: ProgressTrackerProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStepId);
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const getStepIcon = (step: Step) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepColor = (step: Step) => {
    switch (step.status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'current':
        return 'border-blue-200 bg-blue-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusBadge = (step: Step) => {
    switch (step.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'current':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Form Progress</span>
          <Badge variant="outline">
            {completedSteps}/{totalSteps} Steps
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${getStepColor(step)} ${
                step.status === 'current' ? 'ring-2 ring-blue-200' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm">{step.title}</h4>
                    {getStatusBadge(step)}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {step.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {step.estimatedTime && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{step.estimatedTime}</span>
                      </div>
                    )}
                    
                    {step.completedAt && (
                      <div className="text-xs text-green-600">
                        Completed at {step.completedAt.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-4 bg-gray-300"></div>
              )}
            </div>
          ))}
        </div>

        {/* Next Step Hint */}
        {currentStepIndex < steps.length - 1 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <h5 className="font-medium text-blue-900 text-sm mb-1">Next Step:</h5>
            <p className="text-blue-800 text-xs">
              {steps[currentStepIndex + 1]?.title} - {steps[currentStepIndex + 1]?.description}
            </p>
          </div>
        )}

        {/* Completion Message */}
        {completedSteps === totalSteps && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium text-sm">All steps completed!</span>
            </div>
            <p className="text-green-700 text-xs mt-1">
              Your form is ready for submission to the official website.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}