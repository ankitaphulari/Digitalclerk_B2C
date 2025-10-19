// NEW: Complete Caste Validity Certificate extraction with ALL 18 fields
// Extracts 8-DIGIT validity number and verification details

import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface CasteValidityExtractionResult {
  validityNumber?: string; // 8-digit: 12345678
  referenceCertificateNumber?: string; // Original 4-digit cert number
  name?: string;
  fathersName?: string;
  dob?: string;
  caste?: string;
  subCaste?: string;
  district?: string;
  state?: string;
  scrutinyCommittee?: string;
  committeeOfficeAddress?: string;
  verificationDate?: string;
  validFrom?: string;
  validTill?: string;
  committeeMembers?: string[];
  chairmanSignature?: boolean;
  seal?: boolean;
  remarks?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class CasteValidityExtractor {
  private static readonly HEADER_BLACKLIST = [
    'GOVERNMENT OF',
    'CASTE VALIDITY',
    'VALIDITY CERTIFICATE',
    'जाति वैधता',
    'SCRUTINY COMMITTEE',
    'CERTIFICATE'
  ];

  /**
   * Extracts ALL data from Caste Validity Certificate (18 fields)
   */
  static extractFromCasteValidity(ocrText: string): CasteValidityExtractionResult {
    const result: CasteValidityExtractionResult = {
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

    console.log('📋 Caste Validity - Processing lines:', lines.length);

    // 1. Extract Validity Number (8-digit) - MOST IMPORTANT
    const validityNumber = this.extractValidityNumber(ocrText);
    if (validityNumber) {
      result.validityNumber = validityNumber;
      result.extractedFields.validityNumber = validityNumber;
      result.extractedFields.validity_number = validityNumber;
      result.extractedFields.certificateNumber = validityNumber;
      result.confidence += 35;
      console.log('✅ Validity Number (8-digit):', validityNumber);
    }

    // 2. Extract Reference Certificate Number (original 4-digit)
    const referenceCertNumber = this.extractReferenceCertificateNumber(ocrText);
    if (referenceCertNumber) {
      result.referenceCertificateNumber = referenceCertNumber;
      result.extractedFields.referenceCertificateNumber = referenceCertNumber;
      result.extractedFields.reference_cert_number = referenceCertNumber;
      result.extractedFields.originalCertNumber = referenceCertNumber;
      result.confidence += 20;
      console.log('✅ Reference Certificate Number (4-digit):', referenceCertNumber);
    }

    // 3. Extract Name
    const name = this.extractName(lines, ocrText);
    if (name) {
      result.name = name;
      result.extractedFields.name = name;
      result.extractedFields.applicantName = name;
      result.extractedFields.fullName = name;
      result.confidence += 10;
      console.log('✅ Name:', name);
    }

    // 4. Extract Father's Name
    const fathersName = this.extractFathersName(ocrText);
    if (fathersName) {
      result.fathersName = fathersName;
      result.extractedFields.fathersName = fathersName;
      result.extractedFields.fathers_name = fathersName;
      result.confidence += 5;
      console.log('✅ Father\'s Name:', fathersName);
    }

    // 5. Extract Date of Birth
    const dob = this.extractDOB(ocrText);
    if (dob) {
      result.dob = dob;
      result.extractedFields.dob = dob;
      result.extractedFields.dateOfBirth = dob;
      result.confidence += 5;
      console.log('✅ Date of Birth:', dob);
    }

    // 6. Extract Caste/Category
    const casteData = this.extractCaste(ocrText);
    if (casteData.caste) {
      result.caste = casteData.caste;
      result.extractedFields.caste = casteData.caste;
      result.extractedFields.category = casteData.caste;
      result.confidence += 10;
      console.log('✅ Caste/Category:', casteData.caste);
    }
    if (casteData.subCaste) {
      result.subCaste = casteData.subCaste;
      result.extractedFields.subCaste = casteData.subCaste;
      console.log('✅ Sub-Caste:', casteData.subCaste);
    }

    // 7. Extract District
    const district = this.extractDistrict(ocrText);
    if (district) {
      result.district = district;
      result.extractedFields.district = district;
      result.confidence += 5;
      console.log('✅ District:', district);
    }

    // 8. Extract State
    const state = this.extractState(ocrText);
    if (state) {
      result.state = state;
      result.extractedFields.state = state;
      console.log('✅ State:', state);
    }

    // 9. Extract Scrutiny Committee Name
    const scrutinyCommittee = this.extractScrutinyCommittee(ocrText);
    if (scrutinyCommittee) {
      result.scrutinyCommittee = scrutinyCommittee;
      result.extractedFields.scrutinyCommittee = scrutinyCommittee;
      result.extractedFields.committee_name = scrutinyCommittee;
      result.confidence += 5;
      console.log('✅ Scrutiny Committee:', scrutinyCommittee);
    }

    // 10. Extract Committee Office Address
    const committeeOfficeAddress = this.extractCommitteeOfficeAddress(ocrText);
    if (committeeOfficeAddress) {
      result.committeeOfficeAddress = committeeOfficeAddress;
      result.extractedFields.committeeOfficeAddress = committeeOfficeAddress;
      console.log('✅ Committee Office:', committeeOfficeAddress);
    }

    // 11. Extract Verification Date
    const verificationDate = this.extractVerificationDate(ocrText);
    if (verificationDate) {
      result.verificationDate = verificationDate;
      result.extractedFields.verificationDate = verificationDate;
      result.extractedFields.verification_date = verificationDate;
      result.confidence += 5;
      console.log('✅ Verification Date:', verificationDate);
    }

    // 12. Extract Valid From Date
    const validFrom = this.extractValidFrom(ocrText);
    if (validFrom) {
      result.validFrom = validFrom;
      result.extractedFields.validFrom = validFrom;
      result.extractedFields.valid_from = validFrom;
      console.log('✅ Valid From:', validFrom);
    }

    // 13. Extract Valid Till Date
    const validTill = this.extractValidTill(ocrText);
    if (validTill) {
      result.validTill = validTill;
      result.extractedFields.validTill = validTill;
      result.extractedFields.valid_till = validTill;
      result.extractedFields.expiryDate = validTill;
      console.log('✅ Valid Till:', validTill);
    }

    // 14. Extract Committee Members
    const committeeMembers = this.extractCommitteeMembers(ocrText);
    if (committeeMembers && committeeMembers.length > 0) {
      result.committeeMembers = committeeMembers;
      result.extractedFields.committeeMembers = committeeMembers;
      result.extractedFields.members = committeeMembers;
      console.log('✅ Committee Members:', committeeMembers.length);
    }

    // 15. Check for Chairman Signature
    result.chairmanSignature = this.hasChairmanSignature(ocrText);
    result.extractedFields.chairmanSignature = result.chairmanSignature ? 'Present' : 'Not Found';

    // 16. Check for Seal
    result.seal = this.hasSeal(ocrText);
    result.extractedFields.seal = result.seal ? 'Present' : 'Not Found';

    // 17. Extract Remarks
    const remarks = this.extractRemarks(ocrText);
    if (remarks) {
      result.remarks = remarks;
      result.extractedFields.remarks = remarks;
      console.log('✅ Remarks:', remarks);
    }

    console.log('📊 Caste Validity extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  /**
   * Extracts 8-digit Validity Number
   */
  private static extractValidityNumber(text: string): string | null {
    const patterns = [
      /(?:Validity|Valid)\s*(?:No|Number|Certificate)?\s*:?\s*(\d{8})/gi,
      /(?:Certificate|Cert)\s*(?:No|Number)?\s*:?\s*(\d{8})/gi,
      /\b(\d{8})\b/
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const num = match[1];
        if (/^\d{8}$/.test(num)) {
          return num;
        }
      }
    }

    return null;
  }

  /**
   * Extracts Reference Certificate Number (original 4-digit)
   */
  private static extractReferenceCertificateNumber(text: string): string | null {
    const patterns = [
      /(?:Reference|Original|Based on)\s*(?:Certificate|Cert)?\s*(?:No|Number)?\s*:?\s*(\d{4}[-\/]?\d{0,4})/gi,
      /(?:Ref)\s*:?\s*(\d{4}[-\/]?\d{0,4})/gi
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const certNum = match[1];
        if (/^\d{4}$/.test(certNum) || /^\d{4}[-\/]\d{4}$/.test(certNum)) {
          return certNum;
        }
      }
    }

    return null;
  }

  /**
   * Extracts applicant name
   */
  private static extractName(lines: string[], fullText: string): string | null {
    const namePatterns = [
      /(?:Name|नाम|Applicant)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i,
      /(?:This is to certify that)\s+([A-Z][a-z\s]+)/i
    ];

    for (const pattern of namePatterns) {
      const match = fullText.match(pattern);
      if (match) {
        const name = match[1].trim();
        if (!this.isHeaderLine(name) && name.length >= 3) {
          return formatNameForDisplay(name);
        }
      }
    }

    return null;
  }

  /**
   * Extracts father's name
   */
  private static extractFathersName(text: string): string | null {
    const patterns = [
      /(?:Father|Father'?s?\s*Name|S\/O|पिता)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const name = match[1].trim();
        if (!this.isHeaderLine(name) && name.length >= 3) {
          return formatNameForDisplay(name);
        }
      }
    }

    return null;
  }

  /**
   * Extracts date of birth
   */
  private static extractDOB(text: string): string | null {
    const patterns = [
      /(?:DOB|Date of Birth|जन्म तिथि)\s*:?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i
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
   * Extracts caste and sub-caste
   */
  private static extractCaste(text: string): { caste?: string; subCaste?: string } {
    const result: { caste?: string; subCaste?: string } = {};

    // Main caste
    const castePatterns = [
      /(?:Caste|Category|जाति)\s*:?\s*(SC|ST|OBC|VJNT|SBC)/i,
      /(?:Caste|Category)\s*:?\s*([A-Za-z\s]{3,50}?)(?=\n|Sub|Date)/i
    ];

    for (const pattern of castePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.caste = match[1].trim().toUpperCase();
        break;
      }
    }

    // Sub-caste
    const subCastePatterns = [
      /(?:Sub[\s-]?Caste|उप[\s-]?जाति)\s*:?\s*([A-Za-z\s]{3,50}?)(?=\n|Date|District)/i
    ];

    for (const pattern of subCastePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.subCaste = match[1].trim();
        break;
      }
    }

    return result;
  }

  /**
   * Extracts district
   */
  private static extractDistrict(text: string): string | null {
    const patterns = [
      /(?:District|Dist|जिला)\s*:?\s*([A-Za-z\s]{2,50}?)(?=\n|State|,)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extracts state
   */
  private static extractState(text: string): string | null {
    const patterns = [
      /(?:State|राज्य)\s*:?\s*([A-Za-z\s]{2,50}?)(?=\n|,)/i,
      /\b(Maharashtra|Gujarat|Rajasthan|Karnataka|Tamil Nadu|Kerala|Punjab|Haryana|Uttar Pradesh|Madhya Pradesh|Bihar|West Bengal|Andhra Pradesh|Telangana|Odisha|Jharkhand|Chhattisgarh|Assam|Himachal Pradesh|Uttarakhand|Goa)\b/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extracts scrutiny committee name
   */
  private static extractScrutinyCommittee(text: string): string | null {
    const patterns = [
      /(?:Scrutiny Committee|Committee|समिति)\s*:?\s*([A-Za-z\s,.-]{5,100}?)(?=\n\n|Date|Office)/i,
      /(Caste Scrutiny Committee|District Level Committee|State Level Committee)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extracts committee office address
   */
  private static extractCommitteeOfficeAddress(text: string): string | null {
    const patterns = [
      /(?:Office|Committee Office|कार्यालय)\s*:?\s*(.{10,200}?)(?=\n\n|Date|Signature)/is
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
   * Extracts verification date
   */
  private static extractVerificationDate(text: string): string | null {
    const patterns = [
      /(?:Verification Date|Verified on|Date of Verification)\s*:?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i,
      /(?:Date)\s*:?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i
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
   * Extracts valid from date
   */
  private static extractValidFrom(text: string): string | null {
    const patterns = [
      /(?:Valid from|From|Effective from)\s*:?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i
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
   * Extracts valid till date (or "Permanent" status)
   */
  private static extractValidTill(text: string): string | null {
    // Check for "Permanent" keyword
    if (/\b(Permanent|Permanently|Life[\s-]?time)\b/i.test(text)) {
      return 'Permanent';
    }

    const patterns = [
      /(?:Valid till|Valid upto|Valid until|Expires on)\s*:?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i
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
   * Extracts committee members names
   */
  private static extractCommitteeMembers(text: string): string[] | null {
    const members: string[] = [];

    // Look for member patterns
    const memberPatterns = [
      /(?:Member|सदस्य)\s*:?\s*([A-Z][a-zA-Z\s.'-]{5,50})/gi,
      /(?:Chairman|Chairperson|अध्यक्ष)\s*:?\s*([A-Z][a-zA-Z\s.'-]{5,50})/i
    ];

    memberPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const name = match[1].trim();
        if (!this.isHeaderLine(name) && name.length >= 5) {
          members.push(formatNameForDisplay(name));
        }
      }
    });

    return members.length > 0 ? members : null;
  }

  /**
   * Checks if chairman signature is present
   */
  private static hasChairmanSignature(text: string): boolean {
    const signatureKeywords = [
      'CHAIRMAN', 'CHAIRPERSON', 'SIGNATURE',
      'SIGNED', 'अध्यक्ष', 'हस्ताक्षर'
    ];

    const upperText = text.toUpperCase();
    return signatureKeywords.some(keyword => upperText.includes(keyword));
  }

  /**
   * Checks if seal/stamp is present
   */
  private static hasSeal(text: string): boolean {
    const sealKeywords = [
      'SEAL', 'STAMP', 'मुहर',
      'COMMITTEE SEAL', 'OFFICIAL STAMP'
    ];

    const upperText = text.toUpperCase();
    return sealKeywords.some(keyword => upperText.includes(keyword));
  }

  /**
   * Extracts remarks or notes
   */
  private static extractRemarks(text: string): string | null {
    const patterns = [
      /(?:Remarks|Notes|टिप्पणी)\s*:?\s*(.{5,200}?)(?=\n\n|Signature|Date)/is
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
   * Checks if line is header
   */
  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header => 
      upperLine.includes(header) || upperLine === header
    );
  }
}
