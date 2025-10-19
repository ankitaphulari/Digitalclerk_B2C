// FILE 16: GasBillPNGExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface GasBillPNGExtractionResult {
  consumerNumber?: string;
  customerName?: string;
  billingAddress?: string;
  billNumber?: string;
  billDate?: string;
  dueDate?: string;
  meterNumber?: string;
  previousReading?: string;
  currentReading?: string;
  unitsConsumed?: string;
  ratePerUnit?: string;
  gasCharges?: string;
  fixedCharges?: string;
  tax?: string;
  totalAmount?: string;
  billPeriod?: string;
  serviceProvider?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class GasBillPNGExtractor {
  private static readonly HEADER_BLACKLIST = [
    'PNG BILL',
    'PIPED NATURAL GAS',
    'GAS BILL',
    'NATURAL GAS BILL'
  ];

  static extractFromGasBillPNG(ocrText: string): GasBillPNGExtractionResult {
    const result: GasBillPNGExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Gas Bill PNG - Processing');

    // Consumer Number
    const consumerMatch = ocrText.match(/(?:Consumer No|Consumer Number|Account No|CA No|Customer ID)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (consumerMatch) {
      result.consumerNumber = consumerMatch[1];
      result.extractedFields.consumerNumber = result.consumerNumber;
      result.confidence += 15;
      console.log('✅ Consumer Number:', result.consumerNumber);
    }

    // Customer Name
    const nameMatch = ocrText.match(/(?:Customer Name|Consumer Name|Name)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Address|Bill)/i);
    if (nameMatch) {
      result.customerName = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.customerName = result.customerName;
      result.confidence += 10;
      console.log('✅ Customer Name:', result.customerName);
    }

    // Billing Address
    const addressMatch = ocrText.match(/(?:Address|Billing Address|Service Address)\s*:?\s*(.+?)(?=\n\n|Bill No|Meter|$)/is);
    if (addressMatch) {
      result.billingAddress = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.billingAddress = result.billingAddress;
      result.confidence += 8;
      console.log('✅ Billing Address:', result.billingAddress.substring(0, 50) + '...');
    }

    // Bill Number
    const billNoMatch = ocrText.match(/(?:Bill No|Bill Number|Invoice No|Receipt No)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (billNoMatch) {
      result.billNumber = billNoMatch[1];
      result.extractedFields.billNumber = result.billNumber;
      result.confidence += 8;
      console.log('✅ Bill Number:', result.billNumber);
    }

    // Bill Date
    const billDateMatch = ocrText.match(/(?:Bill Date|Date of Issue|Invoice Date)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
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
    const meterMatch = ocrText.match(/(?:Meter No|Meter Number|Meter ID)\s*:?\s*([A-Z0-9\-]+)/i);
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

    // Units Consumed (SCM - Standard Cubic Meter)
    const unitsMatch = ocrText.match(/(?:Units Consumed|Consumption|Total Units|SCM|Gas Consumed)\s*:?\s*([\d,]+\.?\d*)/i);
    if (unitsMatch) {
      result.unitsConsumed = unitsMatch[1].replace(/,/g, '');
      result.extractedFields.unitsConsumed = result.unitsConsumed;
      result.confidence += 6;
      console.log('✅ Units Consumed:', result.unitsConsumed);
    }

    // Rate Per Unit
    const rateMatch = ocrText.match(/(?:Rate per Unit|Unit Rate|Rate\/Unit|Rate per SCM)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (rateMatch) {
      result.ratePerUnit = rateMatch[1].replace(/,/g, '');
      result.extractedFields.ratePerUnit = result.ratePerUnit;
      result.confidence += 3;
      console.log('✅ Rate Per Unit:', result.ratePerUnit);
    }

    // Gas Charges
    const gasChargesMatch = ocrText.match(/(?:Gas Charges?|Energy Charges?|Consumption Charges?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (gasChargesMatch) {
      result.gasCharges = gasChargesMatch[1].replace(/,/g, '');
      result.extractedFields.gasCharges = result.gasCharges;
      result.confidence += 6;
      console.log('✅ Gas Charges:', result.gasCharges);
    }

    // Fixed Charges
    const fixedMatch = ocrText.match(/(?:Fixed Charges?|Fixed Cost|Service Charge|Monthly Rental)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (fixedMatch) {
      result.fixedCharges = fixedMatch[1].replace(/,/g, '');
      result.extractedFields.fixedCharges = result.fixedCharges;
      result.confidence += 4;
      console.log('✅ Fixed Charges:', result.fixedCharges);
    }

    // Tax (GST)
    const taxMatch = ocrText.match(/(?:Tax|GST|CGST|SGST)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
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

    // Service Provider (Indraprastha Gas, Mahanagar Gas, Gujarat Gas, etc.)
    const providerMatch = ocrText.match(/(Indraprastha Gas|IGL|Mahanagar Gas|MGL|Gujarat Gas|GGL|Adani Gas|GSPC|Torrent Gas)/i);
    if (providerMatch) {
      result.serviceProvider = providerMatch[1];
      result.extractedFields.serviceProvider = result.serviceProvider;
      result.confidence += 5;
      console.log('✅ Service Provider:', result.serviceProvider);
    }

    console.log('📊 Gas Bill PNG extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
