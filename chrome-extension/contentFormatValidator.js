// Chrome Extension - Basic Format Validation
// This provides basic format checking in the extension, with complex operations redirected to web app

class ExtensionFormatValidator {
  static DOCUMENT_REQUIREMENTS = {
    passport: {
      preferredFormats: ['image/jpeg', 'image/png'],
      maxFileSize: 1, // MB
      backgroundRequired: 'white'
    },
    aadhaar: {
      preferredFormats: ['image/png', 'image/jpeg'],
      maxFileSize: 2
    },
    pan: {
      preferredFormats: ['image/png', 'image/jpeg'],
      maxFileSize: 2
    },
    driving_license: {
      preferredFormats: ['image/png', 'image/jpeg'],
      maxFileSize: 2
    },
    general: {
      preferredFormats: ['image/png', 'image/jpeg', 'image/webp'],
      maxFileSize: 10
    }
  };

  static validateFile(file, documentType = 'general') {
    const requirements = this.DOCUMENT_REQUIREMENTS[documentType] || this.DOCUMENT_REQUIREMENTS.general;
    const issues = [];
    const warnings = [];
    
    // Check file size
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > requirements.maxFileSize) {
      issues.push(`File too large: ${sizeInMB.toFixed(2)}MB (max: ${requirements.maxFileSize}MB)`);
    }
    
    // Check format
    if (!requirements.preferredFormats.includes(file.type)) {
      warnings.push(`Format ${file.type} may need conversion. Preferred: ${requirements.preferredFormats.join(', ')}`);
    }
    
    // Special requirements
    if (requirements.backgroundRequired) {
      warnings.push(`This document requires ${requirements.backgroundRequired} background`);
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      needsWebProcessing: warnings.length > 0 || documentType === 'passport'
    };
  }

  static getRequirementsSummary(documentType = 'general') {
    const req = this.DOCUMENT_REQUIREMENTS[documentType] || this.DOCUMENT_REQUIREMENTS.general;
    return {
      formats: req.preferredFormats.join(', '),
      maxSize: `${req.maxFileSize}MB`,
      special: req.backgroundRequired ? `${req.backgroundRequired} background required` : null
    };
  }
}

// Make available globally
window.ExtensionFormatValidator = ExtensionFormatValidator;