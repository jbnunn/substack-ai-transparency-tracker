// Substack AI Transparency Tracker - Background Script

// Create context menu items when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ai-assisted',
    title: 'Mark as AI Assisted',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'human-written',
    title: 'Mark as Human Written',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.selectionText && tab.url.includes('substack.com')) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'addAnnotation',
      text: info.selectionText,
      type: info.menuItemId
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    // Store updated stats
    chrome.storage.local.set({ currentStats: request.stats });
  }
  
  if (request.action === 'getStats') {
    // Return current stats
    chrome.storage.local.get(['currentStats'], (result) => {
      sendResponse({ stats: result.currentStats });
    });
    return true; // Keep message channel open for async response
  }
}); 