/**
 * AI Chat Exporter - Background Service Worker
 * Handles download requests and extension lifecycle
 */

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[AI Exporter Background] Received message:', msg.type || msg.action);
  
  if (msg.type === "EXPORT_CHAT") {
    // Handle file download
    chrome.downloads.download({
      url: msg.fileUrl,
      filename: msg.filename,
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('[AI Exporter Background] Download failed:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('[AI Exporter Background] Download started:', downloadId);
        sendResponse({ success: true, downloadId: downloadId });
      }
    });
    
    return true; // Keep message channel open for async response
  } else if (msg.action === "openPopup") {
    // Open the popup window
    chrome.action.openPopup();
    sendResponse({ success: true });
    return true;
  }
});

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[AI Exporter Background] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    console.log('[AI Exporter Background] Welcome! Extension installed successfully.');
  } else if (details.reason === 'update') {
    console.log('[AI Exporter Background] Extension updated to version:', chrome.runtime.getManifest().version);
  }
});

// Log extension startup
console.log('[AI Exporter Background] Service worker initialized');