import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GraduationCap, 
  Briefcase, 
  User, 
  Download, 
  Upload,
  Save,
  Trash2,
  Star,
  Plus,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ProfileTemplate {
  id: string;
  name: string;
  type: 'student' | 'job_seeker' | 'general';
  description: string;
  fields: Record<string, unknown>;
  isStarred: boolean;
  createdAt: string;
  usageCount: number;
}

interface ProfileTemplatesProps {
  onSelectTemplate: (template: ProfileTemplate) => void;
  onSaveTemplate: (template: Omit<ProfileTemplate, 'id' | 'createdAt' | 'usageCount'>) => void;
  templates?: ProfileTemplate[];
}

const DEFAULT_TEMPLATES: ProfileTemplate[] = [
  {
    id: 'student-template',
    name: 'Student Profile',
    type: 'student',
    description: 'Perfect for scholarship applications, college admissions, and student forms',
    fields: {
      category: 'education',
      occupation: 'Student',
      education_level: 'undergraduate',
      institution_type: 'college'
    },
    isStarred: true,
    createdAt: new Date().toISOString(),
    usageCount: 0
  },
  {
    id: 'job-seeker-template',
    name: 'Job Seeker Profile',
    type: 'job_seeker',
    description: 'Ideal for employment applications, job portals, and career services',
    fields: {
      category: 'employment',
      employment_status: 'seeking',
      experience_level: 'entry',
      job_type: 'full_time'
    },
    isStarred: true,
    createdAt: new Date().toISOString(),
    usageCount: 0
  },
  {
    id: 'general-template',
    name: 'General Profile',
    type: 'general',
    description: 'Versatile template for various government and official forms',
    fields: {
      category: 'general',
      purpose: 'official_documentation'
    },
    isStarred: false,
    createdAt: new Date().toISOString(),
    usageCount: 0
  }
];

export const ProfileTemplates = ({ 
  onSelectTemplate, 
  onSaveTemplate,
  templates = DEFAULT_TEMPLATES 
}: ProfileTemplatesProps) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<ProfileTemplate[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const { toast } = useToast();

  const allTemplates = [...templates, ...customTemplates];

  const getTemplateIcon = (type: ProfileTemplate['type']) => {
    switch (type) {
      case 'student':
        return <GraduationCap className="w-5 h-5" />;
      case 'job_seeker':
        return <Briefcase className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getTemplateColor = (type: ProfileTemplate['type']) => {
    switch (type) {
      case 'student':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'job_seeker':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleSelectTemplate = async (template: ProfileTemplate) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access your profiles",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    try {
      setIsNavigating(true);
      // Navigate to profile database for this template type with template context
      navigate(`/profile-database/${template.type}`, { 
        state: { 
          selectedTemplate: template,
          templateContext: true 
        } 
      });
      
      toast({
        title: "Opening Profile Database",
        description: `Loading ${template.name} profiles...`,
      });
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Navigation Error",
        description: "Failed to open profile database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsNavigating(false);
    }
  };

  const handleCreateCustomTemplate = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create custom templates",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    try {
      // Navigate to template creator for new template
      navigate('/template-creator/general');
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Navigation Error", 
        description: "Failed to open template creator. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportTemplate = (template: ProfileTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${template.name.replace(/\s+/g, '_')}_template.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Template Exported",
      description: `${template.name} has been downloaded`,
    });
  };

  // Show loading state while authentication is being determined
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading profile templates...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication required message for non-authenticated users
  if (!user) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access profile templates and create custom profiles.
          </AlertDescription>
        </Alert>
        <div className="flex items-center justify-center py-8">
          <Button onClick={() => navigate('/auth')} className="gap-2">
            <User className="w-4 h-4" />
            Log In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Profile Templates</h3>
          <p className="text-sm text-muted-foreground">
            Choose a template that matches your profile type for faster form filling
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCreateCustomTemplate}
          className="gap-2"
          disabled={isNavigating}
        >
          {isNavigating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Create Custom
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allTemplates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-glow border ${
              selectedTemplate === template.id 
                ? 'border-primary bg-gradient-feature' 
                : 'border-border/50 hover:border-primary/30'
            }`}
            onClick={() => handleSelectTemplate(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${getTemplateColor(template.type)}`}>
                    {getTemplateIcon(template.type)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.isStarred && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportTemplate(template);
                  }}
                  className="p-1 h-auto"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
              
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {template.type.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Used {template.usageCount} times
                </span>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-gradient-button hover:shadow-soft"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTemplate(template);
                  }}
                  disabled={isNavigating}
                >
                  {isNavigating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Use Template'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {allTemplates.length === 0 && (
        <Card className="p-8 text-center border-dashed border-2 border-border/50">
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gradient-feature rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">No Templates Available</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first template to get started with profile-based form filling
              </p>
            </div>
            <Button onClick={handleCreateCustomTemplate} className="gap-2">
              <Plus className="w-4 h-4" />
              Create First Template
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};