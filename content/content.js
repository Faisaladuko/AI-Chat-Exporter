/**
 * AI Chat Exporter - Content Script
 * This script runs on AI chat platforms to enable message selection and export
 */

console.log('[AI Exporter] Content script loaded on:', window.location.href);

// Initialize parser
let parser = null;
let selectedMessages = new Set();

// Parser classes will be loaded dynamically
let ChatGPTParser = null;
let GrokParser = null;
let DeepSeekParser = null;
let GeminiParser = null;

// Exporter functions will be loaded dynamically
let exportToMarkdown = null;
let exportToDocx = null;
let exportToPDF = null;

/**
 * Load parser modules dynamically
 */
async function loadParsers() {
  // Load ChatGPT parser
  try {
    const chatgptUrl = chrome.runtime.getURL('content/parsers/ChatGPTParser.js');
    console.log('[AI Exporter] Loading ChatGPTParser from:', chatgptUrl);
    const chatgptModule = await import(chatgptUrl);
    ChatGPTParser = chatgptModule.ChatGPTParser;
    console.log('[AI Exporter] ChatGPTParser loaded successfully');
  } catch (error) {
    console.error('[AI Exporter] Failed to load ChatGPTParser:', error);
  }
  
  // Load Grok parser
  try {
    const grokUrl = chrome.runtime.getURL('content/parsers/GrokParser.js');
    console.log('[AI Exporter] Loading GrokParser from:', grokUrl);
    const grokModule = await import(grokUrl);
    GrokParser = grokModule.GrokParser;
    console.log('[AI Exporter] GrokParser loaded successfully');
  } catch (error) {
    console.error('[AI Exporter] Failed to load GrokParser:', error);
  }
  
  // Load DeepSeek parser
  try {
    const deepseekUrl = chrome.runtime.getURL('content/parsers/DeepSeekParser.js');
    console.log('[AI Exporter] Loading DeepSeekParser from:', deepseekUrl);
    const deepseekModule = await import(deepseekUrl);
    DeepSeekParser = deepseekModule.DeepSeekParser;
    console.log('[AI Exporter] DeepSeekParser loaded successfully');
  } catch (error) {
    console.error('[AI Exporter] Failed to load DeepSeekParser:', error);
  }
  
  // Load Gemini parser
  try {
    const geminiUrl = chrome.runtime.getURL('content/parsers/GeminiParser.js');
    console.log('[AI Exporter] Loading GeminiParser from:', geminiUrl);
    const geminiModule = await import(geminiUrl);
    GeminiParser = geminiModule.GeminiParser;
    console.log('[AI Exporter] GeminiParser loaded successfully');
  } catch (error) {
    console.error('[AI Exporter] Failed to load GeminiParser:', error);
  }
  
  console.log('[AI Exporter] Parser loading complete. Available parsers:', {
    ChatGPTParser: !!ChatGPTParser,
    GrokParser: !!GrokParser,
    DeepSeekParser: !!DeepSeekParser,
    GeminiParser: !!GeminiParser
  });
}

/**
 * Load exporter modules dynamically
 */
async function loadExporters() {
  try {
    const markdownModule = await import(chrome.runtime.getURL('content/exporters/MarkdownExporter.js'));
    exportToMarkdown = markdownModule.exportToMarkdown;
    
    const docxModule = await import(chrome.runtime.getURL('content/exporters/DOCXExporter.js'));
    exportToDocx = docxModule.exportToDocx;
    
    const pdfModule = await import(chrome.runtime.getURL('content/exporters/PDFExporter.js'));
    exportToPDF = pdfModule.exportToPDF;
    
    console.log('[AI Exporter] Exporters loaded successfully');
  } catch (error) {
    console.error('[AI Exporter] Failed to load exporters:', error);
  }
}

/**
 * Detect and initialize the appropriate parser for the current platform
 */
async function initializeParser() {
  // Load parsers if not already loaded
  const hostname = window.location.hostname;
  const needsChatGPT = hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com');
  const needsGrok = hostname.includes('grok.com');
  const needsDeepSeek = hostname.includes('deepseek.com');
  const needsGemini = hostname.includes('gemini.google.com');
  
  if ((needsChatGPT && !ChatGPTParser) || (needsGrok && !GrokParser) || (needsDeepSeek && !DeepSeekParser) || (needsGemini && !GeminiParser)) {
    await loadParsers();
  }
  
  if (hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com')) {
    if (!ChatGPTParser) {
      console.error('[AI Exporter] ChatGPTParser not loaded - please reload the extension');
      return null;
    }
    parser = new ChatGPTParser();
    console.log('[AI Exporter] ChatGPT parser initialized');
  } else if (hostname.includes('grok.com')) {
    if (!GrokParser) {
      console.error('[AI Exporter] GrokParser not loaded - please reload the extension');
      return null;
    }
    parser = new GrokParser();
    console.log('[AI Exporter] Grok parser initialized');
  } else if (hostname.includes('deepseek.com')) {
    if (!DeepSeekParser) {
      console.error('[AI Exporter] DeepSeekParser not loaded - please reload the extension');
      return null;
    }
    parser = new DeepSeekParser();
    console.log('[AI Exporter] DeepSeek parser initialized');
  } else if (hostname.includes('gemini.google.com')) {
    if (!GeminiParser) {
      console.error('[AI Exporter] GeminiParser not loaded - please reload the extension');
      return null;
    }
    parser = new GeminiParser();
    console.log('[AI Exporter] Gemini parser initialized');
  } else {
    console.log('[AI Exporter] No parser available for this platform:', hostname);
  }
  
  return parser;
}

