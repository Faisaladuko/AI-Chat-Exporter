# 🤖 AI Chat Exporter

**Export your AI conversations with formatting, code, and math preserved** ✨

AI Chat Exporter is a powerful, privacy-focused browser extension that enables you to selectively export conversations from AI platforms like ChatGPT, Claude, Gemini, and Poe. Perfect for researchers, students, developers, and professionals who want to archive and reuse AI-generated insights.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Firefox-orange.svg)

---

## ✨ Features

### 🎯 Core Functionality
- **Selective Export** - Choose specific messages or export entire conversations
- **Multiple Formats** - Export as Markdown (.md), Word Document (.docx), or PDF
- **Format Preservation** - Maintains original formatting, lists, headings, and emphasis
- **Code Highlighting** - Preserves code blocks with language syntax information
- **Math Equations** - Extracts and preserves LaTeX mathematical equations
- **100% Offline** - Works completely offline with bundled libraries (no external API calls)

### 🔒 Privacy & Security
- **No Data Collection** - Zero telemetry or tracking
- **Fully Local Processing** - All processing happens on your device
- **No External APIs** - Does not send data to any external servers
- **Open Source** - Transparent and auditable code

### 🎨 User Experience
- **Intuitive Selection** - Visual checkboxes and hover effects for easy message selection
- **Smart Detection** - Automatically detects the platform you're on
- **Conversation Metadata** - Includes conversation title, date, and message count
- **Beautiful Exports** - Professional formatting in all export formats
- **Dark Mode Support** - Respects system dark mode preferences

### 🌐 Supported Platforms
- ✅ **ChatGPT** (OpenAI) - Full support with header integration
- ✅ **Grok** (xAI) - Full support with header integration
- ✅ **DeepSeek** - Full support with floating button
- ✅ **Gemini** (Google) - Full support with header integration
- 🚧 **Claude** (Anthropic) - Coming soon

---

## 📥 Installation

### Chrome/Edge (Chromium-based browsers)

1. **Download the Extension**
   - Clone or download this repository
   - Or download the latest release from GitHub

2. **Load Unpacked Extension**
   - Open Chrome/Edge and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the extension folder

3. **Pin the Extension** (Optional)
   - Click the puzzle icon in your browser toolbar
   - Find "AI Chat Exporter" and click the pin icon

### Firefox

1. **Download the Extension**
   - Clone or download this repository

2. **Load Temporary Add-on**
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the extension folder

---

## 🚀 Usage Guide

### Quick Start

1. **Navigate to a Supported Platform**
   - Open ChatGPT, Grok, or DeepSeek
   - Start or open a conversation

2. **Find the Export Button**
   - **ChatGPT/Grok**: Look for the purple gradient button in the header (next to the share button)
   - **DeepSeek**: Look for the floating button on the right side of the page
   - The button appears automatically and updates when you navigate between conversations

3. **Enable Selection Mode**
   - Click the export button (download arrow icon)
   - Messages will now have checkboxes for selection
   - A banner will show how many messages are available

4. **Select Messages**
   - Click on individual messages to select/deselect them
   - Selected messages will be highlighted in green with a checkmark
   - The banner updates to show your selection count

5. **Open Export Menu**
   - Click the export button again (now that messages are selected)
   - The extension popup will open automatically

6. **Choose Export Format**
   - Select your preferred format from the dropdown:
     - 📝 **Markdown** - Best for documentation, GitHub, note-taking apps
     - 📄 **Word Document** - For editing and sharing in Microsoft Word
     - 📋 **PDF** - For archiving and printing

7. **Export**
   - Click "Export Selected"
   - Your file will be downloaded automatically
   - The filename includes the conversation title and timestamp

### Advanced Features

#### Export Entire Conversation
If no messages are selected when you click "Export Selected", you'll be prompted to export the entire conversation.

#### Smart Button Behavior
- **First Click**: Enables selection mode if no messages are selected
- **Second Click**: Opens the export popup when messages are selected
- **Auto-Update**: Button automatically appears/disappears when navigating between conversations

#### Platform-Specific Integration
- **ChatGPT**: Button integrates into the native header next to the share button
- **Grok**: Button integrates into the native header with platform styling
- **DeepSeek**: Floating button on the right side (consistent position)

#### Bulk Operations
- Use "Select All" to select the entire conversation
- Use "Clear All" to deselect everything
- Click messages directly to toggle selection

#### Selection Tips
- Messages remain selected even if you scroll
- The banner shows the current selection count
- Selection resets when you navigate to a different conversation
- You can export multiple times with different selections

---

## 📁 Export Formats

