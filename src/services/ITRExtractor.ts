// FILE 12: ITRExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface ITRExtractionResult {
  acknowledgementNumber?: string;
  pan?: string;
  name?: string;
  fatherName?: string;
  dob?: string;
  address?: string;
  email?: string;
  mobile?: string;
  assessmentYear?: string;
  financialYear?: string;
  itrFormType?: string;
  filingStatus?: string;
  filingDate?: string;
  filingMode?: string;
  totalIncome?: string;
  grossTotalIncome?: string;
  deductions?: string;
  taxableIncome?: string;
  taxPayable?: string;
  tdsDeducted?: string;
  taxPaid?: string;
  refundAmount?: string;
  bankAccount?: string;
  verificationMethod?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class ITRExtractor {
  private static readonly HEADER_BLACKLIST = [
    'INCOME TAX RETURN',
    'ITR',
    'DEPARTMENT OF INCOME TAX',
    'GOVERNMENT OF INDIA'
  ];

  static extractFromITR(ocrText: string): ITRExtractionResult {
    const result: ITRExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 ITR - Processing');

    // Acknowledgement Number
    const ackMatch = ocrText.match(/(?:Acknowledgement No|Acknowledgement Number|ACK No)\s*:?\s*(\d{12,15})/i);
    if (ackMatch) {
      result.acknowledgementNumber = ackMatch[1];
      result.extractedFields.acknowledgementNumber = result.acknowledgementNumber;
      result.confidence += 15;
      console.log('✅ Acknowledgement Number:', result.acknowledgementNumber);
    }

    // PAN
    const panMatch = ocrText.match(/(?:PAN|Permanent Account Number)\s*:?\s*([A-Z]{5}\d{4}[A-Z])/i);
    if (panMatch) {
      result.pan = panMatch[1];
      result.extractedFields.pan = result.pan;
      result.confidence += 10;
      console.log('✅ PAN:', result.pan);
    }

    // Name
    const nameMatch = ocrText.match(/(?:Name of the Assessee|Name|Assessee Name)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Father|PAN|Date)/i);
    if (nameMatch) {
      result.name = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.name = result.name;
      result.confidence += 8;
      console.log('✅ Name:', result.name);
    }

    // Father's Name
    const fatherMatch = ocrText.match(/(?:Father'?s? Name|Father Name)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Date|DOB)/i);
    if (fatherMatch) {
      result.fatherName = formatNameForDisplay(fatherMatch[1]);
      result.extractedFields.fatherName = result.fatherName;
      result.confidence += 5;
      console.log('✅ Father Name:', result.fatherName);
    }

    // DOB
    const dobMatch = ocrText.match(/(?:Date of Birth|DOB)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (dobMatch) {
      result.dob = dobMatch[1];
      result.extractedFields.dob = result.dob;
      result.confidence += 5;
      console.log('✅ DOB:', result.dob);
    }

    // Address
    const addressMatch = ocrText.match(/(?:Address|Residential Address)\s*:?\s*(.+?)(?=\n\n|Email|Mobile|PAN|$)/is);
    if (addressMatch) {
      result.address = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.address = result.address;
      result.confidence += 4;
      console.log('✅ Address:', result.address.substring(0, 50) + '...');
    }

    // Email
    const emailMatch = ocrText.match(/(?:Email|E-mail)\s*:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) {
      result.email = emailMatch[1];
      result.extractedFields.email = result.email;
      result.confidence += 3;
      console.log('✅ Email:', result.email);
    }

    // Mobile
    const mobileMatch = ocrText.match(/(?:Mobile|Phone|Contact)\s*:?\s*(\d{10})/i);
    if (mobileMatch) {
      result.mobile = mobileMatch[1];
      result.extractedFields.mobile = result.mobile;
      result.confidence += 3;
      console.log('✅ Mobile:', result.mobile);
    }

    // Assessment Year
    const ayMatch = ocrText.match(/(?:Assessment Year|AY)\s*:?\s*(\d{4}[-]\d{2,4})/i);
    if (ayMatch) {
      result.assessmentYear = ayMatch[1];
      result.extractedFields.assessmentYear = result.assessmentYear;
      result.confidence += 6;
      console.log('✅ Assessment Year:', result.assessmentYear);
    }

    // Financial Year
    const fyMatch = ocrText.match(/(?:Financial Year|FY)\s*:?\s*(\d{4}[-]\d{2,4})/i);
    if (fyMatch) {
      result.financialYear = fyMatch[1];
      result.extractedFields.financialYear = result.financialYear;
      result.confidence += 6;
      console.log('✅ Financial Year:', result.financialYear);
    }

    // ITR Form Type
    const formTypeMatch = ocrText.match(/(?:ITR Form|Form Type|ITR-?)([1-7][A-Z]?)/i);
    if (formTypeMatch) {
      result.itrFormType = 'ITR-' + formTypeMatch[1];
      result.extractedFields.itrFormType = result.itrFormType;
      result.confidence += 5;
      console.log('✅ ITR Form Type:', result.itrFormType);
    }

    // Filing Status
    const statusMatch = ocrText.match(/(?:Filing Status|Return Filed|Status)\s*:?\s*(Original|Revised|Belated|Updated)/i);
    if (statusMatch) {
      result.filingStatus = statusMatch[1];
      result.extractedFields.filingStatus = result.filingStatus;
      result.confidence += 4;
      console.log('✅ Filing Status:', result.filingStatus);
    }

    // Filing Date
    const filingDateMatch = ocrText.match(/(?:Date of Filing|Filing Date|Filed on)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (filingDateMatch) {
      result.filingDate = filingDateMatch[1];
      result.extractedFields.filingDate = result.filingDate;
      result.confidence += 4;
      console.log('✅ Filing Date:', result.filingDate);
    }

    // Filing Mode
    const modeMatch = ocrText.match(/(?:Mode of Filing|Filing Mode)\s*:?\s*(Electronic|E-Filing|Paper)/i);
    if (modeMatch) {
      result.filingMode = modeMatch[1];
      result.extractedFields.filingMode = result.filingMode;
      result.confidence += 3;
      console.log('✅ Filing Mode:', result.filingMode);
    }

    // Total Income
    const totalIncomeMatch = ocrText.match(/(?:Total Income|Income)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (totalIncomeMatch) {
      result.totalIncome = totalIncomeMatch[1].replace(/,/g, '');
      result.extractedFields.totalIncome = result.totalIncome;
      result.confidence += 5;
      console.log('✅ Total Income:', result.totalIncome);
    }

    // Gross Total Income
    const grossIncomeMatch = ocrText.match(/(?:Gross Total Income|GTI)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (grossIncomeMatch) {
      result.grossTotalIncome = grossIncomeMatch[1].replace(/,/g, '');
      result.extractedFields.grossTotalIncome = result.grossTotalIncome;
      result.confidence += 4;
      console.log('✅ Gross Total Income:', result.grossTotalIncome);
    }

    // Deductions
    const deductionsMatch = ocrText.match(/(?:Total Deductions?|Deductions under Chapter VI-A)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (deductionsMatch) {
      result.deductions = deductionsMatch[1].replace(/,/g, '');
      result.extractedFields.deductions = result.deductions;
      result.confidence += 4;
      console.log('✅ Deductions:', result.deductions);
    }

    // Taxable Income
    const taxableMatch = ocrText.match(/(?:Taxable Income|Net Taxable Income)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (taxableMatch) {
      result.taxableIncome = taxableMatch[1].replace(/,/g, '');
      result.extractedFields.taxableIncome = result.taxableIncome;
      result.confidence += 5;
      console.log('✅ Taxable Income:', result.taxableIncome);
    }

    // Tax Payable
    const taxPayableMatch = ocrText.match(/(?:Tax Payable|Total Tax Payable)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (taxPayableMatch) {
      result.taxPayable = taxPayableMatch[1].replace(/,/g, '');
      result.extractedFields.taxPayable = result.taxPayable;
      result.confidence += 4;
      console.log('✅ Tax Payable:', result.taxPayable);
    }

    // TDS Deducted
    const tdsMatch = ocrText.match(/(?:TDS Deducted|Total TDS|TDS)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (tdsMatch) {
      result.tdsDeducted = tdsMatch[1].replace(/,/g, '');
      result.extractedFields.tdsDeducted = result.tdsDeducted;
      result.confidence += 4;
      console.log('✅ TDS Deducted:', result.tdsDeducted);
    }

    // Tax Paid
    const taxPaidMatch = ocrText.match(/(?:Tax Paid|Self Assessment Tax|Advance Tax)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (taxPaidMatch) {
      result.taxPaid = taxPaidMatch[1].replace(/,/g, '');
      result.extractedFields.taxPaid = result.taxPaid;
      result.confidence += 4;
      console.log('✅ Tax Paid:', result.taxPaid);
    }

    // Refund Amount
    const refundMatch = ocrText.match(/(?:Refund|Refund Amount|Tax Refund)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (refundMatch) {
      result.refundAmount = refundMatch[1].replace(/,/g, '');
      result.extractedFields.refundAmount = result.refundAmount;
      result.confidence += 4;
      console.log('✅ Refund Amount:', result.refundAmount);
    }

    // Bank Account
    const bankAccountMatch = ocrText.match(/(?:Bank Account|Account Number|A\/C No)\s*:?\s*(\d{9,18})/i);
    if (bankAccountMatch) {
      result.bankAccount = bankAccountMatch[1];
      result.extractedFields.bankAccount = result.bankAccount;
      result.confidence += 3;
      console.log('✅ Bank Account:', result.bankAccount);
    }

    // Verification Method
    const verificationMatch = ocrText.match(/(?:Verification|Verified through|Verification Method)\s*:?\s*(Aadhaar OTP|EVC|Net Banking|Digital Signature)/i);
    if (verificationMatch) {
      result.verificationMethod = verificationMatch[1];
      result.extractedFields.verificationMethod = result.verificationMethod;
      result.confidence += 3;
      console.log('✅ Verification Method:', result.verificationMethod);
    }

    console.log('📊 ITR extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
