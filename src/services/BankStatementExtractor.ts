// FILE 10: BankStatementExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface BankStatementExtractionResult {
  accountNumber?: string;
  accountHolderName?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;
  accountType?: string;
  openingBalance?: string;
  closingBalance?: string;
  totalCredits?: string;
  totalDebits?: string;
  statementPeriod?: string;
  customerID?: string;
  address?: string;
  mobile?: string;
  email?: string;
  transactions?: any[];
  confidence: number;
  extractedFields: Record<string, any>;
}

export class BankStatementExtractor {
  private static readonly HEADER_BLACKLIST = [
    'BANK STATEMENT',
    'ACCOUNT STATEMENT',
    'TRANSACTION HISTORY',
    'STATEMENT OF ACCOUNT'
  ];

  static extractFromBankStatement(ocrText: string): BankStatementExtractionResult {
    const result: BankStatementExtractionResult = {
      confidence: 0,
      extractedFields: {},
      transactions: []
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Bank Statement - Processing');

    // Account Number
    const accountMatch = ocrText.match(/(?:Account No|A\/C No|Account Number|Acct No)\s*:?\s*(\d{9,18})/i);
    if (accountMatch) {
      result.accountNumber = accountMatch[1];
      result.extractedFields.accountNumber = result.accountNumber;
      result.confidence += 20;
      console.log('✅ Account Number:', result.accountNumber);
    }

    // Account Holder Name
    const nameMatch = ocrText.match(/(?:Account Holder|Name|Customer Name|Account Name)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Account)/i);
    if (nameMatch) {
      result.accountHolderName = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.accountHolderName = result.accountHolderName;
      result.confidence += 10;
      console.log('✅ Account Holder:', result.accountHolderName);
    }

    // IFSC Code
    const ifscMatch = ocrText.match(/(?:IFSC|IFSC Code)\s*:?\s*([A-Z]{4}0[A-Z0-9]{6})/i);
    if (ifscMatch) {
      result.ifscCode = ifscMatch[1];
      result.extractedFields.ifscCode = result.ifscCode;
      result.confidence += 10;
      console.log('✅ IFSC Code:', result.ifscCode);
    }

    // Bank Name
    const bankMatch = ocrText.match(/^([A-Z\s]+(?:BANK|बैंक))/im);
    if (bankMatch) {
      result.bankName = bankMatch[1].trim();
      result.extractedFields.bankName = result.bankName;
      result.confidence += 8;
      console.log('✅ Bank Name:', result.bankName);
    }

    // Branch Name
    const branchMatch = ocrText.match(/(?:Branch|Branch Name)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|IFSC|Account)/i);
    if (branchMatch) {
      result.branchName = branchMatch[1].trim();
      result.extractedFields.branchName = result.branchName;
      result.confidence += 5;
      console.log('✅ Branch Name:', result.branchName);
    }

    // Account Type
    const accountTypeMatch = ocrText.match(/(?:Account Type|Type)\s*:?\s*(Savings|Current|Salary|NRE|NRO)/i);
    if (accountTypeMatch) {
      result.accountType = accountTypeMatch[1];
      result.extractedFields.accountType = result.accountType;
      result.confidence += 5;
      console.log('✅ Account Type:', result.accountType);
    }

    // Opening Balance
    const openingMatch = ocrText.match(/(?:Opening Balance|Opening Bal)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (openingMatch) {
      result.openingBalance = openingMatch[1].replace(/,/g, '');
      result.extractedFields.openingBalance = result.openingBalance;
      result.confidence += 8;
      console.log('✅ Opening Balance:', result.openingBalance);
    }

    // Closing Balance
    const closingMatch = ocrText.match(/(?:Closing Balance|Closing Bal|Balance)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (closingMatch) {
      result.closingBalance = closingMatch[1].replace(/,/g, '');
      result.extractedFields.closingBalance = result.closingBalance;
      result.confidence += 8;
      console.log('✅ Closing Balance:', result.closingBalance);
    }

    // Total Credits
    const creditsMatch = ocrText.match(/(?:Total Credits?|Total Cr|Credit Total)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (creditsMatch) {
      result.totalCredits = creditsMatch[1].replace(/,/g, '');
      result.extractedFields.totalCredits = result.totalCredits;
      result.confidence += 5;
      console.log('✅ Total Credits:', result.totalCredits);
    }

    // Total Debits
    const debitsMatch = ocrText.match(/(?:Total Debits?|Total Dr|Debit Total)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (debitsMatch) {
      result.totalDebits = debitsMatch[1].replace(/,/g, '');
      result.extractedFields.totalDebits = result.totalDebits;
      result.confidence += 5;
      console.log('✅ Total Debits:', result.totalDebits);
    }

    // Statement Period
    const periodMatch = ocrText.match(/(?:Statement Period|From|For the Period)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s*(?:to|To|-)\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (periodMatch) {
      result.statementPeriod = `${periodMatch[1]} to ${periodMatch[2]}`;
      result.extractedFields.statementPeriod = result.statementPeriod;
      result.confidence += 8;
      console.log('✅ Statement Period:', result.statementPeriod);
    }

    // Customer ID
    const customerIdMatch = ocrText.match(/(?:Customer ID|Customer No|CIF|CIF No)\s*:?\s*([A-Z0-9]+)/i);
    if (customerIdMatch) {
      result.customerID = customerIdMatch[1];
      result.extractedFields.customerID = result.customerID;
      result.confidence += 3;
      console.log('✅ Customer ID:', result.customerID);
    }

    // Address
    const addressMatch = ocrText.match(/(?:Address|Mailing Address)\s*:?\s*(.+?)(?=\n\n|Mobile|Email|Phone|$)/is);
    if (addressMatch) {
      result.address = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.address = result.address;
      result.confidence += 3;
      console.log('✅ Address:', result.address.substring(0, 50) + '...');
    }

    // Mobile
    const mobileMatch = ocrText.match(/(?:Mobile|Phone|Contact No)\s*:?\s*(\d{10})/i);
    if (mobileMatch) {
      result.mobile = mobileMatch[1];
      result.extractedFields.mobile = result.mobile;
      result.confidence += 2;
      console.log('✅ Mobile:', result.mobile);
    }

    // Email
    const emailMatch = ocrText.match(/(?:Email|E-mail)\s*:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) {
      result.email = emailMatch[1];
      result.extractedFields.email = result.email;
      result.confidence += 2;
      console.log('✅ Email:', result.email);
    }

    console.log('📊 Bank Statement extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
