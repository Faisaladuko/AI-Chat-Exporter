/**
 * Google Gemini Platform Parser
 * Parses conversations from gemini.google.com
 */

export class GeminiParser {
  constructor() {
    this.platformName = 'gemini.google.com';
    this.selectors = {
      // Gemini-specific selectors
      messageContainer: '[data-test-id*="conversation-turn"], .conversation-turn, [class*="message"]',
      userMessage: '[data-test-id*="user"], [class*="user-query"]',
      assistantMessage: '[data-test-id*="model"], [class*="model-response"]',
      codeBlock: 'pre code, code-block, pre',
      title: 'h1, [class*="title"], [class*="conversation-title"]'
    };
  }

  /**
   * Detect if current page is Gemini
   */
  detectPlatform() {
    return window.location.hostname.includes('gemini.google.com');
  }

  /**
   * Get conversation title
   */
  getConversationTitle() {
    // Try multiple selectors for title
    const titleSelectors = [
      'h1',
      '[class*="title"]',
      '[class*="conversation-title"]',
      '[class*="chat-title"]'
    ];

    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector);
      if (titleElement && titleElement.textContent.trim()) {
        const title = titleElement.textContent.trim();
        // Filter out common non-title text
        if (title && 
            !title.toLowerCase().includes('gemini') && 
            !title.toLowerCase().includes('google') &&
            title.length > 3 && 
            title.length < 200) {
          return title;
        }
      }
    }

    // Fallback: Use first user message as title (truncated)
    const messages = this.getMessages();
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage && firstUserMessage.textContent) {
      const truncated = firstUserMessage.textContent.substring(0, 50).trim();
      return truncated + (firstUserMessage.textContent.length > 50 ? '...' : '');
    }

    // Final fallback: Use date
    const now = new Date();
    return `Gemini_Chat_${now.toISOString().split('T')[0]}`;
  }

  /**
   * Get all messages from the conversation
   */
  getMessages() {
    const messages = [];
    
    // Try to find message containers using various selectors
    let messageElements = document.querySelectorAll(this.selectors.messageContainer);
    
    // If no messages found with primary selector, try alternatives
    if (messageElements.length === 0) {
      const alternativeSelectors = [
        '[data-test-id*="turn"]',
        '[class*="conversation-turn"]',
        '[class*="message-container"]',
        '[class*="chat-message"]',
        'message-container',
        '[role="article"]',
        'article'
      ];
      
      for (const selector of alternativeSelectors) {
        messageElements = document.querySelectorAll(selector);
        if (messageElements.length > 0) {
          console.log('[GeminiParser] Found messages with selector:', selector);
          break;
        }
      }
    }

    console.log('[GeminiParser] Found message elements:', messageElements.length);

    messageElements.forEach((messageEl, index) => {
      // Determine role based on element attributes or classes
      let role = 'assistant'; // Default to assistant
      
      // Check various indicators for user messages
      const classNames = messageEl.className || '';
      const testId = messageEl.getAttribute('data-test-id') || '';
      const dataRole = messageEl.getAttribute('data-role') || '';
      
      console.log('[GeminiParser] Message', index, 'classes:', classNames, 'testId:', testId);
      
      // User message indicators
      if (classNames.toLowerCase().includes('user') ||
          classNames.toLowerCase().includes('query') ||
          testId.toLowerCase().includes('user') ||
          dataRole === 'user') {
        role = 'user';
      }
      
      // Assistant message indicators
      if (classNames.toLowerCase().includes('model') ||
          classNames.toLowerCase().includes('assistant') ||
          classNames.toLowerCase().includes('response') ||
          testId.toLowerCase().includes('model') ||
          dataRole === 'assistant') {
        role = 'assistant';
      }

      // If still unclear, check for presence of certain child elements
      if (role === 'assistant') {
        // User messages might have edit buttons
        const hasEditButton = messageEl.querySelector('[aria-label*="edit"], [title*="edit"], button[class*="edit"]');
        if (hasEditButton) {
          role = 'user';
          console.log('[GeminiParser] Message', index, 'detected as user (has edit button)');
        }
      }

      console.log('[GeminiParser] Message', index, 'role:', role);

      // Extract content
      const content = this.extractMessageContent(messageEl);
      
      if (content.textContent.trim().length > 0) {
        messages.push({
          id: `gemini-msg-${index}`,
          role: role,
          htmlContent: content.htmlContent,
          textContent: content.textContent,
          element: messageEl,
          timestamp: new Date().toISOString()
        });
      }
    });

    console.log('[GeminiParser] Total messages parsed:', messages.length);
    return messages;
  }

  /**
   * Extract message content
   */
  extractMessageContent(messageElement) {
    // Clone the element to avoid modifying the original
    const clone = messageElement.cloneNode(true);
    
    // Remove unwanted elements (buttons, icons, etc.)
    const unwantedSelectors = [
      'button',
      '[role="button"]',
      '.button',
      '[class*="action"]',
      '[class*="icon"]',
      'svg'
    ];
    
    unwantedSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => {
        // Keep buttons that are part of code blocks
        if (!el.closest('pre') && !el.closest('code')) {
          el.remove();
        }
      });
    });

    // Get HTML content
    const htmlContent = clone.innerHTML;
    
    // Get text content
    const textContent = this.extractTextContent(clone);
    
    return {
      htmlContent: htmlContent,
      textContent: textContent
    };
  }

  /**
   * Extract clean text content from an element
   */
  extractTextContent(element) {
    const clone = element.cloneNode(true);
    
    // Remove script and style elements
    clone.querySelectorAll('script, style').forEach(el => el.remove());
    
    // Get text content
    let text = clone.textContent || clone.innerText || '';
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  /**
   * Extract code blocks from message
   */
  extractCodeBlocks(messageElement) {
    const codeBlocks = [];
    const codeElements = messageElement.querySelectorAll(this.selectors.codeBlock);
    
    codeElements.forEach((codeEl, index) => {
      // Try to detect language
      let language = 'plaintext';
      
      // Check for language class
      const classNames = codeEl.className || '';
      const languageMatch = classNames.match(/language-(\w+)/);
      if (languageMatch) {
        language = languageMatch[1];
      }
      
      // Check parent pre element
      const preElement = codeEl.closest('pre');
      if (preElement) {
        const preClass = preElement.className || '';
        const preLangMatch = preClass.match(/language-(\w+)/);
        if (preLangMatch) {
          language = preLangMatch[1];
        }
      }
      
      codeBlocks.push({
        language: language,
        code: codeEl.textContent || '',
        index: index
      });
    });
    
    return codeBlocks;
  }

  /**
   * Extract math equations (LaTeX)
   */
  extractMathEquations(messageElement) {
    const equations = [];
    
    // Gemini might use specific classes or elements for math
    const mathSelectors = [
      '[class*="math"]',
      '[class*="katex"]',
      '[class*="latex"]',
      'math-inline',
      'math-block'
    ];
    
    mathSelectors.forEach(selector => {
      const mathElements = messageElement.querySelectorAll(selector);
      mathElements.forEach((mathEl, index) => {
        const latex = mathEl.getAttribute('data-latex') || 
                     mathEl.getAttribute('data-math') ||
                     mathEl.textContent;
        
        if (latex) {
          equations.push({
            latex: latex,
            isBlock: selector.includes('block'),
            index: index
          });
        }
      });
    });
    
    return equations;
  }
}
