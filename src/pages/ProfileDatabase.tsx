import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProfileStorage } from '@/components/ProfileStorage';
import { ArrowLeft } from 'lucide-react';

export default function ProfileDatabase() {
  const { profileType } = useParams<{ profileType: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedTemplate = location.state?.selectedTemplate;
  const isTemplateContext = location.state?.templateContext;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/advanced-features')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Templates
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Profile Database</h1>
            <p className="text-muted-foreground">
              Create and manage your personal profiles for automatic form filling
            </p>
          </div>
        </div>

        {/* Template Context Banner */}
        {isTemplateContext && selectedTemplate && (
          <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {selectedTemplate.type.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-primary">Using Template: {selectedTemplate.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Storage Component */}
        <ProfileStorage 
          profileType={profileType}
          selectedTemplate={selectedTemplate}
          isTemplateContext={isTemplateContext}
        />
      </div>
    </div>
  );
}