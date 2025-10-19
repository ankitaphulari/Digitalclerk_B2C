// ENHANCED: Complete Aadhaar card extraction with ALL 10 fields
// Extracts: Aadhaar, Name, Father/Husband, DOB/YOB, Gender, Address, Pincode, Mobile, Email, Photo status

import { normalizeInput, formatNameForDisplay, extractAadhaarDigits } from '@/utils/inputNormalization';

export interface AadhaarExtractionResult {
  aadhaar?: string;
  name?: string;
  fathersName?: string;
  husbandsName?: string;
  dob?: string;
  yob?: string;
  gender?: string;
  address?: string;
  pincode?: string;
  mobile?: string;
  email?: string;
  enrollmentId?: string;
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
    'भारत सरकार',
    'GOVERNMENT',
    'AUTHORITY',
    'IDENTIFICATION'
  ];

  private static readonly ADDRESS_TOKENS = [
    'ROAD', 'RD', 'NAGAR', 'SOCIETY', 'COLONY', 'SECTOR', 'FLAT', 'APARTMENT',
    'PLOT', 'TAL', 'DIST', 'DISTRICT', 'PO', 'PIN', 'MAHARASHTRA', 'PUNE', 'MH',
    'STREET', 'ST', 'LANE', 'BLOCK', 'WARD', 'VILLAGE', 'CITY', 'TOWN', 'AREA',
    'NAKA', 'CHOWK', 'PETH', 'GALLI', 'MARG', 'ROAD', 'TEHSIL', 'TALUKA'
  ];

  private static readonly GENDER_KEYWORDS = [
    'MALE', 'FEMALE', 'TRANSGENDER',
    'पुरुष', 'महिला', 'M', 'F', 'GENDER', 'SEX', 'लिंग'
  ];

  /**
   * Extracts ALL data from Aadhaar card OCR text (10 fields)
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

    console.log('📋 Aadhaar - Processing lines:', lines);

    // 1. Extract Aadhaar number (12 digits)
    const aadhaarNumber = this.extractAadhaarNumber(ocrText);
    if (aadhaarNumber) {
      result.aadhaar = aadhaarNumber;
      result.extractedFields.aadhaar = aadhaarNumber;
      result.extractedFields.aadhaarNumber = aadhaarNumber;
      result.confidence += 35;
      console.log('✅ Aadhaar Number:', aadhaarNumber);
    }

    // 2. Extract DOB/YOB
    const dateData = this.extractDateOfBirth(ocrText);
    if (dateData.dob) {
      result.dob = dateData.dob;
      result.extractedFields.dob = dateData.dob;
      result.extractedFields.date_of_birth = dateData.dob;
      result.extractedFields.dateOfBirth = dateData.dob;
      result.confidence += 20;
      console.log('✅ Date of Birth:', dateData.dob);
    } else if (dateData.yob) {
      result.yob = dateData.yob;
      result.extractedFields.yob = dateData.yob;
      result.extractedFields.year_of_birth = dateData.yob;
      result.extractedFields.yearOfBirth = dateData.yob;
      result.confidence += 15;
      console.log('✅ Year of Birth:', dateData.yob);
    }

    // 3. Extract name
    const name = this.extractName(lines);
    if (name) {
      result.name = name;
      result.extractedFields.name = name;
      result.extractedFields.fullName = name;
      result.extractedFields.holderName = name;
      result.confidence += 15;
      console.log('✅ Name:', name);
    }

    // 4. Extract Father's Name or Husband's Name (context-aware)
    const parentalData = this.extractParentalNames(lines, ocrText);
    if (parentalData.fathersName) {
      result.fathersName = parentalData.fathersName;
      result.extractedFields.fathersName = parentalData.fathersName;
      result.extractedFields.fathers_name = parentalData.fathersName;
      result.extractedFields.fatherName = parentalData.fathersName;
      result.confidence += 10;
      console.log('✅ Father\'s Name:', parentalData.fathersName);
    }
    if (parentalData.husbandsName) {
      result.husbandsName = parentalData.husbandsName;
      result.extractedFields.husbandsName = parentalData.husbandsName;
      result.extractedFields.husbands_name = parentalData.husbandsName;
      result.extractedFields.husbandName = parentalData.husbandsName;
      result.confidence += 10;
      console.log('✅ Husband\'s Name:', parentalData.husbandsName);
    }

    // 5. Extract Gender
    const gender = this.extractGender(ocrText);
    if (gender) {
      result.gender = gender;
      result.extractedFields.gender = gender;
      result.extractedFields.sex = gender;
      result.confidence += 10;
      console.log('✅ Gender:', gender);
    }

    // 6. Extract address and PIN
    const addressData = this.extractAddress(lines);
    if (addressData.address) {
      result.address = addressData.address;
      result.extractedFields.address = addressData.address;
      result.extractedFields.permanentAddress = addressData.address;
      result.confidence += 10;
      console.log('✅ Address:', addressData.address.substring(0, 50) + '...');
    }
    if (addressData.pincode) {
      result.pincode = addressData.pincode;
      result.extractedFields.pincode = addressData.pincode;
      result.extractedFields.pin = addressData.pincode;
      result.extractedFields.postalCode = addressData.pincode;
      console.log('✅ Pincode:', addressData.pincode);
    }

    // 7. Extract Mobile Number (if present)
    const mobile = this.extractMobileNumber(ocrText);
    if (mobile) {
      result.mobile = mobile;
      result.extractedFields.mobile = mobile;
      result.extractedFields.mobileNumber = mobile;
      result.extractedFields.phone = mobile;
      result.confidence += 5;
      console.log('✅ Mobile:', mobile);
    }

    // 8. Extract Email (if present)
    const email = this.extractEmail(ocrText);
    if (email) {
      result.email = email;
      result.extractedFields.email = email;
      result.extractedFields.emailAddress = email;
      result.confidence += 5;
      console.log('✅ Email:', email);
    }

    // 9. Extract Enrollment ID (if visible)
    const enrollmentId = this.extractEnrollmentId(ocrText);
    if (enrollmentId) {
      result.enrollmentId = enrollmentId;
      result.extractedFields.enrollmentId = enrollmentId;
      result.extractedFields.enrollment_id = enrollmentId;
      console.log('✅ Enrollment ID:', enrollmentId);
    }

    console.log('📊 Aadhaar extraction complete - Confidence:', result.confidence + '%');
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
      /(?:DOB|Date of Birth|D\.O\.B|जन्म तिथि)[:\s]*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i,
      /\b([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})\b/
    ];

    for (const pattern of dobPatterns) {
      const match = text.match(pattern);
      if (match) {
        return { dob: match[1] };
      }
    }

    // Try year of birth
    const yobPattern = /(?:Year of Birth|YOB|जन्म वर्ष)[:\s]*(\d{4})/i;
    const yobMatch = text.match(yobPattern);
    if (yobMatch) {
      const year = parseInt(yobMatch[1]);
      if (year >= 1900 && year <= 2025) {
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
      const nameMatch = line.match(/(?:Name|नाम)[:\s]*([A-Za-z][A-Za-z\s.'-]+)/i);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        if (!this.isHeaderLine(name)) {
          return formatNameForDisplay(name);
        }
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
        
        // Exclude if contains gender keywords
        if (this.containsGenderKeyword(line)) return false;
        
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
   * Extracts Father's Name or Husband's Name (context-aware for marital status)
   */
  private static extractParentalNames(lines: string[], fullText: string): { 
    fathersName?: string; 
    husbandsName?: string;
  } {
    const result: { fathersName?: string; husbandsName?: string } = {};

    // Look for explicit Father's Name labels
    const fatherPatterns = [
      /(?:Father|Father'?s?\s*Name|S\/O|पिता का नाम|पिता)[:\s]*([A-Za-z][A-Za-z\s.'-]+)/i,
      /(?:S\/O)[:\s]*([A-Z][A-Z\s.'-]+)/
    ];

    for (const pattern of fatherPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        const name = match[1].trim();
        if (!this.isHeaderLine(name) && name.length >= 3) {
          result.fathersName = formatNameForDisplay(name);
          break;
        }
      }
    }

    // Look for explicit Husband's Name labels (for married women)
    const husbandPatterns = [
      /(?:Husband|Husband'?s?\s*Name|W\/O|पति का नाम|पति)[:\s]*([A-Za-z][A-Za-z\s.'-]+)/i,
      /(?:W\/O)[:\s]*([A-Z][A-Z\s.'-]+)/
    ];

    for (const pattern of husbandPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        const name = match[1].trim();
        if (!this.isHeaderLine(name) && name.length >= 3) {
          result.husbandsName = formatNameForDisplay(name);
          break;
        }
      }
    }

    return result;
  }

  /**
   * Extracts Gender from Aadhaar card
   */
  private static extractGender(text: string): string | null {
    const genderPatterns = [
      /(?:Gender|Sex|लिंग)[:\s]*(Male|Female|Transgender|पुरुष|महिला|M|F)/i,
      /\b(Male|Female|Transgender|पुरुष|महिला)\b/i
    ];

    for (const pattern of genderPatterns) {
      const match = text.match(pattern);
      if (match) {
        const gender = match[1].toUpperCase();
        
        // Normalize gender
        if (gender === 'M' || gender === 'MALE' || gender === 'पुरुष') {
          return 'Male';
        } else if (gender === 'F' || gender === 'FEMALE' || gender === 'महिला') {
          return 'Female';
        } else if (gender.includes('TRANS')) {
          return 'Transgender';
        }
        
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extracts Mobile Number (if present on card)
   */
  private static extractMobileNumber(text: string): string | null {
    const mobilePatterns = [
      /(?:Mobile|Mob|Phone|मोबाइल|फोन)[:\s]*(\d{10})/i,
      /(?:Mobile|Mob)[:\s]*(\+91[\s-]?\d{10})/i,
      /\b(\d{10})\b/
    ];

    for (const pattern of mobilePatterns) {
      const match = text.match(pattern);
      if (match) {
        const mobile = match[1].replace(/\D/g, '').slice(-10);
        if (mobile.length === 10 && /^[6-9]/.test(mobile)) {
          return mobile;
        }
      }
    }

    return null;
  }

  /**
   * Extracts Email (if present on card)
   */
  private static extractEmail(text: string): string | null {
    const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/;
    const match = text.match(emailPattern);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Extracts Enrollment ID (if visible)
   */
  private static extractEnrollmentId(text: string): string | null {
    const enrollmentPatterns = [
      /(?:Enrollment|Enrolment|EID)[:\s]*(\d{14})/i,
      /\b(\d{14})\b/
    ];

    for (const pattern of enrollmentPatterns) {
      const match = text.match(pattern);
      if (match && match[1] !== this.extractAadhaarNumber(text)) {
        return match[1];
      }
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

  /**
   * Checks if line contains gender keywords
   */
  private static containsGenderKeyword(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.GENDER_KEYWORDS.some(keyword => upperLine.includes(keyword));
  }
}
