// Predictive Form Assistance Service - Proactive help and missing data detection
import { supabase } from '@/integrations/supabase/client';
import UniversalFormRecognitionService, { FormField, RecognizedForm } from './UniversalFormRecognitionService';
import { ProfileDatabaseService } from './ProfileDatabaseService';

export interface PredictiveInsight {
  id: string;
  type: 'missing_data' | 'form_optimization' | 'accuracy_improvement' | 'time_saving';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  suggestedAction?: string;
  formId?: string;
  fieldId?: string;
  estimatedTimeSaved?: number;
}

export interface FormCompletenessAnalysis {
  formId: string;
  totalFields: number;
  fillableFields: number;
  missingFields: FormField[];
  completionPercentage: number;
  estimatedTimeToComplete: number;
  blockerFields: FormField[];
}

export interface SmartSuggestion {
  fieldId: string;
  suggestedValue: string;
  confidence: number;
  source: 'profile' | 'previous_form' | 'ai_prediction' | 'pattern_analysis';
  reasoning: string;
}

class PredictiveAssistanceService {
  private static instance: PredictiveAssistanceService;
  private formRecognitionService: UniversalFormRecognitionService;
  private userHistory: Map<string, any[]> = new Map();
  private predictiveCache: Map<string, PredictiveInsight[]> = new Map();

  static getInstance(): PredictiveAssistanceService {
    if (!PredictiveAssistanceService.instance) {
      PredictiveAssistanceService.instance = new PredictiveAssistanceService();
    }
    return PredictiveAssistanceService.instance;
  }

  constructor() {
    this.formRecognitionService = UniversalFormRecognitionService.getInstance();
    this.loadUserHistory();
  }

  async analyzeCurrentPage(userId: string): Promise<{
    insights: PredictiveInsight[];
    completenessAnalysis: FormCompletenessAnalysis[];
    smartSuggestions: Record<string, SmartSuggestion[]>;
  }> {
    try {
      console.log('🔍 Analyzing current page for predictive assistance...');
      
      // Get form recognition results
      const recognitionResult = await this.formRecognitionService.recognizeFormsOnPage();
      
      if (recognitionResult.forms.length === 0) {
        return { insights: [], completenessAnalysis: [], smartSuggestions: {} };
      }

      // Load user profile data
      const userProfiles = await ProfileDatabaseService.getUserProfiles();
      const userHistory = await this.getUserFormHistory(userId);

      // Analyze each form
      const insights: PredictiveInsight[] = [];
      const completenessAnalysis: FormCompletenessAnalysis[] = [];
      const smartSuggestions: Record<string, SmartSuggestion[]> = {};

      for (const form of recognitionResult.forms) {
        // Analyze form completeness
        const completeness = await this.analyzeFormCompleteness(form, userProfiles);
        completenessAnalysis.push(completeness);

        // Generate predictive insights for this form
        const formInsights = await this.generateFormInsights(form, userProfiles, userHistory);
        insights.push(...formInsights);

        // Generate smart suggestions for each field
        const suggestions = await this.generateSmartSuggestions(form, userProfiles, userHistory);
        smartSuggestions[form.formId] = suggestions;
      }

      console.log('✅ Predictive analysis completed:', {
        insights: insights.length,
        forms: completenessAnalysis.length,
        suggestions: Object.keys(smartSuggestions).length
      });

      return { insights, completenessAnalysis, smartSuggestions };
    } catch (error) {
      console.error('❌ Predictive analysis failed:', error);
      throw error;
    }
  }

  private async analyzeFormCompleteness(
    form: RecognizedForm, 
    userProfiles: any[]
  ): Promise<FormCompletenessAnalysis> {
    const fillableFields = form.fields.filter(field => this.isFieldFillable(field));
    const missingFields: FormField[] = [];
    const blockerFields: FormField[] = [];

    // Check which fields can be auto-filled from profiles
    for (const field of fillableFields) {
      const hasData = this.hasDataForField(field, userProfiles);
      
      if (!hasData) {
        missingFields.push(field);
        
        // Check if this is a blocker field (required and commonly needed)
        if (field.required || this.isBlockerField(field)) {
          blockerFields.push(field);
        }
      }
    }

    const completionPercentage = fillableFields.length > 0 
      ? ((fillableFields.length - missingFields.length) / fillableFields.length) * 100 
      : 0;

    const estimatedTimeToComplete = this.estimateCompletionTime(missingFields, blockerFields);

    return {
      formId: form.formId,
      totalFields: form.fields.length,
      fillableFields: fillableFields.length,
      missingFields,
      completionPercentage,
      estimatedTimeToComplete,
      blockerFields
    };
  }

