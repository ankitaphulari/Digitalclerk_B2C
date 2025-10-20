// UniversalFallbackExtractor.ts
// Handles ANY document type that doesn't have a specific extractor
// Uses AI + intelligent pattern matching to extract relevant data

export interface UniversalExtractionResult {
  documentType: string;
  confidence: number;
  extractedFields: Record<string, any>;
  structuredData: {
    names: string[];
    dates: string[];
    numbers: string[];
    addresses: string[];
    emails: string[];
    phones: string[];
    amounts: string[];
  };
  aiSuggestions?: Record<string, any>;
}

export class UniversalFallbackExtractor {
  
  /**
   * Extract data from ANY document using intelligent pattern matching
   */
  static async extractFromUnknownDocument(
    ocrText: string,
    imageBase64?: string,
    requiredFields?: string[]
  ): Promise<UniversalExtractionResult> {
    
    console.log('🔮 Universal Fallback Extractor - Processing unknown document');
    
    const result: UniversalExtractionResult = {
      documentType: 'unknown',
      confidence: 0,
      extractedFields: {},
      structuredData: {
        names: [],
        dates: [],
        numbers: [],
        addresses: [],
        emails: [],
        phones: [],
        amounts: []
      }
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    // STEP 1: Extract all structured data types
    result.structuredData = this.extractStructuredData(ocrText);
    
    // STEP 2: Try to identify common fields
    const commonFields = this.extractCommonFields(ocrText);
    Object.assign(result.extractedFields, commonFields);
    
    // STEP 3: If AI is available and we have required fields, use AI
    if (imageBase64 && requiredFields && requiredFields.length > 0) {
      try {
        const aiResult = await this.extractWithAI(ocrText, imageBase64, requiredFields);
        if (aiResult) {
          result.aiSuggestions = aiResult;
          Object.assign(result.extractedFields, aiResult);
        }
      } catch (error) {
        console.warn('AI extraction failed, using rule-based only');
      }
    }
    
    // STEP 4: Calculate confidence
    result.confidence = this.calculateConfidence(result);
    
    console.log('✅ Fallback extraction complete:', {
      fieldsExtracted: Object.keys(result.extractedFields).length,
      confidence: result.confidence
    });
    
    return result;
  }

  /**
   * Extract all structured data types (names, dates, numbers, etc.)
   */
  private static extractStructuredData(text: string): {
    names: string[];
    dates: string[];
    numbers: string[];
    addresses: string[];
    emails: string[];
    phones: string[];
    amounts: string[];
  } {
    return {
      names: this.extractNames(text),
      dates: this.extractDates(text),
      numbers: this.extractNumbers(text),
      addresses: this.extractAddresses(text),
      emails: this.extractEmails(text),
      phones: this.extractPhones(text),
      amounts: this.extractAmounts(text)
    };
  }

  /**
   * Extract potential names
   */
  private static extractNames(text: string): string[] {
    const names: string[] = [];
    const lines = text.split('\n');
    
    // Pattern: 2-4 capitalized words
    const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g;
    
    let match;
    while ((match = namePattern.exec(text)) !== null) {
      const name = match[1].trim();
      // Filter out common non-names
      if (name.length >= 5 && 
          !this.isCommonNonName(name) &&
          !names.includes(name)) {
        names.push(name);
      }
    }
    
    return names.slice(0, 10); // Max 10 names
  }

  /**
   * Extract all dates
   */
  private static extractDates(text: string): string[] {
    const dates: string[] = [];
    
    const datePatterns = [
      /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b/g,
      /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/gi,
      /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi
    ];
    
    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (!dates.includes(match[1])) {
          dates.push(match[1]);
        }
      }
    });
    
    return dates;
  }

  /**
   * Extract all numbers (potential IDs, account numbers, etc.)
   */
  private static extractNumbers(text: string): string[] {
    const numbers: string[] = [];
    
    // Various number patterns
    const patterns = [
      /\b(\d{4,})\b/g,                           // 4+ digits
      /\b([A-Z0-9]{6,})\b/g,                     // Alphanumeric 6+ chars
      /\b([A-Z]{2,5}\d{4,}[A-Z]?)\b/g,          // Mixed patterns
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const num = match[1];
        if (num.length >= 4 && num.length <= 20 && !numbers.includes(num)) {
          numbers.push(num);
        }
      }
    });
    
    return numbers.slice(0, 20);
  }

  /**
   * Extract addresses
   */
  private static extractAddresses(text: string): string[] {
    const addresses: string[] = [];
    
    // Look for lines with address keywords
    const lines = text.split('\n');
    let addressBuffer = '';
    let capturing = false;
    
    for (const line of lines) {
      const hasAddressKeyword = /(?:Address|पता|Residence|Location|Street|Road|City|State|PIN)/i.test(line);
      const hasPincode = /\b\d{6}\b/.test(line);
      
      if (hasAddressKeyword || capturing) {
        capturing = true;
        addressBuffer += line + ' ';
        
        if (hasPincode) {
          addresses.push(addressBuffer.trim());
          addressBuffer = '';
          capturing = false;
        }
      }
    }
    
    return addresses.filter(addr => addr.length > 20);
  }

  /**
   * Extract emails
   */
  private static extractEmails(text: string): string[] {
    const emails: string[] = [];
    const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
    
    let match;
    while ((match = emailPattern.exec(text)) !== null) {
      if (!emails.includes(match[1])) {
        emails.push(match[1]);
      }
    }
    
    return emails;
  }

  /**
   * Extract phone numbers
   */
  private static extractPhones(text: string): string[] {
    const phones: string[] = [];
    
    const phonePatterns = [
      /\b(\+91[\s-]?\d{10})\b/g,
      /\b([6-9]\d{9})\b/g,
      /\b(\d{3}[-\s]?\d{3}[-\s]?\d{4})\b/g
    ];
    
    phonePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const phone = match[1].replace(/\D/g, '');
        if (phone.length === 10 && !phones.includes(phone)) {
          phones.push(phone);
        }
      }
    });
    
    return phones;
  }

  /**
   * Extract amounts/money
   */
  private static extractAmounts(text: string): string[] {
    const amounts: string[] = [];
    
    const amountPatterns = [
      /(?:₹|Rs\.?|INR)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      /\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:₹|Rs\.?|INR|Rupees)/gi
    ];
    
    amountPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (!amounts.includes(match[1])) {
          amounts.push(match[1]);
        }
      }
    });
    
    return amounts;
  }

  /**
   * Extract common fields using heuristics
   */
  private static extractCommonFields(text: string): Record<string, any> {
    const fields: Record<string, any> = {};
    
    // Try to find name
    const namePatterns = [
      /(?:Name|नाम|Full Name)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i,
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        fields.name = match[1].trim();
        fields.fullName = match[1].trim();
        break;
      }
    }
    
    // Try to find date of birth
    const dobPatterns = [
      /(?:DOB|Date of Birth|जन्म तिथि|D\.O\.B)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
    ];
    
    for (const pattern of dobPatterns) {
      const match = text.match(pattern);
      if (match) {
        fields.dob = match[1];
        fields.dateOfBirth = match[1];
        break;
      }
    }
    
    // Try to find gender
    const genderMatch = text.match(/(?:Gender|Sex|लिंग)\s*:?\s*(Male|Female|M|F|पुरुष|महिला)/i);
    if (genderMatch) {
      const gender = genderMatch[1].toUpperCase();
      fields.gender = gender.startsWith('M') || gender === 'पुरुष' ? 'Male' : 'Female';
    }
    
    // Try to find father's name
    const fatherMatch = text.match(/(?:Father|Father'?s Name|S\/O|पिता)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i);
    if (fatherMatch) {
      fields.fathersName = fatherMatch[1].trim();
      fields.fathers_name = fatherMatch[1].trim();
    }
    
    // Try to find mother's name
    const motherMatch = text.match(/(?:Mother|Mother'?s Name|D\/O|माता)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i);
    if (motherMatch) {
      fields.mothersName = motherMatch[1].trim();
      fields.mothers_name = motherMatch[1].trim();
    }
    
    return fields;
  }

  /**
   * Use AI to extract required fields
   */
  private static async extractWithAI(
    ocrText: string,
    imageBase64: string,
    requiredFields: string[]
  ): Promise<Record<string, any> | null> {
    try {
      const response = await fetch('/api/ai-universal-extractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrText,
          imageBase64,
          requiredFields,
          model: 'gpt-4-vision-preview'
        })
      });

      if (!response.ok) {
        throw new Error('AI extraction failed');
      }

      const result = await response.json();
      return this.parseAIExtractionResponse(result);
      
    } catch (error) {
      console.error('AI extraction error:', error);
      return null;
    }
  }

  /**
   * Parse AI extraction response
   */
  private static parseAIExtractionResponse(aiResponse: any): Record<string, any> | null {
    try {
      const parsed = typeof aiResponse.result === 'string' 
        ? JSON.parse(aiResponse.result)
        : aiResponse.result;

      return parsed.extractedFields || parsed;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return null;
    }
  }

  /**
   * Calculate extraction confidence
   */
  private static calculateConfidence(result: UniversalExtractionResult): number {
    let confidence = 0;
    
    // Base confidence from extracted fields
    const fieldCount = Object.keys(result.extractedFields).length;
    confidence += Math.min(fieldCount * 10, 40);
    
    // Bonus for structured data
    const structuredCount = Object.values(result.structuredData).reduce(
      (sum, arr) => sum + arr.length, 
      0
    );
    confidence += Math.min(structuredCount * 2, 30);
    
    // Bonus for AI suggestions
    if (result.aiSuggestions) {
      confidence += 30;
    }
    
    return Math.min(confidence, 100);
  }

  /**
   * Check if text is a common non-name
   */
  private static isCommonNonName(text: string): boolean {
    const nonNames = [
      'GOVERNMENT', 'INDIA', 'CERTIFICATE', 'DEPARTMENT',
      'MINISTRY', 'OFFICE', 'ISSUED', 'DATE', 'NUMBER',
      'ADDRESS', 'PERMANENT', 'TEMPORARY', 'ORIGINAL'
    ];
    
    return nonNames.some(word => text.toUpperCase().includes(word));
  }

  /**
   * Map extracted data to form fields intelligently
   */
  static mapToFormFields(
    extractionResult: UniversalExtractionResult,
    formFields: string[]
  ): Record<string, any> {
    const mapped: Record<string, any> = {};
    
    formFields.forEach(fieldName => {
      const fieldLower = fieldName.toLowerCase();
      
      // Direct mapping from extracted fields
      if (extractionResult.extractedFields[fieldName]) {
        mapped[fieldName] = extractionResult.extractedFields[fieldName];
        return;
      }
      
      // Smart mapping based on field type
      if (fieldLower.includes('name') && !fieldLower.includes('father') && !fieldLower.includes('mother')) {
        mapped[fieldName] = extractionResult.structuredData.names[0] || extractionResult.extractedFields.name;
      }
      else if (fieldLower.includes('father')) {
        mapped[fieldName] = extractionResult.extractedFields.fathersName;
      }
      else if (fieldLower.includes('mother')) {
        mapped[fieldName] = extractionResult.extractedFields.mothersName;
      }
      else if (fieldLower.includes('date') || fieldLower.includes('dob')) {
        mapped[fieldName] = extractionResult.structuredData.dates[0] || extractionResult.extractedFields.dob;
      }
      else if (fieldLower.includes('email')) {
        mapped[fieldName] = extractionResult.structuredData.emails[0];
      }
      else if (fieldLower.includes('phone') || fieldLower.includes('mobile')) {
        mapped[fieldName] = extractionResult.structuredData.phones[0];
      }
      else if (fieldLower.includes('address')) {
        mapped[fieldName] = extractionResult.structuredData.addresses[0];
      }
      else if (fieldLower.includes('amount') || fieldLower.includes('salary')) {
        mapped[fieldName] = extractionResult.structuredData.amounts[0];
      }
      else if (fieldLower.includes('number') || fieldLower.includes('id')) {
        mapped[fieldName] = extractionResult.structuredData.numbers[0];
      }
    });
    
    return mapped;
  }
}
