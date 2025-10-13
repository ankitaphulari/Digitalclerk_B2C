import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from 'react';
import { useLanguage } from '@/LanguageSupport';
import TTSPronounce from '@/components/TTSPronounce';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
interface FieldValidation {
  isValid: boolean;
  confidence: number;
  source: 'manual' | 'extracted' | 'profile';
  error?: string;
}

interface SmartInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  validation: FieldValidation;
  required?: boolean;
  placeholder?: string;
  onAutoFill?: () => void;
  isLoading?: boolean;
}

export const SmartInput = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  validation,
  required = false,
  placeholder,
  onAutoFill,
  isLoading = false
}: SmartInputProps) => {
  const { language, setLanguage } = useLanguage();

  // Auto-detect typed language (basic script detection) with debounce
    useEffect(() => {
      const handler = setTimeout(() => {
        if (!value || value.length < 3) return;
        if (/[\u0B80-\u0BFF]/.test(value) && language !== 'ta') {
          setLanguage('ta');
        } else if (/[\u0900-\u097F]/.test(value) && language !== 'hi' && language !== 'mr') {
          // Default to Hindi for Devanagari unless already Marathi
          setLanguage('hi');
        }
      }, 300);
      return () => clearTimeout(handler);
    }, [value, language, setLanguage]);
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'extracted':
        return <Sparkles className="h-3 w-3" />;
      case 'profile':
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'extracted':
        return "default";
      case 'profile':
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="flex items-center gap-2">
            <span className="flex items-center gap-2">
              {label}
              {required && <span className="text-destructive">*</span>}
            </span>
          </Label>

          <div className="flex items-center gap-1">
            <TTSPronounce text={label} />
            {onAutoFill && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onAutoFill}
                disabled={isLoading}
                className="h-auto p-1"
              >
                <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
              </Button>
            )}
          </div>
        </div>
      
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => {
            // Don't trim input while typing, preserve spaces
            onChange(e.target.value);
          }}
          onBlur={(e) => {
            // Normalize on blur if onBlur handler is provided via onChange
            if (onChange.length > 1) {
              (onChange as any).onBlur?.(e.target.value);
            }
          }}
          placeholder={placeholder}
          className={cn(
            validation.error && "border-destructive",
            validation.isValid && validation.source !== 'manual' && "border-green-500"
          )}
          required={required}
        />
        
        {validation.source !== 'manual' && value && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {getSourceIcon(validation.source)}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between min-h-[20px]">
        <div className="flex items-center gap-2">
          {validation.source !== 'manual' && value && (
            <Badge 
              variant={getSourceBadgeVariant(validation.source)}
              className="text-xs"
            >
              {validation.source === 'extracted' ? 'From document' : 'From profile'}
            </Badge>
          )}
          
          {validation.confidence > 0 && validation.source === 'extracted' && (
            <span className={cn("text-xs", getConfidenceColor(validation.confidence))}>
              {Math.round(validation.confidence * 100)}% confidence
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {validation.error && (
            <>
              <AlertCircle className="h-3 w-3 text-destructive" />
              <span className="text-xs text-destructive">{validation.error}</span>
            </>
          )}
          
          {validation.isValid && !validation.error && (
            <CheckCircle2 className="h-3 w-3 text-green-600" />
          )}
        </div>
      </div>
    </div>
  );
};