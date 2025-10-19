// FILE 22: PropertyTaxExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface PropertyTaxExtractionResult {
  propertyId?: string;
  assessmentNumber?: string;
  propertyOwnerName?: string;
  propertyAddress?: string;
  wardNumber?: string;
  zone?: string;
  propertyType?: string;
  propertyArea?: string;
  builtUpArea?: string;
  propertyValue?: string;
  taxAssessmentYear?: string;
  taxAmount?: string;
  waterTax?: string;
  drainageTax?: string;
  otherCharges?: string;
  totalAmount?: string;
  amountPaid?: string;
  paymentDate?: string;
  receiptNumber?: string;
  paymentMode?: string;
  municipalCorporation?: string;
  validFromTo?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class PropertyTaxExtractor {
  private static readonly HEADER_BLACKLIST = [
    'PROPERTY TAX',
    'MUNICIPAL PROPERTY TAX',
    'TAX RECEIPT',
    'PROPERTY TAX RECEIPT'
  ];

  static extractFromPropertyTax(ocrText: string): PropertyTaxExtractionResult {
    const result: PropertyTaxExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Property Tax - Processing');

    // Property ID
    const propertyIdMatch = ocrText.match(/(?:Property ID|Property No|Prop\.? ID)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (propertyIdMatch) {
      result.propertyId = propertyIdMatch[1];
      result.extractedFields.propertyId = result.propertyId;
      result.confidence += 12;
      console.log('✅ Property ID:', result.propertyId);
    }

    // Assessment Number
    const assessmentMatch = ocrText.match(/(?:Assessment No|Assessment Number|Assmt\.? No)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (assessmentMatch) {
      result.assessmentNumber = assessmentMatch[1];
      result.extractedFields.assessmentNumber = result.assessmentNumber;
      result.confidence += 10;
      console.log('✅ Assessment Number:', result.assessmentNumber);
    }

    // Property Owner Name
    const nameMatch = ocrText.match(/(?:Owner Name|Property Owner|Owner)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Address|Ward)/i);
    if (nameMatch) {
      result.propertyOwnerName = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.propertyOwnerName = result.propertyOwnerName;
      result.confidence += 10;
      console.log('✅ Property Owner Name:', result.propertyOwnerName);
    }

    // Property Address
    const addressMatch = ocrText.match(/(?:Property Address|Address|Site Address)\s*:?\s*(.+?)(?=\n\n|Ward|Zone|Property Type|$)/is);
    if (addressMatch) {
      result.propertyAddress = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.propertyAddress = result.propertyAddress;
      result.confidence += 8;
      console.log('✅ Property Address:', result.propertyAddress.substring(0, 50) + '...');
    }

    // Ward Number
    const wardMatch = ocrText.match(/(?:Ward No|Ward Number|Ward)\s*:?\s*([A-Z0-9\-]+)/i);
    if (wardMatch) {
      result.wardNumber = wardMatch[1];
      result.extractedFields.wardNumber = result.wardNumber;
      result.confidence += 5;
      console.log('✅ Ward Number:', result.wardNumber);
    }

    // Zone
    const zoneMatch = ocrText.match(/(?:Zone|Zone No)\s*:?\s*([A-Z0-9\-]+)/i);
    if (zoneMatch) {
      result.zone = zoneMatch[1];
      result.extractedFields.zone = result.zone;
      result.confidence += 4;
      console.log('✅ Zone:', result.zone);
    }

    // Property Type
    const typeMatch = ocrText.match(/(?:Property Type|Type|Usage)\s*:?\s*(Residential|Commercial|Industrial|Mixed|Vacant Land)/i);
    if (typeMatch) {
      result.propertyType = typeMatch[1];
      result.extractedFields.propertyType = result.propertyType;
      result.confidence += 5;
      console.log('✅ Property Type:', result.propertyType);
    }

    // Property Area (in sq ft or sq m)
    const areaMatch = ocrText.match(/(?:Property Area|Plot Area|Land Area)\s*:?\s*([\d,]+\.?\d*)\s*(?:sq\.? ?ft|sq\.? ?m|sqft|sqm)?/i);
    if (areaMatch) {
      result.propertyArea = areaMatch[1].replace(/,/g, '');
      result.extractedFields.propertyArea = result.propertyArea;
      result.confidence += 4;
      console.log('✅ Property Area:', result.propertyArea);
    }

    // Built-Up Area
    const builtUpMatch = ocrText.match(/(?:Built[- ]?Up Area|Covered Area|Construction Area)\s*:?\s*([\d,]+\.?\d*)\s*(?:sq\.? ?ft|sq\.? ?m|sqft|sqm)?/i);
    if (builtUpMatch) {
      result.builtUpArea = builtUpMatch[1].replace(/,/g, '');
      result.extractedFields.builtUpArea = result.builtUpArea;
      result.confidence += 4;
      console.log('✅ Built-Up Area:', result.builtUpArea);
    }

    // Property Value (Annual Rateable Value)
    const valueMatch = ocrText.match(/(?:Property Value|Annual Rateable Value|ARV|Rateable Value)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (valueMatch) {
      result.propertyValue = valueMatch[1].replace(/,/g, '');
      result.extractedFields.propertyValue = result.propertyValue;
      result.confidence += 5;
      console.log('✅ Property Value:', result.propertyValue);
    }

    // Tax Assessment Year
    const assessmentYearMatch = ocrText.match(/(?:Assessment Year|Tax Year|Financial Year|FY)\s*:?\s*(\d{4}[-\/]\d{2,4})/i);
    if (assessmentYearMatch) {
      result.taxAssessmentYear = assessmentYearMatch[1];
      result.extractedFields.taxAssessmentYear = result.taxAssessmentYear;
      result.confidence += 6;
      console.log('✅ Tax Assessment Year:', result.taxAssessmentYear);
    }

    // Tax Amount (Property Tax)
    const taxMatch = ocrText.match(/(?:Property Tax|General Tax|Tax Amount)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (taxMatch) {
      result.taxAmount = taxMatch[1].replace(/,/g, '');
      result.extractedFields.taxAmount = result.taxAmount;
      result.confidence += 6;
      console.log('✅ Tax Amount:', result.taxAmount);
    }

    // Water Tax
    const waterTaxMatch = ocrText.match(/(?:Water Tax|Water Charges?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (waterTaxMatch) {
      result.waterTax = waterTaxMatch[1].replace(/,/g, '');
      result.extractedFields.waterTax = result.waterTax;
      result.confidence += 4;
      console.log('✅ Water Tax:', result.waterTax);
    }

    // Drainage Tax
    const drainageTaxMatch = ocrText.match(/(?:Drainage Tax|Sewerage Tax|Sewer Charges?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (drainageTaxMatch) {
      result.drainageTax = drainageTaxMatch[1].replace(/,/g, '');
      result.extractedFields.drainageTax = result.drainageTax;
      result.confidence += 4;
      console.log('✅ Drainage Tax:', result.drainageTax);
    }

    // Other Charges
    const otherChargesMatch = ocrText.match(/(?:Other Charges?|Misc\.? Charges?|Additional Charges?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (otherChargesMatch) {
      result.otherCharges = otherChargesMatch[1].replace(/,/g, '');
      result.extractedFields.otherCharges = result.otherCharges;
      result.confidence += 3;
      console.log('✅ Other Charges:', result.otherCharges);
    }

    // Total Amount
    const totalMatch = ocrText.match(/(?:Total Amount|Total Tax|Total Payable|Net Amount)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (totalMatch) {
      result.totalAmount = totalMatch[1].replace(/,/g, '');
      result.extractedFields.totalAmount = result.totalAmount;
      result.confidence += 7;
      console.log('✅ Total Amount:', result.totalAmount);
    }

    // Amount Paid
    const paidMatch = ocrText.match(/(?:Amount Paid|Paid Amount|Payment)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (paidMatch) {
      result.amountPaid = paidMatch[1].replace(/,/g, '');
      result.extractedFields.amountPaid = result.amountPaid;
      result.confidence += 5;
      console.log('✅ Amount Paid:', result.amountPaid);
    }

    // Payment Date
    const paymentDateMatch = ocrText.match(/(?:Payment Date|Date of Payment|Paid On)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (paymentDateMatch) {
      result.paymentDate = paymentDateMatch[1];
      result.extractedFields.paymentDate = result.paymentDate;
      result.confidence += 5;
      console.log('✅ Payment Date:', result.paymentDate);
    }

    // Receipt Number
    const receiptMatch = ocrText.match(/(?:Receipt No|Receipt Number|Challan No|Transaction ID)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (receiptMatch) {
      result.receiptNumber = receiptMatch[1];
      result.extractedFields.receiptNumber = result.receiptNumber;
      result.confidence += 5;
      console.log('✅ Receipt Number:', result.receiptNumber);
    }

    // Payment Mode
    const paymentModeMatch = ocrText.match(/(?:Payment Mode|Mode of Payment)\s*:?\s*(Cash|Cheque|Online|Card|UPI|NEFT|RTGS)/i);
    if (paymentModeMatch) {
      result.paymentMode = paymentModeMatch[1];
      result.extractedFields.paymentMode = result.paymentMode;
      result.confidence += 3;
      console.log('✅ Payment Mode:', result.paymentMode);
    }

    // Municipal Corporation
    const corporationMatch = ocrText.match(/^([A-Z\s]+(?:Municipal Corporation|Nagar Nigam|Municipality|Mahanagar Palika))/im);
    if (corporationMatch) {
      result.municipalCorporation = corporationMatch[1].trim();
      result.extractedFields.municipalCorporation = result.municipalCorporation;
      result.confidence += 5;
      console.log('✅ Municipal Corporation:', result.municipalCorporation);
    }

    // Valid From/To Period
    const validPeriodMatch = ocrText.match(/(?:Valid From|Period)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s*(?:to|To|-)\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (validPeriodMatch) {
      result.validFromTo = `${validPeriodMatch[1]} to ${validPeriodMatch[2]}`;
      result.extractedFields.validFromTo = result.validFromTo;
      result.confidence += 4;
      console.log('✅ Valid From/To:', result.validFromTo);
    }

    console.log('📊 Property Tax extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
