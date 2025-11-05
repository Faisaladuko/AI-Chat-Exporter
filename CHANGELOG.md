# Changelog

All notable changes to AI Chat Exporter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-02

### 🎉 Initial Release

#### Added
- **Core Functionality**
  - Selective message export with visual checkboxes
  - Support for ChatGPT platform parsing
  - Export to Markdown, DOCX (HTML), and PDF formats
  - Code block extraction and preservation
  - Math equation support (LaTeX)
  - Conversation metadata (title, date, platform)
  
- **User Interface**
  - Modern, gradient-styled popup UI
  - Visual selection feedback with hover effects
  - Banner notifications for user feedback
  - Select All and Clear All bulk operations
  - Format selection dropdown
  
- **Export Features**
  - Markdown export with proper code fencing and LaTeX
  - DOCX export as styled HTML document
  - PDF export as printable HTML
  - Automatic filename generation with timestamp
  - Conversation title extraction
  
- **Privacy & Security**
  - 100% offline operation
  - No external API calls
  - No data collection or telemetry
  - Local processing only
  
- **Code Quality**
  - Modular ES6 architecture
  - Comprehensive inline documentation
  - Error handling and user feedback
  - Clean separation of concerns

#### Technical Details
- Manifest V3 compliance
- ES6 module system
- BaseParser class for extensibility
- ChatGPT-specific parser implementation
- Content script injection
- Service worker background script

---

## [1.1.0] - 2025-11-05

### Added
- **Platform Support**
  - ✅ Grok (xAI) platform parser with full support
  - ✅ DeepSeek platform parser with edit-button-based role detection
  - ✅ Gemini (Google) platform parser with header integration
  - Platform-specific button injection and styling

- **UI Enhancements**
  - Floating export button that integrates into platform headers
  - ChatGPT: Button appears in header next to share button
  - Grok: Button integrates into native header
  - DeepSeek: Floating button on right side
  - Smart button behavior (enables selection or opens popup)
  - Automatic button recreation on page navigation
  - MutationObserver for single-page app navigation detection

- **Export Improvements**
  - Removed conversation titles from export output (cleaner format)
  - Removed User/Assistant role labels (only separator lines remain)
  - Streamlined export format for better readability

### Fixed
- DeepSeek message selection bug (was limited to 2 messages)
- Added unique message IDs for all platforms
- Selection counter now resets properly on navigation
- Button now appears instantly when switching conversations
- Banner and selection UI properly cleared on navigation

### Changed
- Button color scheme: Blue-purple gradient (#667eea to #764ba2)
- Export button opens popup directly when messages are selected
- Selection mode automatically enabled on first button click

## [Unreleased]

### Planned for v1.2
- [ ] Claude.ai platform support
- [ ] Gemini platform support
- [ ] Custom export templates
- [ ] Settings page with preferences
- [ ] Native DOCX format support (using docx.js)
- [ ] Improved PDF generation (using jsPDF)

### Planned for v1.2
- [ ] Image export support
- [ ] Export history
- [ ] Advanced filtering (by date, role, keywords)
- [ ] Custom CSS themes
- [ ] Keyboard shortcuts
- [ ] Browser sync for settings

### Planned for v2.0
- [ ] Cloud backup integration (optional)
- [ ] Collaborative annotations
- [ ] Advanced search within exports
- [ ] Export scheduling
- [ ] API for third-party integrations

---

## Version History

### Version Numbering
- **Major (X.0.0)**: Breaking changes or major feature additions
- **Minor (1.X.0)**: New features, platform support additions
- **Patch (1.0.X)**: Bug fixes, minor improvements

### Release Cycle
- Patch releases: As needed for critical bugs
- Minor releases: Every 2-3 months
- Major releases: Yearly or when significant changes occur

---

## Contributing

See [README.md](README.md) for contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.
