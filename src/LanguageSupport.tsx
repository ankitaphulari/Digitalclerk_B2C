import React, { useState, createContext, useContext, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

// Complete language translations with ALL the keys you need
const translations = {
  en: {
    // App branding
    title: "DigitalClerk",
    welcome: "Welcome to DigitalClerk",
    selectLanguage: "Select Language",
    
    // Navigation
    home: "Home",
    forms: "Forms", 
    settings: "Settings",
    help: "Help",
    about: "About",
    contact: "Contact",
    
    // Form types
    chooseForm: "Choose Form Type",
    fillForm: "Fill Form",
    submit: "Submit",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    
    // Form fields
    name: "Name",
    firstName: "First Name",
    middleName: "Middle Name", 
    lastName: "Last Name",
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    mobile: "Mobile Number",
    address: "Address",
    city: "City",
    state: "State",
    country: "Country",
    zipCode: "ZIP Code",
    pinCode: "PIN Code",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    
    // Government Forms
    aadhaarNumber: "Aadhaar Number",
    panNumber: "PAN Number",
    passportNumber: "Passport Number",
    drivingLicense: "Driving License",
    
    // Document types
    aadhaarCard: "Aadhaar Card",
    panCard: "PAN Card", 
    passport: "Passport",
    drivingLicenseCard: "Driving License",
    
    // Form labels
    personalDetails: "Personal Details",
    contactDetails: "Contact Details",
    addressDetails: "Address Details",
    documentDetails: "Document Details",
    
    // Common actions
    next: "Next",
    previous: "Previous",
    back: "Back",
    continue: "Continue",
    finish: "Finish",
    close: "Close",
    open: "Open",
    upload: "Upload",
    download: "Download",
    
    // Status messages
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Information",
    loading: "Loading...",
    saving: "Saving...",
    processing: "Processing...",
    
    // Form validation
    required: "This field is required",
    invalidEmail: "Please enter a valid email",
    invalidPhone: "Please enter a valid phone number",
    invalidAadhaar: "Please enter a valid Aadhaar number",
    invalidPAN: "Please enter a valid PAN number",
    
    // Buttons
    loginButton: "Login",
    signupButton: "Sign Up", 
    logoutButton: "Logout",
    submitForm: "Submit Form",
    resetForm: "Reset Form",
    saveProgress: "Save Progress",
    
    // General
    yes: "Yes",
    no: "No",
    ok: "OK",
    or: "or",
    and: "and",
    
    // Placeholder text
    enterName: "Enter your name",
    enterEmail: "Enter your email",
    enterPhone: "Enter your phone number",
    selectState: "Select your state",
    selectCity: "Select your city",

    // Navigation extras
    features: "Features",
    howItWorks: "How it works",
    supportedForms: "Supported Forms",
    signIn: "Sign In",
    signOut: "Sign Out",
    advancedFeatures: "Advanced Features",

    // Hero
    aiPoweredFormAutomation: "AI-Powered Form Automation",
    uploadOnce: "Upload Once",
    fillAnywhere: "Fill Anywhere",
    hero: {
      subtitle: "Simplify form filling with AI-powered document extraction. Upload your documents once, and let our intelligent system help auto-fill forms quickly and securely.",
      bullets: {
        ocr: "Instant OCR Extraction",
        merge: "Multi-Document Merge",
        encryption: "Secure Encryption"
      },
      stats: {
        aiPowered: "AI-Powered",
        secure: "Secure",
        easy: "Easy"
      },
      statsDesc: {
        smartAutomation: "Smart Automation",
        localProcessing: "Local Processing",
        quickSetup: "Quick Setup"
      },
      imageAlt: "DigitalClerk AI Assistant"
    },

    // Common CTA
    getStartedFree: "Get Started Free",
    watchDemo: "Watch Demo",

    // Trust indicators
    trust: {
      secureProcessing: "Secure Processing",
      quickSetup: "Quick Setup",
      growingCommunity: "Growing Community",
      smartTechnology: "Smart Technology"
    },

    // Form selector
    formSelector: {
      title: "Popular Government Forms",
      description: "Pick a form to get started quickly or use our AI to fill automatically.",
      searchPlaceholder: "Search forms...",
      buttons: {
        smartAutoFill: "Smart Auto-Fill",
        manualForm: "Manual Form"
      },
      ctaMissing: "Can't find your form?",
      ctaDesc: "No worries! Just paste the form URL and our AI will automatically recognize and help you fill it out.",
      uploadCustomForm: "Upload Custom Form"
    },

    // Features section
    featuresSection: {
      badge: "Revolutionary Form Automation",
      title: "Why Choose DigitalClerk?",
      subtitle: "Experience the future of government form handling with our comprehensive AI-powered solution. From document extraction to cross-platform automation, we've revolutionized every step.",
      features: {
        uploadOnce: {
          title: "Upload Once, Fill Anywhere",
          description: "Upload your documents once and let our AI automatically fill forms across multiple government platforms. Save hours of repetitive data entry.",
          highlight: "Core Feature"
        },
        smartMerge: {
          title: "Smart Multi-Document Merge",
          description: "Intelligently merges data from multiple documents (Aadhaar, PAN, marksheets) into a unified profile for comprehensive form filling.",
          highlight: "AI-Powered"
        },
        advancedOcr: {
          title: "Advanced OCR + AI Parsing",
          description: "Combines Google Vision OCR with OpenAI parsing for 95%+ accurate data extraction from documents in any condition.",
          highlight: "Cutting-Edge"
        },
        autoUpload: {
          title: "Auto-Upload & Compression",
          description: "Automatically compresses files under 200KB and converts JPG to PDF. Optimizes attachments for government portals.",
          highlight: "Smart Processing"
        },
        localStorage: {
          title: "Local Storage & Encryption",
          description: "Encrypts sensitive data locally with bank-grade security. Your information never leaves your device unprotected.",
          highlight: "Privacy First"
        },
        crossDevice: {
          title: "Cross-Device Sync",
          description: "Generate QR codes for instant login on any device. Start on mobile, finish on desktop seamlessly.",
          highlight: "Convenience"
        },
        multiLanguage: {
          title: "Multi-Language Support",
          description: "Full support for English, Hindi, Marathi, and Tamil with intelligent field translation and local script recognition.",
          highlight: "4 Languages"
        },
        smartField: {
          title: "Smart Field Matching",
          description: "AI remembers your previous entries and auto-fills similar fields across different forms with contextual accuracy.",
          highlight: "Learning AI"
        },
        batchProcessing: {
          title: "Batch Processing Mode",
          description: "Perfect for cybercafés and consultants - process multiple profiles efficiently with template-based workflows.",
          highlight: "Professional"
        }
      },
      cta: {
        title: "Ready to Experience the Future?",
        subtitle: "Experience the future of form filling with intelligent automation. Save time and reduce errors with our AI-powered solution.",
        startTrial: "Start Free Trial",
        watchDemo: "Watch Demo",
        benefits: {
          noCard: "No Credit Card Required",
          freeForever: "Free Forever Plan",
          setup2min: "Setup in 2 Minutes"
        }
      }
    },

    // Intelligent Automation page
    automation: {
      backToDashboard: "Back to Dashboard",
      formNotFound: "Form not found:",
      titlePrefix: "Intelligent Form Automation -",
      steps: {
        select: "Select Website",
        upload: "Upload Documents",
        review: "Auto-Fill Guide"
      },
      step: "Step",
      of: "of",
      selected: "Selected",
      uploadRequiredDocuments: "Upload Required Documents",
      continueToGuide: "Continue to Auto-Fill Guide",
      extractedData: "Extracted Data",
      noData: "No data extracted. Please upload documents first.",
      formFillingInstructions: "Form Filling Instructions",
      security: {
        title: "Important Security Notice",
        text: "This system extracts data from your documents and provides guidance for manual form filling. For security reasons, you must always manually submit forms on government websites. Never use browser automation tools or share your login credentials."
      }
    },

    // Government Form Selector
    gfs: {
      officialWebsites: "Official Websites",
      loginRequiredHint: "Login required - Have your credentials ready",
      selectWebsite: "Select Website",
      searchByCustomUrl: "Search by Custom URL",
      pasteAnyUrl: "Paste any government form URL",
      urlPlaceholder: "https://example.gov.in/form-page",
      validating: "Validating...",
      detectForm: "Detect Form",
      configNotFound: "Form configuration not found for:",
      tipLabel: "Tip:",
      tipText: "The system will automatically detect the form type based on the URL and suggest appropriate document requirements and field mappings."
    },

    // Upload component
    uploader: {
      heading: "Upload Documents",
      requiredDocuments: "Required Documents:",
      scanDocument: "Scan Document",
      uploadFile: "Upload File",
      capture: "Capture"
    }
  },
  
  hi: {
    // App branding
    title: "डिजिटलक्लर्क",
    welcome: "डिजिटलक्लर्क में आपका स्वागत है",
    selectLanguage: "भाषा चुनें",
    
    // Navigation
    home: "होम",
    forms: "फॉर्म",
    settings: "सेटिंग्स", 
    help: "सहायता",
    about: "के बारे में",
    contact: "संपर्क",
    
    // Form types
    chooseForm: "फॉर्म प्रकार चुनें",
    fillForm: "फॉर्म भरें",
    submit: "जमा करें",
    save: "सेव करें",
    cancel: "रद्द करें",
    edit: "संपादित करें",
    delete: "हटाएं",
    view: "देखें",
    
    // Form fields
    name: "नाम",
    firstName: "पहला नाम",
    middleName: "मध्य नाम",
    lastName: "अंतिम नाम", 
    fullName: "पूरा नाम",
    email: "ईमेल",
    phone: "फोन",
    mobile: "मोबाइल नंबर",
    address: "पता",
    city: "शहर",
    state: "राज्य", 
    country: "देश",
    zipCode: "पिन कोड",
    pinCode: "पिन कोड",
    dateOfBirth: "जन्म तिथि",
    gender: "लिंग",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    
    // Government Forms
    aadhaarNumber: "आधार नंबर",
    panNumber: "पैन नंबर",
    passportNumber: "पासपोर्ट नंबर",
    drivingLicense: "ड्राइविंग लाइसेंस",
    
    // Document types
    aadhaarCard: "आधार कार्ड",
    panCard: "पैन कार्ड",
    passport: "पासपोर्ट", 
    drivingLicenseCard: "ड्राइविंग लाइसेंस",
    
    // Form labels
    personalDetails: "व्यक्तिगत विवरण",
    contactDetails: "संपर्क विवरण",
    addressDetails: "पता विवरण",
    documentDetails: "दस्तावेज़ विवरण",
    
    // Common actions
    next: "अगला",
    previous: "पिछला",
    back: "वापस",
    continue: "जारी रखें",
    finish: "समाप्त",
    close: "बंद करें",
    open: "खोलें",
    upload: "अपलोड करें",
    download: "डाउनलोड करें",
    
    // Status messages
    success: "सफलता",
    error: "त्रुटि",
    warning: "चेतावनी",
    info: "जानकारी",
    loading: "लोड हो रहा है...",
    saving: "सेव हो रहा है...",
    processing: "प्रोसेसिंग...",
    
    // Form validation
    required: "यह फील्ड आवश्यक है",
    invalidEmail: "कृपया एक वैध ईमेल दर्ज करें",
    invalidPhone: "कृपया एक वैध फोन नंबर दर्ज करें", 
    invalidAadhaar: "कृपया एक वैध आधार नंबर दर्ज करें",
    invalidPAN: "कृपया एक वैध पैन नंबर दर्ज करें",
    
    // Buttons
    loginButton: "लॉगिन",
    signupButton: "साइन अप",
    logoutButton: "लॉगआउट",
    submitForm: "फॉर्म जमा करें",
    resetForm: "फॉर्म रीसेट करें",
    saveProgress: "प्रगति सेव करें",
    
    // General
    yes: "हाँ",
    no: "नहीं", 
    ok: "ठीक है",
    or: "या",
    and: "और",
    
    // Placeholder text
    enterName: "अपना नाम दर्ज करें",
    enterEmail: "अपना ईमेल दर्ज करें",
    enterPhone: "अपना फोन नंबर दर्ज करें",
    selectState: "अपना राज्य चुनें",
    selectCity: "अपना शहर चुनें",

    // Navigation extras
    features: "विशेषताएँ",
    howItWorks: "यह कैसे काम करता है",
    supportedForms: "समर्थित फॉर्म",
    signIn: "साइन इन",
    signOut: "साइन आउट",
    advancedFeatures: "उन्नत सुविधाएँ",

    // Hero
    aiPoweredFormAutomation: "एआई संचालित फॉर्म ऑटोमेशन",
    uploadOnce: "एक बार अपलोड करें",
    fillAnywhere: "कहीं भी भरें",
    hero: {
      subtitle: "एआई संचालित दस्तावेज़ निष्कर्षण के साथ फॉर्म भरना आसान बनाएं। अपने दस्तावेज़ एक बार अपलोड करें, और हमारा बुद्धिमान सिस्टम जल्दी और सुरक्षित रूप से फॉर्म ऑटो-फिल करने में मदद करेगा।",
      bullets: {
        ocr: "तुरंत ओसीआर निष्कर्षण",
        merge: "मल्टी-डॉक्यूमेंट मर्ज",
        encryption: "सुरक्षित एन्क्रिप्शन"
      },
      stats: {
        aiPowered: "एआई-संचालित",
        secure: "सुरक्षित",
        easy: "आसान"
      },
      statsDesc: {
        smartAutomation: "स्मार्ट ऑटोमेशन",
        localProcessing: "स्थानीय प्रोसेसिंग",
        quickSetup: "तेजी से सेटअप"
      },
      imageAlt: "डिजिटलक्लर्क एआई असिस्टेंट"
    },

    // Common CTA
    getStartedFree: "फ्री में शुरू करें",
    watchDemo: "डेमो देखें",

    // Trust indicators
    trust: {
      secureProcessing: "सुरक्षित प्रोसेसिंग",
      quickSetup: "तेजी से सेटअप",
      growingCommunity: "बढ़ता समुदाय",
      smartTechnology: "स्मार्ट टेक्नोलॉजी"
    },

    // Form selector
    formSelector: {
      title: "लोकप्रिय सरकारी फॉर्म",
      description: "जल्दी शुरू करने के लिए एक फॉर्म चुनें या हमारे एआई से ऑटो-फिल करवाएं।",
      searchPlaceholder: "फॉर्म खोजें...",
      buttons: {
        smartAutoFill: "स्मार्ट ऑटो-फिल",
        manualForm: "मैन्युअल फॉर्म"
      },
      ctaMissing: "अपना फॉर्म नहीं मिला?",
      ctaDesc: "कोई बात नहीं! बस फॉर्म URL पेस्ट करें और हमारा एआई इसे पहचान कर आपको भरने में मदद करेगा।",
      uploadCustomForm: "कस्टम फॉर्म अपलोड करें"
    },

    // Features section
    featuresSection: {
      badge: "क्रांतिकारी फॉर्म ऑटोमेशन",
      title: "डिजिटलक्लर्क क्यों चुनें?",
      subtitle: "एआई-पावर्ड सॉल्यूशन के साथ सरकारी फॉर्म हैंडलिंग का भविष्य अनुभव करें। दस्तावेज़ निष्कर्षण से लेकर क्रॉस-प्लेटफ़ॉर्म ऑटोमेशन तक, हमने हर चरण को बदल दिया है।",
      features: {
        uploadOnce: {
          title: "एक बार अपलोड करें, कहीं भी भरें",
          description: "अपने दस्तावेज़ एक बार अपलोड करें और हमारे एआई को स्वचालित रूप से कई सरकारी प्लेटफ़ॉर्म पर फॉर्म भरने दें। घंटों के दोहराए जाने वाले डेटा एंट्री से बचें।",
          highlight: "मुख्य सुविधा"
        },
        smartMerge: {
          title: "स्मार्ट मल्टी-डॉक्यूमेंट मर्ज",
          description: "कई दस्तावेज़ों (आधार, पैन, मार्कशीट) से डेटा को बुद्धिमानी से मिलाकर व्यापक फॉर्म भरने के लिए एक एकीकृत प्रोफ़ाइल बनाता है।",
          highlight: "एआई-संचालित"
        },
        advancedOcr: {
          title: "उन्नत ओसीआर + एआई पार्सिंग",
          description: "किसी भी स्थिति में दस्तावेज़ों से 95%+ सटीक डेटा निष्कर्षण के लिए Google Vision OCR को OpenAI पार्सिंग के साथ जोड़ता है।",
          highlight: "अत्याधुनिक"
        },
        autoUpload: {
          title: "ऑटो-अपलोड और कंप्रेशन",
          description: "फ़ाइलों को स्वचालित रूप से 200KB के नीचे कंप्रेस करता है और JPG को PDF में बदलता है। सरकारी पोर्टल के लिए अटैचमेंट को अनुकूलित करता है।",
          highlight: "स्मार्ट प्रोसेसिंग"
        },
        localStorage: {
          title: "स्थानीय भंडारण और एन्क्रिप्शन",
          description: "बैंक-ग्रेड सुरक्षा के साथ संवेदनशील डेटा को स्थानीय रूप से एन्क्रिप्ट करता है। आपकी जानकारी कभी भी असुरक्षित रूप से आपके डिवाइस से बाहर नहीं जाती।",
          highlight: "गोपनीयता प्राथमिकता"
        },
        crossDevice: {
          title: "क्रॉस-डिवाइस सिंक",
          description: "किसी भी डिवाइस पर तुरंत लॉगिन के लिए QR कोड जेनरेट करें। मोबाइल पर शुरू करें, डेस्कटॉप पर समाप्त करें।",
          highlight: "सुविधा"
        },
        multiLanguage: {
          title: "बहु-भाषा समर्थन",
          description: "बुद्धिमान फ़ील्ड अनुवाद और स्थानीय स्क्रिप्ट पहचान के साथ अंग्रेजी, हिंदी, मराठी और तमिल का पूर्ण समर्थन।",
          highlight: "4 भाषाएं"
        },
        smartField: {
          title: "स्मार्ट फ़ील्ड मैचिंग",
          description: "एआई आपकी पिछली प्रविष्टियों को याद रखता है और संदर्भ सटीकता के साथ विभिन्न फॉर्म में समान फ़ील्ड को ऑटो-फिल करता है।",
          highlight: "सीखने वाला एआई"
        },
        batchProcessing: {
          title: "बैच प्रोसेसिंग मोड",
          description: "साइबर कैफे और सलाहकारों के लिए परफेक्ट - टेम्प्लेट-आधारित वर्कफ़्लो के साथ कई प्रोफ़ाइल को कुशलता से प्रोसेस करें।",
          highlight: "पेशेवर"
        }
      },
      cta: {
        title: "भविष्य का अनुभव करने के लिए तैयार?",
        subtitle: "बुद्धिमान ऑटोमेशन के साथ फॉर्म भरने का भविष्य अनुभव करें। समय बचाएं और त्रुटियां कम करें।",
        startTrial: "फ्री ट्रायल शुरू करें",
        watchDemo: "डेमो देखें",
        benefits: {
          noCard: "क्रेडिट कार्ड की आवश्यकता नहीं",
          freeForever: "हमेशा के लिए फ्री प्लान",
          setup2min: "2 मिनट में सेटअप"
        }
      }
    },

    // Intelligent Automation page
    automation: {
      backToDashboard: "डैशबोर्ड पर वापस",
      formNotFound: "फॉर्म नहीं मिला:",
      titlePrefix: "इंटेलिजेंट फॉर्म ऑटोमेशन -",
      steps: {
        select: "वेबसाइट चुनें",
        upload: "दस्तावेज़ अपलोड करें",
        review: "ऑटो-फिल गाइड"
      },
      step: "चरण",
      of: "का",
      selected: "चयनित",
      uploadRequiredDocuments: "आवश्यक दस्तावेज़ अपलोड करें",
      continueToGuide: "ऑटो-फिल गाइड पर जाएं",
      extractedData: "निकाला गया डेटा",
      noData: "कोई डेटा नहीं निकला। कृपया पहले दस्तावेज़ अपलोड करें।",
      formFillingInstructions: "फॉर्म भरने के निर्देश",
      security: {
        title: "महत्वपूर्ण सुरक्षा सूचना",
        text: "यह प्रणाली आपके दस्तावेज़ों से डेटा निकालती है और मैनुअल फॉर्म भरने के लिए मार्गदर्शन प्रदान करती है। सुरक्षा कारणों से, आपको हमेशा सरकारी वेबसाइटों पर फॉर्म मैनुअल रूप से जमा करना चाहिए। ब्राउज़र ऑटोमेशन टूल का उपयोग न करें और अपने लॉगिन क्रेडेंशियल साझा न करें।"
      }
    },

    // Government Form Selector
    gfs: {
      officialWebsites: "आधिकारिक वेबसाइटें",
      loginRequiredHint: "लॉगिन आवश्यक - अपने क्रेडेंशियल तैयार रखें",
      selectWebsite: "वेबसाइट चुनें",
      searchByCustomUrl: "कस्टम URL द्वारा खोजें",
      pasteAnyUrl: "कोई भी सरकारी फॉर्म URL पेस्ट करें",
      urlPlaceholder: "https://example.gov.in/form-page",
      validating: "मान्य किया जा रहा है...",
      detectForm: "फॉर्म पहचानें",
      configNotFound: "इसके लिए कॉन्फ़िगरेशन नहीं मिला:",
      tipLabel: "टिप:",
      tipText: "सिस्टम URL के आधार पर फॉर्म प्रकार को स्वचालित रूप से पहचान लेगा और उपयुक्त दस्तावेज़ आवश्यकताएं और फ़ील्ड मैपिंग सुझाएगा।"
    },

    // Upload component
    uploader: {
      heading: "दस्तावेज़ अपलोड करें",
      requiredDocuments: "आवश्यक दस्तावेज़:",
      scanDocument: "दस्तावेज़ स्कैन करें",
      uploadFile: "फ़ाइल अपलोड करें",
      capture: "कैप्चर"
    }
  },
  mr: {
    // App branding
    title: "डिजिटलक्लर्क",
    welcome: "डिजिटलक्लर्क मध्ये आपले स्वागत आहे",
    selectLanguage: "भाषा निवडा",
    
    // Navigation
    home: "होम",
    forms: "फॉर्म",
    settings: "सेटिंग्ज",
    help: "मदत",
    about: "च्याबद्दल",
    contact: "संपर्क",
    
    // Form types
    chooseForm: "फॉर्म प्रकार निवडा",
    fillForm: "फॉर्म भरा",
    submit: "सबमिट करा",
    save: "सेव्ह करा", 
    cancel: "रद्द करा",
    edit: "संपादित करा",
    delete: "हटवा",
    view: "पहा",
    
    // Form fields
    name: "नाव",
    firstName: "पहिले नाव",
    middleName: "मधले नाव",
    lastName: "आडनाव",
    fullName: "पूर्ण नाव",
    email: "ईमेल",
    phone: "फोन",
    mobile: "मोबाईल नंबर",
    address: "पत्ता", 
    city: "शहर",
    state: "राज्य",
    country: "देश",
    zipCode: "पिन कोड",
    pinCode: "पिन कोड", 
    dateOfBirth: "जन्म तारीख",
    gender: "लिंग",
    male: "पुरुष",
    female: "स्त्री",
    other: "इतर",
    
    // Government Forms
    aadhaarNumber: "आधार नंबर",
    panNumber: "पॅन नंबर",
    passportNumber: "पासपोर्ट नंबर",
    drivingLicense: "ड्रायव्हिंग लायसन्स",
    
    // Document types
    aadhaarCard: "आधार कार्ड",
    panCard: "पॅन कार्ड",
    passport: "पासपोर्ट",
    drivingLicenseCard: "ड्रायव्हिंग लायसन्स",
    
    // Form labels
    personalDetails: "वैयक्तिक तपशील",
    contactDetails: "संपर्क तपशील", 
    addressDetails: "पत्ता तपशील",
    documentDetails: "दस्तऐवज तपशील",
    
    // Common actions
    next: "पुढील",
    previous: "मागील",
    back: "परत",
    continue: "चालू ठेवा",
    finish: "समाप्त",
    close: "बंद करा",
    open: "उघडा",
    upload: "अपलोड करा",
    download: "डाउनलोड करा",
    
    // Status messages
    success: "यश", 
    error: "त्रुटी",
    warning: "चेतावणी",
    info: "माहिती",
    loading: "लोड होत आहे...",
    saving: "सेव्ह होत आहे...",
    processing: "प्रक्रिया करत आहे...",
    
    // Form validation
    required: "हे फील्ड आवश्यक आहे",
    invalidEmail: "कृपया एक वैध ईमेल प्रविष्ट करा",
    invalidPhone: "कृपया एक वैध फोन नंबर प्रविष्ट करा",
    invalidAadhaar: "कृपया एक वैध आधार नंबर प्रविष्ट करा", 
    invalidPAN: "कृपया एक वैध पॅन नंबर प्रविष्ट करा",
    
    // Buttons
    loginButton: "लॉगिन",
    signupButton: "साइन अप",
    logoutButton: "लॉगआउट", 
    submitForm: "फॉर्म सबमिट करा",
    resetForm: "फॉर्म रीसेट करा",
    saveProgress: "प्रगती सेव्ह करा",
    
    // General
    yes: "होय",
    no: "नाही",
    ok: "ठीक आहे",
    or: "किंवा",
    and: "आणि",
    
    // Placeholder text
    enterName: "आपले नाव प्रविष्ट करा",
    enterEmail: "आपला ईमेल प्रविष्ट करा",
    enterPhone: "आपला फोन नंबर प्रविष्ट करा",
    selectState: "आपले राज्य निवडा",
    selectCity: "आपले शहर निवडा",

    // Navigation extras
    features: "वैशिष्ट्ये",
    howItWorks: "हे कसे कार्य करते",
    supportedForms: "समर्थित फॉर्म",
    signIn: "साइन इन",
    signOut: "साइन आउट",
    advancedFeatures: "प्रगत वैशिष्ट्ये",

    // Hero
    aiPoweredFormAutomation: "एआय-संचालित फॉर्म स्वयंचलन",
    uploadOnce: "एकदाच अपलोड करा",
    fillAnywhere: "कुठेही भरा",
    hero: {
      subtitle: "एआय-संचालित दस्तऐवज निष्कर्षणासह फॉर्म भरणे सोपे करा. आपले दस्तऐवज एकदाच अपलोड करा आणि आमची बुद्धिमान प्रणाली फॉर्म जलद आणि सुरक्षितपणे ऑटो-फिल करण्यात मदत करेल.",
      bullets: {
        ocr: "तत्काळ OCR निष्कर्षण",
        merge: "एकाधिक दस्तऐवज मर्ज",
        encryption: "सुरक्षित एन्क्रिप्शन"
      },
      stats: {
        aiPowered: "एआय-संचालित",
        secure: "सुरक्षित",
        easy: "सोपे"
      },
      statsDesc: {
        smartAutomation: "स्मार्ट ऑटोमेशन",
        localProcessing: "स्थानिक प्रक्रिया",
        quickSetup: "जलद सेटअप"
      },
      imageAlt: "डिजिटलक्लर्क एआय सहाय्यक"
    },

    // Common CTA
    getStartedFree: "फ्रीमध्ये सुरू करा",
    watchDemo: "डेमो पाहा",

    // Trust indicators
    trust: {
      secureProcessing: "सुरक्षित प्रक्रिया",
      quickSetup: "जलद सेटअप",
      growingCommunity: "वाढणारे समुदाय",
      smartTechnology: "स्मार्ट तंत्रज्ञान"
    },

    // Form selector
    formSelector: {
      title: "लोकप्रिय सरकारी फॉर्म",
      description: "जलद सुरू करण्यासाठी फॉर्म निवडा किंवा आमच्या एआयने ऑटो-फिल करा.",
      searchPlaceholder: "फॉर्म शोधा...",
      buttons: {
        smartAutoFill: "स्मार्ट ऑटो-फिल",
        manualForm: "मॅन्युअल फॉर्म"
      },
      ctaMissing: "आपला फॉर्म सापडत नाही?",
      ctaDesc: "काही हरकत नाही! फॉर्म URL पेस्ट करा आणि आमचा एआय ते ओळखून तुम्हाला भरायला मदत करेल.",
      uploadCustomForm: "कस्टम फॉर्म अपलोड करा"
    },

    // Features section
    featuresSection: {
      badge: "क्रांतिकारी फॉर्म स्वयंचलन",
      title: "डिजिटलक्लर्क का निवडावे?",
      subtitle: "एआय-पावर्ड सोल्यूशनसह सरकारी फॉर्म हँडलिंगचे भविष्य अनुभवा. दस्तऐवज निष्कर्षणापासून क्रॉस-प्लॅटफॉर्म ऑटोमेशनपर्यंत, आम्ही प्रत्येक टप्प्यात बदल केले आहेत.",
      features: {
        uploadOnce: {
          title: "एकदाच अपलोड करा, कुठेही भरा",
          description: "आपली कागदपत्रे एकदाच अपलोड करा आणि आमच्या एआयला अनेक सरकारी प्लॅटफॉर्मवर स्वयंचलितपणे फॉर्म भरू द्या. तासांच्या पुनरावृत्ती डेटा एंट्रीपासून बचत करा.",
          highlight: "मुख्य वैशिष्ट्य"
        },
        smartMerge: {
          title: "स्मार्ट मल्टी-डॉक्यूमेंट मर्ज",
          description: "अनेक दस्तऐवजांमधून (आधार, पॅन, मार्कशीट) डेटा बुद्धिमानपणे मिसळून व्यापक फॉर्म भरण्यासाठी एकीकृत प्रोफाइल तयार करतो.",
          highlight: "एआय-संचालित"
        },
        advancedOcr: {
          title: "प्रगत OCR + एआय पार्सिंग",
          description: "कोणत्याही परिस्थितीत दस्तऐवजांमधून 95%+ अचूक डेटा निष्कर्षणासाठी Google Vision OCR ला OpenAI पार्सिंगसह जोडतो.",
          highlight: "अत्याधुनिक"
        },
        autoUpload: {
          title: "ऑटो-अपलोड आणि कम्प्रेशन",
          description: "फाइल्स 200KB खाली स्वयंचलितपणे कंप्रेस करतो आणि JPG ला PDF मध्ये रुपांतरित करतो. सरकारी पोर्टलसाठी अ‍ॅटॅचमेंट अनुकूलित करतो.",
          highlight: "स्मार्ट प्रक्रिया"
        },
        localStorage: {
          title: "स्थानिक भंडारण आणि एन्क्रिप्शन",
          description: "बँक-ग्रेड सुरक्षेसह संवेदनशील डेटा स्थानिकपणे एन्क्रिप्ट करतो. आपली माहिती कधीही असुरक्षितपणे आपल्या डिव्हाइसमधून बाहेर जात नाही.",
          highlight: "गोपनीयता प्राथमिकता"
        },
        crossDevice: {
          title: "क्रॉस-डिव्हाइस सिंक",
          description: "कोणत्याही डिव्हाइसवर तत्काळ लॉगिनसाठी QR कोड तयार करा. मोबाइलवर सुरू करा, डेस्कटॉपवर पूर्ण करा.",
          highlight: "सुविधा"
        },
        multiLanguage: {
          title: "बहु-भाषा समर्थन",
          description: "बुद्धिमान फील्ड भाषांतर आणि स्थानिक स्क्रिप्ट ओळखीसह इंग्रजी, हिंदी, मराठी आणि तमिळचे पूर्ण समर्थन.",
          highlight: "4 भाषा"
        },
        smartField: {
          title: "स्मार्ट फील्ड मॅचिंग",
          description: "एआय आपल्या मागील नोंदी लक्षात ठेवतो आणि संदर्भ अचूकतेसह विविध फॉर्ममध्ये समान फील्ड ऑटो-फिल करतो.",
          highlight: "शिकणारा एआय"
        },
        batchProcessing: {
          title: "बॅच प्रोसेसिंग मोड",
          description: "सायबर कॅफे आणि सल्लागारांसाठी परफेक्ट - टेम्प्लेट-आधारित वर्कफ्लोसह अनेक प्रोफाइल कार्यक्षमतेने प्रक्रिया करा.",
          highlight: "व्यावसायिक"
        }
      },
      cta: {
        title: "भविष्याचा अनुभव घ्यायला तयार आहात?",
        subtitle: "बुद्धिमान ऑटोमेशनसह फॉर्म भरण्याचे भविष्य अनुभवा. वेळ वाचवा आणि चुका कमी करा.",
        startTrial: "फ्री ट्रायल सुरू करा",
        watchDemo: "डेमो पाहा",
        benefits: {
          noCard: "क्रेडिट कार्डची गरज नाही",
          freeForever: "नेहमीसाठी फ्री योजना",
          setup2min: "2 मिनिटांत सेटअप"
        }
      }
    },

    // Intelligent Automation page
    automation: {
      backToDashboard: "डॅशबोर्डवर परत",
      formNotFound: "फॉर्म सापडला नाही:",
      titlePrefix: "इंटेलिजेंट फॉर्म ऑटोमेशन -",
      steps: {
        select: "वेबसाइट निवडा",
        upload: "दस्तऐवज अपलोड करा",
        review: "ऑटो-फिल मार्गदर्शन"
      },
      step: "पायरी",
      of: "पैकी",
      selected: "निवडलेले",
      uploadRequiredDocuments: "आवश्यक दस्तऐवज अपलोड करा",
      continueToGuide: "ऑटो-फिल मार्गदर्शनाकडे जा",
      extractedData: "निष्कर्षित डेटा",
      noData: "डेटा मिळाला नाही. कृपया आधी दस्तऐवज अपलोड करा.",
      formFillingInstructions: "फॉर्म भरण्याच्या सूचना",
      security: {
        title: "महत्वाची सुरक्षा सूचना",
        text: "ही प्रणाली तुमच्या दस्तऐवजांमधून डेटा काढते आणि मॅन्युअल फॉर्म भरण्यासाठी मार्गदर्शन प्रदान करते. सुरक्षा कारणांमुळे, तुम्ही नेहमी सरकारी वेबसाइटवर फॉर्म मॅन्युअली सबमिट केला पाहिजे. ब्राउझर ऑटोमेशन टूल्स वापरू नका आणि तुमचे लॉगिन क्रेडेन्शियल शेअर करू नका."
      }
    },

    // Government Form Selector
    gfs: {
      officialWebsites: "अधिकृत वेबसाइट्स",
      loginRequiredHint: "लॉगिन आवश्यक - तुमची क्रेडेन्शियल्स तयार ठेवा",
      selectWebsite: "वेबसाइट निवडा",
      searchByCustomUrl: "कस्टम URL द्वारे शोधा",
      pasteAnyUrl: "कोणताही सरकारी फॉर्म URL पेस्ट करा",
      urlPlaceholder: "https://example.gov.in/form-page",
      validating: "सत्यापन करत आहे...",
      detectForm: "फॉर्म ओळखा",
      configNotFound: "यासाठी कॉन्फिगरेशन सापडले नाही:",
      tipLabel: "टीप:",
      tipText: "सिस्टम URL च्या आधारे फॉर्म प्रकार आपोआप ओळखेल आणि योग्य दस्तऐवज आवश्यकतां आणि फील्ड मॅपिंगची सूचना देईल."
    },

    // Upload component
    uploader: {
      heading: "दस्तऐवज अपलोड करा",
      requiredDocuments: "आवश्यक दस्तऐवज:",
      scanDocument: "दस्तऐवज स्कॅन करा",
      uploadFile: "फाइल अपलोड करा",
      capture: "कॅप्चर"
    }
  },
  ta: {
    // App branding
    title: "டிஜிட்டல்கிளார்க்",
    welcome: "டிஜிட்டல்கிளார்க் க்கு வரவேற்கிறோம்",
    selectLanguage: "மொழியைத் தேர்ந்தெடுக்கவும்",
    
    // Navigation
    home: "முகப்பு",
    forms: "படிவங்கள்",
    settings: "அமைப்புகள்",
    help: "உதவி",
    about: "பற்றி",
    contact: "தொடர்பு",
    
    // Form types
    chooseForm: "படிவ வகையைத் தேர்ந்தெடுக்கவும்",
    fillForm: "படிவத்தை நிரப்பவும்",
    submit: "சமர்ப்பிக்கவும்",
    save: "சேமிக்கவும்",
    cancel: "ரத்துசெய்யவும்",
    edit: "திருத்தவும்",
    delete: "நீக்கவும்",
    view: "பார்க்கவும்",
    
    // Form fields
    name: "பெயர்",
    firstName: "முதல் பெயர்",
    middleName: "நடுப் பெயர்",
    lastName: "கடைசி பெயர்",
    fullName: "முழு பெயர்",
    email: "மின்னஞ்சல்",
    phone: "தொலைபேசி",
    mobile: "மொபைல் எண்",
    address: "முகவரி",
    city: "நகரம்",
    state: "மாநிலம்",
    country: "நாடு",
    zipCode: "அஞ்சல் குறியீடு",
    pinCode: "பின் கோடு",
    dateOfBirth: "பிறந்த தேதி",
    gender: "பாலினம்",
    male: "ஆண்",
    female: "பெண்",
    other: "மற்றவை",
    
    // Government Forms
    aadhaarNumber: "ஆதார் எண்",
    panNumber: "பான் எண்",
    passportNumber: "பாஸ்போர்ட் எண்",
    drivingLicense: "ஓட்டுநர் உரிமம்",
    
    // Document types
    aadhaarCard: "ஆதார் கார்டு",
    panCard: "பான் கார்டு",
    passport: "பாஸ்போர்ட்",
    drivingLicenseCard: "ஓட்டுநர் உரிம அட்டை",
    
    // Form labels
    personalDetails: "தனிப்பட்ட விவரங்கள்",
    contactDetails: "தொடர்பு விவரங்கள்",
    addressDetails: "முகவரி விவரங்கள்",
    documentDetails: "ஆவண விவரங்கள்",
    
    // Common actions
    next: "அடுத்து",
    previous: "முந்தைய",
    back: "பின்னால்",
    continue: "தொடரவும்",
    finish: "முடிக்கவும்",
    close: "மூடவும்",
    open: "திறக்கவும்",
    upload: "பதிவேற்றவும்",
    download: "பதிவிறக்கவும்",
    
    // Status messages
    success: "வெற்றி",
    error: "பிழை",
    warning: "எச்சரிக்கை",
    info: "தகவல்",
    loading: "ஏற்றுகிறது...",
    saving: "சேமிக்கிறது...",
    processing: "செயலாக்கம்...",
    
    // Form validation
    required: "இந்த புலம் அவசியம்",
    invalidEmail: "தயவுசெய்து சரியான மின்னஞ்சலை உள்ளிடவும்",
    invalidPhone: "தயவுசெய்து சரியான தொலைபேசி எண்ணை உள்ளிடவும்",
    invalidAadhaar: "தயவுசெய்து சரியான ஆதார் எண்ணை உள்ளிடவும்",
    invalidPAN: "தயவுசெய்து சரியான பான் எண்ணை உள்ளிடவும்",
    
    // Buttons
    loginButton: "உள்நுழைய",
    signupButton: "பதிவுசெய்ய",
    logoutButton: "வெளியேறு",
    submitForm: "படிவத்தை சமர்ப்பிக்கவும்",
    resetForm: "படிவத்தை மீட்டமைக்கவும்",
    saveProgress: "முன்னேற்றத்தை சேமிக்கவும்",
    
    // General
    yes: "ஆம்",
    no: "இல்லை",
    ok: "சரி",
    or: "அல்லது",
    and: "மற்றும்",
    
    // Placeholder text
    enterName: "உங்கள் பெயரை உள்ளிடவும்",
    enterEmail: "உங்கள் மின்னஞ்சலை உள்ளிடவும்",
    enterPhone: "உங்கள் தொலைபேசி எண்ணை உள்ளிடவும்",
    selectState: "உங்கள் மாநிலத்தைத் தேர்ந்தெடுக்கவும்",
    selectCity: "உங்கள் நகரத்தைத் தேர்ந்தெடுக்கவும்",

    // Navigation extras
    features: "அம்சங்கள்",
    howItWorks: "இது எப்படி செயல்படுகிறது",
    supportedForms: "ஆதரிக்கப்படும் படிவங்கள்",
    signIn: "உள்நுழை",
    signOut: "வெளியேறு",
    advancedFeatures: "மேம்பட்ட அம்சங்கள்",

    // Hero
    aiPoweredFormAutomation: "ஏஐ மூலம் இயங்கும் படிவ தானியக்கம்",
    uploadOnce: "ஒருமுறை பதிவேற்றவும்",
    fillAnywhere: "எங்கும் நிரப்பவும்",
    hero: {
      subtitle: "ஏஐ ஆவணச் சுருக்கலுடன் படிவ நிரப்புதலை எளிதாக்கவும். உங்கள் ஆவணங்களை ஒருமுறை பதிவேற்றுங்கள், எங்கள் புத்திசாலி முறைமை விரைவாகவும் பாதுகாப்பாகவும் ஆட்டோ-பில் செய்ய உதவும்.",
      bullets: {
        ocr: "உடனடி OCR சுருக்கல்",
        merge: "பல ஆவணங்களை இணை",
        encryption: "பாதுகாப்பான குறியாக்கம்"
      },
      stats: {
        aiPowered: "ஏஐ-செயல்படுத்தப்பட்டது",
        secure: "பாதுகாப்பான",
        easy: "எளிது"
      },
      statsDesc: {
        smartAutomation: "ஸ்மார்ட் தானியக்கம்",
        localProcessing: "உள்ளூர் செயலாக்கம்",
        quickSetup: "விரைவான அமைப்பு"
      },
      imageAlt: "டிஜிட்டல்கிளார்க் ஏஐ உதவியாளர்"
    },

    // Common CTA
    getStartedFree: "இலவசமாக தொடங்குங்கள்",
    watchDemo: "டெமோ பார்க்க",

    // Trust indicators
    trust: {
      secureProcessing: "பாதுகாப்பான செயலாக்கம்",
      quickSetup: "விரைவான அமைப்பு",
      growingCommunity: "வளரும் சமூகங்கள்",
      smartTechnology: "ஸ்மார்ட் தொழில்நுட்பம்"
    },

    // Form selector
    formSelector: {
      title: "பிரபல அரசுப் படிவங்கள்",
      description: "விரைவாக தொடங்க படிவத்தைத் தேர்ந்தெடுக்கவும் அல்லது எங்கள் ஏஐயை பயன்படுத்தி ஆட்டோ-பில் செய்யவும்.",
      searchPlaceholder: "படிவங்களைத் தேடுங்கள்...",
      buttons: {
        smartAutoFill: "ஸ்மார்ட் ஆட்டோ-பில்",
        manualForm: "கையேடு படிவம்"
      },
      ctaMissing: "உங்கள் படிவம் கிடைக்கவில்லையா?",
      ctaDesc: "பரவாயில்லை! படிவ URL ஐ ஒட்டவும், எங்கள் ஏஐ அதை அடையாளம் கண்டு நிரப்ப உதவும்.",
      uploadCustomForm: "தனிப்பயன் படிவத்தைப் பதிவேற்றவும்"
    },

    // Features section
    featuresSection: {
      badge: "புதுமையான படிவ தானியக்கம்",
      title: "ஏன் டிஜிட்டல்கிளார்க்?",
      subtitle: "எங்கள் முழுமையான ஏஐ தீர்வுடன் அரசுப் படிவ கையாளும் எதிர்காலத்தை அனுபவிக்கவும். ஆவணச் சுருக்கலிலிருந்து குறுக்கு தள தானியக்கம் வரை, ஒவ்வொரு படியையும் மாற்றியமைத்துள்ளோம்.",
      features: {
        uploadOnce: {
          title: "ஒருமுறை பதிவேற்றவும், எங்கும் நிரப்பவும்",
          description: "உங்கள் ஆவணங்களை ஒருமுறை பதிவேற்றி, எங்கள் ஏஐ பல அரசு தளங்களில் தானாக படிவங்களை நிரப்ப அனுமதிக்கவும். மணிநேரங்கள் மீண்டும் டேட்டா எண்ட்ரியிலிருந்து மிச்சம்.",
          highlight: "முக்கிய அம்சம்"
        },
        smartMerge: {
          title: "ஸ்மார்ட் மல்டி-ஆவண இணைப்பு",
          description: "பல ஆவணங்களிலிருந்து (ஆதார், பான், மதிப்பெண் சான்றிதழ்) தரவை புத்திசாலித்தனமாக இணைத்து விரிவான படிவ நிரப்புதலுக்காக ஒருங்கிணைந்த சுயவிவரத்தை உருவாக்குகிறது.",
          highlight: "ஏஐ-இயக்கம்"
        },
        advancedOcr: {
          title: "மேம்பட்ட OCR + ஏஐ பார்சிங்",
          description: "எந்த நிலையிலும் ஆவணங்களிலிருந்து 95%+ துல்லியமான தரவு பிரித்தெடுப்பதற்காக Google Vision OCR ஐ OpenAI பார்சிங்குடன் இணைக்கிறது.",
          highlight: "அதிநவீன"
        },
        autoUpload: {
          title: "ஆட்டோ-அப்லோட் & கம்ப்ரெஷன்",
          description: "கோப்புகளை தானாக 200KB க்குக் கீழே சுருக்கி JPG ஐ PDF ஆக மாற்றுகிறது. அரசு போர்டல்களுக்கு இணைப்புகளை மேம்படுத்துகிறது.",
          highlight: "ஸ்மார்ட் செயலாக்கம்"
        },
        localStorage: {
          title: "உள்ளூர் சேமிப்பு & குறியாக்கம்",
          description: "வங்கி-தர பாதுகாப்புடன் உணர்வுமிக்க தரவை உள்ளூரில் குறியாக்குகிறது. உங்கள் தகவல் உங்கள் சாதனத்திலிருந்து ஒருபோதும் பாதுகாப்பற்ற முறையில் வெளியே போவதில்லை.",
          highlight: "தனியுரிமை முதல்"
        },
        crossDevice: {
          title: "குறுக்கு-சாதன சிங்க்",
          description: "எந்த சாதனத்திலும் உடனடி உள்நுழைவிற்காக QR குறியீடுகளை உருவாக்கவும். மொபைலில் தொடங்கி, டெஸ்க்டாப்பில் முடிக்கவும்.",
          highlight: "வசதி"
        },
        multiLanguage: {
          title: "பல மொழி ஆதரவு",
          description: "புத்திசாலித்தனமான புல மொழிபெயர்ப்பு மற்றும் உள்ளூர் ஸ்கிரிப்ட் அங்கீகாரத்துடன் ஆங்கிலம், இந்தி, மராத்தி மற்றும் தமிழ் முழு ஆதரவு.",
          highlight: "4 மொழிகள்"
        },
        smartField: {
          title: "ஸ்மார்ட் புல பொருத்தம்",
          description: "ஏஐ உங்கள் முந்தைய பதிவுகளை நினைவில் வைத்து சூழல் துல்லியத்துடன் வெவ்வேறு படிவங்களில் ஒத்த புலங்களை ஆட்டோ-நிரப்புகிறது.",
          highlight: "கற்கும் ஏஐ"
        },
        batchProcessing: {
          title: "தொகுதி செயலாக்க பயன்முறை",
          description: "இணையக் கஃபேக்கள் மற்றும் ஆலோசகர்களுக்கு சரியானது - டெம்ப்ளேட்-அடிப்படையிலான பணியோட்டங்களுடன் பல சுயவிவரங்களை திறமையாக செயலாக்கம்.",
          highlight: "தொழில்முறை"
        }
      },
      cta: {
        title: "எதிர்காலத்தை அனுபவிக்க தயாரா?",
        subtitle: "புத்திசாலித் தானியக்கத்துடன் படிவ நிரப்புதலின் எதிர்காலத்தை அனுபவிக்கவும். நேரத்தைச் சேமித்து பிழைகளை குறைக்கவும்.",
        startTrial: "இலவச முயற்சியைத் தொடங்கவும்",
        watchDemo: "டெமோ பார்க்க",
        benefits: {
          noCard: "கிரெடிட் கார்டு தேவையில்லை",
          freeForever: "எப்போதும் இலவச திட்டம்",
          setup2min: "2 நிமிடங்களில் அமைப்பு"
        }
      }
    }
  }
};

export type Language = keyof typeof translations;

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Create context
// eslint-disable-next-line react-refresh/only-export-components
export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const { toast } = useToast();

  // Initialize language from storage or browser
  useEffect(() => {
    try {
      const stored = localStorage.getItem('app_language') as Language | null;
      if (stored && ['en','hi','mr','ta'].includes(stored)) {
        setLanguage(stored as Language);
        return;
      }
      const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
      const base = nav.toLowerCase().split('-')[0];
      if (['en','hi','mr','ta'].includes(base)) {
        setLanguage(base as Language);
      }
    } catch { /* empty */ }
  }, []);

  // Persist selection
  useEffect(() => {
    try { localStorage.setItem('app_language', language); } catch { /* empty */ }
  }, [language]);

  // Reflect current language in <html lang="...">
  useEffect(() => {
    try { document.documentElement.setAttribute('lang', language); } catch { /* empty */ }
  }, [language]);

  // Suggest Marathi if near Mumbai (India timezone heuristic)
  useEffect(() => {
    try {
      if (localStorage.getItem('lang_suggested')) return;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz !== 'Asia/Kolkata') return;
      navigator.geolocation?.getCurrentPosition(
        ({ coords }) => {
          const nearMumbai = Math.abs(coords.latitude - 19.0760) < 0.5 && Math.abs(coords.longitude - 72.8777) < 0.5;
          if (nearMumbai && language !== 'mr') {
            toast({ title: 'Suggested language: Marathi', description: 'You appear to be near Mumbai. Switch to Marathi from the switcher below.' });
          }
          localStorage.setItem('lang_suggested','1');
        },
        () => localStorage.setItem('lang_suggested','1'),
        { timeout: 5000 }
      );
    } catch { /* empty */ }
  }, [language, toast]);

  // Translation function with proper type safety
  const t = (key: string): string => {
    try {
      const keys = key.split('.');
      let value: unknown = translations[language];
      
      for (const k of keys) {
        value = (value as Record<string, unknown>)?.[k];
      }
      
      if (typeof value === 'string') {
        return value;
      }
      
      // Fallback to English if key missing in selected language
      let fallback: unknown = translations['en'] as Record<string, unknown>;
      for (const k of keys) {
        fallback = (fallback as Record<string, unknown>)?.[k];
      }
      
      return typeof fallback === 'string' ? fallback : key;
    } catch (error) {
      console.warn(`Translation key "${key}" not found for language "${language}"`);
      return key;
    }
  };

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use language context
// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Language selector component with improved styling
const LanguageSupport: React.FC = () => {
  // Use the context directly if provider is not available, or provide default values
  const context = useContext(LanguageContext);
  
  // If no context (no provider), create local state as fallback
  const [localLanguage, setLocalLanguage] = useState<Language>('en');
  
  const language = context?.language || localLanguage;
  const setLanguage = context?.setLanguage || setLocalLanguage;
  
  const t = context?.t || ((key: string): string => {
    try {
      const keys = key.split('.');
      let value: unknown = translations[language];
      
      for (const k of keys) {
        value = (value as Record<string, unknown>)?.[k];
      }
      
      if (typeof value === 'string') {
        return value;
      }
      
      // Fallback to English if key missing in selected language
      let fallback: unknown = translations['en'] as Record<string, unknown>;
      for (const k of keys) {
        fallback = (fallback as Record<string, unknown>)?.[k];
      }
      
      return typeof fallback === 'string' ? fallback : key;
    } catch (error) {
      console.warn(`Translation key "${key}" not found for language "${language}"`);
      return key;
    }
  });

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' }
  ];

  return (
    <div className="language-support p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">{t('title')}</h1>
        <p className="text-xl text-center mb-8 text-gray-600">{t('welcome')}</p>
        
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">{t('selectLanguage')}</h2>
        
        <div className="language-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-btn p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                language === lang.code 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg scale-105' 
                  : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50'
              }`}
              onClick={() => setLanguage(lang.code as Language)}
            >
              <div className="flex flex-col items-center space-y-3">
                <span className="text-4xl">{lang.flag}</span>
                <span className="font-semibold text-lg">{lang.name}</span>
                <span className="text-sm opacity-75">{lang.nativeName}</span>
                {language === lang.code && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Demo Form Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800">{t('fillForm')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                {t('name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('enterName')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                {t('email')} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('enterEmail')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                {t('phone')}
              </label>
              <input
                type="tel"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('enterPhone')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                {t('gender')}
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">{t('selectState')}</option>
                <option value="male">{t('male')}</option>
                <option value="female">{t('female')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </div>
          </div>
          
          <div className="mt-8">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">{t('addressDetails')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  {t('city')}
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('selectCity')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  {t('state')}
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('selectState')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  {t('pinCode')}
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123456"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-semibold">
              {t('submitForm')}
            </button>
            <button className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors font-semibold">
              {t('cancel')}
            </button>
            <button className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors font-semibold">
              {t('saveProgress')}
            </button>
          </div>
        </div>

        {/* Current Language Indicator */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t('info')}: {languages.find(l => l.code === language)?.nativeName}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <LanguageSupport />
    </LanguageProvider>
  );
}
