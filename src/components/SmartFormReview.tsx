import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  Edit3, 
  Save, 
  ExternalLink,
  Brain,
  Shield,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface ExtractedField {
  value: string;
  confidence: number;
  source: string;
  aiSuggestion?: string;
  isEdited?: boolean;
}

interface FieldConfig {
  label: string;
  type: string;
  required: boolean;
  aiHelp: string;
  options?: string[];
}

interface SmartFormReviewProps {
  formType: string;
  formTitle: string;
  extractedData: Record<string, any>;
  onDataUpdate: (updatedData: Record<string, any>) => void;
  onSubmit: () => void;
  officialWebsiteUrl?: string;
}

// Define field configurations for better UX
const FIELD_CONFIGS: Record<string, FieldConfig> = {
  name: { label: 'Full Name', type: 'text', required: true, aiHelp: 'Enter your complete name as it appears on official documents' },
  dob: { label: 'Date of Birth', type: 'date', required: true, aiHelp: 'Format: DD/MM/YYYY or DD-MM-YYYY' },
  address: { label: 'Address', type: 'textarea', required: true, aiHelp: 'Complete residential address with pincode' },
  phone: { label: 'Phone Number', type: 'tel', required: false, aiHelp: '10-digit mobile number' },
  email: { label: 'Email Address', type: 'email', required: false, aiHelp: 'Valid email address for communication' },
  aadhaar_number: { label: 'Aadhaar Number', type: 'text', required: false, aiHelp: '12-digit unique identification number' },
  pan_number: { label: 'PAN Number', type: 'text', required: false, aiHelp: '10-character permanent account number' },
  passport_number: { label: 'Passport Number', type: 'text', required: false, aiHelp: '8-character passport number' },
  dl_number: { label: 'Driving License Number', type: 'text', required: false, aiHelp: 'State-specific license number format' },
  fathers_name: { label: "Father's Name", type: 'text', required: false, aiHelp: 'Full name of father as per documents' },
  mothers_name: { label: "Mother's Name", type: 'text', required: false, aiHelp: 'Full name of mother as per documents' },
  gender: { label: 'Gender', type: 'select', required: false, options: ['Male', 'Female', 'Other'], aiHelp: 'Select your gender' },
  marital_status: { label: 'Marital Status', type: 'select', required: false, options: ['Single', 'Married', 'Divorced', 'Widowed'], aiHelp: 'Current marital status' }
};

