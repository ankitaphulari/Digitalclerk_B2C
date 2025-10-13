import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Search, Shield, Clock, FileText, Lock } from "lucide-react";
import { GOVERNMENT_FORM_MAPPINGS, detectFormTypeFromUrl, getFormConfig } from "@/utils/GovernmentFormMappings";
import { toast } from "sonner";
import { useLanguage } from "@/LanguageSupport";

interface GovernmentFormSelectorProps {
  formType: string;
  onWebsiteSelect: (website: {
    name: string;
    url: string;
    description: string;
    loginRequired: boolean;
    documentTypes: string[];
  }, detectedFormType?: string) => void;
}

export const GovernmentFormSelector = ({ formType, onWebsiteSelect }: GovernmentFormSelectorProps) => {
  const [customUrl, setCustomUrl] = useState("");
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const { t } = useLanguage();

  const config = getFormConfig(formType);

  const handleCustomUrlSubmit = async () => {
    if (!customUrl.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsValidatingUrl(true);
    try {
      // Detect form type from URL
      const detectedType = detectFormTypeFromUrl(customUrl);
      
      if (!detectedType) {
        toast.warning("Could not automatically detect form type from URL. Proceeding with generic form processing.");
      }

      // Create custom website object
      const customWebsite = {
        name: "Custom Form URL",
        url: customUrl,
        description: `Form detected from: ${new URL(customUrl).hostname}`,
        loginRequired: true, // Assume login required for safety
        documentTypes: config?.officialWebsites[0]?.documentTypes || ["Identity Proof", "Address Proof"]
      };

      onWebsiteSelect(customWebsite, detectedType || formType);
      toast.success(`Form URL validated successfully${detectedType ? ` (Detected: ${detectedType})` : ''}`);
    } catch (error) {
      toast.error("Invalid URL format. Please check and try again.");
    } finally {
      setIsValidatingUrl(false);
    }
  };

  if (!config) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <p className="text-destructive">{t('gfs.configNotFound')} {formType}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            {t('gfs.officialWebsites')} - {config.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.officialWebsites.map((website, index) => (
            <Card key={index} className="border-border hover:border-primary transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {website.name}
                        {website.loginRequired && (
                          <Lock className="h-4 w-4 text-yellow-600" />
                        )}
                      </h3>
                      <p className="text-muted-foreground text-sm">{website.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                      <span className="font-mono text-xs">{website.url}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {website.documentTypes.map((docType, docIndex) => (
                        <Badge key={docIndex} variant="secondary" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          {docType}
                        </Badge>
                      ))}
                    </div>
                    
                    {website.loginRequired && (
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{t('gfs.loginRequiredHint')}</span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => onWebsiteSelect(website)}
                    className="ml-4"
                    size="sm"
                  >
                    {t('gfs.selectWebsite')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-green-600" />
            {t('gfs.searchByCustomUrl')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customUrl">
              {t('gfs.pasteAnyUrl')}
            </Label>
            <div className="flex gap-2">
              <Input
                id="customUrl"
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder={t('gfs.urlPlaceholder')}
                className="flex-1"
              />
              <Button 
                onClick={handleCustomUrlSubmit}
                disabled={isValidatingUrl || !customUrl.trim()}
                size="sm"
              >
                {isValidatingUrl ? t('gfs.validating') : t('gfs.detectForm')}
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>{t('gfs.tipLabel')}</strong> {t('gfs.tipText')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};