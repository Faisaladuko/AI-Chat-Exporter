/**
 * AI Chat Exporter - Content Script
 * This script runs on AI chat platforms to enable message selection and export
 */

console.log('[AI Exporter] Content script loaded on:', window.location.href);

// Initialize parser
let parser = null;
let selectedMessages = new Set();
let currentExportMode = null; // 'word' or 'pdf'

// Default export settings
const defaultSettings = {
  filename: '',
  documentTitle: '',
  pageMargins: 60,
  theme: 'light',
  orientation: 'portrait',
  pageFormat: 'A4',
  enableCompression: false
};

// Current settings (loaded from storage)
let exportSettings = { ...defaultSettings };

/**
 * Load export settings from chrome.storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get('exportSettings');
    if (result.exportSettings) {
      exportSettings = { ...defaultSettings, ...result.exportSettings };
    }
    console.log('[AI Exporter] Settings loaded:', exportSettings);
  } catch (error) {
    console.error('[AI Exporter] Failed to load settings:', error);
  }
}

/**
 * Save export settings to chrome.storage
 */
async function saveSettings(settings) {
  try {
    exportSettings = { ...exportSettings, ...settings };
    await chrome.storage.sync.set({ exportSettings });
    console.log('[AI Exporter] Settings saved:', exportSettings);
  } catch (error) {
    console.error('[AI Exporter] Failed to save settings:', error);
  }
}

// Load settings on script initialization
loadSettings();

// Parser classes will be loaded dynamically
let ChatGPTParser = null;
let GrokParser = null;
let DeepSeekParser = null;
let GeminiParser = null;

// Exporter functions will be loaded dynamically
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
  updateExportButtonVisibility();
}

/**
 * Update export button visibility based on selection
 */
function updateExportButtonVisibility() {
  const exportButton = document.getElementById('ai-exporter-export-btn');
  if (exportButton) {
    if (selectedMessages.size > 0 && currentExportMode) {
      exportButton.style.display = 'flex';
    } else {
      exportButton.style.display = 'none';
    }
  }
}

/**
 * Toggle settings panel
 */
