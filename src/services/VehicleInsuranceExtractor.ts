// FILE 21: VehicleInsuranceExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface VehicleInsuranceExtractionResult {
  policyNumber?: string;
  insuranceType?: string;
  insuranceCompany?: string;
  policyHolderName?: string;
  address?: string;
  vehicleRegistrationNumber?: string;
  makeModel?: string;
  engineNumber?: string;
  chassisNumber?: string;
  yearOfManufacture?: string;
  policyIssueDate?: string;
  policyStartDate?: string;
  policyExpiryDate?: string;
  idv?: string;
  premiumAmount?: string;
  gstAmount?: string;
  totalPremium?: string;
  coverage?: string;
  addons?: string[];
  ncb?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class VehicleInsuranceExtractor {
  private static readonly HEADER_BLACKLIST = [
    'VEHICLE INSURANCE',
    'MOTOR INSURANCE',
    'INSURANCE POLICY',
    'CERTIFICATE OF INSURANCE'
  ];

  static extractFromVehicleInsurance(ocrText: string): VehicleInsuranceExtractionResult {
    const result: VehicleInsuranceExtractionResult = {
      confidence: 0,
      extractedFields: {},
      addons: []
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Vehicle Insurance - Processing');

    // Policy Number
    const policyMatch = ocrText.match(/(?:Policy No|Policy Number|Certificate No)\s*:?\s*([A-Z0-9\-\/]+)/i);
    if (policyMatch) {
      result.policyNumber = policyMatch[1];
      result.extractedFields.policyNumber = result.policyNumber;
      result.confidence += 15;
      console.log('✅ Policy Number:', result.policyNumber);
    }

    // Insurance Type
    const typeMatch = ocrText.match(/(?:Insurance Type|Type of Coverage|Policy Type)\s*:?\s*(Comprehensive|Third Party|Third-Party|TP)/i);
    if (typeMatch) {
      result.insuranceType = typeMatch[1];
      result.extractedFields.insuranceType = result.insuranceType;
      result.confidence += 8;
      console.log('✅ Insurance Type:', result.insuranceType);
    }

    // Insurance Company
    const companyMatch = ocrText.match(/(ICICI Lombard|HDFC ERGO|Bajaj Allianz|Reliance General|New India Assurance|National Insurance|Oriental Insurance|United India Insurance|TATA AIG|Royal Sundaram|Digit Insurance|Acko|Go Digit)/i);
    if (companyMatch) {
      result.insuranceCompany = companyMatch[1];
      result.extractedFields.insuranceCompany = result.insuranceCompany;
      result.confidence += 8;
      console.log('✅ Insurance Company:', result.insuranceCompany);
    }

    // Policy Holder Name
    const nameMatch = ocrText.match(/(?:Policy Holder|Insured Name|Name of Insured|Owner Name)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Address|Vehicle)/i);
    if (nameMatch) {
      result.policyHolderName = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.policyHolderName = result.policyHolderName;
      result.confidence += 10;
      console.log('✅ Policy Holder Name:', result.policyHolderName);
    }

    // Address
    const addressMatch = ocrText.match(/(?:Address|Insured Address)\s*:?\s*(.+?)(?=\n\n|Vehicle|Registration|Policy|$)/is);
    if (addressMatch) {
      result.address = addressMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.address = result.address;
      result.confidence += 6;
      console.log('✅ Address:', result.address.substring(0, 50) + '...');
    }

    // Vehicle Registration Number
    const regNoMatch = ocrText.match(/(?:Registration No|Reg\.? No|Vehicle No)\s*:?\s*([A-Z]{2}\s?[0-9]{1,2}\s?[A-Z]{1,2}\s?[0-9]{1,4})/i);
    if (regNoMatch) {
      result.vehicleRegistrationNumber = regNoMatch[1].replace(/\s/g, '');
      result.extractedFields.vehicleRegistrationNumber = result.vehicleRegistrationNumber;
      result.confidence += 10;
      console.log('✅ Vehicle Registration Number:', result.vehicleRegistrationNumber);
    }

    // Make and Model
    const makeModelMatch = ocrText.match(/(?:Make & Model|Make and Model|Vehicle Make|Make\/Model)\s*:?\s*([A-Z][A-Za-z0-9\s]+?)(?=\n|Engine|Chassis)/i);
    if (makeModelMatch) {
      result.makeModel = makeModelMatch[1].trim();
      result.extractedFields.makeModel = result.makeModel;
      result.confidence += 8;
      console.log('✅ Make & Model:', result.makeModel);
    }

    // Engine Number
    const engineMatch = ocrText.match(/(?:Engine No|Engine Number)\s*:?\s*([A-Z0-9]+)/i);
    if (engineMatch) {
      result.engineNumber = engineMatch[1];
      result.extractedFields.engineNumber = result.engineNumber;
      result.confidence += 5;
      console.log('✅ Engine Number:', result.engineNumber);
    }

    // Chassis Number
    const chassisMatch = ocrText.match(/(?:Chassis No|Chassis Number)\s*:?\s*([A-Z0-9]+)/i);
    if (chassisMatch) {
      result.chassisNumber = chassisMatch[1];
      result.extractedFields.chassisNumber = result.chassisNumber;
      result.confidence += 5;
      console.log('✅ Chassis Number:', result.chassisNumber);
    }

    // Year of Manufacture
    const yearMatch = ocrText.match(/(?:Year of Manufacture|Mfg\.? Year|Manufacturing Year)\s*:?\s*(\d{4})/i);
    if (yearMatch) {
      result.yearOfManufacture = yearMatch[1];
      result.extractedFields.yearOfManufacture = result.yearOfManufacture;
      result.confidence += 4;
      console.log('✅ Year of Manufacture:', result.yearOfManufacture);
    }

    // Policy Issue Date
    const issueDateMatch = ocrText.match(/(?:Policy Issue Date|Issue Date|Date of Issue)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (issueDateMatch) {
      result.policyIssueDate = issueDateMatch[1];
      result.extractedFields.policyIssueDate = result.policyIssueDate;
      result.confidence += 5;
      console.log('✅ Policy Issue Date:', result.policyIssueDate);
    }

    // Policy Start Date
    const startDateMatch = ocrText.match(/(?:Policy Start Date|Start Date|Effective From|Period From)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (startDateMatch) {
      result.policyStartDate = startDateMatch[1];
      result.extractedFields.policyStartDate = result.policyStartDate;
      result.confidence += 6;
      console.log('✅ Policy Start Date:', result.policyStartDate);
    }

    // Policy Expiry Date
    const expiryDateMatch = ocrText.match(/(?:Policy Expiry Date|Expiry Date|Valid Till|Period To)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (expiryDateMatch) {
      result.policyExpiryDate = expiryDateMatch[1];
      result.extractedFields.policyExpiryDate = result.policyExpiryDate;
      result.confidence += 6;
      console.log('✅ Policy Expiry Date:', result.policyExpiryDate);
    }

    // IDV (Insured Declared Value)
    const idvMatch = ocrText.match(/(?:IDV|Insured Declared Value|Vehicle Value)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (idvMatch) {
      result.idv = idvMatch[1].replace(/,/g, '');
      result.extractedFields.idv = result.idv;
      result.confidence += 5;
      console.log('✅ IDV:', result.idv);
    }

    // Premium Amount
    const premiumMatch = ocrText.match(/(?:Premium Amount|Net Premium|Basic Premium)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (premiumMatch) {
      result.premiumAmount = premiumMatch[1].replace(/,/g, '');
      result.extractedFields.premiumAmount = result.premiumAmount;
      result.confidence += 6;
      console.log('✅ Premium Amount:', result.premiumAmount);
    }

    // GST Amount
    const gstMatch = ocrText.match(/(?:GST|GST Amount|Tax)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (gstMatch) {
      result.gstAmount = gstMatch[1].replace(/,/g, '');
      result.extractedFields.gstAmount = result.gstAmount;
      result.confidence += 4;
      console.log('✅ GST Amount:', result.gstAmount);
    }

    // Total Premium
    const totalMatch = ocrText.match(/(?:Total Premium|Final Premium|Amount Payable)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (totalMatch) {
      result.totalPremium = totalMatch[1].replace(/,/g, '');
      result.extractedFields.totalPremium = result.totalPremium;
      result.confidence += 7;
      console.log('✅ Total Premium:', result.totalPremium);
    }

    // Coverage
    const coverageMatch = ocrText.match(/(?:Coverage|Sum Insured|Cover Amount)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i);
    if (coverageMatch) {
      result.coverage = coverageMatch[1].replace(/,/g, '');
      result.extractedFields.coverage = result.coverage;
      result.confidence += 4;
      console.log('✅ Coverage:', result.coverage);
    }

    // Add-ons (Zero Dep, Engine Protection, etc.)
    const addonPatterns = [
      /Zero Depreciation|Zero Dep/i,
      /Engine Protection|Engine Cover/i,
      /Return to Invoice|RTI/i,
      /Road Side Assistance|RSA/i,
      /NCB Protection/i,
      /Key Replacement/i,
      /Consumables Cover/i
    ];
    
    addonPatterns.forEach(pattern => {
      const match = ocrText.match(pattern);
      if (match) {
        result.addons!.push(match[0]);
      }
    });
    
    if (result.addons!.length > 0) {
      result.extractedFields.addons = result.addons;
      result.confidence += 3;
      console.log('✅ Add-ons:', result.addons!.join(', '));
    }

    // NCB (No Claim Bonus)
    const ncbMatch = ocrText.match(/(?:NCB|No Claim Bonus)\s*:?\s*(\d{1,3})\s*%/i);
    if (ncbMatch) {
      result.ncb = ncbMatch[1] + '%';
      result.extractedFields.ncb = result.ncb;
      result.confidence += 4;
      console.log('✅ NCB:', result.ncb);
    }

    // Nominee Name
    const nomineeMatch = ocrText.match(/(?:Nominee Name|Nominee)\s*:?\s*([A-Z][A-Z\s]+?)(?=\n|Relation|Age)/i);
    if (nomineeMatch) {
      result.nomineeName = formatNameForDisplay(nomineeMatch[1]);
      result.extractedFields.nomineeName = result.nomineeName;
      result.confidence += 3;
      console.log('✅ Nominee Name:', result.nomineeName);
    }

    // Nominee Relation
    const relationMatch = ocrText.match(/(?:Nominee Relation|Relationship)\s*:?\s*(Father|Mother|Brother|Sister|Son|Daughter|Wife|Husband|Spouse)/i);
    if (relationMatch) {
      result.nomineeRelation = relationMatch[1];
      result.extractedFields.nomineeRelation = result.nomineeRelation;
      result.confidence += 2;
      console.log('✅ Nominee Relation:', result.nomineeRelation);
    }

    console.log('📊 Vehicle Insurance extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
