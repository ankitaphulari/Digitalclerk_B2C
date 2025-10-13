// Persistent Background Service Worker for Form Filler Assistant
class PersistentFormFillerService {
  constructor() {
    this.documentData = null;
    this.userProfiles = new Map();
    this.formContext = null;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    
    this.initializeService();
  }

  async initializeService() {
    // Load stored data from chrome.storage.sync
    await this.loadStoredData();
    
    // Set up sync listener
    this.setupStorageSync();
    
    // Set up network status monitoring
    this.setupNetworkMonitoring();
    
    console.log('Persistent Form Filler Service initialized');
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
      
      console.log('Loaded stored data:', { 
        profiles: this.userProfiles.size, 
        hasDocuments: !!this.documentData 
      });
    } catch (error) {
      console.error('Failed to load stored data:', error);
    }
  }

  setupStorageSync() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        console.log('Storage sync detected:', changes);
        this.handleStorageChanges(changes);
      }
    });
  }

  setupNetworkMonitoring() {
    // Monitor network status changes
    chrome.webNavigation.onCompleted.addListener(() => {
      this.checkNetworkAndSync();
    });
  }

  async handleStorageChanges(changes) {
    if (changes.userProfiles) {
      this.userProfiles = new Map(Object.entries(changes.userProfiles.newValue || {}));
    }
    
    if (changes.documentData) {
      this.documentData = changes.documentData.newValue;
    }
  }

  async persistData(key, data) {
    try {
      await chrome.storage.sync.set({ [key]: data });
      console.log(`Persisted ${key} data`);
    } catch (error) {
      console.error(`Failed to persist ${key}:`, error);
      // Queue for retry when online
      this.syncQueue.push({ key, data, timestamp: Date.now() });
    }
  }

  async checkNetworkAndSync() {
    const wasOnline = this.isOnline;
    this.isOnline = navigator.onLine;
    
    if (!wasOnline && this.isOnline && this.syncQueue.length > 0) {
      console.log('Back online, syncing queued data');
      await this.processSyncQueue();
    }
  }

  async processSyncQueue() {
    const queue = [...this.syncQueue];
    this.syncQueue = [];
    
    for (const item of queue) {
      try {
        await chrome.storage.sync.set({ [item.key]: item.data });
        console.log(`Synced queued data: ${item.key}`);
      } catch (error) {
        console.error(`Failed to sync ${item.key}:`, error);
        this.syncQueue.push(item); // Re-queue failed items
      }
    }
  }
}

// Initialize persistent service
const persistentService = new PersistentFormFillerService();

// Listen for messages from web app
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('Extension received message:', request);
  
  if (request.action === 'receiveDocument') {
    handleDocumentReceived(request.data);
    sendResponse({ success: true, message: 'Document received' });
  } else if (request.action === 'checkExtension') {
    sendResponse({ success: true, message: 'Extension is installed' });
  } else if (request.action === 'syncProfile') {
    handleProfileSync(request.data);
    sendResponse({ success: true, message: 'Profile synced' });
  } else if (request.action === 'getStoredProfiles') {
    sendResponse({ 
      success: true, 
      profiles: Object.fromEntries(persistentService.userProfiles) 
    });
  }
  
  return true;
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDocumentData') {
    sendResponse({ data: persistentService.documentData });
  } else if (request.action === 'getProfileData') {
    handleGetProfileData(request, sendResponse);
  } else if (request.action === 'detectFormType') {
    handleFormTypeDetection(request, sender, sendResponse);
  } else if (request.action === 'performRescan') {
    handleRescanRequest(request.missingFields, sender.tab.id);
    sendResponse({ success: true });
  } else if (request.action === 'logActivity') {
    console.log('Form filling activity:', request.data);
  } else if (request.action === 'syncFormContext') {
    handleFormContextSync(request.formContext, sender.tab);
    sendResponse({ success: true });
  }
  
  return true;
});

// Handle profile data requests from content script
async function handleGetProfileData(request, sendResponse) {
  const formType = request.formType;
  const url = request.url;
  
  // Get the best matching profile for this form
  const bestProfile = await selectBestProfile(formType, url);
  
  sendResponse({ 
    success: true, 
    profile: bestProfile,
    allProfiles: Object.fromEntries(persistentService.userProfiles)
  });
}

