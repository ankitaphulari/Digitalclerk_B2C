// FILE 13: Form16Extractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface Form16ExtractionResult {
  formType?: string;
  tan?: string;
  employerPan?: string;
  employeePan?: string;
  employeeName?: string;
  address?: string;
  employerName?: string;
  employerAddress?: string;
  financialYear?: string;
  assessmentYear?: string;
  period?: string;
  grossSalary?: string;
  allowances?: string;
  deductions?: string;
  totalIncome?: string;
  chapterVIADeductions?: string;
  taxableIncome?: string;
  taxCalculated?: string;
  surcharge?: string;
  educationCess?: string;
  totalTax?: string;
  tdsDeducted?: string;
  certificateNumber?: string;
  dateOfIssue?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class Form16Extractor {
  private static readonly HEADER_BLACKLIST = [
    'FORM NO. 16',
    'FORM 16',
    'CERTIFICATE UNDER SECTION 203',
    'PART A',
    'PART B'
  ];

  static extractFromForm16(ocrText: string): Form16ExtractionResult {
    const result: Form16ExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Form 16 - Processing');

    // Form Type
    const formTypeMatch = ocrText.match(/(?:FORM NO\.|Form)\s*(16[A-B]?)/i);
    if (formTypeMatch) {
      result.formType = 'Form ' + formTypeMatch[1];
      result.extractedFields.formType = result.formType;
      result.confidence += 5;
      console.log('✅ Form Type:', result.formType);
    }

    // TAN (Tax Deduction Account Number)
    const tanMatch = ocrText.match(/(?:TAN|Tax Deduction Account Number)\s*:?\s*([A-Z]{4}\d{5}[A-Z])/i);
    if (tanMatch) {
      result.tan = tanMatch[1];
      result.extractedFields.tan = result.tan;
      result.confidence += 10;
      console.log('✅ TAN:', result.tan);
    }

    // Employer PAN
    const employerPanMatch = ocrText.match(/(?:PAN of the Deductor|Employer PAN|Deductor PAN)\s*:?\s*([A-Z]{5}\d{4}[A-Z])/i);
    if (employerPanMatch) {
      result.employerPan = employerPanMatch[1];
      result.extractedFields.employerPan = result.employerPan;
      result.confidence += 8;
      console.log('✅ Employer PAN:', result.employerPan);
    }

    // Employee PAN
    const employeePanMatch = ocrText.match(/(?:PAN of the Employee|Employee PAN|Deductee PAN)\s*:?\s*([A-Z]{5}\d{4}[A-Z])/i);
    if (employeePanMatch) {
      result.employeePan = employeePanMatch[1];
      result.extractedFields.employeePan = result.employeePan;
      result.confidence += 8;
      console.log('✅ Employee PAN:', result.employeePan);
    }

    // Employee Name
    const nameMatch = ocrText.match(/(?:Name of the Employee|Employee Name|Name of Deductee)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Address|PAN)/i);
    if (nameMatch) {
      result.employeeName = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.employeeName = result.employeeName;
      result.confidence += 7;
      console.log('✅ Employee Name:', result.employeeName);
    }

    // Employee Address
    const addressMatch = ocrText.match(/(?:Address of the Employee|Employee Address)\s*:?\s*(.+?)(?=\n\n|Employer|PAN|$)/is);
    if (addressMatch) {
      result.address = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.address = result.address;
      result.confidence += 4;
      console.log('✅ Employee Address:', result.address.substring(0, 50) + '...');
    }

    // Employer Name
    const employerNameMatch = ocrText.match(/(?:Name of the Employer|Employer Name|Name of Deductor)\s*:?\s*([A-Z][A-Za-z\s&.]+?)(?=\n|Address|TAN)/i);
    if (employerNameMatch) {
      result.employerName = employerNameMatch[1].trim();
      result.extractedFields.employerName = result.employerName;
      result.confidence += 6;
      console.log('✅ Employer Name:', result.employerName);
    }

    // Employer Address
    const employerAddressMatch = ocrText.match(/(?:Address of the Employer|Employer Address)\s*:?\s*(.+?)(?=\n\n|Financial|Assessment|$)/is);
    if (employerAddressMatch) {
      result.employerAddress = employerAddressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.employerAddress = result.employerAddress;
      result.confidence += 3;
      console.log('✅ Employer Address:', result.employerAddress.substring(0, 50) + '...');
    }

    // Financial Year
    const fyMatch = ocrText.match(/(?:Financial Year|FY)\s*:?\s*(\d{4}[-]\d{2,4})/i);
    if (fyMatch) {
      result.financialYear = fyMatch[1];
      result.extractedFields.financialYear = result.financialYear;
      result.confidence += 6;
      console.log('✅ Financial Year:', result.financialYear);
    }

    // Assessment Year
    const ayMatch = ocrText.match(/(?:Assessment Year|AY)\s*:?\s*(\d{4}[-]\d{2,4})/i);
    if (ayMatch) {
      result.assessmentYear = ayMatch[1];
      result.extractedFields.assessmentYear = result.assessmentYear;
      result.confidence += 6;
      console.log('✅ Assessment Year:', result.assessmentYear);
    }

    // Period
    const periodMatch = ocrText.match(/(?:Period|From)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s*(?:to|To)\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (periodMatch) {
      result.period = `${periodMatch[1]} to ${periodMatch[2]}`;
      result.extractedFields.period = result.period;
      result.confidence += 4;
      console.log('✅ Period:', result.period);
    }

    // Gross Salary
    const grossMatch = ocrText.match(/(?:Gross Salary|Total Salary)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (grossMatch) {
      result.grossSalary = grossMatch[1].replace(/,/g, '');
      result.extractedFields.grossSalary = result.grossSalary;
      result.confidence += 5;
      console.log('✅ Gross Salary:', result.grossSalary);
    }

    // Allowances
    const allowancesMatch = ocrText.match(/(?:Allowances to the extent exempt|Total Allowances|Exempt Allowances)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (allowancesMatch) {
      result.allowances = allowancesMatch[1].replace(/,/g, '');
      result.extractedFields.allowances = result.allowances;
      result.confidence += 4;
      console.log('✅ Allowances:', result.allowances);
    }

    // Deductions (Standard Deduction, Professional Tax)
    const deductionsMatch = ocrText.match(/(?:Deductions under section 16|Standard Deduction)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (deductionsMatch) {
      result.deductions = deductionsMatch[1].replace(/,/g, '');
      result.extractedFields.deductions = result.deductions;
      result.confidence += 4;
      console.log('✅ Deductions:', result.deductions);
    }

    // Total Income (Income chargeable under the head Salaries)
    const totalIncomeMatch = ocrText.match(/(?:Income chargeable under|Total Income|Income under Salaries)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (totalIncomeMatch) {
      result.totalIncome = totalIncomeMatch[1].replace(/,/g, '');
      result.extractedFields.totalIncome = result.totalIncome;
      result.confidence += 5;
      console.log('✅ Total Income:', result.totalIncome);
    }

    // Chapter VI-A Deductions
    const chapterVIAMatch = ocrText.match(/(?:Deductions under Chapter VI-A|Chapter VI-A|Total VI-A)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (chapterVIAMatch) {
      result.chapterVIADeductions = chapterVIAMatch[1].replace(/,/g, '');
      result.extractedFields.chapterVIADeductions = result.chapterVIADeductions;
      result.confidence += 4;
      console.log('✅ Chapter VI-A Deductions:', result.chapterVIADeductions);
    }

    // Taxable Income
    const taxableMatch = ocrText.match(/(?:Taxable Income|Total Taxable Income|Net Taxable Income)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (taxableMatch) {
      result.taxableIncome = taxableMatch[1].replace(/,/g, '');
      result.extractedFields.taxableIncome = result.taxableIncome;
      result.confidence += 5;
      console.log('✅ Taxable Income:', result.taxableIncome);
    }

    // Tax Calculated
    const taxCalcMatch = ocrText.match(/(?:Tax on total income|Income Tax|Tax Calculated)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (taxCalcMatch) {
      result.taxCalculated = taxCalcMatch[1].replace(/,/g, '');
      result.extractedFields.taxCalculated = result.taxCalculated;
      result.confidence += 4;
      console.log('✅ Tax Calculated:', result.taxCalculated);
    }

    // Surcharge
    const surchargeMatch = ocrText.match(/(?:Surcharge)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (surchargeMatch) {
      result.surcharge = surchargeMatch[1].replace(/,/g, '');
      result.extractedFields.surcharge = result.surcharge;
      result.confidence += 2;
      console.log('✅ Surcharge:', result.surcharge);
    }

    // Education Cess
    const cessMatch = ocrText.match(/(?:Education Cess|Health and Education Cess|Cess)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (cessMatch) {
      result.educationCess = cessMatch[1].replace(/,/g, '');
      result.extractedFields.educationCess = result.educationCess;
      result.confidence += 2;
      console.log('✅ Education Cess:', result.educationCess);
    }

    // Total Tax
    const totalTaxMatch = ocrText.match(/(?:Total Tax|Tax Payable|Total Tax Liability)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (totalTaxMatch) {
      result.totalTax = totalTaxMatch[1].replace(/,/g, '');
      result.extractedFields.totalTax = result.totalTax;
      result.confidence += 5;
      console.log('✅ Total Tax:', result.totalTax);
    }

    // TDS Deducted
    const tdsMatch = ocrText.match(/(?:Tax Deducted at Source|TDS|Total TDS)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (tdsMatch) {
      result.tdsDeducted = tdsMatch[1].replace(/,/g, '');
      result.extractedFields.tdsDeducted = result.tdsDeducted;
      result.confidence += 5;
      console.log('✅ TDS Deducted:', result.tdsDeducted);
    }

    // Certificate Number
    const certMatch = ocrText.match(/(?:Certificate No|Certificate Number)\s*:?\s*([A-Z0-9\/\-]+)/i);
    if (certMatch) {
      result.certificateNumber = certMatch[1];
      result.extractedFields.certificateNumber = result.certificateNumber;
      result.confidence += 4;
      console.log('✅ Certificate Number:', result.certificateNumber);
    }

    // Date of Issue
    const dateMatch = ocrText.match(/(?:Date of Issue|Issue Date|Date)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (dateMatch) {
      result.dateOfIssue = dateMatch[1];
      result.extractedFields.dateOfIssue = result.dateOfIssue;
      result.confidence += 3;
      console.log('✅ Date of Issue:', result.dateOfIssue);
    }

    console.log('📊 Form 16 extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
