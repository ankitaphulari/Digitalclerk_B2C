// Enhanced Document AI OCR Service - Industry-standard solution
// Replaces multiple fragmented OCR services with single, reliable pipeline

import { supabase } from '@/integrations/supabase/client';

// Core interfaces for document processing
export interface DocumentAIOCRResult {
  text: string;
  confidence: number;
  documentType: string;
  extractedFields: Record<string, FieldWithConfidence>;
  processingTime: number;
  qualityScore: number;
  language: string;
}

export interface FieldWithConfidence {
  value: string;
  confidence: number;
  position?: BoundingBox;
  validation?: ValidationResult;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  score: number;
}

// Document type definitions
export enum DocumentType {
  AADHAAR = 'aadhaar',
  PAN = 'pan',
  PASSPORT = 'passport',
  VOTER_ID = 'voter_id',
  DRIVING_LICENSE = 'driving_license',
  BANK_STATEMENT = 'bank_statement',
  MARKSHEET = 'marksheet',
  UTILITY_BILL = 'utility_bill',
  UNKNOWN = 'unknown'
}

// Processing options
export interface ProcessingOptions {
  documentType?: string;
  targetLanguage?: string;
  enableStructuredData?: boolean;
  qualityThreshold?: number;
}

// Main OCR service class
class DocumentAIOCRService {
  private static instance: DocumentAIOCRService;

  static getInstance(): DocumentAIOCRService {
    if (!DocumentAIOCRService.instance) {
      DocumentAIOCRService.instance = new DocumentAIOCRService();
    }
    return DocumentAIOCRService.instance;
  }

