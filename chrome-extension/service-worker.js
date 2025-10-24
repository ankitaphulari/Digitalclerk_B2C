// DigitalClerk Background Service Worker with Authentication
class BackgroundService {
    constructor() {
        this.API_URL = 'https://your-api-url.com/api'; // TODO: Replace with your actual API
        this.extractedData = {};
        this.setupListeners();
        console.log('DigitalClerk Background Service Loaded ✓');
    }

    setupListeners() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'extractDocument') {
                this.extractDocument(request.document)
                    .then(data => sendResponse({ success: true, data }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true;
            }

            if (request.action === 'getExtractedData') {
                sendResponse({ data: this.extractedData });
            }

            if (request.action === 'checkAuth') {
                this.checkAuthStatus()
                    .then(result => sendResponse(result))
                    .catch(error => sendResponse({ authenticated: false }));
                return true;
            }
        });

        // Listen for external messages from web app
        chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
            if (request.action === 'syncProfile') {
                this.handleProfileSync(request.data);
                sendResponse({ success: true });
            }
        });

        // Check auth on extension install/update
        chrome.runtime.onInstalled.addListener(() => {
            this.checkAuthStatus();
        });
    }

    async checkAuthStatus() {
        try {
            const result = await chrome.storage.local.get(['authToken', 'user']);
            
            if (result.authToken && result.user) {
                // Verify token with backend
                const response = await fetch(`${this.API_URL}/auth/verify`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${result.authToken}`
                    }
                });

                const data = await response.json();

                if (data.success) {
                    // Token is valid, update user data
                    await chrome.storage.local.set({
                        user: data.user
                    });
                    return { authenticated: true, user: data.user };
                } else {
                    // Token invalid, clear storage
                    await chrome.storage.local.remove(['authToken', 'user']);
                    return { authenticated: false };
                }
            }

            return { authenticated: false };
        } catch (error) {
            console.error('Auth check error:', error);
            return { authenticated: false };
        }
    }

    async extractDocument(document) {
        console.log('Extracting data from document:', document.name);
        
        try {
            // Get auth token
            const { authToken } = await chrome.storage.local.get(['authToken']);
            
            if (!authToken) {
                throw new Error('Not authenticated');
            }

            // Send to backend API for OCR extraction
            const response = await fetch(`${this.API_URL}/extract/single`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    document: {
                        name: document.name,
                        type: document.type,
                        content: document.content
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                // Store extracted data
                this.extractedData[document.id] = result.data;
                
                await chrome.storage.local.set({
                    [`extracted_${document.id}`]: result.data
                });

                return result.data;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Extraction error:', error);
            throw error;
        }
    }

    async handleProfileSync(profileData) {
        console.log('Syncing profile from web app:', profileData);
        
        try {
            // Update user data from web app
            const { user } = await chrome.storage.local.get(['user']);
            
            const updatedUser = {
                ...user,
                ...profileData
            };

            await chrome.storage.local.set({
                user: updatedUser
            });

            // Notify popup to refresh
            chrome.runtime.sendMessage({
                action: 'profileUpdated',
                data: updatedUser
            });

        } catch (error) {
            console.error('Profile sync error:', error);
        }
    }
}

// Initialize
new BackgroundService();
