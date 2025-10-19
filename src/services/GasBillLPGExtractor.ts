// FILE 15: GasBillLPGExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface GasBillLPGExtractionResult {
  bpNumber?: string;
  consumerNumber?: string;
  consumerName?: string;
  address?: string;
  distributorName?: string;
  distributorCode?: string;
  mobile?: string;
  connectionType?: string;
  numberOfCylinders?: string;
  pricePerCylinder?: string;
  subsidyAmount?: string;
  netAmount?: string;
  lastBookingDate?: string;
  gasCompany?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class GasBillLPGExtractor {
  private static readonly HEADER_BLACKLIST = [
    'LPG',
    'LIQUIFIED PETROLEUM GAS',
    'GAS CYLINDER',
    'BOOKING SLIP'
  ];

  static extractFromGasBillLPG(ocrText: string): GasBillLPGExtractionResult {
    const result: GasBillLPGExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Gas Bill LPG - Processing');

    // BP Number (Booking Point Number / Consumer Number)
    const bpMatch = ocrText.match(/(?:BP No|BP Number|Booking Point)\s*:?\s*(\d{10,17})/i);
    if (bpMatch) {
      result.bpNumber = bpMatch[1];
      result.extractedFields.bpNumber = result.bpNumber;
      result.confidence += 20;
      console.log('✅ BP Number:', result.bpNumber);
    }

    // Consumer Number (alternate pattern)
    const consumerMatch = ocrText.match(/(?:Consumer No|Consumer Number|LPG ID)\s*:?\s*(\d{10,17})/i);
    if (consumerMatch) {
      result.consumerNumber = consumerMatch[1];
      result.extractedFields.consumerNumber = result.consumerNumber;
      result.confidence += 15;
      console.log('✅ Consumer Number:', result.consumerNumber);
    }

    // Consumer Name
    const nameMatch = ocrText.match(/(?:Consumer Name|Name|Customer Name)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Address|Distributor)/i);
    if (nameMatch) {
      result.consumerName = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.consumerName = result.consumerName;
      result.confidence += 12;
      console.log('✅ Consumer Name:', result.consumerName);
    }

    // Address
    const addressMatch = ocrText.match(/(?:Address|Consumer Address)\s*:?\s*(.+?)(?=\n\n|Distributor|Mobile|BP No|$)/is);
    if (addressMatch) {
      result.address = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.address = result.address;
      result.confidence += 8;
      console.log('✅ Address:', result.address.substring(0, 50) + '...');
    }

    // Distributor Name
    const distributorMatch = ocrText.match(/(?:Distributor Name|Distributor|Agency Name)\s*:?\s*([A-Z][A-Za-z\s&]+?)(?=\n|Code|Mobile)/i);
    if (distributorMatch) {
      result.distributorName = distributorMatch[1].trim();
      result.extractedFields.distributorName = result.distributorName;
      result.confidence += 8;
      console.log('✅ Distributor Name:', result.distributorName);
    }

    // Distributor Code
    const codeMatch = ocrText.match(/(?:Distributor Code|Agency Code|Dist Code)\s*:?\s*([A-Z0-9]+)/i);
    if (codeMatch) {
      result.distributorCode = codeMatch[1];
      result.extractedFields.distributorCode = result.distributorCode;
      result.confidence += 6;
      console.log('✅ Distributor Code:', result.distributorCode);
    }

    // Mobile
    const mobileMatch = ocrText.match(/(?:Mobile|Phone|Contact)\s*:?\s*(\d{10})/i);
    if (mobileMatch) {
      result.mobile = mobileMatch[1];
      result.extractedFields.mobile = result.mobile;
      result.confidence += 5;
      console.log('✅ Mobile:', result.mobile);
    }

    // Connection Type
    const connectionMatch = ocrText.match(/(?:Connection Type|Type)\s*:?\s*(Domestic|Commercial|Non-Domestic)/i);
    if (connectionMatch) {
      result.connectionType = connectionMatch[1];
      result.extractedFields.connectionType = result.connectionType;
      result.confidence += 5;
      console.log('✅ Connection Type:', result.connectionType);
    }

    // Number of Cylinders
    const cylindersMatch = ocrText.match(/(?:No\.? of Cylinders?|Quantity|Cylinders)\s*:?\s*(\d{1,2})/i);
    if (cylindersMatch) {
      result.numberOfCylinders = cylindersMatch[1];
      result.extractedFields.numberOfCylinders = result.numberOfCylinders;
      result.confidence += 5;
      console.log('✅ Number of Cylinders:', result.numberOfCylinders);
    }

    // Price Per Cylinder
    const priceMatch = ocrText.match(/(?:Price per Cylinder|Cylinder Price|Rate)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (priceMatch) {
      result.pricePerCylinder = priceMatch[1].replace(/,/g, '');
      result.extractedFields.pricePerCylinder = result.pricePerCylinder;
      result.confidence += 6;
      console.log('✅ Price Per Cylinder:', result.pricePerCylinder);
    }

    // Subsidy Amount
    const subsidyMatch = ocrText.match(/(?:Subsidy|Subsidy Amount|Subsidy Amt)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (subsidyMatch) {
      result.subsidyAmount = subsidyMatch[1].replace(/,/g, '');
      result.extractedFields.subsidyAmount = result.subsidyAmount;
      result.confidence += 5;
      console.log('✅ Subsidy Amount:', result.subsidyAmount);
    }

    // Net Amount (Amount to be paid)
    const netMatch = ocrText.match(/(?:Net Amount|Amount Payable|Total Amount|Amount to Pay)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (netMatch) {
      result.netAmount = netMatch[1].replace(/,/g, '');
      result.extractedFields.netAmount = result.netAmount;
      result.confidence += 8;
      console.log('✅ Net Amount:', result.netAmount);
    }

    // Last Booking Date
    const lastBookingMatch = ocrText.match(/(?:Last Booking|Last Refill|Previous Booking)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (lastBookingMatch) {
      result.lastBookingDate = lastBookingMatch[1];
      result.extractedFields.lastBookingDate = result.lastBookingDate;
      result.confidence += 4;
      console.log('✅ Last Booking Date:', result.lastBookingDate);
    }

    // Gas Company (Indian Oil, Bharat Gas, HP Gas)
    const companyMatch = ocrText.match(/(Indian Oil|INDIAN OIL|IndianOil|Bharat Gas|BHARAT GAS|BharatGas|HP Gas|HPCL|Hindustan Petroleum)/i);
    if (companyMatch) {
      result.gasCompany = companyMatch[1];
      result.extractedFields.gasCompany = result.gasCompany;
      result.confidence += 7;
      console.log('✅ Gas Company:', result.gasCompany);
    }

    console.log('📊 Gas Bill LPG extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
