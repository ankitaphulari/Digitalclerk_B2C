// Intelligent field mapping system that maps any extracted field to any form field
// Uses semantic matching and confidence scoring

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  mappingType: 'exact' | 'semantic' | 'pattern' | 'ai_suggested';
  transformFunction?: (value: string) => string;
}

export interface FormFieldInfo {
  fieldName: string;
  fieldType: string;
  label: string;
  required: boolean;
  validation?: RegExp;
  alternatives?: string[]; // Alternative field names
}

export interface MappingSuggestion {
  sourceField: string;
  targetField: string;
  confidence: number;
  reasoning: string;
  requiresConfirmation: boolean;
}

export class IntelligentFieldMapper {
  
  // Enhanced semantic mappings with document-specific fields
  private static semanticMappings: Record<string, string[]> = {
    'name': ['full_name', 'applicant_name', 'student_name', 'employee_name', 'patient_name', 'holder_name', 'account_holder_name', 'consumer_name', 'tenant_name', 'landlord_name'],
    'fathersName': ['father_name', 'guardian_name', 'parent_name', 'fathers_name'],
    'address': ['permanent_address', 'current_address', 'residence', 'home_address', 'postal_address', 'billing_address', 'property_address'],
    'phone': ['mobile', 'contact_number', 'phone_number', 'mobile_number', 'telephone', 'contact'],
    'email': ['email_address', 'email_id', 'e_mail'],
    'dob': ['date_of_birth', 'birth_date', 'birthdate', 'born_on'],
    'panNumber': ['pan', 'pan_card_number', 'permanent_account_number'],
    'aadhaarNumber': ['aadhaar', 'aadhar', 'uid_number', 'unique_id'],
    'passportNumber': ['passport', 'passport_no', 'passport_id'],
    'gender': ['sex', 'male_female'],
    'nationality': ['country', 'citizen_of'],
    'occupation': ['profession', 'job', 'work', 'designation'],
    'income': ['salary', 'annual_income', 'monthly_income', 'basic_salary', 'gross_salary', 'net_salary'],
    'qualification': ['education', 'degree', 'educational_qualification'],
    
    // Financial document fields
    'accountNumber': ['account_no', 'acc_no', 'account_number', 'bank_account'],
    'ifscCode': ['ifsc', 'ifsc_code', 'branch_code', 'swift_code'],
    'bankName': ['bank', 'bank_name', 'financial_institution'],
    'branchName': ['branch', 'branch_name', 'branch_address'],
    
    // Academic document fields
    'rollNumber': ['roll_no', 'student_id', 'registration_number', 'reg_no'],
    'registrationNumber': ['reg_no', 'registration_no', 'enrollment_number'],
    'marks': ['total_marks', 'scored_marks', 'obtained_marks'],
    'percentage': ['percent', 'percentage_marks', 'overall_percentage'],
    'cgpa': ['gpa', 'grade_point', 'cumulative_gpa'],
    'institution': ['college', 'university', 'school', 'institute'],
    
    // Employment document fields
    'employeeId': ['emp_id', 'employee_code', 'staff_id'],
    'designation': ['position', 'job_title', 'role'],
    'department': ['dept', 'division', 'section'],
    
    // Utility bill fields
    'consumerNumber': ['consumer_no', 'account_id', 'service_number'],
    'billAmount': ['amount_due', 'total_amount', 'bill_total'],
    'dueDate': ['due_on', 'payment_due_date', 'last_date'],
    
    // Property/Rental fields
    'rentAmount': ['monthly_rent', 'rent_per_month', 'rental_amount'],
    'securityDeposit': ['advance', 'security_amount', 'deposit']
  };

