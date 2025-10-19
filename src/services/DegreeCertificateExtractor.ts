// Location: src/services/DegreeCertificateExtractor.ts
import { formatNameForDisplay } from '@/utils/inputNormalization';

export interface DegreeCertificateExtractionResult {
  certificateNumber?: string;
  registrationNumber?: string;
  name?: string;
  fathersName?: string;
  degreeName?: string; // B.A., B.Sc., M.A., etc.
  specialization?: string;
  collegeName?: string;
  universityName?: string;
  yearOfPassing?: string;
  monthYear?: string;
  class?: string; // First/Second/Third/Distinction
  dateOfIssue?: string;
  confidence: number;
  extractedFields: Record<string, any>;
}

export class DegreeCertificateExtractor {
  static extractFromDegreeCertificate(ocrText: string): DegreeCertificateExtractionResult {
    const result: DegreeCertificateExtractionResult = {
      confidence: 0,
      extractedFields: {}
    };

    // Certificate Number
    const certMatch = ocrText.match(/(?:Certificate|Cert)\s*(?:No|Number)?\s*:?\s*([A-Z0-9]{8,15})/i);
    if (certMatch) {
      result.certificateNumber = certMatch[1];
      result.extractedFields.certificateNumber = certMatch[1];
      result.confidence += 30;
    }

    // Registration Number
    const regMatch = ocrText.match(/(?:Registration|Reg)\s*(?:No|Number)?\s*:?\s*([A-Z0-9]{8,15})/i);
    if (regMatch) {
      result.registrationNumber = regMatch[1];
      result.extractedFields.registrationNumber = regMatch[1];
    }

    // Name
    const nameMatch = ocrText.match(/(?:Name|Student Name)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i);
    if (nameMatch) {
      result.name = formatNameForDisplay(nameMatch[1]);
      result.extractedFields.name = result.name;
      result.confidence += 15;
    }

    // Father's Name
    const fatherMatch = ocrText.match(/(?:Father'?s?\s*Name)\s*:?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i);
    if (fatherMatch) {
      result.fathersName = formatNameForDisplay(fatherMatch[1]);
      result.extractedFields.fathersName = result.fathersName;
    }

    // Degree Name
    const degreeMatch = ocrText.match(/(?:Degree|Bachelor|Master|B\.?A\.?|B\.?Sc\.?|M\.?A\.?|B\.?Tech\.?|M\.?Tech\.?|MBA|BBA)/i);
    if (degreeMatch) {
      result.degreeName = degreeMatch[0];
      result.extractedFields.degreeName = result.degreeName;
      result.confidence += 20;
    }

    // University Name
    const uniMatch = ocrText.match(/(?:University)\s*:?\s*([A-Za-z\s&.-]{5,100}?)(?=\n|College)/is);
    if (uniMatch) {
      result.universityName = uniMatch[1].trim().replace(/\s+/g, ' ');
      result.extractedFields.universityName = result.universityName;
      result.confidence += 15;
    }

    // Year of Passing
    const yearMatch = ocrText.match(/(?:Year|Passing Year)\s*:?\s*(19\d{2}|20\d{2})/i);
    if (yearMatch) {
      result.yearOfPassing = yearMatch[1];
      result.extractedFields.yearOfPassing = result.yearOfPassing;
      result.confidence += 10;
    }

    // Class/Division
    const classMatch = ocrText.match(/(?:Class|Division)\s*:?\s*(First|Second|Third|Distinction|I|II|III)/i);
    if (classMatch) {
      result.class = classMatch[1];
      result.extractedFields.class = result.class;
      result.confidence += 10;
    }

    return result;
  }
}
