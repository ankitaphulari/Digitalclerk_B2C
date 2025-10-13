import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, 
  Save, 
  Search, 
  Plus, 
  Trash2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText,
  Building,
  GraduationCap,
  Briefcase,
  Globe
} from 'lucide-react';

interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'textarea' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];
  category: 'personal' | 'contact' | 'education' | 'employment' | 'address' | 'documents';
}

interface ProfileTemplate {
  id: string;
  name: string;
  type: 'student' | 'job_seeker' | 'general';
  description: string;
  fields: TemplateField[];
  isStarred: boolean;
  createdAt: string;
  usageCount: number;
}

const FIELD_CATEGORIES = [
  { id: 'personal', label: 'Personal Information', icon: <User className="w-4 h-4" /> },
  { id: 'contact', label: 'Contact Details', icon: <Phone className="w-4 h-4" /> },
  { id: 'address', label: 'Address Information', icon: <MapPin className="w-4 h-4" /> },
  { id: 'education', label: 'Education', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'employment', label: 'Employment', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> }
];

const COMMON_FIELDS: Record<string, TemplateField[]> = {
  personal: [
    {
      id: 'full_name',
      name: 'full_name',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'Enter your full name',
      category: 'personal'
    },
    {
      id: 'first_name',
      name: 'first_name',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'Enter your first name',
      category: 'personal'
    },
    {
      id: 'last_name',
      name: 'last_name',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'Enter your last name',
      category: 'personal'
    },
    {
      id: 'date_of_birth',
      name: 'date_of_birth',
      label: 'Date of Birth',
      type: 'date',
      required: true,
      category: 'personal'
    },
    {
      id: 'gender',
      name: 'gender',
      label: 'Gender',
      type: 'select',
      required: false,
      options: ['Male', 'Female', 'Other', 'Prefer not to say'],
      category: 'personal'
    }
  ],
  contact: [
    {
      id: 'email',
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'your.email@example.com',
      category: 'contact'
    },
    {
      id: 'phone',
      name: 'phone',
      label: 'Phone Number',
      type: 'phone',
      required: true,
      placeholder: '+91 9876543210',
      category: 'contact'
    },
    {
      id: 'alternate_phone',
      name: 'alternate_phone',
      label: 'Alternate Phone',
      type: 'phone',
      required: false,
      placeholder: '+91 9876543210',
      category: 'contact'
    }
  ],
  address: [
    {
      id: 'current_address',
      name: 'current_address',
      label: 'Current Address',
      type: 'textarea',
      required: true,
      placeholder: 'Enter your current address',
      category: 'address'
    },
    {
      id: 'permanent_address',
      name: 'permanent_address',
      label: 'Permanent Address',
      type: 'textarea',
      required: true,
      placeholder: 'Enter your permanent address',
      category: 'address'
    },
    {
      id: 'city',
      name: 'city',
      label: 'City',
      type: 'text',
      required: true,
      placeholder: 'Enter your city',
      category: 'address'
    },
    {
      id: 'state',
      name: 'state',
      label: 'State',
      type: 'text',
      required: true,
      placeholder: 'Enter your state',
      category: 'address'
    },
    {
      id: 'pincode',
      name: 'pincode',
      label: 'PIN Code',
      type: 'text',
      required: true,
      placeholder: '123456',
      category: 'address'
    }
  ],
  education: [
    {
      id: 'education_level',
      name: 'education_level',
      label: 'Education Level',
      type: 'select',
      required: true,
      options: ['10th Grade', '12th Grade', 'Undergraduate', 'Postgraduate', 'PhD', 'Other'],
      category: 'education'
    },
    {
      id: 'institution_name',
      name: 'institution_name',
      label: 'Institution Name',
      type: 'text',
      required: true,
      placeholder: 'Enter your institution name',
      category: 'education'
    },
    {
      id: 'graduation_year',
      name: 'graduation_year',
      label: 'Graduation Year',
      type: 'text',
      required: false,
      placeholder: '2024',
      category: 'education'
    },
    {
      id: 'percentage_cgpa',
      name: 'percentage_cgpa',
      label: 'Percentage/CGPA',
      type: 'text',
      required: false,
      placeholder: '85% or 8.5 CGPA',
      category: 'education'
    }
  ],
  employment: [
    {
      id: 'employment_status',
      name: 'employment_status',
      label: 'Employment Status',
      type: 'select',
      required: true,
      options: ['Student', 'Employed', 'Self-employed', 'Unemployed', 'Retired'],
      category: 'employment'
    },
    {
      id: 'company_name',
      name: 'company_name',
      label: 'Company Name',
      type: 'text',
      required: false,
      placeholder: 'Enter your company name',
      category: 'employment'
    },
    {
      id: 'job_title',
      name: 'job_title',
      label: 'Job Title',
      type: 'text',
      required: false,
      placeholder: 'Enter your job title',
      category: 'employment'
    },
    {
      id: 'annual_income',
      name: 'annual_income',
      label: 'Annual Income',
      type: 'text',
      required: false,
      placeholder: '₹5,00,000',
      category: 'employment'
    }
  ],
  documents: [
    {
      id: 'aadhaar_number',
      name: 'aadhaar_number',
      label: 'Aadhaar Number',
      type: 'text',
      required: false,
      placeholder: '1234 5678 9012',
      category: 'documents'
    },
    {
      id: 'pan_number',
      name: 'pan_number',
      label: 'PAN Number',
      type: 'text',
      required: false,
      placeholder: 'ABCDE1234F',
      category: 'documents'
    },
    {
      id: 'passport_number',
      name: 'passport_number',
      label: 'Passport Number',
      type: 'text',
      required: false,
      placeholder: 'A1234567',
      category: 'documents'
    }
  ]
};

