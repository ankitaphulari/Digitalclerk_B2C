// Simplified content.js with edit functionality
class FormFillerContent {
    constructor() {
        this.extractedData = null;
        this.filledFields = new Map();
        this.setupMessageListener();
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
        const forms = document.querySelectorAll('form');
        let totalFilled = 0;

        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                if (this.shouldSkipField(input)) return;

                const value = this.findValueForField(input, data);
                if (value && !input.value) {
                    this.fillField(input, value);
                    totalFilled++;
                }
            });
        });

        if (totalFilled > 0) {
            this.showNotification(`✓ Filled ${totalFilled} field(s)`);
        }
    }

    shouldSkipField(input) {
        const skipTypes = ['hidden', 'submit', 'button', 'reset', 'file'];
        return skipTypes.includes(input.type);
    }

    findValueForField(input, data) {
        const fieldName = (input.name || input.id || input.placeholder || '').toLowerCase();
        
        // Try exact match first
        for (const [key, value] of Object.entries(data)) {
            if (fieldName.includes(key.toLowerCase())) {
                return value;
            }
        }

        // Try common patterns
        const patterns = {
            name: ['name', 'fullname', 'full_name'],
            email: ['email', 'e-mail', 'mail'],
            phone: ['phone', 'mobile', 'contact', 'tel'],
            address: ['address', 'street', 'location']
        };

        for (const [dataKey, keywords] of Object.entries(patterns)) {
            if (keywords.some(kw => fieldName.includes(kw)) && data[dataKey]) {
                return data[dataKey];
            }
        }

        return null;
    }

    fillField(input, value) {
        // Store original value
        if (!this.filledFields.has(input)) {
            this.filledFields.set(input, {
                originalValue: input.value,
                filledValue: value
            });
        }

        // Fill the field
        input.value = value;
        
        // Trigger events
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        // Add visual feedback
        this.highlightField(input);
        
        // Add edit button
        this.addEditButton(input);
    }

    highlightField(input) {
        const originalBorder = input.style.border;
        const originalBackground = input.style.backgroundColor;
        
        input.style.border = '2px solid #10b981';
        input.style.backgroundColor = '#ecfdf5';

        setTimeout(() => {
            input.style.border = originalBorder;
            input.style.backgroundColor = originalBackground;
        }, 2000);
    }

    addEditButton(input) {
        // Check if edit button already exists
        if (input.dataset.hasEditBtn) return;
        
        input.dataset.hasEditBtn = 'true';

        // Create edit button
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '✏️';
        editBtn.className = 'digitalclerk-edit-btn';
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

        // Wrap input in relative container if needed
        if (getComputedStyle(input.parentElement).position === 'static') {
            input.parentElement.style.position = 'relative';
        }

        input.parentElement.appendChild(editBtn);
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
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
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
}

// Initialize
new FormFillerContent();
