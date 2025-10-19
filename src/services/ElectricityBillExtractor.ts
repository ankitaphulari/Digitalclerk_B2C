// FILE 14: ElectricityBillExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface ElectricityBillExtractionResult {
  consumerNumber?: string;
  consumerName?: string;
  billingAddress?: string;
  billNumber?: string;
  billDate?: string;
  dueDate?: string;
  meterNumber?: string;
  previousReading?: string;
  currentReading?: string;
  unitsConsumed?: string;
  ratePerUnit?: string;
  fixedCharges?: string;
  energyCharges?: string;
  taxSurcharge?: string;
  totalAmount?: string;
  previousOutstanding?: string;
  latePaymentCharges?: string;
  billPeriod?: string;
  paymentStatus?: string;
  serviceProvider?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class ElectricityBillExtractor {
  private static readonly HEADER_BLACKLIST = [
    'ELECTRICITY BILL',
    'POWER BILL',
    'ELECTRICITY BOARD',
    'ELECTRICITY DEPARTMENT'
  ];

  static extractFromElectricityBill(ocrText: string): ElectricityBillExtractionResult {
    const result: ElectricityBillExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Electricity Bill - Processing');

    // Consumer Number
    const consumerMatch = ocrText.match(/(?:Consumer No|Consumer Number|Account No|CA No)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (consumerMatch) {
      result.consumerNumber = consumerMatch[1];
      result.extractedFields.consumerNumber = result.consumerNumber;
      result.confidence += 15;
      console.log('✅ Consumer Number:', result.consumerNumber);
    }

    // Consumer Name
    const nameMatch = ocrText.match(/(?:Consumer Name|Name|Customer Name)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Address|Bill)/i);
    if (nameMatch) {
      result.consumerName = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.consumerName = result.consumerName;
      result.confidence += 10;
      console.log('✅ Consumer Name:', result.consumerName);
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
    const billNoMatch = ocrText.match(/(?:Bill No|Bill Number|Invoice No)\s*:?\s*([A-Z0-9\-\/]+)/i);
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

    // Units Consumed
    const unitsMatch = ocrText.match(/(?:Units Consumed|Consumption|Total Units|kWh)\s*:?\s*([\d,]+\.?\d*)/i);
    if (unitsMatch) {
      result.unitsConsumed = unitsMatch[1].replace(/,/g, '');
      result.extractedFields.unitsConsumed = result.unitsConsumed;
      result.confidence += 6;
      console.log('✅ Units Consumed:', result.unitsConsumed);
    }

    // Rate Per Unit
    const rateMatch = ocrText.match(/(?:Rate per Unit|Unit Rate|Rate\/Unit)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (rateMatch) {
      result.ratePerUnit = rateMatch[1].replace(/,/g, '');
      result.extractedFields.ratePerUnit = result.ratePerUnit;
      result.confidence += 3;
      console.log('✅ Rate Per Unit:', result.ratePerUnit);
    }

    // Fixed Charges
    const fixedMatch = ocrText.match(/(?:Fixed Charges?|Fixed Cost|Service Charge)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (fixedMatch) {
      result.fixedCharges = fixedMatch[1].replace(/,/g, '');
      result.extractedFields.fixedCharges = result.fixedCharges;
      result.confidence += 3;
      console.log('✅ Fixed Charges:', result.fixedCharges);
    }

    // Energy Charges
    const energyMatch = ocrText.match(/(?:Energy Charges?|Electricity Charges?|Power Charges?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (energyMatch) {
      result.energyCharges = energyMatch[1].replace(/,/g, '');
      result.extractedFields.energyCharges = result.energyCharges;
      result.confidence += 4;
      console.log('✅ Energy Charges:', result.energyCharges);
    }

    // Tax/Surcharge
    const taxMatch = ocrText.match(/(?:Tax|Surcharge|GST|Electricity Duty)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (taxMatch) {
      result.taxSurcharge = taxMatch[1].replace(/,/g, '');
      result.extractedFields.taxSurcharge = result.taxSurcharge;
      result.confidence += 3;
      console.log('✅ Tax/Surcharge:', result.taxSurcharge);
    }

    // Total Amount
    const totalMatch = ocrText.match(/(?:Total Amount|Bill Amount|Amount Payable|Net Amount)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (totalMatch) {
      result.totalAmount = totalMatch[1].replace(/,/g, '');
      result.extractedFields.totalAmount = result.totalAmount;
      result.confidence += 8;
      console.log('✅ Total Amount:', result.totalAmount);
    }

    // Previous Outstanding
    const outstandingMatch = ocrText.match(/(?:Previous Outstanding|Arrears|Previous Balance|Previous Dues)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (outstandingMatch) {
      result.previousOutstanding = outstandingMatch[1].replace(/,/g, '');
      result.extractedFields.previousOutstanding = result.previousOutstanding;
      result.confidence += 3;
      console.log('✅ Previous Outstanding:', result.previousOutstanding);
    }

    // Late Payment Charges
    const lateChargesMatch = ocrText.match(/(?:Late Payment Charges?|Delay Charges?|Penalty)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (lateChargesMatch) {
      result.latePaymentCharges = lateChargesMatch[1].replace(/,/g, '');
      result.extractedFields.latePaymentCharges = result.latePaymentCharges;
      result.confidence += 2;
      console.log('✅ Late Payment Charges:', result.latePaymentCharges);
    }

    // Bill Period
    const periodMatch = ocrText.match(/(?:Bill Period|Billing Period|From)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s*(?:to|To|-)\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (periodMatch) {
      result.billPeriod = `${periodMatch[1]} to ${periodMatch[2]}`;
      result.extractedFields.billPeriod = result.billPeriod;
      result.confidence += 4;
      console.log('✅ Bill Period:', result.billPeriod);
    }

    // Payment Status
    const statusMatch = ocrText.match(/(?:Payment Status|Status)\s*:?\s*(Paid|Unpaid|Pending|Due)/i);
    if (statusMatch) {
      result.paymentStatus = statusMatch[1];
      result.extractedFields.paymentStatus = result.paymentStatus;
      result.confidence += 2;
      console.log('✅ Payment Status:', result.paymentStatus);
    }

    // Service Provider
    const providerMatch = ocrText.match(/^([A-Z\s]+(?:ELECTRICITY|POWER|VIDYUT)[\s\w]*(?:BOARD|COMPANY|LIMITED|CORPORATION)?)/im);
    if (providerMatch) {
      result.serviceProvider = providerMatch[1].trim();
      result.extractedFields.serviceProvider = result.serviceProvider;
      result.confidence += 4;
      console.log('✅ Service Provider:', result.serviceProvider);
    }

    console.log('📊 Electricity Bill extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
