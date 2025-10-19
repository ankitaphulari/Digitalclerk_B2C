// FILE 28: DomicileCertificateExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface DomicileCertificateExtractionResult {
  certificateNumber?: string;
  name?: string;
  fathersName?: string;
  husbandsName?: string;
  dob?: string;
  age?: string;
  gender?: string;
  address?: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  durationOfResidence?: string;
  placeOfBirth?: string;
  nativePlace?: string;
  issuingAuthority?: string;
  issueDate?: string;
  purpose?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class DomicileCertificateExtractor {
  private static readonly HEADER_BLACKLIST = [
    'DOMICILE CERTIFICATE',
    'RESIDENCE CERTIFICATE',
    'CERTIFICATE OF RESIDENCE',
    'BONAFIDE CERTIFICATE'
  ];

  static extractFromDomicileCertificate(ocrText: string): DomicileCertificateExtractionResult {
    const result: DomicileCertificateExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Domicile Certificate - Processing');

    // Certificate Number
    const certNoMatch = ocrText.match(/(?:Certificate No|Certificate Number|Cert\.? No|Reference No)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (certNoMatch) {
      result.certificateNumber = certNoMatch[1];
      result.extractedFields.certificateNumber = result.certificateNumber;
      result.confidence += 10;
      console.log('✅ Certificate Number:', result.certificateNumber);
    }

    // Name
    const nameMatch = ocrText.match(/(?:This is to certify that|Name|Shri|Smt\.|Kumari|Mr\.|Ms\.|Mrs\.)\s*([A-Z][A-Z\s]+?)(?=\n|S\/o|D\/o|W\/o|son of|daughter of|wife of|aged)/i);
    if (nameMatch) {
      result.name = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.name = result.name;
      result.confidence += 12;
      console.log('✅ Name:', result.name);
    }

    // Father's Name
    const fatherMatch = ocrText.match(/(?:S\/o|son of|Father'?s? Name)\s*(?:Shri|Mr\.)?\s*([A-Z][A-Z\s]+?)(?=\n|resident|residing|Village|Age|DOB|is a)/i);
    if (fatherMatch) {
      result.fathersName = formatNameForDisplay(fatherMatch[1]);
      result.extractedFields.fathersName = result.fathersName;
      result.confidence += 10;
      console.log('✅ Father\'s Name:', result.fathersName);
    }

    // Husband's Name
    const husbandMatch = ocrText.match(/(?:W\/o|wife of|Husband'?s? Name)\s*(?:Shri|Mr\.)?\s*([A-Z][A-Z\s]+?)(?=\n|resident|residing|Village|Age|DOB|is a)/i);
    if (husbandMatch) {
      result.husbandsName = formatNameForDisplay(husbandMatch[1]);
      result.extractedFields.husbandsName = result.husbandsName;
      result.confidence += 10;
      console.log('✅ Husband\'s Name:', result.husbandsName);
    }

    // DOB
    const dobMatch = ocrText.match(/(?:DOB|Date of Birth|D\.O\.B|born on)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (dobMatch) {
      result.dob = dobMatch[1];
      result.extractedFields.dob = result.dob;
      result.confidence += 8;
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

    // Gender
    const genderMatch = ocrText.match(/(?:Gender|Sex)\s*:?\s*(Male|Female|M|F|Transgender)/i);
    if (genderMatch) {
      result.gender = genderMatch[1];
      result.extractedFields.gender = result.gender;
      result.confidence += 5;
      console.log('✅ Gender:', result.gender);
    }

    // Address
    const addressMatch = ocrText.match(/(?:residing at|resident of|Address|Permanent Address|Residential Address)\s*:?\s*(.+?)(?=\n\n|Village|Taluka|District|Tehsil|is a|$)/is);
    if (addressMatch) {
      result.address = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.address = result.address;
      result.confidence += 8;
      console.log('✅ Address:', result.address.substring(0, 50) + '...');
    }

    // Village
    const villageMatch = ocrText.match(/(?:Village|Gram|Village\/Town)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|Taluka|Tehsil|District)/i);
    if (villageMatch) {
      result.village = villageMatch[1].trim();
      result.extractedFields.village = result.village;
      result.confidence += 6;
      console.log('✅ Village:', result.village);
    }

    // Taluka/Tehsil
    const talukaMatch = ocrText.match(/(?:Taluka|Tehsil|Taluk|Block)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|District|State)/i);
    if (talukaMatch) {
      result.taluka = talukaMatch[1].trim();
      result.extractedFields.taluka = result.taluka;
      result.confidence += 6;
      console.log('✅ Taluka:', result.taluka);
    }

    // District
    const districtMatch = ocrText.match(/(?:District|Dist)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|State|for|is a)/i);
    if (districtMatch) {
      result.district = districtMatch[1].trim();
      result.extractedFields.district = result.district;
      result.confidence += 8;
      console.log('✅ District:', result.district);
    }

    // State
    const stateMatch = ocrText.match(/(?:State|Pradesh)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|for|is a|and|$)/i);
    if (stateMatch) {
      result.state = stateMatch[1].trim();
      result.extractedFields.state = result.state;
      result.confidence += 8;
      console.log('✅ State:', result.state);
    }

    // Duration of Residence
    const durationMatch = ocrText.match(/(?:residing|resident|living)\s+(?:for|since|from)\s+(?:past|last)?\s*(\d{1,3}\s*(?:years?|months?))/i);
    if (durationMatch) {
      result.durationOfResidence = durationMatch[1];
      result.extractedFields.durationOfResidence = result.durationOfResidence;
      result.confidence += 8;
      console.log('✅ Duration of Residence:', result.durationOfResidence);
    }

    // Place of Birth
    const birthPlaceMatch = ocrText.match(/(?:Place of Birth|Born at|Birth Place)\s*:?\s*([A-Z][A-Za-z\s,]+?)(?=\n|District|State|and)/i);
    if (birthPlaceMatch) {
      result.placeOfBirth = birthPlaceMatch[1].trim();
      result.extractedFields.placeOfBirth = result.placeOfBirth;
      result.confidence += 6;
      console.log('✅ Place of Birth:', result.placeOfBirth);
    }

    // Native Place
    const nativeMatch = ocrText.match(/(?:Native Place|Native of|Permanently resident of)\s*:?\s*([A-Z][A-Za-z\s,]+?)(?=\n|District|State|and|$)/i);
    if (nativeMatch) {
      result.nativePlace = nativeMatch[1].trim();
      result.extractedFields.nativePlace = result.nativePlace;
      result.confidence += 6;
      console.log('✅ Native Place:', result.nativePlace);
    }

    // Issuing Authority
    const authorityMatch = ocrText.match(/(?:Issued by|Issuing Authority|Authority|Tehsildar|Sub-Divisional Magistrate|SDM)\s*:?\s*([A-Z][A-Za-z\s,]+?)(?=\n|Date|Signature|$)/i);
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

    // Purpose
    const purposeMatch = ocrText.match(/(?:Purpose|for the purpose of|This certificate is issued for)\s*:?\s*([A-Z][A-Za-z\s,]+?)(?=\n|Date|Signature|$)/i);
    if (purposeMatch) {
      result.purpose = purposeMatch[1].trim();
      result.extractedFields.purpose = result.purpose;
      result.confidence += 5;
      console.log('✅ Purpose:', result.purpose);
    }

    console.log('📊 Domicile Certificate extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
