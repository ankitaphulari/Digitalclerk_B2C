// popup.js - Updated with document upload functionality and format validation
class ExtensionFormatValidator {
    static DOCUMENT_REQUIREMENTS = {
        passport: {
            preferredFormats: ['image/jpeg', 'image/png'],
            maxFileSize: 1, // MB
            backgroundRequired: 'white'
        },
        aadhaar: {
            preferredFormats: ['image/png', 'image/jpeg'],
            maxFileSize: 2
        },
        pan: {
            preferredFormats: ['image/png', 'image/jpeg'],
            maxFileSize: 2
        },
        driving_license: {
            preferredFormats: ['image/png', 'image/jpeg'],
            maxFileSize: 2
        },
        general: {
            preferredFormats: ['image/png', 'image/jpeg', 'image/webp'],
            maxFileSize: 10
        }
    };

    static validateFile(file, documentType = 'general') {
        const requirements = this.DOCUMENT_REQUIREMENTS[documentType] || this.DOCUMENT_REQUIREMENTS.general;
        const issues = [];
        const warnings = [];
        
        // Check file size
        const sizeInMB = file.size / (1024 * 1024);
        if (sizeInMB > requirements.maxFileSize) {
            issues.push(`File too large: ${sizeInMB.toFixed(2)}MB (max: ${requirements.maxFileSize}MB)`);
        }
        
        // Check format
        if (!requirements.preferredFormats.includes(file.type)) {
            warnings.push(`Format ${file.type} may need conversion. Preferred: ${requirements.preferredFormats.join(', ')}`);
        }
        
        // Special requirements
        if (requirements.backgroundRequired) {
            warnings.push(`This document requires ${requirements.backgroundRequired} background`);
        }
        
        return {
            isValid: issues.length === 0,
            issues,
            warnings,
            needsWebProcessing: warnings.length > 0 || documentType === 'passport'
        };
    }

    static getRequirementsSummary(documentType = 'general') {
        const req = this.DOCUMENT_REQUIREMENTS[documentType] || this.DOCUMENT_REQUIREMENTS.general;
        return {
            formats: req.preferredFormats.join(', '),
            maxSize: `${req.maxFileSize}MB`,
            special: req.backgroundRequired ? `${req.backgroundRequired} background required` : null
        };
    }
}

class FormFillerAssistant {
    constructor() {
        this.isScanning = false;
        this.uploadedDocuments = [];
        this.extractedData = {};
        this.supportedTypes = {
            'application/pdf': 'PDF',
            'application/msword': 'DOC',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
            'text/plain': 'TXT',
            'image/png': 'PNG',
            'image/jpeg': 'JPG',
            'image/jpg': 'JPG'
        };
        
        this.initializeEventListeners();
        this.loadStoredDocuments();
        this.updateDocumentStatus();
    }

    initializeEventListeners() {
        // Upload area events
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Button events
        document.getElementById('scanFormsBtn').addEventListener('click', () => this.scanCurrentPageForForms());
        document.getElementById('fillFormsBtn').addEventListener('click', () => this.fillFormsWithData());
        document.getElementById('clearAllDocs').addEventListener('click', () => this.clearAllDocuments());
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearDocumentData());
        document.getElementById('openWebAppBtn').addEventListener('click', () => this.openWebApp());

