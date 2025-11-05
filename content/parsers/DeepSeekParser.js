/**
 * DeepSeek AI Platform Parser
 * Parses conversations from chat.deepseek.com
 */

export class DeepSeekParser {
  constructor() {
    this.platformName = 'chat.deepseek.com';
    this.selectors = {
      // DeepSeek uses similar structure to ChatGPT
      messageContainer: '[class*="message"], [class*="Message"], .chat-message',
      userMessage: '[class*="user"], [data-role="user"]',
      assistantMessage: '[class*="assistant"], [class*="bot"], [data-role="assistant"]',
      codeBlock: 'pre code, pre',
      title: 'h1, [class*="title"], [class*="Title"]'
    };
  }

  /**
   * Detect if current page is DeepSeek
   */
  detectPlatform() {
    return window.location.hostname.includes('deepseek.com');
  }

  /**
   * Get conversation title
   */
  getConversationTitle() {
    // Try multiple selectors for title
    const titleSelectors = [
      'h1',
      '[class*="title"]',
      '[class*="Title"]',
      '[class*="conversation"]'
    ];

    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector);
      if (titleElement && titleElement.textContent.trim()) {
        const title = titleElement.textContent.trim();
        // Filter out common non-title text
        if (title && 
            !title.toLowerCase().includes('deepseek') && 
            !title.toLowerCase().includes('chat') &&
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
    return `Chat_${now.toISOString().split('T')[0]}`;
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
        '[class*="ChatMessage"]',
        '[class*="chat-message"]',
        '[data-testid*="message"]',
        '.message',
        '[role="article"]',
        'article'
      ];
      
      for (const selector of alternativeSelectors) {
        messageElements = document.querySelectorAll(selector);
        if (messageElements.length > 0) {
          console.log('[DeepSeekParser] Found messages with selector:', selector);
          break;
        }
      }
    }

    console.log('[DeepSeekParser] Found message elements:', messageElements.length);

    messageElements.forEach((messageEl, index) => {
      // Determine role based on presence of edit button
      // User messages have an edit button, assistant messages have other buttons but no edit
      let role = 'assistant'; // Default to assistant
      let hasEditButton = false;
      
      const classStr = messageEl.className.toLowerCase();
      const dataRole = messageEl.getAttribute('data-role');
      const dataAuthor = messageEl.getAttribute('data-author');
      const dataMessageAuthor = messageEl.getAttribute('data-message-author-role');
      
      // First check data attributes
      if (dataRole === 'user' || dataAuthor === 'user' || dataMessageAuthor === 'user') {
        role = 'user';
      } else if (dataRole === 'assistant' || dataAuthor === 'assistant' || dataMessageAuthor === 'assistant') {
        role = 'assistant';
      } else {
        // Check for edit button to identify user messages
        const buttons = messageEl.querySelectorAll('button');
        let buttonInfo = [];
        
        buttons.forEach(button => {
          const buttonText = button.textContent.toLowerCase().trim();
          const buttonTitle = (button.getAttribute('title') || '').toLowerCase();
          const buttonAriaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
          const svgUse = button.querySelector('use');
          const svgHref = svgUse ? svgUse.getAttribute('xlink:href') || svgUse.getAttribute('href') : '';
          
          buttonInfo.push({
            text: buttonText,
            title: buttonTitle,
            ariaLabel: buttonAriaLabel,
            svg: svgHref
          });
          
          if (buttonText.includes('edit') || buttonTitle.includes('edit') || buttonAriaLabel.includes('edit') || svgHref.includes('edit')) {
            hasEditButton = true;
          }
        });
        
        console.log(`[DeepSeekParser] Message ${index} buttons:`, buttonInfo);
        
        if (hasEditButton) {
          role = 'user';
        } else if (classStr.includes('user')) {
          role = 'user';
        } else if (classStr.includes('assistant') || classStr.includes('bot') || classStr.includes('ai')) {
          role = 'assistant';
        }
      }

      console.log(`[DeepSeekParser] Message ${index}: role=${role}, hasEditButton=${hasEditButton}, buttonCount=${messageEl.querySelectorAll('button').length}`);

      // Extract content
      const textContent = this.extractTextContent(messageEl);
      const codeBlocks = this.extractCodeBlocks(messageEl);
      const mathEquations = this.extractMathEquations(messageEl);

      messages.push({
        id: `deepseek-msg-${index}`,
        role,
        textContent,
        htmlContent: messageEl.innerHTML,
        codeBlocks,
        mathEquations,
        element: messageEl
      });
    });

    return messages;
  }

  /**
   * Extract text content from message element
   */
  extractTextContent(element) {
    const clone = element.cloneNode(true);
    
    // Remove script and style elements
    clone.querySelectorAll('script, style').forEach(el => el.remove());
    
    // Remove button elements
    clone.querySelectorAll('button').forEach(el => el.remove());
    
    // Remove any selection checkboxes added by extension
    clone.querySelectorAll('.ai-exporter-checkbox, [class*="ai-exporter"]').forEach(el => el.remove());
    
    return clone.textContent.trim();
  }

  /**
   * Extract code blocks from message
   */
  extractCodeBlocks(element) {
    const codeBlocks = [];
    const codeElements = element.querySelectorAll('pre code, pre');

    codeElements.forEach(codeEl => {
      const code = codeEl.textContent;
      let language = '';

      // Try to detect language from class name
      const classList = codeEl.className || (codeEl.parentElement && codeEl.parentElement.className) || '';
      const langMatch = classList.match(/language-(\w+)/i);
      if (langMatch) {
        language = langMatch[1];
      }

      // Try data-language attribute
      if (!language) {
        language = codeEl.getAttribute('data-language') || 
                   codeEl.getAttribute('data-lang') || '';
      }

      codeBlocks.push({
        code,
        language
      });
    });

    return codeBlocks;
  }

  /**
   * Extract math equations (KaTeX/MathJax)
   */
  extractMathEquations(element) {
    const equations = [];
    
    // KaTeX elements
    element.querySelectorAll('.katex, .katex-display').forEach(mathEl => {
      const isDisplay = mathEl.classList.contains('katex-display');
      const annotation = mathEl.querySelector('annotation');
      const latex = annotation ? annotation.textContent : mathEl.textContent;
      
      equations.push({
        latex,
        display: isDisplay
      });
    });

    // MathJax elements
    element.querySelectorAll('mjx-container, .MathJax').forEach(mathEl => {
      const isDisplay = mathEl.getAttribute('display') === 'block' || 
                       mathEl.style.display === 'block';
      const latex = mathEl.textContent;
      
      equations.push({
        latex,
        display: isDisplay
      });
    });

    // Look for LaTeX delimiters in text
    const text = element.textContent;
    const displayMatches = text.match(/\$\$(.*?)\$\$/g) || [];
    const inlineMatches = text.match(/\$([^$]+)\$/g) || [];

    displayMatches.forEach(match => {
      equations.push({
        latex: match.replace(/\$\$/g, ''),
        display: true
      });
    });

    inlineMatches.forEach(match => {
      if (!match.includes('$$')) { // Avoid double-counting display equations
        equations.push({
          latex: match.replace(/\$/g, ''),
          display: false
        });
      }
    });

    return equations;
  }
}
