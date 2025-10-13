// Government Portal Information for Direct Website Integration
// No third-party dependencies - just official government website data

export interface GovernmentPortal {
  name: string;
  officialUrl: string;
  description: string;
  applicableDocuments: string[];
  formSelectors?: {
    nameField?: string;
    dobField?: string;
    numberField?: string;
    addressField?: string;
    phoneField?: string;
    emailField?: string;
  };
  supportedStates?: string[];
}

export const GOVERNMENT_PORTALS: Record<string, GovernmentPortal[]> = {
  aadhaar: [
    {
      name: "UIDAI - Aadhaar Services",
      officialUrl: "https://uidai.gov.in/",
      description: "Official portal for all Aadhaar-related services including enrollment, updates, and downloads",
      applicableDocuments: ["aadhaar"],
      formSelectors: {
        nameField: "input[name='name'], input[id='name']",
        dobField: "input[name='dob'], input[id='dob']",
        numberField: "input[name='aadhaar'], input[id='aadhaar']",
        addressField: "textarea[name='address'], textarea[id='address']",
        phoneField: "input[name='mobile'], input[id='mobile']"
      }
    },
    {
      name: "myAadhaar Portal",
      officialUrl: "https://myaadhaar.uidai.gov.in/",
      description: "Download Aadhaar, verify Aadhaar, and access Aadhaar services",
      applicableDocuments: ["aadhaar"],
      formSelectors: {
        numberField: "input[name='uid'], input[id='uid']",
        nameField: "input[name='fullName'], input[id='fullName']"
      }
    }
  ],
  
  pan: [
    {
      name: "NSDL PAN Services",
      officialUrl: "https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html",
      description: "Apply for new PAN card or reprint/correct PAN card",
      applicableDocuments: ["pan"],
      formSelectors: {
        nameField: "input[name='firstName'], input[id='firstName']",
        dobField: "input[name='dateOfBirth'], input[id='dateOfBirth']",
        numberField: "input[name='panNumber'], input[id='panNumber']"
      }
    },
    {
      name: "UTI PAN Services",
      officialUrl: "https://www.utiitsl.com/UTIITSL/portal/Home/index.jsp",
      description: "Apply for PAN card through UTI Infrastructure Technology and Services Limited",
      applicableDocuments: ["pan"]
    },
    {
      name: "Income Tax e-Filing Portal",
      officialUrl: "https://www.incometax.gov.in/iec/foportal/",
      description: "Official income tax portal for PAN-related services",
      applicableDocuments: ["pan"]
    }
  ],

  passport: [
    {
      name: "Passport Seva Online Portal",
      officialUrl: "https://portal2.passportindia.gov.in/AppOnlineProject/online/procFormSubOnline",
      description: "Official portal for passport application and services",
      applicableDocuments: ["passport"],
      formSelectors: {
        nameField: "input[name='givenName'], input[id='givenName']",
        dobField: "input[name='dateOfBirth'], input[id='dateOfBirth']",
        numberField: "input[name='passportNumber'], input[id='passportNumber']",
        addressField: "textarea[name='presentAddress'], textarea[id='presentAddress']"
      }
    },
    {
      name: "mPassport Seva App Portal",
      officialUrl: "https://www.passportindia.gov.in/AppOnlineProject/welcomeLink",
      description: "Mobile-friendly passport services portal",
      applicableDocuments: ["passport"]
    }
  ],

  drivingLicense: [
    {
      name: "Parivahan Sewa - Driving License",
      officialUrl: "https://parivahan.gov.in/parivahan/",
      description: "Official portal for driving license applications and services",
      applicableDocuments: ["drivingLicense"],
      supportedStates: ["All States"],
      formSelectors: {
        nameField: "input[name='applicantName'], input[id='applicantName']",
        dobField: "input[name='dateOfBirth'], input[id='dateOfBirth']",
        numberField: "input[name='dlNumber'], input[id='dlNumber']",
        addressField: "textarea[name='address'], textarea[id='address']"
      }
    },
    {
      name: "Sarathi Portal",
      officialUrl: "https://sarathi.parivahan.gov.in/sarathiservice/stateSelection.do",
      description: "Online driving license and vehicle registration services",
      applicableDocuments: ["drivingLicense"],
      supportedStates: ["All States"]
    }
  ],

  voterID: [
    {
      name: "National Voters' Service Portal",
      officialUrl: "https://www.nvsp.in/",
      description: "Official portal for voter registration and electoral services",
      applicableDocuments: ["voterID"],
      formSelectors: {
        nameField: "input[name='name'], input[id='name']",
        dobField: "input[name='dob'], input[id='dob']",
        numberField: "input[name='voterID'], input[id='voterID']",
        addressField: "textarea[name='address'], textarea[id='address']"
      }
    },
    {
      name: "CEO Electoral Registration",
      officialUrl: "https://electoralsearch.in/",
      description: "Search and verify voter information across states",
      applicableDocuments: ["voterID"],
      supportedStates: ["All States"]
    }
  ],

  // Additional useful government portals
  general: [
    {
      name: "Digital India Portal",
      officialUrl: "https://digitalindia.gov.in/",
      description: "Central hub for digital government services",
      applicableDocuments: ["aadhaar", "pan", "passport", "drivingLicense", "voterID"]
    },
    {
      name: "India.gov.in",
      officialUrl: "https://www.india.gov.in/",
      description: "National portal of India for all government services",
      applicableDocuments: ["aadhaar", "pan", "passport", "drivingLicense", "voterID"]
    },
    {
      name: "DigiLocker",
      officialUrl: "https://digilocker.gov.in/",
      description: "Digital locker for storing and accessing digital documents",
      applicableDocuments: ["aadhaar", "pan", "passport", "drivingLicense", "voterID"]
    }
  ]
};

export function getPortalsForDocument(documentType: string): GovernmentPortal[] {
  return GOVERNMENT_PORTALS[documentType] || [];
}

export function getAllPortals(): GovernmentPortal[] {
  return Object.values(GOVERNMENT_PORTALS).flat();
}

export function searchPortals(query: string): GovernmentPortal[] {
  const allPortals = getAllPortals();
  const lowercaseQuery = query.toLowerCase();
  
  return allPortals.filter(portal => 
    portal.name.toLowerCase().includes(lowercaseQuery) ||
    portal.description.toLowerCase().includes(lowercaseQuery) ||
    portal.applicableDocuments.some(doc => doc.toLowerCase().includes(lowercaseQuery))
  );
}

export function getFormSelectorsForPortal(portalUrl: string): Record<string, string> | null {
  const allPortals = getAllPortals();
  const portal = allPortals.find(p => p.officialUrl === portalUrl);
  return portal?.formSelectors || null;
}