import { useParams } from "react-router-dom";
import DocumentRequirements from "@/components/DocumentRequirements";

// Form titles mapping
const FORM_TITLES = {
  aadhaar: "Aadhaar Application",
  pan: "PAN Card Application", 
  passport: "Passport Application",
  driving: "Driving License Application",
  scholarship: "Scholarship Application",
  gst: "GST Registration"
};

export default function DocumentCollection() {
  const { formType } = useParams<{ formType: string }>();
  
  if (!formType || !(formType in FORM_TITLES)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Form Not Found</h1>
          <p className="text-muted-foreground">The requested form type is not available.</p>
        </div>
      </div>
    );
  }

  const formTitle = FORM_TITLES[formType as keyof typeof FORM_TITLES];

  return (
    <DocumentRequirements 
      formType={formType} 
      formTitle={formTitle}
    />
  );
}