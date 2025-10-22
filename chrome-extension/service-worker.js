// Simplified service-worker.js
class BackgroundService {
    constructor() {
        this.extractedData = {};
        this.setupListeners();
    }

    setupListeners() {
        // Listen for document extraction requests
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
        });

        // Listen for external messages from web app
        chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
            if (request.action === 'profileCreated') {
                this.handleProfileCreated(request.data);
                sendResponse({ success: true });
            }
        });
    }

    async extractDocument(document) {
        console.log('Extracting data from document:', document.name);
        
        // TODO: Send to your backend API for OCR
        // For now, store the document
        try {
            // Simulate extraction (replace with actual API call)
            const mockData = {
                name: 'Sample Name',
                email: 'sample@email.com',
                phone: '1234567890'
            };

            // Store extracted data
            this.extractedData[document.id] = mockData;
            
            await chrome.storage.local.set({
                [`extracted_${document.id}`]: mockData
            });

            return mockData;
        } catch (error) {
            console.error('Extraction error:', error);
            throw error;
        }
    }

    async handleProfileCreated(profileData) {
        console.log('Profile created:', profileData);
        
        // Store profile data
        await chrome.storage.local.set({
            currentProfile: profileData,
            profileCreatedAt: Date.now()
        });

        // Notify all tabs
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'profileReady',
                data: profileData
            }).catch(() => {});
        });
    }
}

// Initialize
new BackgroundService();

console.log('Background service worker loaded');
