// FILE 11: SalarySlipExtractor.ts (MOST COMPLEX - 28 fields)
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface SalarySlipExtractionResult {
  employeeId?: string;
  employeeName?: string;
  designation?: string;
  department?: string;
  dateOfJoining?: string;
  pan?: string;
  bankAccount?: string;
  ifscCode?: string;
  payPeriod?: string;
  workingDays?: string;
  daysPresent?: string;
  leaveTaken?: string;
  basicSalary?: string;
  hra?: string;
  da?: string;
  conveyanceAllowance?: string;
  medicalAllowance?: string;
  otherAllowances?: string;
  grossSalary?: string;
  pfDeduction?: string;
  esiDeduction?: string;
  professionalTax?: string;
  tds?: string;
  otherDeductions?: string;
  totalDeductions?: string;
  netSalary?: string;
  companyName?: string;
  companyAddress?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class SalarySlipExtractor {
  private static readonly HEADER_BLACKLIST = [
    'SALARY SLIP',
    'PAY SLIP',
    'PAYSLIP',
    'SALARY STATEMENT'
  ];

  static extractFromSalarySlip(ocrText: string): SalarySlipExtractionResult {
    const result: SalarySlipExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Salary Slip - Processing');

    // Employee ID
    const empIdMatch = ocrText.match(/(?:Employee ID|Emp ID|Employee Code|Emp Code|Employee No)\s*:?\s*([A-Z0-9]+)/i);
    if (empIdMatch) {
      result.employeeId = empIdMatch[1];
      result.extractedFields.employeeId = result.employeeId;
      result.confidence += 5;
      console.log('✅ Employee ID:', result.employeeId);
    }

    // Employee Name
    const nameMatch = ocrText.match(/(?:Employee Name|Name|Emp Name)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Designation|Employee ID|Department)/i);
    if (nameMatch) {
      result.employeeName = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.employeeName = result.employeeName;
      result.confidence += 5;
      console.log('✅ Employee Name:', result.employeeName);
    }

    // Designation
    const designationMatch = ocrText.match(/(?:Designation|Position|Role|Job Title)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|Department|Employee)/i);
    if (designationMatch) {
      result.designation = designationMatch[1].trim();
      result.extractedFields.designation = result.designation;
      result.confidence += 3;
      console.log('✅ Designation:', result.designation);
    }

    // Department
    const deptMatch = ocrText.match(/(?:Department|Dept)\s*:?\s*([A-Z][A-Za-z\s&]+?)(?=\n|Date|Pay)/i);
    if (deptMatch) {
      result.department = deptMatch[1].trim();
      result.extractedFields.department = result.department;
      result.confidence += 3;
      console.log('✅ Department:', result.department);
    }

    // Date of Joining
    const dojMatch = ocrText.match(/(?:Date of Joining|DOJ|Joining Date)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (dojMatch) {
      result.dateOfJoining = dojMatch[1];
      result.extractedFields.dateOfJoining = result.dateOfJoining;
      result.confidence += 3;
      console.log('✅ Date of Joining:', result.dateOfJoining);
    }

    // PAN
    const panMatch = ocrText.match(/(?:PAN|PAN No)\s*:?\s*([A-Z]{5}\d{4}[A-Z])/i);
    if (panMatch) {
      result.pan = panMatch[1];
      result.extractedFields.pan = result.pan;
      result.confidence += 4;
      console.log('✅ PAN:', result.pan);
    }

    // Bank Account
    const bankAccountMatch = ocrText.match(/(?:Bank Account|Account No|A\/C No)\s*:?\s*(\d{9,18})/i);
    if (bankAccountMatch) {
      result.bankAccount = bankAccountMatch[1];
      result.extractedFields.bankAccount = result.bankAccount;
      result.confidence += 3;
      console.log('✅ Bank Account:', result.bankAccount);
    }

    // IFSC Code
    const ifscMatch = ocrText.match(/(?:IFSC|IFSC Code)\s*:?\s*([A-Z]{4}0[A-Z0-9]{6})/i);
    if (ifscMatch) {
      result.ifscCode = ifscMatch[1];
      result.extractedFields.ifscCode = result.ifscCode;
      result.confidence += 3;
      console.log('✅ IFSC Code:', result.ifscCode);
    }

    // Pay Period
    const periodMatch = ocrText.match(/(?:Pay Period|Month|For the Month of|Salary Month)\s*:?\s*([A-Za-z]+[\s-]\d{4})/i);
    if (periodMatch) {
      result.payPeriod = periodMatch[1];
      result.extractedFields.payPeriod = result.payPeriod;
      result.confidence += 4;
      console.log('✅ Pay Period:', result.payPeriod);
    }

    // Working Days
    const workingDaysMatch = ocrText.match(/(?:Working Days|Total Days|Days in Month)\s*:?\s*(\d{1,2})/i);
    if (workingDaysMatch) {
      result.workingDays = workingDaysMatch[1];
      result.extractedFields.workingDays = result.workingDays;
      result.confidence += 2;
      console.log('✅ Working Days:', result.workingDays);
    }

    // Days Present
    const daysPresentMatch = ocrText.match(/(?:Days Present|Present Days|Paid Days)\s*:?\s*(\d{1,2}\.?\d*)/i);
    if (daysPresentMatch) {
      result.daysPresent = daysPresentMatch[1];
      result.extractedFields.daysPresent = result.daysPresent;
      result.confidence += 2;
      console.log('✅ Days Present:', result.daysPresent);
    }

    // Leave Taken
    const leaveMatch = ocrText.match(/(?:Leave Taken|Leaves|LOP|Loss of Pay)\s*:?\s*(\d{1,2}\.?\d*)/i);
    if (leaveMatch) {
      result.leaveTaken = leaveMatch[1];
      result.extractedFields.leaveTaken = result.leaveTaken;
      result.confidence += 2;
      console.log('✅ Leave Taken:', result.leaveTaken);
    }

    // Basic Salary
    const basicMatch = ocrText.match(/(?:Basic Salary|Basic Pay|Basic)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (basicMatch) {
      result.basicSalary = basicMatch[1].replace(/,/g, '');
      result.extractedFields.basicSalary = result.basicSalary;
      result.confidence += 4;
      console.log('✅ Basic Salary:', result.basicSalary);
    }

    // HRA
    const hraMatch = ocrText.match(/(?:HRA|House Rent Allowance)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (hraMatch) {
      result.hra = hraMatch[1].replace(/,/g, '');
      result.extractedFields.hra = result.hra;
      result.confidence += 3;
      console.log('✅ HRA:', result.hra);
    }

    // DA (Dearness Allowance)
    const daMatch = ocrText.match(/(?:DA|Dearness Allowance)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (daMatch) {
      result.da = daMatch[1].replace(/,/g, '');
      result.extractedFields.da = result.da;
      result.confidence += 3;
      console.log('✅ DA:', result.da);
    }

    // Conveyance Allowance
    const conveyanceMatch = ocrText.match(/(?:Conveyance|Conveyance Allowance|Transport Allowance)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (conveyanceMatch) {
      result.conveyanceAllowance = conveyanceMatch[1].replace(/,/g, '');
      result.extractedFields.conveyanceAllowance = result.conveyanceAllowance;
      result.confidence += 2;
      console.log('✅ Conveyance Allowance:', result.conveyanceAllowance);
    }

    // Medical Allowance
    const medicalMatch = ocrText.match(/(?:Medical Allowance|Medical)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (medicalMatch) {
      result.medicalAllowance = medicalMatch[1].replace(/,/g, '');
      result.extractedFields.medicalAllowance = result.medicalAllowance;
      result.confidence += 2;
      console.log('✅ Medical Allowance:', result.medicalAllowance);
    }

    // Other Allowances
    const otherAllowMatch = ocrText.match(/(?:Other Allowances?|Special Allowance|Additional Allowance)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (otherAllowMatch) {
      result.otherAllowances = otherAllowMatch[1].replace(/,/g, '');
      result.extractedFields.otherAllowances = result.otherAllowances;
      result.confidence += 2;
      console.log('✅ Other Allowances:', result.otherAllowances);
    }

    // Gross Salary
    const grossMatch = ocrText.match(/(?:Gross Salary|Gross Pay|Total Earnings)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (grossMatch) {
      result.grossSalary = grossMatch[1].replace(/,/g, '');
      result.extractedFields.grossSalary = result.grossSalary;
      result.confidence += 5;
      console.log('✅ Gross Salary:', result.grossSalary);
    }

    // PF Deduction
    const pfMatch = ocrText.match(/(?:PF|Provident Fund|EPF)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (pfMatch) {
      result.pfDeduction = pfMatch[1].replace(/,/g, '');
      result.extractedFields.pfDeduction = result.pfDeduction;
      result.confidence += 3;
      console.log('✅ PF Deduction:', result.pfDeduction);
    }

    // ESI Deduction
    const esiMatch = ocrText.match(/(?:ESI|ESIC)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (esiMatch) {
      result.esiDeduction = esiMatch[1].replace(/,/g, '');
      result.extractedFields.esiDeduction = result.esiDeduction;
      result.confidence += 2;
      console.log('✅ ESI Deduction:', result.esiDeduction);
    }

    // Professional Tax
    const ptMatch = ocrText.match(/(?:Professional Tax|PT|Prof\.? Tax)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (ptMatch) {
      result.professionalTax = ptMatch[1].replace(/,/g, '');
      result.extractedFields.professionalTax = result.professionalTax;
      result.confidence += 2;
      console.log('✅ Professional Tax:', result.professionalTax);
    }

    // TDS
    const tdsMatch = ocrText.match(/(?:TDS|Tax Deducted at Source|Income Tax)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (tdsMatch) {
      result.tds = tdsMatch[1].replace(/,/g, '');
      result.extractedFields.tds = result.tds;
      result.confidence += 3;
      console.log('✅ TDS:', result.tds);
    }

    // Other Deductions
    const otherDedMatch = ocrText.match(/(?:Other Deductions?)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (otherDedMatch) {
      result.otherDeductions = otherDedMatch[1].replace(/,/g, '');
      result.extractedFields.otherDeductions = result.otherDeductions;
      result.confidence += 2;
      console.log('✅ Other Deductions:', result.otherDeductions);
    }

    // Total Deductions
    const totalDedMatch = ocrText.match(/(?:Total Deductions?|Total Ded)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (totalDedMatch) {
      result.totalDeductions = totalDedMatch[1].replace(/,/g, '');
      result.extractedFields.totalDeductions = result.totalDeductions;
      result.confidence += 4;
      console.log('✅ Total Deductions:', result.totalDeductions);
    }

    // Net Salary
    const netMatch = ocrText.match(/(?:Net Salary|Net Pay|Take Home|Net Amount)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (netMatch) {
      result.netSalary = netMatch[1].replace(/,/g, '');
      result.extractedFields.netSalary = result.netSalary;
      result.confidence += 6;
      console.log('✅ Net Salary:', result.netSalary);
    }

    // Company Name
    const companyMatch = ocrText.match(/^([A-Z][A-Za-z\s&]+(?:Pvt\.? Ltd\.?|Limited|Inc\.?|Corporation|Company))/im);
    if (companyMatch) {
      result.companyName = companyMatch[1].trim();
      result.extractedFields.companyName = result.companyName;
      result.confidence += 4;
      console.log('✅ Company Name:', result.companyName);
    }

    // Company Address
    const companyAddressMatch = ocrText.match(/(?:Address|Corporate Office|Registered Office)\s*:?\s*(.+?)(?=\n\n|Employee|Pay|$)/is);
    if (companyAddressMatch) {
      result.companyAddress = companyAddressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.companyAddress = result.companyAddress;
      result.confidence += 2;
      console.log('✅ Company Address:', result.companyAddress.substring(0, 50) + '...');
    }

    console.log('📊 Salary Slip extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
