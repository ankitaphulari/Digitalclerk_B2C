import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
// import DocumentUpload from '@/components/DocumentUpload';
import { 
  Save, 
  Scan, 
  Upload,
  User, 
  Phone, 
  Mail, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  FileText,
  Eye,
  Edit,
  Trash2,
  Plus,
  Camera
} from 'lucide-react';

interface ProfileData {
  id: string;
  profileType: 'student' | 'job_seeker' | 'general';
  name: string;
  data: Record<string, string>;
  lastUpdated: string;
  isComplete: boolean;
}

interface ProfileField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'textarea' | 'select';
  value?: string;
  required: boolean;
  category: string;
  options?: string[];
}

const PROFILE_SCHEMAS = {
  student: {
    name: 'Student Profile',
    fields: [
      // Personal Information
      { id: 'full_name', name: 'full_name', label: 'Full Name', type: 'text' as const, required: true, category: 'personal' },
      { id: 'first_name', name: 'first_name', label: 'First Name', type: 'text' as const, required: true, category: 'personal' },
      { id: 'last_name', name: 'last_name', label: 'Last Name', type: 'text' as const, required: true, category: 'personal' },
      { id: 'date_of_birth', name: 'date_of_birth', label: 'Date of Birth', type: 'date' as const, required: true, category: 'personal' },
      { id: 'gender', name: 'gender', label: 'Gender', type: 'select' as const, required: false, category: 'personal', options: ['Male', 'Female', 'Other'] },
      { id: 'father_name', name: 'father_name', label: "Father's Name", type: 'text' as const, required: true, category: 'personal' },
      { id: 'mother_name', name: 'mother_name', label: "Mother's Name", type: 'text' as const, required: true, category: 'personal' },
      
      // Contact Information
      { id: 'email', name: 'email', label: 'Email Address', type: 'email' as const, required: true, category: 'contact' },
      { id: 'phone', name: 'phone', label: 'Phone Number', type: 'phone' as const, required: true, category: 'contact' },
      { id: 'alternate_phone', name: 'alternate_phone', label: 'Alternate Phone', type: 'phone' as const, required: false, category: 'contact' },
      
      // Address Information
      { id: 'current_address', name: 'current_address', label: 'Current Address', type: 'textarea' as const, required: true, category: 'address' },
      { id: 'permanent_address', name: 'permanent_address', label: 'Permanent Address', type: 'textarea' as const, required: true, category: 'address' },
      { id: 'city', name: 'city', label: 'City', type: 'text' as const, required: true, category: 'address' },
      { id: 'state', name: 'state', label: 'State', type: 'text' as const, required: true, category: 'address' },
      { id: 'pincode', name: 'pincode', label: 'PIN Code', type: 'text' as const, required: true, category: 'address' },
      
      // Education Information
      { id: 'education_level', name: 'education_level', label: 'Current Education Level', type: 'select' as const, required: true, category: 'education', options: ['10th Grade', '12th Grade', 'Undergraduate', 'Postgraduate', 'PhD'] },
      { id: 'institution_name', name: 'institution_name', label: 'Institution Name', type: 'text' as const, required: true, category: 'education' },
      { id: 'course_name', name: 'course_name', label: 'Course/Stream', type: 'text' as const, required: true, category: 'education' },
      { id: 'year_of_study', name: 'year_of_study', label: 'Year of Study', type: 'text' as const, required: false, category: 'education' },
      { id: 'percentage_cgpa', name: 'percentage_cgpa', label: 'Percentage/CGPA', type: 'text' as const, required: false, category: 'education' },
      { id: 'graduation_year', name: 'graduation_year', label: 'Expected Graduation Year', type: 'text' as const, required: false, category: 'education' },
      
      // Documents
      { id: 'aadhaar_number', name: 'aadhaar_number', label: 'Aadhaar Number', type: 'text' as const, required: false, category: 'documents' },
      { id: 'student_id', name: 'student_id', label: 'Student ID', type: 'text' as const, required: false, category: 'documents' },
      { id: 'roll_number', name: 'roll_number', label: 'Roll Number', type: 'text' as const, required: false, category: 'documents' }
    ] as ProfileField[]
  },
  job_seeker: {
    name: 'Job Seeker Profile',
    fields: [
      // Personal Information
      { id: 'full_name', name: 'full_name', label: 'Full Name', type: 'text' as const, required: true, category: 'personal' },
      { id: 'first_name', name: 'first_name', label: 'First Name', type: 'text' as const, required: true, category: 'personal' },
      { id: 'last_name', name: 'last_name', label: 'Last Name', type: 'text' as const, required: true, category: 'personal' },
      { id: 'date_of_birth', name: 'date_of_birth', label: 'Date of Birth', type: 'date' as const, required: true, category: 'personal' },
      { id: 'gender', name: 'gender', label: 'Gender', type: 'select' as const, required: false, category: 'personal', options: ['Male', 'Female', 'Other'] },
      
      // Contact Information
      { id: 'email', name: 'email', label: 'Email Address', type: 'email', required: true, category: 'contact' },
      { id: 'phone', name: 'phone', label: 'Phone Number', type: 'phone', required: true, category: 'contact' },
      { id: 'linkedin_profile', name: 'linkedin_profile', label: 'LinkedIn Profile', type: 'text', required: false, category: 'contact' },
      
      // Address Information
      { id: 'current_address', name: 'current_address', label: 'Current Address', type: 'textarea', required: true, category: 'address' },
      { id: 'city', name: 'city', label: 'City', type: 'text', required: true, category: 'address' },
      { id: 'state', name: 'state', label: 'State', type: 'text', required: true, category: 'address' },
      { id: 'pincode', name: 'pincode', label: 'PIN Code', type: 'text', required: true, category: 'address' },
      
      // Education Information
      { id: 'highest_education', name: 'highest_education', label: 'Highest Education', type: 'select', required: true, category: 'education', options: ['10th Grade', '12th Grade', 'Diploma', 'Undergraduate', 'Postgraduate', 'PhD'] },
      { id: 'institution_name', name: 'institution_name', label: 'Institution Name', type: 'text', required: true, category: 'education' },
      { id: 'graduation_year', name: 'graduation_year', label: 'Graduation Year', type: 'text', required: true, category: 'education' },
      { id: 'percentage_cgpa', name: 'percentage_cgpa', label: 'Percentage/CGPA', type: 'text', required: false, category: 'education' },
      
      // Employment Information
      { id: 'employment_status', name: 'employment_status', label: 'Employment Status', type: 'select', required: true, category: 'employment', options: ['Employed', 'Unemployed', 'Self-employed', 'Fresher'] },
      { id: 'current_company', name: 'current_company', label: 'Current/Last Company', type: 'text', required: false, category: 'employment' },
      { id: 'job_title', name: 'job_title', label: 'Current/Last Job Title', type: 'text', required: false, category: 'employment' },
      { id: 'work_experience', name: 'work_experience', label: 'Work Experience (Years)', type: 'text', required: false, category: 'employment' },
      { id: 'annual_income', name: 'annual_income', label: 'Annual Income', type: 'text', required: false, category: 'employment' },
      { id: 'skills', name: 'skills', label: 'Key Skills', type: 'textarea', required: false, category: 'employment' },
      
      // Documents
      { id: 'aadhaar_number', name: 'aadhaar_number', label: 'Aadhaar Number', type: 'text', required: false, category: 'documents' },
      { id: 'pan_number', name: 'pan_number', label: 'PAN Number', type: 'text', required: false, category: 'documents' },
      { id: 'passport_number', name: 'passport_number', label: 'Passport Number', type: 'text' as const, required: false, category: 'documents' }
    ] as ProfileField[]
  },
  general: {
    name: 'General Profile',
    fields: [
      // Personal Information
      { id: 'full_name', name: 'full_name', label: 'Full Name', type: 'text' as const, required: true, category: 'personal' },
      { id: 'first_name', name: 'first_name', label: 'First Name', type: 'text', required: true, category: 'personal' },
      { id: 'last_name', name: 'last_name', label: 'Last Name', type: 'text', required: true, category: 'personal' },
      { id: 'date_of_birth', name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true, category: 'personal' },
      { id: 'gender', name: 'gender', label: 'Gender', type: 'select', required: false, category: 'personal', options: ['Male', 'Female', 'Other'] },
      { id: 'father_name', name: 'father_name', label: "Father's Name", type: 'text', required: false, category: 'personal' },
      { id: 'mother_name', name: 'mother_name', label: "Mother's Name", type: 'text', required: false, category: 'personal' },
      { id: 'spouse_name', name: 'spouse_name', label: "Spouse's Name", type: 'text', required: false, category: 'personal' },
      { id: 'marital_status', name: 'marital_status', label: 'Marital Status', type: 'select', required: false, category: 'personal', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
      
      // Contact Information
      { id: 'email', name: 'email', label: 'Email Address', type: 'email', required: true, category: 'contact' },
      { id: 'phone', name: 'phone', label: 'Phone Number', type: 'phone', required: true, category: 'contact' },
      { id: 'alternate_phone', name: 'alternate_phone', label: 'Alternate Phone', type: 'phone', required: false, category: 'contact' },
      
      // Address Information
      { id: 'current_address', name: 'current_address', label: 'Current Address', type: 'textarea', required: true, category: 'address' },
      { id: 'permanent_address', name: 'permanent_address', label: 'Permanent Address', type: 'textarea', required: true, category: 'address' },
      { id: 'city', name: 'city', label: 'City', type: 'text', required: true, category: 'address' },
      { id: 'district', name: 'district', label: 'District', type: 'text', required: false, category: 'address' },
      { id: 'state', name: 'state', label: 'State', type: 'text', required: true, category: 'address' },
      { id: 'pincode', name: 'pincode', label: 'PIN Code', type: 'text', required: true, category: 'address' },
      
      // Documents
      { id: 'aadhaar_number', name: 'aadhaar_number', label: 'Aadhaar Number', type: 'text', required: false, category: 'documents' },
      { id: 'pan_number', name: 'pan_number', label: 'PAN Number', type: 'text', required: false, category: 'documents' },
      { id: 'passport_number', name: 'passport_number', label: 'Passport Number', type: 'text', required: false, category: 'documents' },
      { id: 'driving_license', name: 'driving_license', label: 'Driving License Number', type: 'text', required: false, category: 'documents' },
      { id: 'voter_id', name: 'voter_id', label: 'Voter ID Number', type: 'text' as const, required: false, category: 'documents' }
    ] as ProfileField[]
  }
};

const CATEGORY_ICONS = {
  personal: <User className="w-4 h-4" />,
  contact: <Phone className="w-4 h-4" />,
  address: <MapPin className="w-4 h-4" />,
  education: <GraduationCap className="w-4 h-4" />,
  employment: <Briefcase className="w-4 h-4" />,
  documents: <FileText className="w-4 h-4" />
};

interface ProfileDataManagerProps {
  profileType: 'student' | 'job_seeker' | 'general';
  onSave: (profileData: ProfileData) => void;
  existingProfile?: ProfileData;
}

export const ProfileDataManager = ({ profileType, onSave, existingProfile }: ProfileDataManagerProps) => {
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState('personal');
  const [isScanning, setIsScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);

  const schema = PROFILE_SCHEMAS[profileType];
  const categories = [...new Set(schema.fields.map(f => f.category))];

  useEffect(() => {
    if (existingProfile) {
      setProfileData(existingProfile.data);
      if (existingProfile.data.passport_photo) {
        setPassportPhoto(existingProfile.data.passport_photo);
      }
    }
  }, [existingProfile]);

  const handleFieldChange = (fieldName: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPassportPhoto(result);
        handleFieldChange('passport_photo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentScan = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsScanning(true);
    try {
      // Use the existing OCR service
      const { performOCR } = await import('@/services/performOCR');
      
      for (const file of files) {
        const result = await performOCR(file);
        const extractedText = result.text || '';
        
        // Extract common information patterns
        const extractedData = extractDataFromText(extractedText);
        
        // Update profile data with extracted information
        setProfileData(prev => ({
          ...prev,
          ...extractedData
        }));
        
        toast({
          title: "Data Extracted",
          description: `Successfully extracted information from ${file.name}`,
        });
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: "Extraction Failed",
        description: "Unable to extract data from document",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      setShowScanner(false);
    }
  };

  const extractDataFromText = (text: string): Record<string, string> => {
    const extracted: Record<string, string> = {};
    
    // Email extraction
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) extracted.email = emailMatch[0];
    
    // Phone number extraction
    const phoneMatch = text.match(/(?:\+91|91)?[\s-]?[789]\d{9}/);
    if (phoneMatch) extracted.phone = phoneMatch[0];
    
    // Aadhaar number extraction
    const aadhaarMatch = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
    if (aadhaarMatch) extracted.aadhaar_number = aadhaarMatch[0];
    
    // PAN number extraction
    const panMatch = text.match(/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/);
    if (panMatch) extracted.pan_number = panMatch[0];
    
    // Name extraction (simple heuristic)
    const nameLines = text.split('\n').filter(line => 
      line.trim().length > 2 && 
      line.trim().length < 50 && 
      /^[A-Za-z\s]+$/.test(line.trim())
    );
    if (nameLines.length > 0) {
      extracted.full_name = nameLines[0].trim();
    }
    
    return extracted;
  };

  const calculateCompleteness = () => {
    const requiredFields = schema.fields.filter(f => f.required);
    const filledRequiredFields = requiredFields.filter(f => profileData[f.name]?.trim());
    return Math.round((filledRequiredFields.length / requiredFields.length) * 100);
  };

  const handleSave = () => {
    const completeness = calculateCompleteness();
    
    const savedProfile: ProfileData = {
      id: existingProfile?.id || `profile_${Date.now()}`,
      profileType,
      name: schema.name,
      data: profileData,
      lastUpdated: new Date().toISOString(),
      isComplete: completeness >= 80
    };

    onSave(savedProfile);
    
    toast({
      title: "Profile Saved",
      description: `Your ${schema.name} has been saved (${completeness}% complete)`,
    });
  };

  const renderField = (field: ProfileField) => {
    const value = profileData[field.name] || '';
    
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter your ${field.label.toLowerCase()}`}
            className="min-h-[80px]"
          />
        );
      case 'select':
        return (
          <Select value={value} onValueChange={(value) => handleFieldChange(field.name, value)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter your ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  const getFieldsByCategory = (category: string) => {
    return schema.fields.filter(f => f.category === category);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{schema.name}</h2>
          <p className="text-muted-foreground">
            Complete your profile for faster form filling ({calculateCompleteness()}% complete)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowScanner(true)}
            className="gap-2"
          >
            <Scan className="w-4 h-4" />
            Scan Document
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Profile
          </Button>
        </div>
      </div>

      {/* Document Scanner Modal */}
      {showScanner && (
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-subtle">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Document Scanner
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScanner(false)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Document scanning is now available via Enhanced OCR</p>
              <Button 
                onClick={() => window.open('/enhanced-ocr', '_blank')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Open Enhanced OCR
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Upload documents like Aadhaar, PAN, passport, or certificates to auto-extract information
            </p>
          </CardContent>
        </Card>
      )}

      {/* Profile Form */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="gap-1">
                  {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}
                  <span className="hidden sm:inline">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category} value={category} className="space-y-4 mt-6">
                {/* Photo Upload Section for Personal Tab */}
                {category === 'personal' && (
                  <div className="mb-6">
                    <div className="flex items-center gap-4 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-gradient-subtle">
                      <div className="flex-shrink-0">
                        {passportPhoto || profileData.passport_photo ? (
                          <img
                            src={passportPhoto || profileData.passport_photo}
                            alt="Passport Photo"
                            className="w-24 h-24 object-cover rounded-lg border-2 border-border"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">Passport Photo</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          Upload a passport-sized photo for forms that require it
                        </p>
                        <label htmlFor="photo-upload">
                          <Button variant="outline" size="sm" className="gap-2" asChild>
                            <span>
                              <Upload className="w-4 h-4" />
                              {passportPhoto || profileData.passport_photo ? 'Change Photo' : 'Upload Photo'}
                            </span>
                          </Button>
                        </label>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getFieldsByCategory(category).map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.name} className="flex items-center gap-1">
                        {field.label}
                        {field.required && <span className="text-destructive">*</span>}
                      </Label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((category) => {
              const categoryFields = getFieldsByCategory(category);
              const filledFields = categoryFields.filter(f => profileData[f.name]?.trim());
              const completion = Math.round((filledFields.length / categoryFields.length) * 100);
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-1">
                      {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                    <Badge variant={completion >= 80 ? "default" : completion >= 50 ? "secondary" : "destructive"}>
                      {completion}%
                    </Badge>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filledFields.length}/{categoryFields.length} fields completed
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};