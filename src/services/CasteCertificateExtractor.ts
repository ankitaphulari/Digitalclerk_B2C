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