// Intelligent profile selection based on form context
async function selectBestProfile(formType, url) {
  const profiles = Array.from(persistentService.userProfiles.values());
  
  if (profiles.length === 0) {
    return persistentService.documentData?.extractedData || null;
  }
  
  // Score profiles based on relevance
  const scoredProfiles = profiles.map(profile => ({
    ...profile,
    relevanceScore: calculateProfileRelevance(profile, formType, url)
  }));
  
  // Sort by score and return the best match
  scoredProfiles.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return scoredProfiles[0]?.relevanceScore > 0.3 ? scoredProfiles[0] : null;
}

function calculateProfileRelevance(profile, formType, url) {
  let score = 0;
  
  // Type matching
  if (profile.profileType === formType) score += 0.4;
  
  // URL domain matching for repeat forms
  if (profile.lastUsedDomains?.includes(extractDomain(url))) score += 0.3;
  
  // Confidence score
  score += (profile.confidence || 0) * 0.2;
  
  // Recency bonus
  const daysSinceSync = (Date.now() - (profile.lastSync || 0)) / (1000 * 60 * 60 * 24);
  score += Math.max(0, 0.1 - daysSinceSync * 0.01);
  
  return Math.min(1.0, score);
}

// Handle form type detection
async function handleFormTypeDetection(request, sender, sendResponse) {
  const url = sender.tab.url;
  const domain = extractDomain(url);
  const formFields = request.formFields || [];
  
  const detectedType = await detectFormType(url, domain, formFields);
  
  // Store form context
  persistentService.formContext = {
    url,
    domain,
    detectedType,
    formFields,
    timestamp: Date.now()
  };
  
  sendResponse({ 
    success: true, 
    formType: detectedType,
    context: persistentService.formContext
  });
}

// Advanced form type detection
async function detectFormType(url, domain, formFields) {
  // Government form patterns
  const govPatterns = {
    'passport': /passport|travel.document/i,
    'aadhaar': /aadhaar|aadhar|uid/i,
    'pan': /pan.card|permanent.account/i,
    'driving': /driving.license|dl.application/i,
    'voter': /voter.id|election/i
  };
  
  // Check URL and domain first
  for (const [type, pattern] of Object.entries(govPatterns)) {
    if (pattern.test(url) || pattern.test(domain)) {
      return type;
    }
  }
  
  // Analyze form fields
  const fieldNames = formFields.map(f => (f.name || f.id || f.placeholder || '').toLowerCase());
  const fieldString = fieldNames.join(' ');
  
  // Educational forms
  if (/student|education|college|university|transcript|grade/.test(fieldString)) {
    return 'education';
  }
  
  // Job application forms
  if (/resume|cv|experience|employment|salary|job|position/.test(fieldString)) {
    return 'employment';
  }
  
  // Banking forms
  if (/account|bank|loan|credit|financial/.test(fieldString)) {
    return 'banking';
  }
  
  // Insurance forms
  if (/insurance|policy|claim|premium/.test(fieldString)) {
    return 'insurance';
  }
  
  return 'general';
}

function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

// Handle form context sync
async function handleFormContextSync(formContext, tab) {
  const domain = extractDomain(tab.url);
  
  // Update profile usage tracking
  if (formContext.selectedProfileId) {
    const profile = persistentService.userProfiles.get(formContext.selectedProfileId);
    if (profile) {
      profile.lastUsed = Date.now();
      profile.lastUsedDomains = profile.lastUsedDomains || [];
      
      if (!profile.lastUsedDomains.includes(domain)) {
        profile.lastUsedDomains.push(domain);
      }
      
      // Keep only last 10 domains
      if (profile.lastUsedDomains.length > 10) {
        profile.lastUsedDomains = profile.lastUsedDomains.slice(-10);
      }
      
      persistentService.userProfiles.set(formContext.selectedProfileId, profile);
      await persistentService.persistData('userProfiles', 
        Object.fromEntries(persistentService.userProfiles)
      );
    }
  }
}

// Handle document data from web app
async function handleDocumentReceived(data) {
  const enhancedData = {
    ...data,
    timestamp: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days instead of 24 hours
    sessionId: generateSessionId(),
    documentId: generateDocumentId()
  };
  
  // Store in persistent service
  persistentService.documentData = enhancedData;
  
  // Persist to sync storage for cross-device access
  await persistentService.persistData('documentData', enhancedData);
  
  // Auto-create/update profile from document data
  await autoCreateProfile(enhancedData);
  
  // Store in local storage as backup
  chrome.storage.local.set({ documentData: enhancedData });
  
  // Notify all tabs that new document is available
  notifyAllTabs('documentReceived', enhancedData);
  
  console.log('Enhanced document data stored:', enhancedData);
}

