// Simplified popup.js for DigitalClerk
class DigitalClerkPopup {
    constructor() {
        this.uploadedDocuments = [];
        this.initializeUI();
        this.loadStoredDocuments();
    }

    initializeUI() {
        // Main menu buttons
        document.getElementById('createProfileBtn').addEventListener('click', () => {
            this.openCreateProfile();
        });

        document.getElementById('quickFillBtn').addEventListener('click', () => {
            this.showQuickFillSection();
        });

        // Quick fill section
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        document.getElementById('doneBtn').addEventListener('click', () => {
            this.handleDone();
        });

        document.getElementById('backBtn').addEventListener('click', () => {
            this.showMainMenu();
        });
    }

    // Navigate to create profile (opens website)
    openCreateProfile() {
        chrome.tabs.create({
            url: 'https://digitalclerk.app/create-profile'  // Change to your actual URL
        });
    }

    // Show quick fill section
    showQuickFillSection() {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('quickFillSection').style.display = 'block';
    }

    // Show main menu
    showMainMenu() {
        document.getElementById('mainMenu').style.display = 'block';
        document.getElementById('quickFillSection').style.display = 'none';
    }

    // Drag and drop handlers
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

    // Process uploaded files
    async processFiles(files) {
        const validFiles = files.filter(file => {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            return validTypes.includes(file.type);
        });

        if (validFiles.length === 0) {
            this.showMessage('Please upload valid documents (PDF, JPG, PNG)', 'error');
            return;
        }

        for (const file of validFiles) {
            await this.uploadFile(file);
        }

        this.updateDocumentList();
        this.saveDocuments();
    }

    async uploadFile(file) {
        const document = {
            id: this.generateId(),
            name: file.name,
            type: file.type,
            size: this.formatFileSize(file.size),
            uploadDate: new Date().toISOString()
        };

        // Read file content for OCR (will be sent to backend later)
        const content = await this.readFileAsBase64(file);
        document.content = content;

        this.uploadedDocuments.push(document);
        
        // Send to background for OCR extraction (silently)
        chrome.runtime.sendMessage({
            action: 'extractDocument',
            document: document
        });
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Update document list UI
    updateDocumentList() {
        const listContainer = document.getElementById('documentList');
        
        if (this.uploadedDocuments.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No documents uploaded</div>';
            return;
        }

        listContainer.innerHTML = '';
        this.uploadedDocuments.forEach(doc => {
            const item = document.createElement('div');
            item.className = 'document-item';
            item.innerHTML = `
                <div class="document-name">${doc.name}</div>
                <button class="btn-delete" data-id="${doc.id}">Delete</button>
            `;
            
            item.querySelector('.btn-delete').addEventListener('click', () => {
                this.deleteDocument(doc.id);
            });
            
            listContainer.appendChild(item);
        });
    }

    deleteDocument(docId) {
        this.uploadedDocuments = this.uploadedDocuments.filter(d => d.id !== docId);
        this.updateDocumentList();
        this.saveDocuments();
    }

    // Handle done button
    async handleDone() {
        if (this.uploadedDocuments.length === 0) {
            this.showMessage('Please upload at least one document', 'error');
            return;
        }

        // Save to storage
        await this.saveDocuments();
        
        this.showMessage('Documents uploaded successfully! ✓', 'success');
        
        // Go back to main menu after 1 second
        setTimeout(() => {
            this.showMainMenu();
        }, 1000);
    }

    // Storage functions
    async saveDocuments() {
        try {
            await chrome.storage.local.set({
                uploadedDocuments: this.uploadedDocuments,
                lastUpdate: Date.now()
            });
        } catch (error) {
            console.error('Error saving documents:', error);
        }
    }

    async loadStoredDocuments() {
        try {
            const result = await chrome.storage.local.get(['uploadedDocuments']);
            if (result.uploadedDocuments) {
                this.uploadedDocuments = result.uploadedDocuments;
                this.updateDocumentList();
            }
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    }

    // UI helpers
    showMessage(message, type = 'info') {
        const container = document.getElementById('messageContainer');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        
        container.innerHTML = '';
        container.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    generateId() {
        return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    new DigitalClerkPopup();
});
