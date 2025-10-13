// src/lib/documentConstants.ts

export enum DOCUMENT_TYPE {
  PASSPORT = "passport",
  DRIVERS_LICENSE = "drivers_license", 
  NATIONAL_ID = "national_id",
  BIRTH_CERTIFICATE = "birth_certificate",
  SOCIAL_SECURITY = "social_security",
  UTILITY_BILL = "utility_bill",
  BANK_STATEMENT = "bank_statement",
  TAX_DOCUMENT = "tax_document",
  VISA = "visa",
  WORK_PERMIT = "work_permit"
}

export type DocumentType = DOCUMENT_TYPE;

export const ACCEPTED = [
  "image/jpeg",
  "image/jpg", 
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "image/tiff",
  "image/bmp"
] as const;

export const REQUIRED_DOCS = {
  [DOCUMENT_TYPE.PASSPORT]: ["passport_front", "passport_back"],
  [DOCUMENT_TYPE.DRIVERS_LICENSE]: ["license_front", "license_back"],
  [DOCUMENT_TYPE.NATIONAL_ID]: ["id_front", "id_back"],
  [DOCUMENT_TYPE.BIRTH_CERTIFICATE]: ["birth_certificate"],
  [DOCUMENT_TYPE.SOCIAL_SECURITY]: ["ssn_card_front", "ssn_card_back"],
  [DOCUMENT_TYPE.UTILITY_BILL]: ["utility_bill"],
  [DOCUMENT_TYPE.BANK_STATEMENT]: ["bank_statement"],
  [DOCUMENT_TYPE.TAX_DOCUMENT]: ["tax_document"],
  [DOCUMENT_TYPE.VISA]: ["visa_front", "visa_back"],
  [DOCUMENT_TYPE.WORK_PERMIT]: ["work_permit_front", "work_permit_back"]
} as const;

// Helper functions
export const getDocumentTypeLabel = (documentType: DocumentType): string => {
  const labels: Record<DocumentType, string> = {
    [DOCUMENT_TYPE.PASSPORT]: "Passport",
    [DOCUMENT_TYPE.DRIVERS_LICENSE]: "Driver's License",
    [DOCUMENT_TYPE.NATIONAL_ID]: "National ID",
    [DOCUMENT_TYPE.BIRTH_CERTIFICATE]: "Birth Certificate",
    [DOCUMENT_TYPE.SOCIAL_SECURITY]: "Social Security Card",
    [DOCUMENT_TYPE.UTILITY_BILL]: "Utility Bill",
    [DOCUMENT_TYPE.BANK_STATEMENT]: "Bank Statement",
    [DOCUMENT_TYPE.TAX_DOCUMENT]: "Tax Document",
    [DOCUMENT_TYPE.VISA]: "Visa",
    [DOCUMENT_TYPE.WORK_PERMIT]: "Work Permit"
  };
  return labels[documentType] || documentType;
};

export const isAcceptedFileType = (mimeType: string): boolean => {
  return ACCEPTED.includes(mimeType as any);
};

export const getRequiredDocuments = (documentType: DocumentType): readonly string[] => {
  return REQUIRED_DOCS[documentType] || [];
};
