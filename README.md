# 🤖 AI Chat Exporter

**Export your AI conversations with formatting, code, and math preserved** ✨

AI Chat Exporter is a powerful, privacy-focused browser extension that enables you to selectively export conversations from AI platforms like ChatGPT, Gemini, Grok, and DeepSeek. Perfect for researchers, students, developers, and professionals who want to archive and reuse AI-generated insights.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Firefox-orange.svg)

---

## ✨ Features

### 🎯 Core Functionality
- **Selective Export** - Choose specific messages or export entire conversations
- **Two Export Formats** - Export as Word Document (.docx) or PDF
- **Format Preservation** - Maintains original formatting, lists, headings, and emphasis
- **Code Highlighting** - Preserves code blocks with language syntax information
- **Math Equations** - Extracts and preserves LaTeX mathematical equations
- **Advanced Settings** - Configure filename, title, margins, theme, orientation, page format, and compression
- **100% Offline** - Works completely offline with bundled libraries (no external API calls)

### 🔒 Privacy & Security
- **No Data Collection** - Zero telemetry or tracking
- **Fully Local Processing** - All processing happens on your device
- **No External APIs** - Does not send data to any external servers
- **Open Source** - Transparent and auditable code

### 🎨 User Experience
- **Three-Button Interface** - Separate buttons for Word export, PDF export, and Settings
- **Dynamic Export Button** - Appears when messages are selected for quick export
- **Settings Panel** - Side panel for configuring export options
- **Intuitive Selection** - Visual checkboxes and hover effects for easy message selection
- **Smart Detection** - Automatically detects the platform you're on
- **Conversation Metadata** - Includes conversation title, date, and message count
- **Beautiful Exports** - Professional formatting in all export formats
- **Theme Support** - Light and dark mode support in exports

### 🌐 Supported Platforms
- ✅ **ChatGPT** (OpenAI) - Full support with header integration
- ✅ **Grok** (xAI) - Full support with header integration
- ✅ **DeepSeek** - Full support with header/fallback positioning
- ✅ **Gemini** (Google) - Full support with header integration

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
   - Open ChatGPT, Grok, Gemini, or DeepSeek
   - Start or open a conversation

2. **Find the Export Buttons**
   - Look for three buttons in the platform header (or floating on the page):
     - **W** icon - Word Export
     - **PDF** text - PDF Export  
     - **⚙** icon - Settings
   - The buttons appear automatically when on a conversation page

3. **Configure Settings (Optional)**
   - Click the **Settings** button (⚙ icon)
   - Configure export options:
     - **Filename Format**: Custom filename pattern
     - **Document Title**: Override the conversation title
     - **Page Margins**: Adjust page margins (normal, narrow, moderate, wide)
     - **Theme**: Choose light or dark theme for exports
     - **Page Orientation**: Portrait or landscape
     - **Page Format**: A4, Letter, or Legal
     - **Enable Compression**: Reduce file size
   - Click **Save Settings** when done

4. **Enable Selection Mode**
   - Click the **Word** or **PDF** button to select export format
   - Messages will now have checkboxes for selection
   - A banner will show how many messages are available

5. **Select Messages**
   - Click on individual messages to select/deselect them
   - Selected messages will be highlighted in green with a checkmark
   - The banner updates to show your selection count
   - An **Export** button appears when messages are selected

6. **Export**
   - Click the green **Export** button that appears
   - Your file will be downloaded automatically in the chosen format
   - The filename follows your configured format with timestamp

### Advanced Features

#### Three-Button Interface
- **Word Button (W)**: Select Word export format and enable selection mode
- **PDF Button**: Select PDF export format and enable selection mode
- **Settings Button (⚙)**: Open settings panel to configure export options

#### Dynamic Export Button
- Appears automatically when you select messages
- Exports in the format you chose (Word or PDF)
- Disappears when no messages are selected

#### Export Settings
Access advanced export configuration through the Settings panel:
- **Custom Filenames**: Use patterns like `{title}_{date}` for organized exports
- **Document Customization**: Override titles and adjust formatting
- **Theme Control**: Export in light or dark theme regardless of platform theme
- **Page Layouts**: Choose paper size and orientation for optimal formatting
- **Compression**: Reduce file size for large conversations

#### Export Entire Conversation
If no messages are selected when you click Export, you'll be prompted to export the entire conversation.

