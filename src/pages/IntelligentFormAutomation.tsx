import React, { useEffect, useMemo, useState } from 'react';
import { Search, ExternalLink, Clock, Tag, ArrowRight, ArrowLeft, Home, CheckCircle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DocumentUploadManager from '@/components/DocumentUploadManager';
import SmartFormReview from '@/components/SmartFormReview';
import AIAssistant from '@/components/AIAssistant';
import ProgressTracker from '@/components/ProgressTracker';
import DocumentFormatConverter from '@/components/DocumentFormatConverter';
import ErrorRecovery from '@/components/ErrorRecovery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GOVERNMENT_FORM_MAPPINGS } from '@/utils/GovernmentFormMappings';
import { useAuth } from '@/hooks/useAuth';

interface FormApplication {
  id: string;
  name: string;
  description: string;
  officialUrl: string;
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  requiredDocs?: string[];
}

// Form requirements mapping - Enhanced with detailed categories
const FORM_DOCUMENT_REQUIREMENTS = {
  aadhaar: [
    {
      id: "identity_proof",
      name: "Identity Proof",
      description: "Any one valid document",
      required: true,
      selectOne: true,
      documentType: "Proof of Identity",
      documents: ["Voter ID Card", "Passport", "Driving License", "Ration Card with Photo", "PAN Card"]
    },
    {
      id: "address_proof", 
      name: "Address Proof",
      description: "Any one valid document",
      required: true,
      selectOne: true,
      documentType: "Proof of Address", 
      documents: ["Bank Statement", "Electricity Bill", "Water Bill", "Passport", "Ration Card"]
    },
    {
      id: "dob_proof",
      name: "Date of Birth Proof", 
      description: "Any one valid document",
      required: true,
      selectOne: true,
      documentType: "Date of Birth Proof",
      documents: ["Birth Certificate", "SSC Certificate", "Passport", "PAN Card"]
    }
  ],
  pan: [
    {
      id: "identity_proof",
      name: "Identity Proof",
      description: "Any one valid document",
      required: true,
      selectOne: true,
      documentType: "Proof of Identity",
      documents: ["Aadhaar Card", "Voter ID", "Passport", "Driving License"]
    },
    {
      id: "address_proof",
      name: "Address Proof", 
      description: "Not older than 3 months",
      required: true,
      selectOne: true,
      documentType: "Proof of Address",
      documents: ["Electricity Bill", "Bank Statement", "Aadhaar Card", "Passport"]
    }
  ],
  passport: [
    {
      id: "identity_proof",
      name: "Identity Proof",
      description: "Government issued photo ID",
      required: true,
      selectOne: true, 
      documentType: "Proof of Identity",
      documents: ["Aadhaar Card", "Voter ID", "PAN Card", "Driving License"]
    },
    {
      id: "address_proof",
      name: "Address Proof",
      description: "Current address verification", 
      required: true,
      selectOne: true,
      documentType: "Proof of Address",
      documents: ["Electricity Bill", "Bank Statement", "Aadhaar Card", "Gas Bill"]
    },
    {
      id: "dob_proof",
      name: "Date of Birth Proof",
      description: "Official birth documentation",
      required: true,
      selectOne: true,
      documentType: "Date of Birth Proof", 
      documents: ["Birth Certificate", "SSC Certificate", "Aadhaar Card"]
    }
  ],
  driving: [
    {
      id: "identity_proof",
      name: "Identity Proof",
      description: "Government issued photo ID",
      required: true,
      selectOne: true,
      documentType: "Proof of Identity",
      documents: ["Aadhaar Card", "Voter ID", "PAN Card", "Passport"]
    },
    {
      id: "address_proof",
      name: "Address Proof",
      description: "Current residence verification",
      required: true,
      selectOne: true,
      documentType: "Proof of Address",
      documents: ["Electricity Bill", "Bank Statement", "Aadhaar Card", "Ration Card"]
    },
    {
      id: "age_proof", 
      name: "Age Proof",
      description: "Minimum 18 years for permanent license",
      required: true,
      selectOne: true,
      documentType: "Age Proof",
      documents: ["Birth Certificate", "SSC Certificate", "Aadhaar Card", "Passport"]
    }
  ],
  scholarship: [
    {
      id: "identity_proof",
      name: "Identity Proof", 
      description: "Student identification",
      required: true,
      selectOne: true,
      documentType: "Proof of Identity",
      documents: ["Aadhaar Card", "Student ID", "Voter ID"]
    },
    {
      id: "income_proof",
      name: "Income Certificate",
      description: "Family income verification",
      required: true,
      selectOne: true,
      documentType: "Income Proof",
      documents: ["Income Certificate", "Salary Certificate", "ITR", "BPL Certificate"]
    },
    {
      id: "education_docs",
      name: "Academic Documents",
      description: "Educational certificates",
      required: true,
      selectOne: false,
      documentType: "Education Documents", 
      documents: ["Class 10th Certificate", "Class 12th Certificate", "Current Course Admission Receipt"]
    }
  ],
  gst: [
    {
      id: "business_identity",
      name: "Business Identity",
      description: "Business constitution proof",
      required: true,
      selectOne: false,
      documentType: "Business Identity",
      documents: ["PAN Card", "Aadhaar Card", "Partnership Deed", "Certificate of Incorporation"]
    },
    {
      id: "address_proof",
      name: "Business Address Proof",
      description: "Principal place of business",
      required: true,
      selectOne: true,
      documentType: "Business Address Proof", 
      documents: ["Property Tax Receipt", "Electricity Bill", "Rent Agreement"]
    }
  ]
};

const governmentForms: FormApplication[] = [
  {
    id: 'aadhaar',
    name: 'Aadhaar Card',
    description: 'Apply for new Aadhaar or update existing information',
    officialUrl: 'https://uidai.gov.in/',
    estimatedTime: '30 minutes',
    difficulty: 'Easy',
    category: 'Identity'
  },
  {
    id: 'pan',
    name: 'PAN Card',
    description: 'Apply for Permanent Account Number for tax purposes',
    officialUrl: 'https://www.incometax.gov.in/iec/foportal/',
    estimatedTime: '45 minutes',
    difficulty: 'Medium',
    category: 'Tax'
  },
  {
    id: 'passport',
    name: 'Passport',
    description: 'Apply for Indian passport for international travel',
    officialUrl: 'https://portal2.passportindia.gov.in/',
    estimatedTime: '60 minutes',
    difficulty: 'Hard',
    category: 'Travel'
  },
  {
    id: 'driving',
    name: 'Driving License',
    description: 'Apply for new driving license or renewal',
    officialUrl: 'https://parivahan.gov.in/',
    estimatedTime: '45 minutes',
    difficulty: 'Medium',
    category: 'Transport'
  },
  {
    id: 'gst',
    name: 'GST Registration',
    description: 'Register for Goods and Services Tax',
    officialUrl: 'https://www.gst.gov.in/',
    estimatedTime: '120 minutes',
    difficulty: 'Hard',
    category: 'Business'
  },
  {
    id: 'scholarship',
    name: 'Scholarship Application',
    description: 'Apply for various government scholarship schemes',
    officialUrl: 'https://scholarships.gov.in/',
    estimatedTime: '90 minutes',
    difficulty: 'Hard',
    category: 'Education'
  }
];

export default function IntelligentFormAutomation() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'select' | 'documents' | 'review' | 'complete'>('select');
  const [selectedForm, setSelectedForm] = useState<FormApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [extractedData, setExtractedData] = useState<any>({});
  const [editableData, setEditableData] = useState<Record<string, string>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [documentFiles, setDocumentFiles] = useState<any[]>([]);

  // Preselect when navigated with form parameter and skip to documents
  useEffect(() => {
    const formId = searchParams.get('form');
    if (formId) {
      const found = governmentForms.find(f => f.id === formId);
      if (found) {
        setSelectedForm(found);
        setCurrentStep('documents'); // Skip form selection step
      }
    }
  }, [searchParams]);

  // SEO updates
  useEffect(() => {
    const baseTitle = 'AI Government Form Assistant | DigitalClerk';
    const pageTitle = selectedForm ? `${selectedForm.name} Auto-Fill | DigitalClerk` : baseTitle;
    document.title = pageTitle;

    const desc = selectedForm
      ? `Auto-fill ${selectedForm.name} with AI using Aadhaar, PAN, Passport and more.`
      : 'Upload documents and let AI auto-fill Indian government forms like Aadhaar, PAN, Passport, DL.';
    
    let tag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'description';
      document.head.appendChild(tag);
    }
    tag.content = desc.slice(0, 160);

    const href = window.location.href.split('#')[0];
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = href;
  }, [selectedForm, currentStep]);

  const filteredForms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return governmentForms;
    return governmentForms.filter(
      f =>
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Field name mapping for consistency between extraction and review
  const normalizeExtractedFields = (data: any): Record<string, string> => {
    const fieldMappings: Record<string, string> = {
      'aadhaarNumber': 'aadhaar_number',
      'aadhaar': 'aadhaar_number',
      'panNumber': 'pan_number',
      'pan': 'pan_number',
      'passportNumber': 'passport_number',
      'passport': 'passport_number',
      'dlNumber': 'dl_number',
      'drivingLicense': 'dl_number',
      'fatherName': 'fathers_name',
      'father': 'fathers_name',
      'motherName': 'mothers_name',
      'mother': 'mothers_name',
      'dateOfBirth': 'dob',
      'birth_date': 'dob',
      'phoneNumber': 'phone',
      'mobile': 'phone',
      'maritalStatus': 'marital_status'
    };

    const normalized: Record<string, string> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      // Skip confidence and system fields
      if (key.includes('_confidence') || key === 'qualityScore' || key === 'documentType') return;
      
      if (typeof value === 'string' && value.trim()) {
        // Use mapped field name if available, otherwise use original
        const normalizedKey = fieldMappings[key] || key;
        const trimmedValue = value.trim();
        
        // Take the value with highest confidence if field already exists
        if (normalized[normalizedKey]) {
          // If we already have this field, check if new value is better
          const existingValue = normalized[normalizedKey];
          // For now, prefer longer values (more complete data)
          if (trimmedValue.length > existingValue.length) {
            normalized[normalizedKey] = trimmedValue;
          }
        } else {
          normalized[normalizedKey] = trimmedValue;
        }
      }
    });

    return normalized;
  };

  const handleAllDataExtracted = (combinedData: any) => {
    console.log('Raw combined data from all documents:', combinedData);
    
    // Normalize field names and merge intelligently
    const normalizedData = normalizeExtractedFields(combinedData);
    
    console.log('Normalized and processed data:', normalizedData);
    
    setExtractedData(normalizedData);
    setEditableData(normalizedData);
  };

  const handleInputEdit = (field: string, value: string) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormSelection = (form: FormApplication) => {
    setSelectedForm(form);
    setCurrentStep('documents');
  };

  const handleProceedToReview = () => {
    setCurrentStep('review');
  };

  const handleSubmitForm = () => {
    if (!selectedForm) return;
    
    const formConfig = GOVERNMENT_FORM_MAPPINGS[selectedForm.id as keyof typeof GOVERNMENT_FORM_MAPPINGS];
    const officialUrl = formConfig?.officialWebsites[0]?.url || selectedForm.officialUrl;
    
    // Store form data for Chrome extension
    const formDataForExtension = {
      formType: selectedForm.id,
      data: editableData,
      officialUrl,
      formMapping: formConfig?.formFieldMappings || [],
      userId: user?.id,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('digitalclerk_form_data', JSON.stringify(formDataForExtension));
    
    // Save to user's history
    if (user) {
      const userHistory = JSON.parse(localStorage.getItem('digitalclerk_user_history') || '[]');
      userHistory.push({
        id: Date.now().toString(),
        formType: selectedForm.id,
        formTitle: selectedForm.name,
        completedAt: new Date().toISOString(),
        data: editableData
      });
      localStorage.setItem('digitalclerk_user_history', JSON.stringify(userHistory));
    }
    
    // Redirect to official website
    window.open(officialUrl, '_blank');
    setCurrentStep('complete');
  };

  const getProgressSteps = () => {
    // Skip the 'select' step if form is pre-selected
    const steps = selectedForm && searchParams.get('form') ? [] : [
      {
        id: 'select',
        title: 'Select Form',
        description: 'Choose the government form you want to fill',
        status: (currentStep === 'select' ? 'current' : 
                ['documents', 'review', 'complete'].includes(currentStep) ? 'completed' : 'pending') as 'completed' | 'current' | 'pending' | 'error',
        estimatedTime: '1 min'
      }
    ];

    steps.push(
      {
        id: 'documents',
        title: 'Upload Documents',
        description: 'Upload required documents for data extraction',
        status: (currentStep === 'documents' ? 'current' : 
                ['review', 'complete'].includes(currentStep) ? 'completed' : 'pending') as 'completed' | 'current' | 'pending' | 'error',
        estimatedTime: '5-10 min'
      },
      {
        id: 'review',
        title: 'Review & Complete',
        description: 'Review extracted data and complete the form',
        status: (currentStep === 'review' ? 'current' : 
                currentStep === 'complete' ? 'completed' : 'pending') as 'completed' | 'current' | 'pending' | 'error',
        estimatedTime: '3-5 min'
      },
      {
        id: 'complete',
        title: 'Submit',
        description: 'Submit on official government website',
        status: (currentStep === 'complete' ? 'completed' : 'pending') as 'completed' | 'current' | 'pending' | 'error',
        estimatedTime: '2-3 min'
      }
    );

    return steps.map(step => ({
      ...step,
      completedAt: step.status === 'completed' ? new Date() : undefined
    }));
  };

  const handleErrorRetry = async (errorType: string, field?: string) => {
    // Implement retry logic
    console.log('Retrying error:', errorType, field);
    return true;
  };

  const handleAutoFix = async (errorType: string, field?: string) => {
    // Implement auto-fix logic
    console.log('Auto-fixing error:', errorType, field);
    return true;
  };

  // Redirect to auth if not logged in
  if (!user) {
    window.location.href = '/auth';
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Back Navigation */}
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Forms</span>
            </button>
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Home className="h-3 w-3" />
              <span>/</span>
              {selectedForm && (
                <>
                  <span className="text-foreground font-medium">{selectedForm.name}</span>
                  <span>/</span>
                  <span className="capitalize">{currentStep}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Header Content */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              AI-Powered Government Form Assistant
            </h1>
            <p className="text-xl text-muted-foreground">
              Upload your documents and let AI fill your government forms automatically
            </p>
            {selectedForm && searchParams.get('form') && currentStep !== 'select' && (
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-lg">
                <span className="text-sm font-medium">Selected Form: {selectedForm.name}</span>
                <button 
                  onClick={() => setCurrentStep('select')}
                  className="ml-2 text-xs underline hover:no-underline"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {currentStep === 'select' && (
          <div>
            <div className="max-w-4xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search for government forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredForms.map((form) => (
                <div
                  key={form.id}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 overflow-hidden cursor-pointer"
                  onClick={() => handleFormSelection(form)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {form.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(form.difficulty)}`}>
                        {form.difficulty}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {form.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{form.estimatedTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <span>{form.category}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700">Required Documents:</p>
                      <div className="flex flex-wrap gap-1">
                        {FORM_DOCUMENT_REQUIREMENTS[form.id as keyof typeof FORM_DOCUMENT_REQUIREMENTS]?.map((category, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Click to start application</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'documents' && selectedForm && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setCurrentStep('select')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Forms
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedForm.name}</h2>
                <p className="text-gray-600">Upload your documents for automatic data extraction</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <DocumentUploadManager
                  formType={selectedForm.id}
                  categories={FORM_DOCUMENT_REQUIREMENTS[selectedForm.id as keyof typeof FORM_DOCUMENT_REQUIREMENTS] || []}
                  onDocumentsChange={setUploadedDocuments}
                  onAllDataExtracted={handleAllDataExtracted}
                />

                {documentFiles.length > 0 && (
                  <DocumentFormatConverter
                    documents={documentFiles}
                    onConvertedDocuments={setDocumentFiles}
                    requirements={{
                      maxSize: 5,
                      acceptedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
                      maxDimensions: { width: 2048, height: 2048 }
                    }}
                  />
                )}

                {errors.length > 0 && (
                  <ErrorRecovery
                    errors={errors}
                    onRetry={handleErrorRetry}
                    onAutoFix={handleAutoFix}
                  />
                )}
              </div>

              <div className="space-y-6">
                <ProgressTracker
                  steps={getProgressSteps()}
                  currentStepId={currentStep}
                />
              </div>
            </div>

            {/* Show extracted data summary */}
            {Object.keys(extractedData).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Extracted Data Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(extractedData).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-gray-700">{String(value).substring(0, 20)}{String(value).length > 20 && '...'}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={handleProceedToReview}
                    className="w-full mt-4"
                    disabled={Object.keys(extractedData).length === 0}
                  >
                    Review Extracted Data →
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentStep === 'review' && selectedForm && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setCurrentStep('documents')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Documents
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Review & Submit</h2>
                <p className="text-gray-600">Review the extracted data and proceed to the official website</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SmartFormReview
                  formType={selectedForm.id}
                  formTitle={selectedForm.name}
                  extractedData={extractedData}
                  onDataUpdate={(updatedData) => {
                    setExtractedData(updatedData);
                    const flat: Record<string, string> = {};
                    Object.entries(updatedData).forEach(([k, v]) => {
                      if (typeof v === 'string' && v.trim()) {
                        flat[k] = v.trim();
                      }
                    });
                    setEditableData(flat);
                  }}
                  onSubmit={handleSubmitForm}
                  officialWebsiteUrl={selectedForm.officialUrl}
                />
              </div>

              <div className="space-y-6">
                <ProgressTracker
                  steps={getProgressSteps()}
                  currentStepId={currentStep}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="text-center space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready for Official Submission!</h3>
              <p className="text-gray-600 mb-6">
                Your data has been processed and you've been redirected to the official government portal. 
                Our Chrome extension will help auto-fill the form with your extracted information.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-blue-900 mb-2">🔧 Chrome Extension Guide:</h4>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>• The extension will automatically detect form fields on the official website</li>
                  <li>• It will fill in data extracted from your documents</li>
                  <li>• Any remaining fields will be highlighted for manual completion</li>
                  <li>• Look for the DigitalClerk icon in your browser toolbar for status</li>
                </ul>
              </div>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => {
                    setCurrentStep('select');
                    setSelectedForm(null);
                    setExtractedData({});
                    setEditableData({});
                    setUploadedDocuments([]);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fill Another Form
                </button>
                <button 
                  onClick={() => setCurrentStep('review')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Review
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* AI Assistant - Available on all steps */}
      <AIAssistant
        formType={selectedForm?.id || 'general'}
        extractedData={extractedData}
        onFieldHelp={(field: string, suggestion: string) => {
          console.log('AI help for field:', field, suggestion);
        }}
      />
    </div>
  );
}