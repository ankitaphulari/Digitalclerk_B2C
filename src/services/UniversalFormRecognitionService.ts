// Universal Form Recognition Service - AI-powered form detection for any website
import { supabase } from '@/integrations/supabase/client';

export interface FormField {
  id: string;
  name: string;
  type: string;
  label?: string;
  placeholder?: string;
  required: boolean;
  element: HTMLElement;
  confidence: number;
  suggestedMapping?: string;
}

export interface RecognizedForm {
  formId: string;
  formType: string;
  title: string;
  confidence: number;
  fields: FormField[];
  url: string;
  domain: string;
  timestamp: number;
}

export interface FormRecognitionResult {
  forms: RecognizedForm[];
  totalFields: number;
  fillableFields: number;
  confidence: number;
}

class UniversalFormRecognitionService {
  private static instance: UniversalFormRecognitionService;
  private recognitionCache = new Map<string, FormRecognitionResult>();
  private fieldMappings = new Map<string, string>();

  static getInstance(): UniversalFormRecognitionService {
    if (!UniversalFormRecognitionService.instance) {
      UniversalFormRecognitionService.instance = new UniversalFormRecognitionService();
    }
    return UniversalFormRecognitionService.instance;
  }

  async recognizeFormsOnPage(url: string = window.location.href): Promise<FormRecognitionResult> {
    try {
      const cacheKey = this.generateCacheKey(url);
      
      // Check cache first
      if (this.recognitionCache.has(cacheKey)) {
        console.log('🔍 Using cached form recognition result');
        return this.recognitionCache.get(cacheKey)!;
      }

      console.log('🔍 Starting universal form recognition...');
      
      // Get all forms on the page
      const forms = document.querySelectorAll('form');
      const recognizedForms: RecognizedForm[] = [];
      
      for (const formElement of forms) {
        const recognizedForm = await this.analyzeForm(formElement, url);
        if (recognizedForm) {
          recognizedForms.push(recognizedForm);
        }
      }

      // Also look for form-like structures without <form> tags
      const formLikeStructures = await this.detectFormLikeStructures();
      recognizedForms.push(...formLikeStructures);

      const result: FormRecognitionResult = {
        forms: recognizedForms,
        totalFields: recognizedForms.reduce((sum, form) => sum + form.fields.length, 0),
        fillableFields: recognizedForms.reduce((sum, form) => 
          sum + form.fields.filter(field => this.isFieldFillable(field)).length, 0
        ),
        confidence: this.calculateOverallConfidence(recognizedForms)
      };

      // Cache the result
      this.recognitionCache.set(cacheKey, result);
      
      console.log('✅ Form recognition completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Form recognition failed:', error);
      throw error;
    }
  }

  private async analyzeForm(formElement: HTMLFormElement, url: string): Promise<RecognizedForm | null> {
    try {
      const fields = await this.extractFormFields(formElement);
      
      if (fields.length === 0) {
        return null;
      }

      const formType = await this.classifyFormType(fields, url);
      const title = this.extractFormTitle(formElement);
      const confidence = this.calculateFormConfidence(fields, formType);

      return {
        formId: this.generateFormId(formElement),
        formType,
        title,
        confidence,
        fields,
        url,
        domain: new URL(url).hostname,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Error analyzing form:', error);
      return null;
    }
  }

  private async extractFormFields(formElement: HTMLFormElement): Promise<FormField[]> {
    const fields: FormField[] = [];
    const fieldSelectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="tel"]',
      'input[type="password"]',
      'input[type="number"]',
      'input[type="date"]',
      'textarea',
      'select'
    ];

    for (const selector of fieldSelectors) {
      const elements = formElement.querySelectorAll(selector);
      
      for (const element of elements) {
        const field = await this.analyzeField(element as HTMLInputElement);
        if (field) {
          fields.push(field);
        }
      }
    }

