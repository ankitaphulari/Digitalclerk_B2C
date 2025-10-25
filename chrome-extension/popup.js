// DigitalClerk Extension - Login Only (No Signup)
class DigitalClerkPopup {
    constructor() {
        // API Configuration - CHANGE THIS TO YOUR BACKEND URL
        this.API_URL = 'https://your-api-url.com/api'; // TODO: Replace with your actual API
        
        // MOCK MODE - Set to false when backend is ready
        this.MOCK_MODE = true;
        
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
                
                // Verify subscription status
                if (this.user.subscriptionStatus === 'EXPIRED') {
                    this.showMainScreen();
                    this.showExpiredWarning();
                } else {
                    this.showMainScreen();
                }
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
        // Auth buttons
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());

        // Enter key for login
        document.getElementById('loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Main menu buttons
        document.getElementById('quickFillBtn').addEventListener('click', () => this.showQuickFillSection());
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        document.getElementById('upgradeLink').addEventListener('click', () => this.openUpgradePage());
        document.getElementById('renewBtn').addEventListener('click', () => this.openRenewPage());

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
            if (this.MOCK_MODE) {
                // MOCK AUTHENTICATION - Remove when backend is ready
                await this.mockLogin(email, password);
            } else {
                // REAL API CALL
                await this.realLogin(email, password);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Login failed. Please try again.', 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    }

    async mockLogin(email, password) {
        // Simulate API delay
        await this.sleep(1000);

        // For testing, create a mock account
        const mockUser = {
            companyName: 'Test Company',
            email: email,
            phone: '9876543210',
            location: 'Mumbai, Maharashtra',
            plan: 'PROFESSIONAL',
            monthlyLimit: 1000,
            documentsUsed: 45,
            subscriptionStatus: 'ACTIVE', // ACTIVE, EXPIRED, CANCELLED
            subscriptionEndsAt: '2025-12-31',
            createdAt: new Date().toISOString()
        };

        // Simple mock validation
        if (password.length >= 6) {
            this.authToken = 'mock_token_' + Date.now();
            this.user = mockUser;

            await chrome.storage.local.set({
                authToken: this.authToken,
                user: this.user
            });

            this.showMessage('Login successful!', 'success');
            setTimeout(() => this.showMainScreen(), 1000);
        } else {
            this.showMessage('Invalid email or password', 'error');
        }
    }

    async realLogin(email, password) {
        const response = await fetch(`${this.API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Check subscription status
            if (data.user.subscriptionStatus === 'EXPIRED') {
                this.showMessage('Your subscription has expired. Please renew.', 'warning');
                // Still allow login but show expired warning
            } else if (data.user.subscriptionStatus === 'CANCELLED') {
                this.showMessage('Your account has been cancelled. Please contact support.', 'error');
                return;
            }

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
        // Check subscription status first
        if (this.user.subscriptionStatus === 'EXPIRED') {
            this.showMessage('Please renew your subscription to continue', 'error');
            this.showExpiredWarning();
            return;
        }

        // Check usage limit
        if (this.user.documentsUsed >= this.user.monthlyLimit) {
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

    showExpiredWarning() {
        document.getElementById('expiredWarning').style.display = 'block';
    }

    updateUserInfo() {
        if (!this.user) return;

        document.getElementById('userName').textContent = this.user.companyName || this.user.email;
        document.getElementById('userPlan').textContent = this.user.plan || 'STARTER PLAN';
        
        // Show subscription end date
        if (this.user.subscriptionEndsAt) {
            const endDate = new Date(this.user.subscriptionEndsAt);
            document.getElementById('subscriptionEndDate').textContent = endDate.toLocaleDateString('en-IN');
        }
        
        const used = this.user.documentsUsed || 0;
        const limit = this.user.monthlyLimit || 200;
        const percentage = (used / limit) * 100;

        document.getElementById('usageCount').textContent = used;
        document.getElementById('usageLimit').textContent = limit;
        document.getElementById('usageFill').style.width = `${Math.min(percentage, 100)}%`;

        // Show warning if limit reached
        if (used >= limit) {
            document.getElementById('limitWarning').style.display = 'block';
            document.getElementById('usageFill').style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        } else {
            document.getElementById('limitWarning').style.display = 'none';
        }

        // Show expired warning
        if (this.user.subscriptionStatus === 'EXPIRED') {
            this.showExpiredWarning();
        }
    }

    openUpgradePage() {
        chrome.tabs.create({
            url: 'https://digitalclerk.app/pricing'
        });
    }

    openRenewPage() {
        chrome.tabs.create({
            url: 'https://digitalclerk.app/renew'
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
        // Check subscription status
        if (this.user.subscriptionStatus === 'EXPIRED') {
            this.showMessage('Please renew your subscription', 'error');
            return;
        }

        // Check limit
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

        // Check subscription status before processing
        if (this.user.subscriptionStatus === 'EXPIRED') {
            this.showMessage('Please renew your subscription to continue', 'error');
            return;
        }

        const doneBtn = document.getElementById('doneBtn');
        doneBtn.disabled = true;
        doneBtn.textContent = 'Processing...';

        try {
            let extractedData;

            if (this.MOCK_MODE) {
                // MOCK EXTRACTION
                extractedData = await this.mockExtractDocuments();
            } else {
                // REAL API CALL
                extractedData = await this.realExtractDocuments();
            }

            if (extractedData) {
                // Update usage count
                await this.updateUsageCount(this.uploadedDocuments.length);

                // Send to content script
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'fillForm',
                    data: extractedData
                });

                this.showMessage('Form filled successfully! ✓', 'success');
                
                this.uploadedDocuments = [];
                this.updateDocumentList();
                this.updateUserInfo();

                setTimeout(() => {
                    this.showMainMenu();
                }, 1500);
            }
        } catch (error) {
            console.error('Processing error:', error);
            
            // Check if error is due to subscription
            if (error.message.includes('SUBSCRIPTION_EXPIRED')) {
                this.showMessage('Your subscription has expired', 'error');
                this.showExpiredWarning();
            } else {
                this.showMessage('Error processing documents. Please try again.', 'error');
            }
        } finally {
            doneBtn.disabled = false;
            doneBtn.textContent = '✓ Process & Fill Form';
        }
    }

    async mockExtractDocuments() {
        // Simulate processing delay
        await this.sleep(2000);

        // Return mock extracted data
        return {
            name: 'Ankit Aphulari',
            email: 'ankit@example.com',
            phone: '9876543210',
            address: 'Latur, Maharashtra, India',
            pan: 'ABCDE1234F',
            aadhaar: '123456789012'
        };
    }

    async realExtractDocuments() {
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
            return result.data;
        } else if (result.error === 'LIMIT_EXCEEDED') {
            this.showMessage('Monthly limit exceeded!', 'error');
            return null;
        } else if (result.error === 'SUBSCRIPTION_EXPIRED') {
            throw new Error('SUBSCRIPTION_EXPIRED');
        } else {
            throw new Error(result.message);
        }
    }

    async updateUsageCount(count) {
        // Update usage locally
        this.user.documentsUsed = (this.user.documentsUsed || 0) + count;

        await chrome.storage.local.set({
            user: this.user
        });

        if (!this.MOCK_MODE) {
            // Also update on backend
            try {
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
                    // Update local user data with backend response
                    this.user.documentsUsed = result.newUsageCount;
                    await chrome.storage.local.set({
                        user: this.user
                    });
                }
            } catch (error) {
                console.error('Usage update error:', error);
            }
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

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    new DigitalClerkPopup();
});
