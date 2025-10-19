// FILE 18: TelephoneBillExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface TelephoneBillExtractionResult {
  accountNumber?: string;
  phoneNumber?: string;
  customerName?: string;
  billingAddress?: string;
  billNumber?: string;
  billDate?: string;
  dueDate?: string;
  planName?: string;
  rentalCharges?: string;
  callCharges?: string;
  dataCharges?: string;
  smsCharges?: string;
  roamingCharges?: string;
  vas?: string;
  tax?: string;
  totalAmount?: string;
  previousBalance?: string;
  billPeriod?: string;
  operator?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class TelephoneBillExtractor {
  private static readonly HEADER_BLACKLIST = [
    'TELEPHONE BILL',
    'MOBILE BILL',
    'POSTPAID BILL',
    'INVOICE'
  ];

  static extractFromTelephoneBill(ocrText: string): TelephoneBillExtractionResult {
    const result: TelephoneBillExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Telephone Bill - Processing');

    // Account Number
    const accountMatch = ocrText.match(/(?:Account No|Account Number|Customer ID)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (accountMatch) {
      result.accountNumber = accountMatch[1];
      result.extractedFields.accountNumber = result.accountNumber;
      result.confidence += 12;
      console.log('✅ Account Number:', result.accountNumber);
    }

    // Phone Number
    const phoneMatch = ocrText.match(/(?:Mobile No|Phone Number|Contact No|Service No)\s*:?\s*(\d{10})/i);
    if (phoneMatch) {
      result.phoneNumber = phoneMatch[1];
      result.extractedFields.phoneNumber = result.phoneNumber;
      result.confidence += 15;
      console.log('✅ Phone Number:', result.phoneNumber);
    }

    // Customer Name
    const nameMatch = ocrText.match(/(?:Customer Name|Name|Account Name)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Address|Mobile)/i);
    if (nameMatch) {
      result.customerName = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.customerName = result.customerName;
      result.confidence += 10;
      console.log('✅ Customer Name:', result.customerName);
    }

    // Billing Address
    const addressMatch = ocrText.match(/(?:Address|Billing Address)\s*:?\s*(.+?)(?=\n\n|Bill No|Account|$)/is);
    if (addressMatch) {
      result.billingAddress = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.billingAddress = result.billingAddress;
      result.confidence += 6;
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
    const dueMatch = ocrText.match(/(?:Due Date|Payment Due Date|Pay By)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (dueMatch) {
      result.dueDate = dueMatch[1];
      result.extractedFields.dueDate = result.dueDate;
      result.confidence += 6;
      console.log('✅ Due Date:', result.dueDate);
    }

    // Plan Name
    const planMatch = ocrText.match(/(?:Plan|Plan Name|Tariff Plan|Package)\s*:?\s*([A-Z0-9][A-Za-z0-9\s]+?)(?=\n|Rental|Amount)/i);
    if (planMatch) {
      result.planName = planMatch[1].trim();
      result.extractedFields.planName = result.planName;
      result.confidence += 5;
      console.log('✅ Plan Name:', result.planName);
    }

    // Rental Charges
    const rentalMatch = ocrText.match(/(?:Rental Charges?|Monthly Rental|Fixed Charges?|Plan Charges?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (rentalMatch) {
      result.rentalCharges = rentalMatch[1].replace(/,/g, '');
      result.extractedFields.rentalCharges = result.rentalCharges;
      result.confidence += 5;
      console.log('✅ Rental Charges:', result.rentalCharges);
    }

    // Call Charges
    const callMatch = ocrText.match(/(?:Call Charges?|Voice Charges?|Calling Charges?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (callMatch) {
      result.callCharges = callMatch[1].replace(/,/g, '');
      result.extractedFields.callCharges = result.callCharges;
      result.confidence += 4;
      console.log('✅ Call Charges:', result.callCharges);
    }

    // Data Charges
    const dataMatch = ocrText.match(/(?:Data Charges?|Internet Charges?|Data Usage)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (dataMatch) {
      result.dataCharges = dataMatch[1].replace(/,/g, '');
      result.extractedFields.dataCharges = result.dataCharges;
      result.confidence += 4;
      console.log('✅ Data Charges:', result.dataCharges);
    }

    // SMS Charges
    const smsMatch = ocrText.match(/(?:SMS Charges?|Message Charges?|Text Charges?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (smsMatch) {
      result.smsCharges = smsMatch[1].replace(/,/g, '');
      result.extractedFields.smsCharges = result.smsCharges;
      result.confidence += 3;
      console.log('✅ SMS Charges:', result.smsCharges);
    }

    // Roaming Charges
    const roamingMatch = ocrText.match(/(?:Roaming Charges?|Roaming)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (roamingMatch) {
      result.roamingCharges = roamingMatch[1].replace(/,/g, '');
      result.extractedFields.roamingCharges = result.roamingCharges;
      result.confidence += 3;
      console.log('✅ Roaming Charges:', result.roamingCharges);
    }

    // VAS (Value Added Services)
    const vasMatch = ocrText.match(/(?:VAS|Value Added Services?|VAS Charges?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (vasMatch) {
      result.vas = vasMatch[1].replace(/,/g, '');
      result.extractedFields.vas = result.vas;
      result.confidence += 3;
      console.log('✅ VAS:', result.vas);
    }

    // Tax
    const taxMatch = ocrText.match(/(?:Tax|GST|Service Tax|Total Tax)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (taxMatch) {
      result.tax = taxMatch[1].replace(/,/g, '');
      result.extractedFields.tax = result.tax;
      result.confidence += 4;
      console.log('✅ Tax:', result.tax);
    }

    // Total Amount
    const totalMatch = ocrText.match(/(?:Total Amount|Bill Amount|Amount Payable|Net Amount|Total Charges?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (totalMatch) {
      result.totalAmount = totalMatch[1].replace(/,/g, '');
      result.extractedFields.totalAmount = result.totalAmount;
      result.confidence += 8;
      console.log('✅ Total Amount:', result.totalAmount);
    }

    // Previous Balance
    const previousMatch = ocrText.match(/(?:Previous Balance|Opening Balance|Carried Forward|Last Bill)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (previousMatch) {
      result.previousBalance = previousMatch[1].replace(/,/g, '');
      result.extractedFields.previousBalance = result.previousBalance;
      result.confidence += 3;
      console.log('✅ Previous Balance:', result.previousBalance);
    }

    // Bill Period
    const periodMatch = ocrText.match(/(?:Bill Period|Billing Period|From)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s*(?:to|To|-)\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (periodMatch) {
      result.billPeriod = `${periodMatch[1]} to ${periodMatch[2]}`;
      result.extractedFields.billPeriod = result.billPeriod;
      result.confidence += 5;
      console.log('✅ Bill Period:', result.billPeriod);
    }

    // Operator (Airtel, Jio, Vi, BSNL, etc.)
    const operatorMatch = ocrText.match(/(Airtel|Bharti Airtel|Jio|Reliance Jio|Vi|Vodafone Idea|BSNL|MTNL)/i);
    if (operatorMatch) {
      result.operator = operatorMatch[1];
      result.extractedFields.operator = result.operator;
      result.confidence += 5;
      console.log('✅ Operator:', result.operator);
    }

    console.log('📊 Telephone Bill extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
