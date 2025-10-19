// NEW: Complete Passport extraction with ALL 16 fields
// Extracts: Passport Number, Names, Dates, Place of Birth, Parents, Spouse, Address, etc.

import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface PassportExtractionResult {
  passportNumber?: string; // X9999999 or XX9999999
  surname?: string;
  givenNames?: string;
  dob?: string;
  placeOfBirth?: string;
  dateOfIssue?: string;
  dateOfExpiry?: string;
  placeOfIssue?: string;
  gender?: string;
  nationality?: string;
  fathersName?: string;
  mothersName?: string;
  spouseName?: string;
  address?: string;
  fileNumber?: string;
  oldPassportNumber?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class PassportExtractor {
  private static readonly HEADER_BLACKLIST = [
    'PASSPORT',
    'REPUBLIC OF INDIA',
    'GOVERNMENT OF INDIA',
    'MINISTRY OF EXTERNAL AFFAIRS',
    'पासपोर्ट',
    'भारत गणराज्य'
  ];

  /**
   * Extracts ALL data from Passport (16 fields)
   */
  static extractFromPassport(ocrText: string): PassportExtractionResult {
    const result: PassportExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Passport - Processing OCR text');

    // 1. Extract Passport Number
    const passportNumber = this.extractPassportNumber(ocrText);
    if (passportNumber) {
      result.passportNumber = passportNumber;
      result.extractedFields.passportNumber = passportNumber;
      result.extractedFields.passport_number = passportNumber;
      result.confidence += 35;
      console.log('✅ Passport Number:', passportNumber);
    }

    // 2. Extract Surname
    const surname = this.extractSurname(ocrText);
    if (surname) {
      result.surname = surname;
      result.extractedFields.surname = surname;
      result.extractedFields.lastName = surname;
      result.confidence += 10;
      console.log('✅ Surname:', surname);
    }

    // 3. Extract Given Names
    const givenNames = this.extractGivenNames(ocrText);
    if (givenNames) {
      result.givenNames = givenNames;
      result.extractedFields.givenNames = givenNames;
      result.extractedFields.given_names = givenNames;
      result.extractedFields.firstName = givenNames;
      result.confidence += 10;
      console.log('✅ Given Names:', givenNames);
    }

    // 4. Extract Date of Birth
    const dob = this.extractDOB(ocrText);
    if (dob) {
      result.dob = dob;
      result.extractedFields.dob = dob;
      result.extractedFields.dateOfBirth = dob;
      result.confidence += 15;
      console.log('✅ Date of Birth:', dob);
    }

    // 5. Extract Place of Birth
    const placeOfBirth = this.extractPlaceOfBirth(ocrText);
    if (placeOfBirth) {
      result.placeOfBirth = placeOfBirth;
      result.extractedFields.placeOfBirth = placeOfBirth;
      result.extractedFields.place_of_birth = placeOfBirth;
      result.extractedFields.birthPlace = placeOfBirth;
      result.confidence += 5;
      console.log('✅ Place of Birth:', placeOfBirth);
    }

    // 6. Extract Date of Issue
    const dateOfIssue = this.extractDateOfIssue(ocrText);
    if (dateOfIssue) {
      result.dateOfIssue = dateOfIssue;
      result.extractedFields.dateOfIssue = dateOfIssue;
      result.extractedFields.date_of_issue = dateOfIssue;
      result.extractedFields.issueDate = dateOfIssue;
      result.confidence += 5;
      console.log('✅ Date of Issue:', dateOfIssue);
    }

    // 7. Extract Date of Expiry
    const dateOfExpiry = this.extractDateOfExpiry(ocrText);
    if (dateOfExpiry) {
      result.dateOfExpiry = dateOfExpiry;
      result.extractedFields.dateOfExpiry = dateOfExpiry;
      result.extractedFields.date_of_expiry = dateOfExpiry;
      result.extractedFields.expiryDate = dateOfExpiry;
      result.confidence += 5;
      console.log('✅ Date of Expiry:', dateOfExpiry);
    }

    // 8. Extract Place of Issue
    const placeOfIssue = this.extractPlaceOfIssue(ocrText);
    if (placeOfIssue) {
      result.placeOfIssue = placeOfIssue;
      result.extractedFields.placeOfIssue = placeOfIssue;
      result.extractedFields.place_of_issue = placeOfIssue;
      console.log('✅ Place of Issue:', placeOfIssue);
    }

    // 9. Extract Gender
    const gender = this.extractGender(ocrText);
    if (gender) {
      result.gender = gender;
      result.extractedFields.gender = gender;
      result.extractedFields.sex = gender;
      result.confidence += 5;
      console.log('✅ Gender:', gender);
    }

    // 10. Extract Nationality
    const nationality = this.extractNationality(ocrText);
    if (nationality) {
      result.nationality = nationality;
      result.extractedFields.nationality = nationality;
      result.confidence += 5;
      console.log('✅ Nationality:', nationality);
    }

    // 11. Extract Father's Name
    const fathersName = this.extractFathersName(ocrText);
    if (fathersName) {
      result.fathersName = fathersName;
      result.extractedFields.fathersName = fathersName;
      result.extractedFields.fathers_name = fathersName;
      console.log('✅ Father\'s Name:', fathersName);
    }

    // 12. Extract Mother's Name
    const mothersName = this.extractMothersName(ocrText);
    if (mothersName) {
      result.mothersName = mothersName;
      result.extractedFields.mothersName = mothersName;
      result.extractedFields.mothers_name = mothersName;
      console.log('✅ Mother\'s Name:', mothersName);
    }

    // 13. Extract Spouse Name
    const spouseName = this.extractSpouseName(ocrText);
    if (spouseName) {
      result.spouseName = spouseName;
      result.extractedFields.spouseName = spouseName;
      result.extractedFields.spouse_name = spouseName;
      console.log('✅ Spouse Name:', spouseName);
    }

    // 14. Extract Address
    const address = this.extractAddress(ocrText);
    if (address) {
      result.address = address;
      result.extractedFields.address = address;
      result.extractedFields.permanentAddress = address;
      console.log('✅ Address:', address.substring(0, 50) + '...');
    }

    // 15. Extract File Number
    const fileNumber = this.extractFileNumber(ocrText);
    if (fileNumber) {
      result.fileNumber = fileNumber;
      result.extractedFields.fileNumber = fileNumber;
      result.extractedFields.file_number = fileNumber;
      console.log('✅ File Number:', fileNumber);
    }

    // 16. Extract Old Passport Number (if renewal)
    const oldPassportNumber = this.extractOldPassportNumber(ocrText);
    if (oldPassportNumber) {
      result.oldPassportNumber = oldPassportNumber;
      result.extractedFields.oldPassportNumber = oldPassportNumber;
      result.extractedFields.old_passport_number = oldPassportNumber;
      console.log('✅ Old Passport Number:', oldPassportNumber);
    }

    console.log('📊 Passport extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  /**
   * Extracts Passport Number (X9999999 or XX9999999)
   */
  private static extractPassportNumber(text: string): string | null {
    const patterns = [
      /(?:Passport\s*No|Passport\s*Number|P\.?\s*No)\s*:?\s*([A-Z]{1,2}\d{7})/gi,
      /\b([A-Z]{1,2}\d{7})\b/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const passportNum = match[1] || match[0];
        if (/^[A-Z]{1,2}\d{7}$/.test(passportNum)) {
          return passportNum;
        }
      }
    }

    return null;
  }

  /**
   * Extracts Surname
   */
  private static extractSurname(text: string): string | null {
    const patterns = [
      /(?:Surname|Sur\s*Name|Last\s*Name)\s*\/?\s*([A-Z][A-Z\s]{1,30})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const surname = match[1].trim();
        if (!this.isHeaderLine(surname)) {
          return formatNameForDisplay(surname);
        }
      }
    }

    return null;
  }

  /**
   * Extracts Given Names
   */
  private static extractGivenNames(text: string): string | null {
    const patterns = [
      /(?:Given\s*Name|Given\s*Names|First\s*Name)\s*\/?\s*([A-Z][A-Z\s]{1,50})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const givenNames = match[1].trim();
        if (!this.isHeaderLine(givenNames)) {
          return formatNameForDisplay(givenNames);
        }
      }
    }

    return null;
  }

  /**
   * Extracts Date of Birth
   */
  private static extractDOB(text: string): string | null {
    const patterns = [
      /(?:Date of Birth|DOB|D\.O\.B)\s*\/?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extracts Place of Birth
   */
  private static extractPlaceOfBirth(text: string): string | null {
    const patterns = [
      /(?:Place of Birth|Birth Place)\s*\/?\s*([A-Za-z\s,]+?)(?=\n|Date|Country|Nationality)/is
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().replace(/\s+/g, ' ');
      }
    }

    return null;
  }

  /**
   * Extracts Date of Issue
   */
  private static extractDateOfIssue(text: string): string | null {
    const patterns = [
      /(?:Date of Issue|Issue Date|Issued on)\s*\/?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extracts Date of Expiry
   */
  private static extractDateOfExpiry(text: string): string | null {
    const patterns = [
      /(?:Date of Expiry|Expiry Date|Valid Until|Expires on)\s*\/?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extracts Place of Issue
   */
  private static extractPlaceOfIssue(text: string): string | null {
    const patterns = [
      /(?:Place of Issue|Issued at)\s*\/?\s*([A-Za-z\s]+?)(?=\n|Date|Country)/is
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().replace(/\s+/g, ' ');
      }
    }

    return null;
  }

  /**
   * Extracts Gender
   */
  private static extractGender(text: string): string | null {
    const patterns = [
      /(?:Sex|Gender)\s*\/?\s*(M|F|Male|Female)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const gender = match[1].toUpperCase();
        if (gender === 'M' || gender === 'MALE') return 'Male';
        if (gender === 'F' || gender === 'FEMALE') return 'Female';
      }
    }

    return null;
  }

  /**
   * Extracts Nationality
   */
  private static extractNationality(text: string): string | null {
    const patterns = [
      /(?:Nationality)\s*\/?\s*(INDIAN|IND)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return 'Indian';
      }
    }

    // Check for "IND" code
    if (/\bIND\b/.test(text)) {
      return 'Indian';
    }

    return null;
  }

  /**
   * Extracts Father's Name
   */
  private static extractFathersName(text: string): string | null {
    const patterns = [
      /(?:Father'?s?\s*Name|Father)\s*\/?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i,
      /(?:Legal\s*Guardian)\s*\/?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const name = match[1].trim();
        if (!this.isHeaderLine(name)) {
          return formatNameForDisplay(name);
        }
      }
    }

    return null;
  }

  /**
   * Extracts Mother's Name
   */
  private static extractMothersName(text: string): string | null {
    const patterns = [
      /(?:Mother'?s?\s*Name|Mother)\s*\/?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const name = match[1].trim();
        if (!this.isHeaderLine(name)) {
          return formatNameForDisplay(name);
        }
      }
    }

    return null;
  }

  /**
   * Extracts Spouse Name
   */
  private static extractSpouseName(text: string): string | null {
    const patterns = [
      /(?:Spouse'?s?\s*Name|Spouse)\s*\/?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const name = match[1].trim();
        if (!this.isHeaderLine(name)) {
          return formatNameForDisplay(name);
        }
      }
    }

    return null;
  }

  /**
   * Extracts Address
   */
  private static extractAddress(text: string): string | null {
    const patterns = [
      /(?:Address|Permanent\s*Address)\s*:?\s*(.{20,300}?)(?=\n\n|Father|Mother|File)/is
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().replace(/\s+/g, ' ').replace(/\n/g, ', ');
      }
    }

    return null;
  }

  /**
   * Extracts File Number
   */
  private static extractFileNumber(text: string): string | null {
    const patterns = [
      /(?:File\s*No|File\s*Number)\s*:?\s*([A-Z0-9\/\-]{5,20})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extracts Old Passport Number (for renewals)
   */
  private static extractOldPassportNumber(text: string): string | null {
    const patterns = [
      /(?:Old\s*Passport|Previous\s*Passport)\s*(?:No|Number)?\s*:?\s*([A-Z]{1,2}\d{7})/gi
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const oldPassport = match[1];
        if (/^[A-Z]{1,2}\d{7}$/.test(oldPassport)) {
          return oldPassport;
        }
      }
    }

    return null;
  }

  /**
   * Checks if line is header
   */
  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
