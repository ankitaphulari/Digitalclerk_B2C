// DigitalClerk Popup with Authentication
class DigitalClerkPopup {
    constructor() {
        // API Configuration - CHANGE THIS TO YOUR BACKEND URL
        this.API_URL = 'https://your-api-url.com/api'; // TODO: Replace with your actual API
        
        this.user = null;
        this.authToken = null;
        this.uploadedDocuments = [];
        
        this.init();
    }

    async init() {
        // Check if user is already logged in
        await this.checkAuth();
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            const result = await chrome.storage.local.get(['authToken', 'user']);
            
            if (result.authToken && result.user) {
                this.authToken = result.authToken;
                this.user = result.user;
                this.showMainScreen();
            } else {
                this.showAuthScreen();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.showAuthScreen();
        }
        
        this.hideLoading();
    }

    setupEventListeners() {
        // Auth tab switching
        document.getElementById('loginTab').addEventListener('click', () => this.showLoginForm());
        document.getElementById('signupTab').addEventListener('click', () => this.showSignupForm());
        document.getElementById('switchToSignup').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignupForm();
        });
        document.getElementById('switchToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Auth buttons
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        document.getElementById('signupBtn').addEventListener('click', () => this.handleSignup());

        // Enter key for forms
        document.getElementById('loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        document.getElementById('signupPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSignup();
        });

        // Main menu buttons
        document.getElementById('quickFillBtn').addEventListener('click', () => this.showQuickFillSection());
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        document.getElementById('upgradeLink').addEventListener('click', () => this.openUpgradePage());

        // Quick fill section
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        document.getElementById('doneBtn').addEventListener('click', () => this.handleDone());
        document.getElementById('backBtn').addEventListener('click', () => this.showMainMenu());
    }

    // ==================== AUTH METHODS ====================

    showLoginForm() {
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('signupTab').classList.remove('active');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    }

    showSignupForm() {
        document.getElementById('signupTab').classList.add('active');
        document.getElementById('loginTab').classList.remove('active');
        document.getElementById('signupForm').style.display = 'block';
        document.getElementById('loginForm').style.display = 'none';
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showMessage('Please fill all fields', 'error');
            return;
        }

        const loginBtn = document.getElementById('loginBtn');
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        try {
            // Call your backend API
            const response = await fetch(`${this.API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Save auth data
                this.authToken = data.token;
                this.user = data.user;

                await chrome.storage.local.set({
                    authToken: data.token,
                    user: data.user
                });

                this.showMessage('Login successful!', 'success');
                setTimeout(() => this.showMainScreen(), 1000);
            } else {
                this.showMessage(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    }

    async handleSignup() {
        const company = document.getElementById('signupCompany').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;

        if (!company || !email || !password) {
            this.showMessage('Please fill all fields', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        const signupBtn = document.getElementById('signupBtn');
        signupBtn.disabled = true;
        signupBtn.textContent = 'Creating account...';

        try {
            const response = await fetch(`${this.API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName: company,
                    email,
                    password,
                    plan: 'FREE' // Default plan
                })
            });

            const data = await response.json();

            if (data.success) {
                this.authToken = data.token;
                this.user = data.user;

                await chrome.storage.local.set({
                    authToken: data.token,
                    user: data.user
                });

                this.showMessage('Account created successfully!', 'success');
                setTimeout(() => this.showMainScreen(), 1000);
            } else {
                this.showMessage(data.message || 'Signup failed', 'error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            signupBtn.disabled = false;
            signupBtn.textContent = 'Create Account';
        }
    }

    async handleLogout() {
        if (!confirm('Are you sure you want to logout?')) return;

        await chrome.storage.local.remove(['authToken', 'user']);
        this.authToken = null;
        this.user = null;
        this.uploadedDocuments = [];

        this.showMessage('Logged out successfully', 'success');
        setTimeout(() => this.showAuthScreen(), 1000);
    }

    // ==================== UI NAVIGATION ====================

    showAuthScreen() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('authScreen').classList.remove('hidden');
        document.getElementById('mainScreen').classList.remove('active');
        document.getElementById('quickFillSection').classList.remove('active');
    }

    showMainScreen() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('mainScreen').classList.add('active');
        document.getElementById('quickFillSection').classList.remove('active');

        this.updateUserInfo();
    }

    showMainMenu() {
        document.getElementById('mainScreen').classList.add('active');
        document.getElementById('quickFillSection').classList.remove('active');
    }

    showQuickFillSection() {
        // Check usage limit before allowing upload
        if (this.user && this.user.documentsUsed >= this.user.monthlyLimit) {
            this.showMessage('Monthly limit exceeded! Please upgrade your plan.', 'error');
            document.getElementById('limitWarning').style.display = 'block';
            return;
        }

        document.getElementById('mainScreen').classList.remove('active');
        document.getElementById('quickFillSection').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingScreen').style.display = 'none';
    }

    updateUserInfo() {
        if (!this.user) return;

        document.getElementById('userName').textContent = this.user.companyName || this.user.email;
        document.getElementById('userPlan').textContent = this.user.plan || 'FREE PLAN';
        
        const used = this.user.documentsUsed || 0;
        const limit = this.user.monthlyLimit || 10;
        const percentage = (used / limit) * 100;

        document.getElementById('usageCount').textContent = used;
        document.getElementById('usageLimit').textContent = limit;
        document.getElementById('usageFill').style.width = `${Math.min(percentage, 100)}%`;

        // Show warning if limit reached
        if (used >= limit) {
            document.getElementById('limitWarning').style.display = 'block';
            document.getElementById('usageFill').style.background = 'linear-gradient
            document.getElementById('usageFill').style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        } else {
            document.getElementById('limitWarning').style.display = 'none';
        }
    }

    openUpgradePage() {
        chrome.tabs.create({
            url: 'https://digitalclerk.app/pricing' // TODO: Change to your pricing page
        });
    }

    // ==================== FILE UPLOAD ====================

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
        // Check limit before processing
        if (this.user.documentsUsed >= this.user.monthlyLimit) {
            this.showMessage('Monthly limit exceeded!', 'error');
            return;
        }

        const validFiles = files.filter(file => {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            return validTypes.includes(file.type);
        });

        if (validFiles.length === 0) {
            this.showMessage('Please upload valid documents (PDF, JPG, PNG)', 'error');
            return;
        }

        // Check if adding these files would exceed limit
        const remainingLimit = this.user.monthlyLimit - this.user.documentsUsed;
        if (validFiles.length > remainingLimit) {
            this.showMessage(`You can only upload ${remainingLimit} more document(s) this month`, 'error');
            return;
        }

        for (const file of validFiles) {
            await this.uploadFile(file);
        }

        this.updateDocumentList();
    }

    async uploadFile(file) {
        const document = {
            id: this.generateId(),
            name: file.name,
            type: file.type,
            size: this.formatFileSize(file.size),
            uploadDate: new Date().toISOString()
        };

        // Read file content
        const content = await this.readFileAsBase64(file);
        document.content = content;

        this.uploadedDocuments.push(document);
        
        this.showMessage(`Added: ${file.name}`, 'success');
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

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
        this.showMessage('Document removed', 'info');
    }

    // ==================== PROCESS & FILL FORM ====================

    async handleDone() {
        if (this.uploadedDocuments.length === 0) {
            this.showMessage('Please upload at least one document', 'error');
            return;
        }

        const doneBtn = document.getElementById('doneBtn');
        doneBtn.disabled = true;
        doneBtn.textContent = 'Processing...';

        try {
            // Send documents to backend for extraction
            const extractedData = await this.extractDocuments();

            if (extractedData) {
                // Update usage count
                await this.updateUsageCount(this.uploadedDocuments.length);

                // Send to content script to fill form
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'fillForm',
                    data: extractedData
                });

                this.showMessage('Form filled successfully! ✓', 'success');
                
                // Clear uploaded documents
                this.uploadedDocuments = [];
                this.updateDocumentList();

                // Update user info
                this.updateUserInfo();

                setTimeout(() => {
                    this.showMainMenu();
                }, 1500);
            }
        } catch (error) {
            console.error('Processing error:', error);
            this.showMessage('Error processing documents. Please try again.', 'error');
        } finally {
            doneBtn.disabled = false;
            doneBtn.textContent = '✓ Process & Fill Form';
        }
    }

    async extractDocuments() {
        try {
            // Call your backend API for OCR extraction
            const response = await fetch(`${this.API_URL}/extract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    documents: this.uploadedDocuments
                })
            });

            const result = await response.json();

            if (result.success) {
                return result.data; // Extracted data from documents
            } else if (result.error === 'LIMIT_EXCEEDED') {
                this.showMessage('Monthly limit exceeded!', 'error');
                document.getElementById('limitWarning').style.display = 'block';
                return null;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Extraction error:', error);
            throw error;
        }
    }

    async updateUsageCount(count) {
        try {
            // Update usage on backend
            const response = await fetch(`${this.API_URL}/usage/increment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ count })
            });

            const result = await response.json();

            if (result.success) {
                // Update local user data
                this.user.documentsUsed = result.newUsageCount;
                
                await chrome.storage.local.set({
                    user: this.user
                });
            }
        } catch (error) {
            console.error('Usage update error:', error);
        }
    }

    // ==================== HELPERS ====================

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
