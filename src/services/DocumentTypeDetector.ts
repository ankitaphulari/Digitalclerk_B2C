// Robust document type detection for OCR text
// Detects PAN, Aadhaar, Passport, License, and other document types

export interface DocumentDetectionResult {
  type: string;
  confidence: number;
  indicators: string[];
}

export class DocumentTypeDetector {
  private static readonly DOCUMENT_PATTERNS = {
    pan: {
      regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/,
      keywords: [
        'INCOME TAX DEPARTMENT',
        'GOVT OF INDIA', 
        'PERMANENT ACCOUNT NUMBER',
        'PERMANENT ACCOUNT',
        'INCOME TAX',
        'PAN CARD'
      ],
      headerKeywords: [
        'INCOME TAX DEPARTMENT',
        'GOVT OF INDIA',
        'GOVERNMENT OF INDIA',
        'PERMANENT ACCOUNT NUMBER CARD'
      ]
    },
    aadhaar: {
      regex: /\b(\d{4}\s?\d{4}\s?\d{4})\b/,
      keywords: [
        'UNIQUE IDENTIFICATION AUTHORITY OF INDIA',
        'AADHAAR',
        'आधार',
        'UIDAI',
        'GOVERNMENT OF INDIA',
        'YEAR OF BIRTH',
        'DOB',
        'VID'
      ],
      headerKeywords: [
        'GOVERNMENT OF INDIA',
        'UNIQUE IDENTIFICATION AUTHORITY OF INDIA',
        'UIDAI'
      ]
    },
    passport: {
      regex: /\b[A-Z]\d{7}\b/,
      keywords: [
        'PASSPORT',
        'REPUBLIC OF INDIA',
        'GOVERNMENT OF INDIA',
        'MINISTRY OF EXTERNAL AFFAIRS',
        'PLACE OF BIRTH',
        'NATIONALITY'
      ],
      headerKeywords: [
        'REPUBLIC OF INDIA',
        'GOVERNMENT OF INDIA',
        'MINISTRY OF EXTERNAL AFFAIRS'
      ]
    },
    license: {
      regex: /\b[A-Z]{2}\d{2}\d{11}\b/,
      keywords: [
        'DRIVING LICENCE',
        'DRIVING LICENSE',
        'TRANSPORT DEPARTMENT',
        'VALIDITY',
        'VEHICLE CLASS',
        'DL NO'
      ],
      headerKeywords: [
        'TRANSPORT DEPARTMENT',
        'GOVERNMENT OF'
      ]
    },
    bank_statement: {
      regex: /\b\d{9,18}\b/,
      keywords: [
        'BANK STATEMENT',
        'ACCOUNT STATEMENT',
        'IFSC CODE',
        'ACCOUNT NUMBER',
        'OPENING BALANCE',
        'CLOSING BALANCE',
        'TRANSACTION',
        'DEBIT',
        'CREDIT'
      ],
      headerKeywords: [
        'BANK STATEMENT',
        'ACCOUNT STATEMENT'
      ]
    },
    marksheet: {
      regex: /\b[A-Z0-9]{6,15}\b/,
      keywords: [
        'MARKSHEET',
        'MARK SHEET',
        'TRANSCRIPT',
        'EXAMINATION',
        'UNIVERSITY',
        'COLLEGE',
        'GRADE',
        'PERCENTAGE',
        'CGPA',
        'SEMESTER'
      ],
      headerKeywords: [
        'UNIVERSITY',
        'EXAMINATION',
        'MARKSHEET'
      ]
    },
    salary_slip: {
      regex: /\b[A-Z0-9]{4,10}\b/,
      keywords: [
        'SALARY SLIP',
        'PAY SLIP',
        'PAYSLIP',
        'EMPLOYEE',
        'BASIC SALARY',
        'GROSS SALARY',
        'NET SALARY',
        'DEDUCTIONS',
        'ALLOWANCES'
      ],
      headerKeywords: [
        'SALARY SLIP',
        'PAY SLIP',
        'PAYSLIP'
      ]
    },
    utility_bill: {
      regex: /\b\d{8,15}\b/,
      keywords: [
        'ELECTRICITY BILL',
        'WATER BILL',
        'GAS BILL',
        'UTILITY BILL',
        'CONSUMER NUMBER',
        'METER READING',
        'DUE DATE',
        'BILL AMOUNT'
      ],
      headerKeywords: [
        'ELECTRICITY BOARD',
        'WATER BOARD',
        'GAS COMPANY'
      ]
    }
  };

