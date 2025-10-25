class FormFiller {
  constructor() {
    this.extractedData = null;
  }

  setData(data) {
    this.extractedData = data;
  }

  // Detect form fields and fill them
  fillForm() {
    if (!this.extractedData) {
      console.error('No data to fill');
      return;
    }

    // Find all input fields on the page
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      const fieldName = this.detectFieldName(input);
      
      if (fieldName && this.extractedData[fieldName]) {
        this.fillField(input, this.extractedData[fieldName]);
      }
    });
  }

  // Detect what field is based on name, id, placeholder, label
  detectFieldName(input) {
    const searchText = [
      input.name,
      input.id,
      input.placeholder,
      input.getAttribute('aria-label')
    ].join(' ').toLowerCase();

    // Map common field patterns to data keys
    const fieldMappings = {
      'name': ['name', 'full name', 'fullname', 'applicant name'],
      'email': ['email', 'e-mail', 'emailid'],
      'phone': ['phone', 'mobile', 'contact', 'telephone'],
      'pan': ['pan', 'pan card', 'pan number'],
      'aadhaar': ['aadhaar', 'aadhar', 'aadhaar number'],
      'address': ['address', 'street', 'location'],
      'city': ['city', 'town'],
      'state': ['state', 'province'],
      'pincode': ['pincode', 'pin code', 'postal code', 'zip'],
      'dob': ['dob', 'date of birth', 'birth date'],
      'gender': ['gender', 'sex'],
      'father': ['father name', 'father\'s name'],
      'mother': ['mother name', 'mother\'s name']
    };

    for (const [key, patterns] of Object.entries(fieldMappings)) {
      if (patterns.some(pattern => searchText.includes(pattern))) {
        return key;
      }
    }

    return null;
  }

  // Fill individual field
  fillField(input, value) {
    if (input.tagName === 'SELECT') {
      // For dropdowns
      const options = Array.from(input.options);
      const match = options.find(opt => 
        opt.value.toLowerCase() === value.toLowerCase() ||
        opt.text.toLowerCase() === value.toLowerCase()
      );
      if (match) {
        input.value = match.value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      // For text inputs
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Highlight filled field
    input.style.backgroundColor = '#d4edda';
    setTimeout(() => {
      input.style.backgroundColor = '';
    }, 2000);
  }

  // Count fillable fields
  countFillableFields() {
    const inputs = document.querySelectorAll('input, select, textarea');
    let fillable = 0;

    inputs.forEach(input => {
      if (this.detectFieldName(input)) {
        fillable++;
      }
    });

    return { total: inputs.length, fillable };
  }
}

const formFiller = new FormFiller();
