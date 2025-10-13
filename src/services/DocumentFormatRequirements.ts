// Document Format Requirements Engine
import { DOCUMENT_TYPE, DocumentType } from "@/lib/documentConstants";

export interface FormatRequirements {
  preferredFormats: string[];
  maxFileSize: number; // in MB
  maxResolution: { width: number; height: number };
  minResolution: { width: number; height: number };
  aspectRatio?: { min: number; max: number };
  backgroundColor?: 'white' | 'any';
  compression?: number; // 0-100
  special?: {
    backgroundRemoval?: boolean;
    grayscale?: boolean;
    enhanceContrast?: boolean;
  };
}

export interface DocumentFormatConfig {
  [key: string]: FormatRequirements;
}

// Define format requirements for different document types and forms
export const DOCUMENT_FORMAT_REQUIREMENTS: DocumentFormatConfig = {
  // Government Forms - Strict Requirements
  passport: {
    preferredFormats: ['image/jpeg', 'image/png'],
    maxFileSize: 1, // 1MB for passport photos
    maxResolution: { width: 600, height: 600 },
    minResolution: { width: 300, height: 300 },
    aspectRatio: { min: 0.8, max: 1.2 }, // Nearly square
    backgroundColor: 'white',
    compression: 85,
    special: {
      backgroundRemoval: true,
      enhanceContrast: true
    }
  },
  
  aadhaar: {
    preferredFormats: ['image/png', 'image/jpeg'],
    maxFileSize: 2,
    maxResolution: { width: 2000, height: 1500 },
    minResolution: { width: 800, height: 600 },
    compression: 90,
    special: {
      enhanceContrast: true
    }
  },
  
  pan: {
    preferredFormats: ['image/png', 'image/jpeg'],
    maxFileSize: 2,
    maxResolution: { width: 2000, height: 1200 },
    minResolution: { width: 800, height: 500 },
    compression: 90,
    special: {
      enhanceContrast: true
    }
  },
  
  driving_license: {
    preferredFormats: ['image/png', 'image/jpeg'],
    maxFileSize: 2,
    maxResolution: { width: 2000, height: 1200 },
    minResolution: { width: 800, height: 500 },
    compression: 90
  },
  
  voter_id: {
    preferredFormats: ['image/png', 'image/jpeg'],
    maxFileSize: 2,
    maxResolution: { width: 2000, height: 1200 },
    minResolution: { width: 800, height: 500 },
    compression: 90
  },
  
  // Bank Documents
  bank_statement: {
    preferredFormats: ['image/png', 'image/jpeg'],
    maxFileSize: 5,
    maxResolution: { width: 3000, height: 4000 },
    minResolution: { width: 1000, height: 1200 },
    compression: 85,
    special: {
      enhanceContrast: true
    }
  },
  
  // Academic Documents
  academic_transcript: {
    preferredFormats: ['image/png', 'image/jpeg'],
    maxFileSize: 5,
    maxResolution: { width: 2500, height: 3500 },
    minResolution: { width: 1000, height: 1400 },
    compression: 90,
    special: {
      enhanceContrast: true
    }
  },
  
  // General Documents - More Flexible
  general: {
    preferredFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSize: 10,
    maxResolution: { width: 4000, height: 4000 },
    minResolution: { width: 500, height: 500 },
    compression: 80
  }
};

export class DocumentFormatValidator {
  static getRequirements(documentType: string, formType?: string): FormatRequirements {
    // First try specific form type
    if (formType && DOCUMENT_FORMAT_REQUIREMENTS[formType]) {
      return DOCUMENT_FORMAT_REQUIREMENTS[formType];
    }
    
    // Then try document type
    if (DOCUMENT_FORMAT_REQUIREMENTS[documentType]) {
      return DOCUMENT_FORMAT_REQUIREMENTS[documentType];
    }
    
    // Fallback to general requirements
    return DOCUMENT_FORMAT_REQUIREMENTS.general;
  }
  
  static validateFormat(file: File, requirements: FormatRequirements): {
    isValid: boolean;
    issues: string[];
    needsConversion: boolean;
    requiredChanges: {
      format?: string;
      resize?: { width: number; height: number };
      compress?: number;
      backgroundRemoval?: boolean;
    };
  } {
    const issues: string[] = [];
    const requiredChanges: any = {};
    let needsConversion = false;
    
    // Check file format
    if (!requirements.preferredFormats.includes(file.type)) {
      issues.push(`Format ${file.type} not preferred. Recommended: ${requirements.preferredFormats.join(', ')}`);
      requiredChanges.format = requirements.preferredFormats[0];
      needsConversion = true;
    }
    
    // Check file size
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > requirements.maxFileSize) {
      issues.push(`File size ${sizeInMB.toFixed(2)}MB exceeds limit of ${requirements.maxFileSize}MB`);
      requiredChanges.compress = requirements.compression || 80;
      needsConversion = true;
    }
    
    // Background removal check for passport photos
    if (requirements.special?.backgroundRemoval) {
      issues.push('Passport photo should have white background');
      requiredChanges.backgroundRemoval = true;
      needsConversion = true;
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      needsConversion,
      requiredChanges
    };
  }
  
  static async validateResolution(file: File, requirements: FormatRequirements): Promise<{
    isValid: boolean;
    issues: string[];
    needsResize: boolean;
    targetSize?: { width: number; height: number };
  }> {
    if (!file.type.startsWith('image/')) {
      return { isValid: true, issues: [], needsResize: false };
    }
    
    const dimensions = await this.getImageDimensions(file);
    if (!dimensions) {
      return { isValid: false, issues: ['Cannot read image dimensions'], needsResize: false };
    }
    
    const issues: string[] = [];
    let needsResize = false;
    let targetSize: { width: number; height: number } | undefined;
    
    // Check minimum resolution
    if (dimensions.width < requirements.minResolution.width || 
        dimensions.height < requirements.minResolution.height) {
      issues.push(`Image too small: ${dimensions.width}x${dimensions.height}. Minimum: ${requirements.minResolution.width}x${requirements.minResolution.height}`);
      return { isValid: false, issues, needsResize: false }; // Cannot upscale effectively
    }
    
    // Check maximum resolution
    if (dimensions.width > requirements.maxResolution.width || 
        dimensions.height > requirements.maxResolution.height) {
      issues.push(`Image too large: ${dimensions.width}x${dimensions.height}. Maximum: ${requirements.maxResolution.width}x${requirements.maxResolution.height}`);
      needsResize = true;
      
      // Calculate target size maintaining aspect ratio
      const aspectRatio = dimensions.width / dimensions.height;
      const maxAspectRatio = requirements.maxResolution.width / requirements.maxResolution.height;
      
      if (aspectRatio > maxAspectRatio) {
        targetSize = {
          width: requirements.maxResolution.width,
          height: Math.round(requirements.maxResolution.width / aspectRatio)
        };
      } else {
        targetSize = {
          width: Math.round(requirements.maxResolution.height * aspectRatio),
          height: requirements.maxResolution.height
        };
      }
    }
    
    // Check aspect ratio if specified
    if (requirements.aspectRatio) {
      const aspectRatio = dimensions.width / dimensions.height;
      if (aspectRatio < requirements.aspectRatio.min || aspectRatio > requirements.aspectRatio.max) {
        issues.push(`Aspect ratio ${aspectRatio.toFixed(2)} outside allowed range ${requirements.aspectRatio.min}-${requirements.aspectRatio.max}`);
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      needsResize,
      targetSize
    };
  }
  
  private static getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(null);
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        resolve(null);
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  }
}

export default DocumentFormatValidator;