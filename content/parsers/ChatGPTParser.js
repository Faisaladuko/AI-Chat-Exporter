/**
 * ChatGPT Parser - Handles parsing of ChatGPT conversations
 */
export class ChatGPTParser {
  constructor() {
    this.platformName = "chat.openai.com";
    this.selectors = {
      conversationContainer: 'main [class*="react-scroll-to-bottom"]',
      messageGroup: '[data-message-author-role]',
      userMessage: '[data-message-author-role="user"]',
      assistantMessage: '[data-message-author-role="assistant"]',
      messageContent: '.markdown, [class*="markdown"], .whitespace-pre-wrap',
      codeBlock: 'pre code, .code-block__code',
      conversationTitle: 'main h1, nav [class*="overflow-hidden"]'
    };
  }

  detectPlatform() {
    return window.location.hostname.includes(this.platformName);
  }

  getConversationTitle() {
    const titleElement = document.querySelector(this.selectors.conversationTitle);
    return titleElement ? titleElement.textContent.trim() : 'ChatGPT Conversation';
  }

  getMessages() {
    const messages = [];
    const messageElements = document.querySelectorAll(this.selectors.messageGroup);
    
    console.log(`[AI Exporter] Found ${messageElements.length} message elements`);
    
    messageElements.forEach((element, index) => {
      const role = element.getAttribute('data-message-author-role');
      const contentElement = element.querySelector(this.selectors.messageContent);
      
      if (contentElement || element.textContent.trim()) {
        const message = {
          id: `msg-${index}`,
          role: role,
          htmlContent: contentElement ? contentElement.innerHTML : element.innerHTML,
          textContent: this.extractTextContent(contentElement || element),
          codeBlocks: this.extractCodeBlocks(contentElement || element),
          mathEquations: [],
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
}