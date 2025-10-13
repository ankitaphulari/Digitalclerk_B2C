export interface OfficialWebsite {
  name: string;
  url: string;
  description: string;
  loginRequired: boolean;
  documentTypes: string[];
}

export interface FormFieldMapping {
  field: string;
  possibleSelectors: string[];
  dataType: 'text' | 'date' | 'number' | 'file';
  required: boolean;
}

export const GOVERNMENT_FORM_MAPPINGS = {
  aadhaar: {
    name: "Aadhaar Card",
    officialWebsites: [
      {
        name: "UIDAI Official Portal",
        url: "https://myaadhaar.uidai.gov.in",
        description: "Update demographic details, download Aadhaar",
        loginRequired: true,
        documentTypes: ["Proof of Identity", "Proof of Address", "Date of Birth"]
      },
      {
        name: "Aadhaar Enrolment",
        url: "https://appointments.uidai.gov.in",
        description: "Book appointment for new Aadhaar enrolment",
        loginRequired: false,
        documentTypes: ["Proof of Identity", "Proof of Address", "Date of Birth"]
      }
    ],
    extractionFields: {
      name: { aliases: ["full_name", "applicant_name"], regex: /name\s*:?\s*([a-zA-Z\s]+)/i },
      aadhaar_number: { aliases: ["aadhaar", "uid"], regex: /(\d{4}\s?\d{4}\s?\d{4})/g },
      dob: { aliases: ["date_of_birth", "birth_date"], regex: /(\d{1,2}[-/]\d{1,2}[-/]\d{4})/g },
      gender: { aliases: ["sex"], regex: /(?:gender|sex)\s*:?\s*(male|female|other)/i },
      address: { aliases: ["permanent_address"], regex: /address\s*:?\s*([^,\n]+(?:,\s*[^,\n]+)*)/i }
    },
    formFieldMappings: [
      { field: "name", possibleSelectors: ["input[name='fullName']", "input[name='name']", "#name"], dataType: "text", required: true },
      { field: "dob", possibleSelectors: ["input[name='dateOfBirth']", "input[name='dob']", "#dob"], dataType: "date", required: true },
      { field: "gender", possibleSelectors: ["select[name='gender']", "input[name='gender']"], dataType: "text", required: true },
      { field: "address", possibleSelectors: ["textarea[name='address']", "input[name='address']"], dataType: "text", required: true }
    ]
  },
  pan: {
    name: "PAN Card",
    officialWebsites: [
      {
        name: "NSDL PAN Services",
        url: "https://www.onlineservices.nsdl.com/paam",
        description: "Apply for new PAN, reprint, or correction",
        loginRequired: false,
        documentTypes: ["Identity Proof", "Address Proof", "Date of Birth Proof"]
      },
      {
        name: "UTI PAN Services",
        url: "https://www.utiitsl.com/UTIITSL/portal/Home.do",
        description: "PAN application and services via UTI",
        loginRequired: false,
        documentTypes: ["Identity Proof", "Address Proof", "Date of Birth Proof"]
      }
    ],
    extractionFields: {
      name: { aliases: ["full_name", "applicant_name"], regex: /name\s*:?\s*([a-zA-Z\s]+)/i },
      pan_number: { aliases: ["pan"], regex: /([A-Z]{5}\d{4}[A-Z])/g },
      fathers_name: { aliases: ["father_name"], regex: /father'?s?\s*name\s*:?\s*([a-zA-Z\s]+)/i },
      dob: { aliases: ["date_of_birth"], regex: /(\d{1,2}[-/]\d{1,2}[-/]\d{4})/g }
    },
    formFieldMappings: [
      { field: "name", possibleSelectors: ["input[name='fullName']", "input[name='applicantName']"], dataType: "text", required: true },
      { field: "pan_number", possibleSelectors: ["input[name='panNumber']", "input[name='pan']"], dataType: "text", required: true },
      { field: "fathers_name", possibleSelectors: ["input[name='fathersName']", "input[name='fatherName']"], dataType: "text", required: true },
      { field: "dob", possibleSelectors: ["input[name='dateOfBirth']", "input[name='dob']"], dataType: "date", required: true }
    ]
  },
  passport: {
    name: "Passport",
    officialWebsites: [
      {
        name: "Passport Seva Portal",
        url: "https://portal2.passportindia.gov.in",
        description: "Apply for fresh passport, renewal, or other services",
        loginRequired: true,
        documentTypes: ["Birth Certificate", "Address Proof", "Identity Proof"]
      }
    ],
    extractionFields: {
      name: { aliases: ["full_name"], regex: /name\s*:?\s*([a-zA-Z\s]+)/i },
      passport_number: { aliases: ["passport"], regex: /([A-Z]\d{7})/g },
      dob: { aliases: ["date_of_birth"], regex: /(\d{1,2}[-/]\d{1,2}[-/]\d{4})/g },
      place_of_birth: { aliases: ["birth_place"], regex: /place\s*of\s*birth\s*:?\s*([a-zA-Z\s,]+)/i },
      issue_date: { aliases: ["date_of_issue"], regex: /issue\s*date\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i },
      expiry_date: { aliases: ["date_of_expiry"], regex: /expiry\s*date\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i }
    },
    formFieldMappings: [
      { field: "name", possibleSelectors: ["input[name='fullName']", "input[name='applicantName']"], dataType: "text", required: true },
      { field: "passport_number", possibleSelectors: ["input[name='passportNumber']", "input[name='passport']"], dataType: "text", required: true },
      { field: "dob", possibleSelectors: ["input[name='dateOfBirth']", "input[name='dob']"], dataType: "date", required: true },
      { field: "place_of_birth", possibleSelectors: ["input[name='placeOfBirth']", "input[name='birthPlace']"], dataType: "text", required: false },
      { field: "issue_date", possibleSelectors: ["input[name='issueDate']", "input[name='dateOfIssue']"], dataType: "date", required: false },
      { field: "expiry_date", possibleSelectors: ["input[name='expiryDate']", "input[name='dateOfExpiry']"], dataType: "date", required: false }
    ]
  },
  driving: {
    name: "Driving License",
    officialWebsites: [
      {
        name: "Parivahan Portal",
        url: "https://parivahan.gov.in",
        description: "Apply for driving license, vehicle registration",
        loginRequired: true,
        documentTypes: ["Identity Proof", "Address Proof", "Age Proof"]
      },
      {
        name: "Sarathi Portal",
        url: "https://sarathi.parivahan.gov.in",
        description: "Driving license related services",
        loginRequired: true,
        documentTypes: ["Identity Proof", "Address Proof", "Age Proof", "Medical Certificate"]
      }
    ],
    extractionFields: {
      name: { aliases: ["holder_name"], regex: /name\s*:?\s*([a-zA-Z\s]+)/i },
      dl_number: { aliases: ["license_number"], regex: /([A-Z]{2}\d{2}\s?\d{11})/g },
      dob: { aliases: ["date_of_birth"], regex: /(\d{1,2}[-/]\d{1,2}[-/]\d{4})/g },
      address: { aliases: ["permanent_address"], regex: /address\s*:?\s*([^,\n]+(?:,\s*[^,\n]+)*)/i },
      vehicle_class: { aliases: ["class"], regex: /class\s*:?\s*([A-Z0-9,\s]+)/i }
    },
    formFieldMappings: [
      { field: "name", possibleSelectors: ["input[name='fullName']", "input[name='applicantName']"], dataType: "text", required: true },
      { field: "dl_number", possibleSelectors: ["input[name='dlNumber']", "input[name='licenseNumber']"], dataType: "text", required: true },
      { field: "dob", possibleSelectors: ["input[name='dateOfBirth']"], dataType: "date", required: true },
      { field: "address", possibleSelectors: ["textarea[name='address']"], dataType: "text", required: true },
      { field: "vehicle_class", possibleSelectors: ["input[name='vehicleClass']"], dataType: "text", required: false }
    ]
  },
  scholarship: {
    name: "Scholarship",
    officialWebsites: [
      {
        name: "MahaDBT Portal",
        url: "https://mahadbt.maharashtra.gov.in",
        description: "Scholarship and DBT services for Maharashtra",
        loginRequired: true,
        documentTypes: ["Caste Certificate", "Income Certificate", "Mark Sheets", "Bank Passbook"]
      }
    ],
    extractionFields: {
      name: { aliases: ["student_name"], regex: /name\s*:?\s*([a-zA-Z\s]+)/i },
      caste_certificate: { aliases: ["caste_cert_no"], regex: /certificate\s*no\.?\s*:?\s*([A-Z0-9/-]+)/i },
      income: { aliases: ["annual_income"], regex: /income\s*:?\s*(?:rs\.?\s*)?(\d+(?:,\d+)*)/i },
      education_details: { aliases: ["course", "class"], regex: /(?:class|course|std)\s*:?\s*([a-zA-Z0-9\s]+)/i }
    },
    formFieldMappings: [
      { field: "name", possibleSelectors: ["input[name='studentName']", "input[name='fullName']"], dataType: "text", required: true },
      { field: "income", possibleSelectors: ["input[name='annualIncome']", "input[name='income']"], dataType: "number", required: true },
      { field: "caste_certificate", possibleSelectors: ["input[name='casteCertNo']"], dataType: "text", required: true },
      { field: "education_details", possibleSelectors: ["input[name='educationDetails']", "input[name='course']", "input[name='class']"], dataType: "text", required: false }
    ]
  },
  gst: {
    name: "GST Registration",
    officialWebsites: [
      {
        name: "GST Portal",
        url: "https://www.gst.gov.in",
        description: "GST registration and compliance portal",
        loginRequired: true,
        documentTypes: ["PAN Card", "Address Proof", "Business Proof"]
      }
    ],
    extractionFields: {
      business_name: { aliases: ["trade_name"], regex: /(?:business|trade)\s*name\s*:?\s*([a-zA-Z\s&]+)/i },
      pan: { aliases: ["pan_number"], regex: /([A-Z]{5}\d{4}[A-Z])/g },
      address: { aliases: ["business_address"], regex: /address\s*:?\s*([^,\n]+(?:,\s*[^,\n]+)*)/i },
      constitution: { aliases: ["business_type"], regex: /constitution\s*:?\s*([a-zA-Z\s]+)/i },
      state: { aliases: ["jurisdiction"], regex: /state\s*:?\s*([a-zA-Z\s]+)/i }
    },
    formFieldMappings: [
      { field: "business_name", possibleSelectors: ["input[name='businessName']", "input[name='tradeName']"], dataType: "text", required: true },
      { field: "pan", possibleSelectors: ["input[name='panNumber']", "input[name='pan']"], dataType: "text", required: true },
      { field: "address", possibleSelectors: ["textarea[name='businessAddress']"], dataType: "text", required: true },
      { field: "constitution", possibleSelectors: ["input[name='constitution']", "input[name='businessType']"], dataType: "text", required: false },
      { field: "state", possibleSelectors: ["input[name='state']", "input[name='jurisdiction']"], dataType: "text", required: false }
    ]
  }
};

// Utility function to detect form type from URL
export const detectFormTypeFromUrl = (url: string): string | null => {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('aadhaar') || urlLower.includes('uidai')) {
    return 'aadhaar';
  } else if (urlLower.includes('pan') || urlLower.includes('nsdl') || urlLower.includes('utiitsl')) {
    return 'pan';
  } else if (urlLower.includes('passport')) {
    return 'passport';
  } else if (urlLower.includes('parivahan') || urlLower.includes('sarathi') || urlLower.includes('driving')) {
    return 'driving';
  } else if (urlLower.includes('mahadbt') || urlLower.includes('scholarship')) {
    return 'scholarship';
  } else if (urlLower.includes('gst')) {
    return 'gst';
  }

  return null;
};

export const getFormConfig = (formType: string) => {
  return GOVERNMENT_FORM_MAPPINGS[formType as keyof typeof GOVERNMENT_FORM_MAPPINGS];
};