  /**
   * Detects document type from OCR text with confidence scoring
   */
  static detectDocumentType(ocrText: string): DocumentDetectionResult {
    if (!ocrText || ocrText.trim().length === 0) {
      return { type: 'unknown', confidence: 0, indicators: [] };
    }

    const upperText = ocrText.toUpperCase();
    const results: Array<{ type: string; score: number; indicators: string[] }> = [];

    // Check each document type
    Object.entries(this.DOCUMENT_PATTERNS).forEach(([docType, patterns]) => {
      let score = 0;
      const indicators: string[] = [];

      // Check regex pattern (highest weight)
      if (patterns.regex.test(ocrText)) {
        score += 40;
        indicators.push(`${docType.toUpperCase()} number pattern found`);
      }

      // Check keywords
      patterns.keywords.forEach(keyword => {
        if (upperText.includes(keyword)) {
          score += 10;
          indicators.push(`Keyword: ${keyword}`);
        }
      });

      // Bonus for header keywords (official document indicators)
      patterns.headerKeywords.forEach(header => {
        if (upperText.includes(header)) {
          score += 15;
          indicators.push(`Header: ${header}`);
        }
      });

      if (score > 0) {
        results.push({ type: docType, score, indicators });
      }
    });

    // Return the highest scoring type
    if (results.length === 0) {
      return { type: 'unknown', confidence: 0, indicators: [] };
    }

    results.sort((a, b) => b.score - a.score);
    const best = results[0];
    
    return {
      type: best.type,
      confidence: Math.min(best.score / 60, 1), // Normalize to 0-1 scale
      indicators: best.indicators
    };
  }

  /**
   * Removes common document headers for cleaner text processing
   */
  static removeDocumentHeaders(text: string, documentType: string): string {
    if (!text || !documentType || documentType === 'unknown') {
      return text;
    }

    const patterns = this.DOCUMENT_PATTERNS[documentType as keyof typeof this.DOCUMENT_PATTERNS];
    if (!patterns) return text;

    let cleaned = text;
    
    // Remove header keywords line by line
    patterns.headerKeywords.forEach(header => {
      const regex = new RegExp(`^.*${header}.*$`, 'gmi');
      cleaned = cleaned.replace(regex, '');
    });

    // Clean up extra whitespace
    return cleaned
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .replace(/^\s+|\s+$/g, '') // Trim start and end
      .trim();
  }

