// Function to update selection count
async function updateSelectionCount() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (typeof window.getSelectionCount === 'function') {
          return window.getSelectionCount();
        }
        return 0;
      }
    });
    
    if (results && results[0]) {
      const count = results[0].result || 0;
      const countElement = document.getElementById("selectionCount");
      if (countElement) {
        countElement.textContent = `${count} message${count !== 1 ? 's' : ''} selected`;
      }
    }
  } catch (error) {
    console.error("Error updating selection count:", error);
  }
}

// Check if selection mode is already active when popup opens
(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Check if selection mode is actually enabled (banner exists)
        const banner = document.querySelector('.ai-exporter-banner');
        return banner !== null && typeof window.getSelectionCount === 'function';
      }
    });
    
    const isActive = results && results[0] && results[0].result;
    
    if (isActive) {
      // Selection mode is already active, show controls and update count
      document.getElementById("selectionControls").style.display = "flex";
      document.getElementById("enableSelect").textContent = "✓ Selection Enabled";
      document.getElementById("enableSelect").classList.add("success");
      updateSelectionCount();
    }
  } catch (error) {
    console.log("Could not check selection mode status:", error);
  }
})();

// Enable Selection Mode
document.getElementById("enableSelect").addEventListener("click", async () => {
  const btn = document.getElementById("enableSelect");
  btn.disabled = true;
  btn.textContent = "Enabling...";
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we're on a supported page (ChatGPT, Gemini, Grok, DeepSeek)
    const supportedSites = ['chat.openai.com', 'chatgpt.com', 'gemini.google.com', 'grok.com', 'chat.deepseek.com'];
    const isSupported = supportedSites.some(site => tab.url && tab.url.includes(site));
    
    if (!isSupported) {
      alert('Please navigate to a supported AI chat platform first!\n\nSupported: ChatGPT, Gemini, Grok, DeepSeek');
      btn.textContent = "Enable Selection Mode";
      btn.disabled = false;
      return;
    }
    
    // Check if content script is already loaded
    let results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return typeof window.enableChatSelection === 'function';
      }
    });
    
    const isLoaded = results && results[0] && results[0].result;
    
    // If not loaded, inject the content script
    if (!isLoaded) {
      console.log('[AI Exporter] Content script not loaded, injecting...');
      
      // Inject CSS
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['styles/content.css']
      });
      
      // Inject content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
      
      // Wait a moment for initialization
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Now enable selection
    results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (typeof window.enableChatSelection === 'function') {
          window.enableChatSelection();
          return { success: true };
        } else {
          return { success: false, error: 'Function not found' };
        }
      }
    });
    
    if (results && results[0] && results[0].result && results[0].result.success) {
      // Show selection controls
      document.getElementById("selectionControls").style.display = "flex";
      btn.textContent = "✓ Selection Enabled";
      btn.classList.add("success");
      
      // Update selection count
      updateSelectionCount();
      
      setTimeout(() => {
        btn.disabled = false;
      }, 1000);
    } else {
      throw new Error('Failed to enable selection mode');
    }
  } catch (error) {
    console.error("Error enabling selection:", error);
    btn.textContent = "Enable Selection Mode";
    btn.disabled = false;
    alert("Error: " + error.message + "\n\nPlease:\n1. Refresh the ChatGPT page\n2. Make sure you're on a conversation page\n3. Try again");
  }
});

// Select All Messages
document.getElementById("selectAll").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.selectAllMessages()
  });
  
  // Update count after a short delay
  setTimeout(updateSelectionCount, 100);
});

// Clear Selection
document.getElementById("clearSelection").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.clearSelection()
  });
  
  // Update count after a short delay
  setTimeout(updateSelectionCount, 100);
});

// Export Selected Messages
document.getElementById("export").addEventListener("click", async () => {
  const format = document.getElementById("format").value;
  const btn = document.getElementById("export");
  const originalText = btn.innerHTML;
  
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span> Exporting...';
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (fmt) => window.exportSelectedChats(fmt),
      args: [format]
    });
    
    btn.innerHTML = '<span class="btn-icon">✓</span> Exported!';
    btn.classList.add("success");
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      btn.classList.remove("success");
    }, 2000);
  } catch (error) {
    console.error("Export error:", error);
    btn.innerHTML = originalText;
    btn.disabled = false;
    alert("Export failed. Please try again.");
  }
});