/**
 * Enable chat selection mode
 */
window.enableChatSelection = async function() {
  if (!parser) {
    parser = await initializeParser();
  }
  
  if (!parser) {
    alert('AI Chat Exporter: This platform is not supported yet.');
    return;
  }
  
  const messages = parser.getMessages();
  
  if (messages.length === 0) {
    alert('No messages found on this page. Make sure you are on a chat conversation page.');
    return;
  }
  
  // Add selection functionality to each message
  messages.forEach((message) => {
    const element = message.element;
    if (!element) return;
    
    element.classList.add('ai-exporter-selectable');
    element.setAttribute('data-message-id', message.id);
    
    // Remove existing listener if any
    element.removeEventListener('click', handleMessageClick);
    element.addEventListener('click', handleMessageClick);
    
    // Add a selection indicator
    if (!element.querySelector('.ai-exporter-checkbox')) {
      const checkbox = document.createElement('div');
      checkbox.className = 'ai-exporter-checkbox';
      checkbox.innerHTML = '☐';
      element.style.position = 'relative';
      element.insertBefore(checkbox, element.firstChild);
    }
  });
  
  // Show info banner
  showBanner(`Selection mode enabled. Click messages to select (${messages.length} messages found)`);
  
  console.log(`[AI Exporter] ${messages.length} messages ready for selection`);
};

/**
 * Handle message click for selection
 */
function handleMessageClick(event) {
  // Don't interfere with code copy buttons or links
  if (event.target.closest('button') || event.target.closest('a')) {
    return;
  }
  
  const messageElement = event.currentTarget;
  const messageId = messageElement.getAttribute('data-message-id');
  
  if (selectedMessages.has(messageId)) {
    selectedMessages.delete(messageId);
    messageElement.classList.remove('ai-exporter-selected');
    const checkbox = messageElement.querySelector('.ai-exporter-checkbox');
    if (checkbox) checkbox.innerHTML = '☐';
  } else {
    selectedMessages.add(messageId);
    messageElement.classList.add('ai-exporter-selected');
    const checkbox = messageElement.querySelector('.ai-exporter-checkbox');
    if (checkbox) checkbox.innerHTML = '☑';
  }
  
  updateBanner();
}

/**
 * Get selection count
 */
window.getSelectionCount = function() {
  return selectedMessages.size;
}

/**
 * Export selected chats
 */
window.exportSelectedChats = async function(format) {
  if (!parser) {
    alert('Please enable selection mode first.');
    return;
  }
  
  // If no messages selected, export all
  if (selectedMessages.size === 0) {
    const confirmAll = confirm('No messages selected. Export entire conversation?');
    if (!confirmAll) return;
    
    const allMessages = parser.getMessages();
    allMessages.forEach(msg => selectedMessages.add(msg.id));
  }
  
  // Get all messages and filter selected ones
  const allMessages = parser.getMessages();
  const messagesToExport = allMessages.filter(msg => selectedMessages.has(msg.id));
  
  if (messagesToExport.length === 0) {
    alert('No messages to export.');
    return;
  }
  
  try {
    // Get conversation title
    const title = parser.getConversationTitle();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // Determine file extension based on format
    let fileExtension = format;
    if (format.toLowerCase() === 'docx' || format.toLowerCase() === 'doc') {
      fileExtension = 'doc'; // HTML that Word can open
    } else if (format.toLowerCase() === 'pdf') {
      fileExtension = 'html'; // Print-ready HTML for PDF
    }
    
    const filename = `${sanitizeFilename(title)}_${timestamp}.${fileExtension}`;
    
    showBanner(`Exporting ${messagesToExport.length} messages as ${format.toUpperCase()}...`);
    
    // Export using the appropriate format
    const blob = await window.exportAs(format, messagesToExport, title);
    
    // Download the file
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showBanner(`✓ Exported ${messagesToExport.length} messages successfully!`, 3000);
    
    console.log(`[AI Exporter] Exported ${messagesToExport.length} messages as ${filename}`);
  } catch (error) {
    console.error('[AI Exporter] Export failed:', error);
    alert(`Export failed: ${error.message}`);
  }
};

