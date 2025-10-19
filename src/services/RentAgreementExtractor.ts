// FILE 23: RentAgreementExtractor.ts (25 fields)
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface RentAgreementExtractionResult {
  agreementNumber?: string;
  agreementDate?: string;
  registrationDate?: string;
  lessorName?: string;
  lessorAddress?: string;
  lessorPan?: string;
  lesseeName?: string;
  lesseeAddress?: string;
  lesseePan?: string;
  propertyAddress?: string;
  propertyType?: string;
  carpetArea?: string;
  monthlyRent?: string;
  securityDeposit?: string;
  maintenanceCharges?: string;
  agreementPeriod?: string;
  startDate?: string;
  endDate?: string;
  lockInPeriod?: string;
  rentEscalation?: string;
  noticePeriod?: string;
  electricityBill?: string;
  waterBill?: string;
  witnessNames?: string[];
  notaryDetails?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class RentAgreementExtractor {
  private static readonly HEADER_BLACKLIST = [
    'RENT AGREEMENT',
    'RENTAL AGREEMENT',
    'LEASE AGREEMENT',
    'LEAVE AND LICENSE AGREEMENT'
  ];

  static extractFromRentAgreement(ocrText: string): RentAgreementExtractionResult {
    const result: RentAgreementExtractionResult = {
      confidence: 0,
      extractedFields: {},
      witnessNames: []
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Rent Agreement - Processing');

    // Agreement Number
    const agreementNoMatch = ocrText.match(/(?:Agreement No|Agreement Number|Document No)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (agreementNoMatch) {
      result.agreementNumber = agreementNoMatch[1];
      result.extractedFields.agreementNumber = result.agreementNumber;
      result.confidence += 8;
      console.log('✅ Agreement Number:', result.agreementNumber);
    }

    // Agreement Date
    const agreementDateMatch = ocrText.match(/(?:Agreement Date|Date of Agreement|Executed on)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (agreementDateMatch) {
      result.agreementDate = agreementDateMatch[1];
      result.extractedFields.agreementDate = result.agreementDate;
      result.confidence += 6;
      console.log('✅ Agreement Date:', result.agreementDate);
    }

    // Registration Date
    const registrationMatch = ocrText.match(/(?:Registration Date|Registered on|Date of Registration)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (registrationMatch) {
      result.registrationDate = registrationMatch[1];
      result.extractedFields.registrationDate = result.registrationDate;
      result.confidence += 5;
      console.log('✅ Registration Date:', result.registrationDate);
    }

    // Lessor Name (Landlord/Owner)
    const lessorMatch = ocrText.match(/(?:Lessor|Landlord|Owner|First Party)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|S\/o|D\/o|W\/o|residing|address)/i);
    if (lessorMatch) {
      result.lessorName = formatNameForDisplay(lessorMatch[1]);
      result.extractedFields.lessorName = result.lessorName;
      result.confidence += 10;
      console.log('✅ Lessor Name:', result.lessorName);
    }

    // Lessor Address
    const lessorAddressMatch = ocrText.match(/(?:Lessor Address|Landlord Address|residing at)\s*:?\s*(.+?)(?=\n\n|PAN|Lessee|Second Party|$)/is);
    if (lessorAddressMatch) {
      result.lessorAddress = lessorAddressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.lessorAddress = result.lessorAddress;
      result.confidence += 5;
      console.log('✅ Lessor Address:', result.lessorAddress.substring(0, 50) + '...');
    }

    // Lessor PAN
    const lessorPanMatch = ocrText.match(/(?:Lessor PAN|Landlord PAN|Owner PAN)\s*:?\s*([A-Z]{5}\d{4}[A-Z])/i);
    if (lessorPanMatch) {
      result.lessorPan = lessorPanMatch[1];
      result.extractedFields.lessorPan = result.lessorPan;
      result.confidence += 5;
      console.log('✅ Lessor PAN:', result.lessorPan);
    }

    // Lessee Name (Tenant)
    const lesseeMatch = ocrText.match(/(?:Lessee|Tenant|Second Party)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|S\/o|D\/o|W\/o|residing|address)/i);
    if (lesseeMatch) {
      result.lesseeName = formatNameForDisplay(lesseeMatch[1]);
      result.extractedFields.lesseeName = result.lesseeName;
      result.confidence += 10;
      console.log('✅ Lessee Name:', result.lesseeName);
    }

    // Lessee Address
    const lesseeAddressMatch = ocrText.match(/(?:Lessee Address|Tenant Address)\s*:?\s*(.+?)(?=\n\n|PAN|Property|$)/is);
    if (lesseeAddressMatch) {
      result.lesseeAddress = lesseeAddressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.lesseeAddress = result.lesseeAddress;
      result.confidence += 5;
      console.log('✅ Lessee Address:', result.lesseeAddress.substring(0, 50) + '...');
    }

    // Lessee PAN
    const lesseePanMatch = ocrText.match(/(?:Lessee PAN|Tenant PAN)\s*:?\s*([A-Z]{5}\d{4}[A-Z])/i);
    if (lesseePanMatch) {
      result.lesseePan = lesseePanMatch[1];
      result.extractedFields.lesseePan = result.lesseePan;
      result.confidence += 5;
      console.log('✅ Lessee PAN:', result.lesseePan);
    }

    // Property Address
    const propertyMatch = ocrText.match(/(?:Property Address|Premises|Demised Premises|Rental Property)\s*:?\s*(.+?)(?=\n\n|Property Type|Carpet|Monthly|$)/is);
    if (propertyMatch) {
      result.propertyAddress = propertyMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.propertyAddress = result.propertyAddress;
      result.confidence += 8;
      console.log('✅ Property Address:', result.propertyAddress.substring(0, 50) + '...');
    }

    // Property Type
    const typeMatch = ocrText.match(/(?:Property Type|Type of Property)\s*:?\s*(Apartment|Flat|House|Villa|Office|Shop|Commercial)/i);
    if (typeMatch) {
      result.propertyType = typeMatch[1];
      result.extractedFields.propertyType = result.propertyType;
      result.confidence += 4;
      console.log('✅ Property Type:', result.propertyType);
    }

    // Carpet Area
    const areaMatch = ocrText.match(/(?:Carpet Area|Area|Built[- ]?up Area)\s*:?\s*([\d,]+\.?\d*)\s*(?:sq\.? ?ft|sq\.? ?m|sqft|sqm)?/i);
    if (areaMatch) {
      result.carpetArea = areaMatch[1].replace(/,/g, '');
      result.extractedFields.carpetArea = result.carpetArea;
      result.confidence += 4;
      console.log('✅ Carpet Area:', result.carpetArea);
    }

    // Monthly Rent
    const rentMatch = ocrText.match(/(?:Monthly Rent|Rent per Month|Rental Amount)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (rentMatch) {
      result.monthlyRent = rentMatch[1].replace(/,/g, '');
      result.extractedFields.monthlyRent = result.monthlyRent;
      result.confidence += 8;
      console.log('✅ Monthly Rent:', result.monthlyRent);
    }

    // Security Deposit
    const depositMatch = ocrText.match(/(?:Security Deposit|Deposit|Advance|Refundable Deposit)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (depositMatch) {
      result.securityDeposit = depositMatch[1].replace(/,/g, '');
      result.extractedFields.securityDeposit = result.securityDeposit;
      result.confidence += 7;
      console.log('✅ Security Deposit:', result.securityDeposit);
    }

    // Maintenance Charges
    const maintenanceMatch = ocrText.match(/(?:Maintenance Charges?|Maintenance Fee)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (maintenanceMatch) {
      result.maintenanceCharges = maintenanceMatch[1].replace(/,/g, '');
      result.extractedFields.maintenanceCharges = result.maintenanceCharges;
      result.confidence += 4;
      console.log('✅ Maintenance Charges:', result.maintenanceCharges);
    }

    // Agreement Period (e.g., 11 months, 1 year)
    const periodMatch = ocrText.match(/(?:Agreement Period|Lease Period|Term)\s*:?\s*(\d{1,2}\s*(?:months?|years?))/i);
    if (periodMatch) {
      result.agreementPeriod = periodMatch[1];
      result.extractedFields.agreementPeriod = result.agreementPeriod;
      result.confidence += 5;
      console.log('✅ Agreement Period:', result.agreementPeriod);
    }

    // Start Date
    const startMatch = ocrText.match(/(?:Start Date|Commencement Date|From Date|Effective from)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (startMatch) {
      result.startDate = startMatch[1];
      result.extractedFields.startDate = result.startDate;
      result.confidence += 6;
      console.log('✅ Start Date:', result.startDate);
    }

    // End Date
    const endMatch = ocrText.match(/(?:End Date|Expiry Date|Till Date|Valid till)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (endMatch) {
      result.endDate = endMatch[1];
      result.extractedFields.endDate = result.endDate;
      result.confidence += 6;
      console.log('✅ End Date:', result.endDate);
    }

    // Lock-in Period
    const lockInMatch = ocrText.match(/(?:Lock[- ]?in Period|Lock in)\s*:?\s*(\d{1,2}\s*(?:months?|years?))/i);
    if (lockInMatch) {
      result.lockInPeriod = lockInMatch[1];
      result.extractedFields.lockInPeriod = result.lockInPeriod;
      result.confidence += 4;
      console.log('✅ Lock-in Period:', result.lockInPeriod);
    }

    // Rent Escalation
    const escalationMatch = ocrText.match(/(?:Rent Escalation|Escalation|Annual Increase)\s*:?\s*(\d{1,2})\s*%/i);
    if (escalationMatch) {
      result.rentEscalation = escalationMatch[1] + '%';
      result.extractedFields.rentEscalation = result.rentEscalation;
      result.confidence += 4;
      console.log('✅ Rent Escalation:', result.rentEscalation);
    }

    // Notice Period
    const noticeMatch = ocrText.match(/(?:Notice Period|Termination Notice)\s*:?\s*(\d{1,3}\s*(?:days?|months?))/i);
    if (noticeMatch) {
      result.noticePeriod = noticeMatch[1];
      result.extractedFields.noticePeriod = result.noticePeriod;
      result.confidence += 4;
      console.log('✅ Notice Period:', result.noticePeriod);
    }

    // Electricity Bill
    const electricityMatch = ocrText.match(/(?:Electricity Bill|Electric Charges?)\s*:?\s*(Included|Excluded|Paid by Lessee|Paid by Lessor)/i);
    if (electricityMatch) {
      result.electricityBill = electricityMatch[1];
      result.extractedFields.electricityBill = result.electricityBill;
      result.confidence += 3;
      console.log('✅ Electricity Bill:', result.electricityBill);
    }

    // Water Bill
    const waterMatch = ocrText.match(/(?:Water Bill|Water Charges?)\s*:?\s*(Included|Excluded|Paid by Lessee|Paid by Lessor)/i);
    if (waterMatch) {
      result.waterBill = waterMatch[1];
      result.extractedFields.waterBill = result.waterBill;
      result.confidence += 3;
      console.log('✅ Water Bill:', result.waterBill);
    }

    // Witness Names
    const witnessPattern = /(?:Witness|Witnesses?)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Signature|Notary)/gi;
    let witnessMatch;
    while ((witnessMatch = witnessPattern.exec(ocrText)) !== null) {
      const witnessName = formatNameForDisplay(witnessMatch[1]);
      if (!result.witnessNames!.includes(witnessName)) {
        result.witnessNames!.push(witnessName);
      }
    }
    if (result.witnessNames!.length > 0) {
      result.extractedFields.witnessNames = result.witnessNames;
      result.confidence += 3;
      console.log('✅ Witness Names:', result.witnessNames!.join(', '));
    }

    // Notary Details
    const notaryMatch = ocrText.match(/(?:Notary|Notarized by|Notary Public)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|Registration|$)/i);
    if (notaryMatch) {
      result.notaryDetails = notaryMatch[1].trim();
      result.extractedFields.notaryDetails = result.notaryDetails;
      result.confidence += 3;
      console.log('✅ Notary Details:', result.notaryDetails);
    }

    console.log('📊 Rent Agreement extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
