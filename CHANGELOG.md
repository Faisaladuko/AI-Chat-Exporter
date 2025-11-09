# Changelog

All notable changes to AI Chat Exporter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-09

### 🎉 Major UI Overhaul

#### Added
- **Three-Button Interface** - Replaced single export button with three dedicated buttons:
  - Word Export button (W icon)
  - PDF Export button (PDF text)
  - Settings button (⚙ icon)
- **Dynamic Export Button** - Green export button appears automatically when messages are selected
- **Settings Panel** - Comprehensive side panel with 7 configuration options:
  - Filename format customization
  - Document title override
  - Page margins (normal, narrow, moderate, wide)
  - Theme selection (light/dark)
  - Page orientation (portrait/landscape)
  - Page format (A4, Letter, Legal)
  - Compression toggle
- **Settings Persistence** - Uses Chrome Storage Sync API for cross-device settings
- **Theme Support** - Light and dark themes for both DOCX and PDF exports
- **Enhanced DOCX Export** - Theme-aware styling with customizable margins
- **Enhanced PDF Export** - Configurable page size, orientation, and margins
- **36x36px SVG Icons** - Larger, clearer icons for better visibility
- **DeepSeek Header Detection** - Improved button placement for DeepSeek platform

#### Changed
- Export workflow now requires format selection before message selection
- Settings are configured separately from export process
- DOCX export text alignment changed from justified to left-aligned
- Button styling now platform-specific with native integration
- Export button only appears when messages are selected

#### Removed
- Markdown export format (focused on DOCX and PDF only)
- Single-button export interface
- Inline format selection during export
- Unused background.js storage settings
- Unused popup.js format change event listener

#### Fixed
- DeepSeek button visibility (added header detection and fallback positioning)
- Icon size consistency across all platforms
- CSS styling issues with button containers

## [1.1.1] - 2025-11-09

### Removed
- Removed unused BaseParser.js file (parsers are now standalone)
- Removed unused MarkdownExporter.js file (feature not implemented)
- Removed development documentation files (FIX_APPLIED.md, FORMATTING_UPGRADE.md, IMPROVEMENTS.md, PROJECT_COMPLETE.md, TESTING.md, LIBRARIES.md)
- Removed Claude.ai references from manifest (not yet implemented)
- Removed duplicate utility functions from content.js (htmlToText, escapeHtml, duplicate sanitizeFilename)

### Changed
- Updated README.md with accurate file structure and removed outdated references
- Updated CONTRIBUTING.md with correct parser implementation examples
- Updated TROUBLESHOOTING.md with accurate code examples

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

### Planned Features
- [ ] Claude.ai platform support
- [ ] Poe.com platform support
- [ ] Image export support
- [ ] Custom export templates
- [ ] Native DOCX format support (using docx.js)
- [ ] Export history
- [ ] Advanced filtering (by date, role, keywords)
- [ ] Keyboard shortcuts

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
