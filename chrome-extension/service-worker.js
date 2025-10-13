// Modern Service Worker for DigitalClerk Extension
// Replaces background.js with modern Chrome Extension Manifest V3 patterns

import { PersistentFormFillerService } from './persistent-service.js';

// Service worker lifecycle
self.addEventListener('install', (event) => {
  console.log('DigitalClerk Service Worker installing...');
  event.waitUntil(
    caches.open('digitalclerk-v1').then((cache) => {
      return cache.addAll([
        'popup.html',
        'popup.css',
        'popup.js',
        'content.js',
        'content.css'
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('DigitalClerk Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== 'digitalclerk-v1') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Initialize persistent service
let persistentService;

chrome.runtime.onStartup.addListener(() => {
  initializePersistentService();
});

chrome.runtime.onInstalled.addListener(() => {
  initializePersistentService();
});

async function initializePersistentService() {
  try {
    persistentService = new PersistentFormFillerService();
    await persistentService.initialize();
    console.log('Persistent service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize persistent service:', error);
  }
}

// Modern message handling with error boundaries
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  handleExternalMessage(request, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('External message handler error:', error);
      sendResponse({ success: false, error: error.message });
    });
  return true; // Keep the message channel open for async response
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleInternalMessage(request, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('Internal message handler error:', error);
      sendResponse({ success: false, error: error.message });
    });
  return true;
});

// Enhanced external message handling
async function handleExternalMessage(request, sender) {
  if (!persistentService) {
    await initializePersistentService();
  }

  switch (request.action) {
    case 'receiveDocument':
      return await persistentService.handleDocumentReceived(request.data);
    
    case 'checkExtension':
      return { 
        success: true, 
        message: 'DigitalClerk Extension is installed',
        version: chrome.runtime.getManifest().version
      };
    
    case 'syncProfile':
      return await persistentService.handleProfileSync(request.data);
    
    case 'getStoredProfiles':
      const profiles = await persistentService.getStoredProfiles();
      return { 
        success: true, 
        profiles,
        count: Object.keys(profiles).length
      };
    
    default:
      throw new Error(`Unknown external action: ${request.action}`);
  }
}

// Enhanced internal message handling
async function handleInternalMessage(request, sender) {
  if (!persistentService) {
    await initializePersistentService();
  }

  switch (request.action) {
    case 'getDocumentData':
      const documentData = await persistentService.getDocumentData();
      return { success: true, data: documentData };
    
    case 'getProfileData':
      return await persistentService.getProfileData(request.formType, request.url);
    
    case 'detectFormType':
      return await persistentService.detectFormType(request.formFields, sender.tab);
    
    case 'performRescan':
      return await persistentService.performRescan(request.missingFields, sender.tab.id);
    
    case 'logActivity':
      console.log('Form filling activity:', request.data);
      return { success: true };
    
    case 'syncFormContext':
      return await persistentService.syncFormContext(request.formContext, sender.tab);
    
    default:
      throw new Error(`Unknown internal action: ${request.action}`);
  }
}

// Enhanced tab management
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    if (persistentService) {
      await persistentService.onTabActivated(activeInfo);
    }
  } catch (error) {
    console.error('Tab activation handler error:', error);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    if (changeInfo.status === 'complete' && persistentService) {
      await persistentService.onTabUpdated(tabId, tab);
    }
  } catch (error) {
    console.error('Tab update handler error:', error);
  }
});

// Network monitoring for offline support
chrome.webNavigation.onCompleted.addListener(async (details) => {
  try {
    if (details.frameId === 0 && persistentService) {
      await persistentService.checkNetworkAndSync();
    }
  } catch (error) {
    console.error('Navigation handler error:', error);
  }
});

// Alarm for periodic sync
chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    if (alarm.name === 'periodicSync' && persistentService) {
      await persistentService.performPeriodicSync();
    }
  } catch (error) {
    console.error('Alarm handler error:', error);
  }
});

// Set up periodic sync
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('periodicSync', { 
    delayInMinutes: 5, 
    periodInMinutes: 15 
  });
});

// Handle unhandled errors
self.addEventListener('error', (event) => {
  console.error('Service Worker unhandled error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled promise rejection:', event.reason);
});