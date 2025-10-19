// NEW: Complete Voter ID (EPIC) extraction with ALL 10 fields
// Extracts: EPIC Number, Name, Father/Husband, DOB, Gender, Address, Polling Station, etc.

import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface VoterIDExtractionResult {
  epicNumber?: string; // XXX9999999 format
  name?: string;
  fathersName?: string;
  husbandsName?: string;
  dob?: string;
  age?: string;
  gender?: string;
  address?: string;
  pollingStation?: string;
  assemblyConstituency?: string;
  partNumber?: string;
  serialNumber?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class VoterIDExtractor {
  private static readonly HEADER_BLACKLIST = [
    'ELECTION COMMISSION',
    'ELECTION COMMISSION OF INDIA',
    'GOVERNMENT OF INDIA',
    'ELECTOR',
    'EPIC',
    'मतदाता पहचान पत्र'
  ];

  /**
   * Extracts ALL data from Voter ID card (10 fields)
   */
  static extractFromVoterID(ocrText: string): VoterIDExtractionResult {
    const result: VoterIDExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return result;
    }

    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('📋 Voter ID - Processing lines:', lines.length);

    // 1. Extract EPIC Number (XXX9999999 - 10 characters)
    const epicNumber = this.extractEPICNumber(ocrText);
    if (epicNumber) {
      result.epicNumber = epicNumber;
      result.extractedFields.epicNumber = epicNumber;
      result.extractedFields.epic_number = epicNumber;
      result.extractedFields.voterIdNumber = epicNumber;
      result.confidence += 35;
      console.log('✅ EPIC Number:', epicNumber);
    }

    // 2. Extract Name
    const name = this.extractName(lines, ocrText);
    if (name) {
      result.name = name;
      result.extractedFields.name = name;
      result.extractedFields.fullName = name;
      result.confidence += 15;
      console.log('✅ Name:', name);
    }

    // 3. Extract Father's/Husband's Name
    const parentalData = this.extractParentalNames(ocrText);
    if (parentalData.fathersName) {
      result.fathersName = parentalData.fathersName;
      result.extractedFields.fathersName = parentalData.fathersName;
      result.extractedFields.fathers_name = parentalData.fathersName;
      result.confidence += 10;
      console.log('✅ Father\'s Name:', parentalData.fathersName);
    }
    if (parentalData.husbandsName) {
      result.husbandsName = parentalData.husbandsName;
      result.extractedFields.husbandsName = parentalData.husbandsName;
      result.extractedFields.husbands_name = parentalData.husbandsName;
      result.confidence += 10;
      console.log('✅ Husband\'s Name:', parentalData.husbandsName);
    }

    // 4. Extract Date of Birth
    const dob = this.extractDOB(ocrText);
    if (dob) {
      result.dob = dob;
      result.extractedFields.dob = dob;
      result.extractedFields.dateOfBirth = dob;
      result.confidence += 15;
      console.log('✅ Date of Birth:', dob);
    }

    // 5. Extract Age
    const age = this.extractAge(ocrText);
    if (age) {
      result.age = age;
      result.extractedFields.age = age;
      console.log('✅ Age:', age);
    }

    // 6. Extract Gender
    const gender = this.extractGender(ocrText);
    if (gender) {
      result.gender = gender;
      result.extractedFields.gender = gender;
      result.extractedFields.sex = gender;
      result.confidence += 10;
      console.log('✅ Gender:', gender);
    }

    // 7. Extract Address
    const address = this.extractAddress(lines);
    if (address) {
      result.address = address;
      result.extractedFields.address = address;
      result.extractedFields.residentialAddress = address;
      result.confidence += 10;
      console.log('✅ Address:', address.substring(0, 50) + '...');
    }

    // 8. Extract Polling Station
    const pollingStation = this.extractPollingStation(ocrText);
    if (pollingStation) {
      result.pollingStation = pollingStation;
      result.extractedFields.pollingStation = pollingStation;
      result.extractedFields.polling_station = pollingStation;
      console.log('✅ Polling Station:', pollingStation);
    }

    // 9. Extract Assembly Constituency
    const constituency = this.extractConstituency(ocrText);
    if (constituency) {
      result.assemblyConstituency = constituency;
      result.extractedFields.assemblyConstituency = constituency;
      result.extractedFields.constituency = constituency;
      console.log('✅ Constituency:', constituency);
    }

    // 10. Extract Part Number
    const partNumber = this.extractPartNumber(ocrText);
    if (partNumber) {
      result.partNumber = partNumber;
      result.extractedFields.partNumber = partNumber;
      result.extractedFields.part_number = partNumber;
      console.log('✅ Part Number:', partNumber);
    }

    // 11. Extract Serial Number
    const serialNumber = this.extractSerialNumber(ocrText);
    if (serialNumber) {
      result.serialNumber = serialNumber;
      result.extractedFields.serialNumber = serialNumber;
      result.extractedFields.serial_number = serialNumber;
      console.log('✅ Serial Number:', serialNumber);
    }

    console.log('📊 Voter ID extraction complete - Confidence:', result.confidence + '%');
    return result;
  }

  /**
   * Extracts EPIC Number (XXX9999999 format)
   */
  private static extractEPICNumber(text: string): string | null {
    const patterns = [
      /(?:EPIC|Elector|Voter ID|Electoral)\s*(?:No|Number)?\s*:?\s*([A-Z]{3}\d{7})/gi,
      /\b([A-Z]{3}\d{7})\b/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const epic = match[1] || match[0];
        if (/^[A-Z]{3}\d{7}$/.test(epic)) {
          return epic;
        }
      }
    }

    return null;
  }

  /**
   * Extracts name
   */
  private static extractName(lines: string[], fullText: string): string | null {
    const namePatterns = [
      /(?:Name|नाम|Elector'?s?\s*Name)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i
    ];

    for (const pattern of namePatterns) {
      const match = fullText.match(pattern);
      if (match) {
        const name = match[1].trim();
        if (!this.isHeaderLine(name) && name.length >= 3) {
          return formatNameForDisplay(name);
        }
      }
    }

    // Fallback to line analysis
    const candidateLines = lines.filter(line => {
      if (!/^[A-Za-z .'-]{3,50}$/.test(line)) return false;
      if (this.isHeaderLine(line)) return false;
      if (line.includes(' ')) return true;
      return false;
    });

    if (candidateLines.length > 0) {
      return formatNameForDisplay(candidateLines[0]);
    }

    return null;
  }

  /**
   * Extracts Father's/Husband's Name
   */
  private static extractParentalNames(text: string): {
    fathersName?: string;
    husbandsName?: string;
  } {
    const result: any = {};

    // Father's Name
    const fatherPatterns = [
      /(?:Father|Father'?s?\s*Name|S\/O|पिता)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i
    ];

    for (const pattern of fatherPatterns) {
      const match = text.match(pattern);
      if (match) {
        const name = match[1].trim();
        if (!this.isHeaderLine(name) && name.length >= 3) {
          result.fathersName = formatNameForDisplay(name);
          break;
        }
      }
    }

    // Husband's Name
    const husbandPatterns = [
      /(?:Husband|Husband'?s?\s*Name|W\/O|पति)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i
    ];

    for (const pattern of husbandPatterns) {
      const match = text.match(pattern);
      if (match) {
        const name = match[1].trim();
        if (!this.isHeaderLine(name) && name.length >= 3) {
          result.husbandsName = formatNameForDisplay(name);
          break;
        }
      }
    }

    return result;
  }

  /**
   * Extracts date of birth
   */
  private static extractDOB(text: string): string | null {
    const patterns = [
      /(?:DOB|Date of Birth|D\.O\.B|जन्म तिथि)\s*:?\s*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i,
      /\b([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})\b/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extracts age
   */
  private static extractAge(text: string): string | null {
    const patterns = [
      /(?:Age|उम्र)\s*:?\s*(\d{1,3})\s*(?:years|yrs)?/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const age = parseInt(match[1]);
        if (age >= 18 && age <= 120) {
          return match[1];
        }
      }
    }

    return null;
  }

  /**
   * Extracts gender
   */
  private static extractGender(text: string): string | null {
    const patterns = [
      /(?:Gender|Sex|लिंग)\s*:?\s*(Male|Female|M|F|पुरुष|महिला)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const gender = match[1].toUpperCase();
        if (gender === 'M' || gender === 'MALE' || gender === 'पुरुष') return 'Male';
        if (gender === 'F' || gender === 'FEMALE' || gender === 'महिला') return 'Female';
      }
    }

    return null;
  }

  /**
   * Extracts address
   */
  private static extractAddress(lines: string[]): string | null {
    const addressLines: string[] = [];
    let capturing = false;

    for (const line of lines) {
      if (/(?:Address|पता)/i.test(line)) {
        capturing = true;
        const addressPart = line.replace(/(?:Address|पता)\s*:?/i, '').trim();
        if (addressPart) addressLines.push(addressPart);
        continue;
      }

      if (capturing) {
        if (this.isHeaderLine(line) || /EPIC|Polling|Part/i.test(line)) {
          break;
        }
        addressLines.push(line);
      }
    }

    if (addressLines.length > 0) {
      return addressLines.join(', ').replace(/,+/g, ',').trim();
    }

    return null;
  }

  /**
   * Extracts polling station
   */
  private static extractPollingStation(text: string): string | null {
    const patterns = [
      /(?:Polling Station|PS)\s*:?\s*(.{5,100}?)(?=\n|Part|Assembly)/is
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().replace(/\s+/g, ' ');
      }
    }

    return null;
  }

  /**
   * Extracts assembly constituency
   */
  private static extractConstituency(text: string): string | null {
    const patterns = [
      /(?:Assembly Constituency|AC|Constituency)\s*:?\s*(.{5,100}?)(?=\n|Part|Serial)/is
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().replace(/\s+/g, ' ');
      }
    }

    return null;
  }

  /**
   * Extracts part number
   */
  private static extractPartNumber(text: string): string | null {
    const patterns = [
      /(?:Part|Part No|Part Number)\s*:?\s*(\d{1,5})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extracts serial number
   */
  private static extractSerialNumber(text: string): string | null {
    const patterns = [
      /(?:Serial|Serial No|Sl\.?\s*No)\s*:?\s*(\d{1,5})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Checks if line is header
   */
  private static isHeaderLine(line: string): boolean {
    const upperLine = line.toUpperCase();
    return this.HEADER_BLACKLIST.some(header =>
      upperLine.includes(header) || upperLine === header
    );
  }
}
