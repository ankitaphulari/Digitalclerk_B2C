// NEW: Complete Caste Certificate extraction with ALL 21 fields
// Extracts 4-DIGIT certificate number and all related data

import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface CasteCertificateExtractionResult {
  certificateNumber?: string; // 4-digit: 1234 or 2023-1234
  name?: string;
  fathersName?: string;
  mothersName?: string;
  dob?: string;
  age?: string;
  gender?: string;
  caste?: string;
  subCaste?: string;
  address?: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  issuingAuthority?: string;
  officeAddress?: string;
  issueDate?: string;
  validUntil?: string;
  purpose?: string;
  signature?: boolean;
  seal?: boolean;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class CasteCertificateExtractor {
  private static readonly HEADER_BLACKLIST = [
    'GOVERNMENT OF',
    'CASTE CERTIFICATE',
    'जाति प्रमाण पत्र',
    'DISTRICT COLLECTOR',
    'TEHSILDAR',
    'CERTIFICATE',
    'GOVERNMENT'
  ];

  private static readonly CASTE_CATEGORIES = [
    'SC', 'ST', 'OBC', 'VJNT', 'SBC', 'NT',
    'SCHEDULED CASTE', 'SCHEDULED TRIBE',
    'OTHER BACKWARD CLASS', 'NOMADIC TRIBE',
    'VIMUKTA JATI', 'SPECIAL BACKWARD CLASS'
  ];

  private static readonly AUTHORITIES = [
    'TEHSILDAR', 'SDM', 'SUB DIVISIONAL MAGISTRATE',
    'DISTRICT COLLECTOR', 'DISTRICT MAGISTRATE',
    'REVENUE OFFICER', 'MAMLATDAR'
  ];

  /**
   * Extracts ALL data from Caste Certificate (21 fields)
   */
  static extractFromCasteCertificate(ocrText: string): CasteCertificateExtractionResult {
    const result: CasteCertificateExtractionResult = {
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

    console.log('📋 Caste Certificate - Processing lines:', lines.length);

    // 1. Extract Certificate Number (4-digit) - MOST IMPORTANT
    const certificateNumber = this.extractCertificateNumber(ocrText);
    if (certificateNumber) {
      result.certificateNumber = certificateNumber;
      result.extractedFields.certificateNumber = certificateNumber;
      result.extractedFields.certificate_number = certificateNumber;
      result.extractedFields.certNumber = certificateNumber;
      result.confidence += 30;
      console.log('✅ Certificate Number (4-digit):', certificateNumber);
    }

    // 2. Extract Name
    const name = this.extractName(lines, ocrText);
    if (name) {
      result.name = name;
      result.extractedFields.name = name;
      result.extractedFields.applicantName = name;
      result.extractedFields.fullName = name;
      result.confidence += 15;
      console.log('✅ Name:', name);
    }

    // 3. Extract Father's Name
    const fathersName = this.extractFathersName(ocrText);
    if (fathersName) {
      result.fathersName = fathersName;
      result.extractedFields.fathersName = fathersName;
      result.extractedFields.fathers_name = fathersName;
      result.extractedFields.fatherName = fathersName;
      result.confidence += 10;
      console.log('✅ Father\'s Name:', fathersName);
    }

    // 4. Extract Mother's Name
    const mothersName = this.extractMothersName(ocrText);
    if (mothersName) {
      result.mothersName = mothersName;
      result.extractedFields.mothersName = mothersName;
      result.extractedFields.mothers_name = mothersName;
      result.extractedFields.motherName = mothersName;
      result.confidence += 5;
      console.log('✅ Mother\'s Name:', mothersName);
    }

    // 5. Extract Date of Birth
    const dob = this.extractDOB(ocrText);
    if (dob) {
      result.dob = dob;
      result.extractedFields.dob = dob;
      result.extractedFields.dateOfBirth = dob;
      result.extractedFields.birthDate = dob;
      result.confidence += 10;
      console.log('✅ Date of Birth:', dob);
    }

    // 6. Extract Age
    const age = this.extractAge(ocrText);
    if (age) {
      result.age = age;
      result.extractedFields.age = age;
      console.log('✅ Age:', age);
    }

    // 7. Extract Gender
    const gender = this.extractGender(ocrText);
    if (gender) {
      result.gender = gender;
      result.extractedFields.gender = gender;
      result.extractedFields.sex = gender;
      result.confidence += 5;
      console.log('✅ Gender:', gender);
    }

    // 8. Extract Caste/Category - CRITICAL
    const casteData = this.extractCaste(ocrText);
    if (casteData.caste) {
      result.caste = casteData.caste;
      result.extractedFields.caste = casteData.caste;
      result.extractedFields.category = casteData.caste;
      result.extractedFields.casteCategory = casteData.caste;
      result.confidence += 15;
      console.log('✅ Caste/Category:', casteData.caste);
    }
    if (casteData.subCaste) {
      result.subCaste = casteData.subCaste;
      result.extractedFields.subCaste = casteData.subCaste;
      result.extractedFields.sub_caste = casteData.subCaste;
      console.log('✅ Sub-Caste:', casteData.subCaste);
    }

    // 9. Extract Address Components
    const addressData = this.extractAddressComponents(lines, ocrText);
    if (addressData.address) {
      result.address = addressData.address;
      result.extractedFields.address = addressData.address;
      result.extractedFields.residentialAddress = addressData.address;
      result.confidence += 5;
      console.log('✅ Address:', addressData.address.substring(0, 50) + '...');
    }
    if (addressData.village) {
      result.village = addressData.village;
      result.extractedFields.village = addressData.village;
      console.log('✅ Village:', addressData.village);
    }
    if (addressData.taluka) {
      result.taluka = addressData.taluka;
      result.extractedFields.taluka = addressData.taluka;
      result.extractedFields.tehsil = addressData.taluka;
      console.log('✅ Taluka:', addressData.taluka);
    }
    if (addressData.district) {
      result.district = addressData.district;
      result.extractedFields.district = addressData.district;
      result.confidence += 5;
      console.log('✅ District:', addressData.district);
    }
    if (addressData.state) {
      result.state = addressData.state;
      result.extractedFields.state = addressData.state;
      console.log('✅ State:', addressData.state);
    }

    // 10. Extract Issuing Authority
    const issuingAuthority = this.extractIssuingAuthority(ocrText);
    if (issuingAuthority) {
      result.issuingAuthority = issuingAuthority;
      result.extractedFields.issuingAuthority = issuingAuthority;
      result.extractedFields.issued_by = issuingAuthority;
      result.extractedFields.authority = issuingAuthority;
      result.confidence += 5;
      console.log('✅ Issuing Authority:', issuingAuthority);
    }

    // 11. Extract Office Address
    const officeAddress = this.extractOfficeAddress(ocrText);
    if (officeAddress) {
      result.officeAddress = officeAddress;
      result.extractedFields.officeAddress = officeAddress;
      result.extractedFields.office_address = officeAddress;
      console.log('✅ Office Address:', officeAddress);
    }

    // 12. Extract Issue Date
    const issueDate = this.extractIssueDate(ocrText);
    if (issueDate) {
      result.issueDate = issueDate;
      result.extractedFields.issueDate = issueDate;
      result.extractedFields.issue_date = issueDate;
      result.extractedFields.dateOfIssue = issueDate;
      result.confidence += 5;
      console.log('✅ Issue Date:', issueDate);
    }

    // 13. Extract Valid Until (if temporary)
    const validUntil = this.extractValidUntil(ocrText);
    if (validUntil) {
      result.validUntil = validUntil;
      result.extractedFields.validUntil = validUntil;
      result.extractedFields.valid_till = validUntil;
      result.extractedFields.expiryDate = validUntil;
      console.log('✅ Valid Until:', validUntil);
    }

    // 14. Extract Purpose
    const purpose = this.extractPurpose(ocrText);
    if (purpose) {
      result.purpose = purpose;
      result.extractedFields.purpose = purpose;
      console.log('✅ Purpose:', purpose);
    }

    // 15. Check for Signature presence
    result.signature = this.hasSignature(ocrText);
    result.extractedFields.signature = result.signature ? 'Present' : 'Not Found';
    
    // 16. Check for Seal presence
    result.seal = this.hasSeal(ocrText);
    result.extractedFields.seal = result.seal ? 'Present' : 'Not Found';

    console.log('📊 Caste Certificate extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  /**
   * Extracts 4-digit Certificate Number (e.g., 1234 or 2023-1234)
   */
  private static extractCertificateNumber(text: string): string | null {
    const patterns = [
      // Explicit certificate number patterns
      /(?:Certificate|Cert|प्रमाणपत्र)\s*(?:No|Number|संख्या)?\s*:?\s*(\d{4}[-\/]?\d{4})/gi,
      /(?:Certificate|Cert|प्रमाणपत्र)\s*(?:No|Number|संख्या)?\s*:?\s*(\d{4})/gi,
      // Year-based patterns
      /(?:20\d{2})[-\/](\d{4})/,
      // Standalone 4-digit patterns (be careful with this)
      /\b(\d{4})\b/
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const certNum = match[1];
        // Validate it's actually a certificate number (4 digits)
        if (/^\d{4}$/.test(certNum)) {
          return certNum;
        } else if (/^\d{4}[-\/]\d{4}$/.test(certNum)) {
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
    // Look for explicit name labels
    const namePatterns = [
      /(?:Name|नाम|Applicant|आवेदक)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i,
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

    // Find name from lines
    const candidateLines = lines.filter(line => {
      if (!/^[A-Za-z .'-]{3,50}$/.test(line)) return false;
      if (this.isHeaderLine(line)) return false;
      if (line.includes(' ')) return true;
      return false;
    });

    if (candidateLines.length > 0) {
      return formatNameForDisplay(candidateLines[0]);
    }

    return null;
  }

  /**
   * Extracts father's name
   */
  private static extractFathersName(text: string): string | null {
    const patterns = [
      /(?:Father|Father'?s?\s*Name|S\/O|पिता का नाम|पिता)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i,
      /(?:S\/O)\s+([A-Z][A-Z\s.'-]+)/
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
   * Extracts mother's name
   */
  private static extractMothersName(text: string): string | null {
    const patterns = [
      /(?:Mother|Mother'?s?\s*Name|D\/O|माता का नाम|माता)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i
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
    const dobPatterns = [
      /(?:DOB|Date of Birth|Birth Date|जन्म तिथि)\s*:?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i,
      /(?:Born on)\s*:?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i
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
   * Extracts age
   */
  private static extractAge(text: string): string | null {
    const agePatterns = [
      /(?:Age|उम्र|वय)\s*:?\s*(\d{1,3})\s*(?:years|yrs|Years)?/i
    ];

    for (const pattern of agePatterns) {
      const match = text.match(pattern);
      if (match) {
        const age = parseInt(match[1]);
        if (age >= 0 && age <= 120) {
          return match[1];
        }
      }
    }

    return null;
  }

  /**
   * Extracts gender
   */
  private static extractGender(text: string): string | null {
    const genderPatterns = [
      /(?:Gender|Sex|लिंग)\s*:?\s*(Male|Female|पुरुष|महिला|M|F)/i
    ];

    for (const pattern of genderPatterns) {
      const match = text.match(pattern);
      if (match) {
        const gender = match[1].toUpperCase();
        if (gender === 'M' || gender === 'MALE' || gender === 'पुरुष') {
          return 'Male';
        } else if (gender === 'F' || gender === 'FEMALE' || gender === 'महिला') {
          return 'Female';
        }
      }
    }

    return null;
  }

  /**
   * Extracts caste and sub-caste
   */
  private static extractCaste(text: string): { caste?: string; subCaste?: string } {
    const result: { caste?: string; subCaste?: string } = {};

    // Extract main caste category
    const castePatterns = [
      /(?:Caste|Category|जाति|श्रेणी)\s*:?\s*(SC|ST|OBC|VJNT|SBC|NT)/i,
      /(?:Scheduled Caste|Scheduled Tribe|Other Backward Class)/i,
      /(?:Caste|Category|जाति)\s*:?\s*([A-Za-z\s]{3,50}?)(?=\n|Sub[\s-]?Caste|Date|Issued)/i
    ];

    for (const pattern of castePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.caste = match[1].trim().toUpperCase();
        break;
      }
    }

    // Extract sub-caste
    const subCastePatterns = [
      /(?:Sub[\s-]?Caste|उप[\s-]?जाति)\s*:?\s*([A-Za-z\s]{3,50}?)(?=\n|Date|Issued|District)/i
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
   * Extracts address components (village, taluka, district, state)
   */
  private static extractAddressComponents(lines: string[], fullText: string): {
    address?: string;
    village?: string;
    taluka?: string;
    district?: string;
    state?: string;
  } {
    const result: any = {};

    // Extract Village
    const villagePatterns = [
      /(?:Village|गांव|गाव)\s*:?\s*([A-Za-z\s]{2,50}?)(?=\n|Taluka|District|,)/i
    ];
    for (const pattern of villagePatterns) {
      const match = fullText.match(pattern);
      if (match) {
        result.village = match[1].trim();
        break;
      }
    }

    // Extract Taluka/Tehsil
    const talukaPatterns = [
      /(?:Taluka|Tehsil|Tal|Teh|तालुका|तहसील)\s*:?\s*([A-Za-z\s]{2,50}?)(?=\n|District|,)/i
    ];
    for (const pattern of talukaPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        result.taluka = match[1].trim();
        break;
      }
    }

    // Extract District
    const districtPatterns = [
      /(?:District|Dist|जिला)\s*:?\s*([A-Za-z\s]{2,50}?)(?=\n|State|,|\.)/i
    ];
    for (const pattern of districtPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        result.district = match[1].trim();
        break;
      }
    }

    // Extract State
    const statePatterns = [
      /(?:State|राज्य)\s*:?\s*([A-Za-z\s]{2,50}?)(?=\n|,|\.)/i,
      /\b(Maharashtra|Gujarat|Rajasthan|Karnataka|Tamil Nadu|Kerala|Punjab|Haryana|Uttar Pradesh|Madhya Pradesh|Bihar|West Bengal|Andhra Pradesh|Telangana|Odisha|Jharkhand|Chhattisgarh|Assam|Himachal Pradesh|Uttarakhand|Goa|Jammu and Kashmir|Delhi|Puducherry)\b/i
    ];
    for (const pattern of statePatterns) {
      const match = fullText.match(pattern);
      if (match) {
        result.state = match[1].trim();
        break;
      }
    }

    // Extract full address
    const addressPatterns = [
      /(?:Address|पता|Residence)\s*:?\s*(.{10,200}?)(?=\n\n|Village|District)/is
    ];
    for (const pattern of addressPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        result.address = match[1].trim().replace(/\s+/g, ' ');
        break;
      }
    }

    return result;
  }

  /**
   * Extracts issuing authority
   */
  private static extractIssuingAuthority(text: string): string | null {
    const patterns = [
      /(?:Issued by|Authority|जारीकर्ता)\s*:?\s*([A-Za-z\s,.-]{5,100}?)(?=\n\n|Date|Signature)/i,
      /(Tehsildar|SDM|Sub Divisional Magistrate|District Collector|Mamlatdar|Revenue Officer)/i
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
   * Extracts office address
   */
  private static extractOfficeAddress(text: string): string | null {
    const patterns = [
      /(?:Office|कार्यालय)\s*:?\s*(.{10,200}?)(?=\n\n|Date|Signature)/is
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
   * Extracts issue date
   */
  private static extractIssueDate(text: string): string | null {
    const patterns = [
      /(?:Issue Date|Date of Issue|Issued on|दिनांक)\s*:?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i,
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
   * Extracts valid until date (for temporary certificates)
   */
  private static extractValidUntil(text: string): string | null {
    const patterns = [
      /(?:Valid till|Valid upto|Valid until|Validity)\s*:?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i
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
   * Extracts purpose
   */
  private static extractPurpose(text: string): string | null {
    const patterns = [
      /(?:Purpose|उद्देश)\s*:?\s*(Education|Employment|Scholarship|Other|[\w\s]{5,50}?)(?=\n|Date)/i
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
   * Checks if signature is present
   */
  private static hasSignature(text: string): boolean {
    const signatureKeywords = [
      'SIGNATURE', 'SIGNED', 'हस्ताक्षर',
      'AUTHORIZED SIGNATORY', 'SIGN'
    ];

    const upperText = text.toUpperCase();
    return signatureKeywords.some(keyword => upperText.includes(keyword));
  }

  /**
   * Checks if seal/stamp is present
   */
  private static hasSeal(text: string): boolean {
    const sealKeywords = [
      'SEAL', 'STAMP', 'मुहर', 'मोहर',
      'OFFICE SEAL', 'OFFICIAL STAMP'
    ];

    const upperText = text.toUpperCase();
    return sealKeywords.some(keyword => upperText.includes(keyword));
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