// Handle profile sync from web app
async function handleProfileSync(profileData) {
  const profileId = profileData.profileId || generateProfileId();
  
  const enhancedProfile = {
    ...profileData,
    profileId,
    lastSync: Date.now(),
    syncSource: 'webapp',
    version: (persistentService.userProfiles.get(profileId)?.version || 0) + 1
  };
  
  // Update in-memory profiles
  persistentService.userProfiles.set(profileId, enhancedProfile);
  
  // Persist to sync storage
  await persistentService.persistData('userProfiles', 
    Object.fromEntries(persistentService.userProfiles)
  );
  
  console.log('Profile synced:', profileId);
}

// Auto-create profile from document data
async function autoCreateProfile(documentData) {
  if (!documentData.extractedData) return;
  
  const profileId = `auto_${documentData.documentType}_${Date.now()}`;
  const autoProfile = {
    profileId,
    profileType: detectProfileType(documentData),
    profileName: generateProfileName(documentData),
    data: documentData.extractedData,
    autoGenerated: true,
    sourceDocumentId: documentData.documentId,
    confidence: calculateProfileConfidence(documentData.extractedData),
    lastSync: Date.now(),
    version: 1
  };
  
  // Only create if we have enough data and confidence is high
  if (autoProfile.confidence > 0.7) {
    persistentService.userProfiles.set(profileId, autoProfile);
    await persistentService.persistData('userProfiles', 
      Object.fromEntries(persistentService.userProfiles)
    );
    
    console.log('Auto-created profile:', profileId, autoProfile.confidence);
  }
}

function detectProfileType(documentData) {
  const docType = documentData.documentType?.toLowerCase() || '';
  const extractedData = documentData.extractedData || {};
  
  // Check for student indicators
  if (docType.includes('marksheet') || docType.includes('transcript') || 
      extractedData.education || extractedData.studentId) {
    return 'student';
  }
  
  // Check for job seeker indicators
  if (docType.includes('resume') || docType.includes('cv') || 
      extractedData.experience || extractedData.skills) {
    return 'job_seeker';
  }
  
  return 'general';
}

function generateProfileName(documentData) {
  const extractedData = documentData.extractedData || {};
  const name = extractedData.fullName || extractedData.name || 'Anonymous';
  const docType = documentData.documentType || 'Document';
  
  return `${name} (${docType})`;
}