  async processDocument(
    file: File,
    options: ProcessingOptions = {}
  ): Promise<DocumentAIOCRResult> {
    const startTime = Date.now();
    
    try {
      console.log('Starting Document AI OCR processing...');
      
      // Step 1: Quality Assessment
      const qualityScore = await this.assessDocumentQuality(file);
      console.log(`Document quality score: ${qualityScore}%`);
      
      if (qualityScore < (options.qualityThreshold || 30)) {
        throw new Error(`Document quality too low: ${qualityScore}%. Please upload a clearer image.`);
      }

      // Step 2: Extract text using Google Document AI
      const ocrResult = await this.extractTextWithDocumentAI(file);
      
      // Step 3: Detect document type
      const documentType = options.documentType || this.detectDocumentType(ocrResult.text);
      console.log(`Detected document type: ${documentType}`);

      // Step 4: Extract structured fields
      const extractedFields = await this.extractStructuredFields(
        ocrResult.text, 
        documentType,
        ocrResult.entities || []
      );

      // Step 5: Validate extracted data
      const validatedFields = this.validateExtractedFields(extractedFields, documentType);

      // Step 6: Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(
        ocrResult.confidence,
        validatedFields,
        qualityScore
      );

      const result: DocumentAIOCRResult = {
        text: ocrResult.text,
        confidence: overallConfidence,
        documentType,
        extractedFields: validatedFields,
        processingTime: Date.now() - startTime,
        qualityScore,
        language: ocrResult.detectedLanguage || 'en'
      };

      console.log(`Document AI OCR completed in ${result.processingTime}ms`);
      console.log(`Overall confidence: ${overallConfidence}%`);
      
      return result;
    } catch (error) {
      console.error('Document AI OCR failed:', error);
      throw error;
    }
  }

  // Step 1: Ultra-Fast Quality Assessment (under 50ms)
  private async assessDocumentQuality(file: File): Promise<number> {
    // Skip complex image analysis for speed - use file size heuristics
    const sizeMB = file.size / (1024 * 1024);
    
    // Fast file-based quality scoring (no image loading)
    if (sizeMB > 1) return 85; // Large files usually good quality
    if (sizeMB > 0.5) return 80; // Medium files decent quality  
    if (sizeMB > 0.1) return 70; // Small files lower quality
    return 60; // Very small files but still processable
  }

  // Step 2: Extract text using Google Document AI
  private async extractTextWithDocumentAI(file: File): Promise<{
    text: string;
    confidence: number;
    entities?: any[];
    detectedLanguage?: string;
  }> {
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      
      // Call enhanced vision OCR function
      const { data, error } = await supabase.functions.invoke('document-ai-ocr', {
        body: { 
          imageBase64: base64,
          enableEntityExtraction: true,
          languageHints: ['hi', 'en', 'pa', 'bn', 'ta', 'te', 'mr']
        }
      });

      if (error) {
        console.warn('Document AI failed, falling back to Vision API');
        return this.fallbackToVisionAPI(base64);
      }

      return {
        text: data.text || '',
        confidence: data.confidence || 0,
        entities: data.entities || [],
        detectedLanguage: data.detectedLanguage || 'en'
      };
    } catch (error) {
      console.error('Document AI extraction failed:', error);
      throw error;
    }
  }

  // Fallback to Vision API if Document AI fails
  private async fallbackToVisionAPI(base64: string): Promise<{
    text: string;
    confidence: number;
    entities?: any[];
    detectedLanguage?: string;
  }> {
    const { data, error } = await supabase.functions.invoke('vision-ocr', {
      body: { 
        imageBase64: base64,
        languageHints: ['hi', 'en', 'pa', 'bn', 'ta', 'te', 'mr']
      }
    });

    if (error) {
      throw new Error(`OCR processing failed: ${error.message}`);
    }

    return {
      text: data.text || '',
      confidence: data.confidence || 0,
      detectedLanguage: 'en'
    };
  }

  // Step 3: Enhanced Document Type Detection
  private detectDocumentType(text: string): string {
    const upperText = text.toUpperCase();
    const scores: Record<string, number> = {};

    // Aadhaar patterns with high confidence
    const aadhaarPatterns = [
      { pattern: /\b\d{4}[-\s]*\d{4}[-\s]*\d{4}\b/, weight: 40 },
      { pattern: /AADHAAR|आधार|UIDAI/, weight: 30 },
      { pattern: /GOVERNMENT OF INDIA|भारत सरकार/, weight: 25 },
      { pattern: /UNIQUE IDENTIFICATION/, weight: 20 }
    ];

    // PAN patterns
    const panPatterns = [
      { pattern: /\b[A-Z]{5}\d{4}[A-Z]\b/, weight: 45 },
      { pattern: /INCOME TAX|PAN CARD|PERMANENT ACCOUNT/, weight: 30 },
      { pattern: /NSDL|UTIITSL/, weight: 20 }
    ];

    // Calculate scores for each document type
    scores[DocumentType.AADHAAR] = this.calculatePatternScore(upperText, aadhaarPatterns);
    scores[DocumentType.PAN] = this.calculatePatternScore(upperText, panPatterns);
    
    // Additional patterns for other document types...
    
    // Find highest scoring document type
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore < 30) return DocumentType.UNKNOWN;
    
    return Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || DocumentType.UNKNOWN;
  }

  private calculatePatternScore(text: string, patterns: Array<{ pattern: RegExp; weight: number }>): number {
    return patterns.reduce((total, { pattern, weight }) => {
      return total + (pattern.test(text) ? weight : 0);
    }, 0);
  }

  // Step 4: Parallel Field Extraction for Speed
  private async extractStructuredFields(
    text: string,
    documentType: string,
    entities: any[] = []
  ): Promise<Record<string, FieldWithConfidence>> {
    // Use Promise.all for parallel processing where possible
    switch (documentType) {
      case DocumentType.AADHAAR:
        return this.extractAadhaarFieldsParallel(text, entities);
      case DocumentType.PAN:
        return this.extractPANFieldsParallel(text, entities);
      case DocumentType.PASSPORT:
        return this.extractPassportFields(text, entities);
      case DocumentType.DRIVING_LICENSE:
        return this.extractDrivingLicenseFields(text, entities);
      default:
        return this.extractGenericFieldsParallel(text, entities);
    }
  }

  // Enhanced Aadhaar extraction with parallel processing
  private extractAadhaarFieldsParallel(text: string, entities: any[]): Record<string, FieldWithConfidence> {
    const fields: Record<string, FieldWithConfidence> = {};
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    console.log('🔍 Processing Aadhaar extraction from lines:', lines.slice(0, 10));
    
    // Extract Aadhaar number with validation
    const aadhaarPattern = /\b(\d{4}[-\s]*\d{4}[-\s]*\d{4})\b/g;
    const aadhaarMatches = text.match(aadhaarPattern);
    if (aadhaarMatches) {
      const aadhaarNum = aadhaarMatches[0].replace(/[-\s]/g, '');
      if (aadhaarNum.length === 12 && this.validateAadhaarNumber(aadhaarNum)) {
        fields.aadhaarNumber = {
          value: aadhaarNum,
          confidence: 95,
          validation: { isValid: true, issues: [], score: 100 }
        };
        console.log('✅ Aadhaar number extracted:', aadhaarNum);
      }
    }

    // Extract name using positional analysis and entity recognition
    let nameCandidate = null;
    
    // First try entity recognition for person names
    if (entities && entities.length > 0) {
      const personEntities = entities.filter(e => e.type === 'PERSON_NAME' || e.type === 'PERSON');
      if (personEntities.length > 0) {
        // Pick the entity with highest confidence
        const bestEntity = personEntities.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
        nameCandidate = bestEntity.text || bestEntity.value;
        console.log('✅ Name from entity recognition:', nameCandidate);
      }
    }
    
    // Fallback to pattern-based extraction if no entity found
    if (!nameCandidate) {
      nameCandidate = this.extractNameFromLines(lines, [
        'GOVERNMENT', 'INDIA', 'AADHAAR', 'UNIQUE', 'IDENTITY', 'AUTHORITY', 'BHARATH', 'SARKAR'
      ]);
      console.log('🔍 Name from pattern extraction:', nameCandidate);
    }
    
    if (nameCandidate && this.validateName(nameCandidate)) {
      fields.name = {
        value: this.formatName(nameCandidate),
        confidence: 90,
        validation: this.validateField('name', nameCandidate)
      };
      console.log('✅ Final name field:', fields.name.value);
    } else {
      console.log('❌ No valid name found. Candidate was:', nameCandidate);
    }

    // Extract DOB with multiple format support
    const dobPatterns = [
      /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g,
      /\b(\d{1,2}-\d{1,2}-\d{4})\b/g,
      /\b(\d{1,2}\.\d{1,2}\.\d{4})\b/g
    ];

    for (const pattern of dobPatterns) {
      const dobMatches = text.match(pattern);
      if (dobMatches) {
        const dob = dobMatches[0];
        if (this.validateDate(dob)) {
          fields.dateOfBirth = {
            value: dob,
            confidence: 90,
            validation: this.validateField('date', dob)
          };
          break;
        }
      }
    }

    // Extract father's name
    const fatherPattern = /(?:S\/O|SON OF|FATHER)[:\s]*([A-Z][A-Z\s]{2,50})/i;
    const fatherMatch = text.match(fatherPattern);
    if (fatherMatch && this.validateName(fatherMatch[1])) {
      fields.fatherName = {
        value: fatherMatch[1].trim(),
        confidence: 80,
        validation: this.validateField('name', fatherMatch[1])
      };
    }

    // Extract gender
    const genderPattern = /\b(MALE|FEMALE|M|F)\b/i;
    const genderMatch = text.match(genderPattern);
    if (genderMatch) {
      const gender = genderMatch[1].toUpperCase() === 'M' || genderMatch[1].toUpperCase() === 'MALE' ? 'Male' : 'Female';
      fields.gender = {
        value: gender,
        confidence: 90,
        validation: { isValid: true, issues: [], score: 100 }
      };
    }

    return fields;
  }

  // Enhanced PAN extraction with parallel processing
  private extractPANFieldsParallel(text: string, entities: any[]): Record<string, FieldWithConfidence> {
    const fields: Record<string, FieldWithConfidence> = {};
    const lines = text.split('\n').map(line => line.trim().toUpperCase());

    // Extract PAN number with validation
    const panPattern = /\b([A-Z]{5}\d{4}[A-Z])\b/g;
    const panMatches = text.match(panPattern);
    if (panMatches) {
      const panNum = panMatches[0];
      if (this.validatePANNumber(panNum)) {
        fields.panNumber = {
          value: panNum,
          confidence: 95,
          validation: { isValid: true, issues: [], score: 100 }
        };
      }
    }

    // Extract name (avoid common PAN card text)
    const nameCandidate = this.extractNameFromLines(lines, [
      'INCOME', 'TAX', 'PERMANENT', 'ACCOUNT', 'CARD', 'GOVERNMENT', 'INDIA'
    ]);
    
    if (nameCandidate && this.validateName(nameCandidate)) {
      fields.name = {
        value: nameCandidate,
        confidence: 85,
        validation: this.validateField('name', nameCandidate)
      };
    }

    return fields;
  }

  // Enhanced Generic field extraction with complete data extraction
  private extractGenericFieldsParallel(text: string, entities: any[]): Record<string, FieldWithConfidence> {
    const fields: Record<string, FieldWithConfidence> = {};
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Parallel extraction of all common fields
    const extractionPromises = [
      this.extractAllNames(text, lines, entities),
      this.extractAllDates(text),
      this.extractAllNumbers(text),
      this.extractAllAddresses(text, lines),
      this.extractAllPhoneNumbers(text),
      this.extractAllEmails(text)
    ];
    
    // Process all extractions (synchronously for now, but structured for optimization)
    const nameData = this.extractAllNames(text, lines, entities);
    const dateData = this.extractAllDates(text);
    const numberData = this.extractAllNumbers(text);
    const addressData = this.extractAllAddresses(text, lines);
    const phoneData = this.extractAllPhoneNumbers(text);
    const emailData = this.extractAllEmails(text);
    
    // Merge all extracted data
    Object.assign(fields, nameData, dateData, numberData, addressData, phoneData, emailData);
    
    return fields;
  }

  // Helper methods for name extraction
  private extractNameFromLines(lines: string[], excludeWords: string[]): string | null {
    console.log('🔍 Searching for names in lines, excluding:', excludeWords);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Convert to uppercase for comparison but preserve original case
      const upperLine = line.toUpperCase();
      
      // Skip lines with excluded words (common header/footer text)
      if (excludeWords.some(word => upperLine.includes(word.toUpperCase()))) {
        console.log('❌ Skipping line (excluded word):', line);
        continue;
      }
      
      // Skip lines with numbers (likely not names)
      if (/\d/.test(line)) {
        console.log('❌ Skipping line (contains numbers):', line);
        continue;
      }
      
      // Skip lines that are too short or too long
      if (line.length < 4 || line.length > 50) {
        console.log('❌ Skipping line (length):', line);
        continue;
      }
      
      const words = line.split(/\s+/).filter(word => word.length > 0);
      
      // Look for lines that could be names (2-4 words, proper case)
      if (words.length >= 2 && words.length <= 4) {
        const potentialName = words.join(' ');
        console.log('🔍 Checking potential name:', potentialName);
        
        if (this.isValidNameCandidate(potentialName)) {
          console.log('✅ Found valid name candidate:', potentialName);
          return potentialName;
        }
      }
    }
    console.log('❌ No valid name found in any line');
    return null;
  }

  private isValidNameCandidate(text: string): boolean {
    // Allow letters, spaces, and some special characters that might appear in names
    const namePattern = /^[A-Za-z\s\.]+$/;
    if (!namePattern.test(text)) {
      console.log('❌ Name candidate failed pattern test:', text);
      return false;
    }
    
    // Must have reasonable length
    if (text.length < 4 || text.length > 50) {
      console.log('❌ Name candidate failed length test:', text, text.length);
      return false;
    }
    
    const words = text.split(/\s+/).filter(word => word.length > 0);
    
    // Must have at least 2 words
    if (words.length < 2) {
      console.log('❌ Name candidate needs at least 2 words:', text);
      return false;
    }
    
    // Must not be mostly single letters (except middle initials)
    const singleLetters = words.filter(word => word.length === 1).length;
    if (singleLetters > 1 || (singleLetters === 1 && words.length === 2)) {
      console.log('❌ Name candidate has too many single letters:', text);
      return false;
    }
    
    // Each word should be at least 2 characters (except one middle initial)
    const validWords = words.filter(word => word.length >= 2 || word.length === 1).length;
    if (validWords !== words.length) {
      console.log('❌ Name candidate has invalid words:', text);
      return false;
    }
    
    console.log('✅ Name candidate passed all tests:', text);
    return true;
  }

  private formatName(name: string): string {
    return name.split(/\s+/)
      .filter(word => word.length > 0)
      .map(word => {
        // Handle single letter middle initials
        if (word.length === 1) {
          return word.toUpperCase();
        }
        // Proper case for full words
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  // Step 5: Validation methods
  private validateExtractedFields(
    fields: Record<string, FieldWithConfidence>,
    documentType: string
  ): Record<string, FieldWithConfidence> {
    const validated: Record<string, FieldWithConfidence> = {};
    
    Object.entries(fields).forEach(([key, field]) => {
      const validation = this.validateField(key, field.value);
      const adjustedConfidence = this.adjustConfidenceBasedOnValidation(
        field.confidence,
        validation
      );
      
      validated[key] = {
        ...field,
        confidence: adjustedConfidence,
        validation
      };
    });
    
    return validated;
  }

  private validateField(fieldType: string, value: string): ValidationResult {
    const issues: string[] = [];
    let score = 100;
    
    switch (fieldType) {
      case 'name':
        if (!this.validateName(value)) {
          issues.push('Invalid name format');
          score -= 50;
        }
        break;
      case 'date':
        if (!this.validateDate(value)) {
          issues.push('Invalid date format');
          score -= 60;
        }
        break;
      case 'aadhaarNumber':
        if (!this.validateAadhaarNumber(value)) {
          issues.push('Invalid Aadhaar number');
          score -= 80;
        }
        break;
      case 'panNumber':
        if (!this.validatePANNumber(value)) {
          issues.push('Invalid PAN number');
          score -= 80;
        }
        break;
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      score: Math.max(0, score)
    };
  }

  private validateName(name: string): boolean {
    if (!name || name.length < 2 || name.length > 50) return false;
    
    // Should contain mostly letters
    const letterCount = (name.match(/[A-Za-z]/g) || []).length;
    const totalLength = name.replace(/\s/g, '').length;
    
    return letterCount / totalLength > 0.8;
  }

  private validateDate(date: string): boolean {
    const dateRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
    const match = date.match(dateRegex);
    
    if (!match) return false;
    
    const [, day, month, year] = match.map(Number);
    const currentYear = new Date().getFullYear();
    
    return day >= 1 && day <= 31 && 
           month >= 1 && month <= 12 && 
           year >= 1900 && year <= currentYear;
  }

  private validateAadhaarNumber(aadhaar: string): boolean {
    if (!/^\d{12}$/.test(aadhaar)) return false;
    
    // Aadhaar validation algorithm
    const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
    let sum = 0;
    
    for (let i = 0; i < 11; i++) {
      sum += parseInt(aadhaar[i]) * weights[i];
    }
    
    const checksum = sum % 11;
    const expectedChecksum = checksum < 2 ? checksum : 11 - checksum;
    
    return parseInt(aadhaar[11]) === expectedChecksum;
  }

  private validatePANNumber(pan: string): boolean {
    return /^[A-Z]{5}\d{4}[A-Z]$/.test(pan);
  }

  // Step 6: Calculate overall confidence
  private calculateOverallConfidence(
    ocrConfidence: number,
    fields: Record<string, FieldWithConfidence>,
    qualityScore: number
  ): number {
    const fieldConfidences = Object.values(fields).map(f => f.confidence);
    const avgFieldConfidence = fieldConfidences.length > 0 
      ? fieldConfidences.reduce((a, b) => a + b, 0) / fieldConfidences.length 
      : 0;
    
    // Weighted average
    const confidence = (
      ocrConfidence * 0.4 +
      avgFieldConfidence * 0.4 +
      qualityScore * 0.2
    );
    
    return Math.round(Math.max(0, Math.min(100, confidence)));
  }

  private adjustConfidenceBasedOnValidation(
    originalConfidence: number,
    validation: ValidationResult
  ): number {
    if (!validation.isValid) {
      return Math.round(originalConfidence * 0.6); // Reduce confidence for invalid data
    }
    
    return Math.round(originalConfidence * (validation.score / 100));
  }

  // Utility methods
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Complete extraction methods for all data types
  private extractAllNames(text: string, lines: string[], entities: any[]): Record<string, FieldWithConfidence> {
    const fields: Record<string, FieldWithConfidence> = {};
    
    // Try entity recognition first
    if (entities && entities.length > 0) {
      const personEntities = entities.filter(e => e.type === 'PERSON_NAME' || e.type === 'PERSON');
      if (personEntities.length > 0) {
        const bestEntity = personEntities.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
        const nameCandidate = bestEntity.text || bestEntity.value;
        if (this.validateName(nameCandidate)) {
          fields.name = {
            value: this.formatName(nameCandidate),
            confidence: 90,
            validation: this.validateField('name', nameCandidate)
          };
        }
      }
    }
    
    // Fallback to pattern-based extraction
    if (!fields.name) {
      const nameCandidate = this.extractNameFromLines(lines, [
        'GOVERNMENT', 'INDIA', 'DOCUMENT', 'NUMBER', 'DATE', 'ISSUE', 'VALID'
      ]);
      if (nameCandidate && this.validateName(nameCandidate)) {
        fields.name = {
          value: this.formatName(nameCandidate),
          confidence: 85,
          validation: this.validateField('name', nameCandidate)
        };
      }
    }
    
    return fields;
  }

  private extractAllDates(text: string): Record<string, FieldWithConfidence> {
    const fields: Record<string, FieldWithConfidence> = {};
    
    // Multiple date formats
    const datePatterns = [
      /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g,
      /\b(\d{1,2}-\d{1,2}-\d{4})\b/g,
      /\b(\d{1,2}\.\d{1,2}\.\d{4})\b/g,
      /\b(\d{4}-\d{1,2}-\d{1,2})\b/g
    ];

    const dates: string[] = [];
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    });

    // Extract first valid date as DOB
    for (const date of dates) {
      if (this.validateDate(date)) {
        fields.dateOfBirth = {
          value: date,
          confidence: 85,
          validation: this.validateField('date', date)
        };
        break;
      }
    }

    return fields;
  }

  private extractAllNumbers(text: string): Record<string, FieldWithConfidence> {
    const fields: Record<string, FieldWithConfidence> = {};
    
    // Aadhaar pattern
    const aadhaarPattern = /\b(\d{4}[-\s]*\d{4}[-\s]*\d{4})\b/g;
    const aadhaarMatches = text.match(aadhaarPattern);
    if (aadhaarMatches) {
      const aadhaarNum = aadhaarMatches[0].replace(/[-\s]/g, '');
      if (this.validateAadhaarNumber(aadhaarNum)) {
        fields.aadhaarNumber = {
          value: aadhaarNum,
          confidence: 95,
          validation: this.validateField('aadhaarNumber', aadhaarNum)
        };
      }
    }

    // PAN pattern
    const panPattern = /\b([A-Z]{5}\d{4}[A-Z])\b/g;
    const panMatches = text.match(panPattern);
    if (panMatches && this.validatePANNumber(panMatches[0])) {
      fields.panNumber = {
        value: panMatches[0],
        confidence: 95,
        validation: this.validateField('panNumber', panMatches[0])
      };
    }

    // Passport number pattern
    const passportPattern = /\b([A-Z]{1,2}\d{7,8})\b/g;
    const passportMatches = text.match(passportPattern);
    if (passportMatches) {
      fields.passportNumber = {
        value: passportMatches[0],
        confidence: 90,
        validation: { isValid: true, issues: [], score: 100 }
      };
    }

    return fields;
  }

  private extractAllAddresses(text: string, lines: string[]): Record<string, FieldWithConfidence> {
    const fields: Record<string, FieldWithConfidence> = {};
    
    // Look for address patterns - multi-line addresses
    const addressLines: string[] = [];
    const addressKeywords = ['ADDRESS', 'ADDR', 'RESIDENCE', 'स/ओ', 'D/O', 'W/O'];
    
    let addressStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toUpperCase();
      if (addressKeywords.some(keyword => line.includes(keyword))) {
        addressStartIndex = i;
        break;
      }
    }
    
    if (addressStartIndex >= 0) {
      // Collect next 2-4 lines as address
      for (let i = addressStartIndex; i < Math.min(addressStartIndex + 4, lines.length); i++) {
        const line = lines[i].trim();
        if (line && !addressKeywords.some(k => line.toUpperCase().includes(k))) {
          addressLines.push(line);
        }
      }
      
      if (addressLines.length > 0) {
        const address = addressLines.join(', ');
        fields.address = {
          value: address,
          confidence: 80,
          validation: { isValid: true, issues: [], score: 90 }
        };
      }
    }

    return fields;
  }

  private extractAllPhoneNumbers(text: string): Record<string, FieldWithConfidence> {
    const fields: Record<string, FieldWithConfidence> = {};
    
    // Phone number patterns
    const phonePatterns = [
      /\b(\+91[-\s]?\d{10})\b/g,
      /\b(\d{10})\b/g,
      /\b(\d{3}[-\s]\d{3}[-\s]\d{4})\b/g
    ];

    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        const phone = matches[0].replace(/[-\s]/g, '');
        if (phone.length === 10 || phone.length === 13) {
          fields.phoneNumber = {
            value: matches[0],
            confidence: 85,
            validation: { isValid: true, issues: [], score: 90 }
          };
          break;
        }
      }
    }

    return fields;
  }

  private extractAllEmails(text: string): Record<string, FieldWithConfidence> {
    const fields: Record<string, FieldWithConfidence> = {};
    
    // Email pattern
    const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
    const emailMatches = text.match(emailPattern);
    
    if (emailMatches) {
      fields.email = {
        value: emailMatches[0].toLowerCase(),
        confidence: 90,
        validation: { isValid: true, issues: [], score: 95 }
      };
    }

    return fields;
  }

  // Additional extraction methods for other document types
  private extractPassportFields(text: string, entities: any[]): Record<string, FieldWithConfidence> {
    const fields: Record<string, FieldWithConfidence> = {};
    
    // Passport number
    const passportPattern = /\b([A-Z]{1,2}\d{7,8})\b/g;
    const passportMatches = text.match(passportPattern);
    if (passportMatches) {
      fields.passportNumber = {
        value: passportMatches[0],
        confidence: 95,
        validation: { isValid: true, issues: [], score: 100 }
      };
    }
    
    // Add common fields
    Object.assign(fields, this.extractAllNames(text, text.split('\n'), entities));
    Object.assign(fields, this.extractAllDates(text));
    
    return fields;
  }

  private extractDrivingLicenseFields(text: string, entities: any[]): Record<string, FieldWithConfidence> {
    const fields: Record<string, FieldWithConfidence> = {};
    
    // License number pattern
    const licensePattern = /\b([A-Z]{2}\d{13})\b/g;
    const licenseMatches = text.match(licensePattern);
    if (licenseMatches) {
      fields.licenseNumber = {
        value: licenseMatches[0],
        confidence: 95,
        validation: { isValid: true, issues: [], score: 100 }
      };
    }
    
    // Add common fields
    Object.assign(fields, this.extractAllNames(text, text.split('\n'), entities));
    Object.assign(fields, this.extractAllDates(text));
    Object.assign(fields, this.extractAllAddresses(text, text.split('\n')));
    
    return fields;
  }
}

export { DocumentAIOCRService };
export default DocumentAIOCRService;