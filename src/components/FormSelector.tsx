import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/LanguageSupport";
import { FileText, CreditCard, Car, GraduationCap, Building2, Heart, Search, ArrowRight, Clock, Star, Bot } from "lucide-react";

const popularForms = [
  { id: "aadhaar", title: "Aadhaar Application", description: "Apply for new Aadhaar card or update existing information", icon: FileText, estimatedTime: "15 min", difficulty: "Easy", category: "Identity" },
  { id: "pan", title: "PAN Card Application", description: "Apply for new PAN card for tax purposes", icon: CreditCard, estimatedTime: "12 min", difficulty: "Easy", category: "Tax" },
  { id: "passport", title: "Passport Application", description: "Apply for new passport or renewal", icon: FileText, estimatedTime: "25 min", difficulty: "Medium", category: "Travel" },
  { id: "driving_license", title: "Driving License", description: "Apply for learning license or permanent DL", icon: Car, estimatedTime: "18 min", difficulty: "Medium", category: "Transport" },
  { id: "scholarship", title: "Scholarship Application", description: "Apply for various government scholarship programs", icon: GraduationCap, estimatedTime: "30 min", difficulty: "Hard", category: "Education" },
  { id: "gst", title: "GST Registration", description: "Register your business for GST", icon: Building2, estimatedTime: "35 min", difficulty: "Hard", category: "Business" },
];

export default function FormSelector() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSmartAutoFill = (formId: string) => {
    // Navigate directly to IntelligentFormAutomation with preselected form
    navigate(`/intelligent-automation?form=${encodeURIComponent(formId)}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {popularForms.map((form) => {
        const Icon = form.icon;
        return (
          <Card key={form.id} className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{form.title}</CardTitle>
                <Badge variant="secondary">{form.category}</Badge>
              </div>
              <CardDescription>{form.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {form.estimatedTime}
                </div>
                <Badge>{form.difficulty}</Badge>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => handleSmartAutoFill(form.id)}>
                  Smart Auto-Fill
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => navigate(`/${form.id}`)}>
                  Manual Form
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
