// NEW: Complete Driving License extraction with ALL 12 fields
// Extracts: DL Number, Name, Father/Husband, DOB, Blood Group, Address, Validity, Vehicle Classes, etc.

import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface DrivingLicenseExtractionResult {
  dlNumber?: string; // XX-99-9999-9999999
  name?: string;
  fathersName?: string;
  husbandsName?: string;
  dob?: string;
  bloodGroup?: string;
  address?: string;
  dateOfIssue?: string;
  validTill?: string;
  vehicleClass?: string[];
  authorizationToDrive?: string;
  covIssueDate?: string;
  emergencyContact?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class DrivingLicenseExtractor {
  private static readonly HEADER_BLACKLIST = [
    'DRIVING LICENCE',
    'DRIVING LICENSE',
    'TRANSPORT DEPARTMENT',
    'GOVERNMENT OF',
    'MINISTRY OF ROAD TRANSPORT'
  ];

  private static readonly VEHICLE_CLASSES = [
    'MCWG', 'MCWOG', 'LMV', 'LMV-NT', 'HMV', 'TRANS',
    'MGV', 'LTV', 'HTV', 'HPMV', 'HGMV'
  ];

  static extractFromDrivingLicense(ocrText: string): DrivingLicenseExtractionResult {
    const result: DrivingLicenseExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    console.log('📋 Driving License - Processing');

    // 1. DL Number
    const dlNumber = this.extractDLNumber(ocrText);
    if (dlNumber) {
      result.dlNumber = dlNumber;
      result.extractedFields.dlNumber = dlNumber;
      result.extractedFields.dl_number = dlNumber;
      result.extractedFields.licenseNumber = dlNumber;
      result.confidence += 35;
      console.log('✅ DL Number:', dlNumber);
    }

    // 2. Name
    const name = this.extractName(ocrText);
    if (name) {
      result.name = name;
      result.extractedFields.name = name;
      result.extractedFields.fullName = name;
      result.confidence += 15;
      console.log('✅ Name:', name);
    }

    // 3. Father's/Husband's Name
    const parentalData = this.extractParentalNames(ocrText);
    if (parentalData.fathersName) {
      result.fathersName = parentalData.fathersName;
      result.extractedFields.fathersName = parentalData.fathersName;
      result.confidence += 10;
      console.log('✅ Father\'s Name:', parentalData.fathersName);
    }
    if (parentalData.husbandsName) {
      result.husbandsName = parentalData.husbandsName;
      result.extractedFields.husbandsName = parentalData.husbandsName;
      result.confidence += 10;
      console.log('✅ Husband\'s Name:', parentalData.husbandsName);
    }

    // 4. DOB
    const dob = this.extractDOB(ocrText);
    if (dob) {
      result.dob = dob;
      result.extractedFields.dob = dob;
      result.extractedFields.dateOfBirth = dob;
      result.confidence += 15;
      console.log('✅ DOB:', dob);
    }

    // 5. Blood Group
    const bloodGroup = this.extractBloodGroup(ocrText);
    if (bloodGroup) {
      result.bloodGroup = bloodGroup;
      result.extractedFields.bloodGroup = bloodGroup;
      result.extractedFields.blood_group = bloodGroup;
      result.confidence += 5;
      console.log('✅ Blood Group:', bloodGroup);
    }

    // 6. Address
    const address = this.extractAddress(ocrText);
    if (address) {
      result.address = address;
      result.extractedFields.address = address;
      result.confidence += 10;
      console.log('✅ Address:', address.substring(0, 50) + '...');
    }

    // 7. Date of Issue
    const dateOfIssue = this.extractDateOfIssue(ocrText);
    if (dateOfIssue) {
      result.dateOfIssue = dateOfIssue;
      result.extractedFields.dateOfIssue = dateOfIssue;
      result.extractedFields.issueDate = dateOfIssue;
      result.confidence += 5;
      console.log('✅ Date of Issue:', dateOfIssue);
    }

    // 8. Valid Till
    const validTill = this.extractValidTill(ocrText);
    if (validTill) {
      result.validTill = validTill;
      result.extractedFields.validTill = validTill;
      result.extractedFields.expiryDate = validTill;
      result.confidence += 5;
      console.log('✅ Valid Till:', validTill);
    }

    // 9. Vehicle Class
    const vehicleClass = this.extractVehicleClass(ocrText);
    if (vehicleClass && vehicleClass.length > 0) {
      result.vehicleClass = vehicleClass;
      result.extractedFields.vehicleClass = vehicleClass;
      result.extractedFields.vehicle_class = vehicleClass.join(', ');
      console.log('✅ Vehicle Class:', vehicleClass.join(', '));
    }

    // 10. Authorization to Drive
    const authorization = this.extractAuthorization(ocrText);
    if (authorization) {
      result.authorizationToDrive = authorization;
      result.extractedFields.authorizationToDrive = authorization;
      console.log('✅ Authorization:', authorization);
    }

    // 11. COV Issue Date
    const covIssueDate = this.extractCOVIssueDate(ocrText);
    if (covIssueDate) {
      result.covIssueDate = covIssueDate;
      result.extractedFields.covIssueDate = covIssueDate;
      console.log('✅ COV Issue Date:', covIssueDate);
    }

    // 12. Emergency Contact
    const emergencyContact = this.extractEmergencyContact(ocrText);
    if (emergencyContact) {
      result.emergencyContact = emergencyContact;
      result.extractedFields.emergencyContact = emergencyContact;
      console.log('✅ Emergency Contact:', emergencyContact);
    }

    console.log('📊 Driving License extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  private static extractDLNumber(text: string): string | null {
    const patterns = [
      /(?:DL|Licence|License)\s*(?:No|Number)?\s*:?\s*([A-Z]{2}-\d{2}-\d{4}-\d{7})/gi,
      /\b([A-Z]{2}-\d{2}-\d{4}-\d{7})\b/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const dlNum = match[1] || match[0];
        if (/^[A-Z]{2}-\d{2}-\d{4}-\d{7}$/.test(dlNum)) {
          return dlNum;
        }
      }
    }

    return null;
  }

  private static extractName(text: string): string | null {
    const patterns = [
      /(?:Name|Holder)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const name = match[1].trim();
        if (!this.isHeaderLine(name)) {
          return formatNameForDisplay(name);
        }
      }
    }

    return null;
  }

  private static extractParentalNames(text: string): {
    fathersName?: string;
    husbandsName?: string;
  } {
    const result: any = {};

    const fatherPatterns = [
      /(?:Father|S\/O|Son of|Daughter of)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i
    ];

    for (const pattern of fatherPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.fathersName = formatNameForDisplay(match[1].trim());
        break;
      }
    }

    const husbandPatterns = [
      /(?:Husband|W\/O|Wife of)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i
    ];

    for (const pattern of husbandPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.husbandsName = formatNameForDisplay(match[1].trim());
        break;
      }
    }

    return result;
  }

  private static extractDOB(text: string): string | null {
    const patterns = [
      /(?:DOB|Date of Birth)\s*:?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private static extractBloodGroup(text: string): string | null {
    const patterns = [
      /(?:Blood Group|BG)\s*:?\s*(A\+|A-|B\+|B-|O\+|O-|AB\+|AB-)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].toUpperCase();
      }
    }

    return null;
  }

  private static extractAddress(text: string): string | null {
    const patterns = [
      /(?:Address)\s*:?\s*(.{20,300}?)(?=\n\n|Date|Valid|DL)/is
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().replace(/\s+/g, ' ');
      }
    }

    return null;
  }

  private static extractDateOfIssue(text: string): string | null {
    const patterns = [
      /(?:Issue Date|Date of Issue|Issued on)\s*:?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private static extractValidTill(text: string): string | null {
    const patterns = [
      /(?:Valid Till|Valid Upto|Validity)\s*:?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private static extractVehicleClass(text: string): string[] | null {
    const classes: string[] = [];

    this.VEHICLE_CLASSES.forEach(vehicleClass => {
      if (new RegExp(`\\b${vehicleClass}\\b`, 'i').test(text)) {
        classes.push(vehicleClass);
      }
    });

    return classes.length > 0 ? classes : null;
  }

  private static extractAuthorization(text: string): string | null {
    const patterns = [
      /(?:Authorization to Drive|Auth)\s*:?\s*(.{5,100}?)(?=\n|COV|Valid)/is
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().replace(/\s+/g, ' ');
      }
    }

    return null;
  }

  private static extractCOVIssueDate(text: string): string | null {
    const patterns = [
      /(?:COV)\s*:?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private static extractEmergencyContact(text: string): string | null {
    const patterns = [
      /(?:Emergency|Emergency Contact)\s*:?\s*(\d{10})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
