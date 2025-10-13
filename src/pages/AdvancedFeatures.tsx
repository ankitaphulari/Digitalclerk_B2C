import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LanguageSelector from '@/components/LanguageSelector';
import { ProfileTemplates } from '@/components/ProfileTemplates';
import { QRSync } from '@/components/QRSync';
import { DigitalSignature } from '@/components/DigitalSignature';
import { BatchProcessing } from '@/components/BatchProcessing';
import { useLanguage } from '@/LanguageSupport';
import { 
  Globe, 
  User, 
  QrCode, 
  PenTool, 
  Users,
  Shield,
  Settings,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export default function AdvancedFeatures() {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as "en" | "hi" | "mr" | "ta");
  };

  const handleSelectTemplate = (template: unknown) => {
    console.log('Template selected:', template);
    // Handle template selection logic
  };

  const handleSaveTemplate = (template: unknown) => {
    console.log('Template saved:', template);
    // Handle template saving logic
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {t('advancedFeatures')}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {t('powerfulTools')}
                </p>
              </div>
            </div>
            <LanguageSelector 
              currentLanguage={language}
              onLanguageChange={handleLanguageChange}
            />
          </div>
        </div>

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full bg-gradient-feature border border-primary/20">
            <TabsTrigger value="templates" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{t('profileTemplates')}</span>
            </TabsTrigger>
            <TabsTrigger value="signature" className="gap-2">
              <PenTool className="w-4 h-4" />
              <span className="hidden sm:inline">{t('digitalSignature')}</span>
            </TabsTrigger>
            <TabsTrigger value="sync" className="gap-2">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">{t('qrSync')}</span>
            </TabsTrigger>
            <TabsTrigger value="batch" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{t('batchProcessing')}</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{t('language')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t('profileTemplates')}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t('createManageTemplates')}
                </p>
              </CardHeader>
              <CardContent>
                <ProfileTemplates 
                  onSelectTemplate={handleSelectTemplate}
                  onSaveTemplate={handleSaveTemplate}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signature">
            <DigitalSignature />
          </TabsContent>

          <TabsContent value="sync">
            <QRSync />
          </TabsContent>

          <TabsContent value="batch">
            <BatchProcessing />
          </TabsContent>

          <TabsContent value="language">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {t('selectLanguage')}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure language preferences and localization settings
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-base">{t('currentLanguage')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <LanguageSelector 
                          currentLanguage={language}
                          onLanguageChange={handleLanguageChange}
                        />
                      </CardContent>
                    </Card>

                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-base">{t('languageFeatures')}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span>{t('aiAssistantMultiLang')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Settings className="w-4 h-4 text-primary" />
                          <span>{t('localizedFormFields')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-primary" />
                          <span>{t('multiLangOCR')}</span>
                        </div>
                      </CardContent>
                    </Card>
                </div>

                <Card className="bg-gradient-feature border-primary/20">
                  <CardContent className="p-6">
                    <h4 className="font-medium mb-2">{t('supportedLanguages')}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-lg">🇺🇸</span>
                        <span>English</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-lg">🇮🇳</span>
                        <span>हिंदी (Hindi)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-lg">🇮🇳</span>
                        <span>मराठी (Marathi)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-lg">🇮🇳</span>
                        <span>தமிழ் (Tamil)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