export default function SmartFormReview({ 
  formType, 
  formTitle, 
  extractedData, 
  onDataUpdate, 
  onSubmit,
  officialWebsiteUrl 
}: SmartFormReviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, ExtractedField>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form data from extracted data
  useEffect(() => {
    console.log('SmartFormReview received extractedData:', extractedData);
    
    const processedData: Record<string, ExtractedField> = {};
    
    if (extractedData && typeof extractedData === 'object') {
      Object.entries(extractedData).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          // Determine confidence based on data quality
          let confidence = 85; // Default confidence
          
          // Higher confidence for well-formatted data
          if (key === 'aadhaar_number' && /^\d{4}\s?\d{4}\s?\d{4}$/.test(value.replace(/\s/g, ''))) {
            confidence = 95;
          } else if (key === 'pan_number' && /^[A-Z]{5}\d{4}[A-Z]$/.test(value.replace(/\s/g, '').toUpperCase())) {
            confidence = 95;
          } else if (key === 'phone' && /^\d{10}$/.test(value.replace(/\D/g, ''))) {
            confidence = 90;
          } else if (key === 'email' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            confidence = 90;
          }
          
          processedData[key] = {
            value: value.trim(),
            confidence,
            source: 'document_ocr',
            isEdited: false
          };
        }
      });
    }

    console.log('Processed form data for review:', processedData);
    setFormData(processedData);
  }, [extractedData]);

  // Calculate completion score
  const calculateCompletionScore = () => {
    const requiredFields = Object.entries(FIELD_CONFIGS).filter(([_, config]) => config.required);
    const filledRequired = requiredFields.filter(([field]) => 
      formData[field]?.value && formData[field].value.trim()
    );
    return requiredFields.length > 0 ? (filledRequired.length / requiredFields.length) * 100 : 0;
  };

  // Validate field
  const validateField = (field: string, value: string): string | null => {
    const config = FIELD_CONFIGS[field as keyof typeof FIELD_CONFIGS];
    
    if (config?.required && !value.trim()) {
      return `${config.label} is required`;
    }

    // Specific validations
    switch (field) {
      case 'name':
        const trimmedName = value.trim();
        if (value && !/^[A-Za-z]+( [A-Za-z]+)*$/.test(trimmedName)) {
          return 'Name should contain only letters and single spaces between words';
        }
        break;
      case 'fathers_name':
      case 'mothers_name':
        const trimmedParentName = value.trim();
        if (value && !/^[A-Za-z]+( [A-Za-z]+)*$/.test(trimmedParentName)) {
          return 'Name should contain only letters and single spaces between words';
        }
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (value && !/^\d{10}$/.test(value.replace(/\D/g, ''))) {
          return 'Please enter a valid 10-digit phone number';
        }
        break;
      case 'aadhaar_number':
        if (value && !/^\d{4}\s?\d{4}\s?\d{4}$/.test(value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim())) {
          return 'Please enter a valid 12-digit Aadhaar number';
        }
        break;
      case 'pan_number':
        if (value && !/^[A-Z]{5}\d{4}[A-Z]$/.test(value.replace(/\s/g, '').toUpperCase())) {
          return 'Please enter a valid PAN number (e.g., ABCDE1234F)';
        }
        break;
      case 'address':
        const trimmedAddress = value.trim();
        if (value && trimmedAddress.length < 10) {
          return 'Address should be at least 10 characters long';
        }
        break;
    }

    return null;
  };

  const handleFieldUpdate = (field: string, value: string) => {
    const error = validateField(field, value);
    
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
        isEdited: true,
        confidence: prev[field]?.confidence || 100 // User input has high confidence
      }
    }));

    setValidationErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));

    // Update parent component with properly formatted value
    let processedValue = value;
    
    // Only trim leading/trailing spaces for text fields, preserve internal spaces
    if (['name', 'fathers_name', 'mothers_name', 'address'].includes(field)) {
      processedValue = value.trim();
    }
    
    const updatedData = { ...extractedData, [field]: processedValue };
    onDataUpdate(updatedData);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return 'High';
    if (confidence >= 70) return 'Medium';
    return 'Low';
  };

  const completionScore = calculateCompletionScore();
  const hasErrors = Object.values(validationErrors).some(error => error);
  const canSubmit = completionScore >= 80 && !hasErrors;

  return (
    <div className="space-y-6">
      {/* Header with completion status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Review & Complete Your {formTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Form Completion</span>
              <span className="text-sm font-medium">{Math.round(completionScore)}%</span>
            </div>
            <Progress value={completionScore} className="h-2" />
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>AI Verified</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-green-600" />
                <span>Auto-filled from documents</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(FIELD_CONFIGS).map(([field, config]) => {
          const fieldData = formData[field];
          const hasError = validationErrors[field];
          const isEditing = editingField === field;

          return (
            <Card key={field} className={hasError ? 'border-red-200' : ''}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">
                      {config.label}
                      {config.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {fieldData && (
                      <Badge 
                        variant="outline" 
                        className={getConfidenceColor(fieldData.confidence)}
                      >
                        {getConfidenceBadge(fieldData.confidence)}
                      </Badge>
                    )}
                  </div>

                  {config.type === 'textarea' ? (
                    <Textarea
                      value={fieldData?.value || ''}
                      onChange={(e) => handleFieldUpdate(field, e.target.value)}
                      placeholder={config.aiHelp}
                      className={hasError ? 'border-red-300' : ''}
                      rows={3}
                    />
                  ) : config.type === 'select' ? (
                    <select
                      value={fieldData?.value || ''}
                      onChange={(e) => handleFieldUpdate(field, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${hasError ? 'border-red-300' : 'border-gray-300'}`}
                    >
                      <option value="">Select {config.label}</option>
                      {config.options?.map((option: string) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={config.type}
                      value={fieldData?.value || ''}
                      onChange={(e) => handleFieldUpdate(field, e.target.value)}
                      placeholder={config.aiHelp}
                      className={hasError ? 'border-red-300' : ''}
                    />
                  )}

                  {hasError && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {hasError}
                    </p>
                  )}

                  {fieldData?.isEdited && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <Edit3 className="h-3 w-3" />
                      Manually edited
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">{config.aiHelp}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completionScore < 80 && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Please fill in more required fields to improve form completion score.
                </p>
              </div>
            )}
            
            {Object.entries(validationErrors).filter(([_, error]) => error).length > 0 && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-800">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Please fix validation errors before submitting.
                </p>
              </div>
            )}

            {canSubmit && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Your form is ready for submission! All required fields are completed.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex-1"
          size="lg"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Proceed to Official Website
        </Button>
        
        {officialWebsiteUrl && (
          <Button
            variant="outline"
            onClick={() => window.open(officialWebsiteUrl, '_blank')}
            size="lg"
          >
            Preview Official Site
          </Button>
        )}
      </div>

      {/* Form Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🚀 What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your browser will open the official government website</li>
              <li>• Our Chrome extension will automatically fill the form with your data</li>
              <li>• You'll review and submit the form on the official site</li>
              <li>• Any fields our AI couldn't fill will be highlighted for manual completion</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}