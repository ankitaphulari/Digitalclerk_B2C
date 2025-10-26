// Enhanced content.js with checkbox, radio, and all field types support
class FormFillerContent {
    constructor() {
        this.extractedData = null;
        this.filledFields = new Map();
        this.setupMessageListener();
        this.injectStyles();
        console.log('Form Filler Content Script Loaded');
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'fillForm':
                    this.fillFormWithData(request.data);
                    sendResponse({ success: true });
                    break;
                    
                case 'getExtractedData':
                    sendResponse({ data: this.extractedData });
                    break;
            }
            return true;
        });
    }

    async fillFormWithData(data) {
        if (!data) {
            console.error('No data to fill');
            return;
        }

        this.extractedData = data;
        const allFields = document.querySelectorAll('input, select, textarea');
        let totalFilled = 0;

        allFields.forEach(field => {
            if (this.shouldSkipField(field)) return;

            const value = this.findValueForField(field, data);
            if (value !== null && value !== undefined) {
                const filled = this.fillField(field, value);
                if (filled) totalFilled++;
            }
        });

        if (totalFilled > 0) {
            this.showNotification(`✓ Filled ${totalFilled} field(s)`);
        }
    }

    shouldSkipField(input) {
        const skipTypes = ['hidden', 'submit', 'button', 'reset', 'file', 'image'];
        return skipTypes.includes(input.type);
    }

    findValueForField(input, data) {
        const fieldName = (input.name || input.id || input.placeholder || '').toLowerCase();
        const fieldType = (input.type || '').toLowerCase();
        
        // Try exact match first
        for (const [key, value] of Object.entries(data)) {
            if (fieldName.includes(key.toLowerCase())) {
                return value;
            }
        }

        // For radio buttons, check the value attribute too
        if (fieldType === 'radio') {
            const radioValue = (input.value || '').toLowerCase();
            for (const [key, value] of Object.entries(data)) {
                const dataValue = String(value).toLowerCase();
                if (fieldName.includes(key.toLowerCase()) && 
                    (radioValue === dataValue || this.matchesYesNo(radioValue, dataValue))) {
                    return value;
                }
            }
        }

        // Try common patterns
        const patterns = {
            name: ['name', 'fullname', 'full_name', 'username'],
            email: ['email', 'e-mail', 'mail', 'e_mail'],
            phone: ['phone', 'mobile', 'contact', 'tel', 'telephone'],
            address: ['address', 'street', 'location', 'addr'],
            pincode: ['pincode', 'pin', 'zip', 'postal', 'zipcode'],
            city: ['city', 'town'],
            state: ['state', 'province'],
            dob: ['dob', 'dateofbirth', 'date_of_birth', 'birthdate'],
            gender: ['gender', 'sex'],
            aadhaar: ['aadhaar', 'aadhar', 'uid'],
            pan: ['pan', 'pancard', 'pan_card'],
        };

        for (const [dataKey, keywords] of Object.entries(patterns)) {
            if (keywords.some(kw => fieldName.includes(kw)) && data[dataKey]) {
                return data[dataKey];
            }
        }

        return null;
    }

    fillField(input, value) {
        const fieldType = (input.type || input.tagName).toLowerCase();

        try {
            // Store original value
            if (!this.filledFields.has(input)) {
                this.filledFields.set(input, {
                    originalValue: input.value,
                    filledValue: value
                });
            }

            let filled = false;

            // Handle different field types
            switch (fieldType) {
                case 'checkbox':
                    filled = this.fillCheckbox(input, value);
                    break;
                    
                case 'radio':
                    filled = this.fillRadio(input, value);
                    break;
                    
                case 'select':
                case 'select-one':
                case 'select-multiple':
                    filled = this.fillSelect(input, value);
                    break;
                    
                case 'date':
                    filled = this.fillDate(input, value);
                    break;
                    
                case 'textarea':
                    filled = this.fillTextarea(input, value);
                    break;
                    
                case 'text':
                case 'email':
                case 'tel':
                case 'number':
                case 'url':
                case 'search':
                default:
                    filled = this.fillTextInput(input, value);
                    break;
            }

            if (filled) {
                this.highlightField(input);
                if (fieldType !== 'checkbox' && fieldType !== 'radio') {
                    this.addEditButton(input);
                }
            }

            return filled;
        } catch (error) {
            console.error('Error filling field:', error);
            return false;
        }
    }

    fillTextInput(input, value) {
        if (!input.value || input.value === '') {
            input.value = String(value).trim();
            this.triggerEvents(input);
            return true;
        }
        return false;
    }

    fillCheckbox(input, value) {
        const shouldCheck = this.parseCheckboxValue(value);
        
        if (input.checked !== shouldCheck) {
            input.checked = shouldCheck;
            this.triggerEvents(input, ['change', 'click']);
            return true;
        }
        return false;
    }

    parseCheckboxValue(value) {
        if (typeof value === 'boolean') return value;
        
        const strValue = String(value).toLowerCase().trim();
        
        const trueValues = ['yes', 'true', '1', 'on', 'checked', 'agree', 'accept', 'y'];
        const falseValues = ['no', 'false', '0', 'off', 'unchecked', 'disagree', 'decline', 'n'];
        
        if (trueValues.includes(strValue)) return true;
        if (falseValues.includes(strValue)) return false;
        
        return !!value && value !== '';
    }

    fillRadio(input, value) {
        const fieldValue = (input.value || '').toLowerCase().trim();
        const searchValue = String(value).toLowerCase().trim();
        
        // Direct match
        if (fieldValue === searchValue) {
            input.checked = true;
            this.triggerEvents(input, ['change', 'click']);
            return true;
        }
        
        // Yes/No matching
        if (this.matchesYesNo(fieldValue, searchValue)) {
            input.checked = true;
            this.triggerEvents(input, ['change', 'click']);
            return true;
        }
        
        // Gender matching
        if (this.matchesGender(fieldValue, searchValue)) {
            input.checked = true;
            this.triggerEvents(input, ['change', 'click']);
            return true;
        }
        
        return false;
    }

    matchesYesNo(fieldValue, searchValue) {
        const yesValues = ['yes', 'y', 'true', '1', 'agree', 'accept'];
        const noValues = ['no', 'n', 'false', '0', 'disagree', 'decline'];
        
        if (yesValues.includes(searchValue) && yesValues.includes(fieldValue)) return true;
        if (noValues.includes(searchValue) && noValues.includes(fieldValue)) return true;
        
        return false;
    }

    matchesGender(fieldValue, searchValue) {
        const maleValues = ['male', 'm', 'man', 'mr', 'boy'];
        const femaleValues = ['female', 'f', 'woman', 'mrs', 'ms', 'miss', 'girl'];
        
        if (maleValues.includes(searchValue) && maleValues.includes(fieldValue)) return true;
        if (femaleValues.includes(searchValue) && femaleValues.includes(fieldValue)) return true;
        
        return false;
    }

    fillSelect(select, value) {
        const searchValue = String(value).toLowerCase().trim();
        
        // Try exact match first
        for (let i = 0; i < select.options.length; i++) {
            const option = select.options[i];
            const optionText = option.text.toLowerCase().trim();
            const optionValue = option.value.toLowerCase().trim();
            
            if (optionText === searchValue || optionValue === searchValue) {
                select.selectedIndex = i;
                this.triggerEvents(select);
                return true;
            }
        }
        
        // Try partial match
        for (let i = 0; i < select.options.length; i++) {
            const option = select.options[i];
            const optionText = option.text.toLowerCase().trim();
            
            if (optionText.includes(searchValue) || searchValue.includes(optionText)) {
                select.selectedIndex = i;
                this.triggerEvents(select);
                return true;
            }
        }
        
        return false;
    }

    fillDate(input, value) {
        try {
            let dateValue;
            
            if (value instanceof Date) {
                dateValue = value.toISOString().split('T')[0];
            } else {
                // Parse DD/MM/YYYY or DD-MM-YYYY
                const dateStr = String(value).trim();
                const parts = dateStr.split(/[-/]/);
                
                if (parts.length === 3) {
                    const day = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1;
                    const year = parseInt(parts[2]);
                    const date = new Date(year, month, day);
                    dateValue = date.toISOString().split('T')[0];
                } else {
                    dateValue = new Date(dateStr).toISOString().split('T')[0];
                }
            }
            
            input.value = dateValue;
            this.triggerEvents(input);
            return true;
        } catch (error) {
            console.error('Date parsing error:', error);
            return false;
        }
    }

    fillTextarea(textarea, value) {
        if (!textarea.value || textarea.value === '') {
            textarea.value = String(value).trim();
            this.triggerEvents(textarea);
            return true;
        }
        return false;
    }

    triggerEvents(element, events = ['input', 'change', 'blur']) {
        events.forEach(eventType => {
            element.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
    }

    highlightField(input) {
        const originalBorder = input.style.border;
        const originalBackground = input.style.backgroundColor;
        
        input.style.border = '2px solid #10b981';
        input.style.backgroundColor = '#ecfdf5';
        input.style.transition = 'all 0.3s ease';

        setTimeout(() => {
            input.style.border = originalBorder;
            input.style.backgroundColor = originalBackground;
        }, 2000);
    }

    addEditButton(input) {
        // Check if edit button already exists
        if (input.dataset.hasEditBtn) return;
        
        input.dataset.hasEditBtn = 'true';

        // Create wrapper if needed
        const wrapper = this.createWrapper(input);

        // Create edit button
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '✏️';
        editBtn.className = 'digitalclerk-edit-btn';
        editBtn.type = 'button';
        editBtn.style.cssText = `
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 12px;
            z-index: 10000;
            opacity: 0.8;
            transition: opacity 0.2s;
        `;

        editBtn.addEventListener('mouseenter', () => {
            editBtn.style.opacity = '1';
        });

        editBtn.addEventListener('mouseleave', () => {
            editBtn.style.opacity = '0.8';
        });

        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.makeFieldEditable(input, editBtn);
        });

        wrapper.appendChild(editBtn);
    }

    createWrapper(input) {
        const parent = input.parentElement;
        const position = getComputedStyle(parent).position;
        
        if (position === 'static' || position === '') {
            parent.style.position = 'relative';
        }
        
        return parent;
    }

    makeFieldEditable(input, editBtn) {
        input.focus();
        input.select();
        
        // Change button to save
        editBtn.innerHTML = '✓';
        editBtn.style.background = '#10b981';
        
        const saveHandler = () => {
            editBtn.innerHTML = '✏️';
            editBtn.style.background = '#667eea';
            input.removeEventListener('blur', saveHandler);
        };

        input.addEventListener('blur', saveHandler);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'digitalclerk-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize
new FormFillerContent();
