import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "./LanguageSupport";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AadhaarForm from "./pages/AadhaarForm";
import PANForm from "./pages/PANForm";
import PassportForm from "./pages/PassportForm";
import DrivingForm from "./pages/DrivingForm";
import ScholarshipForm from "./pages/ScholarshipForm";
import GSTForm from "./pages/GSTForm";
import DocumentCollection from "./pages/DocumentCollection";
import IntelligentFormAutomation from "./pages/IntelligentFormAutomation";
import AdvancedFeatures from "./pages/AdvancedFeatures";
import TemplateCreator from "./pages/TemplateCreator";
import ProfileDatabase from "./pages/ProfileDatabase";
import AnalyticsPage from "./pages/AnalyticsPage";
import FormLinksPage from "./components/FormLinksPage";
import EnhancedOCRDemo from "./pages/EnhancedOCRDemo";
import GoogleTranslate from "./components/GoogleTranslator";

const queryClient = new QueryClient();

const App = () => {
  return (
    <React.StrictMode>
      <AppErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <GoogleTranslate />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/aadhaar" element={<AadhaarForm />} />
                    <Route path="/pan" element={<PANForm />} />
                    <Route path="/passport" element={<PassportForm />} />
                    <Route path="/driving" element={<DrivingForm />} />
                    <Route path="/scholarship" element={<ScholarshipForm />} />
                    <Route path="/gst" element={<GSTForm />} />
                    <Route path="/documents" element={<DocumentCollection />} />
                    <Route
                      path="/intelligent-automation"
                      element={<IntelligentFormAutomation />}
                    />
                    <Route
                      path="/intelligent-automation/:formType"
                      element={<IntelligentFormAutomation />}
                    />
                    <Route
                      path="/advanced-features"
                      element={<AdvancedFeatures />}
                    />
                    <Route
                      path="/template-creator/:templateType"
                      element={<TemplateCreator />}
                    />
                    <Route
                      path="/profile-database/:profileType?"
                      element={<ProfileDatabase />}
                    />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/enhanced-ocr" element={<EnhancedOCRDemo />} />

                    {/* Updated Routes for the new workflow */}
                    <Route path="/form/:formType" element={<FormLinksPage />} />
                    <Route
                      path="/document-upload/:formType"
                      element={<EnhancedOCRDemo />}
                    />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </AuthProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </AppErrorBoundary>
    </React.StrictMode>
  );
};

export default App;