function calculateProfileConfidence(extractedData) {
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

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateDocumentId() {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateProfileId() {
  return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Handle re-scan requests from content script
async function handleRescanRequest(missingFields, tabId) {
  if (!documentData || !documentData.documentText) {
    console.error('No document data available for rescanning');
    return;
  }
  
  try {
    const rescannedData = await performAdvancedExtraction(
      documentData.documentText,
      missingFields
    );
    
    // Send rescanned data back to content script
    chrome.tabs.sendMessage(tabId, {
      action: 'rescanResults',
      data: rescannedData
    });
    
  } catch (error) {
    console.error('Rescan failed:', error);
    chrome.tabs.sendMessage(tabId, {
      action: 'rescanError',
      error: error.message
    });
  }
}

// Advanced extraction for missing fields
async function performAdvancedExtraction(documentText, missingFields) {
  const extractedData = {};
  
  for (const field of missingFields) {
    const value = extractFieldFromText(documentText, field);
    if (value) {
      extractedData[field.name] = {
        value: value,
        confidence: calculateConfidence(value, field.name),
        source: 'rescan'
      };
    }
  }
  
  return extractedData;
}

// Extract specific field from document text
function extractFieldFromText(text, field) {
  const patterns = getFieldPatterns(field.name, field.type);
  
  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      return cleanExtractedValue(match[pattern.group || 1], field.type);
    }
  }
  
  return null;
}

// Get extraction patterns for different field types
function getFieldPatterns(fieldName, fieldType) {
  const patterns = {
    name: [
      { regex: /(?:name|naam)[\s:]*([a-zA-Z\s]{2,30})/i, group: 1 },
      { regex: /^([A-Z][a-z]+\s+[A-Z][a-z]+)/m, group: 1 }
    ],
    email: [
      { regex: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, group: 1 }
    ],
    phone: [
      { regex: /(?:phone|mobile|contact)[\s:]*([+]?[0-9\s\-()]{10,15})/i, group: 1 },
      { regex: /([+]?[0-9]{1,3}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4})/g, group: 1 }
    ],
    address: [
      { regex: /(?:address|addr)[\s:]*([^,\n]{10,100})/i, group: 1 },
      { regex: /(\d+\s+[A-Za-z\s,]+\d{5,6})/g, group: 1 }
    ],
    experience: [
      { regex: /(?:experience|exp)[\s:]*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i, group: 1 },
      { regex: /(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i, group: 1 }
    ],
    education: [
      { regex: /(?:education|degree|qualification)[\s:]*([^,\n]{5,50})/i, group: 1 }
    ],
    skills: [
      { regex: /(?:skills?|technologies?)[\s:]*([^,\n]{10,200})/i, group: 1 }
    ]
  };
  
  return patterns[fieldType] || patterns[fieldName.toLowerCase()] || [];
}

// Clean extracted values
function cleanExtractedValue(value, fieldType) {
  if (!value) return null;
  
  let cleaned = value.trim();
  
  switch (fieldType) {
    case 'phone':
      cleaned = cleaned.replace(/[^\d+\-\s()]/g, '');
      break;
    case 'email':
      cleaned = cleaned.toLowerCase();
      break;
    case 'name':
      cleaned = cleaned.replace(/[^a-zA-Z\s]/g, '').trim();
      // Capitalize first letter of each word
      cleaned = cleaned.replace(/\b\w/g, l => l.toUpperCase());
      break;
  }
  
  return cleaned;
}

// Calculate confidence score
function calculateConfidence(value, fieldName) {
  if (!value) return 0;
  
  let confidence = 0.5;
  
  // Length-based confidence
  if (value.length > 2) confidence += 0.2;
  if (value.length > 5) confidence += 0.1;
  
  // Pattern-based confidence
  if (fieldName.includes('email') && /@.*\./.test(value)) confidence += 0.3;
  if (fieldName.includes('phone') && /\d{10,}/.test(value)) confidence += 0.3;
  if (fieldName.includes('name') && /^[A-Z][a-z]+\s+[A-Z]/.test(value)) confidence += 0.2;
  
  return Math.min(confidence, 1.0);
}

// Notify all tabs about extension events
function notifyAllTabs(action, data) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action, data }).catch(() => {
        // Ignore errors for tabs that don't have content script
      });
    });
  });
}

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Form Filler Assistant installed');
  
  // Clear old data on install
  chrome.storage.local.clear();
});

// Enhanced cleanup and maintenance
setInterval(async () => {
  // Clean up expired document data
  if (persistentService.documentData && 
      persistentService.documentData.expiresAt < Date.now()) {
    persistentService.documentData = null;
    await persistentService.persistData('documentData', null);
    chrome.storage.local.remove('documentData');
    console.log('Document data expired and cleaned up');
  }
  
  // Clean up old auto-generated profiles (older than 30 days)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  let profilesChanged = false;
  
  for (const [profileId, profile] of persistentService.userProfiles.entries()) {
    if (profile.autoGenerated && 
        (profile.lastSync || profile.lastUsed || 0) < thirtyDaysAgo) {
      persistentService.userProfiles.delete(profileId);
      profilesChanged = true;
      console.log('Cleaned up old auto-generated profile:', profileId);
    }
  }
  
  if (profilesChanged) {
    await persistentService.persistData('userProfiles', 
      Object.fromEntries(persistentService.userProfiles)
    );
  }
  
  // Attempt to sync queued data if online
  if (persistentService.isOnline && persistentService.syncQueue.length > 0) {
    await persistentService.processSyncQueue();
  }
}, 60000); // Check every minute

// Periodic profile sync with web app (every 5 minutes when online)
setInterval(async () => {
  if (persistentService.isOnline) {
    try {
      // Check if we have any profiles that need syncing back to web app
      const profiles = Array.from(persistentService.userProfiles.values());
      const recentlyUpdated = profiles.filter(p => 
        (Date.now() - (p.lastSync || 0)) < (5 * 60 * 1000) && // Updated in last 5 minutes
        p.syncSource !== 'webapp' // Not from web app
      );
      
      if (recentlyUpdated.length > 0) {
        console.log('Found profiles to sync back to web app:', recentlyUpdated.length);
        // Note: This would require the web app to listen for extension messages
        // Implementation depends on bidirectional communication setup
      }
    } catch (error) {
      console.error('Profile sync check failed:', error);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes