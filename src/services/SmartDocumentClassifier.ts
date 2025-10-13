// Smart AI-powered document classification for any document type
// Automatically detects document types without predefined patterns

export interface DocumentClassification {
  documentType: string;
  category: string;
  confidence: number;
  subType?: string;
  characteristics: string[];
  suggestedForms?: string[];
}

export interface DocumentTypeMapping {
  type: string;
  category: 'government_id' | 'educational' | 'financial' | 'legal' | 'medical' | 'employment' | 'other';
  commonFields: string[];
  relatedForms: string[];
}

export class SmartDocumentClassifier {
  
  // Dynamic document type mappings that can be expanded
  private static documentTypeMappings: DocumentTypeMapping[] = [
    // Government IDs
    { type: 'pan_card', category: 'government_id', commonFields: ['name', 'fathersName', 'dob', 'panNumber'], relatedForms: ['income_tax', 'bank_account', 'investment'] },
    { type: 'aadhaar_card', category: 'government_id', commonFields: ['name', 'dob', 'address', 'aadhaarNumber'], relatedForms: ['bank_account', 'mobile_connection', 'gas_connection'] },
    { type: 'passport', category: 'government_id', commonFields: ['name', 'dob', 'address', 'passportNumber'], relatedForms: ['visa_application', 'travel_insurance'] },
    { type: 'voter_id', category: 'government_id', commonFields: ['name', 'address', 'voterNumber'], relatedForms: ['election_registration'] },
    { type: 'driving_license', category: 'government_id', commonFields: ['name', 'address', 'dob', 'licenseNumber'], relatedForms: ['vehicle_registration', 'insurance'] },
    
    // Educational Documents
    { type: 'marksheet', category: 'educational', commonFields: ['name', 'rollNumber', 'marks', 'board'], relatedForms: ['college_admission', 'scholarship'] },
    { type: 'degree_certificate', category: 'educational', commonFields: ['name', 'degree', 'university', 'year'], relatedForms: ['job_application', 'higher_studies'] },
    { type: 'transfer_certificate', category: 'educational', commonFields: ['name', 'school', 'class'], relatedForms: ['school_admission'] },
    
    // Financial Documents
    { type: 'bank_statement', category: 'financial', commonFields: ['accountNumber', 'balance', 'transactions'], relatedForms: ['loan_application', 'credit_card'] },
    { type: 'salary_slip', category: 'financial', commonFields: ['name', 'salary', 'company', 'month'], relatedForms: ['loan_application', 'tax_filing'] },
    { type: 'tax_return', category: 'financial', commonFields: ['name', 'income', 'tax', 'year'], relatedForms: ['income_certificate'] },
    
    // Legal Documents
    { type: 'property_document', category: 'legal', commonFields: ['ownerName', 'propertyAddress', 'area'], relatedForms: ['property_registration', 'home_loan'] },
    { type: 'agreement', category: 'legal', commonFields: ['parties', 'terms', 'date'], relatedForms: ['legal_registration'] },
    
    // Medical Documents
    { type: 'medical_certificate', category: 'medical', commonFields: ['patientName', 'doctorName', 'diagnosis'], relatedForms: ['insurance_claim', 'medical_leave'] },
    { type: 'prescription', category: 'medical', commonFields: ['patientName', 'medicines', 'doctorName'], relatedForms: ['medicine_purchase'] },
    
    // Employment Documents
    { type: 'employment_certificate', category: 'employment', commonFields: ['employeeName', 'company', 'designation'], relatedForms: ['loan_application', 'visa_application'] },
    { type: 'experience_letter', category: 'employment', commonFields: ['employeeName', 'experience', 'company'], relatedForms: ['job_application'] }
  ];