    return fields;
  }

  private async analyzeField(element: HTMLInputElement): Promise<FormField | null> {
    try {
      // Skip hidden or disabled fields
      if (element.type === 'hidden' || element.disabled || !this.isElementVisible(element)) {
        return null;
      }

      const field: FormField = {
        id: element.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: element.name || element.id || '',
        type: element.type || element.tagName.toLowerCase(),
        label: this.extractFieldLabel(element),
        placeholder: element.placeholder || '',
        required: element.required,
        element,
        confidence: 0,
        suggestedMapping: ''
      };

      // Analyze field purpose using AI
      field.suggestedMapping = await this.suggestFieldMapping(field);
      field.confidence = this.calculateFieldConfidence(field);

      return field;
    } catch (error) {
      console.error('❌ Error analyzing field:', error);
      return null;
    }
  }

  private extractFieldLabel(element: HTMLInputElement): string {
    // Try multiple methods to find the label
    const label = element.labels?.[0]?.textContent ||
                  document.querySelector(`label[for="${element.id}"]`)?.textContent ||
                  element.getAttribute('aria-label') ||
                  element.getAttribute('data-label') ||
                  element.placeholder ||
                  element.name;

    return label?.trim() || '';
  }

  private async suggestFieldMapping(field: FormField): Promise<string> {
    try {
      // Use AI to classify field purpose
      const { data, error } = await supabase.functions.invoke('ai-field-mapper', {
        body: {
          fieldData: {
            name: field.name,
            type: field.type,
            label: field.label,
            placeholder: field.placeholder,
            id: field.id
          }
        }
      });

      if (error) {
        return this.fallbackFieldMapping(field);
      }

      return data.suggestedMapping || this.fallbackFieldMapping(field);
    } catch (error) {
      console.error('❌ AI field mapping failed, using fallback:', error);
      return this.fallbackFieldMapping(field);
    }
  }

  private fallbackFieldMapping(field: FormField): string {
    const text = (field.name + ' ' + field.label + ' ' + field.placeholder).toLowerCase();
    
    // Common field mappings
    if (/email|e-mail/.test(text)) return 'email';
    if (/phone|mobile|tel/.test(text)) return 'phone';
    if (/name|full.?name/.test(text) && !/user|login/.test(text)) return 'fullName';
    if (/first.?name|fname/.test(text)) return 'firstName';
    if (/last.?name|surname|lname/.test(text)) return 'lastName';
    if (/address|street/.test(text)) return 'address';
    if (/city/.test(text)) return 'city';
    if (/state|province/.test(text)) return 'state';
    if (/zip|postal/.test(text)) return 'zipCode';
    if (/country/.test(text)) return 'country';
    if (/birth|dob/.test(text)) return 'dateOfBirth';
    if (/gender|sex/.test(text)) return 'gender';
    if (/aadhaar|aadhar/.test(text)) return 'aadhaarNumber';
    if (/pan/.test(text)) return 'panNumber';
    if (/passport/.test(text)) return 'passportNumber';
    
    return 'unknown';
  }

  private async classifyFormType(fields: FormField[], url: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-form-classifier', {
        body: {
          fields: fields.map(f => ({
            name: f.name,
            type: f.type,
            label: f.label,
            mapping: f.suggestedMapping
          })),
          url,
          pageTitle: document.title
        }
      });

      if (error) {
        return this.fallbackFormClassification(fields, url);
      }

      return data.formType || this.fallbackFormClassification(fields, url);
    } catch (error) {
      console.error('❌ AI form classification failed, using fallback:', error);
      return this.fallbackFormClassification(fields, url);
    }
  }

  private fallbackFormClassification(fields: FormField[], url: string): string {
    const urlLower = url.toLowerCase();
    const fieldMappings = fields.map(f => f.suggestedMapping).join(' ');
    
    // Government forms
    if (/aadhaar|aadhar/.test(urlLower) || /aadhaarNumber/.test(fieldMappings)) return 'aadhaar';
    if (/pan/.test(urlLower) || /panNumber/.test(fieldMappings)) return 'pan';
    if (/passport/.test(urlLower) || /passportNumber/.test(fieldMappings)) return 'passport';
    if (/driving|license/.test(urlLower)) return 'driving_license';
    
    // Common form types
    if (/login|signin/.test(urlLower)) return 'login';
    if (/register|signup/.test(urlLower)) return 'registration';
    if (/contact/.test(urlLower)) return 'contact';
    if (/job|career|application/.test(urlLower)) return 'job_application';
    if (/bank|loan|credit/.test(urlLower)) return 'banking';
    
    return 'general';
  }

  private async detectFormLikeStructures(): Promise<RecognizedForm[]> {
    // Detect form-like structures that don't use <form> tags
    const formLikeContainers = document.querySelectorAll('[class*="form"], [class*="registration"], [class*="application"]');
    const recognizedForms: RecognizedForm[] = [];

    for (const container of formLikeContainers) {
      const inputs = container.querySelectorAll('input, textarea, select');
      if (inputs.length >= 2) { // At least 2 fields to be considered a form
        const fields: FormField[] = [];
        
        for (const input of inputs) {
          const field = await this.analyzeField(input as HTMLInputElement);
          if (field) {
            fields.push(field);
          }
        }

        if (fields.length >= 2) {
          const formType = await this.classifyFormType(fields, window.location.href);
          
          recognizedForms.push({
            formId: this.generateFormId(container as HTMLElement),
            formType,
            title: this.extractFormTitle(container as HTMLElement),
            confidence: this.calculateFormConfidence(fields, formType),
            fields,
            url: window.location.href,
            domain: window.location.hostname,
            timestamp: Date.now()
          });
        }
      }
    }

    return recognizedForms;
  }

  private calculateFieldConfidence(field: FormField): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for well-labeled fields
    if (field.label && field.label.length > 2) confidence += 0.3;
    if (field.placeholder && field.placeholder.length > 2) confidence += 0.2;
    if (field.name && field.name.length > 1) confidence += 0.2;
    if (field.suggestedMapping !== 'unknown') confidence += 0.3;
    
    return Math.min(1.0, confidence);
  }

  private calculateFormConfidence(fields: FormField[], formType: string): number {
    if (fields.length === 0) return 0;
    
    const avgFieldConfidence = fields.reduce((sum, field) => sum + field.confidence, 0) / fields.length;
    const typeConfidence = formType !== 'general' ? 0.8 : 0.5;
    
    return (avgFieldConfidence + typeConfidence) / 2;
  }

  private calculateOverallConfidence(forms: RecognizedForm[]): number {
    if (forms.length === 0) return 0;
    
    return forms.reduce((sum, form) => sum + form.confidence, 0) / forms.length;
  }

  private generateFormId(element: HTMLElement): string {
    return element.id || `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractFormTitle(element: HTMLElement): string {
    // Try multiple methods to find the form title
    const title = element.querySelector('h1, h2, h3, .title, .heading')?.textContent ||
                  element.getAttribute('data-title') ||
                  element.getAttribute('aria-label') ||
                  document.title ||
                  'Untitled Form';
    
    return title.trim();
  }

  private isFieldFillable(field: FormField): boolean {
    return field.type !== 'hidden' && 
           field.type !== 'submit' && 
           field.type !== 'button' &&
           field.suggestedMapping !== 'unknown';
  }

  private isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }

  private generateCacheKey(url: string): string {
    return `form_recognition_${new URL(url).hostname}_${document.title}`;
  }

  // Public methods for integration
  async getFieldSuggestions(formId: string, profileData: any): Promise<Record<string, any>> {
    const cachedResult = Array.from(this.recognitionCache.values())
      .find(result => result.forms.some(form => form.formId === formId));
    
    if (!cachedResult) {
      return {};
    }

    const form = cachedResult.forms.find(f => f.formId === formId);
    if (!form) {
      return {};
    }

    const suggestions: Record<string, any> = {};
    
    for (const field of form.fields) {
      if (field.suggestedMapping && profileData[field.suggestedMapping]) {
        suggestions[field.name || field.id] = profileData[field.suggestedMapping];
      }
    }

    return suggestions;
  }

  clearCache(): void {
    this.recognitionCache.clear();
  }
}

export default UniversalFormRecognitionService;