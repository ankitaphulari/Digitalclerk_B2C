// Working Service Worker for DigitalClerk Chrome Extension
// Manifest V3 compatible

let documentData = null;
let userProfiles = new Map();
let formContext = null;
let syncQueue = [];

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('DigitalClerk Extension installed');
  chrome.storage.local.clear();
  
  // Set up periodic sync alarm
  chrome.alarms.create('syncCheck', { periodInMinutes: 5 });
});

// Initialize on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('DigitalClerk Extension started');
  chrome.alarms.create('syncCheck', { periodInMinutes: 5 });
});

// Handle periodic sync
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncCheck') {
    processSyncQueue();
  }
});

// Listen for messages from popup/content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request.action, 'from', sender.url || 'popup');
  
  handleMessage(request, sender)
    .then(response => sendResponse(response))
    .catch(error => {
      console.error('Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    });
  
  return true; // Keep message channel open for async
});

// Listen for messages from web app
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('External message received:', request.action);
  
  handleExternalMessage(request, sender)
    .then(response => sendResponse(response))
    .catch(error => {
      console.error('External message handler error:', error);
      sendResponse({ success: false, error: error.message });
    });
  
  return true;
});

// Main message handler
async function handleMessage(request, sender) {
  switch (request.action) {
    case 'ping':
      return { success: true, message: 'Service Worker ready' };
    
    case 'getDocumentData':
      return { success: true, data: documentData };
    
    case 'saveDocument':
      documentData = request.data;
      await chrome.storage.local.set({ documentData });
      return { success: true, message: 'Document saved' };
    
    case 'getProfileData':
      const profile = selectBestProfile(request.formType, request.url);
      const allProfiles = Object.fromEntries(userProfiles);
      return { 
        success: true, 
        profile,
        allProfiles
      };
    
    case 'saveProfile':
      const profileId = request.profile.profileId || generateId();
      const profileToSave = {
        ...request.profile,
        profileId,
        createdAt: request.profile.createdAt || Date.now(),
        lastUsed: Date.now()
      };
      userProfiles.set(profileId, profileToSave);
      await chrome.storage.local.set({ 
        userProfiles: Object.fromEntries(userProfiles) 
      });
      return { success: true, profileId };
    
    case 'getAllProfiles':
      return { 
        success: true, 
        profiles: Object.fromEntries(userProfiles),
        count: userProfiles.size
      };
    
    case 'deleteProfile':
      userProfiles.delete(request.profileId);
      await chrome.storage.local.set({ 
        userProfiles: Object.fromEntries(userProfiles) 
      });
      return { success: true };
    
    case 'detectFormType':
      const formType = detectFormType(sender.tab.url, request.formFields);
      formContext = {
        url: sender.tab.url,
        formType,
        timestamp: Date.now()
      };
      return { 
        success: true, 
        formType,
        context: formContext
      };
    
    case 'logActivity':
      console.log('Activity:', request.data);
      return { success: true };
    
    default:
      return { success: false, error: 'Unknown action: ' + request.action };
  }
}

// External message handler (from web app)
async function handleExternalMessage(request, sender) {
  switch (request.action) {
    case 'receiveDocument':
      const enhancedDoc = {
        ...request.data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        documentId: generateId()
      };
      documentData = enhancedDoc;
      await chrome.storage.local.set({ documentData: enhancedDoc });
      
      // Notify all tabs
      notifyAllTabs('documentReceived', enhancedDoc);
      
      // Auto-create profile from document
      await autoCreateProfile(enhancedDoc);
      
      return { success: true, message: 'Document received' };
    
    case 'checkExtension':
      return { 
        success: true, 
        message: 'DigitalClerk Extension is installed',
        version: '1.0.0'
      };
    
    case 'syncProfile':
      const pId = request.data.profileId || generateId();
      const syncedProfile = {
        ...request.data,
        profileId: pId,
        lastSync: Date.now(),
        version: (userProfiles.get(pId)?.version || 0) + 1
      };
      userProfiles.set(pId, syncedProfile);
      await chrome.storage.local.set({ 
        userProfiles: Object.fromEntries(userProfiles) 
      });
      return { success: true, profileId: pId };
    
    case 'getStoredProfiles':
      return { 
        success: true, 
        profiles: Object.fromEntries(userProfiles),
        count: userProfiles.size
      };
    
    default:
      return { success: false, error: 'Unknown external action' };
  }
}

