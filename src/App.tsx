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
import DocumentCollection from "./pages/DocumentCollection";
import TemplateCreator from "./pages/TemplateCreator";
import ProfileDatabase from "./pages/ProfileDatabase";
import AnalyticsPage from "./pages/AnalyticsPage";
import FormLinksPage from "./components/FormLinksPage";
import GoogleTranslate from "./components/GoogleTranslator";
// Business workflow pages
import Homepage from "./pages/Homepage";
import BusinessSignup from "./pages/BusinessSignup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";

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
                    {/* Main Website Routes */}
                    <Route path="/" element={<Homepage />} />
                    <Route path="/signup" element={<BusinessSignup />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Legacy/Demo Routes */}
                    <Route path="/demo" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/documents" element={<DocumentCollection />} />
                    <Route
                      path="/template-creator/:templateType"
                      element={<TemplateCreator />}
                    />
                    <Route
                      path="/profile-database/:profileType?"
                      element={<ProfileDatabase />}
                    />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    
                    {/* Form Routes - Generic handler for all form types */}
                    <Route path="/form/:formType" element={<FormLinksPage />} />
                    
                    {/* 404 Route */}
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
