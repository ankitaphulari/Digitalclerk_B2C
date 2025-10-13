// Complete PAN card extraction with space-aware name parsing
// Extracts PAN number, name, father's name, and DOB from PAN card OCR text

import { normalizeInput, formatNameForDisplay } from '@/utils/inputNormalization';

export interface PANExtractionResult {
  pan?: string;
  name?: string;
  fathersName?: string;
  dob?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class PANCardExtractor {
  private static readonly HEADER_BLACKLIST = [
    'INCOME TAX DEPARTMENT',
    'GOVT OF INDIA',
    'GOVERNMENT OF INDIA',
    'PERMANENT ACCOUNT NUMBER',
    'PERMANENT ACCOUNT',
    'INCOME TAX',
    'TAX',
    'DEPARTMENT',
    'CARD',
    'आयकर विभाग',
    'भारत सरकार'
  ];

  /**
   * Extracts data from PAN card OCR text
   */
  static extractFromPANCard(ocrText: string): PANExtractionResult {
    const result: PANExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    const lines = ocrText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log('PAN Card - Processing lines:', lines);

    // Extract PAN number
    const panNumber = this.extractPANNumber(ocrText);
    if (panNumber) {
      result.pan = panNumber;
      result.extractedFields.pan = panNumber;
      result.confidence += 30;
    }

    // Extract DOB
    const dob = this.extractDOB(ocrText);
    if (dob) {
      result.dob = dob;
      result.extractedFields.dob = dob;
      result.confidence += 25;
    }

    // Extract names using line-based approach
    const nameData = this.extractNames(lines, panNumber || undefined, dob || undefined);
    if (nameData.name) {
      result.name = nameData.name;
      result.extractedFields.name = nameData.name;
      result.extractedFields.fullName = nameData.name; // Also map to fullName
      result.confidence += 25;
    }
    if (nameData.fathersName) {
      result.fathersName = nameData.fathersName;
      result.extractedFields.fathersName = nameData.fathersName;
      result.extractedFields.fathers_name = nameData.fathersName; // Also map to fathers_name
      result.confidence += 20;
    }

    console.log('PAN Card extraction result:', result);
    return result;
  }

  /**
   * Extracts PAN number from text
   */
  private static extractPANNumber(text: string): string | null {
    const panPattern = /\b([A-Z]{5}[0-9]{4}[A-Z])\b/;
    const match = text.match(panPattern);
    return match ? match[1] : null;
  }

  /**
   * Extracts date of birth from text
   */
  private static extractDOB(text: string): string | null {
    const dobPatterns = [
      /(?:DOB|Date of Birth|D\.O\.B)[:\s]*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i,
      /\b([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})\b/
    ];

    for (const pattern of dobPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Extracts names using PAN card structure analysis
   */
  private static extractNames(lines: string[], panNumber?: string, dob?: string): { name?: string; fathersName?: string } {
    const result: { name?: string; fathersName?: string } = {};

    // Find candidate lines (uppercase, alphabetic with spaces and dots)
    const candidateLines = lines
      .filter(line => {
        // Must be mostly uppercase letters with spaces and dots
        if (!/^[A-Z .'-]{3,}$/.test(line)) return false;
        
        // Exclude header lines
        if (this.isHeaderLine(line)) return false;
        
        // Exclude lines that contain the PAN number or DOB
        if (panNumber && line.includes(panNumber)) return false;
        if (dob && line.includes(dob)) return false;
        
        // Must have reasonable length for a name
        if (line.length < 3 || line.length > 60) return false;
        
        return true;
      })
      .map(line => line.trim());

    console.log('PAN Card - Name candidate lines:', candidateLines);

    // Typically, the first two valid candidates are name and father's name
    if (candidateLines.length >= 1) {
      result.name = formatNameForDisplay(candidateLines[0]);
    }
    
    if (candidateLines.length >= 2) {
      result.fathersName = formatNameForDisplay(candidateLines[1]);
    }

    return result;
  }

  /**
   * Checks if a line is a header that should be excluded
   */
  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header => 
      upperLine.includes(header) || 
      upperLine === header ||
      this.levenshteinDistance(upperLine, header) <= 2
    );
  }

  /**
   * Calculates Levenshtein distance for fuzzy header matching
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}