  // Enhanced field type patterns for validation
  private static fieldTypePatterns: Record<string, RegExp> = {
    'email': /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    'phone': /^[\d\s\-\+\(\)]{10,15}$/,
    'date': /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/,
    'pan': /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    'aadhaar': /^\d{4}\s?\d{4}\s?\d{4}$/,
    'passport': /^[A-Z]\d{7}$/,
    'pincode': /^\d{6}$/,
    
    // Financial patterns
    'accountNumber': /^\d{9,18}$/,
    'ifscCode': /^[A-Z]{4}0[A-Z0-9]{6}$/,
    'amount': /^\d+(\.\d{2})?$/,
    'currency': /^[\₹$€£¥]\s?\d+(\.\d{2})?$/,
    
    // Academic patterns
    'rollNumber': /^[A-Z0-9]{6,15}$/,
    'percentage': /^\d{1,3}(\.\d{1,2})?%?$/,
    'cgpa': /^\d{1,2}(\.\d{1,2})?$/,
    'grade': /^[A-F][+-]?$|^[0-9]{1,2}$/,
    
    // Employment patterns
    'employeeId': /^[A-Z0-9]{4,10}$/,
    'salary': /^\d{4,8}(\.\d{2})?$/,
    
    // Utility patterns
    'consumerNumber': /^\d{8,15}$/,
    'meterReading': /^\d{4,8}$/,
    
    // Property patterns
    'rentAmount': /^\d{4,7}(\.\d{2})?$/,
    'propertyId': /^[A-Z0-9]{6,12}$/
  };

  /**
   * Maps extracted fields to form fields intelligently with document context
   */
  static async mapFieldsToForm(
    extractedFields: any[], 
    formFields: FormFieldInfo[],
    useAI: boolean = true,
    documentContext?: any
  ): Promise<FieldMapping[]> {
    const mappings: FieldMapping[] = [];
    
    console.log('🔍 Starting intelligent field mapping:', {
      extractedFields: extractedFields.map(f => ({ name: f.fieldName, value: f.value?.substring(0, 20) })),
      formFields: formFields.map(f => f.fieldName),
      documentContext: documentContext?.documentType
    });
    
    // First pass: Exact matches
    extractedFields.forEach(extracted => {
      const exactMatch = formFields.find(form => 
        form.fieldName.toLowerCase() === extracted.fieldName.toLowerCase()
      );
      
      if (exactMatch) {
        mappings.push({
          sourceField: extracted.fieldName,
          targetField: exactMatch.fieldName,
          confidence: 0.95,
          mappingType: 'exact'
        });
        console.log(`✅ Exact match: ${extracted.fieldName} → ${exactMatch.fieldName}`);
      }
    });

    // Second pass: Enhanced semantic matching with document context
    extractedFields.forEach(extracted => {
      if (mappings.some(m => m.sourceField === extracted.fieldName)) return;
      
      const semanticMatch = this.findContextAwareSemanticMatch(extracted.fieldName, formFields, documentContext);
      if (semanticMatch) {
        mappings.push({
          sourceField: extracted.fieldName,
          targetField: semanticMatch.fieldName,
          confidence: semanticMatch.confidence,
          mappingType: 'semantic'
        });
        console.log(`🔗 Semantic match: ${extracted.fieldName} → ${semanticMatch.fieldName} (${semanticMatch.confidence})`);
      }
    });

    // Third pass: Enhanced pattern-based matching
    extractedFields.forEach(extracted => {
      if (mappings.some(m => m.sourceField === extracted.fieldName)) return;
      
      const patternMatch = this.findEnhancedPatternMatch(extracted, formFields, documentContext);
      if (patternMatch) {
        mappings.push({
          sourceField: extracted.fieldName,
          targetField: patternMatch.fieldName,
          confidence: patternMatch.confidence,
          mappingType: 'pattern'
        });
        console.log(`📋 Pattern match: ${extracted.fieldName} → ${patternMatch.fieldName} (${patternMatch.confidence})`);
      }
    });

    // Fourth pass: AI-powered mapping for remaining fields
    if (useAI) {
      const unmappedFields = extractedFields.filter(extracted => 
        !mappings.some(m => m.sourceField === extracted.fieldName)
      );
      
      if (unmappedFields.length > 0) {
        console.log(`🤖 Using AI for ${unmappedFields.length} unmapped fields`);
        const aiMappings = await this.getContextAwareAIMappings(unmappedFields, formFields, documentContext);
        mappings.push(...aiMappings);
      }
    }

    console.log(`📊 Final mappings (${mappings.length}):`, mappings.map(m => `${m.sourceField} → ${m.targetField}`));
    return mappings;
  }

