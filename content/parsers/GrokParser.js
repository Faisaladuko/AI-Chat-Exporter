/**
 * Grok AI Parser - Handles parsing of Grok conversations
 */
export class GrokParser {
  constructor() {
    this.platformName = "grok.com";
    this.selectors = {
      conversationContainer: 'main, [class*="conversation"], [class*="chat"]',
      messageGroup: '.message-bubble',
      userMessage: '.message-bubble.bg-surface-l1',
      assistantMessage: '.message-bubble.w-full',
      messageContent: '.prose, [class*="prose"]',
      codeBlock: 'pre code, code, .code-block',
      conversationTitle: 'h1, [class*="title"], header [class*="conversation"]'
    };
  }

  detectPlatform() {
    return window.location.hostname.includes(this.platformName);
  }

  getConversationTitle() {
    const titleElement = document.querySelector(this.selectors.conversationTitle);
    return titleElement ? titleElement.textContent.trim() : 'Grok Conversation';
  }

  getMessages() {
    const messages = [];
    const messageElements = document.querySelectorAll(this.selectors.messageGroup);
    
    console.log(`[AI Exporter] Found ${messageElements.length} message elements`);
    
    messageElements.forEach((element, index) => {
      // Detect role from classes
      const classString = element.classList.toString();
      
      // User messages have: bg-surface-l1 border border-border-l1 rounded-br-lg
      // Assistant messages have: w-full max-w-none
      let role = 'assistant'; // default
      
      if (classString.includes('bg-surface-l1') && classString.includes('border-border-l1')) {
        role = 'user';
        console.log(`[AI Exporter] Message ${index}: USER (has bg-surface-l1)`);
      } else if (classString.includes('w-full') && classString.includes('max-w-none')) {
        role = 'assistant';
        console.log(`[AI Exporter] Message ${index}: ASSISTANT (has w-full max-w-none)`);
      }
      
      // Use the message bubble itself for full HTML content to preserve all formatting
      const htmlContent = element.innerHTML;
      
      if (element.textContent.trim()) {
        const message = {
          id: `msg-${index}`,
          role: role,
          htmlContent: htmlContent,
          textContent: this.extractTextContent(element),
          codeBlocks: this.extractCodeBlocks(element),
          mathEquations: this.extractMathEquations(element),
          timestamp: new Date().toISOString(),
          element: element
        };
        
        messages.push(message);
      }
    });
    
    return messages;
  }

  extractTextContent(element) {
    if (!element) return '';
    const clone = element.cloneNode(true);
    clone.querySelectorAll('script, style').forEach(el => el.remove());
    return clone.textContent.trim();
  }

  extractCodeBlocks(element) {
    if (!element) return [];
    
    const codeBlocks = [];
    const preElements = element.querySelectorAll('pre');
    
    preElements.forEach((pre) => {
      const codeElement = pre.querySelector('code');
      if (codeElement) {
        const langMatch = codeElement.className.match(/language-(\w+)/);
        const language = langMatch ? langMatch[1] : 'plaintext';
        
        codeBlocks.push({
          language: language,
          code: codeElement.textContent
        });
      }
    });
    
    return codeBlocks;
  }

  extractMathEquations(element) {
    if (!element) return [];
    
    const equations = [];
    
    // Look for KaTeX rendered equations
    const katexElements = element.querySelectorAll('.katex, .katex-display, [class*="math"]');
    katexElements.forEach((katex) => {
      equations.push({
        type: katex.classList.contains('katex-display') ? 'display' : 'inline',
        latex: katex.textContent
      });
    });
    
    // Look for LaTeX delimiters in text
    const textContent = element.textContent;
    const inlineMatches = textContent.match(/\$([^\$]+)\$/g);
    const displayMatches = textContent.match(/\$\$([^\$]+)\$\$/g);
    
    if (inlineMatches) {
      inlineMatches.forEach(match => {
        equations.push({
          type: 'inline',
          latex: match.replace(/\$/g, '')
        });
      });
    }
    
    if (displayMatches) {
      displayMatches.forEach(match => {
        equations.push({
          type: 'display',
          latex: match.replace(/\$\$/g, '')
        });
      });
    }
    
    return equations;
  }
}
