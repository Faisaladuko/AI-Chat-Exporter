/**
 * PDF Exporter
 */

/**
 * Process messages to remove UI elements
 */
function processMessages(messages) {
  return messages.map(msg => {
    if (msg.htmlContent) {
      const temp = document.createElement('div');
      temp.innerHTML = msg.htmlContent;
      
      // Remove all buttons (copy, collapse, etc.)
      temp.querySelectorAll('button').forEach(btn => btn.remove());
      
      // Remove the selection checkmark icon added by our extension
      temp.querySelectorAll('.ai-exporter-checkbox, .ai-exporter-select-icon, [class*="ai-exporter"]').forEach(el => el.remove());
      
      // Remove code block headers (language labels and control buttons)
      temp.querySelectorAll('[data-testid="code-block"] > div:first-child').forEach(header => {
        // Only remove if it contains buttons or language text
        if (header.querySelector('button') || header.querySelector('.font-mono')) {
          header.remove();
        }
      });
      
      // Remove sticky button containers in code blocks
      temp.querySelectorAll('.sticky, [class*="sticky"]').forEach(el => {
        if (el.querySelector('button')) {
          el.remove();
        }
      });
      
      // Remove elements with copy/collapse text
      temp.querySelectorAll('*').forEach(el => {
        const text = el.textContent.trim().toLowerCase();
        // Remove UI text only (single words, not part of content)
        if ((text === 'copy' || text === 'collapse' || text === 'wrap' || text === 'collapsewrap') && 
            el.children.length === 0) {
          el.remove();
        }
      });
      
      // Remove elements with copy/collapse classes
      temp.querySelectorAll('[class*="copy"], [class*="collapse"], [class*="button"]').forEach(el => {
        if (el.tagName === 'BUTTON' || el.tagName === 'A' || 
            el.classList.toString().toLowerCase().includes('copy') ||
            el.classList.toString().toLowerCase().includes('collapse')) {
          el.remove();
        }
      });
      
      return {
        ...msg,
        htmlContent: temp.innerHTML
      };
    }
    return msg;
  });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Export to PDF - Creates a print-ready HTML that opens in new tab for PDF printing
 */
export async function exportToPDF(exportData) {
  const { title, messages, settings = {} } = exportData;
  
  // Fetch KaTeX CSS for offline use
  let katexCSS = '';
  try {
    const katexResponse = await fetch(chrome.runtime.getURL('libs/katex.min.css'));
    katexCSS = await katexResponse.text();
    // Remove font-face rules that reference external fonts
    katexCSS = katexCSS.replace(/@font-face\{[^}]+\}/g, '');
  } catch (error) {
    console.warn('[AI Exporter] Could not load KaTeX CSS:', error);
  }
  
  const processedMessages = processMessages(messages);
  
  // Use settings or defaults
  const margins = settings.pageMargins || 60;
  const theme = settings.theme || 'light';
  const orientation = settings.orientation || 'portrait';
  const pageFormat = settings.pageFormat || 'A4';
  const isLightTheme = theme === 'light';
  
  // Page size configurations
  const pageSizes = {
    'A4': orientation === 'portrait' ? '210mm 297mm' : '297mm 210mm',
    'Letter': orientation === 'portrait' ? '8.5in 11in' : '11in 8.5in',
    'Legal': orientation === 'portrait' ? '8.5in 14in' : '14in 8.5in'
  };
  
  // Create a print-ready HTML document
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    /* KaTeX styles embedded for offline use */
    ${katexCSS}
  </style>
  <style>
    @page { 
      size: ${pageSizes[pageFormat]}; 
      margin: ${margins}px; 
    }
    
    @media print {
      body { 
        margin: 0 !important; 
        padding: 0 !important; 
      }
      .no-print { display: none !important; }
      h1 { page-break-before: avoid; }
      h2 { page-break-after: avoid; }
      pre { page-break-inside: avoid; }
    }
    
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      font-size: 11pt; 
      line-height: 1.6; 
      color: ${isLightTheme ? '#333' : '#e0e0e0'};
      background: ${isLightTheme ? 'white' : '#1a1a1a'};
      max-width: 100%;
      margin: 0;
      padding: 20px;
    }
    
    @media screen {
      body {
        max-width: 800px;
        margin: 20px auto;
      }
    }
    
    .message-content {
      margin: 15px 0;
    }
    
    .message-content h2 {
      font-size: 14pt;
      color: ${isLightTheme ? '#2c3e50' : '#4a9eff'};
      background: none;
      padding: 0;
      border-left: none;
      margin-top: 15px;
      margin-bottom: 10px;
    }
    
    .separator { 
      border-top: 1px solid #ddd; 
      margin: 25px 0;
    }
    
    pre {
      background: #f4f4f4 !important;
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 10px 0;
    }
    
    code {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 9pt;
    }
    
    /* Math rendering - basic KaTeX-compatible styles */
    .katex, .katex-display, .katex-html, [class*="katex"] { 
      font-size: 1.1em;
      display: inline-block;
    }
    .katex-display { 
      margin: 1em 0; 
      overflow-x: auto;
      overflow-y: hidden;
      display: block;
      text-align: center;
    }
    
    .no-print {
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 10px 20px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    /* Hide any buttons in content except our print button */
    .message-content button, 
    .message-content .copy-code-button, 
    .message-content [class*="copy-"] {
      display: none !important;
    }
    
    .no-print:hover {
      background: #2980b9;
    }
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()">Print to PDF</button>
  ${processedMessages.map((message, index) => {
    // Ensure htmlContent is safe and doesn't break HTML structure
    const content = message.htmlContent || escapeHtml(message.textContent);
    return `
      <div class="message-content">${content}</div>
      ${index < processedMessages.length - 1 ? '<div class="separator"></div>' : ''}
    `;
  }).join('')}
</body>
</html>`;

  // Return as blob
  return new Blob([html], { type: 'text/html;charset=utf-8' });
}