  /**
   * Gets document-specific extraction hints
   */
  static getExtractionHints(documentType: string): Record<string, RegExp[]> {
    const hints: Record<string, Record<string, RegExp[]>> = {
      pan: {
        pan: [/\b([A-Z]{5}[0-9]{4}[A-Z])\b/],
        dob: [
          /(?:DOB|Date of Birth)[:\s]*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i,
          /\b([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})\b/
        ],
        name: [
          /^([A-Z][A-Z\s.'-]+)$/m,
          /(?:Name)[:\s]*([A-Z][A-Z\s.'-]+)/i
        ],
        fathersName: [
          /(?:Father|F\/O)[:\s]*([A-Z][A-Z\s.'-]+)/i
        ]
      },
      aadhaar: {
        aadhaar: [/\b(\d{4}\s?\d{4}\s?\d{4})\b/],
        dob: [
          /(?:DOB|Date of Birth|D\.O\.B)[:\s]*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:19|20)\d{2})/i,
          /(?:Year of Birth|YOB)[:\s]*(\d{4})/i
        ],
        name: [
          /(?:Name)[:\s]*([A-Za-z][A-Za-z\s.'-]+)/i,
          /^([A-Z][A-Za-z\s.'-]+)$/m
        ],
        address: [
          /(?:Address)[:\s]*(.+?)(?=\d{6}|\n|$)/is
        ]
      },
      bank_statement: {
        accountNumber: [
          /(?:Account\s+No|A\/C\s+No|Account\s+Number)[:\s]*(\d{9,18})/i,
          /\b(\d{12,18})\b/
        ],
        ifscCode: [
          /(?:IFSC|IFSC\s+Code)[:\s]*([A-Z]{4}0[A-Z0-9]{6})/i,
          /\b([A-Z]{4}0[A-Z0-9]{6})\b/
        ],
        name: [
          /(?:Account\s+Holder|Customer\s+Name|Name)[:\s]*([A-Za-z][A-Za-z\s.'-]+)/i
        ],
        bankName: [
          /(?:Bank|Bank\s+Name)[:\s]*([A-Za-z\s&.-]+)/i
        ],
        branchName: [
          /(?:Branch|Branch\s+Name)[:\s]*([A-Za-z\s.-]+)/i
        ]
      },
      marksheet: {
        rollNumber: [
          /(?:Roll\s+No|Roll\s+Number|Registration\s+No)[:\s]*([A-Z0-9]{6,15})/i,
          /\b([A-Z0-9]{8,15})\b/
        ],
        name: [
          /(?:Student\s+Name|Name|Candidate\s+Name)[:\s]*([A-Za-z][A-Za-z\s.'-]+)/i
        ],
        percentage: [
          /(?:Percentage|%|Percent)[:\s]*(\d{1,3}(?:\.\d{1,2})?)/i,
          /\b(\d{1,3}\.\d{2})%?\b/
        ],
        cgpa: [
          /(?:CGPA|GPA)[:\s]*(\d{1,2}(?:\.\d{1,2})?)/i
        ],
        institution: [
          /(?:University|College|Institute)[:\s]*([A-Za-z\s&.-]+)/i
        ]
      },
      salary_slip: {
        employeeId: [
          /(?:Employee\s+ID|Emp\s+ID|Staff\s+ID)[:\s]*([A-Z0-9]{4,10})/i,
          /\b([A-Z0-9]{6,10})\b/
        ],
        name: [
          /(?:Employee\s+Name|Name|Emp\s+Name)[:\s]*([A-Za-z][A-Za-z\s.'-]+)/i
        ],
        designation: [
          /(?:Designation|Position|Job\s+Title)[:\s]*([A-Za-z\s.-]+)/i
        ],
        basicSalary: [
          /(?:Basic\s+Salary|Basic\s+Pay)[:\s]*₹?\s?(\d{4,8})/i
        ],
        grossSalary: [
          /(?:Gross\s+Salary|Gross\s+Pay)[:\s]*₹?\s?(\d{4,8})/i
        ],
        netSalary: [
          /(?:Net\s+Salary|Net\s+Pay|Take\s+Home)[:\s]*₹?\s?(\d{4,8})/i
        ]
      },
      utility_bill: {
        consumerNumber: [
          /(?:Consumer\s+No|Consumer\s+Number|Account\s+ID)[:\s]*(\d{8,15})/i,
          /\b(\d{10,15})\b/
        ],
        name: [
          /(?:Consumer\s+Name|Customer\s+Name|Name)[:\s]*([A-Za-z][A-Za-z\s.'-]+)/i
        ],
        billAmount: [
          /(?:Amount\s+Due|Bill\s+Amount|Total\s+Amount)[:\s]*₹?\s?(\d{2,6})/i
        ],
        dueDate: [
          /(?:Due\s+Date|Payment\s+Due)[:\s]*([0-3]\d[\/\-\.][0-1]\d[\/\-\.](?:20)\d{2})/i
        ]
      }
    };

    return hints[documentType] || {};
  }
}