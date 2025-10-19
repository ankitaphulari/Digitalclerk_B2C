// FILE 20: VehicleRCExtractor.ts (26 fields)
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface VehicleRCExtractionResult {
  registrationNumber?: string;
  registrationDate?: string;
  ownerName?: string;
  fathersHusbandsName?: string;
  address?: string;
  vehicleClass?: string;
  make?: string;
  model?: string;
  modelYear?: string;
  engineNumber?: string;
  chassisNumber?: string;
  fuelType?: string;
  color?: string;
  seatingCapacity?: string;
  cubicCapacity?: string;
  unladenWeight?: string;
  grossVehicleWeight?: string;
  dateOfPurchase?: string;
  financedBy?: string;
  hypothecationTo?: string;
  fitnessValidUpto?: string;
  insuranceValidUpto?: string;
  taxPaidUpto?: string;
  pollutionCertValidUpto?: string;
  rtoOffice?: string;
  state?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class VehicleRCExtractor {
  private static readonly HEADER_BLACKLIST = [
    'REGISTRATION CERTIFICATE',
    'VEHICLE REGISTRATION',
    'RC BOOK',
    'MOTOR VEHICLES ACT'
  ];

  static extractFromVehicleRC(ocrText: string): VehicleRCExtractionResult {
    const result: VehicleRCExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Vehicle RC - Processing');

    // Registration Number (e.g., MH12AB1234)
    const regNoMatch = ocrText.match(/\b([A-Z]{2}\s?[0-9]{1,2}\s?[A-Z]{1,2}\s?[0-9]{1,4})\b/);
    if (regNoMatch) {
      result.registrationNumber = regNoMatch[1].replace(/\s/g, '');
      result.extractedFields.registrationNumber = result.registrationNumber;
      result.confidence += 15;
      console.log('✅ Registration Number:', result.registrationNumber);
    }

    // Registration Date
    const regDateMatch = ocrText.match(/(?:Registration Date|Reg\.? Date|Date of Registration)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (regDateMatch) {
      result.registrationDate = regDateMatch[1];
      result.extractedFields.registrationDate = result.registrationDate;
      result.confidence += 8;
      console.log('✅ Registration Date:', result.registrationDate);
    }

    // Owner Name
    const nameMatch = ocrText.match(/(?:Owner'?s? Name|Owner Name|Name of Owner)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Father|S\/W\/D|Address)/i);
    if (nameMatch) {
      result.ownerName = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.ownerName = result.ownerName;
      result.confidence += 10;
      console.log('✅ Owner Name:', result.ownerName);
    }

    // Father's/Husband's Name
    const fatherMatch = ocrText.match(/(?:Father'?s? Name|Husband'?s? Name|S\/W\/D|Son of|Wife of|Daughter of)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Address|Vehicle)/i);
    if (fatherMatch) {
      result.fathersHusbandsName = formatNameForDisplay(fatherMatch[1]);
      result.extractedFields.fathersHusbandsName = result.fathersHusbandsName;
      result.confidence += 6;
      console.log('✅ Father/Husband Name:', result.fathersHusbandsName);
    }

    // Address
    const addressMatch = ocrText.match(/(?:Address|Present Address|Owner Address)\s*:?\s*(.+?)(?=\n\n|Vehicle Class|Make|Engine|$)/is);
    if (addressMatch) {
      result.address = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.address = result.address;
      result.confidence += 6;
      console.log('✅ Address:', result.address.substring(0, 50) + '...');
    }

    // Vehicle Class (MCWG, LMV, HMV, etc.)
    const classMatch = ocrText.match(/(?:Vehicle Class|Class of Vehicle|Veh\.? Class)\s*:?\s*([A-Z]{2,6})/i);
    if (classMatch) {
      result.vehicleClass = classMatch[1];
      result.extractedFields.vehicleClass = result.vehicleClass;
      result.confidence += 5;
      console.log('✅ Vehicle Class:', result.vehicleClass);
    }

    // Make (Manufacturer)
    const makeMatch = ocrText.match(/(?:Make|Maker'?s? Name|Manufacturer)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|Model|Engine)/i);
    if (makeMatch) {
      result.make = makeMatch[1].trim();
      result.extractedFields.make = result.make;
      result.confidence += 5;
      console.log('✅ Make:', result.make);
    }

    // Model
    const modelMatch = ocrText.match(/(?:Model|Vehicle Model)\s*:?\s*([A-Z0-9][A-Za-z0-9\s]+?)(?=\n|Year|Engine|Chassis)/i);
    if (modelMatch) {
      result.model = modelMatch[1].trim();
      result.extractedFields.model = result.model;
      result.confidence += 5;
      console.log('✅ Model:', result.model);
    }

    // Model Year
    const yearMatch = ocrText.match(/(?:Model Year|Year of Manufacture|Mfg\.? Year)\s*:?\s*(\d{4})/i);
    if (yearMatch) {
      result.modelYear = yearMatch[1];
      result.extractedFields.modelYear = result.modelYear;
      result.confidence += 4;
      console.log('✅ Model Year:', result.modelYear);
    }

    // Engine Number
    const engineMatch = ocrText.match(/(?:Engine No|Engine Number|E No)\s*:?\s*([A-Z0-9]+)/i);
    if (engineMatch) {
      result.engineNumber = engineMatch[1];
      result.extractedFields.engineNumber = result.engineNumber;
      result.confidence += 5;
      console.log('✅ Engine Number:', result.engineNumber);
    }

    // Chassis Number
    const chassisMatch = ocrText.match(/(?:Chassis No|Chassis Number|C No|VIN)\s*:?\s*([A-Z0-9]+)/i);
    if (chassisMatch) {
      result.chassisNumber = chassisMatch[1];
      result.extractedFields.chassisNumber = result.chassisNumber;
      result.confidence += 5;
      console.log('✅ Chassis Number:', result.chassisNumber);
    }

    // Fuel Type
    const fuelMatch = ocrText.match(/(?:Fuel Type|Fuel)\s*:?\s*(Petrol|Diesel|CNG|Electric|LPG|Hybrid)/i);
    if (fuelMatch) {
      result.fuelType = fuelMatch[1];
      result.extractedFields.fuelType = result.fuelType;
      result.confidence += 4;
      console.log('✅ Fuel Type:', result.fuelType);
    }

    // Color
    const colorMatch = ocrText.match(/(?:Color|Colour)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|Seating|Capacity)/i);
    if (colorMatch) {
      result.color = colorMatch[1].trim();
      result.extractedFields.color = result.color;
      result.confidence += 3;
      console.log('✅ Color:', result.color);
    }

    // Seating Capacity
    const seatingMatch = ocrText.match(/(?:Seating Capacity|Seat Capacity|No\.? of Seats)\s*:?\s*(\d{1,3})/i);
    if (seatingMatch) {
      result.seatingCapacity = seatingMatch[1];
      result.extractedFields.seatingCapacity = result.seatingCapacity;
      result.confidence += 3;
      console.log('✅ Seating Capacity:', result.seatingCapacity);
    }

    // Cubic Capacity (CC)
    const ccMatch = ocrText.match(/(?:Cubic Capacity|CC|Engine Capacity)\s*:?\s*([\d,]+)\s*(?:CC)?/i);
    if (ccMatch) {
      result.cubicCapacity = ccMatch[1].replace(/,/g, '');
      result.extractedFields.cubicCapacity = result.cubicCapacity;
      result.confidence += 3;
      console.log('✅ Cubic Capacity:', result.cubicCapacity);
    }

    // Unladen Weight
    const unladenMatch = ocrText.match(/(?:Unladen Weight|ULW)\s*:?\s*([\d,]+)\s*(?:kg|KG)?/i);
    if (unladenMatch) {
      result.unladenWeight = unladenMatch[1].replace(/,/g, '');
      result.extractedFields.unladenWeight = result.unladenWeight;
      result.confidence += 2;
      console.log('✅ Unladen Weight:', result.unladenWeight);
    }

    // Gross Vehicle Weight
    const gvwMatch = ocrText.match(/(?:Gross Vehicle Weight|GVW)\s*:?\s*([\d,]+)\s*(?:kg|KG)?/i);
    if (gvwMatch) {
      result.grossVehicleWeight = gvwMatch[1].replace(/,/g, '');
      result.extractedFields.grossVehicleWeight = result.grossVehicleWeight;
      result.confidence += 2;
      console.log('✅ Gross Vehicle Weight:', result.grossVehicleWeight);
    }

    // Date of Purchase
    const purchaseDateMatch = ocrText.match(/(?:Date of Purchase|Purchase Date)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (purchaseDateMatch) {
      result.dateOfPurchase = purchaseDateMatch[1];
      result.extractedFields.dateOfPurchase = result.dateOfPurchase;
      result.confidence += 3;
      console.log('✅ Date of Purchase:', result.dateOfPurchase);
    }

    // Financed By
    const financedMatch = ocrText.match(/(?:Financed By|Financier)\s*:?\s*([A-Z][A-Za-z\s&]+?)(?=\n|Hypothecation|Fitness)/i);
    if (financedMatch) {
      result.financedBy = financedMatch[1].trim();
      result.extractedFields.financedBy = result.financedBy;
      result.confidence += 3;
      console.log('✅ Financed By:', result.financedBy);
    }

    // Hypothecation To (same as Financed By often)
    const hypothecationMatch = ocrText.match(/(?:Hypothecation To|HP To)\s*:?\s*([A-Z][A-Za-z\s&]+?)(?=\n|Fitness|Insurance)/i);
    if (hypothecationMatch) {
      result.hypothecationTo = hypothecationMatch[1].trim();
      result.extractedFields.hypothecationTo = result.hypothecationTo;
      result.confidence += 3;
      console.log('✅ Hypothecation To:', result.hypothecationTo);
    }

    // Fitness Valid Upto
    const fitnessMatch = ocrText.match(/(?:Fitness Valid Upto|Fitness Upto|FV Upto)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (fitnessMatch) {
      result.fitnessValidUpto = fitnessMatch[1];
      result.extractedFields.fitnessValidUpto = result.fitnessValidUpto;
      result.confidence += 3;
      console.log('✅ Fitness Valid Upto:', result.fitnessValidUpto);
    }

    // Insurance Valid Upto
    const insuranceMatch = ocrText.match(/(?:Insurance Valid Upto|Insurance Upto|IV Upto)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (insuranceMatch) {
      result.insuranceValidUpto = insuranceMatch[1];
      result.extractedFields.insuranceValidUpto = result.insuranceValidUpto;
      result.confidence += 4;
      console.log('✅ Insurance Valid Upto:', result.insuranceValidUpto);
    }

    // Tax Paid Upto
    const taxMatch = ocrText.match(/(?:Tax Paid Upto|Tax Valid Upto|Tax Upto)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (taxMatch) {
      result.taxPaidUpto = taxMatch[1];
      result.extractedFields.taxPaidUpto = result.taxPaidUpto;
      result.confidence += 3;
      console.log('✅ Tax Paid Upto:', result.taxPaidUpto);
    }

    // Pollution Certificate Valid Upto
    const pollutionMatch = ocrText.match(/(?:Pollution Certificate|PUCC|PUC Valid Upto)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (pollutionMatch) {
      result.pollutionCertValidUpto = pollutionMatch[1];
      result.extractedFields.pollutionCertValidUpto = result.pollutionCertValidUpto;
      result.confidence += 3;
      console.log('✅ Pollution Cert Valid Upto:', result.pollutionCertValidUpto);
    }

    // RTO Office
    const rtoMatch = ocrText.match(/(?:RTO Office|Registering Authority|RTO)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|State|$)/i);
    if (rtoMatch) {
      result.rtoOffice = rtoMatch[1].trim();
      result.extractedFields.rtoOffice = result.rtoOffice;
      result.confidence += 4;
      console.log('✅ RTO Office:', result.rtoOffice);
    }

    // State
    const stateMatch = ocrText.match(/(?:State|Registered State)\s*:?\s*([A-Z][A-Za-z\s]+?)(?=\n|$)/i);
    if (stateMatch) {
      result.state = stateMatch[1].trim();
      result.extractedFields.state = result.state;
      result.confidence += 4;
      console.log('✅ State:', result.state);
    }

    console.log('📊 Vehicle RC extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