/**
 * Clear all selections
 */
window.clearSelection = function() {
  selectedMessages.clear();
  document.querySelectorAll('.ai-exporter-selected').forEach(el => {
    el.classList.remove('ai-exporter-selected');
    const checkbox = el.querySelector('.ai-exporter-checkbox');
    if (checkbox) checkbox.innerHTML = '☐';
  });
  updateBanner();
};

/**
 * Select all messages
 */
window.selectAllMessages = function() {
  if (!parser) return;
  
  const messages = parser.getMessages();
  messages.forEach(msg => {
    selectedMessages.add(msg.id);
    if (msg.element) {
      msg.element.classList.add('ai-exporter-selected');
      const checkbox = msg.element.querySelector('.ai-exporter-checkbox');
      if (checkbox) checkbox.innerHTML = '☑';
    }
  });
  updateBanner();
};

/**
 * Show banner notification
 */
function showBanner(message, duration = null) {
  let banner = document.getElementById('ai-exporter-banner');
  
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'ai-exporter-banner';
    banner.className = 'ai-exporter-banner';
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'ai-exporter-banner-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => {
      banner.style.display = 'none';
    };
    
    banner.appendChild(closeBtn);
    document.body.appendChild(banner);
  }
  
  // Update message (keep close button)
  const closeBtn = banner.querySelector('.ai-exporter-banner-close');
  banner.textContent = message;
  if (closeBtn) {
    banner.appendChild(closeBtn);
  }
  
  banner.style.display = 'block';
  
  if (duration) {
    setTimeout(() => {
      banner.style.display = 'none';
    }, duration);
  }
}

/**
 * Update banner with selection count
 */
function updateBanner() {
  const count = selectedMessages.size;
  showBanner(`${count} message${count !== 1 ? 's' : ''} selected`);
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

/**
 * Main export function - routes to appropriate format
 */
window.exportAs = async function(format, messages, title = 'AI Conversation') {
  console.log(`[AI Exporter] Exporting ${messages.length} messages as ${format}`);
  
  // Load exporters if not already loaded
  if (!exportToMarkdown || !exportToDocx || !exportToPDF) {
    await loadExporters();
  }
  
  const exportData = {
    title: title,
    messages: messages,
    exportDate: new Date().toISOString(),
    messageCount: messages.length,
    platform: window.location.hostname
  };
  
  switch (format.toLowerCase()) {
    case "markdown":
    case "md":
      return exportToMarkdown(exportData);
    case "docx":
    case "doc":
      return exportToDocx(exportData);
    case "pdf":
      return exportToPDF(exportData);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};

/**
 * Helper: Convert HTML to plain text
 */
function htmlToText(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  temp.querySelectorAll('script, style').forEach(el => el.remove());
  return temp.textContent.trim();
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Helper: Sanitize filename
 */
function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9_\-\.]/gi, '_').slice(0, 100);
}

// All exporter functions moved to separate modules
// - MarkdownExporter.js
// - DOCXExporter.js  
// - PDFExporter.js

/**
 * Create floating button to open extension
 */