  private async generateFormInsights(
    form: RecognizedForm,
    userProfiles: any[],
    userHistory: any[]
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // Missing data insights
    const missingDataInsights = await this.generateMissingDataInsights(form, userProfiles);
    insights.push(...missingDataInsights);

    // Form optimization insights
    const optimizationInsights = await this.generateOptimizationInsights(form, userHistory);
    insights.push(...optimizationInsights);

    // Accuracy improvement insights
    const accuracyInsights = await this.generateAccuracyInsights(form, userHistory);
    insights.push(...accuracyInsights);

    // Time-saving insights
    const timeSavingInsights = await this.generateTimeSavingInsights(form, userProfiles);
    insights.push(...timeSavingInsights);

    return insights.sort((a, b) => this.calculateInsightScore(b) - this.calculateInsightScore(a));
  }

  private async generateMissingDataInsights(
    form: RecognizedForm,
    userProfiles: any[]
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];
    const missingFieldMappings = this.getMissingFieldMappings(form, userProfiles);

    if (missingFieldMappings.length > 0) {
      insights.push({
        id: `missing_data_${form.formId}`,
        type: 'missing_data',
        title: `${missingFieldMappings.length} fields can't be auto-filled`,
        description: `Add missing data to your profile for instant form completion. Missing: ${missingFieldMappings.slice(0, 3).join(', ')}${missingFieldMappings.length > 3 ? '...' : ''}`,
        confidence: 0.9,
        priority: 'high',
        actionable: true,
        suggestedAction: 'Update your profile with missing information',
        formId: form.formId,
        estimatedTimeSaved: missingFieldMappings.length * 15 // 15 seconds per field
      });
    }

    // Check for incomplete profiles
    const incompleteProfiles = this.findIncompleteProfiles(userProfiles, form.formType);
    if (incompleteProfiles.length > 0) {
      insights.push({
        id: `incomplete_profile_${form.formId}`,
        type: 'missing_data',
        title: 'Profile optimization opportunity',
        description: `Your ${form.formType} profile is ${this.calculateProfileCompleteness(incompleteProfiles[0])}% complete. Complete it for better auto-fill accuracy.`,
        confidence: 0.8,
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Complete your profile',
        estimatedTimeSaved: 60
      });
    }

