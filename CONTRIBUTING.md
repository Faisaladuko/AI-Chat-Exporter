# Contributing to AI Chat Exporter

Thank you for your interest in contributing! 🎉

We welcome contributions from the community to make AI Chat Exporter better for everyone.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Adding Platform Support](#adding-platform-support)
- [Coding Guidelines](#coding-guidelines)
- [Submitting Changes](#submitting-changes)

---

## Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers and beginners
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior
- Harassment or discriminatory language
- Trolling or insulting comments
- Publishing others' private information
- Any conduct that could be considered unprofessional

---

## How Can I Contribute?

### 🐛 Reporting Bugs
1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/ai-chat-exporter/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser version and OS
   - Extension version

### 💡 Suggesting Features
1. Check existing [Issues](https://github.com/yourusername/ai-chat-exporter/issues) and [Discussions](https://github.com/yourusername/ai-chat-exporter/discussions)
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Potential implementation approach
   - Any relevant examples or mockups

### 📝 Improving Documentation
- Fix typos or clarify instructions
- Add examples or use cases
- Improve code comments
- Translate documentation

### 💻 Contributing Code
See [Development Setup](#development-setup) below

---

## Development Setup

### Prerequisites
- Node.js (for development tools, optional)
- A Chromium-based browser (Chrome, Edge) or Firefox
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. **Fork the Repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/ai-chat-exporter.git
   cd ai-chat-exporter
   ```

2. **Load Extension in Browser**
   - Chrome/Edge: Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

3. **Make Changes**
   - Edit the code
   - Refresh the extension in `chrome://extensions/`
   - Test your changes

### Project Structure
```
ai-exporter/
├── manifest.json          # Extension config
├── popup.html/js/css     # Extension UI
├── background.js         # Service worker
├── content/
│   ├── content.js        # Main content script
│   └── parsers/          # Platform parsers
├── exporter/             # Export logic
├── styles/               # CSS files
└── libs/                 # Third-party libraries
```

---

## Adding Platform Support

Want to add support for Claude, Gemini, or another AI platform? Follow these steps:

### 1. Create a Parser Class

Create `content/parsers/YourPlatformParser.js`:

```javascript
import BaseParser from "./BaseParser.js";

export default class YourPlatformParser extends BaseParser {
  constructor() {
    super("platform-domain.com", {
      userMessage: '.user-message-selector',
      assistantMessage: '.ai-message-selector',
      conversationTitle: 'h1.title'
    });
  }

  /**
   * Override this to customize title extraction
   */
  getConversationTitle() {
    const titleEl = document.querySelector(this.selectors.conversationTitle);
    return titleEl ? titleEl.textContent.trim() : 'AI Conversation';
  }

  /**
   * Override this for complex message structures
   */
  getMessages() {
    // Your custom logic here
    return super.getMessages();
  }

  /**
   * Override for platform-specific code block extraction
   */
  extractCodeBlocks(element) {
    // Your custom logic
    return super.extractCodeBlocks(element);
  }
}
```

### 2. Update Content Script

In `content/content.js`, add detection:

```javascript
function initializeParser() {
  const hostname = window.location.hostname;
  
  if (hostname.includes('chat.openai.com')) {
    parser = new ChatGPTParser();
  } else if (hostname.includes('your-platform.com')) {
    parser = new YourPlatformParser();
  }
  // ... other platforms
  
  return parser;
}
```

### 3. Update Manifest

Add the domain to `manifest.json`:

```json
{
  "content_scripts": [
    {
      "matches": [
        "https://chat.openai.com/*",
        "https://your-platform.com/*"
      ],
      // ...
    }
  ],
  "host_permissions": [
    "https://your-platform.com/*"
  ]
}
```

### 4. Test Thoroughly
- Test message selection
- Test all export formats
- Test with various conversation types
- Test code blocks and special formatting
- Test edge cases (empty messages, very long conversations)

---

## Coding Guidelines

### JavaScript Style
- Use ES6+ features (const/let, arrow functions, async/await)
- Use descriptive variable names
- Add JSDoc comments for functions
- Handle errors gracefully
- Log important actions to console

### Example:
```javascript
/**
 * Extract code blocks from an element
 * @param {HTMLElement} element - The element to search
 * @returns {Array<Object>} Array of code block objects
 */
extractCodeBlocks(element) {
  if (!element) return [];
  
  const codeBlocks = [];
  // ... implementation
  return codeBlocks;
}
```

### CSS Style
- Use clear, descriptive class names
- Prefix extension classes with `ai-exporter-`
- Use CSS variables for colors
- Support dark mode when possible
- Add comments for complex sections

### HTML Style
- Use semantic HTML5 elements
- Add ARIA labels for accessibility
- Keep structure clean and organized
- Use consistent indentation

---

## Submitting Changes

### Pull Request Process

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make Your Changes**
   - Write clean, documented code
   - Follow coding guidelines
   - Test thoroughly

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "Add: Brief description of changes"
   ```
   
   Commit message prefixes:
   - `Add:` New features
   - `Fix:` Bug fixes
   - `Update:` Updates to existing features
   - `Refactor:` Code refactoring
   - `Docs:` Documentation changes

4. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template:
     - Description of changes
     - Related issue number
     - Testing performed
     - Screenshots if UI changes

### PR Requirements
- [ ] Code follows style guidelines
- [ ] Comments and documentation updated
- [ ] Tested in Chrome/Edge
- [ ] No console errors
- [ ] Backward compatible (or breaking changes documented)

---

## Getting Help

- 💬 [GitHub Discussions](https://github.com/yourusername/ai-chat-exporter/discussions) - Ask questions
- 🐛 [GitHub Issues](https://github.com/yourusername/ai-chat-exporter/issues) - Report bugs
- 📧 Email: faisaladuko@gmail.com

---

## Recognition

All contributors will be:
- Listed in README.md
- Credited in release notes
- Part of an amazing community!

Thank you for helping make AI Chat Exporter better! 🚀
