// FILE 29: RationCardExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface RationCardExtractionResult {
  rationCardNumber?: string;
  cardType?: string;
  headOfFamilyName?: string;
  address?: string;
  numberOfMembers?: string;
  familyMembers?: Array<{name: string, age?: string, gender?: string}>;
  issueDate?: string;
  validUntil?: string;
  fairPriceShop?: string;
  dealerCode?: string;
  taluka?: string;
  district?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class RationCardExtractor {
  private static readonly HEADER_BLACKLIST = [
    'RATION CARD',
    'FOOD SECURITY CARD',
    'PUBLIC DISTRIBUTION SYSTEM',
    'PDS CARD'
  ];

  static extractFromRationCard(ocrText: string): RationCardExtractionResult {
    const result: RationCardExtractionResult = {
      confidence: 0,
      extractedFields: {},
      familyMembers: []
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Ration Card - Processing');

    // Ration Card Number
    const cardNoMatch = ocrText.match(/(?:Ration Card No|Card No|Card Number|RC No)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (cardNoMatch) {
      result.rationCardNumber = cardNoMatch[1];
      result.extractedFields.rationCardNumber = result.rationCardNumber;
      result.confidence += 15;
      console.log('✅ Ration Card Number:', result.rationCardNumber);
    }

    // Card Type (AAY, BPL, APL, etc.)
    const typeMatch = ocrText.match(/(?:Card Type|Category|Type)\s*:?\s*(AAY|BPL|APL|PHH|Antyodaya Anna Yojana|Below Poverty Line|Above Poverty Line|Priority Household)/i);
    if (typeMatch) {
      result.cardType = typeMatch[1];
      result.extractedFields.cardType = result.cardType;
      result.confidence += 10;
      console.log('✅ Card Type:', result.cardType);
    }

    // Head of Family Name
    const hofMatch = ocrText.match(/(?:Head of Family|HOF|Family Head|Name of Head)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Address|S\/o|D\/o|W\/o)/i);
    if (hofMatch) {
      result.headOfFamilyName = formatNameForDisplay(hofMatch[1]);
      result.extractedFields.headOfFamilyName = result.headOfFamilyName;
      result.confidence += 12;
      console.log('✅ Head of Family:', result.headOfFamilyName);
    }

    // Address
    const addressMatch = ocrText.match(/(?:Address|Residential Address)\s*:?\s*(.+?)(?=\n\n|Fair Price|FPS|Dealer|Taluka|District|No\. of Members|$)/is);
    if (addressMatch) {
      result.address = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.address = result.address;
      result.confidence += 8;
      console.log('✅ Address:', result.address.substring(0, 50) + '...');
    }

    // Number of Members
    const membersCountMatch = ocrText.match(/(?:No\.? of Members|Number of Members|Total Members|Family Size)\s*:?\s*(\d{1,2})/i);
    if (membersCountMatch) {
      result.numberOfMembers = membersCountMatch[1];
      result.extractedFields.numberOfMembers = result.numberOfMembers;
      result.confidence += 8;
      console.log('✅ Number of Members:', result.numberOfMembers);
    }

    // Family Members - Extract in a structured way
    // Pattern 1: Name, Age, Gender format
    const memberPattern1 = /(?:Member|Name)\s*\d*\s*:?\s*([A-Z][A-Za-z\s]+?)\s*(?:Age|Yrs?)\s*:?\s*(\d{1,3})\s*(?:Gender|Sex)?\s*:?\s*(M|F|Male|Female)?/gi;
    let memberMatch1;
    while ((memberMatch1 = memberPattern1.exec(ocrText)) !== null) {
      const member = {
        name: formatNameForDisplay(memberMatch1[1]),
        age: memberMatch1[2],
        gender: memberMatch1[3]
      };
      if (member.name.length > 2) {
        result.familyMembers!.push(member);
      }
    }

    // Pattern 2: Simple name list
    if (result.familyMembers!.length === 0) {
      const memberPattern2 = /(?:Member|Name)\s*\d+\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Member|Age|\d)/gi;
      let memberMatch2;
      while ((memberMatch2 = memberPattern2.exec(ocrText)) !== null) {
        const name = formatNameForDisplay(memberMatch2[1]);
        if (name.length > 2 && !result.familyMembers!.some(m => m.name === name)) {
          result.familyMembers!.push({ name });
        }
      }
    }

    if (result.familyMembers!.length > 0) {
      result.extractedFields.familyMembers = result.familyMembers;
      result.confidence += 8;
      console.log('✅ Family Members:', result.familyMembers!.length + ' members extracted');
    }

    // Issue Date
    const issueDateMatch = ocrText.match(/(?:Issue Date|Date of Issue|Issued on)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (issueDateMatch) {
      result.issueDate = issueDateMatch[1];
      result.extractedFields.issueDate = result.issueDate;
      result.confidence += 5;
      console.log('✅ Issue Date:', result.issueDate);
    }

    // Valid Until
    const validMatch = ocrText.match(/(?:Valid Until|Valid Till|Validity|Valid Upto)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (validMatch) {
      result.validUntil = validMatch[1];
      result.extractedFields.validUntil = result.validUntil;
      result.confidence += 5;
      console.log('✅ Valid Until:', result.validUntil);
    }

    // Fair Price Shop
    const fpsMatch = ocrText.match(/(?:Fair Price Shop|FPS|Ration Shop)\s*:?\s*([A-Z][A-Za-z0-9\s,&.]+?)(?=\n|Dealer|Taluka|District|$)/i);
    if (fpsMatch) {
      result.fairPriceShop = fpsMatch[1].trim();
      result.extractedFields.fairPriceShop = result.fairPriceShop;
      result.confidence += 6;
      console.log('✅ Fair Price Shop:', result.fairPriceShop);
    }

    // Dealer Code
    const dealerMatch = ocrText.match(/(?:Dealer Code|Shop Code|FPS Code)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (dealerMatch) {
      result.dealerCode = dealerMatch[1];
      result.extractedFields.dealerCode = result.dealerCode;
      result.confidence += 5;
      console.log('✅ Dealer Code:', result.dealerCode);
    }

    // Taluka
    const talukaMatch = ocrText.match(/(?:Taluka|Tehsil|Taluk|Block)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|District|State)/i);
    if (talukaMatch) {
      result.taluka = talukaMatch[1].trim();
      result.extractedFields.taluka = result.taluka;
      result.confidence += 5;
      console.log('✅ Taluka:', result.taluka);
    }

    // District
    const districtMatch = ocrText.match(/(?:District|Dist)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|State|Card|$)/i);
    if (districtMatch) {
      result.district = districtMatch[1].trim();
      result.extractedFields.district = result.district;
      result.confidence += 6;
      console.log('✅ District:', result.district);
    }

    console.log('📊 Ration Card extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
