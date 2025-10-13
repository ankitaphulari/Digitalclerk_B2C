// Enhanced Aadhaar card extraction with space-aware parsing
// Extracts Aadhaar number, name, DOB/YOB, and address with PIN detection

import { normalizeInput, formatNameForDisplay, extractAadhaarDigits } from '@/utils/inputNormalization';

export interface AadhaarExtractionResult {
  aadhaar?: string;
  name?: string;
  dob?: string;
  yob?: string;
  address?: string;
  pincode?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class AadhaarExtractor {
  private static readonly HEADER_BLACKLIST = [
    'GOVERNMENT OF INDIA',
    'UNIQUE IDENTIFICATION AUTHORITY OF INDIA',
    'UIDAI',
    'आधार',
    'AADHAAR',
    'भारत सरकार'
  ];

  private static readonly ADDRESS_TOKENS = [
    'ROAD', 'RD', 'NAGAR', 'SOCIETY', 'COLONY', 'SECTOR', 'FLAT', 'APARTMENT',
    'PLOT', 'TAL', 'DIST', 'DISTRICT', 'PO', 'PIN', 'MAHARASHTRA', 'PUNE', 'MH',
    'STREET', 'ST', 'LANE', 'BLOCK', 'WARD', 'VILLAGE', 'CITY', 'TOWN'
  ];

  /**
   * Extracts data from Aadhaar card OCR text
   */
  static extractFromAadhaarCard(ocrText: string): AadhaarExtractionResult {
    const result: AadhaarExtractionResult = {
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

    console.log('Aadhaar - Processing lines:', lines);

    // Extract Aadhaar number
    const aadhaarNumber = this.extractAadhaarNumber(ocrText);
    if (aadhaarNumber) {
      result.aadhaar = aadhaarNumber;
      result.extractedFields.aadhaar = aadhaarNumber;
      result.extractedFields.aadhaarNumber = aadhaarNumber;
      result.confidence += 35;
    }

    // Extract DOB/YOB
    const dateData = this.extractDateOfBirth(ocrText);
    if (dateData.dob) {
      result.dob = dateData.dob;
      result.extractedFields.dob = dateData.dob;
      result.extractedFields.date_of_birth = dateData.dob;
      result.confidence += 25;
    } else if (dateData.yob) {
      result.yob = dateData.yob;
      result.extractedFields.yob = dateData.yob;
      result.extractedFields.year_of_birth = dateData.yob;
      result.confidence += 15;
    }

    // Extract name
    const name = this.extractName(lines);
    if (name) {
      result.name = name;
      result.extractedFields.name = name;
      result.extractedFields.fullName = name;
      result.confidence += 25;
    }

    // Extract address and PIN
    const addressData = this.extractAddress(lines);
    if (addressData.address) {
      result.address = addressData.address;
      result.extractedFields.address = addressData.address;
      result.confidence += 15;
    }
    if (addressData.pincode) {
      result.pincode = addressData.pincode;
      result.extractedFields.pincode = addressData.pincode;
      result.extractedFields.pin = addressData.pincode;
    }

    console.log('Aadhaar extraction result:', result);
    return result;
  }

  /**
   * Extracts Aadhaar number (12 digits with optional spaces)
   */
  private static extractAadhaarNumber(text: string): string | null {
    const aadhaarPattern = /\b(\d{4}\s?\d{4}\s?\d{4})\b/;
    const match = text.match(aadhaarPattern);
    
    if (match) {
      const digits = extractAadhaarDigits(match[1]);
      return digits.length === 12 ? digits : null;
    }
    
    return null;
  }

  /**
   * Extracts date of birth or year of birth
   */
  private static extractDateOfBirth(text: string): { dob?: string; yob?: string } {
    // Try full DOB first
    const dobPatterns = [
      /(?:DOB|Date of Birth|D\.O\.B)[:\s]*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i,
      /\b([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})\b/
    ];

    for (const pattern of dobPatterns) {
      const match = text.match(pattern);
      if (match) {
        return { dob: match[1] };
      }
    }

    // Try year of birth
    const yobPattern = /(?:Year of Birth|YOB)[:\s]*(\d{4})/i;
    const yobMatch = text.match(yobPattern);
    if (yobMatch) {
      const year = parseInt(yobMatch[1]);
      if (year >= 1900 && year <= 2024) {
        return { yob: yobMatch[1] };
      }
    }

    return {};
  }

  /**
   * Extracts name from Aadhaar card
   */
  private static extractName(lines: string[]): string | null {
    // Look for explicit name label first
    for (const line of lines) {
      const nameMatch = line.match(/(?:Name)[:\s]*([A-Za-z][A-Za-z\s.'-]+)/i);
      if (nameMatch) {
        return formatNameForDisplay(nameMatch[1]);
      }
    }

    // Find candidate name lines (alphabetic with spaces, not headers)
    const candidateLines = lines
      .filter(line => {
        // Must be mostly alphabetic with spaces
        if (!/^[A-Za-z .'-]{3,50}$/.test(line)) return false;
        
        // Exclude header lines
        if (this.isHeaderLine(line)) return false;
        
        // Must have at least one space (multi-word names)
        if (!line.includes(' ')) return false;
        
        return true;
      })
      .map(line => line.trim());

    // Return the first valid candidate
    if (candidateLines.length > 0) {
      return formatNameForDisplay(candidateLines[0]);
    }

    return null;
  }

  /**
   * Extracts address with PIN code detection
   */
  private static extractAddress(lines: string[]): { address?: string; pincode?: string } {
    let addressLines: string[] = [];
    let pincode: string | null = null;

    // Look for explicit address label
    const addressStartIndex = lines.findIndex(line => 
      /^(?:Address|पता)[:\s]*/.test(line)
    );

    if (addressStartIndex >= 0) {
      // Collect lines from address label until PIN is found
      for (let i = addressStartIndex; i < lines.length; i++) {
        const line = lines[i];
        const pincodeMatch = line.match(/\b(\d{6})\b/);
        
        if (pincodeMatch) {
          pincode = pincodeMatch[1];
          addressLines.push(line);
          break;
        } else {
          addressLines.push(line);
        }
      }
    } else {
      // Find address by looking for lines with address tokens
      const potentialAddressLines = lines.filter(line => {
        const upperLine = line.toUpperCase();
        return this.ADDRESS_TOKENS.some(token => upperLine.includes(token)) ||
               /\b\d{6}\b/.test(line); // Contains PIN
      });

      if (potentialAddressLines.length > 0) {
        addressLines = potentialAddressLines;
        
        // Extract PIN from the last line that contains it
        for (let i = potentialAddressLines.length - 1; i >= 0; i--) {
          const pincodeMatch = potentialAddressLines[i].match(/\b(\d{6})\b/);
          if (pincodeMatch) {
            pincode = pincodeMatch[1];
            break;
          }
        }
      }
    }

    // Clean and format address
    let address: string | null = null;
    if (addressLines.length > 0) {
      address = addressLines
        .map(line => line.replace(/^(?:Address|पता)[:\s]*/, '').trim())
        .filter(line => line.length > 0)
        .join(', ')
        .replace(/,+/g, ',')
        .replace(/\s*,\s*/g, ', ')
        .replace(/,\s*$/, '')
        .trim();
      
      if (address.length < 5) {
        address = null;
      }
    }

    return { address: address || undefined, pincode: pincode || undefined };
  }

  /**
   * Checks if a line is a header that should be excluded
   */
  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header => 
      upperLine.includes(header) || upperLine === header
    );
  }
}