        // Settings events
        document.getElementById('autoFillEnabled').addEventListener('change', this.saveSettings.bind(this));
        document.getElementById('highlightFields').addEventListener('change', this.saveSettings.bind(this));
    }

    // File Upload Handlers
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadArea').classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
        e.target.value = ''; // Reset input
    }

    async processFiles(files) {
        const validFiles = [];
        const formatValidationDiv = document.getElementById('formatValidation');
        
        // Validate each file
        for (const file of files) {
            if (!this.isValidFileType(file)) {
                this.showMessage(`Unsupported file type: ${file.name}`, 'error');
                continue;
            }

            // Check format requirements
            const validation = ExtensionFormatValidator.validateFile(file);
            
            if (!validation.isValid) {
                this.showFormatValidationError(file, validation);
                continue;
            }
            
            if (validation.warnings.length > 0) {
                this.showFormatValidationWarning(file, validation);
            }
            
            validFiles.push(file);
        }
        
        if (validFiles.length === 0) {
            this.showMessage('No valid files to process. Check format requirements.', 'warning');
            return;
        }

        if (validFiles.length !== files.length) {
            this.showMessage(`${files.length - validFiles.length} file(s) skipped due to format issues.`, 'warning');
        }

        // Show progress
        this.showUploadProgress(true);

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            await this.uploadFile(file, i + 1, validFiles.length);
        }

        this.hideUploadProgress();
        this.updateDocumentList();
        this.saveDocuments();
    }

    isValidFileType(file) {
        return Object.keys(this.supportedTypes).includes(file.type) ||
               file.name.toLowerCase().match(/\.(pdf|doc|docx|txt|png|jpg|jpeg)$/);
    }

    async uploadFile(file, current, total) {
        try {
            // Update progress
            const progress = (current / total) * 100;
            document.getElementById('progressFill').style.width = `${progress}%`;

            // Read file content
            const content = await this.readFileContent(file);
            
            // Create document object
            const document = {
                id: this.generateId(),
                name: file.name,
                type: this.getFileTypeLabel(file),
                size: this.formatFileSize(file.size),
                uploadDate: new Date().toISOString(),
                content: content,
                originalFile: {
                    type: file.type,
                    lastModified: file.lastModified
                }
            };

            // Add to uploaded documents
            this.uploadedDocuments.push(document);

            // Extract data from document
            await this.extractDataFromDocument(document);

        } catch (error) {
            console.error('Error uploading file:', error);
            this.showMessage(`Error uploading ${file.name}: ${error.message}`, 'error');
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                if (file.type.startsWith('image/')) {
                    // For images, store as data URL
                    resolve(e.target.result);
                } else {
                    // For text files, store as text
                    resolve(e.target.result);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            
            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    async extractDataFromDocument(document) {
        try {
            let extractedData = {};

            switch (document.originalFile.type) {
                case 'text/plain':
                    extractedData = this.extractFromText(document.content);
                    break;
                case 'application/pdf':
                    // For PDF, you'd need a PDF parsing library
                    extractedData = this.extractFromPDF(document.content);
                    break;
                default:
                    // Basic text extraction for other formats
                    extractedData = this.extractBasicData(document.content);
            }

            // Store extracted data
            this.extractedData[document.id] = extractedData;
            
        } catch (error) {
            console.error('Error extracting data from document:', error);
        }
    }

    extractFromText(content) {
        const data = {};
        const lines = content.split('\n');
        
        // Common patterns for form data extraction
        const patterns = {
            name: /(?:name|full name|first name|last name):\s*(.+)/i,
            email: /(?:email|e-mail):\s*([^\s@]+@[^\s@]+\.[^\s@]+)/i,
            phone: /(?:phone|telephone|mobile):\s*([+\d\s\-\(\)]+)/i,
            address: /(?:address|street):\s*(.+)/i,
            city: /(?:city|town):\s*(.+)/i,
            zipcode: /(?:zip|postal|pincode):\s*([^\s]+)/i,
            country: /(?:country):\s*(.+)/i
        };

        lines.forEach(line => {
            Object.entries(patterns).forEach(([key, pattern]) => {
                const match = line.match(pattern);
                if (match && !data[key]) {
                    data[key] = match[1].trim();
                }
            });
        });

        return data;
    }

    extractFromPDF(content) {
        // Placeholder for PDF extraction
        // In a real implementation, you'd use a library like PDF.js
        return { extracted: false, reason: 'PDF parsing not implemented yet' };
    }

    extractBasicData(content) {
        // Basic extraction for unknown formats
        return this.extractFromText(typeof content === 'string' ? content : '');
    }

    // Document Management
    updateDocumentList() {
        const documentList = document.getElementById('documentList');
        const emptyState = document.getElementById('emptyState');

        if (this.uploadedDocuments.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        documentList.innerHTML = '';

        this.uploadedDocuments.forEach(doc => {
            const docItem = this.createDocumentItem(doc);
            documentList.appendChild(docItem);
        });

        // Update fill forms button state
        document.getElementById('fillFormsBtn').disabled = this.uploadedDocuments.length === 0;
    }

    createDocumentItem(doc) {
        const item = document.createElement('div');
        item.className = 'document-item';
        
        const hasExtractedData = this.extractedData[doc.id] && Object.keys(this.extractedData[doc.id]).length > 0;
        
        item.innerHTML = `
            <div class="document-info">
                <div class="document-name">${doc.name}</div>
                <div class="document-meta">
                    ${doc.type} • ${doc.size} • ${hasExtractedData ? '✅ Data extracted' : '⏳ Processing...'}
                </div>
            </div>
            <div class="document-actions">
                <button class="btn btn-small btn-extract" data-doc-id="${doc.id}">
                    Extract
                </button>
                <button class="btn btn-small btn-delete" data-doc-id="${doc.id}">
                    Delete
                </button>
            </div>
        `;

        // Add event listeners
        item.querySelector('.btn-extract').addEventListener('click', () => this.reExtractDocument(doc.id));
        item.querySelector('.btn-delete').addEventListener('click', () => this.deleteDocument(doc.id));

        return item;
    }

    async reExtractDocument(docId) {
        const doc = this.uploadedDocuments.find(d => d.id === docId);
        if (doc) {
            await this.extractDataFromDocument(doc);
            this.updateDocumentList();
            this.showMessage(`Re-extracted data from ${doc.name}`, 'success');
        }
    }

    deleteDocument(docId) {
        const docIndex = this.uploadedDocuments.findIndex(d => d.id === docId);
        if (docIndex > -1) {
            const doc = this.uploadedDocuments[docIndex];
            this.uploadedDocuments.splice(docIndex, 1);
            delete this.extractedData[docId];
            
            this.updateDocumentList();
            this.saveDocuments();
            this.showMessage(`Deleted ${doc.name}`, 'success');
        }
    }

    clearAllDocuments() {
        if (this.uploadedDocuments.length === 0) return;
        
        if (confirm(`Are you sure you want to delete all ${this.uploadedDocuments.length} documents?`)) {
            this.uploadedDocuments = [];
            this.extractedData = {};
            this.updateDocumentList();
            this.saveDocuments();
            this.showMessage('All documents cleared', 'success');
        }
    }

    // Form Scanning and Filling
    async scanCurrentPageForForms() {
        if (this.isScanning) return;
        
        this.isScanning = true;
        const button = document.getElementById('scanFormsBtn');
        
        try {
            button.textContent = 'Scanning...';
            button.disabled = true;

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }

            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                throw new Error('Cannot access chrome internal pages');
            }

            await this.ensureContentScriptInjected(tab.id);

            const response = await this.sendMessageWithRetry(tab.id, {
                action: 'scanForms',
                timestamp: Date.now()
            });

            if (response && response.success) {
                this.handleScanResults(response.forms);
            } else {
                throw new Error(response?.error || 'Failed to scan forms');
            }

        } catch (error) {
            console.error('Failed to scan forms:', error);
            this.showMessage(`Failed to scan forms: ${error.message}`, 'error');
        } finally {
            button.textContent = 'Scan for Forms';
            button.disabled = false;
            this.isScanning = false;
        }
    }

    async fillFormsWithData() {
        if (this.uploadedDocuments.length === 0) {
            this.showMessage('Please upload documents first', 'warning');
            return;
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Combine all extracted data
            const combinedData = this.combineExtractedData();
            
            const response = await this.sendMessageWithRetry(tab.id, {
                action: 'fillFormsWithData',
                extractedData: combinedData,
                settings: this.getSettings()
            });

            if (response && response.success) {
                this.showMessage(`Filled ${response.filledFields || 0} fields`, 'success');
            } else {
                throw new Error(response?.error || 'Failed to fill forms');
            }
        } catch (error) {
            console.error('Failed to fill forms:', error);
            this.showMessage('Failed to fill forms: ' + error.message, 'error');
        }
    }

    combineExtractedData() {
        const combined = {};
        
        Object.values(this.extractedData).forEach(data => {
            Object.entries(data).forEach(([key, value]) => {
                if (value && !combined[key]) {
                    combined[key] = value;
                }
            });
        });
        
        return combined;
    }

    handleScanResults(forms) {
        if (!forms || forms.length === 0) {
            this.showMessage('No forms found on this page', 'warning');
            this.updateStatusIndicator('warning', 'No forms detected');
            return;
        }

        this.showMessage(`Found ${forms.length} form(s) on this page`, 'success');
        this.updateStatusIndicator('success', `${forms.length} forms ready for filling`);
        
        // Store forms data for later use
        chrome.storage.local.set({ 
            scannedForms: forms,
            scanTimestamp: Date.now()
        });

        // Enable fill button if we have documents
        if (this.uploadedDocuments.length > 0) {
            document.getElementById('fillFormsBtn').disabled = false;
        }
    }

    // Content Script Communication
    async ensureContentScriptInjected(tabId) {
        try {
            await chrome.tabs.sendMessage(tabId, { action: 'ping' });
        } catch (error) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                });
                
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (injectionError) {
                throw new Error('Failed to inject content script: ' + injectionError.message);
            }
        }
    }

    async sendMessageWithRetry(tabId, message, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await chrome.tabs.sendMessage(tabId, message);
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
            }
        }
    }

    // Storage Management
    async saveDocuments() {
        try {
            await chrome.storage.local.set({
                uploadedDocuments: this.uploadedDocuments,
                extractedData: this.extractedData
            });
        } catch (error) {
            console.error('Error saving documents:', error);
        }
    }

    async loadStoredDocuments() {
        try {
            const result = await chrome.storage.local.get(['uploadedDocuments', 'extractedData']);
            
            if (result.uploadedDocuments) {
                this.uploadedDocuments = result.uploadedDocuments;
            }
            
            if (result.extractedData) {
                this.extractedData = result.extractedData;
            }
            
            this.updateDocumentList();
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    }

    clearDocumentData() {
        if (confirm('Are you sure you want to clear all document data? This will not delete uploaded documents.')) {
            this.extractedData = {};
            this.saveDocuments();
            this.updateDocumentList();
            this.showMessage('Document data cleared', 'success');
        }
    }

    // Settings
    getSettings() {
        return {
            autoFillEnabled: document.getElementById('autoFillEnabled').checked,
            highlightFields: document.getElementById('highlightFields').checked
        };
    }

    saveSettings() {
        chrome.storage.local.set({ settings: this.getSettings() });
    }

    // UI Helpers
    updateStatusIndicator(type, message) {
        const indicator = document.getElementById('statusIndicator');
        indicator.className = `status-indicator status-${type}`;
        indicator.textContent = message;
        indicator.style.display = 'block';
    }

    showUploadProgress(show) {
        const progress = document.getElementById('uploadProgress');
        progress.style.display = show ? 'block' : 'none';
        if (!show) {
            document.getElementById('progressFill').style.width = '0%';
        }
    }

    hideUploadProgress() {
        setTimeout(() => this.showUploadProgress(false), 500);
    }

    showMessage(message, type = 'info') {
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        const content = document.querySelector('.content');
        content.insertBefore(messageElement, content.firstChild);
        
        setTimeout(() => messageElement.remove(), 5000);
    }

    updateDocumentStatus() {
        const statusSection = document.getElementById('statusSection');
        if (this.uploadedDocuments.length === 0) {
            statusSection.textContent = 'No document loaded';
            statusSection.className = 'no-document-state';
        } else {
            statusSection.textContent = `${this.uploadedDocuments.length} document(s) loaded`;
            statusSection.className = 'status-success';
        }
    }

    // Utility Functions
    generateId() {
        return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getFileTypeLabel(file) {
        return this.supportedTypes[file.type] || file.name.split('.').pop().toUpperCase();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    showFormatValidationError(file, validation) {
        const formatValidationDiv = document.getElementById('formatValidation');
        formatValidationDiv.style.display = 'block';
        formatValidationDiv.innerHTML = `
            <div class="message error">
                <strong>Format Error - ${file.name}:</strong><br>
                ${validation.issues.join('<br>')}
                <br><br>
                <button onclick="assistant.openWebAppForConversion()" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    Open Web App for Conversion
                </button>
            </div>
        `;
    }

    showFormatValidationWarning(file, validation) {
        const formatValidationDiv = document.getElementById('formatValidation');
        formatValidationDiv.style.display = 'block';
        formatValidationDiv.innerHTML = `
            <div class="message warning">
                <strong>Format Warning - ${file.name}:</strong><br>
                ${validation.warnings.join('<br>')}
                <br><br>
                <button onclick="assistant.openWebAppForConversion()" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 8px;">
                    Process in Web App
                </button>
                <button onclick="assistant.hideFormatValidation()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    Continue Anyway
                </button>
            </div>
        `;
    }

    hideFormatValidation() {
        const formatValidationDiv = document.getElementById('formatValidation');
        formatValidationDiv.style.display = 'none';
    }

    openWebAppForConversion() {
        chrome.tabs.create({
            url: window.location.origin
        });
    }

    openWebApp() {
        chrome.tabs.create({ 
            url: window.location.origin
        });
    }
}

// Initialize the extension
const assistant = new FormFillerAssistant();
