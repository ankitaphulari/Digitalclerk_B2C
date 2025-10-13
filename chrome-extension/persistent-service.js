// Persistent Form Filler Service - Modernized with error handling
export class PersistentFormFillerService {
  constructor() {
    this.documentData = null;
    this.userProfiles = new Map();
    this.formContext = null;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.retryAttempts = 0;
    this.maxRetries = 3;
  }

  async initialize() {
    try {
      await this.loadStoredData();
      this.setupStorageSync();
      this.setupNetworkMonitoring();
      console.log('✅ Persistent Form Filler Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize persistent service:', error);
      throw error;
    }
  }

  async loadStoredData() {
    try {
      const stored = await chrome.storage.sync.get([
        'userProfiles', 
        'documentData', 
        'formContext', 
        'preferences'
      ]);
      
      if (stored.userProfiles) {
        this.userProfiles = new Map(Object.entries(stored.userProfiles));
      }
      
      if (stored.documentData) {
        this.documentData = stored.documentData;
      }
      
      if (stored.formContext) {
        this.formContext = stored.formContext;
      }
      
      console.log('📁 Loaded stored data:', { 
        profiles: this.userProfiles.size, 
        hasDocuments: !!this.documentData 
      });
    } catch (error) {
      console.error('❌ Failed to load stored data:', error);
      throw error;
    }
  }

