/**
 * DOCX Exporter
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
 * Export to DOCX (HTML format with full formatting)
 */
export function exportToDocx(exportData) {
  const { title, messages, settings = {} } = exportData;
  
  const processedMessages = processMessages(messages);
  
  // Use settings or defaults
  const margins = settings.pageMargins || 60;
  const theme = settings.theme || 'light';
  const isLightTheme = theme === 'light';
  
  let html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(title)}</title>
      <!-- KaTeX CSS for math rendering -->
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
      <style>
        @page {
          margin: ${margins}px;
        }
        body { 
          font-family: 'Segoe UI', Calibri, Arial, sans-serif; 
          max-width: 800px; 
          margin: ${margins}px auto; 
          padding: 20px; 
          line-height: 1.6;
          background: ${isLightTheme ? 'white' : '#1a1a1a'};
          color: ${isLightTheme ? '#000' : '#e0e0e0'};
        }
        h2 { color: ${isLightTheme ? '#2c3e50' : '#4a9eff'}; font-size: 18px; margin-top: 20px; }
        h3 { color: ${isLightTheme ? '#555' : '#6eb8ff'}; font-size: 18px; margin-top: 20px; }
        h4 { color: ${isLightTheme ? '#666' : '#8dc9ff'}; font-size: 16px; margin-top: 15px; }
        
        .separator { 
          border-top: 1px solid ${isLightTheme ? '#bdc3c7' : '#444'}; 
          margin: 20px 0; 
        }
        
        /* Message content styling */
        .message-content {
          margin: 15px 0;
          line-height: 1.8;
        }
        
        .message-content h2 {
          background: none;
          padding: 0;
          border-left: none;
        }
        
        /* Code block styling */
        pre {
          background: ${isLightTheme ? '#2d2d2d' : '#0d0d0d'};
          color: ${isLightTheme ? '#f8f8f2' : '#f0f0f0'};
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
          margin: 15px 0;
        }
        code {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
        }
        pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        code:not(pre code) {
          background: ${isLightTheme ? '#f4f4f4' : '#333'};
          padding: 2px 6px;
          border-radius: 3px;
          color: ${isLightTheme ? '#c7254e' : '#ff6b9d'};
        }
        
        /* List styling */
        ul, ol {
          margin: 10px 0;
          padding-left: 30px;
        }
        li {
          margin: 5px 0;
          line-height: 1.6;
        }
        
        /* Blockquote styling */
        blockquote {
          border-left: 4px solid ${isLightTheme ? '#95a5a6' : '#555'};
          padding-left: 15px;
          margin: 15px 0;
          color: ${isLightTheme ? '#555' : '#aaa'};
          font-style: italic;
        }
        
        /* Text formatting */
        strong, b { 
          font-weight: 600; 
          color: ${isLightTheme ? '#2c3e50' : '#4a9eff'}; 
        }
        em, i { 
          font-style: italic; 
        }
        
        /* Link styling */
        a {
          color: ${isLightTheme ? '#3498db' : '#4a9eff'};
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        
        /* Table styling */
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 15px 0;
        }
        th, td {
          border: 1px solid ${isLightTheme ? '#ddd' : '#444'};
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background: ${isLightTheme ? '#f8f9fa' : '#2a2a2a'};
          font-weight: 600;
        }
        
        /* Math equation styling */
        .katex, .katex-display {
          font-size: 1.1em;
        }
        .katex-display {
          margin: 15px 0;
          text-align: center;
        }
        
        /* Paragraph styling */
        p {
          margin: 10px 0;
          text-align: left;
        }
      </style>
    </head>
    <body>
  `;
  
  processedMessages.forEach((message, index) => {
    html += `<div class="message-content">${message.htmlContent || escapeHtml(message.textContent)}</div>`;
    
    if (index < processedMessages.length - 1) {
      html += '<div class="separator"></div>';
    }
  });
  
  html += `
    </body>
    </html>
  `;
  
  // Create HTML file that Word/LibreOffice can open
  return new Blob([html], { type: 'application/msword' });
}
