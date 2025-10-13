// Intelligent Document Re-scanning System
import { performOCR } from './performOCR';

export interface ExtractedField {
  value: string;
  confidence: number;
  source: 'pass1' | 'pass2' | 'pass3' | 'manual';
  fieldType: string;
}

export interface DocumentMetadata {
  documentType: string;
  originalText: string;
  confidence: number;
  extractedFields: Record<string, ExtractedField>;
}

export interface FieldRequirement {
  name: string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'address';
  required: boolean;
  patterns?: string[];
  contextKeywords?: string[];
}

// Search strategy types for safer typing of strategy objects
type PatternStrategy = { type: 'pattern'; patterns: RegExp[] };
type ContextualStrategy = { type: 'contextual'; keywords: string[]; fieldType: string };
type DefaultStrategy = { type: 'default'; fieldType: string; fieldName: string };
type SearchStrategy = PatternStrategy | ContextualStrategy | DefaultStrategy;

export class IntelligentReScanner {
  private documentCache: Map<string, DocumentMetadata> = new Map();
  
  // Field categories with search patterns
  private fieldCategories: Record<string, { patterns: Record<string, RegExp[]> }> = {
    personal: {
      patterns: {
        fullName: [
          /name[:\s]*([a-zA-Z\s]{2,50})/i,
          /^([A-Z][a-z]+ [A-Z][a-z]+)/m,
          /applicant[:\s]*([a-zA-Z\s]{2,50})/i
        ],
        firstName: [/first\s*name[:\s]*([a-zA-Z]+)/i, /given\s*name[:\s]*([a-zA-Z]+)/i],
        lastName: [/last\s*name[:\s]*([a-zA-Z]+)/i, /family\s*name[:\s]*([a-zA-Z]+)/i, /surname[:\s]*([a-zA-Z]+)/i],
        email: [/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g],
        phone: [/(?:\+\d{1,3}\s?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/g, /mobile[:\s]*([0-9\s\-+()]{10,})/i],
        address: [/address[:\s]*([^,\n]{10,100})/i, /(?:street|road|avenue|lane)[:\s]*([^,\n]{5,100})/i],
        dateOfBirth: [/(?:dob|date\s*of\s*birth)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i, /born[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i],
        age: [/age[:\s]*(\d{1,3})/i, /(\d{2})\s*years?\s*old/i],
        gender: [/gender[:\s]*(male|female|other)/i, /sex[:\s]*(m|f|male|female)/i]
      }
    },
    professional: {
      patterns: {
        company: [/company[:\s]*([^,\n]{2,50})/i, /employer[:\s]*([^,\n]{2,50})/i, /organization[:\s]*([^,\n]{2,50})/i],
        position: [/position[:\s]*([^,\n]{2,50})/i, /title[:\s]*([^,\n]{2,50})/i, /role[:\s]*([^,\n]{2,50})/i],
        experience: [/(\d+)\s*years?\s*(?:of\s*)?experience/i, /experience[:\s]*(\d+)/i],
        salary: [/salary[:\s]*(\$?[\d,]+)/i, /income[:\s]*(\$?[\d,]+)/i, /compensation[:\s]*(\$?[\d,]+)/i],
        skills: [/skills[:\s]*([^,\n]{10,200})/i, /expertise[:\s]*([^,\n]{10,200})/i]
      }
    },
    educational: {
      patterns: {
        university: [/university[:\s]*([^,\n]{2,80})/i, /college[:\s]*([^,\n]{2,80})/i, /school[:\s]*([^,\n]{2,80})/i],
        degree: [/degree[:\s]*([^,\n]{2,50})/i, /bachelor[:\s]*([^,\n]{2,50})/i, /master[:\s]*([^,\n]{2,50})/i],
        graduationYear: [/graduated[:\s]*(\d{4})/i, /graduation[:\s]*(\d{4})/i, /class\s*of\s*(\d{4})/i],
        gpa: [/gpa[:\s]*(\d\.\d+)/i, /grade\s*point[:\s]*(\d\.\d+)/i],
        percentage: [/percentage[:\s]*(\d{1,3}\.?\d*)%?/i, /scored[:\s]*(\d{1,3}\.?\d*)%?/i],
        marks: [/marks[:\s]*(\d+)/i, /score[:\s]*(\d+)/i, /total[:\s]*(\d+)/i]
      }
    },
    financial: {
      patterns: {
        annualIncome: [/annual\s*income[:\s]*(\$?[\d,]+)/i, /yearly\s*salary[:\s]*(\$?[\d,]+)/i],
        monthlyIncome: [/monthly\s*income[:\s]*(\$?[\d,]+)/i, /monthly\s*salary[:\s]*(\$?[\d,]+)/i],
        accountNumber: [/account[:\s]*(\d{8,20})/i, /a\/c[:\s]*(\d{8,20})/i],
        panNumber: [/pan[:\s]*([A-Z]{5}\d{4}[A-Z])/i],
        aadharNumber: [/aadhar[:\s]*(\d{4}\s*\d{4}\s*\d{4})/i, /aadhaar[:\s]*(\d{4}\s*\d{4}\s*\d{4})/i]
      }
    },
    family: {
      patterns: {
        fatherName: [/father[:\s]*([a-zA-Z\s]{2,50})/i, /father's\s*name[:\s]*([a-zA-Z\s]{2,50})/i],
        motherName: [/mother[:\s]*([a-zA-Z\s]{2,50})/i, /mother's\s*name[:\s]*([a-zA-Z\s]{2,50})/i],
        spouseName: [/spouse[:\s]*([a-zA-Z\s]{2,50})/i, /husband[:\s]*([a-zA-Z\s]{2,50})/i, /wife[:\s]*([a-zA-Z\s]{2,50})/i],
        dependents: [/dependents[:\s]*(\d+)/i, /children[:\s]*(\d+)/i]
      }
    }
  };

  async performInitialExtraction(file: File, documentType: string): Promise<DocumentMetadata> {
    const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
    
    if (this.documentCache.has(cacheKey)) {
      return this.documentCache.get(cacheKey)!;
    }

    // Pass 1: Basic OCR extraction
    const ocrResult = await performOCR(file, documentType);
    
    // Pass 2: Pattern-based extraction
    const extractedFields = this.performPass2Extraction(ocrResult.text, documentType);
    
    const metadata: DocumentMetadata = {
      documentType,
      originalText: ocrResult.text,
      confidence: ocrResult.confidence,
      extractedFields
    };
    
    this.documentCache.set(cacheKey, metadata);
    return metadata;
  }

  private performPass2Extraction(text: string, documentType: string): Record<string, ExtractedField> {
    const fields: Record<string, ExtractedField> = {};
    
    // Apply all category patterns
    Object.entries(this.fieldCategories).forEach(([category, config]) => {
      Object.entries(config.patterns).forEach(([fieldName, patterns]) => {
        const bestMatch = this.findBestMatch(text, patterns, fieldName);
        if (bestMatch) {
          fields[fieldName] = {
            value: bestMatch.value,
            confidence: bestMatch.confidence,
            source: 'pass2',
            fieldType: fieldName
          };
        }
      });
    });

    return fields;
  }

  async performTargetedRescan(
    cacheKey: string, 
    requiredFields: FieldRequirement[]
  ): Promise<Record<string, ExtractedField>> {
    const metadata = this.documentCache.get(cacheKey);
    if (!metadata) {
      throw new Error('Document not found in cache');
    }

    const newFields: Record<string, ExtractedField> = {};
    
    for (const requirement of requiredFields) {
      // Skip if we already have this field with high confidence
      const existing = metadata.extractedFields[requirement.name];
      if (existing && existing.confidence > 80) {
        continue;
      }

      // Pass 3: Targeted extraction for specific field
      const extractedValue = await this.performPass3Extraction(
        metadata.originalText,
        requirement
      );
      
      if (extractedValue) {
        newFields[requirement.name] = extractedValue;
        // Update cache
        metadata.extractedFields[requirement.name] = extractedValue;
      }
    }

    return newFields;
  }

  private async performPass3Extraction(
    text: string,
    requirement: FieldRequirement
  ): Promise<ExtractedField | null> {
    // Smart contextual search based on field type and context
    const searchStrategies = this.generateSearchStrategies(requirement);
    
    for (const strategy of searchStrategies) {
      const result = this.executeSearchStrategy(text, strategy);
      if (result) {
        return {
          value: result.value,
          confidence: result.confidence,
          source: 'pass3',
          fieldType: requirement.type
        };
      }
    }

    return null;
  }

  private generateSearchStrategies(requirement: FieldRequirement): SearchStrategy[] {
    const strategies: SearchStrategy[] = [];
    
    // Use custom patterns if provided
    if (requirement.patterns) {
      strategies.push({
        type: 'pattern',
        patterns: requirement.patterns.map(p => new RegExp(p, 'i'))
      });
    }

    // Use context keywords for fuzzy search
    if (requirement.contextKeywords) {
      strategies.push({
        type: 'contextual',
        keywords: requirement.contextKeywords,
        fieldType: requirement.type
      });
    }

    // Default patterns based on field type
    strategies.push({
      type: 'default',
      fieldType: requirement.type,
      fieldName: requirement.name
    });

    return strategies;
  }

  private executeSearchStrategy(text: string, strategy: SearchStrategy | null) {
    if (!strategy) {
      return null;
    }

    switch (strategy.type) {
      case 'pattern':
        return this.findBestMatch(text, strategy.patterns, 'custom');
        
      case 'contextual':
        return this.performContextualSearch(text, strategy.keywords, strategy.fieldType);
        
      case 'default':
        return this.performDefaultSearch(text, strategy.fieldName, strategy.fieldType);
        
      default:
        return null;
    }
  }

  private findBestMatch(text: string, patterns: RegExp[], fieldName: string) {
    let bestMatch = { value: '', confidence: 0 };
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        const value = matches[1]?.trim() || matches[0]?.trim();
        if (value && value.length > bestMatch.value.length) {
          bestMatch = {
            value,
            confidence: this.calculateConfidence(value, fieldName, pattern)
          };
        }
      }
    }
    
    return bestMatch.confidence > 50 ? bestMatch : null;
  }

  private performContextualSearch(text: string, keywords: string[], fieldType: string) {
    // Look for field labels near the keywords
    for (const keyword of keywords) {
      const keywordRegex = new RegExp(`${keyword}[:\\s]*([^\\n,]{2,50})`, 'i');
      const match = text.match(keywordRegex);
      if (match) {
        return {
          value: match[1].trim(),
          confidence: 75
        };
      }
    }
    return null;
  }

  private performDefaultSearch(text: string, fieldName: string, fieldType: string) {
    // Use built-in patterns based on field name and type
    const category = this.findCategoryForField(fieldName);
    if (category) {
      const patterns = (this.fieldCategories[category]?.patterns?.[fieldName]) || [];
      return this.findBestMatch(text, patterns, fieldName);
    }
    return null;
  }

  private findCategoryForField(fieldName: string): string | null {
    // Iterate categories and check for patterns safely
    for (const category of Object.keys(this.fieldCategories)) {
      const config = this.fieldCategories[category];
      if (config && config.patterns && config.patterns[fieldName]) {
        return category;
      }
    }
    return null;
  }

  private calculateConfidence(value: string, fieldName: string, pattern: RegExp): number {
    let confidence = 60; // Base confidence
    
    // Boost confidence based on pattern specificity
    if (pattern.source.includes('\\d')) confidence += 10; // Numeric patterns
    if (pattern.source.includes('[a-zA-Z]')) confidence += 5; // Alpha patterns
    if (pattern.source.includes('@')) confidence += 20; // Email patterns
    
    // Boost confidence based on value characteristics
    if (value.length > 3) confidence += 5;
    if (value.length > 10) confidence += 5;
    
    // Field-specific confidence adjustments
    switch (fieldName) {
      case 'email':
        if (value.includes('@') && value.includes('.')) confidence += 20;
        break;
      case 'phone':
        if (/\d{10,}/.test(value.replace(/\D/g, ''))) confidence += 15;
        break;
      case 'dateOfBirth':
        if (/\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(value)) confidence += 15;
        break;
    }
    
    return Math.min(confidence, 99);
  }

  // Get missing fields that could potentially be found
  getMissingFieldSuggestions(metadata: DocumentMetadata, requiredFields: string[]): FieldRequirement[] {
    return requiredFields
      .filter(field => !metadata.extractedFields[field] || metadata.extractedFields[field].confidence < 70)
      .map(field => ({
        name: field,
        type: this.inferFieldType(field),
        required: true,
        contextKeywords: this.generateContextKeywords(field)
      }));
  }

  private inferFieldType(fieldName: string): 'text' | 'number' | 'date' | 'email' | 'phone' | 'address' {
    if (fieldName.includes('email')) return 'email';
    if (fieldName.includes('phone') || fieldName.includes('mobile')) return 'phone';
    if (fieldName.includes('address')) return 'address';
    if (fieldName.includes('date') || fieldName.includes('dob')) return 'date';
    if (fieldName.includes('age') || fieldName.includes('year') || fieldName.includes('percentage')) return 'number';
    return 'text';
  }

  private generateContextKeywords(fieldName: string): string[] {
    const keywordMap: Record<string, string[]> = {
      fullName: ['name', 'applicant', 'candidate'],
      company: ['company', 'employer', 'organization', 'firm'],
      position: ['position', 'title', 'role', 'designation'],
      university: ['university', 'college', 'school', 'institute'],
      degree: ['degree', 'qualification', 'education'],
      salary: ['salary', 'income', 'compensation', 'ctc'],
      experience: ['experience', 'work', 'employment'],
      skills: ['skills', 'expertise', 'technologies', 'tools']
    };
    
    return keywordMap[fieldName] || [fieldName];
  }
}

export default IntelligentReScanner;