  setupStorageSync() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        console.log('🔄 Storage sync detected:', changes);
        this.handleStorageChanges(changes);
      }
    });
  }

  setupNetworkMonitoring() {
    // Monitor network status changes
    if (typeof navigator !== 'undefined') {
      window.addEventListener?.('online', () => this.handleNetworkChange(true));
      window.addEventListener?.('offline', () => this.handleNetworkChange(false));
    }
  }

  handleNetworkChange(isOnline) {
    const wasOnline = this.isOnline;
    this.isOnline = isOnline;
    
    console.log(`🌐 Network status changed: ${isOnline ? 'online' : 'offline'}`);
    
    if (!wasOnline && isOnline && this.syncQueue.length > 0) {
      console.log('📡 Back online, processing sync queue');
      this.processSyncQueue();
    }
  }

  async handleStorageChanges(changes) {
    try {
      if (changes.userProfiles) {
        this.userProfiles = new Map(Object.entries(changes.userProfiles.newValue || {}));
      }
      
      if (changes.documentData) {
        this.documentData = changes.documentData.newValue;
      }
    } catch (error) {
      console.error('❌ Error handling storage changes:', error);
    }
  }

  async persistData(key, data) {
    try {
      await chrome.storage.sync.set({ [key]: data });
      console.log(`💾 Persisted ${key} data`);
      this.retryAttempts = 0; // Reset retry counter on success
    } catch (error) {
      console.error(`❌ Failed to persist ${key}:`, error);
      
      // Queue for retry with exponential backoff
      this.syncQueue.push({ 
        key, 
        data, 
        timestamp: Date.now(),
        retryCount: this.retryAttempts
      });
      
      this.retryAttempts = Math.min(this.retryAttempts + 1, this.maxRetries);
    }
  }

  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;
    
    const queue = [...this.syncQueue];
    this.syncQueue = [];
    
    for (const item of queue) {
      try {
        // Exponential backoff delay
        const delay = Math.pow(2, item.retryCount) * 1000;
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        await chrome.storage.sync.set({ [item.key]: item.data });
        console.log(`✅ Synced queued data: ${item.key}`);
      } catch (error) {
        console.error(`❌ Failed to sync ${item.key}:`, error);
        
        // Re-queue if under retry limit
        if (item.retryCount < this.maxRetries) {
          this.syncQueue.push({
            ...item,
            retryCount: (item.retryCount || 0) + 1
          });
        } else {
          console.error(`❌ Max retries exceeded for ${item.key}, dropping item`);
        }
      }
    }
  }

  async getDocumentData() {
    try {
      // Check if data has expired
      if (this.documentData?.expiresAt && Date.now() > this.documentData.expiresAt) {
        console.log('📄 Document data expired, clearing');
        this.documentData = null;
        await this.persistData('documentData', null);
      }
      
      return this.documentData;
    } catch (error) {
      console.error('❌ Error getting document data:', error);
      return null;
    }
  }

  async getStoredProfiles() {
    try {
      return Object.fromEntries(this.userProfiles);
    } catch (error) {
      console.error('❌ Error getting stored profiles:', error);
      return {};
    }
  }

  async getProfileData(formType, url) {
    try {
      const bestProfile = await this.selectBestProfile(formType, url);
      
      return { 
        success: true, 
        profile: bestProfile,
        allProfiles: Object.fromEntries(this.userProfiles)
      };
    } catch (error) {
      console.error('❌ Error getting profile data:', error);
      return { 
        success: false, 
        error: error.message,
        profile: null,
        allProfiles: {}
      };
    }
  }

  async selectBestProfile(formType, url) {
    try {
      const profiles = Array.from(this.userProfiles.values());
      
      if (profiles.length === 0) {
        return this.documentData?.extractedData || null;
      }
      
      // Score profiles based on relevance
      const scoredProfiles = profiles.map(profile => ({
        ...profile,
        relevanceScore: this.calculateProfileRelevance(profile, formType, url)
      }));
      
      // Sort by score and return the best match
      scoredProfiles.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      return scoredProfiles[0]?.relevanceScore > 0.3 ? scoredProfiles[0] : null;
    } catch (error) {
      console.error('❌ Error selecting best profile:', error);
      return null;
    }
  }

  calculateProfileRelevance(profile, formType, url) {
    let score = 0;
    
    try {
      // Type matching
      if (profile.profileType === formType) score += 0.4;
      
      // URL domain matching for repeat forms
      if (profile.lastUsedDomains?.includes(this.extractDomain(url))) score += 0.3;
      
      // Confidence score
      score += (profile.confidence || 0) * 0.2;
      
      // Recency bonus
      const daysSinceSync = (Date.now() - (profile.lastSync || 0)) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 0.1 - daysSinceSync * 0.01);
      
      return Math.min(1.0, score);
    } catch (error) {
      console.error('❌ Error calculating profile relevance:', error);
      return 0;
    }
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  async handleDocumentReceived(data) {
    try {
      const enhancedData = {
        ...data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        sessionId: this.generateSessionId(),
        documentId: this.generateDocumentId()
      };
      
      this.documentData = enhancedData;
      await this.persistData('documentData', enhancedData);
      
      // Auto-create profile from document data
      await this.autoCreateProfile(enhancedData);
      
      // Store in local storage as backup
      await chrome.storage.local.set({ documentData: enhancedData });
      
      console.log('📄 Enhanced document data stored:', enhancedData.documentId);
      
      return { success: true, message: 'Document received and processed' };
    } catch (error) {
      console.error('❌ Error handling document received:', error);
      return { success: false, error: error.message };
    }
  }

  async autoCreateProfile(documentData) {
    try {
      if (!documentData.extractedData) return;
      
      const profileId = `auto_${documentData.documentType}_${Date.now()}`;
      const autoProfile = {
        profileId,
        profileType: this.detectProfileType(documentData),
        profileName: this.generateProfileName(documentData),
        data: documentData.extractedData,
        autoGenerated: true,
        sourceDocumentId: documentData.documentId,
        confidence: this.calculateProfileConfidence(documentData.extractedData),
        lastSync: Date.now(),
        version: 1
      };
      
      // Only create if we have enough data and confidence is high
      if (autoProfile.confidence > 0.7) {
        this.userProfiles.set(profileId, autoProfile);
        await this.persistData('userProfiles', 
          Object.fromEntries(this.userProfiles)
        );
        
        console.log('🤖 Auto-created profile:', profileId, `(${autoProfile.confidence * 100}% confidence)`);
      }
    } catch (error) {
      console.error('❌ Error auto-creating profile:', error);
    }
  }

  detectProfileType(documentData) {
    const docType = documentData.documentType?.toLowerCase() || '';
    const extractedData = documentData.extractedData || {};
    
    if (docType.includes('marksheet') || docType.includes('transcript') || 
        extractedData.education || extractedData.studentId) {
      return 'student';
    }
    
    if (docType.includes('resume') || docType.includes('cv') || 
        extractedData.experience || extractedData.skills) {
      return 'job_seeker';
    }
    
    return 'general';
  }

  generateProfileName(documentData) {
    const extractedData = documentData.extractedData || {};
    const name = extractedData.fullName || extractedData.name || 'Anonymous';
    const docType = documentData.documentType || 'Document';
    
    return `${name} (${docType})`;
  }

  calculateProfileConfidence(extractedData) {
    let score = 0;
    const totalFields = Object.keys(extractedData).length;
    
    if (totalFields === 0) return 0;
    
    // Essential fields
    if (extractedData.fullName || extractedData.name) score += 0.3;
    if (extractedData.email) score += 0.2;
    if (extractedData.phone) score += 0.15;
    if (extractedData.address) score += 0.1;
    
    // Additional fields boost confidence
    const additionalScore = Math.min(0.25, (totalFields - 4) * 0.05);
    score += Math.max(0, additionalScore);
    
    return Math.min(1.0, score);
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateDocumentId() {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Additional modern methods for tab management
  async onTabActivated(activeInfo) {
    try {
      // Handle tab activation logic
      console.log('📑 Tab activated:', activeInfo.tabId);
    } catch (error) {
      console.error('❌ Error in tab activation handler:', error);
    }
  }

  async onTabUpdated(tabId, tab) {
    try {
      if (tab.url && tab.status === 'complete') {
        // Handle form detection on new pages
        console.log('🔄 Tab updated:', tabId, tab.url);
      }
    } catch (error) {
      console.error('❌ Error in tab update handler:', error);
    }
  }

  async checkNetworkAndSync() {
    try {
      const wasOnline = this.isOnline;
      this.isOnline = navigator.onLine;
      
      if (!wasOnline && this.isOnline && this.syncQueue.length > 0) {
        console.log('📡 Network back online, syncing queued data');
        await this.processSyncQueue();
      }
    } catch (error) {
      console.error('❌ Error checking network and sync:', error);
    }
  }

  async performPeriodicSync() {
    try {
      console.log('⏰ Performing periodic sync');
      await this.processSyncQueue();
    } catch (error) {
      console.error('❌ Error in periodic sync:', error);
    }
  }
}