  /**
   * Classifies any document using AI-powered analysis
   */
  static async classifyDocument(ocrText: string, imageBase64?: string): Promise<DocumentClassification> {
    try {
      // First try AI-powered classification
      const aiClassification = await this.classifyWithAI(ocrText, imageBase64);
      
      // Enhance with rule-based validation
      const enhancedClassification = this.enhanceClassification(aiClassification, ocrText);
      
      return enhancedClassification;
      
    } catch (error) {
      console.error('AI classification failed:', error);
      // Fallback to rule-based classification
      return this.fallbackClassification(ocrText);
    }
  }

  /**
   * Uses AI to classify document type intelligently
   */
  private static async classifyWithAI(ocrText: string, imageBase64?: string): Promise<DocumentClassification> {
    const prompt = this.createClassificationPrompt(ocrText);
    
    const response = await fetch('/api/ai-document-classifier', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        imageBase64,
        model: 'gpt-4.1-2025-04-14'
      }),
    });

    if (!response.ok) {
      throw new Error(`AI classification failed: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    return this.parseClassificationResponse(aiResponse);
  }

  /**
   * Creates intelligent prompt for document classification
   */
  private static createClassificationPrompt(ocrText: string): string {
    const knownTypes = this.documentTypeMappings.map(m => m.type).join(', ');
    
    return `You are an expert document classifier. Analyze this OCR text and classify the document type with high accuracy.

OCR Text:
${ocrText}

Known document types include: ${knownTypes}

But you can identify ANY document type, not just these. Consider:
1. Document headers and official text
2. Field patterns and data types
3. Language and formatting style
4. Government/institutional markers
5. Purpose and context clues

Return response in this exact JSON format:
{
  "documentType": "specific_type",
  "category": "government_id|educational|financial|legal|medical|employment|other",
  "confidence": 0.95,
  "subType": "optional_subtype",
  "characteristics": ["key identifying features"],
  "suggestedForms": ["forms this document might be useful for"]
}

Be specific with document type (e.g., "pan_card" not just "id_card").`;
  }

  /**
   * Parses AI classification response
   */
  private static parseClassificationResponse(aiResponse: any): DocumentClassification {
    try {
      const parsed = typeof aiResponse.result === 'string' 
        ? JSON.parse(aiResponse.result)
        : aiResponse.result;

      return {
        documentType: parsed.documentType || 'unknown',
        category: parsed.category || 'other',
        confidence: parsed.confidence || 0.8,
        subType: parsed.subType,
        characteristics: parsed.characteristics || [],
        suggestedForms: parsed.suggestedForms || []
      };
    } catch (error) {
      console.error('Failed to parse classification response:', error);
      throw error;
    }
  }

  /**
   * Enhances AI classification with rule-based validation
   */
  private static enhanceClassification(
    aiClassification: DocumentClassification, 
    ocrText: string
  ): DocumentClassification {
    const upperText = ocrText.toUpperCase();
    
    // Validate and adjust confidence based on known patterns
    const validationRules = [
      {
        type: 'pan_card',
        patterns: [/\b[A-Z]{5}[0-9]{4}[A-Z]\b/, /INCOME TAX/, /PERMANENT ACCOUNT/],
        boost: 0.2
      },
      {
        type: 'aadhaar_card',
        patterns: [/\b\d{4}\s?\d{4}\s?\d{4}\b/, /UIDAI/, /आधार/],
        boost: 0.2
      },
      {
        type: 'passport',
        patterns: [/\b[A-Z]\d{7}\b/, /REPUBLIC OF INDIA/, /PASSPORT/],
        boost: 0.2
      },
      // Add more validation rules for other document types
    ];

    let enhancedClassification = { ...aiClassification };

    validationRules.forEach(rule => {
      if (rule.patterns.some(pattern => pattern.test(upperText))) {
        if (aiClassification.documentType === rule.type) {
          // Boost confidence if AI got it right
          enhancedClassification.confidence = Math.min(1.0, enhancedClassification.confidence + rule.boost);
        } else if (enhancedClassification.confidence < 0.7) {
          // Override if AI confidence is low and we have strong pattern match
          enhancedClassification.documentType = rule.type;
          enhancedClassification.confidence = 0.85;
        }
      }
    });

    // Add mapping data if available
    const mapping = this.documentTypeMappings.find(m => m.type === enhancedClassification.documentType);
    if (mapping) {
      enhancedClassification.category = mapping.category;
      enhancedClassification.suggestedForms = mapping.relatedForms;
    }

    return enhancedClassification;
  }

  /**
   * Fallback classification using rule-based patterns
   */
  private static fallbackClassification(ocrText: string): DocumentClassification {
    const upperText = ocrText.toUpperCase();
    
    // Rule-based classification patterns
    const classificationRules = [
      {
        type: 'pan_card',
        category: 'government_id' as const,
        patterns: [/\b[A-Z]{5}[0-9]{4}[A-Z]\b/, /INCOME TAX/, /PERMANENT ACCOUNT/],
        characteristics: ['PAN number format', 'Income Tax Department']
      },
      {
        type: 'aadhaar_card',
        category: 'government_id' as const,
        patterns: [/\b\d{4}\s?\d{4}\s?\d{4}\b/, /UIDAI/, /आधार/, /UNIQUE IDENTIFICATION/],
        characteristics: ['12-digit number', 'UIDAI header']
      },
      {
        type: 'passport',
        category: 'government_id' as const,
        patterns: [/\b[A-Z]\d{7}\b/, /REPUBLIC OF INDIA/, /PASSPORT/, /MINISTRY OF EXTERNAL/],
        characteristics: ['Passport number format', 'Republic of India header']
      },
      {
        type: 'marksheet',
        category: 'educational' as const,
        patterns: [/MARKS?HEET/, /ROLL\s+NO/, /BOARD/, /EXAMINATION/, /SUBJECT/, /MARKS/],
        characteristics: ['Roll number', 'Marks/grades', 'Board name']
      },
      {
        type: 'salary_slip',
        category: 'financial' as const,
        patterns: [/SALARY/, /PAY\s+SLIP/, /BASIC\s+PAY/, /ALLOWANCE/, /DEDUCTION/, /NET\s+PAY/],
        characteristics: ['Salary components', 'Monthly pay details']
      }
    ];

    for (const rule of classificationRules) {
      const matchCount = rule.patterns.filter(pattern => pattern.test(upperText)).length;
      if (matchCount > 0) {
        const confidence = Math.min(0.9, 0.6 + (matchCount * 0.15));
        
        const mapping = this.documentTypeMappings.find(m => m.type === rule.type);
        
        return {
          documentType: rule.type,
          category: rule.category,
          confidence,
          characteristics: rule.characteristics,
          suggestedForms: mapping?.relatedForms || []
        };
      }
    }

    return {
      documentType: 'unknown',
      category: 'other',
      confidence: 0.3,
      characteristics: ['Unable to classify'],
      suggestedForms: []
    };
  }

  /**
   * Gets document type mapping information
   */
  static getDocumentTypeMapping(documentType: string): DocumentTypeMapping | undefined {
    return this.documentTypeMappings.find(mapping => mapping.type === documentType);
  }

  /**
   * Adds new document type mapping (for learning system)
   */
  static addDocumentTypeMapping(mapping: DocumentTypeMapping): void {
    const existingIndex = this.documentTypeMappings.findIndex(m => m.type === mapping.type);
    if (existingIndex >= 0) {
      this.documentTypeMappings[existingIndex] = mapping;
    } else {
      this.documentTypeMappings.push(mapping);
    }
  }

  /**
   * Gets suggested forms for a document type
   */
  static getSuggestedForms(documentType: string): string[] {
    const mapping = this.getDocumentTypeMapping(documentType);
    return mapping?.relatedForms || [];
  }

  /**
   * Gets all supported document categories
   */
  static getAllCategories(): string[] {
    return [...new Set(this.documentTypeMappings.map(m => m.category))];
  }

  /**
   * Gets all document types in a category
   */
  static getDocumentTypesByCategory(category: string): string[] {
    return this.documentTypeMappings
      .filter(m => m.category === category)
      .map(m => m.type);
  }
}