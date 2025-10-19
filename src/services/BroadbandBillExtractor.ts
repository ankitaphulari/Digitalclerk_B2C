// FILE 19: BroadbandBillExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface BroadbandBillExtractionResult {
  customerId?: string;
  accountNumber?: string;
  customerName?: string;
  installationAddress?: string;
  billNumber?: string;
  billDate?: string;
  dueDate?: string;
  planName?: string;
  speed?: string;
  dataLimit?: string;
  rentalCharges?: string;
  installationCharges?: string;
  equipmentRental?: string;
  tax?: string;
  totalAmount?: string;
  billPeriod?: string;
  serviceProvider?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class BroadbandBillExtractor {
  private static readonly HEADER_BLACKLIST = [
    'BROADBAND BILL',
    'INTERNET BILL',
    'BROADBAND INVOICE',
    'FIBER BILL'
  ];

  static extractFromBroadbandBill(ocrText: string): BroadbandBillExtractionResult {
    const result: BroadbandBillExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Broadband Bill - Processing');

    // Customer ID
    const customerIdMatch = ocrText.match(/(?:Customer ID|Customer Number|Subscriber ID)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (customerIdMatch) {
      result.customerId = customerIdMatch[1];
      result.extractedFields.customerId = result.customerId;
      result.confidence += 12;
      console.log('✅ Customer ID:', result.customerId);
    }

    // Account Number
    const accountMatch = ocrText.match(/(?:Account No|Account Number|Landline No)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (accountMatch) {
      result.accountNumber = accountMatch[1];
      result.extractedFields.accountNumber = result.accountNumber;
      result.confidence += 10;
      console.log('✅ Account Number:', result.accountNumber);
    }

    // Customer Name
    const nameMatch = ocrText.match(/(?:Customer Name|Name|Account Holder)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Address|Installation)/i);
    if (nameMatch) {
      result.customerName = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.customerName = result.customerName;
      result.confidence += 10;
      console.log('✅ Customer Name:', result.customerName);
    }

    // Installation Address
    const addressMatch = ocrText.match(/(?:Installation Address|Address|Service Address)\s*:?\s*(.+?)(?=\n\n|Bill No|Plan|$)/is);
    if (addressMatch) {
      result.installationAddress = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.installationAddress = result.installationAddress;
      result.confidence += 8;
      console.log('✅ Installation Address:', result.installationAddress.substring(0, 50) + '...');
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
    const planMatch = ocrText.match(/(?:Plan|Plan Name|Package|Tariff Plan)\s*:?\s*([A-Z0-9][A-Za-z0-9\s]+?)(?=\n|Speed|Rental|Amount)/i);
    if (planMatch) {
      result.planName = planMatch[1].trim();
      result.extractedFields.planName = result.planName;
      result.confidence += 6;
      console.log('✅ Plan Name:', result.planName);
    }

    // Speed (Mbps or Gbps)
    const speedMatch = ocrText.match(/(?:Speed|Bandwidth)\s*:?\s*(\d+\s*(?:Mbps|Gbps|MB|GB))/i);
    if (speedMatch) {
      result.speed = speedMatch[1];
      result.extractedFields.speed = result.speed;
      result.confidence += 5;
      console.log('✅ Speed:', result.speed);
    }

    // Data Limit
    const dataLimitMatch = ocrText.match(/(?:Data Limit|FUP|Fair Usage Policy|Data Cap)\s*:?\s*([\d]+\s*(?:GB|TB|Unlimited))/i);
    if (dataLimitMatch) {
      result.dataLimit = dataLimitMatch[1];
      result.extractedFields.dataLimit = result.dataLimit;
      result.confidence += 4;
      console.log('✅ Data Limit:', result.dataLimit);
    }

    // Rental Charges
    const rentalMatch = ocrText.match(/(?:Rental Charges?|Monthly Rental|Broadband Charges?|Plan Charges?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (rentalMatch) {
      result.rentalCharges = rentalMatch[1].replace(/,/g, '');
      result.extractedFields.rentalCharges = result.rentalCharges;
      result.confidence += 7;
      console.log('✅ Rental Charges:', result.rentalCharges);
    }

    // Installation Charges
    const installationMatch = ocrText.match(/(?:Installation Charges?|Setup Charges?|Activation Charges?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (installationMatch) {
      result.installationCharges = installationMatch[1].replace(/,/g, '');
      result.extractedFields.installationCharges = result.installationCharges;
      result.confidence += 4;
      console.log('✅ Installation Charges:', result.installationCharges);
    }

    // Equipment Rental (Modem/Router)
    const equipmentMatch = ocrText.match(/(?:Equipment Rental|Modem Rental|Router Rental|CPE Charges?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (equipmentMatch) {
      result.equipmentRental = equipmentMatch[1].replace(/,/g, '');
      result.extractedFields.equipmentRental = result.equipmentRental;
      result.confidence += 4;
      console.log('✅ Equipment Rental:', result.equipmentRental);
    }

    // Tax
    const taxMatch = ocrText.match(/(?:Tax|GST|Service Tax|Total Tax)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (taxMatch) {
      result.tax = taxMatch[1].replace(/,/g, '');
      result.extractedFields.tax = result.tax;
      result.confidence += 5;
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

    // Bill Period
    const periodMatch = ocrText.match(/(?:Bill Period|Billing Period|Service Period|From)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s*(?:to|To|-)\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (periodMatch) {
      result.billPeriod = `${periodMatch[1]} to ${periodMatch[2]}`;
      result.extractedFields.billPeriod = result.billPeriod;
      result.confidence += 5;
      console.log('✅ Bill Period:', result.billPeriod);
    }

    // Service Provider (Jio Fiber, Airtel Xstream, ACT, BSNL, etc.)
    const providerMatch = ocrText.match(/(Jio Fiber|JioFiber|Airtel Xstream|Airtel Broadband|ACT Fibernet|ACT|BSNL|MTNL|Hathway|Tikona|Excitel|YOU Broadband)/i);
    if (providerMatch) {
      result.serviceProvider = providerMatch[1];
      result.extractedFields.serviceProvider = result.serviceProvider;
      result.confidence += 6;
      console.log('✅ Service Provider:', result.serviceProvider);
    }

    console.log('📊 Broadband Bill extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
