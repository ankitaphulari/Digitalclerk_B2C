// Text preprocessing utilities for OCR text cleaning and normalization
// Handles cleaning raw OCR text before document-specific extraction

export interface CleanedText {
  raw: string;
  cleaned: string;
  lines: string[];
  normalizedLines: string[];
  confidence: number;
  original?: string; // Optional for backward compatibility
}

export class TextPreprocessor {
  static cleanText(rawText: string): CleanedText {
    // Remove excessive whitespace and normalize while preserving meaningful spaces
    let cleaned = rawText
      .replace(/\s{3,}/g, ' ') // Replace 3+ consecutive spaces with single space (preserve double spaces for structure)
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')
      .trim();

    // Remove common OCR artifacts while preserving important spaces
    cleaned = cleaned
      .replace(/[^\w\s\n\/\-.,():]/g, ' ') // Remove special characters except common ones
      .replace(/\s*\n\s*/g, '\n') // Clean line breaks
      .replace(/\s{2,}/g, ' ') // Replace multiple consecutive spaces with single space
      .trim();

    // Split into lines and clean each line
    const lines = cleaned.split('\n').filter(line => line.trim().length > 0);
    
    // Normalize lines for better pattern matching
    const normalizedLines = lines.map(line => 
      line.trim()
        .replace(/\s+/g, ' ')
        .replace(/[।|]/g, '') // Remove Hindi full stops and pipes
        .replace(/[:：]/g, ':') // Normalize colons
    );

    // Calculate text quality confidence
    const confidence = this.calculateTextQuality(cleaned, lines);

    return {
      raw: rawText,
      cleaned,
      lines,
      normalizedLines,
      confidence
    };
  }

  private static calculateTextQuality(text: string, lines: string[]): number {
    let score = 50; // Base score

    // Check text length - should have reasonable content
    if (text.length > 100) score += 10;
    if (text.length > 300) score += 10;

    // Check line count - documents should have multiple lines
    if (lines.length > 5) score += 10;
    if (lines.length > 10) score += 5;

    // Check for readable characters vs garbage
    const readableChars = text.match(/[a-zA-Z0-9\s]/g)?.length || 0;
    const readableRatio = readableChars / text.length;
    score += Math.round(readableRatio * 20);

    // Check for common document patterns
    if (/\d{4}[-\s]\d{4}[-\s]\d{4}/.test(text)) score += 5; // Aadhaar pattern
    if (/[A-Z]{5}\d{4}[A-Z]/.test(text)) score += 5; // PAN pattern
    if (/\d{2}\/\d{2}\/\d{4}/.test(text)) score += 5; // Date pattern

    return Math.min(95, Math.max(20, score));
  }

  // Extract structured data from specific line patterns
  static extractFromPattern(text: string, pattern: RegExp, fieldName: string): { value: string; confidence: number } | null {
    const match = text.match(pattern);
    if (!match || !match[1]) return null;

    const value = match[1].trim();
    let confidence = 70; // Base confidence

    // Adjust confidence based on field type validation
    switch (fieldName) {
      case 'aadhaarNumber':
        if (/^\d{12}$/.test(value.replace(/\s/g, ''))) confidence = 95;
        break;
      case 'panNumber':
        if (/^[A-Z]{5}\d{4}[A-Z]$/.test(value)) confidence = 95;
        break;
      case 'voterNumber':
        if (/^[A-Z]{3}\d{7}$/.test(value)) confidence = 95;
        break;
      case 'passportNumber':
        if (/^[A-Z]\d{7}$/.test(value)) confidence = 95;
        break;
      case 'licenseNumber':
        if (/^[A-Z]{2}\d{2}\d{11}$/.test(value.replace(/\s/g, ''))) confidence = 95;
        break;
      case 'dob':
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
          // Validate actual date
          const [day, month, year] = value.split('/').map(Number);
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2024) {
            confidence = 90;
          }
        }
        break;
      case 'name':
        if (value.length > 2 && value.length < 50 && /^[A-Za-z\s]+$/.test(value)) {
          confidence = 85;
        }
        break;
    }

    return { value, confidence };
  }

  // Clean and structure address text
  static cleanAddress(addressText: string): string {
    return addressText
      .replace(/\s+/g, ' ')
      .replace(/,+/g, ',')
      .replace(/\s*,\s*/g, ', ')
      .replace(/,\s*$/, '')
      .trim();
  }

  // Extract pincode from address or separate text
  static extractPincode(text: string): { value: string; confidence: number } | null {
    const pincodePattern = /\b(\d{6})\b/g;
    const matches = text.match(pincodePattern);
    
    if (!matches) return null;
    
    // Find the most likely pincode (usually the last 6-digit number)
    const pincode = matches[matches.length - 1];
    
    // Validate pincode range (Indian pincodes are 100000-999999)
    const pincodeNum = parseInt(pincode);
    const confidence = (pincodeNum >= 100000 && pincodeNum <= 999999) ? 90 : 60;
    
    return { value: pincode, confidence };
  }
}