// FILE 17: WaterBillExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface WaterBillExtractionResult {
  consumerNumber?: string;
  propertyId?: string;
  consumerName?: string;
  address?: string;
  billNumber?: string;
  billDate?: string;
  dueDate?: string;
  meterNumber?: string;
  previousReading?: string;
  currentReading?: string;
  waterConsumed?: string;
  waterCharges?: string;
  sewerageCharges?: string;
  tax?: string;
  totalAmount?: string;
  billPeriod?: string;
  municipalCorporation?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class WaterBillExtractor {
  private static readonly HEADER_BLACKLIST = [
    'WATER BILL',
    'WATER TAX',
    'MUNICIPAL CORPORATION',
    'WATER SUPPLY'
  ];

  static extractFromWaterBill(ocrText: string): WaterBillExtractionResult {
    const result: WaterBillExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Water Bill - Processing');

    // Consumer Number
    const consumerMatch = ocrText.match(/(?:Consumer No|Consumer Number|Connection No|Account No)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (consumerMatch) {
      result.consumerNumber = consumerMatch[1];
      result.extractedFields.consumerNumber = result.consumerNumber;
      result.confidence += 15;
      console.log('✅ Consumer Number:', result.consumerNumber);
    }

    // Property ID
    const propertyMatch = ocrText.match(/(?:Property ID|Property No|Assessment No)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (propertyMatch) {
      result.propertyId = propertyMatch[1];
      result.extractedFields.propertyId = result.propertyId;
      result.confidence += 10;
      console.log('✅ Property ID:', result.propertyId);
    }

    // Consumer Name
    const nameMatch = ocrText.match(/(?:Consumer Name|Name|Owner Name|Customer Name)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Address|Property)/i);
    if (nameMatch) {
      result.consumerName = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.consumerName = result.consumerName;
      result.confidence += 10;
      console.log('✅ Consumer Name:', result.consumerName);
    }

    // Address
    const addressMatch = ocrText.match(/(?:Address|Property Address|Service Address)\s*:?\s*(.+?)(?=\n\n|Bill No|Meter|Ward|$)/is);
    if (addressMatch) {
      result.address = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.address = result.address;
      result.confidence += 8;
      console.log('✅ Address:', result.address.substring(0, 50) + '...');
    }

    // Bill Number
    const billNoMatch = ocrText.match(/(?:Bill No|Bill Number|Receipt No|Invoice No)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (billNoMatch) {
      result.billNumber = billNoMatch[1];
      result.extractedFields.billNumber = result.billNumber;
      result.confidence += 8;
      console.log('✅ Bill Number:', result.billNumber);
    }

    // Bill Date
    const billDateMatch = ocrText.match(/(?:Bill Date|Date of Issue|Issue Date)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (billDateMatch) {
      result.billDate = billDateMatch[1];
      result.extractedFields.billDate = result.billDate;
      result.confidence += 6;
      console.log('✅ Bill Date:', result.billDate);
    }

    // Due Date
    const dueMatch = ocrText.match(/(?:Due Date|Payment Due Date|Last Date)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (dueMatch) {
      result.dueDate = dueMatch[1];
      result.extractedFields.dueDate = result.dueDate;
      result.confidence += 6;
      console.log('✅ Due Date:', result.dueDate);
    }

    // Meter Number
    const meterMatch = ocrText.match(/(?:Meter No|Meter Number|Water Meter)\s*:?\s*([A-Z0-9\-]+)/i);
    if (meterMatch) {
      result.meterNumber = meterMatch[1];
      result.extractedFields.meterNumber = result.meterNumber;
      result.confidence += 5;
      console.log('✅ Meter Number:', result.meterNumber);
    }

    // Previous Reading
    const prevReadingMatch = ocrText.match(/(?:Previous Reading|Last Reading|Opening Reading)\s*:?\s*([\d,]+\.?\d*)/i);
    if (prevReadingMatch) {
      result.previousReading = prevReadingMatch[1].replace(/,/g, '');
      result.extractedFields.previousReading = result.previousReading;
      result.confidence += 5;
      console.log('✅ Previous Reading:', result.previousReading);
    }

    // Current Reading
    const currentReadingMatch = ocrText.match(/(?:Current Reading|Present Reading|Closing Reading)\s*:?\s*([\d,]+\.?\d*)/i);
    if (currentReadingMatch) {
      result.currentReading = currentReadingMatch[1].replace(/,/g, '');
      result.extractedFields.currentReading = result.currentReading;
      result.confidence += 5;
      console.log('✅ Current Reading:', result.currentReading);
    }

    // Water Consumed (in KL - Kiloliters or Cubic Meters)
    const consumedMatch = ocrText.match(/(?:Water Consumed|Consumption|Total Consumption|Units|KL)\s*:?\s*([\d,]+\.?\d*)/i);
    if (consumedMatch) {
      result.waterConsumed = consumedMatch[1].replace(/,/g, '');
      result.extractedFields.waterConsumed = result.waterConsumed;
      result.confidence += 6;
      console.log('✅ Water Consumed:', result.waterConsumed);
    }

    // Water Charges
    const waterChargesMatch = ocrText.match(/(?:Water Charges?|Water Bill|Consumption Charges?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (waterChargesMatch) {
      result.waterCharges = waterChargesMatch[1].replace(/,/g, '');
      result.extractedFields.waterCharges = result.waterCharges;
      result.confidence += 6;
      console.log('✅ Water Charges:', result.waterCharges);
    }

    // Sewerage Charges
    const sewerageMatch = ocrText.match(/(?:Sewerage Charges?|Sewer Charges?|Drainage Charges?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (sewerageMatch) {
      result.sewerageCharges = sewerageMatch[1].replace(/,/g, '');
      result.extractedFields.sewerageCharges = result.sewerageCharges;
      result.confidence += 5;
      console.log('✅ Sewerage Charges:', result.sewerageCharges);
    }

    // Tax
    const taxMatch = ocrText.match(/(?:Tax|GST|Service Tax)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (taxMatch) {
      result.tax = taxMatch[1].replace(/,/g, '');
      result.extractedFields.tax = result.tax;
      result.confidence += 4;
      console.log('✅ Tax:', result.tax);
    }

    // Total Amount
    const totalMatch = ocrText.match(/(?:Total Amount|Bill Amount|Amount Payable|Net Amount|Amount Due)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (totalMatch) {
      result.totalAmount = totalMatch[1].replace(/,/g, '');
      result.extractedFields.totalAmount = result.totalAmount;
      result.confidence += 8;
      console.log('✅ Total Amount:', result.totalAmount);
    }

    // Bill Period
    const periodMatch = ocrText.match(/(?:Bill Period|Billing Period|From)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s*(?:to|To|-)\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (periodMatch) {
      result.billPeriod = `${periodMatch[1]} to ${periodMatch[2]}`;
      result.extractedFields.billPeriod = result.billPeriod;
      result.confidence += 5;
      console.log('✅ Bill Period:', result.billPeriod);
    }

    // Municipal Corporation
    const corporationMatch = ocrText.match(/^([A-Z\s]+(?:Municipal Corporation|Nagar Nigam|Jal Board|Water Board|Water Works))/im);
    if (corporationMatch) {
      result.municipalCorporation = corporationMatch[1].trim();
      result.extractedFields.municipalCorporation = result.municipalCorporation;
      result.confidence += 5;
      console.log('✅ Municipal Corporation:', result.municipalCorporation);
    }

    console.log('📊 Water Bill extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