export default function TemplateCreator() {
  const { templateType } = useParams<{ templateType: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [template, setTemplate] = useState<Partial<ProfileTemplate>>({
    name: '',
    type: templateType as any || 'general',
    description: '',
    fields: [],
    isStarred: false
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('personal');
  const [customField, setCustomField] = useState<Partial<TemplateField>>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    category: 'personal'
  });

  const [webSearchResults, setWebSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Set default template data based on type
    if (templateType) {
      const defaultTemplates = {
        student: {
          name: 'Student Profile',
          description: 'Perfect for scholarship applications, college admissions, and student forms',
          fields: [
            ...COMMON_FIELDS.personal,
            ...COMMON_FIELDS.contact,
            ...COMMON_FIELDS.address,
            ...COMMON_FIELDS.education.slice(0, 2)
          ]
        },
        job_seeker: {
          name: 'Job Seeker Profile',
          description: 'Ideal for employment applications, job portals, and career services',
          fields: [
            ...COMMON_FIELDS.personal,
            ...COMMON_FIELDS.contact,
            ...COMMON_FIELDS.address,
            ...COMMON_FIELDS.education.slice(0, 2),
            ...COMMON_FIELDS.employment
          ]
        },
        general: {
          name: 'General Profile',
          description: 'Versatile template for various government and official forms',
          fields: [
            ...COMMON_FIELDS.personal,
            ...COMMON_FIELDS.contact,
            ...COMMON_FIELDS.address,
            ...COMMON_FIELDS.documents
          ]
        }
      };

      const defaultTemplate = defaultTemplates[templateType as keyof typeof defaultTemplates];
      if (defaultTemplate) {
        setTemplate(prev => ({
          ...prev,
          ...defaultTemplate
        }));
      }
    }
  }, [templateType]);

  const handleWebSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Simulate web search for template suggestions
      const searchResults = [
        {
          title: `${templateType} Form Requirements`,
          description: `Common fields required for ${templateType} applications`,
          fields: ['Full Name', 'Date of Birth', 'Contact Information', 'Address']
        },
        {
          title: `Government ${templateType} Templates`,
          description: `Official templates and field requirements`,
          fields: ['Identity Proof', 'Address Proof', 'Income Certificate']
        }
      ];
      
      setWebSearchResults(searchResults);
      toast({
        title: "Search Complete",
        description: `Found ${searchResults.length} relevant templates`,
      });
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Unable to search for templates",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addField = (field: TemplateField) => {
    if (template.fields?.some(f => f.id === field.id)) {
      toast({
        title: "Field Already Added",
        description: "This field is already in your template",
        variant: "destructive",
      });
      return;
    }

    setTemplate(prev => ({
      ...prev,
      fields: [...(prev.fields || []), field]
    }));

    toast({
      title: "Field Added",
      description: `${field.label} has been added to your template`,
    });
  };

  const removeField = (fieldId: string) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields?.filter(f => f.id !== fieldId) || []
    }));
  };

  const addCustomField = () => {
    if (!customField.name || !customField.label) {
      toast({
        title: "Missing Information",
        description: "Please provide field name and label",
        variant: "destructive",
      });
      return;
    }

    const newField: TemplateField = {
      id: `custom_${Date.now()}`,
      name: customField.name!,
      label: customField.label!,
      type: customField.type!,
      required: customField.required!,
      placeholder: customField.placeholder,
      options: customField.options,
      category: customField.category!
    };

    addField(newField);
    setCustomField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      category: 'personal'
    });
  };

  const saveTemplate = () => {
    if (!template.name || !template.description || !template.fields?.length) {
      toast({
        title: "Incomplete Template",
        description: "Please provide name, description, and at least one field",
        variant: "destructive",
      });
      return;
    }

    // Save template logic here
    const savedTemplate: ProfileTemplate = {
      id: `template_${Date.now()}`,
      name: template.name,
      type: template.type as any,
      description: template.description,
      fields: template.fields,
      isStarred: template.isStarred || false,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    // Store in localStorage for now
    const existingTemplates = JSON.parse(localStorage.getItem('custom_templates') || '[]');
    localStorage.setItem('custom_templates', JSON.stringify([...existingTemplates, savedTemplate]));

    toast({
      title: "Template Saved",
      description: `${template.name} has been saved successfully`,
    });

    navigate('/advanced-features');
  };

  const filteredFields = COMMON_FIELDS[activeCategory]?.filter(field =>
    field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/advanced-features')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Advanced Features
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Template Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Template Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={template.name}
                      onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-type">Template Type</Label>
                    <Select
                      value={template.type}
                      onValueChange={(value) => setTemplate(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="job_seeker">Job Seeker</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={template.description}
                    onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe when this template should be used"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Web Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Search Web for Template Ideas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for template requirements..."
                    onKeyPress={(e) => e.key === 'Enter' && handleWebSearch()}
                  />
                  <Button onClick={handleWebSearch} disabled={isSearching} className="gap-2">
                    <Search className="w-4 h-4" />
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                
                {webSearchResults.length > 0 && (
                  <div className="space-y-2">
                    {webSearchResults.map((result, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <h4 className="font-medium">{result.title}</h4>
                        <p className="text-sm text-muted-foreground">{result.description}</p>
                        <div className="flex gap-1 mt-2">
                          {result.fields.map((field: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Field Library */}
            <Card>
              <CardHeader>
                <CardTitle>Field Library</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                  <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
                    {FIELD_CATEGORIES.map((category) => (
                      <TabsTrigger key={category.id} value={category.id} className="text-xs">
                        {category.icon}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {FIELD_CATEGORIES.map((category) => (
                    <TabsContent key={category.id} value={category.id} className="mt-4">
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          {category.icon}
                          {category.label}
                        </h4>
                        <div className="grid gap-2">
                          {filteredFields.map((field) => (
                            <div key={field.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <span className="font-medium">{field.label}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {field.type}
                                </Badge>
                                {field.required && (
                                  <Badge variant="destructive" className="ml-1 text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addField(field)}
                                className="gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Custom Field Creator */}
            <Card>
              <CardHeader>
                <CardTitle>Create Custom Field</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="field-name">Field Name</Label>
                    <Input
                      id="field-name"
                      value={customField.name}
                      onChange={(e) => setCustomField(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="field_name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="field-label">Field Label</Label>
                    <Input
                      id="field-label"
                      value={customField.label}
                      onChange={(e) => setCustomField(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="Field Label"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="field-type">Field Type</Label>
                    <Select
                      value={customField.type}
                      onValueChange={(value) => setCustomField(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="textarea">Textarea</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="field-category">Category</Label>
                    <Select
                      value={customField.category}
                      onValueChange={(value) => setCustomField(prev => ({ ...prev, category: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addCustomField} className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      Add Field
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="field-placeholder">Placeholder (optional)</Label>
                  <Input
                    id="field-placeholder"
                    value={customField.placeholder || ''}
                    onChange={(e) => setCustomField(prev => ({ ...prev, placeholder: e.target.value }))}
                    placeholder="Enter placeholder text"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Template Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">{template.name || 'Untitled Template'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {template.description || 'No description provided'}
                  </p>
                  <Badge variant="outline">{template.type}</Badge>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Fields ({template.fields?.length || 0})</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {template.fields?.map((field) => (
                      <div key={field.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <span className="text-sm font-medium">{field.label}</span>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                            {field.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeField(field.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={saveTemplate} 
                  className="w-full gap-2"
                  disabled={!template.name || !template.description || !template.fields?.length}
                >
                  <Save className="w-4 h-4" />
                  Save Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}