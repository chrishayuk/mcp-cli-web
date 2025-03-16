/**
 * js/canvas/content-tab-manager.js
 * 
 * Creates dedicated tabs for different content with proper capitalization.
 * Works with ChatImageHandler and ChatCodeHandler objects.
 * Fixed to properly display content in tabs.
 */

// Self-executing function to avoid polluting global scope
(function() {
    console.log("Content Tab Manager: Starting initialization");
    
    // Content tabs storage
    const contentTabs = {
      images: {},
      code: {}
    };
    
    // Original handler references
    let originalSendImage = null;
    let originalSendCode = null;
    
    // Initialize with a delay to ensure handlers are loaded
    document.addEventListener('DOMContentLoaded', function() {
      // Try several times with increasing delays
      setTimeout(initTabManager, 1000);
      setTimeout(checkAndRetryInit, 3000);
      setTimeout(checkAndRetryInit, 6000);
    });
    
    // Main initialization function
    function initTabManager() {
      console.log("Content Tab Manager: Setting up hooks");
      
      // Hook into ChatImageHandler (use correct capitalization!)
      if (window.ChatImageHandler && typeof window.ChatImageHandler.sendImageToCanvas === 'function') {
        // Store original method if not already stored
        if (!originalSendImage) {
          originalSendImage = window.ChatImageHandler.sendImageToCanvas;
        }
        
        // Replace with our enhanced version
        window.ChatImageHandler.sendImageToCanvas = function(url) {
          console.log(`Content Tab Manager: Processing image URL: ${url.substring(0, 30)}...`);
          
          // Create or activate a tab for this image
          createTabForImage(url);
          
          // We don't need to call the original function anymore
          // The createTabForImage function will handle displaying the image
          return true;
        };
        
        console.log("Content Tab Manager: Successfully hooked into ChatImageHandler");
      } else {
        console.warn("Content Tab Manager: ChatImageHandler not available yet");
      }
      
      // Hook into ChatCodeHandler (use correct capitalization!)
      if (window.ChatCodeHandler && typeof window.ChatCodeHandler.sendCodeToEditor === 'function') {
        // Store original method if not already stored
        if (!originalSendCode) {
          originalSendCode = window.ChatCodeHandler.sendCodeToEditor;
        }
        
        // Replace with our enhanced version
        window.ChatCodeHandler.sendCodeToEditor = function(code, language) {
          console.log(`Content Tab Manager: Processing code in ${language || 'unknown'}`);
          
          // Create or activate a tab for this code
          createTabForCode(code, language);
          
          // We don't need to call the original function anymore
          // The createTabForCode function will handle displaying the code
          return true;
        };
        
        console.log("Content Tab Manager: Successfully hooked into ChatCodeHandler");
      } else {
        console.warn("Content Tab Manager: ChatCodeHandler not available yet");
      }
      
      console.log("Content Tab Manager: Initialization complete");
    }
    
    // Check if initialization was successful and retry if needed
    function checkAndRetryInit() {
      let needsRetry = false;
      
      // Check if image handler is hooked
      if (window.ChatImageHandler && 
          typeof window.ChatImageHandler.sendImageToCanvas === 'function' &&
          window.ChatImageHandler.sendImageToCanvas.toString().indexOf('Content Tab Manager') === -1) {
        console.log("Content Tab Manager: ChatImageHandler needs hooking");
        needsRetry = true;
      }
      
      // Check if code handler is hooked
      if (window.ChatCodeHandler && 
          typeof window.ChatCodeHandler.sendCodeToEditor === 'function' &&
          window.ChatCodeHandler.sendCodeToEditor.toString().indexOf('Content Tab Manager') === -1) {
        console.log("Content Tab Manager: ChatCodeHandler needs hooking");
        needsRetry = true;
      }
      
      // If either needs hooking, try again
      if (needsRetry) {
        console.log("Content Tab Manager: Retrying initialization");
        initTabManager();
      }
    }
    
    /**
     * Create or activate a tab for an image URL
     */
    function createTabForImage(url) {
      if (!window.Commands || !window.Commands.canvasManager) {
        console.error("Content Tab Manager: Canvas manager not available");
        return;
      }
      
      const cm = window.Commands.canvasManager;
      
      // Check if we already have a tab for this URL
      if (contentTabs.images[url]) {
        const existingTabId = contentTabs.images[url];
        console.log(`Content Tab Manager: Reusing existing tab ${existingTabId} for image`);
        
        // Activate the existing tab
        cm.activateCanvas(existingTabId);
        
        // Ensure the image module is activated
        cm.activateModule('image');
        
        // Re-display the image in this tab
        setTimeout(() => {
          displayImageInCurrentTab(url);
        }, 50);
      } else {
        // Create a new tab for this image
        const tabId = `img-${Date.now()}`;
        const filename = getFilenameFromUrl(url);
        const tabTitle = `Image: ${filename}`;
        
        console.log(`Content Tab Manager: Creating new tab "${tabTitle}" for image`);
        
        // Create the tab
        cm.addNewCanvas(tabTitle, tabId, true);
        
        // Store the tab ID for this URL
        contentTabs.images[url] = tabId;
        
        // Activate the image module
        cm.activateModule('image');
        
        // Display the image in this new tab with a slight delay to ensure module is ready
        setTimeout(() => {
          displayImageInCurrentTab(url);
        }, 50);
      }
      
      // Ensure the canvas section is expanded
      cm.expandCanvasSection();
    }
    
    /**
     * Create or activate a tab for code
     */
    function createTabForCode(code, language) {
      if (!window.Commands || !window.Commands.canvasManager) {
        console.error("Content Tab Manager: Canvas manager not available");
        return;
      }
      
      const cm = window.Commands.canvasManager;
      
      // Create a hash for this code
      const codeHash = hashCode(code);
      
      // Check if we already have a tab for this code
      if (contentTabs.code[codeHash]) {
        const existingTabId = contentTabs.code[codeHash];
        console.log(`Content Tab Manager: Reusing existing tab ${existingTabId} for code`);
        
        // Activate the existing tab
        cm.activateCanvas(existingTabId);
        
        // Ensure the code module is activated
        cm.activateModule('code');
        
        // Re-display the code in this tab
        setTimeout(() => {
          displayCodeInCurrentTab(code, language);
        }, 50);
      } else {
        // Create a new tab for this code
        const tabId = `code-${Date.now()}`;
        const langDisplay = language || 'code';
        const codePreview = getCodePreview(code);
        const tabTitle = `${langDisplay}: ${codePreview}`;
        
        console.log(`Content Tab Manager: Creating new tab "${tabTitle}" for code`);
        
        // Create the tab
        cm.addNewCanvas(tabTitle, tabId, true);
        
        // Store the tab ID for this code hash
        contentTabs.code[codeHash] = tabId;
        
        // Activate the code module
        cm.activateModule('code');
        
        // Display the code in this new tab with a slight delay to ensure module is ready
        setTimeout(() => {
          displayCodeInCurrentTab(code, language);
        }, 50);
      }
      
      // Ensure the canvas section is expanded
      cm.expandCanvasSection();
    }
    
    /**
     * Display image in the current active tab
     */
    function displayImageInCurrentTab(url) {
      const cm = window.Commands.canvasManager;
      
      // Get the image module
      const imageModule = cm.getModule('image');
      if (!imageModule) {
        console.error("Content Tab Manager: Image module not found");
        return;
      }
      
      // Display the image using the appropriate method
      console.log(`Content Tab Manager: Displaying image in current tab: ${url.substring(0, 30)}...`);
      
      if (typeof imageModule.displayImage === 'function') {
        imageModule.displayImage(url);
      } else if (typeof imageModule.handleCommand === 'function') {
        imageModule.handleCommand('display', [url]);
      } else {
        console.error("Content Tab Manager: No suitable method found to display image");
      }
    }
    
    /**
     * Display code in the current active tab
     */
    function displayCodeInCurrentTab(code, language) {
      const cm = window.Commands.canvasManager;
      
      // Get the code module
      const codeModule = cm.getModule('code');
      if (!codeModule) {
        console.error("Content Tab Manager: Code module not found");
        return;
      }
      
      // Display the code using the appropriate method
      console.log(`Content Tab Manager: Displaying code in current tab: ${getCodePreview(code)}`);
      
      if (typeof codeModule.displayCode === 'function') {
        codeModule.displayCode(code, language);
      } else if (typeof codeModule.handleCommand === 'function') {
        codeModule.handleCommand('display', [code, language]);
      } else {
        console.error("Content Tab Manager: No suitable method found to display code");
      }
    }
    
    /**
     * Extract a filename from a URL
     */
    function getFilenameFromUrl(url) {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        let filename = pathParts[pathParts.length - 1] || 'image';
        
        // Remove query params
        filename = filename.split('?')[0];
        
        // Truncate if too long
        if (filename.length > 15) {
          filename = filename.substring(0, 12) + '...';
        }
        
        return filename;
      } catch (e) {
        // URL parsing failed
        return 'image';
      }
    }
    
    /**
     * Get a preview of code content
     */
    function getCodePreview(code, maxLength = 12) {
      if (!code) return 'empty';
      
      // Remove newlines and excessive whitespace
      const cleaned = code.replace(/\s+/g, ' ').trim();
      
      // Truncate if needed
      if (cleaned.length > maxLength) {
        return cleaned.substring(0, maxLength) + '...';
      }
      
      return cleaned;
    }
    
    /**
     * Simple hash function for strings
     */
    function hashCode(str) {
      let hash = 0;
      if (!str || str.length === 0) return hash.toString();
      
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      return Math.abs(hash).toString(36);
    }
    
    // Expose functions globally
    window.contentTabManager = {
      getTabsInfo: function() {
        return {
          imageTabs: Object.keys(contentTabs.images).length,
          codeTabs: Object.keys(contentTabs.code).length
        };
      },
      
      resetTabs: function() {
        contentTabs.images = {};
        contentTabs.code = {};
        console.log("Content Tab Manager: All tabs reset");
        return true;
      },
      
      reinstall: function() {
        initTabManager();
        return true;
      },
      
      // Add method to test displaying content directly
      testDisplay: function(content, type, language) {
        if (type === 'image') {
          createTabForImage(content);
        } else if (type === 'code') {
          createTabForCode(content, language || 'javascript');
        }
      }
    };
  })();