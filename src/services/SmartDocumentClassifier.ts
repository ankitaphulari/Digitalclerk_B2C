// SmartDocumentClassifier.ts
// AI-powered classification for all 29 document types with fallback to rule-based

export interface DocumentClassification {
  documentType: string;
  category: string;
  confidence: number;
  characteristics: string[];
  suggestedForms: string[];
}

export class SmartDocumentClassifier {
  
  private static readonly DOCUMENT_CATEGORIES = {
    identity: ['aadhaar', 'pan', 'passport', 'voter_id', 'driving_license', 'ration_card'],
    educational: ['marksheet', 'degree_certificate', 'caste_certificate', 'caste_validity', 'income_certificate', 'domicile_certificate'],
    financial: ['bank_statement', 'salary_slip', 'itr', 'form_16'],
    utility: ['electricity_bill', 'gas_bill_lpg', 'gas_bill_png', 'water_bill', 'telephone_bill', 'broadband_bill'],
    vehicle: ['vehicle_rc', 'vehicle_insurance'],
    property: ['property_tax', 'rent_agreement'],
    health: ['ayushman_bharat', 'abha_card']
  };

  private static readonly FORM_SUGGESTIONS: Record<string, string[]> = {
    aadhaar: ['KYC Form', 'Address Proof', 'Identity Proof'],
    pan: ['Income Tax Form', 'Bank Account Opening', 'Financial KYC'],
    caste_certificate: ['Scholarship Application', 'College Admission', 'Government Job Application'],
    caste_validity: ['College Admission', 'Competitive Exam Application'],
    marksheet: ['College Admission', 'Job Application', 'Higher Education'],
    bank_statement: ['Loan Application', 'Visa Application', 'Income Proof'],
    salary_slip: ['Loan Application', 'Credit Card', 'Income Proof'],
    driving_license: ['Vehicle Registration', 'Insurance', 'Identity Proof'],
    passport: ['Visa Application', 'International Travel', 'Identity Proof'],
    voter_id: ['Identity Proof', 'Address Proof', 'Age Proof']
  };

  /**
   * Classify document using AI with rule-based fallback
   */
  static async classifyDocument(
    ocrText: string,
    imageBase64?: string
  ): Promise<DocumentClassification> {
    
    console.log('🔍 Starting document classification...');

    // Try AI classification first
    if (imageBase64) {
      try {
        const aiClassification = await this.classifyWithAI(ocrText, imageBase64);
        if (aiClassification && aiClassification.confidence > 0.7) {
          console.log('✅ AI Classification successful');
          return aiClassification;
        }
      } catch (error) {
        console.warn('⚠️ AI classification failed, falling back to rule-based');
      }
    }

    // Fallback to rule-based classification
    return this.classifyWithRules(ocrText);
  }