### Markdown (.md)
- Clean, readable plain text format
- Preserves **bold**, *italic*, and `code` formatting
- Code blocks with language syntax highlighting
- Math equations in LaTeX format (`$...$` and `$$...$$`)
- Lists, headings, and blockquotes
- Perfect for: GitHub, Notion, Obsidian, VS Code

### Word Document (.docx)
- Styled HTML document (viewable in Word/browsers)
- Professional formatting with headers and styling
- Code blocks with dark background
- Syntax highlighting information
- Easy to edit and share
- Perfect for: Reports, assignments, presentations

### PDF
- High-quality HTML-based PDF export
- Professional layout optimized for printing
- Formatted code blocks and syntax information
- Maintains all formatting and structure
- Perfect for: Archiving, sharing, printing

---

## 🛠️ Technical Details

### Architecture

```
ai-exporter/
├── manifest.json          # Extension configuration
├── popup.html/js/css     # Extension popup UI
├── background.js         # Service worker
├── content/
│   ├── content.js        # Main content script
│   └── parsers/
│       ├── BaseParser.js     # Base parser class
│       └── ChatGPTParser.js  # ChatGPT-specific parser
├── exporter/
│   ├── exporter.js           # Main export router
│   ├── markdownExporter.js   # Markdown export logic
│   ├── docxExporter.js       # DOCX export logic
│   └── pdfExporter.js        # PDF export logic
├── styles/
│   ├── content.css       # Chat selection styling
│   └── popup.css         # Popup UI styling
└── libs/                 # Bundled offline libraries
```

### Key Technologies
- **ES6 Modules** - Modern JavaScript architecture
- **Chrome Extension Manifest V3** - Latest extension standard
- **HTML5/CSS3** - Modern web standards
- **Local Storage API** - For settings persistence

### Code Quality
- Modular architecture with separation of concerns
- Extensive inline documentation
- Error handling and user feedback
- Clean, maintainable code structure

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Adding Support for New Platforms

1. Create a new parser in `content/parsers/`:
```javascript
import BaseParser from "./BaseParser.js";

export default class YourPlatformParser extends BaseParser {
  constructor() {
    super("platform-domain.com", {
      userMessage: '.user-msg-selector',
      assistantMessage: '.ai-msg-selector'
    });
  }
  
  // Override methods as needed
}
```

2. Update `content/content.js` to detect the new platform
3. Add the domain to `manifest.json` content_scripts matches

### Reporting Issues
- Use GitHub Issues to report bugs
- Include browser version, platform, and steps to reproduce
- Screenshots are helpful!

### Feature Requests
- Open a GitHub Issue with the "enhancement" label
- Describe the use case and expected behavior

---

## 📋 Roadmap

### Version 1.1 (Q1 2026)
- [ ] Claude.ai full support
- [ ] Gemini full support
- [ ] Poe.com full support
- [ ] Custom export templates
- [ ] Batch export (multiple conversations)

### Version 1.2 (Q2 2026)
- [ ] Browser sync for settings
- [ ] Export history
- [ ] Advanced filtering options
- [ ] Custom CSS themes

### Version 2.0 (Q3 2026)
- [ ] Cloud backup integration (optional)
- [ ] Collaborative annotations
- [ ] Advanced search within exports

---

## ❓ FAQ

**Q: Does this extension send my data anywhere?**  
A: No! All processing happens locally on your device. The extension is fully offline and doesn't make any external network requests.

**Q: Why does the DOCX export open as HTML?**  
A: For simplicity and reliability, the current DOCX export creates a styled HTML document that can be opened in Word or any browser. A future update will add native DOCX format support.

**Q: Can I export private/confidential conversations?**  
A: Yes! Since everything is processed locally, your data never leaves your device. However, be mindful of where you store your exported files.

**Q: Does this work on mobile browsers?**  
A: Currently, the extension is designed for desktop browsers (Chrome, Edge, Firefox). Mobile support may be added in the future.

**Q: How do I customize the export formatting?**  
A: Custom templates are planned for a future release. For now, you can edit the exported Markdown or HTML files.

**Q: Can I export images from conversations?**  
A: Image export is not currently supported but is planned for a future release.

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- Inspired by the need to archive valuable AI conversations
- Built with ❤️ for the research and education community
- Thanks to all contributors and testers

---

## 📧 Contact & Support

- **GitHub Issues**: For bug reports and feature requests
- **Email**: [your-email@example.com]
- **Twitter**: [@yourhandle]

---

**Made with ❤️ for researchers, students, and professionals**

*Star ⭐ this repo if you find it useful!*