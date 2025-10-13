import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import FormSelector from "@/components/FormSelector";
import AIAssistant from "@/components/AIAssistant";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/LanguageSupport";
import { Button } from "@/components/ui/button";
import { LogOut, User, Sparkles, ScanText } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect after loading is complete and we're sure there's no user
    if (!loading && !user) {
      const timer = setTimeout(() => {
        navigate("/auth");
      }, 100); // Small delay to prevent flash
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('loading')}</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth page
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen">
      <header className="bg-background border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">DigitalClerk</h1>
          <div className="flex items-center gap-4">
            <LanguageSelector 
              currentLanguage={language}
              onLanguageChange={(lang: string) => setLanguage(lang as "en" | "hi" | "mr" | "ta")}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/advanced-features')}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {t('advancedFeatures')}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {user.email}
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              {t('signOut')}
            </Button>
          </div>
        </div>
      </header>
      <Hero />
      <Features />
      <FormSelector />
      <AIAssistant />
    </div>
  );
};

export default Index;
