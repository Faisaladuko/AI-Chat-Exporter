# Quick Test Guide

## Testing Your Improved AI Chat Exporter

### Prerequisites
- Chrome, Edge, or Firefox browser
- Access to ChatGPT (chat.openai.com)

---

## Installation Steps

### Chrome/Edge
1. Open Chrome/Edge
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle top-right)
4. Click **Load unpacked**
5. Select this folder: `AI Exporter`
6. Extension should appear in toolbar

### Firefox
1. Open Firefox
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select `manifest.json` from this folder
5. Extension loads temporarily

---

## Testing Checklist

### ✅ Basic Installation
- [ ] Extension loads without errors
- [ ] Icon appears in toolbar
- [ ] Clicking icon opens popup
- [ ] Popup displays correctly with gradient design

### ✅ Popup UI
- [ ] "Enable Selection Mode" button visible
- [ ] Format dropdown has 3 options (Markdown, Word, PDF)
- [ ] "Export Selected" button visible
- [ ] Footer text displays
- [ ] No console errors (F12 → Console)

### ✅ ChatGPT Selection
1. Go to chat.openai.com
2. Open any conversation
3. Click extension icon
4. Click "Enable Selection Mode"
5. Verify:
   - [ ] Banner appears: "Selection mode enabled"
   - [ ] Checkboxes appear on messages
   - [ ] Messages have dashed borders on hover
   - [ ] Clicking message toggles selection (green highlight)
   - [ ] Checkbox changes from ☐ to ☑
   - [ ] Banner shows selection count

### ✅ Selection Controls
- [ ] "Select All" button appears after enabling selection
- [ ] "Select All" selects all messages
- [ ] "Clear All" clears all selections
- [ ] Banner updates with correct count

### ✅ Export Functionality

#### Test Markdown Export
1. Select a few messages
2. Choose "Markdown" format
3. Click "Export Selected"
4. Verify:
   - [ ] File downloads (.md extension)
   - [ ] Filename includes conversation title and timestamp
   - [ ] File opens in text editor
   - [ ] Content has proper markdown formatting
   - [ ] Code blocks have ``` fencing
   - [ ] Headers are present

#### Test Word Export
1. Select messages
2. Choose "Word Document" format
3. Click "Export Selected"
4. Verify:
   - [ ] File downloads
   - [ ] Opens in browser or Word
   - [ ] Has professional styling
   - [ ] Code blocks have dark background
   - [ ] Headers and metadata visible

#### Test PDF Export
1. Select messages
2. Choose "PDF" format
3. Click "Export Selected"
4. Verify:
   - [ ] File downloads (.pdf or .html)
   - [ ] Opens correctly
   - [ ] Print-ready layout
   - [ ] Professional formatting

### ✅ Edge Cases

#### No Selection Export
1. Enable selection mode
2. Don't select any messages
3. Click "Export Selected"
4. Verify:
   - [ ] Prompt asks to export entire conversation
   - [ ] "OK" exports all messages
   - [ ] "Cancel" aborts export

#### Long Conversations
1. Test with conversation of 50+ messages
2. Verify:
   - [ ] All messages detected
   - [ ] Selection works smoothly
   - [ ] Export completes successfully
   - [ ] File size is reasonable

#### Special Content
Test messages containing:
- [ ] Code blocks (multiple languages)
- [ ] Math equations (if available)
- [ ] Lists (ordered and unordered)
- [ ] Links
- [ ] Bold and italic text
- [ ] Very long messages

### ✅ Console Checks
Open browser console (F12) and verify:
- [ ] No error messages
- [ ] Log messages show proper initialization
- [ ] Export logs show success

---

## Common Issues & Solutions

### Issue: Extension doesn't load
**Solution:** Check manifest.json syntax, ensure all files exist

### Issue: "Enable Selection" does nothing
**Solution:** 
- Check if on ChatGPT page (not homepage)
- Check console for errors
- Refresh page and try again

### Issue: No messages detected
**Solution:**
- Scroll through conversation to load messages
- ChatGPT UI might have changed - check selectors
- Refresh page

### Issue: Export fails
**Solution:**
- Check console errors
- Verify format selection
- Check browser download permissions

### Issue: Checkboxes not visible
**Solution:**
- Check content.css loaded
- Clear browser cache
- Reload extension

---

## Performance Testing

### Memory Usage
1. Open Task Manager/Activity Monitor
2. Find browser process
3. Enable selection on large conversation
4. Monitor memory - should stay reasonable

### Export Speed
- Small conversation (10 messages): < 1 second
- Medium conversation (50 messages): < 2 seconds
- Large conversation (100+ messages): < 5 seconds

---

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome (latest)
- [ ] Edge (latest)
- [ ] Firefox (latest)
- [ ] Brave (if available)

---

## Success Criteria

Extension is working correctly if:
✅ All checkboxes above are marked
✅ No console errors
✅ Exports download successfully
✅ Export files open and display correctly
✅ UI is responsive and smooth
✅ Selection feedback is clear

---

## Next Steps After Testing

If all tests pass:
1. ✅ Extension is ready to use!
2. 📢 Share with others
3. 🐛 Report any issues on GitHub
4. 🌟 Star the repository
5. 💡 Suggest improvements

If tests fail:
1. Note which tests failed
2. Check console for errors
3. Review relevant code files
4. Consult IMPROVEMENTS.md
5. Ask for help in GitHub Issues

---

## Need Help?

- 📖 Read [README.md](README.md) for full documentation
- 🎯 Check [USAGE.md](USAGE.md) for usage tips
- 🔧 Review [CONTRIBUTING.md](CONTRIBUTING.md) for development help
- 💬 Ask in GitHub Discussions

---

**Happy Testing! 🚀**

*Remember: This extension is privacy-first and works 100% offline!*