  /**
   * Enhanced context-aware semantic matching
   */
  private static findContextAwareSemanticMatch(
    sourceField: string, 
    formFields: FormFieldInfo[],
    documentContext?: any
  ): { fieldName: string; confidence: number } | null {
    const sourceFieldLower = sourceField.toLowerCase();
    
    // Check direct semantic mappings
    for (const [canonical, alternatives] of Object.entries(this.semanticMappings)) {
      if (canonical === sourceFieldLower || alternatives.includes(sourceFieldLower)) {
        // Find form field that matches this semantic group
        const matchingFormField = formFields.find(field => {
          const fieldLower = field.fieldName.toLowerCase();
          return fieldLower === canonical || 
                 alternatives.includes(fieldLower) ||
                 field.alternatives?.some(alt => alt.toLowerCase() === canonical);
        });
        
        if (matchingFormField) {
          return {
            fieldName: matchingFormField.fieldName,
            confidence: 0.85
          };
        }
      }
    }

    // Fuzzy semantic matching
    const bestMatch = formFields.reduce((best, field) => {
      const similarity = this.calculateSimilarity(sourceFieldLower, field.fieldName.toLowerCase());
      if (similarity > best.similarity && similarity > 0.7) {
        return { field, similarity };
      }
      return best;
    }, { field: null as FormFieldInfo | null, similarity: 0 });

    if (bestMatch.field) {
      return {
        fieldName: bestMatch.field.fieldName,
        confidence: bestMatch.similarity
      };
    }

    // Document-context boosted matching
    if (documentContext?.documentType) {
      const contextualMatch = this.findDocumentContextMatch(sourceField, formFields, documentContext.documentType);
      if (contextualMatch) {
        return {
          fieldName: contextualMatch.fieldName,
          confidence: contextualMatch.confidence + 0.1 // Boost for context relevance
        };
      }
    }

    return null;
  }

  /**
   * Document-specific context matching
   */
  private static findDocumentContextMatch(
    sourceField: string,
    formFields: FormFieldInfo[],
    documentType: string
  ): { fieldName: string; confidence: number } | null {
    // Document-specific field priorities
    const documentFieldPriorities: Record<string, Record<string, string[]>> = {
      'bank_statement': {
        'name': ['account_holder_name', 'name', 'customer_name'],
        'accountNumber': ['account_number', 'account_no', 'acc_no'],
        'ifscCode': ['ifsc_code', 'ifsc', 'branch_code'],
        'address': ['address', 'branch_address', 'customer_address']
      },
      'marksheet': {
        'name': ['student_name', 'name', 'candidate_name'],
        'rollNumber': ['roll_number', 'registration_number', 'student_id'],
        'marks': ['total_marks', 'marks_obtained', 'percentage'],
        'institution': ['college_name', 'university', 'institution']
      },
      'salary_slip': {
        'name': ['employee_name', 'name', 'emp_name'],
        'employeeId': ['employee_id', 'emp_id', 'staff_id'],
        'designation': ['designation', 'position', 'job_title'],
        'salary': ['gross_salary', 'basic_salary', 'net_salary']
      }
    };

    const priorities = documentFieldPriorities[documentType];
    if (!priorities) return null;

    const sourceFieldLower = sourceField.toLowerCase();
    
    for (const [targetField, sourceVariations] of Object.entries(priorities)) {
      if (sourceVariations.some(variation => sourceFieldLower.includes(variation.toLowerCase()))) {
        const matchingFormField = formFields.find(field => 
          field.fieldName.toLowerCase() === targetField.toLowerCase()
        );
        
        if (matchingFormField) {
          return {
            fieldName: matchingFormField.fieldName,
            confidence: 0.9
          };
        }
      }
    }

    return null;
  }

