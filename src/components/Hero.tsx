import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileText, Zap, Shield, Clock, Users } from "lucide-react";
import heroImage from "@/assets/hero-formmate.jpg";
import { useLanguage } from "@/LanguageSupport";
import { useAuth } from "@/hooks/useAuth";

export const Hero = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              {t("title")}
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("features")}
            </a>
            <a
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("howItWorks")}
            </a>
            <a
              href="#forms"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("supportedForms")}
            </a>
            {!user && (
              <Button variant="outline" size="sm">
                {t("signIn")}
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge
                  variant="secondary"
                  className="bg-accent/10 text-accent border-accent/20 shadow-soft"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  {t("aiPoweredFormAutomation")}
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  <span className="bg-gradient-hero bg-clip-text text-transparent">
                    {t("uploadOnce")}
                  </span>
                  <br />
                  <span className="text-foreground">{t("fillAnywhere")}</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                  {t("hero.subtitle")}
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>{t("hero.bullets.ocr")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>{t("hero.bullets.merge")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>{t("hero.bullets.encryption")}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="text-base font-semibold bg-gradient-button hover:shadow-glow transform hover:scale-105 transition-all duration-300"
                >
                  {t("getStartedFree")}
                  <CheckCircle className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base border-primary/20 hover:bg-primary/5 hover:border-primary/40"
                >
                  {t("watchDemo")}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-6">
                <div className="text-center p-4 rounded-lg bg-gradient-feature border border-primary/10">
                  <div className="text-3xl font-bold bg-gradient-button bg-clip-text text-transparent">
                    {t("hero.stats.aiPowered")}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {t("hero.statsDesc.smartAutomation")}
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gradient-feature border border-accent/10">
                  <div className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                    {t("hero.stats.secure")}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {t("hero.statsDesc.localProcessing")}
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gradient-feature border border-primary/10">
                  <div className="text-3xl font-bold bg-gradient-button bg-clip-text text-transparent">
                    {t("hero.stats.easy")}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {t("hero.statsDesc.quickSetup")}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl"></div>
              <Card className="relative overflow-hidden shadow-elegant">
                <img
                  src={heroImage}
                  alt={t("hero.imageAlt")}
                  className="w-full h-auto rounded-lg"
                />
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="px-6 py-8 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium">
                {t("trust.secureProcessing")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium">
                {t("trust.quickSetup")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium">
                {t("trust.growingCommunity")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium">
                {t("trust.smartTechnology")}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
