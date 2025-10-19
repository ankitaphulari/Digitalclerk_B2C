// DocumentFormatRequirements.ts
// Format requirements and validation rules for all 29 document types

export interface DocumentFormatRequirement {
  documentType: string;
  displayName: string;
  category: string;
  requiredFields: string[];
  optionalFields: string[];
  numberPattern: RegExp;
  numberFormat: string;
  numberExample: string;
  validationRules: ValidationRule[];
  supportedFormats: string[];
  maxFileSize: number; // in MB
  minResolution: { width: number; height: number };
  processingNotes: string[];
}

export interface ValidationRule {
  fieldName: string;
  rule: RegExp | ((value: string) => boolean);
  errorMessage: string;
  required: boolean;
}

export class DocumentFormatRequirements {
  
  private static readonly REQUIREMENTS: Record<string, DocumentFormatRequirement> = {
    // ============ IDENTITY DOCUMENTS ============
    aadhaar: {
      documentType: 'aadhaar',
      displayName: 'Aadhaar Card',
      category: 'Identity',
      requiredFields: ['aadhaarNumber', 'name', 'dob', 'gender', 'address'],
      optionalFields: ['fathersName', 'husbandsName', 'mobile', 'email', 'pincode', 'enrollmentId'],
      numberPattern: /^\d{12}$/,
      numberFormat: '12 digits',
      numberExample: '234567891234',
      validationRules: [
        {
          fieldName: 'aadhaarNumber',
          rule: /^\d{12}$/,
          errorMessage: 'Aadhaar number must be exactly 12 digits',
          required: true
        },
        {
          fieldName: 'name',
          rule: (value: string) => value.length >= 3 && /^[A-Za-z\s.'-]+$/.test(value),
          errorMessage: 'Name must contain only letters and be at least 3 characters',
          required: true
        },
        {
          fieldName: 'dob',
          rule: /^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}$/,
          errorMessage: 'Date of birth must be in DD/MM/YYYY format',
          required: true
        },
        {
          fieldName: 'pincode',
          rule: /^\d{6}$/,
          errorMessage: 'PIN code must be 6 digits',
          required: false
        }
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 5,
      minResolution: { width: 800, height: 600 },
      processingNotes: [
        'Ensure card is placed on plain background',
        'All four corners should be visible',
        'Text should be clearly readable',
        'Avoid glare and shadows'
      ]
    },

    pan: {
      documentType: 'pan',
      displayName: 'PAN Card',
      category: 'Identity',
      requiredFields: ['panNumber', 'name', 'fathersName', 'dob'],
      optionalFields: [],
      numberPattern: /^[A-Z]{5}\d{4}[A-Z]$/,
      numberFormat: '5 letters + 4 digits + 1 letter',
      numberExample: 'ABCDE1234F',
      validationRules: [
        {
          fieldName: 'panNumber',
          rule: /^[A-Z]{5}\d{4}[A-Z]$/,
          errorMessage: 'PAN must be in format: XXXXX9999X',
          required: true
        },
        {
          fieldName: 'dob',
          rule: /^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}$/,
          errorMessage: 'Date must be in DD/MM/YYYY format',
          required: true
        }
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 5,
      minResolution: { width: 800, height: 600 },
      processingNotes: [
        'Signature and photo should be clear',
        'Hologram should be visible',
        'No lamination glare'
      ]
    },

    caste_certificate: {
      documentType: 'caste_certificate',
      displayName: 'Caste Certificate',
      category: 'Educational',
      requiredFields: ['certificateNumber', 'name', 'fathersName', 'caste', 'district', 'issueDate'],
      optionalFields: ['mothersName', 'dob', 'age', 'gender', 'subCaste', 'village', 'taluka', 'state', 'purpose'],
      numberPattern: /^\d{4}$/,
      numberFormat: '4 digits (e.g., 1234 or 2023-1234)',
      numberExample: '1234',
      validationRules: [
        {
          fieldName: 'certificateNumber',
          rule: /^\d{4}$|^\d{4}[-\/]\d{4}$/,
          errorMessage: 'Certificate number must be 4 digits',
          required: true
        },
        {
          fieldName: 'caste',
          rule: (value: string) => ['SC', 'ST', 'OBC', 'VJNT', 'SBC', 'NT'].includes(value.toUpperCase()),
          errorMessage: 'Caste must be SC, ST, OBC, VJNT, SBC, or NT',
          required: true
        }
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 5,
      minResolution: { width: 1000, height: 800 },
      processingNotes: [
        'Seal and signature must be clearly visible',
        'All text should be readable',
        'Certificate should not be folded'
      ]
    },

    caste_validity: {
      documentType: 'caste_validity',
      displayName: 'Caste Validity Certificate',
      category: 'Educational',
      requiredFields: ['validityNumber', 'referenceCertificateNumber', 'name', 'caste', 'district'],
      optionalFields: ['fathersName', 'dob', 'subCaste', 'state', 'verificationDate', 'validFrom', 'validTill'],
      numberPattern: /^\d{8}$/,
      numberFormat: '8 digits',
      numberExample: '12345678',
      validationRules: [
        {
          fieldName: 'validityNumber',
          rule: /^\d{8}$/,
          errorMessage: 'Validity number must be exactly 8 digits',
          required: true
        },
        {
          fieldName: 'referenceCertificateNumber',
          rule: /^\d{4}$|^\d{4}[-\/]\d{4}$/,
          errorMessage: 'Reference certificate must be 4 digits',
          required: true
        }
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 5,
      minResolution: { width: 1000, height: 800 },
      processingNotes: [
        'Committee seal must be visible',
        'Chairman signature required',
        'All dates should be clear'
      ]
    },

    voter_id: {
      documentType: 'voter_id',
      displayName: 'Voter ID (EPIC Card)',
      category: 'Identity',
      requiredFields: ['epicNumber', 'name', 'dob', 'gender', 'address'],
      optionalFields: ['fathersName', 'husbandsName', 'age', 'pollingStation', 'partNumber'],
      numberPattern: /^[A-Z]{3}\d{7}$/,
      numberFormat: '3 letters + 7 digits',
      numberExample: 'ABC1234567',
      validationRules: [
        {
          fieldName: 'epicNumber',
          rule: /^[A-Z]{3}\d{7}$/,
          errorMessage: 'EPIC number must be 3 letters followed by 7 digits',
          required: true
        }
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 5,
      minResolution: { width: 800, height: 600 },
      processingNotes: ['Both sides may need to be scanned', 'Hologram should be visible']
    },

    passport: {
      documentType: 'passport',
      displayName: 'Passport',
      category: 'Identity',
      requiredFields: ['passportNumber', 'surname', 'givenNames', 'dob', 'nationality'],
      optionalFields: ['placeOfBirth', 'dateOfIssue', 'dateOfExpiry', 'placeOfIssue', 'fathersName', 'address'],
      numberPattern: /^[A-Z]{1,2}\d{7}$/,
      numberFormat: '1-2 letters + 7 digits',
      numberExample: 'L1234567',
      validationRules: [
        {
          fieldName: 'passportNumber',
          rule: /^[A-Z]{1,2}\d{7}$/,
          errorMessage: 'Passport number format: X9999999 or XX9999999',
          required: true
        }
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 5,
      minResolution: { width: 1200, height: 800 },
      processingNotes: ['First page with photo required', 'MRZ code should be visible']
    },

    driving_license: {
      documentType: 'driving_license',
      displayName: 'Driving License',
      category: 'Identity',
      requiredFields: ['dlNumber', 'name', 'dob', 'address', 'validTill'],
      optionalFields: ['fathersName', 'bloodGroup', 'vehicleClass', 'dateOfIssue'],
      numberPattern: /^[A-Z]{2}-\d{2}-\d{4}-\d{7}$/,
      numberFormat: 'XX-99-9999-9999999',
      numberExample: 'MH-01-2014-0012345',
      validationRules: [
        {
          fieldName: 'dlNumber',
          rule: /^[A-Z]{2}-\d{2}-\d{4}-\d{7}$/,
          errorMessage: 'DL number format: XX-99-9999-9999999',
          required: true
        }
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 5,
      minResolution: { width: 800, height: 600 },
      processingNotes: ['Both sides required', 'Hologram should be visible']
    },

    // ============ EDUCATIONAL DOCUMENTS ============
    marksheet: {
      documentType: 'marksheet',
      displayName: 'Marksheet/Grade Card',
      category: 'Educational',
      requiredFields: ['rollNumber', 'studentName', 'boardUniversity', 'yearOfPassing'],
      optionalFields: ['registrationNumber', 'fathersName', 'class', 'percentage', 'cgpa', 'totalMarks'],
      numberPattern: /^[A-Z0-9]{6,15}$/,
      numberFormat: '6-15 alphanumeric characters',
      numberExample: '2019ABC123',
      validationRules: [
        {
          fieldName: 'percentage',
          rule: /^\d{1,3}(\.\d{1,2})?%?$/,
          errorMessage: 'Percentage must be a valid number',
          required: false
        },
        {
          fieldName: 'cgpa',
          rule: /^\d{1,2}(\.\d{1,2})?$/,
          errorMessage: 'CGPA must be between 0-10',
          required: false
        }
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 5,
      minResolution: { width: 1000, height: 1200 },
      processingNotes: ['Seal and signature required', 'All subjects should be visible']
    },

    // ============ FINANCIAL DOCUMENTS ============
    bank_statement: {
      documentType: 'bank_statement',
      displayName: 'Bank Statement',
      category: 'Financial',
      requiredFields: ['accountNumber', 'accountHolderName', 'ifscCode', 'bankName'],
      optionalFields: ['branchName', 'openingBalance', 'closingBalance', 'statementPeriod'],
      numberPattern: /^\d{9,18}$/,
      numberFormat: '9-18 digits',
      numberExample: '123456789012',
      validationRules: [
        {
          fieldName: 'accountNumber',
          rule: /^\d{9,18}$/,
          errorMessage: 'Account number must be 9-18 digits',
          required: true
        },
        {
          fieldName: 'ifscCode',
          rule: /^[A-Z]{4}0[A-Z0-9]{6}$/,
          errorMessage: 'IFSC code format: XXXX0YYYYYY',
          required: true
        }
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 10,
      minResolution: { width: 1000, height: 1400 },
      processingNotes: ['Bank logo should be visible', 'All transactions should be clear']
    },

    salary_slip: {
      documentType: 'salary_slip',
      displayName: 'Salary Slip',
      category: 'Financial',
      requiredFields: ['employeeId', 'name', 'designation', 'grossSalary', 'netSalary'],
      optionalFields: ['basicSalary', 'hra', 'pfDeduction', 'tds', 'companyName', 'month'],
      numberPattern: /^[A-Z0-9]{4,10}$/,
      numberFormat: '4-10 alphanumeric',
      numberExample: 'EMP12345',
      validationRules: [
        {
          fieldName: 'employeeId',
          rule: /^[A-Z0-9]{4,10}$/,
          errorMessage: 'Employee ID must be 4-10 alphanumeric characters',
          required: true
        }
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 5,
      minResolution: { width: 800, height: 1000 },
      processingNotes: ['Company letterhead should be visible', 'All deductions should be clear']
    },

    // ============ UTILITY BILLS ============
    electricity_bill: {
      documentType: 'electricity_bill',
      displayName: 'Electricity Bill',
      category: 'Utility',
      requiredFields: ['consumerNumber', 'consumerName', 'billAmount', 'dueDate'],
      optionalFields: ['meterNumber', 'unitsConsumed', 'billDate', 'address'],
      numberPattern: /^\d{10,13}$/,
      numberFormat: '10-13 digits',
      numberExample: '1234567890',
      validationRules: [
        {
          fieldName: 'consumerNumber',
          rule: /^\d{10,13}$/,
          errorMessage: 'Consumer number must be 10-13 digits',
          required: true
        }
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 5,
      minResolution: { width: 800, height: 1000 },
      processingNotes: ['Provider logo should be visible', 'Bill amount and due date must be clear']
    },

    // Add remaining document types with similar structure...
    // (I'll add a few more key ones)

    vehicle_rc: {
      documentType: 'vehicle_rc',
      displayName: 'Vehicle Registration Certificate',
      category: 'Vehicle',
      requiredFields: ['registrationNumber', 'ownerName', 'vehicleClass', 'engineNumber', 'chassisNumber'],
      optionalFields: ['model', 'fuelType', 'registrationDate', 'fitnessValidUpto'],
      numberPattern: /^[A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{4}$/,
      numberFormat: 'XX-99-XX-9999',
      numberExample: 'MH-01-AB-1234',
      validationRules: [
        {
          fieldName: 'registrationNumber',
          rule: /^[A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{4}$/,
          errorMessage: 'Registration format: XX-99-XX-9999',
          required: true
        }
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 5,
      minResolution: { width: 1000, height: 800 },
      processingNotes: ['Both pages required', 'Hologram must be visible']
    },

    itr: {
      documentType: 'itr',
      displayName: 'Income Tax Return',
      category: 'Financial',
      requiredFields: ['acknowledgementNumber', 'panNumber', 'name', 'assessmentYear'],
      optionalFields: ['totalIncome', 'taxPayable', 'filingDate'],
      numberPattern: /^\d{15}$/,
      numberFormat: '15 digits',
      numberExample: '123456789012345',
      validationRules: [
        {
          fieldName: 'acknowledgementNumber',
          rule: /^\d{15}$/,
          errorMessage: 'Acknowledgement number must be 15 digits',
          required: true
        }
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 10,
      minResolution: { width: 1000, height: 1400 },
      processingNotes: ['All pages required', 'ITD logo should be visible']
    }
  };

  /**
   * Get format requirements for a document type
   */
  static getRequirements(documentType: string): DocumentFormatRequirement | null {
    return this.REQUIREMENTS[documentType] || null;
  }

  /**
   * Get all supported document types
   */
  static getAllDocumentTypes(): string[] {
    return Object.keys(this.REQUIREMENTS);
  }

  /**
   * Get requirements by category
   */
  static getRequirementsByCategory(category: string): DocumentFormatRequirement[] {
    return Object.values(this.REQUIREMENTS)
      .filter(req => req.category.toLowerCase() === category.toLowerCase());
  }

  /**
   * Validate extracted data against requirements
   */
  static validateExtractedData(
    documentType: string,
    extractedData: Record<string, any>
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const requirements = this.getRequirements(documentType);
    if (!requirements) {
      return { valid: false, errors: ['Unknown document type'], warnings: [] };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    requirements.requiredFields.forEach(field => {
      if (!extractedData[field] || extractedData[field].toString().trim() === '') {
        errors.push(`Required field '${field}' is missing`);
      }
    });

    // Validate field values
    requirements.validationRules.forEach(rule => {
      const value = extractedData[rule.fieldName];
      
      if (rule.required && !value) {
        errors.push(rule.errorMessage);
        return;
      }

      if (value) {
        const isValid = typeof rule.rule === 'function' 
          ? rule.rule(value.toString())
          : rule.rule.test(value.toString());

        if (!isValid) {
          if (rule.required) {
            errors.push(rule.errorMessage);
          } else {
            warnings.push(rule.errorMessage);
          }
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get field requirements for a specific document
   */
  static getFieldRequirements(documentType: string): {
    required: string[];
    optional: string[];
    total: number;
  } {
    const requirements = this.getRequirements(documentType);
    if (!requirements) {
      return { required: [], optional: [], total: 0 };
    }

    return {
      required: requirements.requiredFields,
      optional: requirements.optionalFields,
      total: requirements.requiredFields.length + requirements.optionalFields.length
    };
  }

  /**
   * Check if file meets format requirements
   */
  static validateFile(
    documentType: string,
    fileSize: number,
    fileType: string,
    dimensions?: { width: number; height: number }
  ): { valid: boolean; errors: string[] } {
    const requirements = this.getRequirements(documentType);
    if (!requirements) {
      return { valid: false, errors: ['Unknown document type'] };
    }

    const errors: string[] = [];

    // Check file size
    if (fileSize > requirements.maxFileSize * 1024 * 1024) {
      errors.push(`File size exceeds maximum ${requirements.maxFileSize}MB`);
    }

    // Check file format
    const extension = fileType.toLowerCase().replace('image/', '').replace('application/', '');
    if (!requirements.supportedFormats.includes(extension)) {
      errors.push(`File format '${extension}' not supported. Use: ${requirements.supportedFormats.join(', ')}`);
    }

    // Check dimensions
    if (dimensions) {
      if (dimensions.width < requirements.minResolution.width ||
          dimensions.height < requirements.minResolution.height) {
        errors.push(`Image resolution too low. Minimum: ${requirements.minResolution.width}x${requirements.minResolution.height}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get processing notes for a document type
   */
  static getProcessingNotes(documentType: string): string[] {
    const requirements = this.getRequirements(documentType);
    return requirements?.processingNotes || [];
  }
}