    return insights;
  }

  private async generateOptimizationInsights(
    form: RecognizedForm,
    userHistory: any[]
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // Check for repeated form patterns
    const similarForms = this.findSimilarFormsInHistory(form, userHistory);
    if (similarForms.length >= 3) {
      insights.push({
        id: `optimization_${form.formId}`,
        type: 'form_optimization',
        title: 'Frequent form detected',
        description: `You've filled similar ${form.formType} forms ${similarForms.length} times. Consider creating a dedicated profile template.`,
        confidence: 0.85,
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Create profile template',
        estimatedTimeSaved: 120
      });
    }

    // Check for field mapping improvements
    const unmappedFields = form.fields.filter(field => field.suggestedMapping === 'unknown');
    if (unmappedFields.length > 2) {
      insights.push({
        id: `field_mapping_${form.formId}`,
        type: 'form_optimization',
        title: 'Unmapped fields detected',
        description: `${unmappedFields.length} fields couldn't be automatically mapped. Manual mapping could improve auto-fill accuracy.`,
        confidence: 0.7,
        priority: 'low',
        actionable: true,
        suggestedAction: 'Review field mappings'
      });
    }

    return insights;
  }

  private async generateAccuracyInsights(
    form: RecognizedForm,
    userHistory: any[]
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // Check historical accuracy for this form type
    const historicalAccuracy = this.calculateHistoricalAccuracy(form.formType, userHistory);
    if (historicalAccuracy < 0.8) {
      insights.push({
        id: `accuracy_${form.formId}`,
        type: 'accuracy_improvement',
        title: 'Accuracy improvement available',
        description: `${form.formType} forms have ${(historicalAccuracy * 100).toFixed(1)}% accuracy. Update your profile data to improve auto-fill precision.`,
        confidence: 0.8,
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Review and update profile data'
      });
    }

    // Check for fields with low confidence
    const lowConfidenceFields = form.fields.filter(field => field.confidence < 0.6);
    if (lowConfidenceFields.length > 0) {
      insights.push({
        id: `low_confidence_${form.formId}`,
        type: 'accuracy_improvement',
        title: 'Field detection uncertainty',
        description: `${lowConfidenceFields.length} fields have uncertain mappings. Manual review recommended.`,
        confidence: 0.6,
        priority: 'low',
        actionable: true,
        suggestedAction: 'Review field mappings manually'
      });
    }

    return insights;
  }

  private async generateTimeSavingInsights(
    form: RecognizedForm,
    userProfiles: any[]
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // Calculate potential time savings
    const autoFillableFields = form.fields.filter(field => 
      this.hasDataForField(field, userProfiles) && this.isFieldFillable(field)
    );

    if (autoFillableFields.length >= 5) {
      const timeSaved = autoFillableFields.length * 10; // 10 seconds per field
      insights.push({
        id: `time_saving_${form.formId}`,
        type: 'time_saving',
        title: 'Significant time savings available',
        description: `Auto-fill can complete ${autoFillableFields.length} fields automatically, saving approximately ${Math.round(timeSaved / 60)} minutes.`,
        confidence: 0.9,
        priority: 'high',
        actionable: true,
        suggestedAction: 'Use auto-fill feature',
        estimatedTimeSaved: timeSaved
      });
    }

    return insights;
  }

  private async generateSmartSuggestions(
    form: RecognizedForm,
    userProfiles: any[],
    userHistory: any[]
  ): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    for (const field of form.fields) {
      if (!this.isFieldFillable(field)) continue;

      // Try different suggestion sources
      const profileSuggestion = this.getProfileSuggestion(field, userProfiles);
      const historySuggestion = this.getHistorySuggestion(field, userHistory);
      const aiSuggestion = await this.getAISuggestion(field, form);
      const patternSuggestion = this.getPatternSuggestion(field, userHistory);

      // Pick the best suggestion
      const allSuggestions = [profileSuggestion, historySuggestion, aiSuggestion, patternSuggestion]
        .filter(s => s !== null);

      if (allSuggestions.length > 0) {
        const bestSuggestion = allSuggestions.sort((a, b) => b!.confidence - a!.confidence)[0];
        if (bestSuggestion) {
          suggestions.push(bestSuggestion);
        }
      }
    }

    return suggestions;
  }

  private getProfileSuggestion(field: FormField, userProfiles: any[]): SmartSuggestion | null {
    for (const profile of userProfiles) {
      const profileData = profile.data || {};
      
      if (field.suggestedMapping && profileData[field.suggestedMapping]) {
        return {
          fieldId: field.id,
          suggestedValue: profileData[field.suggestedMapping],
          confidence: 0.9,
          source: 'profile',
          reasoning: `Found in your ${profile.profileType} profile`
        };
      }
    }
    return null;
  }

  private getHistorySuggestion(field: FormField, userHistory: any[]): SmartSuggestion | null {
    // Look for similar fields in form history
    for (const historyItem of userHistory) {
      if (historyItem.extractedData && field.suggestedMapping) {
        const value = historyItem.extractedData[field.suggestedMapping];
        if (value) {
          return {
            fieldId: field.id,
            suggestedValue: value,
            confidence: 0.7,
            source: 'previous_form',
            reasoning: `Used in previous ${historyItem.formType} form`
          };
        }
      }
    }
    return null;
  }

  private async getAISuggestion(field: FormField, form: RecognizedForm): Promise<SmartSuggestion | null> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-field-predictor', {
        body: {
          field: {
            name: field.name,
            type: field.type,
            label: field.label,
            placeholder: field.placeholder
          },
          formContext: {
            type: form.formType,
            title: form.title,
            url: form.url
          }
        }
      });

      if (error || !data.suggestedValue) {
        return null;
      }

      return {
        fieldId: field.id,
        suggestedValue: data.suggestedValue,
        confidence: data.confidence || 0.6,
        source: 'ai_prediction',
        reasoning: data.reasoning || 'AI prediction based on context'
      };
    } catch (error) {
      console.error('AI suggestion failed:', error);
      return null;
    }
  }

  private getPatternSuggestion(field: FormField, userHistory: any[]): SmartSuggestion | null {
    // Analyze patterns in user's form filling behavior
    if (!field.suggestedMapping) {
      return null;
    }

    const fieldValues = userHistory
      .filter(item => item.extractedData)
      .map(item => item.extractedData[field.suggestedMapping!])
      .filter(value => value);

    if (fieldValues.length >= 3) {
      // Find most common value
      const valueCounts: Record<string, number> = {};
      fieldValues.forEach(value => {
        valueCounts[value] = (valueCounts[value] || 0) + 1;
      });

      const mostCommon = Object.entries(valueCounts)
        .sort(([,a], [,b]) => b - a)[0];

      if (mostCommon && mostCommon[1] >= 2) {
        return {
          fieldId: field.id,
          suggestedValue: mostCommon[0],
          confidence: Math.min(0.8, mostCommon[1] / fieldValues.length),
          source: 'pattern_analysis',
          reasoning: `Most commonly used value (${mostCommon[1]}/${fieldValues.length} times)`
        };
      }
    }

    return null;
  }

  // Helper methods
  private isFieldFillable(field: FormField): boolean {
    return field.type !== 'hidden' && 
           field.type !== 'submit' && 
           field.type !== 'button' &&
           field.suggestedMapping !== 'unknown';
  }

  private hasDataForField(field: FormField, userProfiles: any[]): boolean {
    return userProfiles.some(profile => {
      const profileData = profile.data || {};
      return field.suggestedMapping && profileData[field.suggestedMapping];
    });
  }

  private isBlockerField(field: FormField): boolean {
    const blockerMappings = ['fullName', 'email', 'phone', 'address'];
    return blockerMappings.includes(field.suggestedMapping || '');
  }

  private estimateCompletionTime(missingFields: FormField[], blockerFields: FormField[]): number {
    // Estimate in seconds
    let time = 0;
    time += missingFields.length * 15; // 15 seconds per missing field
    time += blockerFields.length * 10; // Additional 10 seconds for blocker fields
    return time;
  }

  private getMissingFieldMappings(form: RecognizedForm, userProfiles: any[]): string[] {
    const fillableFields = form.fields.filter(field => this.isFieldFillable(field));
    const missingMappings: string[] = [];

    for (const field of fillableFields) {
      if (!this.hasDataForField(field, userProfiles) && field.suggestedMapping) {
        missingMappings.push(field.suggestedMapping);
      }
    }

    return [...new Set(missingMappings)]; // Remove duplicates
  }

  private findIncompleteProfiles(userProfiles: any[], formType: string): any[] {
    return userProfiles.filter(profile => {
      if (profile.profileType !== formType) return false;
      
      const completeness = this.calculateProfileCompleteness(profile);
      return completeness < 80; // Less than 80% complete
    });
  }

  private calculateProfileCompleteness(profile: any): number {
    const requiredFields = ['fullName', 'email', 'phone', 'address'];
    const profileData = profile.data || {};
    
    const filledFields = requiredFields.filter(field => profileData[field]);
    return (filledFields.length / requiredFields.length) * 100;
  }

  private findSimilarFormsInHistory(form: RecognizedForm, userHistory: any[]): any[] {
    return userHistory.filter(item => 
      item.formType === form.formType || 
      item.formUrl?.includes(new URL(form.url).hostname)
    );
  }

  private calculateHistoricalAccuracy(formType: string, userHistory: any[]): number {
    const relevantHistory = userHistory.filter(item => item.formType === formType);
    if (relevantHistory.length === 0) return 1;

    const accuracySum = relevantHistory.reduce((sum, item) => sum + (item.confidence || 0.8), 0);
    return accuracySum / relevantHistory.length;
  }

  private calculateInsightScore(insight: PredictiveInsight): number {
    const priorityWeight = { low: 1, medium: 2, high: 3, critical: 4 };
    const typeWeight = { missing_data: 3, form_optimization: 2, accuracy_improvement: 2, time_saving: 1 };
    
    return insight.confidence * priorityWeight[insight.priority] * typeWeight[insight.type];
  }

  private async loadUserHistory(): Promise<void> {
    // Load user form history from database
    // Implementation would fetch from applications and document_uploads tables
  }

  private async getUserFormHistory(userId: string): Promise<any[]> {
    try {
      const { data: applications } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      return applications || [];
    } catch (error) {
      console.error('Error fetching user history:', error);
      return [];
    }
  }
}

export default PredictiveAssistanceService;