function createFloatingButton() {
  // Check if button already exists
  if (document.getElementById('ai-exporter-float-btn')) {
    console.log('[AI Exporter] Button already exists');
    return;
  }

  const hostname = window.location.hostname;
  let targetElement = null;
  let buttonClass = 'ai-exporter-float-btn';

  console.log('[AI Exporter] Attempting to create button on:', hostname);

  // Platform-specific button injection
  if (hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com')) {
    // ChatGPT: Find the share button's parent container
    const shareButton = document.querySelector('[data-testid="share-chat-button"]');
    if (shareButton) {
      targetElement = shareButton.parentElement;
      console.log('[AI Exporter] ChatGPT - Found share button parent:', !!targetElement);
    } else {
      targetElement = document.querySelector('#conversation-header-actions');
      console.log('[AI Exporter] ChatGPT - Using fallback selector:', !!targetElement);
    }
    buttonClass += ' ai-exporter-chatgpt-btn';
  } else if (hostname.includes('grok.com')) {
    // Grok: Insert in the header beside share button
    targetElement = document.querySelector('.absolute.flex.flex-row.items-center.gap-0\\.5');
    buttonClass += ' ai-exporter-grok-btn';
    console.log('[AI Exporter] Grok - Target element found:', !!targetElement);
  } else if (hostname.includes('gemini.google.com')) {
    // Gemini: Target the right-section of top-bar-actions
    targetElement = document.querySelector('top-bar-actions .right-section');
    
    if (!targetElement) {
      // Fallback selectors
      const headerSelectors = [
        '.top-bar-actions .right-section',
        '[class*="top-bar"] [class*="right"]',
        '[class*="header-actions"]',
        '[class*="conversation-actions"]'
      ];
      
      for (const selector of headerSelectors) {
        targetElement = document.querySelector(selector);
        if (targetElement) {
          console.log('[AI Exporter] Gemini - Found header with selector:', selector);
          break;
        }
      }
    }
    
    buttonClass += ' ai-exporter-gemini-btn';
    console.log('[AI Exporter] Gemini - Target element found:', !!targetElement);
  }

  const button = document.createElement('button');
  button.id = 'ai-exporter-float-btn';
  button.className = buttonClass;
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  button.title = 'Export Chat';
  button.setAttribute('aria-label', 'Export chat');
  
  button.addEventListener('click', async () => {
    // If messages are already selected, open the popup to choose export format
    if (selectedMessages.size > 0) {
      // Send message to background script to open popup
      chrome.runtime.sendMessage({ action: 'openPopup' });
    } else {
      // Enable selection mode first
      await window.enableChatSelection();
    }
  });

  if (targetElement) {
    // Platform-specific insertion
    if (hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com')) {
      const shareButton = targetElement.querySelector('[data-testid="share-chat-button"]');
      if (shareButton) {
        targetElement.insertBefore(button, shareButton);
        console.log('[AI Exporter] Button inserted before share button');
      } else {
        targetElement.appendChild(button);
        console.log('[AI Exporter] Share button not found, appended to parent');
      }
    } else if (hostname.includes('gemini.google.com')) {
      // For Gemini, find the first buttons-container and insert before it
      const firstButtonsContainer = targetElement.querySelector('.buttons-container');
      if (firstButtonsContainer) {
        targetElement.insertBefore(button, firstButtonsContainer);
        console.log('[AI Exporter] Gemini - Button inserted before buttons-container');
      } else {
        targetElement.insertBefore(button, targetElement.firstElementChild);
        console.log('[AI Exporter] Gemini - Button inserted as first child');
      }
    } else {
      // For other platforms, insert before the last child
      if (targetElement.lastElementChild) {
        targetElement.insertBefore(button, targetElement.lastElementChild);
        console.log('[AI Exporter] Button inserted before last child');
      } else {
        targetElement.appendChild(button);
        console.log('[AI Exporter] Button appended to target');
      }
    }
  } else {
    // Fallback: add to body with fixed position
    document.body.appendChild(button);
    console.log('[AI Exporter] Button added to body (fallback mode)');
  }
}

// Initialize when content script loads
console.log('[AI Exporter] Content script initialization complete');

// Create floating button with retries to ensure DOM is ready
let buttonAttempts = 0;
const maxAttempts = 5;

function tryCreateButton() {
  createFloatingButton();
  
  // Check if button was created successfully
  if (!document.getElementById('ai-exporter-float-btn') && buttonAttempts < maxAttempts) {
    buttonAttempts++;
    console.log(`[AI Exporter] Retrying button creation (attempt ${buttonAttempts}/${maxAttempts})`);
    setTimeout(tryCreateButton, 1000);
  } else if (document.getElementById('ai-exporter-float-btn')) {
    // Button created successfully, reset attempts for future recreations
    buttonAttempts = 0;
  }
}

// Start trying to create button
setTimeout(tryCreateButton, 1000);

// Watch for navigation changes (for single-page apps)
const urlObserver = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== urlObserver.lastUrl) {
    console.log('[AI Exporter] Navigation detected:', currentUrl);
    urlObserver.lastUrl = currentUrl;
    
    // Clear selections when navigating to new chat
    selectedMessages.clear();
    
    // Remove selection UI elements
    document.querySelectorAll('.ai-exporter-selectable').forEach(el => {
      el.classList.remove('ai-exporter-selectable', 'ai-exporter-selected');
      const checkbox = el.querySelector('.ai-exporter-checkbox');
      if (checkbox) {
        checkbox.remove();
      }
    });
    
    // Hide the banner
    const banner = document.getElementById('ai-exporter-banner');
    if (banner) {
      banner.style.display = 'none';
    }
    
    // Remove existing button if present
    const existingButton = document.getElementById('ai-exporter-float-btn');
    if (existingButton) {
      existingButton.remove();
    }
    
    // Recreate button for new page
    buttonAttempts = 0;
    setTimeout(tryCreateButton, 500);
  }
});

// Store initial URL
urlObserver.lastUrl = window.location.href;

// Start observing
urlObserver.observe(document.body, {
  childList: true,
  subtree: true
});