  /**
   * AI-powered classification using GPT-4 Vision
   */
  private static async classifyWithAI(
    ocrText: string,
    imageBase64: string
  ): Promise<DocumentClassification | null> {
    
    try {
      const response = await fetch('/api/ai-document-classifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrText,
          imageBase64,
          documentTypes: this.getAllDocumentTypes(),
          model: 'gpt-4-vision-preview'
        })
      });

      if (!response.ok) {
        throw new Error('AI classification API failed');
      }

      const result = await response.json();
      return this.parseAIResponse(result);
      
    } catch (error) {
      console.error('AI classification error:', error);
      return null;
    }
  }

  /**
   * Rule-based classification (fallback)
   */
  private static classifyWithRules(ocrText: string): DocumentClassification {
    const upperText = ocrText.toUpperCase();
    const classifications: Array<{ type: string; score: number; chars: string[] }> = [];

    // Score each document type
    const scoringRules = {
      aadhaar: {
        keywords: ['UIDAI', 'AADHAAR', 'आधार', 'UNIQUE IDENTIFICATION'],
        patterns: [/\d{4}\s?\d{4}\s?\d{4}/],
        score: 0
      },
      pan: {
        keywords: ['INCOME TAX', 'PERMANENT ACCOUNT', 'PAN'],
        patterns: [/[A-Z]{5}\d{4}[A-Z]/],
        score: 0
      },
      caste_certificate: {
        keywords: ['CASTE CERTIFICATE', 'जाति प्रमाण', 'SC', 'ST', 'OBC'],
        patterns: [/\b\d{4}\b/],
        score: 0
      },
      caste_validity: {
        keywords: ['CASTE VALIDITY', 'SCRUTINY COMMITTEE', 'VALIDITY'],
        patterns: [/\b\d{8}\b/],
        score: 0
      },
      voter_id: {
        keywords: ['ELECTION COMMISSION', 'EPIC', 'VOTER'],
        patterns: [/[A-Z]{3}\d{7}/],
        score: 0
      },
      passport: {
        keywords: ['PASSPORT', 'REPUBLIC OF INDIA', 'MINISTRY OF EXTERNAL'],
        patterns: [/[A-Z]{1,2}\d{7}/],
        score: 0
      },
      driving_license: {
        keywords: ['DRIVING LICENCE', 'TRANSPORT DEPARTMENT', 'DL'],
        patterns: [/[A-Z]{2}-\d{2}-\d{4}-\d{7}/],
        score: 0
      },
      marksheet: {
        keywords: ['MARKSHEET', 'MARK SHEET', 'UNIVERSITY', 'BOARD', 'EXAMINATION'],
        patterns: [/ROLL|PERCENTAGE|CGPA/i],
        score: 0
      },
      bank_statement: {
        keywords: ['BANK STATEMENT', 'ACCOUNT STATEMENT', 'IFSC'],
        patterns: [/OPENING BALANCE|CLOSING BALANCE|DEBIT|CREDIT/i],
        score: 0
      },
      salary_slip: {
        keywords: ['SALARY SLIP', 'PAY SLIP', 'GROSS SALARY', 'NET SALARY'],
        patterns: [/BASIC|HRA|DEDUCTIONS/i],
        score: 0
      },
      electricity_bill: {
        keywords: ['ELECTRICITY', 'POWER', 'CONSUMER NUMBER', 'UNITS'],
        patterns: [/KWH|METER/i],
        score: 0
      },
      vehicle_rc: {
        keywords: ['REGISTRATION CERTIFICATE', 'VEHICLE', 'ENGINE NUMBER'],
        patterns: [/[A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{4}/],
        score: 0
      },
      itr: {
        keywords: ['INCOME TAX RETURN', 'ITR', 'ACKNOWLEDGEMENT'],
        patterns: [/ASSESSMENT YEAR|PAN/i],
        score: 0
      }
    };

    // Calculate scores
    Object.entries(scoringRules).forEach(([docType, rules]) => {
      let score = 0;
      const characteristics: string[] = [];

      // Keyword matching (40 points)
      rules.keywords.forEach(keyword => {
        if (upperText.includes(keyword)) {
          score += 10;
          characteristics.push(`Keyword: ${keyword}`);
        }
      });

      // Pattern matching (60 points)
      rules.patterns.forEach(pattern => {
        if (pattern.test(ocrText) || pattern.test(upperText)) {
          score += 30;
          characteristics.push(`Pattern match`);
        }
      });

      if (score > 0) {
        classifications.push({ type: docType, score, chars: characteristics });
      }
    });

    // Sort by score
    classifications.sort((a, b) => b.score - a.score);

    // Return best match or unknown
    if (classifications.length > 0 && classifications[0].score >= 30) {
      const best = classifications[0];
      return {
        documentType: best.type,
        category: this.getCategory(best.type),
        confidence: Math.min(best.score / 100, 1),
        characteristics: best.chars,
        suggestedForms: this.FORM_SUGGESTIONS[best.type] || []
      };
    }

    return {
      documentType: 'unknown',
      category: 'other',
      confidence: 0.1,
      characteristics: ['Unable to identify document type'],
      suggestedForms: []
    };
  }

  /**
   * Parse AI classification response
   */
  private static parseAIResponse(aiResponse: any): DocumentClassification {
    try {
      const parsed = typeof aiResponse.result === 'string' 
        ? JSON.parse(aiResponse.result)
        : aiResponse.result;

      return {
        documentType: parsed.documentType || 'unknown',
        category: this.getCategory(parsed.documentType),
        confidence: parsed.confidence || 0.5,
        characteristics: parsed.characteristics || [],
        suggestedForms: this.FORM_SUGGESTIONS[parsed.documentType] || []
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        documentType: 'unknown',
        category: 'other',
        confidence: 0.1,
        characteristics: [],
        suggestedForms: []
      };
    }
  }

  /**
   * Get category for document type
   */
  private static getCategory(documentType: string): string {
    for (const [category, types] of Object.entries(this.DOCUMENT_CATEGORIES)) {
      if (types.includes(documentType)) {
        return category;
      }
    }
    return 'other';
  }

  /**
   * Get all supported document types
   */
  private static getAllDocumentTypes(): string[] {
    return Object.values(this.DOCUMENT_CATEGORIES).flat();
  }

  /**
   * Get suggested forms for a document type
   */
  static getSuggestedForms(documentType: string): string[] {
    return this.FORM_SUGGESTIONS[documentType] || [];
  }

  /**
   * Get documents by category
   */
  static getDocumentsByCategory(category: string): string[] {
    return this.DOCUMENT_CATEGORIES[category as keyof typeof this.DOCUMENT_CATEGORIES] || [];
  }

  /**
   * Validate if document type is supported
   */
  static isDocumentTypeSupported(documentType: string): boolean {
    return this.getAllDocumentTypes().includes(documentType);
  }
}
