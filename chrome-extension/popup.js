// popup.js - DigitalClerk Extension Popup Logic

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
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
            uploadArea.addEventListener('drop', this.handleDrop.bind(this));
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // Button events
        const scanBtn = document.getElementById('scanFormsBtn');
        const fillBtn = document.getElementById('fillFormsBtn');
        const clearDocsBtn = document.getElementById('clearAllDocs');
        const clearDataBtn = document.getElementById('clearDataBtn');
        const openWebBtn = document.getElementById('openWebAppBtn');
        
        if (scanBtn) scanBtn.addEventListener('click', () => this.scanCurrentPageForForms());
        if (fillBtn) fillBtn.addEventListener('click', () => this.fillFormsWithData());
        if (clearDocsBtn) clearDocsBtn.addEventListener('click', () => this.clearAllDocuments());
        if (clearDataBtn) clearDataBtn.addEventListener('click', () => this.clearDocumentData());
        if (openWebBtn) openWebBtn.addEventListener('click', () => this.openWebApp());

        // Settings events
        const autoFill = document.getElementById('autoFillEnabled');
        const highlight = document.getElementById('highlightFields');
        
        if (autoFill) autoFill.addEventListener('change', this.saveSettings.bind(this));
        if (highlight) highlight.addEventListener('change', this.saveSettings.bind(this));
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
        e.target.value = '';
    }

    async processFiles(files) {
        const validFiles = [];
        
        for (const file of files) {
            if (!this.isValidFileType(file)) {
                this.showMessage(`Unsupported file type: ${file.name}`, 'error');
                continue;
            }
            validFiles.push(file);
        }
        
        if (validFiles.length === 0) {
            this.showMessage('No valid files to process. Supported: PDF, DOC, DOCX, TXT, PNG, JPG', 'warning');
            return;
        }

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
            const progress = (current / total) * 100;
            const progressFill = document.getElementById('progressFill');
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }

            const content = await this.readFileContent(file);
            
            const document = {
                id: this.generateId(),
                name: file.name,
                type: this.getFileTypeLabel(file),
                size: this.formatFileSize(file.size),
                uploadDate: new Date().toLocaleString(),
                content: typeof content === 'string' ? content.substring(0, 1000) : '[Binary Data]',
                originalFile: {
                    type: file.type,
                    lastModified: file.lastModified
                }
            };

            this.uploadedDocuments.push(document);
            this.extractDataFromDocument(document);

        } catch (error) {
            console.error('Error uploading file:', error);
            this.showMessage(`Error uploading ${file.name}: ${error.message}`, 'error');
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            
            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf') {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    extractDataFromDocument(document) {
        try {
            let extractedData = {};

            if (typeof document.content === 'string') {
                extractedData = this.extractFromText(document.content);
            }

            this.extractedData[document.id] = extractedData;
            
        } catch (error) {
            console.error('Error extracting data:', error);
        }
    }

    extractFromText(content) {
        const data = {};
        const lines = typeof content === 'string' ? content.split('\n') : [];
        
        const patterns = {
            name: /(?:name|full name|firstname|lastname):\s*(.+)/i,
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

    // Document Management
    updateDocumentList() {
        const documentList = document.getElementById('documentList');
        const emptyState = document.getElementById('emptyState');

        if (!documentList) return;

        if (this.uploadedDocuments.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        documentList.innerHTML = '';

        this.uploadedDocuments.forEach(doc => {
            const docItem = this.createDocumentItem(doc);
            documentList.appendChild(docItem);
        });

        const fillBtn = document.getElementById('fillFormsBtn');
        if (fillBtn) {
            fillBtn.disabled = false;
        }
    }

    createDocumentItem(doc) {
        const item = document.createElement('div');
        item.className = 'document-item';
        
        const hasExtractedData = this.extractedData[doc.id] && Object.keys(this.extractedData[doc.id]).length > 0;
        
        item.innerHTML = `
            <div class="document-info">
                <div class="document-name">${doc.name}</div>
                <div class="document-meta">
                    ${doc.type} • ${doc.size} • ${doc.uploadDate}
                </div>
            </div>
            <div class="document-actions">
                <button class="btn btn-small" data-doc-id="${doc.id}" onclick="assistant.deleteDocument('${doc.id}')">
                    🗑️ Delete
                </button>
            </div>
        `;

        return item;
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
        
        if (confirm(`Delete all ${this.uploadedDocuments.length} documents?`)) {
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
            if (button) {
                button.textContent = '🔍 Scanning...';
                button.disabled = true;
            }

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }

            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                throw new Error('Cannot access chrome internal pages');
            }

            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'scanForms',
                timestamp: Date.now()
            }).catch(async (error) => {
                // Try to inject content script
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content.js']
                    });
                    await new Promise(r => setTimeout(r, 500));
                    return await chrome.tabs.sendMessage(tab.id, {
                        action: 'scanForms',
                        timestamp: Date.now()
                    });
                } catch (e) {
                    throw new Error('Failed to scan: ' + e.message);
                }
            });

            if (response && response.success) {
                this.showMessage(`✅ Found ${response.forms?.length || 0} form(s)`, 'success');
                if (this.uploadedDocuments.length > 0) {
                    const fillBtn = document.getElementById('fillFormsBtn');
                    if (fillBtn) fillBtn.disabled = false;
                }
            } else {
                this.showMessage('No forms found on this page', 'warning');
            }

        } catch (error) {
            console.error('Scan error:', error);
            this.showMessage(`Scan failed: ${error.message}`, 'error');
        } finally {
            if (button) {
                button.textContent = '🔍 Scan for Forms';
                button.disabled = false;
            }
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
            
            const combinedData = this.combineExtractedData();
            
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'fillFormsWithData',
                extractedData: combinedData,
                settings: this.getSettings()
            }).catch(async (error) => {
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content.js']
                    });
                    await new Promise(r => setTimeout(r, 500));
                    return await chrome.tabs.sendMessage(tab.id, {
                        action: 'fillFormsWithData',
                        extractedData: combinedData,
                        settings: this.getSettings()
                    });
                } catch (e) {
                    throw e;
                }
            });

            if (response && response.success) {
                this.showMessage(`✅ Forms filled successfully!`, 'success');
            }
        } catch (error) {
            console.error('Fill error:', error);
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
        if (confirm('Clear all extracted data?')) {
            this.extractedData = {};
            this.saveDocuments();
            this.updateDocumentList();
            this.showMessage('Data cleared', 'success');
        }
    }

    // Settings
    getSettings() {
        const autoFill = document.getElementById('autoFillEnabled');
        const highlight = document.getElementById('highlightFields');
        
        return {
            autoFillEnabled: autoFill ? autoFill.checked : false,
            highlightFields: highlight ? highlight.checked : false
        };
    }

    saveSettings() {
        chrome.storage.local.set({ settings: this.getSettings() });
    }

    // UI Helpers
    showUploadProgress(show) {
        const progress = document.getElementById('uploadProgress');
        if (progress) {
            progress.style.display = show ? 'block' : 'none';
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
        if (content) {
            content.insertBefore(messageElement, content.firstChild);
        }
        
        setTimeout(() => messageElement.remove(), 4000);
    }

    updateDocumentStatus() {
        const statusSection = document.getElementById('statusSection');
        if (statusSection) {
            if (this.uploadedDocuments.length === 0) {
                statusSection.textContent = 'No document loaded';
                statusSection.className = 'no-document-state';
            } else {
                statusSection.textContent = `✅ ${this.uploadedDocuments.length} document(s) loaded`;
                statusSection.className = 'success-box';
            }
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

    openWebApp() {
        chrome.tabs.create({ 
            url: 'https://digitalclerk.app'
        });
    }
}

// Initialize when popup loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup loaded, initializing assistant');
    window.assistant = new FormFillerAssistant();
});

console.log('popup.js loaded');
