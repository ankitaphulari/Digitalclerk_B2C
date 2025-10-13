// Enhanced Content Script with Universal Form Recognition
class UniversalFormFiller {
    constructor() {
        this.isActive = false;
        this.currentProfile = null;
        this.formContext = null;
        this.observedForms = new Set();
        
        this.initializeUniversalFiller();
    }

    async initializeUniversalFiller() {
        // Set up message listener
        this.setupMessageListener();
        
        // Detect forms on page load
        await this.detectAndAnalyzeForms();
        
        // Set up mutation observer for dynamic forms
        this.setupFormObserver();
        
        // Get profile data from background service
        await this.loadProfileData();
        
        console.log('Universal Form Filler initialized');
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            try {
                switch (request.action) {
                    case 'ping':
                        sendResponse({ success: true, message: 'Universal Form Filler ready' });
                        break;
                        
                    case 'scanForms':
                        const forms = this.scanFormsOnPage();
                        sendResponse({ success: true, forms: forms });
                        break;
                        
                    case 'fillForm':
                        const result = this.fillFormOnPage(request.formData);
                        sendResponse({ success: result, message: result ? 'Form filled' : 'Failed to fill form' });
                        break;
                    
                    case 'fillFormsWithData':
                        this.fillFormsWithExtractedData(request.extractedData, request.settings);
                        sendResponse({ success: true, message: 'Forms filled with extracted data' });
                        break;
                        
                    case 'documentReceived':
                        this.handleDocumentReceived(request.data);
                        sendResponse({ success: true });
                        break;
                        
                    case 'activateAutoFill':
                        this.activateAutoFill(request.enabled);
                        sendResponse({ success: true });
                        break;
                        
                    default:
                        sendResponse({ success: false, error: 'Unknown action' });
                }
            } catch (error) {
                console.error('Content script error:', error);
                sendResponse({ success: false, error: error.message });
            }
            
            return true;
        });
    }

    async detectAndAnalyzeForms() {
        const forms = this.scanFormsOnPage();
        
        if (forms.length > 0) {
            // Send form details to background for type detection
            const response = await chrome.runtime.sendMessage({
                action: 'detectFormType',
                formFields: this.extractAllFormFields(),
                url: window.location.href
            });
            
            if (response.success) {
                this.formContext = response.context;
                console.log('Form type detected:', response.formType);
                
                // Show subtle indication that forms are detected
                this.showFormDetectionIndicator(forms.length, response.formType);
            }
        }
    }

    async loadProfileData() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getProfileData',
                formType: this.formContext?.detectedType,
                url: window.location.href
            });
            
            if (response.success && response.profile) {
                this.currentProfile = response.profile;
                console.log('Loaded profile data for auto-fill');
                
                // Proactively fill forms if auto-fill is enabled
                if (this.shouldAutoFill()) {
                    await this.smartAutoFill();
                }
            }
        } catch (error) {
            console.error('Failed to load profile data:', error);
        }
    }

    shouldAutoFill() {
        // Check if auto-fill is enabled and we have profile data
        return this.currentProfile && 
               this.formContext && 
               this.isFormSafeToFill();
    }

    isFormSafeToFill() {
        // Basic safety checks - avoid filling sensitive forms automatically
        const url = window.location.href.toLowerCase();
        const unsafePatterns = [
            /payment/, /billing/, /checkout/, /bank/, /financial/,
            /password/, /login/, /signin/, /signup/
        ];
        
        return !unsafePatterns.some(pattern => pattern.test(url));
    }

    async smartAutoFill() {
        if (!this.currentProfile) return;
        
        const forms = this.scanFormsOnPage();
        let filledFields = 0;
        
        for (const form of forms) {
            filledFields += await this.fillFormWithProfile(form, this.currentProfile);
        }
        
        if (filledFields > 0) {
            this.showAutoFillNotification(filledFields);
            
            // Log activity to background
            chrome.runtime.sendMessage({
                action: 'logActivity',
                data: {
                    action: 'auto_fill',
                    fieldsCount: filledFields,
                    formType: this.formContext?.detectedType,
                    url: window.location.href,
                    timestamp: Date.now()
                }
            });
        }
    }

    setupFormObserver() {
        // Watch for dynamically added forms
        const observer = new MutationObserver((mutations) => {
            let hasNewForms = false;
            
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const forms = node.querySelectorAll ? node.querySelectorAll('form') : [];
                        if (forms.length > 0 || node.tagName === 'FORM') {
                            hasNewForms = true;
                        }
                    }
                });
            });
            
            if (hasNewForms) {
                setTimeout(() => this.detectAndAnalyzeForms(), 1000);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    scanFormsOnPage() {
        const forms = [];
        const formElements = document.querySelectorAll('form');
        
        formElements.forEach((form, index) => {
            const formData = {
                index: index,
                action: form.action || '',
                method: form.method || 'get',
                fields: this.extractFormFields(form)
            };
            forms.push(formData);
        });

        return forms;
    }

    extractFormFields(form) {
        const fields = [];
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Skip hidden, submit, and button inputs
            if (['hidden', 'submit', 'button', 'reset'].includes(input.type)) {
                return;
            }
            
            const fieldData = {
                type: input.type || input.tagName.toLowerCase(),
                name: input.name || '',
                id: input.id || '',
                placeholder: input.placeholder || '',
                required: input.required || false,
                value: input.value || '',
                className: input.className || '',
                label: this.getFieldLabel(input),
                maxLength: input.maxLength || null,
                pattern: input.pattern || null
            };
            fields.push(fieldData);
        });

        return fields;
    }

    extractAllFormFields() {
        const allFields = [];
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const fields = this.extractFormFields(form);
            allFields.push(...fields);
        });
        
        return allFields;
    }

    getFieldLabel(input) {
        // Try to find associated label
        if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) return label.textContent.trim();
        }
        
        // Check for parent label
        const parentLabel = input.closest('label');
        if (parentLabel) {
            return parentLabel.textContent.replace(input.value, '').trim();
        }
        
        // Check for nearby text
        const prevSibling = input.previousElementSibling;
        if (prevSibling && prevSibling.tagName === 'LABEL') {
            return prevSibling.textContent.trim();
        }
        
        return '';
    }

    fillFormOnPage(formData) {
        try {
            const forms = document.querySelectorAll('form');
            const targetForm = forms[formData.index];
            
            if (!targetForm) {
                throw new Error('Target form not found');
            }

            return this.fillFormWithData(targetForm, formData.fields);
        } catch (error) {
            console.error('Error filling form:', error);
            return false;
        }
    }

    fillFormWithData(form, fieldsData) {
        let filledCount = 0;
        
        fieldsData.forEach(fieldData => {
            const input = this.findFormInput(form, fieldData);
            
            if (input && fieldData.value && !input.value) {
                this.setInputValue(input, fieldData.value);
                filledCount++;
            }
        });
        
        return filledCount;
    }

    async fillFormWithProfile(formData, profile) {
        const form = document.querySelectorAll('form')[formData.index];
        if (!form || !profile.data) return 0;
        
        let filledCount = 0;
        const profileData = profile.data;
        
        // Smart field mapping
        const fieldMappings = this.createFieldMappings(profileData);
        
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (['hidden', 'submit', 'button', 'reset'].includes(input.type)) {
                return;
            }
            
            const value = this.findBestValueForField(input, fieldMappings);
            if (value && !input.value) {
                this.setInputValue(input, value);
                filledCount++;
                
                // Add visual feedback
                this.highlightFilledField(input);
            }
        });
        
        return filledCount;
    }

    createFieldMappings(profileData) {
        const mappings = new Map();
        
        // Standard mappings
        const standardMappings = {
            'fullName': ['name', 'full_name', 'fullname', 'applicant_name'],
            'firstName': ['first_name', 'fname', 'given_name'],
            'lastName': ['last_name', 'lname', 'surname', 'family_name'],
            'email': ['email', 'email_address', 'e_mail'],
            'phone': ['phone', 'mobile', 'phone_number', 'contact_number', 'telephone'],
            'address': ['address', 'street_address', 'full_address'],
            'dateOfBirth': ['dob', 'date_of_birth', 'birth_date', 'birthdate'],
            'gender': ['gender', 'sex'],
            'fatherName': ['father_name', 'fathers_name', 'parent_name']
        };
        
        Object.entries(profileData).forEach(([key, value]) => {
            // Direct mapping
            mappings.set(key.toLowerCase(), value);
            
            // Standard field variations
            if (standardMappings[key]) {
                standardMappings[key].forEach(variation => {
                    mappings.set(variation, value);
                });
            }
        });
        
        return mappings;
    }

    findBestValueForField(input, mappings) {
        const fieldName = (input.name || input.id || '').toLowerCase();
        const placeholder = (input.placeholder || '').toLowerCase();
        const label = this.getFieldLabel(input).toLowerCase();
        
        // Try exact matches first
        const candidates = [fieldName, placeholder, label];
        
        for (const candidate of candidates) {
            if (mappings.has(candidate)) {
                return this.formatValueForInput(mappings.get(candidate), input);
            }
        }
        
        // Try partial matches
        for (const [mappingKey, value] of mappings.entries()) {
            if (candidates.some(candidate => 
                candidate.includes(mappingKey) || mappingKey.includes(candidate)
            )) {
                return this.formatValueForInput(value, input);
            }
        }
        
        return null;
    }

    formatValueForInput(value, input) {
        if (!value) return null;
        
        const stringValue = typeof value === 'object' ? value.value || '' : String(value);
        
        // Format based on input type
        switch (input.type) {
            case 'email':
                return stringValue.toLowerCase();
            case 'tel':
            case 'phone':
                return stringValue.replace(/[^\d+\-\s()]/g, '');
            case 'date':
                return this.formatDateForInput(stringValue);
            case 'number':
                const num = parseFloat(stringValue);
                return isNaN(num) ? null : num.toString();
            default:
                return stringValue;
        }
    }

    formatDateForInput(dateString) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return null;
            
            return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        } catch {
            return null;
        }
    }

    findFormInput(form, fieldData) {
        let input = null;
        
        // Try multiple strategies to find the input
        if (fieldData.name) {
            input = form.querySelector(`[name="${fieldData.name}"]`);
        }
        if (!input && fieldData.id) {
            input = form.querySelector(`#${fieldData.id}`);
        }
        if (!input && fieldData.className) {
            input = form.querySelector(`.${fieldData.className}`);
        }
        
        return input;
    }

    setInputValue(input, value) {
        const oldValue = input.value;
        input.value = value;
        
        // Trigger events for frameworks that listen to them
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        // For React and other frameworks
        const event = new Event('input', { bubbles: true });
        Object.defineProperty(event, 'target', {
            writable: false,
            value: input
        });
        input.dispatchEvent(event);
    }

    fillFormsWithExtractedData(extractedData, settings = {}) {
        const forms = this.scanFormsOnPage();
        let totalFilled = 0;
        
        forms.forEach((formData, index) => {
            const filled = this.fillFormWithProfile(formData, { data: extractedData });
            totalFilled += filled;
        });
        
        if (totalFilled > 0) {
            this.showAutoFillNotification(totalFilled);
        }
        
        return totalFilled;
    }

    // Visual feedback methods
    highlightFilledField(input) {
        input.style.outline = '2px solid #4CAF50';
        input.style.backgroundColor = '#E8F5E8';
        
        setTimeout(() => {
            input.style.outline = '';
            input.style.backgroundColor = '';
        }, 2000);
    }

    showFormDetectionIndicator(formCount, formType) {
        const indicator = document.createElement('div');
        indicator.id = 'digitalclerk-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2196F3;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        indicator.innerHTML = `
            🔍 DigitalClerk: ${formCount} form(s) detected
            <br><small>Type: ${formType || 'general'}</small>
        `;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.remove();
        }, 3000);
    }

    showAutoFillNotification(fieldCount) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        notification.innerHTML = `
            ✅ DigitalClerk: ${fieldCount} field(s) auto-filled
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    handleDocumentReceived(documentData) {
        console.log('Document received in content script:', documentData);
        // Update current profile with new document data
        this.currentProfile = {
            data: documentData.extractedData,
            profileType: 'auto',
            confidence: 0.8
        };
        
        // Attempt to fill forms with new data if appropriate
        if (this.shouldAutoFill()) {
            setTimeout(() => this.smartAutoFill(), 1000);
        }
    }

    activateAutoFill(enabled) {
        this.isActive = enabled;
        
        if (enabled && this.currentProfile) {
            this.smartAutoFill();
        }
    }
}

// Initialize Universal Form Filler when content script loads
if (typeof chrome !== 'undefined' && chrome.runtime) {
    new UniversalFormFiller();
    console.log('Universal Form Filler content script loaded');
}