  /**
   * Enhanced pattern matching with document context
   */
  private static findEnhancedPatternMatch(
    extracted: any, 
    formFields: FormFieldInfo[],
    documentContext?: any
  ): { fieldName: string; confidence: number } | null {
    const value = extracted.value?.toString() || '';
    
    // Enhanced pattern matching with document context
    for (const [type, pattern] of Object.entries(this.fieldTypePatterns)) {
      if (pattern.test(value)) {
        const matchingField = formFields.find(field => 
          field.fieldType === type || 
          field.fieldName.toLowerCase().includes(type) ||
          this.isSemanticMatch(field.fieldName, type)
        );
        
        if (matchingField) {
          let confidence = 0.8;
          
          // Boost confidence for document-specific patterns
          if (documentContext?.documentType && this.isDocumentRelevantPattern(type, documentContext.documentType)) {
            confidence += 0.1;
          }
          
          return {
            fieldName: matchingField.fieldName,
            confidence: Math.min(confidence, 0.95)
          };
        }
      }
    }

    // Additional document-specific pattern checks
    if (documentContext?.documentType) {
      const contextMatch = this.findDocumentSpecificPatternMatch(extracted, formFields, documentContext.documentType);
      if (contextMatch) return contextMatch;
    }

    return null;
  }

  /**
   * Checks if pattern type is relevant for document type
   */
  private static isDocumentRelevantPattern(patternType: string, documentType: string): boolean {
    const relevantPatterns: Record<string, string[]> = {
      'bank_statement': ['accountNumber', 'ifscCode', 'amount', 'currency'],
      'marksheet': ['rollNumber', 'percentage', 'cgpa', 'grade'],
      'salary_slip': ['employeeId', 'salary', 'amount'],
      'utility_bill': ['consumerNumber', 'amount', 'currency', 'meterReading']
    };
    
    return relevantPatterns[documentType]?.includes(patternType) || false;
  }

  /**
   * Document-specific pattern matching
   */
  private static findDocumentSpecificPatternMatch(
    extracted: any,
    formFields: FormFieldInfo[],
    documentType: string
  ): { fieldName: string; confidence: number } | null {
    const value = extracted.value?.toString() || '';
    
    // Document-specific advanced patterns
    const documentPatterns: Record<string, Record<string, { pattern: RegExp; targetField: string; confidence: number }>> = {
      'bank_statement': {
        'accountPattern': { pattern: /^\d{9,18}$/, targetField: 'accountNumber', confidence: 0.9 },
        'ifscPattern': { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, targetField: 'ifscCode', confidence: 0.95 },
        'amountPattern': { pattern: /^₹?\s?\d{1,3}(,\d{3})*(\.\d{2})?$/, targetField: 'amount', confidence: 0.85 }
      },
      'marksheet': {
        'rollPattern': { pattern: /^[A-Z0-9]{6,15}$/, targetField: 'rollNumber', confidence: 0.9 },
        'percentagePattern': { pattern: /^\d{1,3}(\.\d{1,2})?%?$/, targetField: 'percentage', confidence: 0.9 },
        'cgpaPattern': { pattern: /^\d{1,2}(\.\d{1,2})?\s?(CGPA|GPA)?$/i, targetField: 'cgpa', confidence: 0.9 }
      }
    };
    
    const patterns = documentPatterns[documentType];
    if (!patterns) return null;
    
    for (const [, config] of Object.entries(patterns)) {
      if (config.pattern.test(value)) {
        const matchingField = formFields.find(field => 
          field.fieldName.toLowerCase().includes(config.targetField.toLowerCase())
        );
        
        if (matchingField) {
          return {
            fieldName: matchingField.fieldName,
            confidence: config.confidence
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Checks semantic similarity for field names
   */
  private static isSemanticMatch(fieldName: string, type: string): boolean {
    const fieldLower = fieldName.toLowerCase();
    const semanticMap: Record<string, string[]> = {
      'accountNumber': ['account', 'acc'],
      'ifscCode': ['ifsc', 'branch'],
      'rollNumber': ['roll', 'student'],
      'employeeId': ['employee', 'emp', 'staff']
    };
    
    return semanticMap[type]?.some(keyword => fieldLower.includes(keyword)) || false;
  }

  /**
   * Enhanced AI mapping with document context
   */
  private static async getContextAwareAIMappings(
    unmappedFields: any[], 
    formFields: FormFieldInfo[],
    documentContext?: any
  ): Promise<FieldMapping[]> {
    try {
      const prompt = this.createContextAwareMappingPrompt(unmappedFields, formFields, documentContext);
      
      const response = await fetch('/api/ai-field-mapper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: 'gpt-4.1-2025-04-14'
        }),
      });

      if (!response.ok) {
        console.error('AI mapping failed:', response.statusText);
        return [];
      }

      const aiResponse = await response.json();
      return this.parseAIMappingResponse(aiResponse);
      
    } catch (error) {
      console.error('AI field mapping error:', error);
      return [];
    }
  }

  /**
   * Creates context-aware prompt for AI field mapping
   */
  private static createContextAwareMappingPrompt(unmappedFields: any[], formFields: FormFieldInfo[], documentContext?: any): string {
    const unmappedFieldsStr = unmappedFields.map(f => 
      `- ${f.fieldName}: "${f.value}" (type: ${f.fieldType || 'text'}, confidence: ${f.confidence || 0.8})`
    ).join('\n');
    
    const formFieldsStr = formFields.map(f => 
      `- ${f.fieldName} (${f.fieldType}) ${f.required ? '[Required]' : '[Optional]'} - ${f.label}`
    ).join('\n');

    const contextInfo = documentContext ? `
Document Context:
- Document Type: ${documentContext.documentType}
- Confidence: ${documentContext.confidence}
- Special Fields: ${documentContext.specialFields?.join(', ') || 'None'}
- Detected Indicators: ${documentContext.indicators?.join(', ') || 'None'}
` : '';

    return `You are an expert at mapping document fields to form fields, specializing in ${documentContext?.documentType || 'general'} documents.

${contextInfo}

Extracted Fields:
${unmappedFieldsStr}

Available Form Fields:
${formFieldsStr}

Rules for ${documentContext?.documentType || 'general'} documents:
1. Consider semantic meaning and document-specific terminology
2. Consider field types, value patterns, and document context
3. Prioritize required fields and document-relevant fields
4. For ${documentContext?.documentType || 'general'} documents, focus on typical fields like: ${documentContext?.specialFields?.slice(0, 5).join(', ') || 'common fields'}
5. Only suggest mappings with confidence > 0.6
6. Use document context to boost confidence for relevant matches
7. Consider multi-language labels and regional variations

Special considerations for ${documentContext?.documentType || 'general'}:
- Bank statements: Focus on account details, amounts, dates
- Academic records: Focus on student info, grades, institutions
- Employment docs: Focus on employee details, salary, designation
- Government docs: Focus on official numbers, personal details

Return response in this exact JSON format:
{
  "mappings": [
    {
      "sourceField": "extracted_field_name",
      "targetField": "form_field_name", 
      "confidence": 0.85,
      "reasoning": "why this mapping makes sense for ${documentContext?.documentType || 'this document'}"
    }
  ]
}`;
  }

  /**
   * Parses AI mapping response
   */
  private static parseAIMappingResponse(aiResponse: any): FieldMapping[] {
    try {
      const parsed = typeof aiResponse.result === 'string' 
        ? JSON.parse(aiResponse.result)
        : aiResponse.result;

      return parsed.mappings.map((mapping: any) => ({
        sourceField: mapping.sourceField,
        targetField: mapping.targetField,
        confidence: mapping.confidence || 0.7,
        mappingType: 'ai_suggested' as const
      }));
    } catch (error) {
      console.error('Failed to parse AI mapping response:', error);
      return [];
    }
  }

  /**
   * Calculates string similarity for fuzzy matching
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculates Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Validates field mapping based on value and field type
   */
  static validateMapping(mapping: FieldMapping, extractedValue: any, formField: FormFieldInfo): boolean {
    const value = extractedValue?.toString() || '';
    
    // Check if field has validation pattern
    if (formField.validation && !formField.validation.test(value)) {
      return false;
    }
    
    // Check against known field type patterns
    const pattern = this.fieldTypePatterns[formField.fieldType];
    if (pattern && !pattern.test(value)) {
      return false;
    }
    
    return true;
  }

  /**
   * Applies transformation function if available
   */
  static transformValue(mapping: FieldMapping, value: any): any {
    if (mapping.transformFunction) {
      return mapping.transformFunction(value?.toString() || '');
    }
    return value;
  }

  /**
   * Gets mapping suggestions with confidence scores
   */
  static getMappingSuggestions(
    extractedFields: any[], 
    formFields: FormFieldInfo[]
  ): MappingSuggestion[] {
    const suggestions: MappingSuggestion[] = [];
    
    extractedFields.forEach(extracted => {
      const possibleMappings = formFields
        .map(formField => {
          const confidence = this.calculateMappingConfidence(extracted, formField);
          return {
            sourceField: extracted.fieldName,
            targetField: formField.fieldName,
            confidence,
            reasoning: this.generateMappingReasoning(extracted, formField, confidence),
            requiresConfirmation: confidence < 0.8
          };
        })
        .filter(mapping => mapping.confidence > 0.5)
        .sort((a, b) => b.confidence - a.confidence);
      
      if (possibleMappings.length > 0) {
        suggestions.push(possibleMappings[0]);
      }
    });
    
    return suggestions;
  }

  /**
   * Calculates mapping confidence score
   */
  private static calculateMappingConfidence(extracted: any, formField: FormFieldInfo): number {
    let confidence = 0;
    
    // Exact match
    if (extracted.fieldName.toLowerCase() === formField.fieldName.toLowerCase()) {
      confidence = 0.95;
    }
    // Semantic match
    else if (this.findContextAwareSemanticMatch(extracted.fieldName, [formField])) {
      confidence = 0.85;
    }
    // Pattern match
    else if (this.findEnhancedPatternMatch(extracted, [formField])) {
      confidence = 0.75;
    }
    // Similarity match
    else {
      confidence = this.calculateSimilarity(
        extracted.fieldName.toLowerCase(), 
        formField.fieldName.toLowerCase()
      ) * 0.7;
    }
    
    // Boost for required fields
    if (formField.required && confidence > 0.5) {
      confidence = Math.min(1.0, confidence + 0.1);
    }
    
    return confidence;
  }

  /**
   * Generates reasoning for mapping suggestion
   */
  private static generateMappingReasoning(
    extracted: any, 
    formField: FormFieldInfo, 
    confidence: number
  ): string {
    if (confidence > 0.9) {
      return `Exact match: "${extracted.fieldName}" directly corresponds to "${formField.fieldName}"`;
    } else if (confidence > 0.8) {
      return `Strong semantic match: "${extracted.fieldName}" is semantically similar to "${formField.fieldName}"`;
    } else if (confidence > 0.6) {
      return `Pattern match: Value pattern suggests this field maps to "${formField.fieldName}"`;
    } else {
      return `Possible match: Field names are similar and could represent the same data`;
    }
  }
}