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
 * Toggle more options dropdown
 */
function toggleMoreOptionsDropdown() {
  let dropdown = document.getElementById('ai-exporter-more-dropdown');
  
  if (dropdown) {
    dropdown.remove();
    return;
  }
  
  // Create dropdown menu
  dropdown = document.createElement('div');
  dropdown.id = 'ai-exporter-more-dropdown';
  dropdown.className = 'ai-exporter-more-dropdown';
  
  dropdown.innerHTML = `
    <div class="ai-exporter-dropdown-item" data-format="json">
      <svg fill="#504e4e" height="20px" width="20px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" 
      xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 58 58" xml:space="preserve" stroke="#504e4e" stroke-width="0.00058">
      <g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
      <g id="SVGRepo_iconCarrier"> <g> <path d="M50.949,12.187l-1.361-1.361l-9.504-9.505c-0.001-0.001-0.001-0.001-0.002-0.001l-0.77-0.771 C38.957,0.195,38.486,0,37.985,0H8.963C7.776,0,6.5,0.916,6.5,2.926V39v16.537V56c0,0.837,0.841,1.652,1.836,1.909 c0.051,0.014,0.1,0.033,0.152,0.043C8.644,57.983,8.803,58,8.963,58h40.074c0.16,0,0.319-0.017,0.475-0.048 c0.052-0.01,0.101-0.029,0.152-0.043C50.659,57.652,51.5,56.837,51.5,56v-0.463V39V13.978C51.5,13.211,51.407,12.644,50.949,12.187 z M39.5,3.565L47.935,12H39.5V3.565z M8.963,56c-0.071,0-0.135-0.025-0.198-0.049C8.61,55.877,8.5,55.721,8.5,55.537V41h41v14.537 c0,0.184-0.11,0.34-0.265,0.414C49.172,55.975,49.108,56,49.037,56H8.963z M8.5,39V2.926C8.5,2.709,8.533,2,8.963,2h28.595 C37.525,2.126,37.5,2.256,37.5,2.391V13.78c-0.532-0.48-1.229-0.78-2-0.78c-0.553,0-1,0.448-1,1s0.447,1,1,1c0.552,0,1,0.449,1,1v4 c0,1.2,0.542,2.266,1.382,3c-0.84,0.734-1.382,1.8-1.382,3v4c0,0.551-0.448,1-1,1c-0.553,0-1,0.448-1,1s0.447,1,1,1 c1.654,0,3-1.346,3-3v-4c0-1.103,0.897-2,2-2c0.553,0,1-0.448,1-1s-0.447-1-1-1c-1.103,0-2-0.897-2-2v-4 c0-0.771-0.301-1.468-0.78-2h11.389c0.135,0,0.265-0.025,0.391-0.058c0,0.015,0.001,0.021,0.001,0.036V39H8.5z"></path> <path d="M16.354,51.43c-0.019,0.446-0.171,0.764-0.458,0.95s-0.672,0.28-1.155,0.28c-0.191,0-0.396-0.022-0.615-0.068 s-0.429-0.098-0.629-0.157s-0.385-0.123-0.554-0.191s-0.299-0.135-0.39-0.198l-0.697,1.107c0.183,0.137,0.405,0.26,0.67,0.369 s0.54,0.207,0.827,0.294s0.565,0.15,0.834,0.191s0.504,0.062,0.704,0.062c0.401,0,0.791-0.039,1.169-0.116 c0.378-0.077,0.713-0.214,1.005-0.41s0.524-0.456,0.697-0.779s0.26-0.723,0.26-1.196v-7.848h-1.668V51.43z"></path> <path d="M25.083,49.064c-0.314-0.228-0.654-0.422-1.019-0.581s-0.702-0.323-1.012-0.492s-0.569-0.364-0.779-0.588 s-0.314-0.518-0.314-0.882c0-0.146,0.036-0.299,0.109-0.458s0.173-0.303,0.301-0.431s0.273-0.234,0.438-0.321 s0.337-0.139,0.52-0.157c0.328-0.027,0.597-0.032,0.807-0.014s0.378,0.05,0.506,0.096s0.226,0.091,0.294,0.137 s0.13,0.082,0.185,0.109c0.009-0.009,0.036-0.055,0.082-0.137s0.101-0.185,0.164-0.308s0.132-0.255,0.205-0.396 s0.137-0.271,0.191-0.39c-0.265-0.173-0.61-0.299-1.039-0.376s-0.853-0.116-1.271-0.116c-0.41,0-0.8,0.063-1.169,0.191 s-0.692,0.313-0.971,0.554s-0.499,0.535-0.663,0.882S20.4,46.13,20.4,46.576c0,0.492,0.104,0.902,0.314,1.23 s0.474,0.613,0.793,0.854s0.661,0.451,1.025,0.629s0.704,0.355,1.019,0.533s0.576,0.376,0.786,0.595s0.314,0.483,0.314,0.793 c0,0.511-0.148,0.896-0.444,1.155s-0.723,0.39-1.278,0.39c-0.183,0-0.378-0.019-0.588-0.055s-0.419-0.084-0.629-0.144 s-0.412-0.123-0.608-0.191s-0.357-0.139-0.485-0.212l-0.287,1.176c0.155,0.137,0.34,0.253,0.554,0.349s0.439,0.171,0.677,0.226 c0.237,0.055,0.472,0.094,0.704,0.116s0.458,0.034,0.677,0.034c0.511,0,0.966-0.077,1.367-0.232s0.738-0.362,1.012-0.622 s0.485-0.561,0.636-0.902s0.226-0.695,0.226-1.06c0-0.538-0.104-0.978-0.314-1.319S25.397,49.292,25.083,49.064z"></path> <path d="M34.872,45.072c-0.378-0.429-0.82-0.754-1.326-0.978s-1.06-0.335-1.661-0.335s-1.155,0.111-1.661,0.335 s-0.948,0.549-1.326,0.978s-0.675,0.964-0.889,1.606s-0.321,1.388-0.321,2.235s0.107,1.595,0.321,2.242s0.511,1.185,0.889,1.613 s0.82,0.752,1.326,0.971s1.06,0.328,1.661,0.328s1.155-0.109,1.661-0.328s0.948-0.542,1.326-0.971s0.675-0.966,0.889-1.613 s0.321-1.395,0.321-2.242s-0.107-1.593-0.321-2.235S35.25,45.501,34.872,45.072z M34.195,50.698 c-0.137,0.487-0.326,0.882-0.567,1.183s-0.515,0.518-0.82,0.649s-0.627,0.198-0.964,0.198c-0.328,0-0.641-0.07-0.937-0.212 s-0.561-0.364-0.793-0.67s-0.415-0.699-0.547-1.183s-0.203-1.066-0.212-1.75c0.009-0.702,0.082-1.294,0.219-1.777 c0.137-0.483,0.326-0.877,0.567-1.183s0.515-0.521,0.82-0.649s0.627-0.191,0.964-0.191c0.328,0,0.641,0.068,0.937,0.205 s0.561,0.36,0.793,0.67s0.415,0.704,0.547,1.183s0.203,1.06,0.212,1.743C34.405,49.616,34.332,50.211,34.195,50.698z"></path> <polygon points="44.012,50.869 40.061,43.924 38.393,43.924 38.393,54 40.061,54 40.061,47.055 44.012,54 45.68,54 45.68,43.924 44.012,43.924 "></polygon> <path d="M20.5,20v-4c0-0.551,0.448-1,1-1c0.553,0,1-0.448,1-1s-0.447-1-1-1c-1.654,0-3,1.346-3,3v4c0,1.103-0.897,2-2,2 c-0.553,0-1,0.448-1,1s0.447,1,1,1c1.103,0,2,0.897,2,2v4c0,1.654,1.346,3,3,3c0.553,0,1-0.448,1-1s-0.447-1-1-1 c-0.552,0-1-0.449-1-1v-4c0-1.2-0.542-2.266-1.382-3C19.958,22.266,20.5,21.2,20.5,20z"></path> <circle cx="28.5" cy="19.5" r="1.5"></circle> <path d="M28.5,25c-0.553,0-1,0.448-1,1v3c0,0.552,0.447,1,1,1s1-0.448,1-1v-3C29.5,25.448,29.053,25,28.5,25z"></path> </g> </g>
      </svg>
      <span>Export as JSON</span>
      <small>Question & Answer pairs</small>
    </div>
    <div class="ai-exporter-dropdown-item" data-format="csv">
      <svg fill="#4b4949" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" 
      xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 318.188 318.188" xml:space="preserve" width="25px" height="25px" 
      stroke="#4b4949"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" 
      stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <g> <rect x="182.882" y="155.008" 
      width="33.713" height="15"></rect> <rect x="101.592" y="132.689" width="33.713" height="15"></rect> 
      <rect x="182.882" y="132.689" width="33.713" height="15"></rect> <rect x="182.882" y="88.053" width="33.713" height="15"></rect> 
      <rect x="182.882" y="110.371" width="33.713" height="15"></rect> <rect x="101.592" y="155.008" width="33.713" height="15"></rect> <polygon points="112.09,123.663 112.09,123.662 118.286,113.621 124.548,123.662 134.588,123.662 123.647,107.909 133.82,91.54 123.911,91.54 118.33,101.472 112.53,91.54 102.906,91.54 112.925,107.228 102.269,123.663 "></polygon> <path d="M201.02,249.514c-0.339,1.27-0.73,3.015-1.174,5.236c-0.445,2.222-0.741,4.073-0.889,5.555 c-0.127-2.053-0.847-5.691-2.158-10.918l-6.316-23.519h-14.092l15.139,46.401h14.759l15.202-46.401h-14.027L201.02,249.514z"></path> <rect x="142.457" y="110.371" width="33.713" height="15"></rect> <rect x="142.457" y="88.053" width="33.713" height="15"></rect> <path d="M283.149,52.723L232.624,2.197C231.218,0.79,229.311,0,227.321,0H40.342c-4.142,0-7.5,3.358-7.5,7.5v303.188 c0,4.142,3.358,7.5,7.5,7.5h237.504c4.142,0,7.5-3.358,7.5-7.5V58.025C285.346,56.036,284.556,54.129,283.149,52.723z M234.821,25.606l24.918,24.919h-24.918V25.606z M47.842,15h171.979v10.263H47.842V15z M47.842,303.188V40.263h171.979v17.763 c0,4.143,3.358,7.5,7.5,7.5h43.024v237.662H47.842z"></path> <rect x="142.457" y="132.689" width="33.713" height="15"></rect> <path d="M122.372,235.484c1.969,0,3.809,0.275,5.523,0.826c1.713,0.55,3.428,1.227,5.141,2.031l3.841-9.871 c-4.57-2.18-9.362-3.27-14.378-3.27c-4.591,0-8.585,0.98-11.98,2.937c-3.396,1.957-5.999,4.755-7.808,8.395 c-1.81,3.64-2.714,7.86-2.714,12.663c0,7.682,1.867,13.553,5.602,17.615c3.734,4.063,9.104,6.094,16.107,6.094 c4.888,0,9.268-0.857,13.14-2.57v-10.602c-1.947,0.805-3.883,1.492-5.808,2.063c-1.926,0.571-3.915,0.857-5.967,0.857 c-6.793,0-10.188-4.464-10.188-13.393c0-4.295,0.836-7.665,2.507-10.109C117.062,236.707,119.39,235.484,122.372,235.484z"></path> <path d="M163.57,244.594c-4.169-1.904-6.724-3.216-7.665-3.936c-0.942-0.719-1.412-1.533-1.412-2.443 c-0.002-0.847,0.368-1.556,1.11-2.127c0.74-0.571,1.925-0.857,3.555-0.857c3.152,0,6.897,0.995,11.234,2.984l3.841-9.681 c-4.994-2.222-9.892-3.333-14.694-3.333c-5.439,0-9.713,1.196-12.822,3.587c-3.111,2.392-4.666,5.724-4.666,9.997 c0,2.285,0.365,4.264,1.095,5.936s1.851,3.152,3.364,4.443s3.782,2.624,6.809,3.999c3.343,1.503,5.4,2.497,6.173,2.983 c0.771,0.486,1.333,0.968,1.682,1.444c0.35,0.476,0.524,1.031,0.524,1.666c0,1.016-0.435,1.847-1.302,2.491 c-0.868,0.647-2.233,0.969-4.095,0.969c-2.158,0-4.527-0.344-7.109-1.032c-2.581-0.687-5.067-1.645-7.458-2.872v11.172 c2.264,1.079,4.443,1.836,6.538,2.27c2.095,0.434,4.687,0.65,7.775,0.65c3.703,0,6.93-0.619,9.681-1.856 c2.75-1.238,4.856-2.973,6.315-5.205c1.461-2.232,2.191-4.787,2.191-7.665c0-3.131-0.777-5.729-2.333-7.792 C170.346,248.323,167.569,246.393,163.57,244.594z"></path> <rect x="142.457" y="155.008" width="33.713" height="15"></rect> </g> </g> </g> </g>
      </svg>
      <span>Export as CSV</span>
      <small>Tables only</small>
    </div>
    <div class="ai-exporter-dropdown-divider"></div>
    <div class="ai-exporter-dropdown-item" data-action="coffee">
      <svg width="256px" height="256px" viewBox="0 0 1024 1024" class="icon" version="1.1" 
      xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0">
      </g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier">
      <path d="M294.613731 1002.666458a21.333329 21.333329 0 0 1-21.333329-19.839996L215.040414 224.853286h593.919877L750.720303 982.826462a21.333329 21.333329 0 0 1-21.333329 19.839996z" 
      fill="#f0e351"></path><path d="M785.920295 246.186615L729.386974 981.333129H294.613731L238.080409 246.186615h547.839886m46.079991-42.666657h-639.999867l60.159988 781.01317a42.666658 42.666658 0 0 0 42.666657 39.466659H729.386974a42.666658 42.666658 0 0 0 42.666658-39.466659l59.946654-781.01317z" fill="#030203"></path><path d="M215.680414 182.186629l14.719997-144.63997A18.13333 18.13333 0 0 1 248.533741 21.333329h526.933223a18.13333 18.13333 0 0 1 18.13333 16.21333l14.719997 144.63997z" fill="#f0e351"></path><path d="M772.693631 42.666658l12.159998 118.186642H239.360409L251.307073 42.666658h521.386558m2.773333-42.666658H248.533741a39.466658 39.466658 0 0 0-39.253326 35.413326l-17.279996 168.106632h639.999867l-17.279997-168.106632A39.466658 39.466658 0 0 0 775.466964 0z" fill="#030203"></path><path d="M176.853756 129.70664l670.293193 0 0 119.039975-670.293193 0 0-119.039975Z" fill="#f09319"></path><path d="M825.81362 151.039969v76.373317H198.187084V151.039969h627.626536m13.866664-42.666658H184.320421A28.799994 28.799994 0 0 0 155.520427 137.386638v104.106645a28.799994 28.799994 0 0 0 28.799994 28.799994h655.359863a28.799994 28.799994 0 0 0 28.799994-28.799994V137.386638a28.799994 28.799994 0 0 0-28.799994-28.799994z" fill="#030203"></path><path d="M264.533737 868.053152L226.347079 370.773256h571.519881l-38.399992 497.279896H264.533737z" fill="#f09319"></path><path d="M774.186964 392.106585l-34.346659 454.613239H283.5204L249.387074 392.106585H774.186964m46.079991-42.666658H203.307083l41.386658 539.946554h534.613222l41.599992-539.946554z" fill="#030203"></path></g>
      </svg>
      <span>Buy Me a Coffee</span>
      <small>Support this extension ☕</small>
    </div>
  `;
  
  // Position dropdown near the more button
  const moreButton = document.getElementById('ai-exporter-more-btn');
  if (moreButton) {
    const rect = moreButton.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 5}px`;
    dropdown.style.left = `${rect.left}px`;
  }
  
  document.body.appendChild(dropdown);
  
  // Add click handlers for dropdown items
  dropdown.querySelectorAll('.ai-exporter-dropdown-item').forEach(item => {
    item.addEventListener('click', async () => {
      const format = item.getAttribute('data-format');
      const action = item.getAttribute('data-action');
      dropdown.remove();
      
      if (format === 'json') {
        await exportAsJSON();
      } else if (format === 'csv') {
        await exportAsCSV();
      } else if (action === 'coffee') {
        window.open('https://buymeacoffee.com/aduko', '_blank');
      }
    });
  });
  
  // Close dropdown when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeDropdown(e) {
      if (!dropdown.contains(e.target) && e.target !== moreButton) {
        dropdown.remove();
        document.removeEventListener('click', closeDropdown);
      }
    });
  }, 0);
}

/**
 * Export conversation as JSON (Q&A pairs)
 */
async function exportAsJSON() {
  // Initialize parser if not already done
  if (!parser) {
    parser = await initializeParser();
  }
  
  if (!parser) {
    alert('AI Chat Exporter: This platform is not supported yet.');
    return;
  }
  
  const allMessages = parser.getMessages();
  
  if (allMessages.length === 0) {
    alert('No messages found on this page.');
    return;
  }
  
  // Export all messages (ignore selection)
  const messagesToExport = allMessages;
  
  // Create Q&A pairs
  const qaPairs = [];
  for (let i = 0; i < messagesToExport.length; i++) {
    const msg = messagesToExport[i];
    if (msg.role === 'user' && i + 1 < messagesToExport.length) {
      const nextMsg = messagesToExport[i + 1];
      if (nextMsg.role === 'assistant') {
        qaPairs.push({
          question: msg.textContent || msg.content || '',
          answer: nextMsg.textContent || nextMsg.content || '',
          timestamp: msg.timestamp || new Date().toISOString()
        });
        i++; // Skip the assistant message in next iteration
      }
    }
  }
  
  const jsonData = {
    title: parser.getConversationTitle(),
    exportDate: new Date().toISOString(),
    platform: window.location.hostname,
    totalPairs: qaPairs.length,
    pairs: qaPairs
  };
  
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
  const title = parser.getConversationTitle();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `${sanitizeFilename(title)}_${timestamp}.json`;
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showBanner(`✓ Exported ${qaPairs.length} Q&A pairs as JSON!`, 3000);
}

/**
 * Extract cell content including math equations and special characters
 */
function extractCellContent(cell) {
  const clone = cell.cloneNode(true);
  
  // Handle MathML - extract from annotation or use textContent
  const mathmlElements = clone.querySelectorAll('math, mjx-container, mjx-math');
  mathmlElements.forEach(mathEl => {
    // Try to find LaTeX annotation
    const annotation = mathEl.querySelector('annotation[encoding="application/x-tex"]');
    if (annotation) {
      const latex = annotation.textContent.trim();
      mathEl.replaceWith(document.createTextNode(latex));
    } else {
      // Use the rendered text content
      const mathText = mathEl.textContent.trim();
      mathEl.replaceWith(document.createTextNode(mathText));
    }
  });
  
  // Handle KaTeX elements
  const katexElements = clone.querySelectorAll('.katex, .katex-display, .katex-html, [class*="katex"]');
  katexElements.forEach(katexEl => {
    // Try to find annotation
    const annotation = katexEl.querySelector('annotation[encoding="application/x-tex"]');
    if (annotation) {
      const latex = annotation.textContent.trim();
      katexEl.replaceWith(document.createTextNode(latex));
    } else {
      // Look for data attribute
      const dataLatex = katexEl.getAttribute('data-latex') || katexEl.getAttribute('data-math');
      if (dataLatex) {
        katexEl.replaceWith(document.createTextNode(dataLatex));
      }
    }
  });
  
  // Handle SVG icons - replace with unicode or descriptive text
  const svgElements = clone.querySelectorAll('svg');
  svgElements.forEach(svg => {
    // Check for common patterns
    const ariaLabel = svg.getAttribute('aria-label');
    const title = svg.querySelector('title');
    const role = svg.getAttribute('role');
    
    let replacement = '';
    
    if (ariaLabel) {
      replacement = ariaLabel;
    } else if (title) {
      replacement = title.textContent;
    } else {
      // Try to infer from class or path content
      const className = svg.getAttribute('class') || '';
      const innerHTML = svg.innerHTML.toLowerCase();
      
      if (className.includes('check') || innerHTML.includes('check')) replacement = '✓';
      else if (className.includes('cross') || className.includes('times') || innerHTML.includes('times')) replacement = '✗';
      else if (className.includes('star')) replacement = '★';
      else if (className.includes('arrow-right')) replacement = '→';
      else if (className.includes('arrow-left')) replacement = '←';
      else if (className.includes('arrow-up')) replacement = '↑';
      else if (className.includes('arrow-down')) replacement = '↓';
      else if (className.includes('circle') && className.includes('fill')) replacement = '●';
      else if (className.includes('circle')) replacement = '○';
      else if (className.includes('square') && className.includes('fill')) replacement = '■';
      else if (className.includes('square')) replacement = '□';
      else replacement = ''; // Remove generic SVG icons
    }
    
    svg.replaceWith(document.createTextNode(replacement));
  });
  
  // Handle icon fonts (Font Awesome, Material Icons, etc.)
  const iconElements = clone.querySelectorAll('i[class*="icon"], i[class*="fa-"], span[class*="icon"], .emoji');
  iconElements.forEach(icon => {
    const ariaLabel = icon.getAttribute('aria-label');
    const title = icon.getAttribute('title');
    
    if (ariaLabel) {
      icon.replaceWith(document.createTextNode(ariaLabel));
    } else if (title) {
      icon.replaceWith(document.createTextNode(title));
    } else {
      // Keep emoji text content
      const text = icon.textContent.trim();
      if (text) {
        icon.replaceWith(document.createTextNode(text));
      } else {
        icon.remove();
      }
    }
  });
  
  // Handle images with alt text
  const images = clone.querySelectorAll('img');
  images.forEach(img => {
    const alt = img.getAttribute('alt');
    if (alt && alt.trim()) {
      img.replaceWith(document.createTextNode(alt));
    } else {
      img.remove();
    }
  });
  
  // Clean up any remaining scripts, styles
  clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());
  
  return clone.textContent.trim();
}

/**
 * Export tables as CSV
 */
async function exportAsCSV() {
  // Initialize parser if not already done
  if (!parser) {
    parser = await initializeParser();
  }
  
  if (!parser) {
    alert('AI Chat Exporter: This platform is not supported yet.');
    return;
  }
  
  const allMessages = parser.getMessages();
  
  if (allMessages.length === 0) {
    alert('No messages found on this page.');
    return;
  }
  
  // Extract all tables from all messages
  const tablesData = [];
  
  allMessages.forEach((msg, msgIndex) => {
    const element = msg.element;
    if (!element) return;
    
    const tables = element.querySelectorAll('table');
    tables.forEach((table, tableIndex) => {
      // Extract headers with proper content extraction
      const headers = Array.from(table.querySelectorAll('th')).map(th => 
        extractCellContent(th)
      );
      
      // Extract rows with proper content extraction
      const rows = [];
      const tableRows = table.querySelectorAll('tbody tr, tr');
      tableRows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => 
          extractCellContent(td)
        );
        if (cells.length > 0) {
          rows.push(cells);
        }
      });
      
      if (headers.length > 0 || rows.length > 0) {
        tablesData.push({
          id: `table-${msgIndex}-${tableIndex}`,
          headers,
          rows,
          element: table.cloneNode(true)
        });
      }
    });
  });
  
  if (tablesData.length === 0) {
    alert('No tables found in the conversation.');
    return;
  }
  
  // Show table selection UI
  showTableSelectionUI(tablesData);
}

/**
 * Show table selection UI
 */
function showTableSelectionUI(tablesData) {
  // Remove existing panel if any
  const existing = document.getElementById('ai-exporter-table-selection-panel');
  if (existing) existing.remove();
  
  const panel = document.createElement('div');
  panel.id = 'ai-exporter-table-selection-panel';
  panel.className = 'ai-exporter-table-selection-panel';
  
  let tablesHTML = '';
  tablesData.forEach((tableData, index) => {
    const previewHTML = tableData.element.outerHTML;
    tablesHTML += `
      <div class="ai-exporter-table-item">
        <div class="ai-exporter-table-header">
          <label>
            <input type="checkbox" class="ai-exporter-table-checkbox" data-table-id="${tableData.id}" checked />
            <span>Table ${index + 1}</span>
          </label>
          <span class="ai-exporter-table-size">${tableData.rows.length} rows × ${tableData.headers.length || tableData.rows[0]?.length || 0} cols</span>
        </div>
        <div class="ai-exporter-table-preview">
          ${previewHTML}
        </div>
      </div>
    `;
  });
  
  panel.innerHTML = `
    <div class="ai-exporter-table-selection-container">
      <div class="ai-exporter-table-selection-header">
        <h3>Select Tables to Export</h3>
        <button class="ai-exporter-table-selection-close" aria-label="Close">×</button>
      </div>
      <div class="ai-exporter-table-selection-body">
        <div class="ai-exporter-table-actions">
          <button class="ai-exporter-table-select-all">Select All</button>
          <button class="ai-exporter-table-deselect-all">Deselect All</button>
          <span class="ai-exporter-table-count">${tablesData.length} table(s) found</span>
        </div>
        <div class="ai-exporter-table-list">
          ${tablesHTML}
        </div>
      </div>
      <div class="ai-exporter-table-selection-footer">
        <button class="ai-exporter-table-export-btn">Export Selected as CSV</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Add event listeners
  panel.querySelector('.ai-exporter-table-selection-close').addEventListener('click', () => {
    panel.remove();
  });
  
  panel.querySelector('.ai-exporter-table-select-all').addEventListener('click', () => {
    panel.querySelectorAll('.ai-exporter-table-checkbox').forEach(cb => cb.checked = true);
  });
  
  panel.querySelector('.ai-exporter-table-deselect-all').addEventListener('click', () => {
    panel.querySelectorAll('.ai-exporter-table-checkbox').forEach(cb => cb.checked = false);
  });
  
  panel.querySelector('.ai-exporter-table-export-btn').addEventListener('click', () => {
    const selectedIds = Array.from(panel.querySelectorAll('.ai-exporter-table-checkbox:checked'))
      .map(cb => cb.getAttribute('data-table-id'));
    
    if (selectedIds.length === 0) {
      alert('Please select at least one table to export.');
      return;
    }
    
    const selectedTables = tablesData.filter(t => selectedIds.includes(t.id));
    exportSelectedTablesAsCSV(selectedTables);
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
 * Export selected tables as CSV
 */
function exportSelectedTablesAsCSV(tablesData) {
  let csvContent = '';
  
  tablesData.forEach((tableData, index) => {
    if (index > 0) csvContent += '\n\n';
    csvContent += `Table ${index + 1}\n`;
    
    // Add headers
    if (tableData.headers.length > 0) {
      csvContent += tableData.headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
    }
    
    // Add rows
    tableData.rows.forEach(row => {
      csvContent += row.map(c => `"${c.replace(/"/g, '""')}"`).join(',') + '\n';
    });
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const title = parser.getConversationTitle();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `${sanitizeFilename(title)}_tables_${timestamp}.csv`;
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showBanner(`✓ Exported ${tablesData.length} table(s) as CSV!`, 3000);
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
  <svg width="256px" height="256px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" 
  xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" 
  stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
  <g id="SVGRepo_iconCarrier"><defs><linearGradient id="a" x1="4.494" y1="-1712.086" x2="13.832" y2="-1695.914" 
  gradientTransform="translate(0 1720)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2368c4"></stop><stop offset="0.5" 
  stop-color="#1a5dbe"></stop><stop offset="1" stop-color="#1146ac"></stop></linearGradient></defs><title>file_type_word</title><path d="M28.806,3H9.705A1.192,1.192,0,0,0,8.512,4.191h0V9.5l11.069,3.25L30,9.5V4.191A1.192,1.192,0,0,0,28.806,3Z" style="fill:#41a5ee">
  </path><path d="M30,9.5H8.512V16l11.069,1.95L30,16Z" style="fill:#2b7cd3"></path><path d="M8.512,16v6.5L18.93,23.8,30,22.5V16Z" style="fill:#185abd"></path><path d="M9.705,29h19.1A1.192,1.192,0,0,0,30,27.809h0V22.5H8.512v5.309A1.192,1.192,0,0,0,9.705,29Z" style="fill:#103f91">
  </path><path d="M16.434,8.2H8.512V24.45h7.922a1.2,1.2,0,0,0,1.194-1.191V9.391A1.2,1.2,0,0,0,16.434,8.2Z" style="opacity:0.10000000149011612;isolation:isolate"></path><path d="M15.783,8.85H8.512V25.1h7.271a1.2,1.2,0,0,0,1.194-1.191V10.041A1.2,1.2,0,0,0,15.783,8.85Z" style="opacity:0.20000000298023224;isolation:isolate">
  </path><path d="M15.783,8.85H8.512V23.8h7.271a1.2,1.2,0,0,0,1.194-1.191V10.041A1.2,1.2,0,0,0,15.783,8.85Z" style="opacity:0.20000000298023224;isolation:isolate"></path><path d="M15.132,8.85H8.512V23.8h6.62a1.2,1.2,0,0,0,1.194-1.191V10.041A1.2,1.2,0,0,0,15.132,8.85Z" style="opacity:0.20000000298023224;isolation:isolate">
  </path><path d="M3.194,8.85H15.132a1.193,1.193,0,0,1,1.194,1.191V21.959a1.193,1.193,0,0,1-1.194,1.191H3.194A1.192,1.192,0,0,1,2,21.959V10.041A1.192,1.192,0,0,1,3.194,8.85Z" style="fill:url(#a)"></path><path d="M6.9,17.988c.023.184.039.344.046.481h.028c.01-.13.032-.287.065-.47s.062-.338.089-.465l1.255-5.407h1.624l1.3,5.326a7.761,7.761,0,0,1,.162,1h.022a7.6,7.6,0,0,1,.135-.975l1.039-5.358h1.477l-1.824,7.748H10.591L9.354,14.742q-.054-.222-.122-.578t-.084-.52H9.127q-.021.189-.084.561c-.042.249-.075.432-.1.552L7.78,19.871H6.024L4.19,12.127h1.5l1.131,5.418A4.469,4.469,0,0,1,6.9,17.988Z" style="fill:#fff"></path></g>
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
  <svg fill="#413e3e" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" 
  xmlns:xlink="http://www.w3.org/1999/xlink" width="256px" height="256px" viewBox="0 0 550.801 550.801" 
  xml:space="preserve" stroke="#413e3e"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" 
  stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M267.342,414.698c-6.613,0-10.884,0.585-13.413,1.165v85.72c2.534,0.586,6.616,0.586,10.304,0.586 c26.818,0.189,44.315-14.576,44.315-45.874C308.738,429.079,292.803,414.698,267.342,414.698z">
  </path> <path d="M152.837,414.313c-6.022,0-10.104,0.58-12.248,1.16v38.686c2.531,0.58,5.643,0.78,9.903,0.78 c15.757,0,25.471-7.973,25.471-21.384C175.964,421.506,167.601,414.313,152.837,414.313z">
  </path> <path d="M475.095,131.992c-0.032-2.526-0.833-5.021-2.568-6.993L366.324,3.694c-0.021-0.034-0.062-0.045-0.084-0.076 c-0.633-0.707-1.36-1.29-2.141-1.804c-0.232-0.15-0.475-0.285-0.718-0.422c-0.675-0.366-1.382-0.67-2.13-0.892 c-0.19-0.058-0.38-0.14-0.58-0.192C359.87,0.114,359.037,0,358.203,0H97.2C85.292,0,75.6,9.693,75.6,21.601v507.6 c0,11.913,9.692,21.601,21.6,21.601H453.6c11.908,0,21.601-9.688,21.601-21.601V133.202 C475.2,132.796,475.137,132.398,475.095,131.992z M193.261,463.873c-10.104,9.523-25.072,13.806-42.569,13.806 c-3.882,0-7.391-0.2-10.102-0.58v46.839h-29.35V394.675c9.131-1.55,21.967-2.721,40.047-2.721 c18.267,0,31.292,3.501,40.036,10.494c8.363,6.612,13.985,17.497,13.985,30.322C205.308,445.605,201.042,456.49,193.261,463.873z M318.252,508.392c-13.785,11.464-34.778,16.906-60.428,16.906c-15.359,0-26.238-0.97-33.637-1.94V394.675 c10.887-1.74,25.083-2.721,40.046-2.721c24.867,0,41.004,4.472,53.645,13.995c13.61,10.109,22.164,26.241,22.164,49.37 C340.031,480.4,330.897,497.697,318.252,508.392z M439.572,417.225h-50.351v29.932h47.039v24.11h-47.039v52.671H359.49V392.935 h80.082V417.225z M97.2,366.752V21.601h250.203v110.515c0,5.961,4.831,10.8,10.8,10.8H453.6l0.011,223.836H97.2z">
  </path> <path d="M386.205,232.135c-0.633-0.059-15.852-1.448-39.213-1.448c-7.319,0-14.691,0.143-21.969,0.417 c-46.133-34.62-83.919-69.267-104.148-88.684c0.369-2.138,0.623-3.828,0.741-5.126c2.668-28.165-0.298-47.179-8.786-56.515 c-5.558-6.101-13.721-8.131-22.233-5.806c-5.286,1.385-15.071,6.513-18.204,16.952c-3.459,11.536,2.101,25.537,16.708,41.773 c0.232,0.246,5.189,5.44,14.196,14.241c-5.854,27.913-21.178,88.148-28.613,117.073c-17.463,9.331-32.013,20.571-43.277,33.465 l-0.738,0.844l-0.477,1.013c-1.16,2.437-6.705,15.087-2.542,25.249c1.901,4.62,5.463,7.995,10.302,9.767l1.297,0.349 c0,0,1.17,0.253,3.227,0.253c9.01,0,31.25-4.735,43.179-48.695l2.89-11.138c41.639-20.239,93.688-26.768,131.415-28.587 c19.406,14.391,38.717,27.611,57.428,39.318l0.611,0.354c0.907,0.464,9.112,4.515,18.721,4.524l0,0 c13.732,0,23.762-8.427,27.496-23.113l0.189-1.004c1.044-8.393-1.065-15.958-6.096-21.872 C407.711,233.281,387.978,232.195,386.205,232.135z M142.812,319.744c-0.084-0.1-0.124-0.194-0.166-0.3 c-0.896-2.157,0.179-7.389,1.761-11.222c6.792-7.594,14.945-14.565,24.353-20.841 C159.598,317.039,146.274,319.603,142.812,319.744z M200.984,122.695L200.984,122.695c-14.07-15.662-13.859-23.427-13.102-26.041 c1.242-4.369,6.848-6.02,6.896-6.035c2.824-0.768,4.538-0.617,6.064,1.058c3.451,3.791,6.415,15.232,5.244,36.218 C202.764,124.557,200.984,122.695,200.984,122.695z M193.714,256.068l0.243-0.928l-0.032,0.011 c7.045-27.593,17.205-67.996,23.047-93.949l0.211,0.201l0.021-0.124c18.9,17.798,47.88,43.831,82.579,70.907l-0.39,0.016 l0.574,0.433C267.279,235.396,228.237,241.84,193.714,256.068z M408.386,265.12c-2.489,9.146-7.277,10.396-11.665,10.396l0,0 c-5.094,0-9.998-2.12-11.116-2.632c-12.741-7.986-25.776-16.688-38.929-25.998c0.105,0,0.2,0,0.316,0 c22.549,0,37.568,1.369,38.158,1.411c3.766,0.14,15.684,1.9,20.82,7.938C407.984,258.602,408.755,261.431,408.386,265.12z"></path> </g> </g> </g>
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
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round">
</g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M10.65 3L9.93163 3.53449L9.32754 5.54812L7.47651 4.55141L6.5906 4.68143L4.68141 6.59062L4.55139 7.47652L5.5481 9.32755L3.53449 9.93163L3 10.65V13.35L3.53449 14.0684L5.54811 14.6725L4.55142 16.5235L4.68144 17.4094L6.59063 19.3186L7.47653 19.4486L9.32754 18.4519L9.93163 20.4655L10.65 21H13.35L14.0684 20.4655L14.6725 18.4519L16.5235 19.4486L17.4094 19.3185L19.3186 17.4094L19.4486 16.5235L18.4519 14.6724L20.4655 14.0684L21 13.35V10.65L20.4655 9.93163L18.4519 9.32754L19.4486 7.47654L19.3186 6.59063L17.4094 4.68144L16.5235 4.55142L14.6725 5.54812L14.0684 3.53449L13.35 3H10.65ZM10.4692 6.96284L11.208 4.5H12.792L13.5308 6.96284L13.8753 7.0946C13.9654 7.12908 14.0543 7.16597 14.142 7.2052L14.4789 7.35598L16.7433 6.13668L17.8633 7.25671L16.644 9.52111L16.7948 9.85803C16.834 9.9457 16.8709 10.0346 16.9054 10.1247L17.0372 10.4692L19.5 11.208V12.792L17.0372 13.5308L16.9054 13.8753C16.8709 13.9654 16.834 14.0543 16.7948 14.1419L16.644 14.4789L17.8633 16.7433L16.7433 17.8633L14.4789 16.644L14.142 16.7948C14.0543 16.834 13.9654 16.8709 13.8753 16.9054L13.5308 17.0372L12.792 19.5H11.208L10.4692 17.0372L10.1247 16.9054C10.0346 16.8709 9.94569 16.834 9.85803 16.7948L9.52111 16.644L7.25671 17.8633L6.13668 16.7433L7.35597 14.4789L7.2052 14.142C7.16597 14.0543 7.12908 13.9654 7.0946 13.8753L6.96284 13.5308L4.5 12.792L4.5 11.208L6.96284 10.4692L7.0946 10.1247C7.12907 10.0346 7.16596 9.94571 7.20519 9.85805L7.35596 9.52113L6.13666 7.2567L7.25668 6.13667L9.5211 7.35598L9.85803 7.2052C9.9457 7.16597 10.0346 7.12908 10.1247 7.0946L10.4692 6.96284ZM14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12ZM15.75 12C15.75 14.0711 14.0711 15.75 12 15.75C9.92893 15.75 8.25 14.0711 8.25 12C8.25 9.92893 9.92893 8.25 12 8.25C14.0711 8.25 15.75 9.92893 15.75 12Z" fill="#787783"></path> 
</g></svg>
  `;
  settingsButton.title = 'Export Settings';
  settingsButton.setAttribute('aria-label', 'Export Settings');
  
  settingsButton.addEventListener('click', () => {
    toggleSettingsPanel();
  });

  // More Options Button (three dots)
  const moreButton = document.createElement('button');
  moreButton.id = 'ai-exporter-more-btn';
  moreButton.className = `${buttonClass} ai-exporter-action-btn`;
  moreButton.innerHTML = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" 
  stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 12H12.01M12 6H12.01M12 18H12.01M13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12ZM13 18C13 18.5523 12.5523 19 12 19C11.4477 19 11 18.5523 11 18C11 17.4477 11.4477 17 12 17C12.5523 17 13 17.4477 13 18ZM13 6C13 6.55228 12.5523 7 12 7C11.4477 7 11 6.55228 11 6C11 5.44772 11.4477 5 12 5C12.5523 5 13 5.44772 13 6Z" stroke="#4f4a4a" stroke-width="2" stroke-linecap="round" 
  stroke-linejoin="round"></path> </g>
  </svg>
  `;
  moreButton.title = 'More Export Options';
  moreButton.setAttribute('aria-label', 'More Export Options');
  
  moreButton.addEventListener('click', () => {
    toggleMoreOptionsDropdown();
  });

  // Add buttons to container
  buttonContainer.appendChild(wordButton);
  buttonContainer.appendChild(pdfButton);
  buttonContainer.appendChild(settingsButton);
  buttonContainer.appendChild(moreButton);

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