#### Platform-Specific Integration
- **ChatGPT**: Buttons integrate into the native header next to share button
- **Grok**: Buttons integrate into the native header with platform styling
- **Gemini**: Buttons integrate into the native header with platform styling
- **DeepSeek**: Buttons appear in header or fixed position at top-right

#### Bulk Operations
- Use the extension popup to access "Select All" and "Clear All" buttons
- Click messages directly to toggle selection
- Selection persists while scrolling

#### Selection Tips
- Messages remain selected even if you scroll
- The banner shows the current selection count
- Selection resets when you navigate to a different conversation
- You can export multiple times with different selections or formats

---

## 📁 Export Formats

### Word Document (.docx)
- HTML-based document (viewable in Word/browsers)
- Professional formatting with customizable themes
- Code blocks with syntax highlighting information
- Configurable margins and page layout
- Light/dark theme support
- Easy to edit and share
- Perfect for: Reports, assignments, presentations

### PDF
- High-quality HTML-based PDF export
- Professional layout optimized for printing
- Configurable page size (A4, Letter, Legal)
- Portrait or landscape orientation
- Customizable margins
- Light/dark theme support
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
│   ├── parsers/
│   │   ├── ChatGPTParser.js  # ChatGPT-specific parser
│   │   ├── GrokParser.js     # Grok-specific parser
│   │   ├── DeepSeekParser.js # DeepSeek-specific parser
│   │   └── GeminiParser.js   # Gemini-specific parser
│   └── exporters/
│       ├── DOCXExporter.js   # DOCX export logic
│       └── PDFExporter.js    # PDF export logic
├── styles/
│   ├── content.css       # Chat selection styling
│   └── popup.css         # Popup UI styling
└── libs/                 # Bundled offline libraries
```

### Key Technologies
- **ES6 Modules** - Modern JavaScript architecture
- **Chrome Extension Manifest V3** - Latest extension standard
- **Chrome Storage Sync API** - For persistent settings across devices
- **HTML5/CSS3** - Modern web standards
- **SVG Icons** - Scalable vector graphics for crisp button icons

### Export Settings
Settings are stored using Chrome's Storage Sync API and include:
- **filename**: Custom filename pattern
- **documentTitle**: Override conversation title
- **pageMargins**: normal, narrow, moderate, or wide
- **theme**: light or dark
- **orientation**: portrait or landscape
- **pageFormat**: A4, Letter, or Legal
- **enableCompression**: Boolean for file size reduction

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
export class YourPlatformParser {
  constructor() {
    this.platformName = "platform-domain.com";
    this.selectors = {
      userMessage: '.user-msg-selector',
      assistantMessage: '.ai-msg-selector'
    };
  }
  
  detectPlatform() {
    return window.location.hostname.includes(this.platformName);
  }
  
  getMessages() {
    // Implement message extraction logic
  }
}
```

2. Update `content/content.js` to detect and load the new platform parser
3. Add the domain to `manifest.json` content_scripts matches and web_accessible_resources

### Reporting Issues
- Use GitHub Issues to report bugs
- Include browser version, platform, and steps to reproduce
- Screenshots are helpful!

### Feature Requests
- Open a GitHub Issue with the "enhancement" label
- Describe the use case and expected behavior

---

## 📋 Roadmap

### Future Enhancements
- [ ] Claude.ai support
- [ ] Poe.com support
- [ ] Image export support
- [ ] Custom export templates
- [ ] Batch export (multiple conversations)
- [ ] Export history
- [ ] Advanced filtering options

---

## ❓ FAQ

**Q: Does this extension send my data anywhere?**  
A: No! All processing happens locally on your device. The extension is fully offline and doesn't make any external network requests.

**Q: Why does the DOCX export open as HTML?**  
A: The DOCX export creates a styled HTML document that can be opened in Word or any browser. This ensures maximum compatibility and preserves all formatting.

**Q: Can I export private/confidential conversations?**  
A: Yes! Since everything is processed locally, your data never leaves your device. However, be mindful of where you store your exported files.

**Q: Does this work on mobile browsers?**  
A: Currently, the extension is designed for desktop browsers (Chrome, Edge, Firefox). Mobile support may be added in the future.

**Q: How do I change export settings?**  
A: Click the Settings button (⚙ icon) in the button group to open the settings panel, where you can configure all export options.

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
- **Email**: [faisaladuko@gmail.com]
- **Twitter**: [@adukobility]

---

**Made with ❤️ for researchers, students, and professionals**

*Star ⭐ this repo if you find it useful!*