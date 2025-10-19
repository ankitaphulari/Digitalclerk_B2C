// FILE 24: AyushmanBharatExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface AyushmanBharatExtractionResult {
  beneficiaryId?: string;
  familyId?: string;
  beneficiaryName?: string;
  fathersHusbandsName?: string;
  dob?: string;
  age?: string;
  gender?: string;
  address?: string;
  village?: string;
  district?: string;
  state?: string;
  familyMembers?: string[];
  cardIssueDate?: string;
  schemeName?: string;
  eligibleAmount?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class AyushmanBharatExtractor {
  private static readonly HEADER_BLACKLIST = [
    'AYUSHMAN BHARAT',
    'PRADHAN MANTRI JAN AROGYA YOJANA',
    'PM-JAY',
    'GOLDEN CARD'
  ];

  static extractFromAyushmanBharat(ocrText: string): AyushmanBharatExtractionResult {
    const result: AyushmanBharatExtractionResult = {
      confidence: 0,
      extractedFields: {},
      familyMembers: []
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Ayushman Bharat - Processing');

    // Beneficiary ID
    const beneficiaryIdMatch = ocrText.match(/(?:Beneficiary ID|Beneficiary No|ID)\s*:?\s*(\d{10,20})/i);
    if (beneficiaryIdMatch) {
      result.beneficiaryId = beneficiaryIdMatch[1];
      result.extractedFields.beneficiaryId = result.beneficiaryId;
      result.confidence += 15;
      console.log('✅ Beneficiary ID:', result.beneficiaryId);
    }

    // Family ID
    const familyIdMatch = ocrText.match(/(?:Family ID|Family No|HHID)\s*:?\s*(\d{10,20})/i);
    if (familyIdMatch) {
      result.familyId = familyIdMatch[1];
      result.extractedFields.familyId = result.familyId;
      result.confidence += 12;
      console.log('✅ Family ID:', result.familyId);
    }

    // Beneficiary Name
    const nameMatch = ocrText.match(/(?:Beneficiary Name|Name|Beneficiary)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Father|Husband|DOB|Age)/i);
    if (nameMatch) {
      result.beneficiaryName = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.beneficiaryName = result.beneficiaryName;
      result.confidence += 12;
      console.log('✅ Beneficiary Name:', result.beneficiaryName);
    }

    // Father's/Husband's Name
    const fatherMatch = ocrText.match(/(?:Father'?s? Name|Husband'?s? Name|S\/o|W\/o|D\/o)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|DOB|Age|Gender)/i);
    if (fatherMatch) {
      result.fathersHusbandsName = formatNameForDisplay(fatherMatch[1]);
      result.extractedFields.fathersHusbandsName = result.fathersHusbandsName;
      result.confidence += 8;
      console.log('✅ Father/Husband Name:', result.fathersHusbandsName);
    }

    // DOB
    const dobMatch = ocrText.match(/(?:DOB|Date of Birth|D\.O\.B)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (dobMatch) {
      result.dob = dobMatch[1];
      result.extractedFields.dob = result.dob;
      result.confidence += 8;
      console.log('✅ DOB:', result.dob);
    }

    // Age
    const ageMatch = ocrText.match(/(?:Age|Yrs)\s*:?\s*(\d{1,3})/i);
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
    const addressMatch = ocrText.match(/(?:Address|Permanent Address)\s*:?\s*(.+?)(?=\n\n|Village|District|State|$)/is);
    if (addressMatch) {
      result.address = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.address = result.address;
      result.confidence += 6;
      console.log('✅ Address:', result.address.substring(0, 50) + '...');
    }

    // Village
    const villageMatch = ocrText.match(/(?:Village|Gram|Town)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|District|State)/i);
    if (villageMatch) {
      result.village = villageMatch[1].trim();
      result.extractedFields.village = result.village;
      result.confidence += 5;
      console.log('✅ Village:', result.village);
    }

    // District
    const districtMatch = ocrText.match(/(?:District|Dist)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|State|PIN)/i);
    if (districtMatch) {
      result.district = districtMatch[1].trim();
      result.extractedFields.district = result.district;
      result.confidence += 6;
      console.log('✅ District:', result.district);
    }

    // State
    const stateMatch = ocrText.match(/(?:State|Pradesh)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|PIN|Family|$)/i);
    if (stateMatch) {
      result.state = stateMatch[1].trim();
      result.extractedFields.state = result.state;
      result.confidence += 6;
      console.log('✅ State:', result.state);
    }

    // Family Members (extract multiple names)
    const familyMemberPattern = /(?:Family Member|Member)\s*\d*\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Member|Age|Gender)/gi;
    let memberMatch;
    while ((memberMatch = familyMemberPattern.exec(ocrText)) !== null) {
      const memberName = formatNameForDisplay(memberMatch[1]);
      if (memberName.length > 3 && !result.familyMembers!.includes(memberName)) {
        result.familyMembers!.push(memberName);
      }
    }
    if (result.familyMembers!.length > 0) {
      result.extractedFields.familyMembers = result.familyMembers;
      result.confidence += 5;
      console.log('✅ Family Members:', result.familyMembers!.join(', '));
    }

    // Card Issue Date
    const issueDateMatch = ocrText.match(/(?:Issue Date|Date of Issue|Issued on)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (issueDateMatch) {
      result.cardIssueDate = issueDateMatch[1];
      result.extractedFields.cardIssueDate = result.cardIssueDate;
      result.confidence += 5;
      console.log('✅ Card Issue Date:', result.cardIssueDate);
    }

    // Scheme Name
    const schemeMatch = ocrText.match(/(Ayushman Bharat|PM-JAY|Pradhan Mantri Jan Arogya Yojana|PMJAY)/i);
    if (schemeMatch) {
      result.schemeName = schemeMatch[1];
      result.extractedFields.schemeName = result.schemeName;
      result.confidence += 7;
      console.log('✅ Scheme Name:', result.schemeName);
    }

    // Eligible Amount (Coverage)
    const amountMatch = ocrText.match(/(?:Coverage|Eligible Amount|Sum Insured|Cover)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)\s*(?:lakh|lakhs)?/i);
    if (amountMatch) {
      result.eligibleAmount = amountMatch[1].replace(/,/g, '');
      result.extractedFields.eligibleAmount = result.eligibleAmount;
      result.confidence += 6;
      console.log('✅ Eligible Amount:', result.eligibleAmount);
    }

    console.log('📊 Ayushman Bharat extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