// Profile selection logic
function selectBestProfile(formType, url) {
  const profiles = Array.from(userProfiles.values());
  
  if (profiles.length === 0) {
    return documentData ? { data: documentData } : null;
  }
  
  // Score and sort profiles
  const scored = profiles.map(p => ({
    ...p,
    score: (p.profileType === formType ? 0.5 : 0) + 
           (p.lastUsedUrl === url ? 0.3 : 0) +
           (p.confidence || 0.2)
  }));
  
  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

// Detect form type from URL and fields
function detectFormType(url, formFields = []) {
  const urlLower = url.toLowerCase();
  
  // Quick pattern matching
  if (/aadhaar|aadhar/.test(urlLower)) return 'aadhaar';
  if (/pan/.test(urlLower)) return 'pan';
  if (/passport/.test(urlLower)) return 'passport';
  if (/driving|license/.test(urlLower)) return 'driving_license';
  if (/scholarship/.test(urlLower)) return 'scholarship';
  if (/voter/.test(urlLower)) return 'voter_id';
  
  // Analyze form fields
  const fieldText = formFields
    .map(f => (f.name || f.id || f.placeholder || '').toLowerCase())
    .join(' ');
  
  if (/scholarship|grant|student/.test(fieldText)) return 'scholarship';
  if (/aadhaar|aadhar|uid/.test(fieldText)) return 'aadhaar';
  if (/pan/.test(fieldText)) return 'pan';
  
  return 'general';
}

// Auto-create profile from document
async function autoCreateProfile(documentData) {
  if (!documentData.extractedData) return;
  
  const profileId = `auto_${Date.now()}`;
  const autoProfile = {
    profileId,
    profileName: generateProfileName(documentData),
    profileType: detectProfileTypeFromDoc(documentData),
    data: documentData.extractedData,
    autoGenerated: true,
    confidence: calculateConfidence(documentData.extractedData),
    createdAt: Date.now(),
    lastUsed: Date.now()
  };
  
  if (autoProfile.confidence > 0.6) {
    userProfiles.set(profileId, autoProfile);
    await chrome.storage.local.set({ 
      userProfiles: Object.fromEntries(userProfiles) 
    });
    console.log('Auto-created profile:', profileId);
  }
}

function detectProfileTypeFromDoc(doc) {
  const type = doc.documentType?.toLowerCase() || '';
  if (/marksheet|transcript|student/.test(type)) return 'student';
  if (/resume|cv|job/.test(type)) return 'job_seeker';
  return 'general';
}

function generateProfileName(doc) {
  const data = doc.extractedData || {};
  const name = data.fullName || data.name || 'Profile';
  const type = doc.documentType || '';
  return `${name} (${type})`.trim();
}

function calculateConfidence(data) {
  if (!data || Object.keys(data).length === 0) return 0;
  let score = 0;
  if (data.fullName || data.name) score += 0.3;
  if (data.email) score += 0.2;
  if (data.phone) score += 0.2;
  if (data.address) score += 0.1;
  score += Math.min(0.2, Object.keys(data).length * 0.05);
  return Math.min(1.0, score);
}

// Sync queue processing
async function processSyncQueue() {
  if (syncQueue.length === 0) return;
  
  console.log('Processing sync queue:', syncQueue.length, 'items');
  
  const queue = [...syncQueue];
  syncQueue = [];
  
  for (const item of queue) {
    try {
      await chrome.storage.local.set({ [item.key]: item.data });
      console.log('Synced:', item.key);
    } catch (error) {
      console.error('Sync failed for', item.key, error);
      syncQueue.push(item); // Re-queue
    }
  }
}

// Notify all tabs about events
function notifyAllTabs(action, data) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      try {
        chrome.tabs.sendMessage(tab.id, { action, data });
      } catch (error) {
        // Ignore errors for tabs without content script
      }
    });
  });
}

// Utility functions
function generateId() {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Load stored data on startup
chrome.storage.local.get(['documentData', 'userProfiles'], (result) => {
  if (result.documentData) {
    documentData = result.documentData;
  }
  if (result.userProfiles) {
    userProfiles = new Map(Object.entries(result.userProfiles));
  }
  console.log('Loaded from storage:', {
    hasDocument: !!documentData,
    profileCount: userProfiles.size
  });
});

console.log('DigitalClerk Service Worker loaded');
