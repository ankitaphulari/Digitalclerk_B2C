import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Brain, 
  FileImage, 
  Zap, 
  Shield, 
  Languages, 
  Database,
  ScanLine,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useLanguage } from "@/LanguageSupport";

export const Features = () => {
  const { t } = useLanguage();
  
  const features = [
    {
      icon: FileImage,
      title: t('featuresSection.features.uploadOnce.title'),
      description: t('featuresSection.features.uploadOnce.description'),
      highlight: t('featuresSection.features.uploadOnce.highlight')
    },
    {
      icon: ScanLine,
      title: t('featuresSection.features.smartMerge.title'),
      description: t('featuresSection.features.smartMerge.description'),
      highlight: t('featuresSection.features.smartMerge.highlight')
    },
    {
      icon: Brain,
      title: t('featuresSection.features.advancedOcr.title'),
      description: t('featuresSection.features.advancedOcr.description'),
      highlight: t('featuresSection.features.advancedOcr.highlight')
    },
    {
      icon: Zap,
      title: t('featuresSection.features.autoUpload.title'),
      description: t('featuresSection.features.autoUpload.description'),
      highlight: t('featuresSection.features.autoUpload.highlight')
    },
    {
      icon: Shield,
      title: t('featuresSection.features.localStorage.title'),
      description: t('featuresSection.features.localStorage.description'),
      highlight: t('featuresSection.features.localStorage.highlight')
    },
    {
      icon: CheckCircle2,
      title: t('featuresSection.features.crossDevice.title'),
      description: t('featuresSection.features.crossDevice.description'),
      highlight: t('featuresSection.features.crossDevice.highlight')
    },
    {
      icon: Languages,
      title: t('featuresSection.features.multiLanguage.title'),
      description: t('featuresSection.features.multiLanguage.description'),
      highlight: t('featuresSection.features.multiLanguage.highlight')
    },
    {
      icon: Database,
      title: t('featuresSection.features.smartField.title'),
      description: t('featuresSection.features.smartField.description'),
      highlight: t('featuresSection.features.smartField.highlight')
    },
    {
      icon: Clock,
      title: t('featuresSection.features.batchProcessing.title'),
      description: t('featuresSection.features.batchProcessing.description'),
      highlight: t('featuresSection.features.batchProcessing.highlight')
    }
  ];

  return (

    <section id="features" className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-6 mb-16">
          <div className="inline-block px-4 py-2 bg-gradient-feature border border-primary/20 rounded-full">
            <span className="text-sm font-medium bg-gradient-button bg-clip-text text-transparent">
              {t('featuresSection.badge')}
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            {t('featuresSection.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            {t('featuresSection.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-glow transition-all duration-500 hover:-translate-y-2 bg-gradient-card border-border/50 hover:border-primary/30 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-feature flex items-center justify-center group-hover:shadow-accent transition-all duration-500 border border-primary/10">
                      <IconComponent className="w-7 h-7 text-primary group-hover:text-accent transition-colors duration-500" />
                    </div>
                    <div className="flex-1 space-y-3">
                       <div className="space-y-2">
                         <CardTitle className="text-xl font-bold group-hover:bg-gradient-button group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                           {feature.title}
                         </CardTitle>
                         <div className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full border border-accent/20 group-hover:bg-accent/20 transition-colors duration-300">
                           {feature.highlight}
                         </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                 <CardContent className="relative z-10">
                   <CardDescription className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                     {feature.description}
                   </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <Card className="max-w-4xl mx-auto bg-gradient-hero border-primary/30 shadow-glow relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10"></div>
            <CardContent className="p-12 relative z-10">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-3xl lg:text-4xl font-bold text-white">
                    {t('featuresSection.cta.title')}
                  </h3>
                  <p className="text-xl text-white/90 max-w-2xl mx-auto">
                    {t('featuresSection.cta.subtitle')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-lg hover:shadow-glow transform hover:scale-105 transition-all duration-300">
                    {t('featuresSection.cta.startTrial')}
                    <Zap className="w-5 h-5" />
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-bold rounded-lg hover:bg-white/10 backdrop-blur transition-all duration-300">
                    {t('featuresSection.cta.watchDemo')}
                  </button>
                </div>
                <div className="flex justify-center gap-8 pt-6 text-white/80 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {t('featuresSection.cta.benefits.noCard')}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {t('featuresSection.cta.benefits.freeForever')}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {t('featuresSection.cta.benefits.setup2min')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

