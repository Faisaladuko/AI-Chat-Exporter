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
  const { title, messages } = exportData;
  
  const processedMessages = processMessages(messages);
  
  let html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(title)}</title>
      <!-- KaTeX CSS for math rendering -->
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
      <style>
        body { 
          font-family: 'Segoe UI', Calibri, Arial, sans-serif; 
          max-width: 800px; 
          margin: 40px auto; 
          padding: 20px; 
          line-height: 1.6;
          background: white;
        }
        h2 { color: #2c3e50; font-size: 18px; margin-top: 20px; }
        h3 { color: #555; font-size: 18px; margin-top: 20px; }
        h4 { color: #666; font-size: 16px; margin-top: 15px; }
        
        .separator { 
          border-top: 1px solid #bdc3c7; 
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
          background: #2d2d2d;
          color: #f8f8f2;
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
          background: #f4f4f4;
          padding: 2px 6px;
          border-radius: 3px;
          color: #c7254e;
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
          border-left: 4px solid #95a5a6;
          padding-left: 15px;
          margin: 15px 0;
          color: #555;
          font-style: italic;
        }
        
        /* Text formatting */
        strong, b { 
          font-weight: 600; 
          color: #2c3e50; 
        }
        em, i { 
          font-style: italic; 
        }
        
        /* Link styling */
        a {
          color: #3498db;
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
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background: #f8f9fa;
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
          text-align: justify;
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