function toggleSettingsPanel() {
  let panel = document.getElementById('ai-exporter-settings-panel');
  
  if (panel) {
    panel.remove();
    return;
  }
  
  // Create settings panel
  panel = document.createElement('div');
  panel.id = 'ai-exporter-settings-panel';
  panel.className = 'ai-exporter-settings-panel';
  
  // Get current date for default filename
  const today = new Date().toISOString().split('T')[0];
  const platformName = window.location.hostname.split('.')[0];
  
  panel.innerHTML = `
    <div class="ai-exporter-settings-header">
      <h3>Export Settings</h3>
      <button class="ai-exporter-settings-close" aria-label="Close settings">×</button>
    </div>
    <div class="ai-exporter-settings-body">
      <div class="ai-exporter-settings-field">
        <label for="ai-exporter-filename">File name:</label>
        <input type="text" id="ai-exporter-filename" value="${exportSettings.filename || `${platformName}-chat.${today}`}" />
      </div>
      
      <div class="ai-exporter-settings-field">
        <label for="ai-exporter-title">Document title:</label>
        <input type="text" id="ai-exporter-title" value="${exportSettings.documentTitle || `${platformName.charAt(0).toUpperCase() + platformName.slice(1)} Chat`}" />
      </div>
      
      <div class="ai-exporter-settings-field">
        <label for="ai-exporter-margins">Page margins (px):</label>
        <input type="number" id="ai-exporter-margins" value="${exportSettings.pageMargins}" min="0" max="200" />
      </div>
      
      <div class="ai-exporter-settings-field">
        <label for="ai-exporter-theme">Theme:</label>
        <select id="ai-exporter-theme">
          <option value="light" ${exportSettings.theme === 'light' ? 'selected' : ''}>Light</option>
          <option value="dark" ${exportSettings.theme === 'dark' ? 'selected' : ''}>Dark</option>
        </select>
      </div>
      
      <div class="ai-exporter-settings-field">
        <label for="ai-exporter-orientation">Orientation:</label>
        <select id="ai-exporter-orientation">
          <option value="portrait" ${exportSettings.orientation === 'portrait' ? 'selected' : ''}>Portrait</option>
          <option value="landscape" ${exportSettings.orientation === 'landscape' ? 'selected' : ''}>Landscape</option>
        </select>
      </div>
      
      <div class="ai-exporter-settings-field">
        <label for="ai-exporter-format">Page format:</label>
        <select id="ai-exporter-format">
          <option value="A4" ${exportSettings.pageFormat === 'A4' ? 'selected' : ''}>A4</option>
          <option value="Letter" ${exportSettings.pageFormat === 'Letter' ? 'selected' : ''}>Letter</option>
          <option value="Legal" ${exportSettings.pageFormat === 'Legal' ? 'selected' : ''}>Legal</option>
        </select>
      </div>
      
      <div class="ai-exporter-settings-field">
        <label>
          <input type="checkbox" id="ai-exporter-compression" ${exportSettings.enableCompression ? 'checked' : ''} />
          Enable PDF compression
        </label>
      </div>
    </div>
    <div class="ai-exporter-settings-footer">
      <button class="ai-exporter-settings-save">Save Settings</button>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Add event listeners
  panel.querySelector('.ai-exporter-settings-close').addEventListener('click', () => {
    panel.remove();
  });
  
  panel.querySelector('.ai-exporter-settings-save').addEventListener('click', async () => {
    const newSettings = {
      filename: document.getElementById('ai-exporter-filename').value,
      documentTitle: document.getElementById('ai-exporter-title').value,
      pageMargins: parseInt(document.getElementById('ai-exporter-margins').value),
      theme: document.getElementById('ai-exporter-theme').value,
      orientation: document.getElementById('ai-exporter-orientation').value,
      pageFormat: document.getElementById('ai-exporter-format').value,
      enableCompression: document.getElementById('ai-exporter-compression').checked
    };
    
    await saveSettings(newSettings);
    showBanner('✓ Settings saved successfully!', 2000);
    panel.remove();
  });
  
  // Close on outside click
  panel.addEventListener('click', (e) => {
    if (e.target === panel) {
      panel.remove();
    }
  });
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
  if (!exportToDocx || !exportToPDF) {
    await loadExporters();
  }
  
  // Use custom title from settings if available
  const exportTitle = exportSettings.documentTitle || title;
  
  const exportData = {
    title: exportTitle,
    messages: messages,
    exportDate: new Date().toISOString(),
    messageCount: messages.length,
    platform: window.location.hostname,
    settings: exportSettings
  };
  
  switch (format.toLowerCase()) {
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
 * Create floating button to open extension
 */
function createFloatingButton() {
  // Check if button container already exists
  if (document.getElementById('ai-exporter-button-container')) {
    console.log('[AI Exporter] Button container already exists');
    return;
  }

  const hostname = window.location.hostname;
  let targetElement = null;
  let buttonClass = 'ai-exporter-action-btn';

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
  } else if (hostname.includes('deepseek.com')) {
    // DeepSeek: Try to find header/toolbar area
    const deepseekSelectors = [
      '[class*="header"]',
      '[class*="toolbar"]',
      '[class*="top-bar"]',
      'header'
    ];
    
    for (const selector of deepseekSelectors) {
      targetElement = document.querySelector(selector);
      if (targetElement) {
        console.log('[AI Exporter] DeepSeek - Found header with selector:', selector);
        break;
      }
    }
    
    buttonClass += ' ai-exporter-deepseek-btn';
    console.log('[AI Exporter] DeepSeek - Target element found:', !!targetElement);
  }

  // Create button container for the 3 buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'ai-exporter-button-container';
  buttonContainer.className = 'ai-exporter-button-container';

  // Word Export Button
  const wordButton = document.createElement('button');
  wordButton.id = 'ai-exporter-word-btn';
  wordButton.className = `${buttonClass} ai-exporter-action-btn`;
  wordButton.innerHTML = `
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
      <path d="M6.5 8l2 8 2-5 2 5 2-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="7" y1="18" x2="17" y2="18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  `;
  wordButton.title = 'Export to Word';
  wordButton.setAttribute('aria-label', 'Export to Word');
  
  wordButton.addEventListener('click', async () => {
    currentExportMode = 'word';
    await window.enableChatSelection();
    updateExportButtonVisibility();
  });

  // PDF Export Button
  const pdfButton = document.createElement('button');
  pdfButton.id = 'ai-exporter-pdf-btn';
  pdfButton.className = `${buttonClass} ai-exporter-action-btn`;
  pdfButton.innerHTML = `
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
      <text x="12" y="15" text-anchor="middle" font-size="9" font-weight="bold" fill="currentColor" font-family="Arial, sans-serif">PDF</text>
    </svg>
  `;
  pdfButton.title = 'Export to PDF';
  pdfButton.setAttribute('aria-label', 'Export to PDF');
  
  pdfButton.addEventListener('click', async () => {
    currentExportMode = 'pdf';
    await window.enableChatSelection();
    updateExportButtonVisibility();
  });

  // Settings Button
  const settingsButton = document.createElement('button');
  settingsButton.id = 'ai-exporter-settings-btn';
  settingsButton.className = `${buttonClass} ai-exporter-action-btn`;
  settingsButton.innerHTML = `
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
    </svg>
  `;
  settingsButton.title = 'Export Settings';
  settingsButton.setAttribute('aria-label', 'Export Settings');
  
  settingsButton.addEventListener('click', () => {
    toggleSettingsPanel();
  });

  // Add buttons to container
  buttonContainer.appendChild(wordButton);
  buttonContainer.appendChild(pdfButton);
  buttonContainer.appendChild(settingsButton);

  // Export button (shown when messages are selected)
  const exportButton = document.createElement('button');
  exportButton.id = 'ai-exporter-export-btn';
  exportButton.className = `${buttonClass} ai-exporter-export-btn`;
  exportButton.style.display = 'none';
  exportButton.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span style="margin-left: 4px; font-size: 12px;">Export</span>
  `;
  exportButton.title = 'Export Selected Messages';
  exportButton.setAttribute('aria-label', 'Export Selected Messages');
  
  exportButton.addEventListener('click', async () => {
    if (!currentExportMode) {
      alert('Please select Word or PDF export first');
      return;
    }
    await window.exportSelectedChats(currentExportMode === 'word' ? 'docx' : 'pdf');
  });

  buttonContainer.appendChild(exportButton);

  if (targetElement) {
    // Platform-specific insertion
    if (hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com')) {
      const shareButton = targetElement.querySelector('[data-testid="share-chat-button"]');
      if (shareButton) {
        targetElement.insertBefore(buttonContainer, shareButton);
        console.log('[AI Exporter] Button container inserted before share button');
      } else {
        targetElement.appendChild(buttonContainer);
        console.log('[AI Exporter] Share button not found, appended to parent');
      }
    } else if (hostname.includes('gemini.google.com')) {
      // For Gemini, find the first buttons-container and insert before it
      const firstButtonsContainer = targetElement.querySelector('.buttons-container');
      if (firstButtonsContainer) {
        targetElement.insertBefore(buttonContainer, firstButtonsContainer);
        console.log('[AI Exporter] Gemini - Button container inserted before buttons-container');
      } else {
        targetElement.insertBefore(buttonContainer, targetElement.firstElementChild);
        console.log('[AI Exporter] Gemini - Button container inserted as first child');
      }
    } else {
      // For other platforms, insert before the last child
      if (targetElement.lastElementChild) {
        targetElement.insertBefore(buttonContainer, targetElement.lastElementChild);
        console.log('[AI Exporter] Button container inserted before last child');
      } else {
        targetElement.appendChild(buttonContainer);
        console.log('[AI Exporter] Button container appended to target');
      }
    }
  } else {
    // Fallback: add to body with fixed position
    document.body.appendChild(buttonContainer);
    console.log('[AI Exporter] Button container added to body (fallback mode)');
  }
}

// Initialize when content script loads
console.log('[AI Exporter] Content script initialization complete');

// Create floating button with retries to ensure DOM is ready
let buttonAttempts = 0;
const maxAttempts = 5;

function tryCreateButton() {
  createFloatingButton();
  
  // Check if button container was created successfully
  if (!document.getElementById('ai-exporter-button-container') && buttonAttempts < maxAttempts) {
    buttonAttempts++;
    console.log(`[AI Exporter] Retrying button creation (attempt ${buttonAttempts}/${maxAttempts})`);
    setTimeout(tryCreateButton, 1000);
  } else if (document.getElementById('ai-exporter-button-container')) {
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
    
    // Remove existing button container if present
    const existingContainer = document.getElementById('ai-exporter-button-container');
    if (existingContainer) {
      existingContainer.remove();
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