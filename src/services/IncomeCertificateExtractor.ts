// FILE 27: IncomeCertificateExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface IncomeCertificateExtractionResult {
  certificateNumber?: string;
  name?: string;
  fathersName?: string;
  husbandsName?: string;
  dob?: string;
  age?: string;
  occupation?: string;
  annualIncome?: string;
  incomeSource?: string;
  address?: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  financialYear?: string;
  issuingAuthority?: string;
  issueDate?: string;
  validUntil?: string;
  purpose?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class IncomeCertificateExtractor {
  private static readonly HEADER_BLACKLIST = [
    'INCOME CERTIFICATE',
    'CERTIFICATE OF INCOME',
    'ANNUAL INCOME CERTIFICATE'
  ];

  static extractFromIncomeCertificate(ocrText: string): IncomeCertificateExtractionResult {
    const result: IncomeCertificateExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Income Certificate - Processing');

    // Certificate Number
    const certNoMatch = ocrText.match(/(?:Certificate No|Certificate Number|Cert\.? No|Reference No)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (certNoMatch) {
      result.certificateNumber = certNoMatch[1];
      result.extractedFields.certificateNumber = result.certificateNumber;
      result.confidence += 10;
      console.log('✅ Certificate Number:', result.certificateNumber);
    }

    // Name
    const nameMatch = ocrText.match(/(?:This is to certify that|Name|Shri|Smt\.|Kumari)\s*([A-Z][A-Z\s]+?)(?=\n|S\/o|D\/o|W\/o|son of|daughter of|wife of)/i);
    if (nameMatch) {
      result.name = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.name = result.name;
      result.confidence += 12;
      console.log('✅ Name:', result.name);
    }

    // Father's Name
    const fatherMatch = ocrText.match(/(?:S\/o|son of|Father'?s? Name)\s*(?:Shri)?\s*([A-Z][A-Z\s]+?)(?=\n|resident|residing|Village|Age|DOB)/i);
    if (fatherMatch) {
      result.fathersName = formatNameForDisplay(fatherMatch[1]);
      result.extractedFields.fathersName = result.fathersName;
      result.confidence += 10;
      console.log('✅ Father\'s Name:', result.fathersName);
    }

    // Husband's Name
    const husbandMatch = ocrText.match(/(?:W\/o|wife of|Husband'?s? Name)\s*(?:Shri)?\s*([A-Z][A-Z\s]+?)(?=\n|resident|residing|Village|Age|DOB)/i);
    if (husbandMatch) {
      result.husbandsName = formatNameForDisplay(husbandMatch[1]);
      result.extractedFields.husbandsName = result.husbandsName;
      result.confidence += 10;
      console.log('✅ Husband\'s Name:', result.husbandsName);
    }

    // DOB
    const dobMatch = ocrText.match(/(?:DOB|Date of Birth|D\.O\.B)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (dobMatch) {
      result.dob = dobMatch[1];
      result.extractedFields.dob = result.dob;
      result.confidence += 6;
      console.log('✅ DOB:', result.dob);
    }

    // Age
    const ageMatch = ocrText.match(/(?:Age|Aged)\s*:?\s*(\d{1,3})\s*(?:years?|yrs?)/i);
    if (ageMatch) {
      result.age = ageMatch[1];
      result.extractedFields.age = result.age;
      result.confidence += 5;
      console.log('✅ Age:', result.age);
    }

    // Occupation
    const occupationMatch = ocrText.match(/(?:Occupation|Profession|Employment)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|Annual|Income|residing)/i);
    if (occupationMatch) {
      result.occupation = occupationMatch[1].trim();
      result.extractedFields.occupation = result.occupation;
      result.confidence += 6;
      console.log('✅ Occupation:', result.occupation);
    }

    // Annual Income
    const incomeMatch = ocrText.match(/(?:Annual Income|Total Annual Income|Income|Yearly Income)\s*(?:is|of)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (incomeMatch) {
      result.annualIncome = incomeMatch[1].replace(/,/g, '');
      result.extractedFields.annualIncome = result.annualIncome;
      result.confidence += 15;
      console.log('✅ Annual Income:', result.annualIncome);
    }

    // Income Source
    const sourceMatch = ocrText.match(/(?:Source of Income|Income from|Income Source)\s*:?\s*([A-Z][A-Za-z\s,&]+?)(?=\n|for|This|Certificate)/i);
    if (sourceMatch) {
      result.incomeSource = sourceMatch[1].trim();
      result.extractedFields.incomeSource = result.incomeSource;
      result.confidence += 6;
      console.log('✅ Income Source:', result.incomeSource);
    }

    // Address
    const addressMatch = ocrText.match(/(?:residing at|resident of|Address|Permanent Address)\s*:?\s*(.+?)(?=\n\n|Village|Taluka|District|Tehsil|$)/is);
    if (addressMatch) {
      result.address = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.address = result.address;
      result.confidence += 6;
      console.log('✅ Address:', result.address.substring(0, 50) + '...');
    }

    // Village
    const villageMatch = ocrText.match(/(?:Village|Gram|Village\/Town)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|Taluka|Tehsil|District)/i);
    if (villageMatch) {
      result.village = villageMatch[1].trim();
      result.extractedFields.village = result.village;
      result.confidence += 5;
      console.log('✅ Village:', result.village);
    }

    // Taluka/Tehsil
    const talukaMatch = ocrText.match(/(?:Taluka|Tehsil|Taluk|Block)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|District|State)/i);
    if (talukaMatch) {
      result.taluka = talukaMatch[1].trim();
      result.extractedFields.taluka = result.taluka;
      result.confidence += 5;
      console.log('✅ Taluka:', result.taluka);
    }

    // District
    const districtMatch = ocrText.match(/(?:District|Dist)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|State|for)/i);
    if (districtMatch) {
      result.district = districtMatch[1].trim();
      result.extractedFields.district = result.district;
      result.confidence += 6;
      console.log('✅ District:', result.district);
    }

    // State
    const stateMatch = ocrText.match(/(?:State|Pradesh)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|for|This|$)/i);
    if (stateMatch) {
      result.state = stateMatch[1].trim();
      result.extractedFields.state = result.state;
      result.confidence += 5;
      console.log('✅ State:', result.state);
    }

    // Financial Year
    const fyMatch = ocrText.match(/(?:Financial Year|FY|for the year)\s*:?\s*(\d{4}[-\/]\d{2,4})/i);
    if (fyMatch) {
      result.financialYear = fyMatch[1];
      result.extractedFields.financialYear = result.financialYear;
      result.confidence += 6;
      console.log('✅ Financial Year:', result.financialYear);
    }

    // Issuing Authority
    const authorityMatch = ocrText.match(/(?:Issued by|Issuing Authority|Authority)\s*:?\s*([A-Z][A-Za-z\s,]+?)(?=\n|Date|Signature|$)/i);
    if (authorityMatch) {
      result.issuingAuthority = authorityMatch[1].trim();
      result.extractedFields.issuingAuthority = result.issuingAuthority;
      result.confidence += 6;
      console.log('✅ Issuing Authority:', result.issuingAuthority);
    }

    // Issue Date
    const issueDateMatch = ocrText.match(/(?:Date|Date of Issue|Issued on|Issue Date)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (issueDateMatch) {
      result.issueDate = issueDateMatch[1];
      result.extractedFields.issueDate = result.issueDate;
      result.confidence += 6;
      console.log('✅ Issue Date:', result.issueDate);
    }

    // Valid Until
    const validMatch = ocrText.match(/(?:Valid Until|Valid Till|Validity)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (validMatch) {
      result.validUntil = validMatch[1];
      result.extractedFields.validUntil = result.validUntil;
      result.confidence += 5;
      console.log('✅ Valid Until:', result.validUntil);
    }

    // Purpose
    const purposeMatch = ocrText.match(/(?:Purpose|for the purpose of|This certificate is issued for)\s*:?\s*([A-Z][A-Za-z\s,]+?)(?=\n|Date|Signature|$)/i);
    if (purposeMatch) {
      result.purpose = purposeMatch[1].trim();
      result.extractedFields.purpose = result.purpose;
      result.confidence += 5;
      console.log('✅ Purpose:', result.purpose);
    }

    console.log('📊 Income Certificate extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
