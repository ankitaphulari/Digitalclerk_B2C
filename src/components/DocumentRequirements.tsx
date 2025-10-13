import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
// import MultiSectionUpload from "@/components/MultiSectionUpload";
import { 
  FileText, 
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

// Comprehensive document requirements mapping based on official government sources
const DOCUMENT_REQUIREMENTS = {
  aadhaar: {
    categories: [
      {
        id: "identity_proof",
        name: "Identity Proof",
        description: "Any one valid document",
        required: true,
        selectOne: true,
        documentType: "Proof of Identity",
        documents: [
          "Voter ID Card",
          "Passport",
          "Driving License",
          "Ration Card with Photo",
          "PAN Card",
          "Central/State Government Photo ID",
          "Pensioner Card with Photo",
          "Arms License"
        ]
      },
      {
        id: "address_proof",
        name: "Address Proof", 
        description: "Any one valid document",
        required: true,
        selectOne: true,
        documentType: "Proof of Address",
        documents: [
          "Passport",
          "Bank Statement (not older than 3 months)",
          "Post Office Account Passbook",
          "Ration Card",
          "Voter ID Card",
          "Driving License",
          "Electricity Bill (not older than 3 months)",
          "Water Bill (not older than 3 months)",
          "Telephone Bill (not older than 3 months)",
          "Property Tax Assessment",
          "Gas Connection Bill",
          "Registered Rent Agreement",
          "Employer Certificate with Address"
        ]
      },
      {
        id: "dob_proof",
        name: "Date of Birth Proof",
        description: "Any one valid document", 
        required: true,
        selectOne: true,
        documentType: "Date of Birth Proof",
        documents: [
          "Birth Certificate (Municipal/Registrar)",
          "SSC/10th Certificate",
          "Passport",
          "PAN Card",
          "Driving License",
          "Voter ID Card",
          "Pension Payment Order",
          "Marriage Certificate (Registrar Office)"
        ]
      }
    ]
  },
  pan: {
    categories: [
      {
        id: "identity_proof",
        name: "Identity Proof",
        description: "Any one valid document (for Indian Citizens)",
        required: true,
        selectOne: true,
        documentType: "Proof of Identity",
        documents: [
          "Voter ID Card",
          "Passport",
          "Aadhaar Card",
          "Ration Card with Photo",
          "Driving License",
          "Central/State Government Photo ID",
          "Bank Certificate with Photo and Account Details",
          "Arms License",
          "Pensioner Card with Photo"
        ]
      },
      {
        id: "address_proof",
        name: "Address Proof",
        description: "Any one valid document (not older than 3 months)",
        required: true,
        selectOne: true,
        documentType: "Proof of Address",
        documents: [
          "Electricity Bill",
          "Telephone Bill (Landline)",
          "Broadband Connection Bill",
          "Voter ID Card with Photo",
          "Aadhaar Card",
          "Passport",
          "Bank Statement",
          "Credit Card Statement",
          "Post Office Passbook",
          "Property Tax Assessment",
          "Driving License",
          "Government Allotment Letter (not older than 3 years)",
          "Property Registration Documents"
        ]
      },
      {
        id: "dob_proof",
        name: "Date of Birth Proof",
        description: "Any one valid document",
        required: true,
        selectOne: true,
        documentType: "Date of Birth Proof",
        documents: [
          "Birth Certificate (Municipal Authority)",
          "SSC/10th Certificate",
          "Aadhaar Card",
          "Driving License",
          "Passport",
          "Marriage Certificate (Registrar Office)",
          "Pension Payment Order",
          "Central/State Government Photo ID with DOB"
        ]
      }
    ]
  },
  passport: {
    categories: [
      {
        id: "identity_proof",
        name: "Identity Proof",
        description: "Any one valid document",
        required: true,
        selectOne: true,
        documentType: "Proof of Identity",
        documents: [
          "Aadhaar Card",
          "Voter ID Card",
          "PAN Card",
          "Driving License",
          "Government Employee ID",
          "PSU Employee ID"
        ]
      },
      {
        id: "address_proof",
        name: "Address Proof",
        description: "Any one valid document (current address)", 
        required: true,
        selectOne: true,
        documentType: "Proof of Address",
        documents: [
          "Aadhaar Card",
          "Electricity Bill (not older than 3 months)",
          "Water Bill (not older than 3 months)",
          "Telephone Bill (not older than 3 months)",
          "Bank Passbook/Statement (not older than 3 months)",
          "Gas Connection Bill",
          "Income Tax Assessment Order",
          "Property Registration Documents",
          "Rent Receipt with Revenue Stamp",
          "Employer Certificate"
        ]
      },
      {
        id: "dob_proof",
        name: "Date of Birth Proof",
        description: "Any one valid document",
        required: true,
        selectOne: true,
        documentType: "Date of Birth Proof",
        documents: [
          "Birth Certificate",
          "SSC/10th Certificate",
          "Aadhaar Card",
          "PAN Card",
          "Driving License",
          "Policy Bond with DOB",
          "Pension Payment Order",
          "Income Tax Assessment Order"
        ]
      }
    ]
  },
  driving: {
    categories: [
      {
        id: "identity_proof",
        name: "Identity Proof",
        description: "Any one valid document",
        required: true,
        selectOne: true,
        documentType: "Proof of Identity",
        documents: [
          "Aadhaar Card",
          "Voter ID Card",
          "PAN Card",
          "Passport", 
          "Ration Card with Photo",
          "Employee ID (Government/PSU)",
          "Student ID Card (with Photo)"
        ]
      },
      {
        id: "address_proof",
        name: "Address Proof",
        description: "Any one valid document",
        required: true,
        selectOne: true,
        documentType: "Proof of Address",
        documents: [
          "Aadhaar Card",
          "Voter ID Card",
          "Passport",
          "Ration Card",
          "Electricity Bill (not older than 2 months)",
          "Telephone Bill (not older than 2 months)",
          "Bank Passbook/Statement",
          "Water Bill",
          "Gas Connection Bill",
          "Property Documents",
          "Rent Agreement with Revenue Stamp"
        ]
      },
      {
        id: "age_proof",
        name: "Age Proof",
        description: "Any one valid document (minimum 18 years for permanent license)",
        required: true,
        selectOne: true,
        documentType: "Age Proof",
        documents: [
          "Birth Certificate",
          "SSC/10th Certificate",
          "Aadhaar Card",
          "Passport",
          "PAN Card",
          "Voter ID Card",
          "School Leaving Certificate"
        ]
      }
    ]
  },
  scholarship: {
    categories: [
      {
        id: "identity_proof",
        name: "Identity Proof",
        description: "Any one valid document",
        required: true,
        selectOne: true,
        documentType: "Proof of Identity",
        documents: [
          "Aadhaar Card",
          "Voter ID Card",
          "PAN Card",
          "Passport",
          "Driving License",
          "Ration Card with Photo"
        ]
      },
      {
        id: "address_proof",
        name: "Address Proof",
        description: "Any one valid document",
        required: true,
        selectOne: true,
        documentType: "Proof of Address",
        documents: [
          "Aadhaar Card",
          "Voter ID Card",
          "Ration Card",
          "Electricity Bill (not older than 3 months)",
          "Bank Statement",
          "Property Documents",
          "Rent Agreement"
        ]
      },
      {
        id: "income_proof",
        name: "Income Certificate",
        description: "Family income proof (mandatory)",
        required: true,
        selectOne: true,
        documentType: "Income Proof",
        documents: [
          "Income Certificate from Tehsildar/Revenue Department",
          "Salary Certificate from Employer",
          "Income Tax Return (ITR)",
          "Form 16 (for salaried)",
          "BPL Certificate (if applicable)",
          "Agricultural Income Certificate"
        ]
      },
      {
        id: "education_docs",
        name: "Academic Documents",
        description: "Educational certificates and current enrollment proof",
        required: true,
        selectOne: false,
        documentType: "Education Documents",
        documents: [
          "Class 10th Marksheet and Certificate",
          "Class 12th Marksheet and Certificate", 
          "Current Course Admission Receipt",
          "College/Institution ID Card",
          "Bonafide Certificate from Current Institution",
          "Fee Receipt of Current Academic Year",
          "Degree/Diploma Certificate (if applicable)"
        ]
      },
      {
        id: "caste_category",
        name: "Caste/Category Certificate",
        description: "If applicable for reserved categories",
        required: false,
        selectOne: true,
        documentType: "Category Certificate",
        documents: [
          "SC Certificate",
          "ST Certificate",
          "OBC Certificate",
          "EWS Certificate",
          "Minority Certificate",
          "Disability Certificate (if applicable)"
        ]
      }
    ]
  },
  gst: {
    categories: [
      {
        id: "business_identity",
        name: "Business Identity Documents",
        description: "PAN and business constitution proof",
        required: true,
        selectOne: false,
        documentType: "Business Identity",
        documents: [
          "PAN Card of Business/Proprietor",
          "Aadhaar Card of Authorized Signatory",
          "Partnership Deed (for partnerships)",
          "Certificate of Incorporation (for companies)",
          "Memorandum of Association (for companies)",
          "Articles of Association (for companies)",
          "Board Resolution (for companies)",
          "LLP Agreement (for LLPs)"
        ]
      },
      {
        id: "address_proof",
        name: "Business Address Proof",
        description: "Principal place of business address",
        required: true,
        selectOne: true,
        documentType: "Business Address Proof",
        documents: [
          "Property Tax Receipt",
          "Municipal Khata Copy",
          "Electricity Bill of Business Premises",
          "Water Bill of Business Premises",
          "Ownership Deed/Document (for owned property)",
          "Registered Rent/Lease Agreement",
          "NOC from Property Owner (for consent arrangements)"
        ]
      },
      {
        id: "bank_details",
        name: "Bank Account Details",
        description: "Business bank account proof",
        required: true,
        selectOne: true,
        documentType: "Bank Account Proof",
        documents: [
          "Cancelled Cheque of Business Account",
          "Bank Passbook (first and last page)",
          "Bank Statement (first and last page)",
          "Bank Account Opening Letter"
        ]
      },
      {
        id: "identity_directors",
        name: "Identity of Directors/Partners",
        description: "For all directors/partners/authorized signatories",
        required: true,
        selectOne: false,
        documentType: "Personal Identity",
        documents: [
          "PAN Card of All Directors/Partners",
          "Aadhaar Card of All Directors/Partners",
          "Passport Size Photograph (JPEG format, max 100KB)",
          "Address Proof of All Directors/Partners",
          "Appointment Letter of Authorized Signatory"
        ]
      }
    ]
  }
};

interface DocumentRequirementsProps {
  formType: string;
  formTitle: string;
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

interface UploadedFile {
  id?: string;
  name?: string;
  type?: string;
  status?: 'pending' | 'complete' | 'failed';
}

// Define a SectionResult shape for stored upload results
interface SectionResult {
  files?: UploadedFile[];
  [key: string]: unknown;
}

type SectionResultsMap = Record<string, SectionResult>;

// Component wrapper and hooks
const DocumentRequirements = ({ formType, formTitle }: DocumentRequirementsProps) => {
  const [sectionResults, setSectionResults] = useState<SectionResultsMap>({});
  const requiredSections = ["identity_documents", "address_documents"];
  const totalRequired = requiredSections.length;
  const uploadedRequired = requiredSections.filter(id =>
    Array.isArray(sectionResults[id]?.files) &&
    (sectionResults[id]?.files as UploadedFile[]).some((f: UploadedFile) => f.status === 'complete')
  ).length;
  const progress = totalRequired > 0 ? (uploadedRequired / totalRequired) * 100 : 0;
  const navigate = useNavigate();
  const formConfig = DOCUMENT_REQUIREMENTS[formType as keyof typeof DOCUMENT_REQUIREMENTS];
  const categories = formConfig?.categories || [];

  // Upload success handled via MultiSectionUpload updates

  const canProceed = uploadedRequired === totalRequired;

  const handleProceed = () => {
    // Navigate to the actual form with uploaded document data
    navigate(`/${formType}`, { 
      state: { 
        uploadedDocuments: sectionResults,
        documentsCollected: true 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Forms
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{formTitle} - Document Collection</h1>
            <p className="text-sm text-muted-foreground">
              Upload required documents before starting the application
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Progress Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Collection Progress
                </CardTitle>
                <CardDescription>
                  {uploadedRequired} of {totalRequired} required documents uploaded
                </CardDescription>
              </div>
              <Badge variant={canProceed ? "default" : "secondary"}>
                {Math.round(progress)}% Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
          </CardContent>
        </Card>

        {/* Document Requirements */}
        <div className="space-y-6">
          <Card>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Document upload functionality is now available via Enhanced OCR Demo. Please visit /enhanced-ocr to upload documents.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Ready to proceed?</h3>
                <p className="text-sm text-muted-foreground">
                  {canProceed 
                    ? "All required documents have been uploaded. You can now proceed to fill the form."
                    : `Please upload all required documents (${uploadedRequired}/${totalRequired} completed)`
                  }
                </p>
              </div>
              
              <Button 
                onClick={handleProceed}
                disabled={!canProceed}
                className="gap-2"
              >
                {canProceed ? (
                  <>
                    Proceed to Form
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    Upload Required Documents
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentRequirements;