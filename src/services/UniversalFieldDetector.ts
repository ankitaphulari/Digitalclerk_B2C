// Universal AI-powered field detection for any document type
// Uses GPT-4 Vision to intelligently detect and extract fields from any document

export interface DetectedField {
  fieldName: string;
  value: string;
  confidence: number;
  position: { line: number; column: number };
  fieldType: 'name' | 'address' | 'date' | 'number' | 'email' | 'phone' | 'text' | 'unknown';
  label?: string; // The actual label found in document (e.g., "Father's Name:", "नाम:")
}

export interface UniversalExtractionResult {
  documentType: string;
  detectedFields: DetectedField[];
  confidence: number;
  processingNotes: string[];
}

export class UniversalFieldDetector {
  
  /**
   * Uses AI to detect and extract all fields from any document with document-type awareness
   */
  static async detectFieldsWithAI(ocrText: string, imageBase64?: string): Promise<UniversalExtractionResult> {
    try {
      // First detect document type for context-aware processing
      const documentContext = await this.analyzeDocumentContext(ocrText);
      
      // Prepare the AI prompt with document-type specific context
      const prompt = this.createContextAwareDetectionPrompt(ocrText, documentContext);
      
      // Call OpenAI GPT-4 for intelligent field detection
      const aiResponse = await this.callOpenAIForFieldDetection(prompt, imageBase64);
      
      // Parse and structure the AI response with document context
      return this.parseAIResponse(aiResponse, ocrText, documentContext);
      
    } catch (error) {
      console.error('AI field detection failed:', error);
      // Fallback to enhanced rule-based detection
      return this.fallbackRuleBasedDetection(ocrText);
    }
  }

  /**
   * Analyzes document context and type for enhanced processing
   */
  private static async analyzeDocumentContext(ocrText: string): Promise<any> {
    // Import DocumentTypeDetector for document analysis
    const { DocumentTypeDetector } = await import('./DocumentTypeDetector');
    
    const detection = DocumentTypeDetector.detectDocumentType(ocrText);
    
    return {
      documentType: detection.type,
      confidence: detection.confidence,
      indicators: detection.indicators,
      extractionHints: DocumentTypeDetector.getExtractionHints(detection.type),
      specialFields: this.getDocumentSpecificFields(detection.type)
    };
  }

  /**
   * Gets document-specific field expectations
   */
  private static getDocumentSpecificFields(documentType: string): string[] {
    const fieldMap: Record<string, string[]> = {
      'bank_statement': ['account_number', 'ifsc_code', 'account_holder_name', 'bank_name', 'branch', 'statement_period', 'opening_balance', 'closing_balance'],
      'marksheet': ['student_name', 'roll_number', 'registration_number', 'exam_name', 'year', 'institution', 'subjects', 'grades', 'percentage', 'cgpa'],
      'salary_slip': ['employee_name', 'employee_id', 'designation', 'department', 'basic_salary', 'gross_salary', 'deductions', 'net_salary', 'pay_period'],
      'rent_agreement': ['tenant_name', 'landlord_name', 'property_address', 'rent_amount', 'security_deposit', 'lease_period', 'agreement_date'],
      'utility_bill': ['consumer_name', 'consumer_number', 'billing_address', 'bill_amount', 'due_date', 'service_provider', 'bill_period'],
      'pan': ['pan_number', 'name', 'fathers_name', 'date_of_birth'],
      'aadhaar': ['aadhaar_number', 'name', 'date_of_birth', 'address', 'gender'],
      'passport': ['passport_number', 'name', 'date_of_birth', 'place_of_birth', 'nationality', 'date_of_issue', 'date_of_expiry'],
      'license': ['license_number', 'name', 'address', 'date_of_birth', 'date_of_issue', 'date_of_expiry', 'vehicle_class']
    };
    
    return fieldMap[documentType] || [];
  }

  /**
   * Creates context-aware detection prompt based on document type
   */
  private static createContextAwareDetectionPrompt(ocrText: string, context: any): string {
    const documentType = context.documentType;
    const specialFields = context.specialFields;
    
    const documentSpecificInstructions = this.getDocumentSpecificInstructions(documentType);
    
    return `You are an expert ${documentType} analyzer. Analyze this OCR text and extract ALL meaningful fields with high accuracy.

Document Type: ${documentType}
Expected Fields: ${specialFields.join(', ')}

OCR Text:
${ocrText}

${documentSpecificInstructions}

Extract fields following these rules:
1. Focus on fields typical for ${documentType} documents
2. Identify field labels in multiple languages (English, Hindi, regional)
3. Extract actual VALUES (not labels)
4. Pay special attention to: ${specialFields.slice(0, 5).join(', ')}
5. Handle complex layouts and multi-column formats
6. Remove document headers and watermarks
7. Extract financial/academic/personal data as relevant

Return response in this exact JSON format:
{
  "documentType": "${documentType}",
  "fields": [
    {
      "fieldName": "standardized_name",
      "value": "extracted_value", 
      "confidence": 0.95,
      "fieldType": "name|address|date|number|email|phone|text|financial|academic",
      "label": "original_label_found",
      "context": "additional_context_if_needed"
    }
  ],
  "confidence": 0.90,
  "notes": ["processing notes"]
}

Focus on accuracy and completeness for ${documentType} specific information.`;
  }

  /**
   * Gets document-specific processing instructions
   */
  private static getDocumentSpecificInstructions(documentType: string): string {
    const instructions: Record<string, string> = {
      'bank_statement': `
Special Instructions for Bank Statement:
- Extract account number, IFSC code, and bank details
- Identify transaction patterns and amounts
- Look for opening/closing balances
- Extract statement period dates
- Handle multiple account formats`,
      
      'marksheet': `
Special Instructions for Academic Marksheet:
- Extract student details and roll numbers
- Identify subjects and corresponding grades
- Look for percentage, CGPA, or grade points
- Extract institution and exam details
- Handle different grading systems`,
      
      'salary_slip': `
Special Instructions for Salary Slip:
- Extract employee details and ID
- Identify salary components (basic, HRA, etc.)
- Look for deductions and net pay
- Extract pay period and organization details
- Handle different payslip formats`,
      
      'utility_bill': `
Special Instructions for Utility Bill:
- Extract consumer details and numbers
- Identify billing amounts and due dates
- Look for service period and provider
- Extract meter readings if present
- Handle electricity/water/gas bill formats`
    };
    
    return instructions[documentType] || `
Special Instructions:
- Extract all personal and relevant information
- Handle multiple languages and formats
- Focus on accuracy over quantity`;
  }

  /**
   * Calls OpenAI API for field detection
   */
  private static async callOpenAIForFieldDetection(prompt: string, imageBase64?: string): Promise<any> {
    const response = await fetch('/api/ai-field-detector', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        imageBase64,
        model: 'gpt-4.1-2025-04-14' // Use GPT-4.1 for vision capabilities
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API call failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Parses AI response into structured format with context awareness
   */
  private static parseAIResponse(aiResponse: any, originalText: string, context?: any): UniversalExtractionResult {
    try {
      const parsed = typeof aiResponse.result === 'string' 
        ? JSON.parse(aiResponse.result)
        : aiResponse.result;

      const detectedFields: DetectedField[] = parsed.fields.map((field: any, index: number) => ({
        fieldName: this.standardizeFieldName(field.fieldName, context?.documentType),
        value: this.cleanExtractedValue(field.value),
        confidence: field.confidence || 0.8,
        position: { line: index, column: 0 },
        fieldType: field.fieldType || 'text',
        label: field.label
      }));

      // Apply document-type specific validation
      const validatedFields = this.validateFieldsWithContext(detectedFields, context);

      return {
        documentType: parsed.documentType || context?.documentType || 'unknown',
        detectedFields: validatedFields,
        confidence: parsed.confidence || 0.8,
        processingNotes: parsed.notes || []
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.fallbackRuleBasedDetection(originalText);
    }
  }

  /**
   * Validates fields with document context
   */
  private static validateFieldsWithContext(fields: DetectedField[], context?: any): DetectedField[] {
    if (!context) return fields;
    
    return fields.map(field => {
      // Boost confidence for expected fields
      if (context.specialFields?.includes(field.fieldName)) {
        field.confidence = Math.min(1.0, field.confidence + 0.1);
      }
      
      // Apply document-specific validation
      if (context.documentType && this.validateFieldForDocumentType(field, context.documentType)) {
        field.confidence = Math.min(1.0, field.confidence + 0.05);
      }
      
      return field;
    });
  }

  /**
   * Validates field against document type expectations
   */
  private static validateFieldForDocumentType(field: DetectedField, documentType: string): boolean {
    const validationRules: Record<string, Record<string, RegExp>> = {
      'bank_statement': {
        'account_number': /^\d{9,18}$/,
        'ifsc_code': /^[A-Z]{4}0[A-Z0-9]{6}$/,
        'amount': /^\d+(\.\d{2})?$/
      },
      'marksheet': {
        'roll_number': /^[A-Z0-9]{6,15}$/,
        'percentage': /^\d{1,3}(\.\d{1,2})?%?$/,
        'cgpa': /^\d{1,2}(\.\d{1,2})?$/
      }
    };
    
    const rules = validationRules[documentType];
    if (!rules || !rules[field.fieldName]) return true;
    
    return rules[field.fieldName].test(field.value);
  }

  /**
   * Fallback rule-based detection when AI fails
   */
  private static fallbackRuleBasedDetection(ocrText: string): UniversalExtractionResult {
    const fields: DetectedField[] = [];
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Common field patterns for fallback
    const fieldPatterns = {
      name: [
        /(?:name|नाम|naam|full\s+name|applicant\s+name)[:.\s]+([a-zA-Z\s.'-]+)/i,
        /^([A-Z][A-Z\s.'-]{2,30})$/
      ],
      fathersName: [
        /(?:father|पिता|f\/o|father's\s+name)[:.\s]+([a-zA-Z\s.'-]+)/i
      ],
      address: [
        /(?:address|पता|addr|residence)[:.\s]+(.+?)(?=\d{6}|\n|$)/is
      ],
      phone: [
        /(?:phone|mobile|mob|फोन)[:.\s]*([\d\s\-\+\(\)]{10,15})/i,
        /\b(\d{10})\b/
      ],
      email: [
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
      ],
      date: [
        /(?:dob|date|birth|जन्म)[:.\s]*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i,
        /\b([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})\b/
      ]
    };

    // Extract fields using patterns
    Object.entries(fieldPatterns).forEach(([fieldType, patterns]) => {
      patterns.forEach(pattern => {
        const match = ocrText.match(pattern);
        if (match && match[1]) {
          const value = this.cleanExtractedValue(match[1]);
          if (value && !this.isDuplicateField(fields, fieldType, value)) {
            fields.push({
              fieldName: fieldType,
              value,
              confidence: 0.7,
              position: { line: 0, column: 0 },
              fieldType: fieldType as any,
              label: match[0].split(':')[0] || fieldType
            });
          }
        }
      });
    });

    return {
      documentType: 'unknown',
      detectedFields: fields,
      confidence: 0.7,
      processingNotes: ['Used fallback rule-based detection']
    };
  }

  /**
   * Standardizes field names for consistent mapping with document context
   */
  private static standardizeFieldName(fieldName: string, documentType?: string): string {
    const baseFieldMap: Record<string, string> = {
      'full_name': 'name',
      'applicant_name': 'name',
      'student_name': 'name',
      'account_holder_name': 'name',
      'employee_name': 'name',
      'consumer_name': 'name',
      'fathers_name': 'fathersName',
      'father_name': 'fathersName',
      'guardian_name': 'fathersName',
      'parent_name': 'fathersName',
      'date_of_birth': 'dob',
      'birth_date': 'dob',
      'dob': 'dob',
      'mobile_number': 'phone',
      'phone_number': 'phone',
      'contact': 'phone',
      'contact_number': 'phone',
      'email_address': 'email',
      'permanent_address': 'address',
      'current_address': 'address',
      'billing_address': 'address',
      'residence': 'address',
      'property_address': 'address'
    };

    // Document-specific field mappings
    const documentSpecificMaps: Record<string, Record<string, string>> = {
      'bank_statement': {
        'account_no': 'accountNumber',
        'acc_no': 'accountNumber',
        'account_holder': 'name',
        'ifsc': 'ifscCode',
        'branch_code': 'ifscCode',
        'opening_bal': 'openingBalance',
        'closing_bal': 'closingBalance'
      },
      'marksheet': {
        'roll_no': 'rollNumber',
        'reg_no': 'registrationNumber',
        'student_id': 'rollNumber',
        'marks': 'totalMarks',
        'grade': 'finalGrade',
        'cgpa': 'cgpa',
        'institution_name': 'institution'
      },
      'salary_slip': {
        'emp_id': 'employeeId',
        'employee_code': 'employeeId',
        'basic_pay': 'basicSalary',
        'gross_pay': 'grossSalary',
        'net_pay': 'netSalary',
        'designation': 'designation'
      }
    };

    const normalized = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Check document-specific mapping first
    if (documentType && documentSpecificMaps[documentType]?.[normalized]) {
      return documentSpecificMaps[documentType][normalized];
    }
    
    // Fall back to base mapping
    return baseFieldMap[normalized] || fieldName;
  }

  /**
   * Cleans extracted values
   */
  private static cleanExtractedValue(value: string): string {
    if (!value) return '';
    
    return value
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[:\-]+$/, '') // Remove trailing colons/dashes
      .replace(/^[:\-]+/, '') // Remove leading colons/dashes
      .trim();
  }

  /**
   * Checks for duplicate fields
   */
  private static isDuplicateField(fields: DetectedField[], fieldType: string, value: string): boolean {
    return fields.some(field => 
      field.fieldName === fieldType && 
      field.value.toLowerCase() === value.toLowerCase()
    );
  }

  /**
   * Validates extracted field based on type
   */
  static validateExtractedField(field: DetectedField): boolean {
    const value = field.value.trim();
    
    switch (field.fieldType) {
      case 'name':
        return value.length >= 2 && value.length <= 50 && /^[a-zA-Z\s.'-]+$/.test(value);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return /^\d{10,15}$/.test(value.replace(/\D/g, ''));
      case 'date':
        return /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/.test(value);
      default:
        return value.length > 0;
    }
  }
}