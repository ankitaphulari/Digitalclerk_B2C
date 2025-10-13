import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { SmartInput } from "@/components/SmartInput";
import { useSmartForm } from "@/hooks/useSmartForm";

const PassportForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    formData,
    fieldValidations,
    isLoading,
    handleInputChange,
    autoFillFromDocuments
  } = useSmartForm("passport");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          form_type: "passport",
          name: formData.name,
          dob: formData.dob,
          address: formData.address,
          phone: formData.phone,
          status: "submitted"
        });

      if (error) throw error;

      toast.success("Passport application submitted successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl font-semibold">Passport Application</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              Passport Application
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoFillFromDocuments}
                disabled={isLoading}
                className="ml-auto"
              >
                <Zap className="h-4 w-4 mr-2" />
                Auto-fill from documents
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <SmartInput
                id="name"
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={(value) => handleInputChange("name", value)}
                validation={fieldValidations.name}
                required
                placeholder="Enter your full name"
              />

              <SmartInput
                id="dob"
                label="Date of Birth"
                type="date"
                value={formData.dob}
                onChange={(value) => handleInputChange("dob", value)}
                validation={fieldValidations.dob}
                required
              />

              <SmartInput
                id="address"
                label="Address"
                type="text"
                value={formData.address}
                onChange={(value) => handleInputChange("address", value)}
                validation={fieldValidations.address}
                required
                placeholder="Enter your complete address"
              />

              <SmartInput
                id="phone"
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(value) => handleInputChange("phone", value)}
                validation={fieldValidations.phone}
                required
                placeholder="Enter your phone number"
              />

              {/* Auto-save will be added in next update */}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PassportForm;