// FILE 25: ABHACardExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface ABHACardExtractionResult {
  abhaNumber?: string;
  abhaAddress?: string;
  name?: string;
  dob?: string;
  gender?: string;
  mobile?: string;
  email?: string;
  address?: string;
  state?: string;
  district?: string;
  linkedAadhaar?: string;
  createdDate?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class ABHACardExtractor {
  private static readonly HEADER_BLACKLIST = [
    'ABHA CARD',
    'AYUSHMAN BHARAT HEALTH ACCOUNT',
    'HEALTH ID',
    'NATIONAL HEALTH ID'
  ];

  static extractFromABHACard(ocrText: string): ABHACardExtractionResult {
    const result: ABHACardExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 ABHA Card - Processing');

    // ABHA Number (14 digits)
    const abhaNumberMatch = ocrText.match(/(?:ABHA No|ABHA Number|Health ID No)\s*:?\s*(\d{2}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4})/i);
    if (abhaNumberMatch) {
      result.abhaNumber = abhaNumberMatch[1].replace(/[-\s]/g, '');
      result.extractedFields.abhaNumber = result.abhaNumber;
      result.confidence += 20;
      console.log('✅ ABHA Number:', result.abhaNumber);
    }

    // ABHA Address (username@abdm or similar)
    const abhaAddressMatch = ocrText.match(/(?:ABHA Address|Health ID|PHR Address)\s*:?\s*([a-zA-Z0-9._]+@[a-zA-Z0-9]+)/i);
    if (abhaAddressMatch) {
      result.abhaAddress = abhaAddressMatch[1];
      result.extractedFields.abhaAddress = result.abhaAddress;
      result.confidence += 15;
      console.log('✅ ABHA Address:', result.abhaAddress);
    }

    // Name
    const nameMatch = ocrText.match(/(?:Name|Full Name|Beneficiary Name)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|DOB|Date|Gender)/i);
    if (nameMatch) {
      result.name = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.name = result.name;
      result.confidence += 12;
      console.log('✅ Name:', result.name);
    }

    // DOB
    const dobMatch = ocrText.match(/(?:DOB|Date of Birth|D\.O\.B)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (dobMatch) {
      result.dob = dobMatch[1];
      result.extractedFields.dob = result.dob;
      result.confidence += 10;
      console.log('✅ DOB:', result.dob);
    }

    // Gender
    const genderMatch = ocrText.match(/(?:Gender|Sex)\s*:?\s*(Male|Female|M|F|Transgender|Other)/i);
    if (genderMatch) {
      result.gender = genderMatch[1];
      result.extractedFields.gender = result.gender;
      result.confidence += 8;
      console.log('✅ Gender:', result.gender);
    }

    // Mobile
    const mobileMatch = ocrText.match(/(?:Mobile|Mobile No|Phone|Contact)\s*:?\s*(\d{10})/i);
    if (mobileMatch) {
      result.mobile = mobileMatch[1];
      result.extractedFields.mobile = result.mobile;
      result.confidence += 8;
      console.log('✅ Mobile:', result.mobile);
    }

    // Email
    const emailMatch = ocrText.match(/(?:Email|E-mail)\s*:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) {
      result.email = emailMatch[1];
      result.extractedFields.email = result.email;
      result.confidence += 6;
      console.log('✅ Email:', result.email);
    }

    // Address
    const addressMatch = ocrText.match(/(?:Address|Residential Address)\s*:?\s*(.+?)(?=\n\n|State|District|Pincode|$)/is);
    if (addressMatch) {
      result.address = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.address = result.address;
      result.confidence += 6;
      console.log('✅ Address:', result.address.substring(0, 50) + '...');
    }

    // State
    const stateMatch = ocrText.match(/(?:State|Pradesh)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|District|PIN|Aadhaar)/i);
    if (stateMatch) {
      result.state = stateMatch[1].trim();
      result.extractedFields.state = result.state;
      result.confidence += 5;
      console.log('✅ State:', result.state);
    }

    // District
    const districtMatch = ocrText.match(/(?:District|Dist)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|State|PIN|Pincode)/i);
    if (districtMatch) {
      result.district = districtMatch[1].trim();
      result.extractedFields.district = result.district;
      result.confidence += 5;
      console.log('✅ District:', result.district);
    }

    // Linked Aadhaar (masked)
    const aadhaarMatch = ocrText.match(/(?:Linked Aadhaar|Aadhaar|Aadhaar No)\s*:?\s*(XXXX[-\s]?XXXX[-\s]?\d{4}|\d{4})/i);
    if (aadhaarMatch) {
      result.linkedAadhaar = aadhaarMatch[1];
      result.extractedFields.linkedAadhaar = result.linkedAadhaar;
      result.confidence += 5;
      console.log('✅ Linked Aadhaar:', result.linkedAadhaar);
    }

    // Created Date
    const createdMatch = ocrText.match(/(?:Created on|Created Date|Issue Date|Registration Date)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (createdMatch) {
      result.createdDate = createdMatch[1];
      result.extractedFields.createdDate = result.createdDate;
      result.confidence += 5;
      console.log('✅ Created Date:', result.createdDate);
    }

    console.log('📊 ABHA Card extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
