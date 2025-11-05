export default class BaseParser {
  constructor(platformName, selectors) {
    this.platformName = platformName;
    this.selectors = selectors;
  }

  /**
   * Check if current page matches this parser's platform
   */
  detectPlatform() {
    return window.location.hostname.includes(this.platformName);
  }

  /**
   * Get conversation title (override in subclasses)
   */
  getConversationTitle() {
    return document.title || 'AI Conversation';
  }

  /**
   * Get all messages from the conversation (override in subclasses for better parsing)
   */
  getMessages() {
    const userNodes = document.querySelectorAll(this.selectors.userMessage || this.selectors.user);
    const aiNodes = document.querySelectorAll(this.selectors.assistantMessage || this.selectors.assistant);
    return this.formatMessages(userNodes, aiNodes);
  }

  /**
   * Format message nodes into structured message objects
   */
  formatMessages(userNodes, aiNodes) {
    const result = [];
    const maxLength = Math.max(userNodes.length, aiNodes.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (userNodes[i]) {
        result.push({
          id: `user-${i}`,
          role: "user",
          htmlContent: userNodes[i].innerHTML,
          textContent: this.extractTextContent(userNodes[i]),
          element: userNodes[i],
          timestamp: new Date().toISOString()
        });
      }
      
      if (aiNodes[i]) {
        result.push({
          id: `assistant-${i}`,
          role: "assistant",
          htmlContent: aiNodes[i].innerHTML,
          textContent: this.extractTextContent(aiNodes[i]),
          codeBlocks: this.extractCodeBlocks(aiNodes[i]),
          mathEquations: this.extractMathEquations(aiNodes[i]),
          element: aiNodes[i],
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return result;
  }

  /**
   * Extract plain text content from element
   */
  extractTextContent(element) {
    if (!element) return '';
    
    // Create a clone to avoid modifying the original
    const clone = element.cloneNode(true);
    
    // Remove script and style elements
    clone.querySelectorAll('script, style').forEach(el => el.remove());
    
    return clone.textContent.trim();
  }

  /**
   * Extract code blocks from element
   */
  extractCodeBlocks(element) {
    if (!element) return [];
    
    const codeBlocks = [];
    const preElements = element.querySelectorAll('pre code, pre, .code-block');
    
    preElements.forEach((pre) => {
      const codeElement = pre.tagName === 'CODE' ? pre : pre.querySelector('code') || pre;
      
      // Try to detect language
      let language = 'plaintext';
      const classNames = codeElement.className || '';
      const langMatch = classNames.match(/language-(\w+)/);
      if (langMatch) {
        language = langMatch[1];
      }
      
      codeBlocks.push({
        language: language,
        code: codeElement.textContent
      });
    });
    
    return codeBlocks;
  }

  /**
   * Extract math equations from element
   */
  extractMathEquations(element) {
    if (!element) return [];
    
    const equations = [];
    
    // Look for common math rendering classes
    const mathSelectors = [
      '.math', 
      '[class*="katex"]', 
      '.MathJax',
      'mjx-container',
      '[class*="math"]'
    ].join(', ');
    
    const mathElements = element.querySelectorAll(mathSelectors);
    
    mathElements.forEach((mathEl) => {
      const isInline = mathEl.classList.contains('math-inline') || 
                      mathEl.classList.contains('katex-inline') ||
                      mathEl.style.display === 'inline';
      
      // Try to extract LaTeX
      let latex = mathEl.getAttribute('data-latex') || 
                 mathEl.querySelector('annotation')?.textContent ||
                 mathEl.textContent;
      
      equations.push({
        type: isInline ? 'inline' : 'block',
        latex: latex.trim()
      });
    });
    
    return equations;
  }

  /**
   * Convert HTML to clean text while preserving structure
   */
  htmlToText(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Handle lists
    temp.querySelectorAll('li').forEach(li => {
      li.textContent = '• ' + li.textContent;
    });
    
    // Handle line breaks
    temp.querySelectorAll('br').forEach(br => {
      br.replaceWith('\n');
    });
    
    // Handle paragraphs
    temp.querySelectorAll('p').forEach(p => {
      p.textContent = p.textContent + '\n\n';
    });
    
    return temp.textContent.trim();
  }
}