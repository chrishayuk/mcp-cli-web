/**
 * content-tab-manager.js - Enhanced with fixes for image and code displays
 * 
 * This script fixes issues with displaying content in tabs, particularly
 * focusing on the image display problems.
 */

// Self-executing function to avoid polluting global scope and prevent duplicate declarations
(function() {
  console.log("Content Tab Manager: Starting initialization");
  
  // Content tabs storage
  const contentTabs = {
    images: {},
    code: {}
  };
  
  // Original handler references (safely store these)
  let originalSendImage = null;
  let originalSendCode = null;
  
  // Debug log function with timestamp
  function debugLog(message, data) {
    const timestamp = new Date().toISOString().substr(11, 12);
    if (data !== undefined) {
      console.log(`[${timestamp}] DEBUG - ${message}`, data);
    } else {
      console.log(`[${timestamp}] DEBUG - ${message}`);
    }
  }
  
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
        
        // Return true to indicate successful handling
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
        
        // Return true to indicate successful handling
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
    debugLog("Creating tab for image:", url);
    
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
        
        // Check DOM after display attempt
        setTimeout(() => checkImageInDOM(existingTabId, url), 300);
      }, 300);
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
      
      // Use longer timeouts to ensure everything is ready
      setTimeout(() => {
        // Activate the image module
        cm.activateModule('image');
        
        // Display the image in this new tab with a slight delay to ensure module is ready
        setTimeout(() => {
          displayImageInCurrentTab(url);
          
          // Check DOM after display attempt
          setTimeout(() => checkImageInDOM(tabId, url), 300);
        }, 300);
      }, 300);
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
      }, 300);
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
      
      // First, ensure the tab is fully activated
      setTimeout(() => {
        // Then activate the code module
        cm.activateModule('code');
        
        // Finally, display the code after the module is fully activated
        setTimeout(() => {
          displayCodeInCurrentTab(code, language);
        }, 200);
      }, 200);
    }
    
    // Ensure the canvas section is expanded
    cm.expandCanvasSection();
  }
  
  /**
   * Display image in the current active tab
   */
  function displayImageInCurrentTab(url) {
    debugLog("Displaying image:", url);
    
    if (!window.Commands || !window.Commands.canvasManager) {
      console.error("Content Tab Manager: Canvas manager not available");
      return;
    }
    
    const cm = window.Commands.canvasManager;
    
    // Get the active canvas ID for logging
    const activeCanvasId = cm.activeCanvasId;
    console.log(`Content Tab Manager: Displaying image in canvas ${activeCanvasId}`);
    
    // Get the image module
    const imageModule = cm.getModule('image');
    if (!imageModule) {
      console.error("Content Tab Manager: Image module not found");
      
      // Fallback to original handler if available
      if (originalSendImage) {
        console.log("Content Tab Manager: Falling back to original image handler");
        return originalSendImage(url);
      }
      return;
    }
    
    // Simply delegate to the image module's methods for displaying the image
    try {
      console.log(`Content Tab Manager: Delegating image display to module: ${url.substring(0, 30)}...`);
      
      if (typeof imageModule.displayImage === 'function') {
        debugLog("Using displayImage method");
        imageModule.displayImage(url);
      } else if (typeof imageModule.handleCommand === 'function') {
        debugLog("Using handleCommand method");
        imageModule.handleCommand('display', [url]);
      } else if (typeof imageModule.loadImage === 'function') {
        debugLog("Using loadImage method");
        imageModule.loadImage(url);
      } else {
        console.error("Content Tab Manager: No suitable method found to display image");
        
        // Fallback to original handler if available
        if (originalSendImage) {
          console.log("Content Tab Manager: Falling back to original image handler");
          return originalSendImage(url);
        }
      }
    } catch (err) {
      console.error("Content Tab Manager: Error delegating image display:", err);
      
      // Fallback to original handler if available
      if (originalSendImage) {
        console.log("Content Tab Manager: Falling back to original image handler");
        originalSendImage(url);
      }
    }
  }
  
  /**
   * Display code in the current active tab
   */
  function displayCodeInCurrentTab(code, language) {
    if (!window.Commands || !window.Commands.canvasManager) {
      console.error("Content Tab Manager: Canvas manager not available");
      return;
    }
    
    const cm = window.Commands.canvasManager;
    
    // Get the active canvas ID
    const activeCanvasId = cm.activeCanvasId;
    
    // Get the code module
    const codeModule = cm.getModule('code');
    
    if (!codeModule) {
      console.error("Content Tab Manager: Code module not found");
      return;
    }
    
    // Ensure the code is a string
    if (typeof code !== 'string') {
      code = String(code);
    }
    
    // Find the container for the current canvas if possible
    if (activeCanvasId) {
      const container = document.querySelector(`.ide-code-container[data-canvas-id="${activeCanvasId}"]`);
      if (container) {
        console.log(`Content Tab Manager: Found container for canvas ${activeCanvasId}`);
        
        // If code module has a container property, update it to use the correct one
        if (codeModule.container) {
          codeModule.container = container;
          console.log(`Content Tab Manager: Updated code module container for ${activeCanvasId}`);
        }
      }
    }
    
    // Display the code using the appropriate method
    console.log(`Content Tab Manager: Displaying code in current tab: ${getCodePreview(code)}`);
    
    try {
      if (typeof codeModule.displayCode === 'function') {
        codeModule.displayCode(code, language);
      } else if (typeof codeModule.handleCommand === 'function') {
        codeModule.handleCommand('display', [code, language]);
      } else {
        console.error("Content Tab Manager: No suitable method found to display code");
      }
    } catch (err) {
      console.error("Content Tab Manager: Error displaying code:", err);
      // Fallback to original handler if available
      if (originalSendCode) {
        console.log("Content Tab Manager: Trying fallback to original code handler");
        originalSendCode(code, language);
      }
    }
  }
  
  /**
   * Check if the image is actually visible in the DOM and fix if needed
   */
  function checkImageInDOM(canvasId, url) {
    debugLog("Checking image in DOM for canvas:", canvasId);
    
    const canvasElement = document.querySelector(`.canvas-instance[data-canvas-id="${canvasId}"]`);
    if (!canvasElement) {
      debugLog("Canvas element not found in DOM!");
      return;
    }
    
    // Look for different types of image containers
    const imageContainer = canvasElement.querySelector('.image-container, .html-image-container');
    const imageElement = canvasElement.querySelector('img');
    const canvas = canvasElement.querySelector('canvas');
    const instructionsElement = canvasElement.querySelector('.instructions-overlay');
    
    debugLog("DOM elements found:", {
      hasImageContainer: !!imageContainer,
      hasImageElement: !!imageElement,
      hasCanvas: !!canvas,
      hasInstructions: !!instructionsElement
    });
    
    // First fix: Make sure instructions are hidden
    if (instructionsElement) {
      instructionsElement.style.display = 'none';
      debugLog("Hidden instructions overlay");
    }
    
    // Handle case where image container exists
    if (imageContainer) {
      // Apply visibility fixes
      imageContainer.style.display = 'block';
      imageContainer.style.visibility = 'visible';
      imageContainer.style.opacity = '1';
      imageContainer.style.zIndex = '10';
      imageContainer.style.position = 'absolute';
      imageContainer.style.top = '0';
      imageContainer.style.left = '0';
      imageContainer.style.width = '100%';
      imageContainer.style.height = '100%';
      
      debugLog("Applied visibility fixes to image container");
      
      // Also make sure any images inside are visible
      const images = imageContainer.querySelectorAll('img');
      images.forEach(img => {
        img.style.display = 'block';
        img.style.visibility = 'visible';
        img.style.opacity = '1';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.margin = 'auto';
        img.style.objectFit = 'contain';
      });
      
      // If no images found in container, but we have a URL, add image
      if (images.length === 0 && url) {
        // Create image
        const newImage = document.createElement('img');
        newImage.src = url;
        newImage.style.maxWidth = '100%';
        newImage.style.maxHeight = '100%';
        newImage.style.objectFit = 'contain';
        newImage.style.display = 'block';
        newImage.style.margin = 'auto';
        
        // Add to container
        imageContainer.appendChild(newImage);
        
        debugLog("Created new image element in existing container");
      }
    } 
    // Handle case where image element exists directly in canvas instance
    else if (imageElement) {
      imageElement.style.display = 'block';
      imageElement.style.visibility = 'visible';
      imageElement.style.opacity = '1';
      imageElement.style.maxWidth = '100%';
      imageElement.style.maxHeight = '100%';
      imageElement.style.margin = 'auto';
      imageElement.style.objectFit = 'contain';
      
      debugLog("Applied visibility fixes to image element");
    } 
    // Create new container and image if nothing exists but we have a URL
    else if (url) {
      debugLog("Creating new image container for URL:", url);
      
      // Create container
      const newContainer = document.createElement('div');
      newContainer.className = 'html-image-container';
      newContainer.style.position = 'absolute';
      newContainer.style.top = '0';
      newContainer.style.left = '0';
      newContainer.style.width = '100%';
      newContainer.style.height = '100%';
      newContainer.style.display = 'flex';
      newContainer.style.alignItems = 'center';
      newContainer.style.justifyContent = 'center';
      newContainer.style.zIndex = '10';
      newContainer.style.backgroundColor = '#000';
      
      // Create image
      const newImage = document.createElement('img');
      newImage.src = url;
      newImage.style.maxWidth = '100%';
      newImage.style.maxHeight = '100%';
      newImage.style.objectFit = 'contain';
      
      // Add to DOM
      newContainer.appendChild(newImage);
      canvasElement.appendChild(newContainer);
      
      // Hide canvas and instructions
      if (canvas) canvas.style.display = 'none';
      if (instructionsElement) instructionsElement.style.display = 'none';
      
      debugLog("Created new image container with image");
    }
    
    // Final check - make sure canvas is hidden if we have an image
    if ((imageContainer || imageElement) && canvas) {
      canvas.style.display = 'none';
      debugLog("Hidden canvas element to show image");
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
  
  // Expose functions globally, safely without overriding existing functions
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
    },
    
    // Add a utility function to manually display an image in a tab
    fixImageDisplay: function(canvasId, url) {
      // If a URL isn't provided, try to find it
      if (!url) {
        Object.entries(contentTabs.images).forEach(([imgUrl, id]) => {
          if (id === canvasId) {
            url = imgUrl;
          }
        });
      }
      
      checkImageInDOM(canvasId, url);
      return "Image display fix attempted for " + canvasId;
    },
    
    // Exported for debugging
    debugLog: debugLog,
    checkImageInDOM: checkImageInDOM,
    displayImageInCurrentTab: displayImageInCurrentTab,
    displayCodeInCurrentTab: displayCodeInCurrentTab,
    createTabForImage: createTabForImage,
    createTabForCode: createTabForCode
  };
  
  console.log("Content Tab Manager: Enhanced content display functionality installed");
})();

/**
 * Final fixes for the Content Tab Manager
 * 
 * This script addresses two remaining issues:
 * 1. Multiple images reuse the same tab instead of creating new ones
 * 2. Code doesn't display content properly
 *
 * Add this to the end of your content-tab-manager.js file
 */

(function() {
  // Get reference to the contentTabManager
  if (!window.contentTabManager) {
      console.error("Content Tab Manager: contentTabManager object not found");
      return;
  }
  
  console.log("Content Tab Manager: Applying final fixes");
  
  // Fix 1: Override the image URL hash checking to allow multiple tabs
  const originalCreateTabForImage = window.contentTabManager.createTabForImage;
  
  window.contentTabManager.createTabForImage = function(url) {
      console.log("Content Tab Manager: Fixed createTabForImage called for URL:", url);
      
      if (!window.Commands || !window.Commands.canvasManager) {
          console.error("Content Tab Manager: Canvas manager not available");
          return;
      }
      
      const cm = window.Commands.canvasManager;
      
      // Generate a unique ID for each image tab regardless of URL
      // This ensures each image gets its own tab
      const tabId = `img-${Date.now()}`;
      const filename = getFilenameFromUrl(url);
      const tabTitle = `Image: ${filename}`;
      
      console.log(`Content Tab Manager: Creating new tab "${tabTitle}" for image`);
      
      // Create the tab
      cm.addNewCanvas(tabTitle, tabId, true);
      
      // Store the tab ID for this URL (still useful for tracking)
      if (window.contentTabs && window.contentTabs.images) {
          window.contentTabs.images[url] = tabId;
      }
      
      // Use longer timeouts to ensure everything is ready
      setTimeout(() => {
          // Activate the image module
          cm.activateModule('image');
          
          // Display the image in this new tab with a slight delay
          setTimeout(() => {
              window.contentTabManager.displayImageInCurrentTab(url);
              
              // Check DOM after display attempt
              setTimeout(() => window.contentTabManager.checkImageInDOM(tabId, url), 300);
          }, 300);
      }, 300);
      
      // Ensure the canvas section is expanded
      cm.expandCanvasSection();
  };
  
  // Fix 2: Fix code display by enhancing the displayCodeInCurrentTab function
  const originalDisplayCodeInCurrentTab = window.contentTabManager.displayCodeInCurrentTab;
  
  window.contentTabManager.displayCodeInCurrentTab = function(code, language) {
      console.log("Content Tab Manager: Fixed displayCodeInCurrentTab called");
      
      if (!window.Commands || !window.Commands.canvasManager) {
          console.error("Content Tab Manager: Canvas manager not available");
          return;
      }
      
      const cm = window.Commands.canvasManager;
      
      // Get the active canvas ID
      const activeCanvasId = cm.activeCanvasId;
      console.log(`Content Tab Manager: Displaying code in canvas ${activeCanvasId}`);
      
      // Get the code module
      const codeModule = cm.getModule('code');
      
      if (!codeModule) {
          console.error("Content Tab Manager: Code module not found");
          return;
      }
      
      // Ensure the code is a string
      if (typeof code !== 'string') {
          code = String(code);
      }
      
      // Find the container for the current canvas
      let container = null;
      
      if (activeCanvasId) {
          // Try multiple selector approaches
          container = document.querySelector(`.ide-code-container[data-canvas-id="${activeCanvasId}"]`);
          
          if (!container) {
              container = document.querySelector(`#codeContainer_${activeCanvasId}`);
          }
          
          if (!container) {
              // Find any container in this canvas instance
              const canvasInstance = document.querySelector(`.canvas-instance[data-canvas-id="${activeCanvasId}"]`);
              if (canvasInstance) {
                  container = canvasInstance.querySelector('.ide-code-container');
              }
          }
          
          if (container) {
              console.log(`Content Tab Manager: Found container for canvas ${activeCanvasId}`);
              
              // If code module has a container property, update it to use the correct one
              if (codeModule.container) {
                  codeModule.container = container;
                  console.log(`Content Tab Manager: Updated code module container for ${activeCanvasId}`);
              }
          } else {
              console.warn(`Content Tab Manager: No container found for canvas ${activeCanvasId}`);
              
              // Try to create a container if none exists
              createCodeContainer(activeCanvasId, cm);
          }
      }
      
      // Display the code using the appropriate method
      console.log(`Content Tab Manager: Displaying code in current tab: ${getCodePreview(code)}`);
      
      try {
          if (typeof codeModule.displayCode === 'function') {
              console.log("Content Tab Manager: Using displayCode method");
              const result = codeModule.displayCode(code, language);
              console.log("Content Tab Manager: displayCode result:", result);
          } else if (typeof codeModule.handleCommand === 'function') {
              console.log("Content Tab Manager: Using handleCommand method");
              const result = codeModule.handleCommand('display', [code, language]);
              console.log("Content Tab Manager: handleCommand result:", result);
          } else {
              console.error("Content Tab Manager: No suitable method found to display code");
          }
          
          // Check and fix container visibility
          setTimeout(() => {
              fixCodeContainerVisibility(activeCanvasId);
          }, 300);
      } catch (err) {
          console.error("Content Tab Manager: Error displaying code:", err);
      }
  };
  
  /**
   * Create a code container if missing
   */
  function createCodeContainer(canvasId, canvasManager) {
      console.log(`Content Tab Manager: Creating container for canvas ${canvasId}`);
      
      // Find the canvas instance
      const canvasInstance = document.querySelector(`.canvas-instance[data-canvas-id="${canvasId}"]`);
      if (!canvasInstance) {
          console.error(`Content Tab Manager: Canvas instance ${canvasId} not found`);
          return;
      }
      
      // Create container
      const container = document.createElement('div');
      container.id = `codeContainer_${canvasId}`;
      container.className = 'ide-code-container';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.style.zIndex = '10';
      container.dataset.canvasId = canvasId;
      
      // Hide canvas
      const canvas = canvasInstance.querySelector('canvas');
      if (canvas) {
          canvas.style.display = 'none';
      }
      
      // Hide instructions
      const instructions = canvasInstance.querySelector('.instructions-overlay');
      if (instructions) {
          instructions.style.display = 'none';
      }
      
      // Add to DOM
      canvasInstance.appendChild(container);
      
      // Update code module's container reference
      const codeModule = canvasManager.getModule('code');
      if (codeModule && codeModule.container) {
          codeModule.container = container;
      }
      
      console.log(`Content Tab Manager: Created container for canvas ${canvasId}`);
      return container;
  }
  
  /**
   * Fix visibility of code container
   */
  function fixCodeContainerVisibility(canvasId) {
      console.log(`Content Tab Manager: Fixing code container visibility for ${canvasId}`);
      
      // Find containers using different approaches
      const containers = document.querySelectorAll(`.ide-code-container[data-canvas-id="${canvasId}"], #codeContainer_${canvasId}`);
      
      containers.forEach(container => {
          // Make sure container is visible
          container.style.display = 'flex';
          container.style.visibility = 'visible';
          container.style.opacity = '1';
          container.style.zIndex = '10';
          
          // Find canvas instance
          const canvasInstance = container.closest('.canvas-instance') || 
                                document.querySelector(`.canvas-instance[data-canvas-id="${canvasId}"]`);
          
          if (canvasInstance) {
              // Hide canvas
              const canvas = canvasInstance.querySelector('canvas');
              if (canvas) {
                  canvas.style.display = 'none';
              }
              
              // Hide instructions
              const instructions = canvasInstance.querySelector('.instructions-overlay');
              if (instructions) {
                  instructions.style.display = 'none';
              }
          }
      });
  }
  
  // Helper functions that may not be available in scope
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
          return 'image';
      }
  }
  
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
  
  // Ensure contentTabs is available globally
  if (!window.contentTabs) {
      window.contentTabs = {
          images: {},
          code: {}
      };
  }
  
  // Add the fix helper to global manager
  window.contentTabManager.fixCodeContainerVisibility = fixCodeContainerVisibility;
  window.contentTabManager.createCodeContainer = createCodeContainer;
  
  // Add global fix utility
  window.fixCodeDisplay = function(canvasId) {
      fixCodeContainerVisibility(canvasId);
      return "Code display fix attempted for " + canvasId;
  };
  
  console.log("Content Tab Manager: Final fixes applied");
})();

/**
 * Targeted fix for code display in tabs
 * 
 * This script specifically addresses the code display issue by:
 * 1. Monitoring code display attempts
 * 2. Ensuring the code container is properly initialized and visible
 * 3. Adding fallback mechanisms to create a visible code display if needed
 */

(function() {
    if (!window.contentTabManager) {
        console.error("contentTabManager not found, cannot apply code display fix");
        return;
    }
    
    console.log("Applying targeted code display fix");
    
    // Store references to original functions
    const originalCreateTabForCode = window.contentTabManager.createTabForCode;
    const originalDisplayCodeInCurrentTab = window.contentTabManager.displayCodeInCurrentTab;
    
    /**
     * Enhanced createTabForCode function with better container management
     */
    window.contentTabManager.createTabForCode = function(code, language) {
        console.log("Enhanced createTabForCode called");
        
        if (!window.Commands || !window.Commands.canvasManager) {
            console.error("Canvas manager not available");
            return;
        }
        
        const cm = window.Commands.canvasManager;
        
        // Create a hash for this code
        const codeHash = hashCode(code || "");
        
        // Check if we already have a tab for this code
        if (window.contentTabs && window.contentTabs.code && window.contentTabs.code[codeHash]) {
            const existingTabId = window.contentTabs.code[codeHash];
            console.log(`Reusing existing tab ${existingTabId} for code`);
            
            // Activate the existing tab
            cm.activateCanvas(existingTabId);
            
            // Ensure the code module is activated
            cm.activateModule('code');
            
            // Re-display the code in this tab
            setTimeout(() => {
                displayCodeInTabWithFixes(code, language, existingTabId);
            }, 300);
        } else {
            // Create a new tab for this code
            const tabId = `code-${Date.now()}`;
            const langDisplay = language || 'code';
            const codePreview = getCodePreview(code || "");
            const tabTitle = `${langDisplay}: ${codePreview}`;
            
            console.log(`Creating new tab "${tabTitle}" for code`);
            
            // Create the tab
            cm.addNewCanvas(tabTitle, tabId, true);
            
            // Store the tab ID for this code hash
            if (window.contentTabs && window.contentTabs.code) {
                window.contentTabs.code[codeHash] = tabId;
            }
            
            // First, ensure the tab is fully activated
            setTimeout(() => {
                // Then activate the code module
                cm.activateModule('code');
                
                // Finally, display the code after the module is fully activated
                setTimeout(() => {
                    displayCodeInTabWithFixes(code, language, tabId);
                }, 300);
            }, 200);
        }
        
        // Ensure the canvas section is expanded
        cm.expandCanvasSection();
    };
    
    /**
     * Improved code display function with extra visibility fixes
     */
    function displayCodeInTabWithFixes(code, language, tabId) {
        console.log(`Displaying code in tab ${tabId} with fixes`);
        
        if (!window.Commands || !window.Commands.canvasManager) {
            console.error("Canvas manager not available");
            return;
        }
        
        const cm = window.Commands.canvasManager;
        
        // Display using standard method first
        try {
            originalDisplayCodeInCurrentTab(code, language);
        } catch (err) {
            console.error("Error in original display method:", err);
        }
        
        // Then apply fixes after a delay
        setTimeout(() => {
            fixCodeDisplay(tabId, code, language);
        }, 300);
    }
    
    /**
     * Fix code display issues for a specific tab
     */
    function fixCodeDisplay(tabId, code, language) {
        console.log(`Fixing code display for tab ${tabId}`);
        
        // Find the canvas instance
        const canvasInstance = document.querySelector(`.canvas-instance[data-canvas-id="${tabId}"]`);
        if (!canvasInstance) {
            console.error(`Canvas instance not found for ${tabId}`);
            return;
        }
        
        // Find the code container
        let codeContainer = canvasInstance.querySelector('.ide-code-container');
        
        // If no container exists, create one
        if (!codeContainer) {
            console.log(`Creating new code container for ${tabId}`);
            codeContainer = document.createElement('div');
            codeContainer.className = 'ide-code-container';
            codeContainer.id = `codeContainer_${tabId}`;
            codeContainer.style.position = 'absolute';
            codeContainer.style.top = '0';
            codeContainer.style.left = '0';
            codeContainer.style.width = '100%';
            codeContainer.style.height = '100%';
            codeContainer.style.display = 'flex';
            codeContainer.style.flexDirection = 'column';
            codeContainer.style.overflow = 'hidden';
            codeContainer.style.zIndex = '10';
            codeContainer.dataset.canvasId = tabId;
            
            canvasInstance.appendChild(codeContainer);
        }
        
        // Ensure the container is visible
        codeContainer.style.visibility = 'visible';
        codeContainer.style.display = 'flex';
        codeContainer.style.opacity = '1';
        
        // Hide the canvas if present
        const canvas = canvasInstance.querySelector('canvas');
        if (canvas) {
            canvas.style.display = 'none';
        }
        
        // Hide instructions overlay
        const instructions = canvasInstance.querySelector('.instructions-overlay');
        if (instructions) {
            instructions.style.display = 'none';
        }
        
        // Check if the container is empty or if the code is not visible
        const hasContent = codeContainer.querySelector('pre code, .ide-code-editor');
        if (!hasContent) {
            // Try to display code again using the code module
            const codeModule = window.Commands.canvasManager.getModule('code');
            if (codeModule) {
                // Update container reference
                if (codeModule.container) {
                    codeModule.container = codeContainer;
                }
                
                // Try display again
                try {
                    if (typeof codeModule.displayCode === 'function') {
                        codeModule.displayCode(code, language);
                    } else if (typeof codeModule.handleCommand === 'function') {
                        codeModule.handleCommand('display', [code, language]);
                    }
                } catch (err) {
                    console.error("Error re-displaying code:", err);
                }
            }
            
            // If still no content, create a fallback display
            setTimeout(() => {
                const stillNoContent = !codeContainer.querySelector('pre code, .ide-code-editor');
                if (stillNoContent) {
                    createFallbackCodeDisplay(codeContainer, code, language);
                }
            }, 200);
        }
    }
    
    /**
     * Create a fallback code display when all else fails
     */
    function createFallbackCodeDisplay(container, code, language) {
        console.log("Creating fallback code display");
        
        // Clear container
        container.innerHTML = '';
        
        // Create a header
        const header = document.createElement('div');
        header.style.backgroundColor = '#252525';
        header.style.color = '#fff';
        header.style.padding = '8px 12px';
        header.style.fontFamily = 'monospace';
        header.style.borderBottom = '1px solid #444';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        
        header.innerHTML = `
            <div>${language || 'code'}</div>
            <div>
                <button class="copy-button" style="background: none; border: none; color: #aaa; cursor: pointer;">
                    <i class="fas fa-copy"></i> Copy
                </button>
            </div>
        `;
        
        container.appendChild(header);
        
        // Create code display
        const codeDisplay = document.createElement('div');
        codeDisplay.style.flex = '1';
        codeDisplay.style.overflow = 'auto';
        codeDisplay.style.backgroundColor = '#1e1e1e';
        codeDisplay.style.color = '#d4d4d4';
        codeDisplay.style.fontFamily = 'monospace';
        codeDisplay.style.padding = '12px';
        codeDisplay.style.whiteSpace = 'pre';
        codeDisplay.style.fontSize = '14px';
        codeDisplay.style.lineHeight = '1.5';
        
        // Escape HTML to prevent rendering issues
        const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        codeDisplay.innerHTML = escapedCode;
        
        container.appendChild(codeDisplay);
        
        // Add copy functionality
        const copyButton = container.querySelector('.copy-button');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(code)
                    .then(() => {
                        copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        setTimeout(() => {
                            copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy';
                        }, 2000);
                    })
                    .catch(err => {
                        console.error("Failed to copy code:", err);
                    });
            });
        }
    }
    
    /**
     * Helper function: Get a preview of code content
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
     * Helper function: Simple hash function for strings
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
    
    // Override display code function to use our enhanced version
    window.contentTabManager.displayCodeInCurrentTab = function(code, language) {
        console.log("Enhanced displayCodeInCurrentTab called");
        
        if (!window.Commands || !window.Commands.canvasManager) {
            console.error("Canvas manager not available");
            return;
        }
        
        const cm = window.Commands.canvasManager;
        
        // Get the active canvas ID
        const activeCanvasId = cm.activeCanvasId;
        console.log(`Displaying code in canvas ${activeCanvasId}`);
        
        try {
            // Call original method first
            originalDisplayCodeInCurrentTab(code, language);
            
            // Apply fix after a delay
            setTimeout(() => {
                fixCodeDisplay(activeCanvasId, code, language);
            }, 200);
        } catch (err) {
            console.error("Error in displayCodeInCurrentTab:", err);
            // Try direct fix
            fixCodeDisplay(activeCanvasId, code, language);
        }
    };
    
    // Create global helper function
    window.fixAllCodeTabs = function() {
        console.log("Fixing all code tabs");
        
        // Find all code tabs
        const codeTabs = document.querySelectorAll('.canvas-tab[data-canvas-id^="code-"]');
        
        codeTabs.forEach(tab => {
            const tabId = tab.dataset.canvasId;
            console.log(`Fixing code tab: ${tabId}`);
            
            // Find corresponding code in our tracking
            let codeContent = "// No code content found";
            let language = "javascript";
            
            if (window.contentTabs && window.contentTabs.code) {
                for (const [hash, id] of Object.entries(window.contentTabs.code)) {
                    if (id === tabId) {
                        // Found the tab - try to retrieve code
                        // (we don't have a reverse lookup, so we just fix the display)
                        break;
                    }
                }
            }
            
            fixCodeDisplay(tabId, codeContent, language);
        });
        
        return `Attempted to fix ${codeTabs.length} code tabs`;
    };
    
    // Ensure contentTabs global object exists
    if (!window.contentTabs) {
        window.contentTabs = {
            images: {},
            code: {}
        };
    }
    
    console.log("Code display fix applied");
})();

/**
 * Direct fix for the CodeModule container visibility issue
 * Add this to the end of your content-tab-manager.js file
 * 
 * This fix addresses the root cause of code not displaying in tabs - 
 * new containers are initially hidden and not being properly shown.
 */

(function() {
  console.log("Applying CodeModule container visibility fix");
  
  // Patch the CodeModule's init method to fix the container visibility
  const patchCodeModuleInit = function() {
      // Check if the CodeModule exists in the global scope
      if (typeof CodeModule !== 'function') {
          console.log("CodeModule not found in global scope, will apply fixes differently");
          return false;
      }
      
      // Store the original init method
      const originalInit = CodeModule.prototype.init;
      
      // Replace with our fixed version
      CodeModule.prototype.init = function(element, ctx, manager) {
          // Call the original method
          const result = originalInit.call(this, element, ctx, manager);
          
          // Make sure the container is properly set up
          if (this.container) {
              // Fix the display style - don't hide it initially
              this.container.style.display = 'flex';
              this.container.style.visibility = 'visible';
              this.container.style.opacity = '1';
              this.container.style.zIndex = '10';
              console.log("CodeModule container visibility fixed during init");
          }
          
          return result;
      };
      
      console.log("CodeModule.init method patched successfully");
      return true;
  };
  
  // Try to patch the CodeModule directly
  const patchResult = patchCodeModuleInit();
  
  // If direct patching failed, set up a monitorAndFixCodeContainers function
  if (!patchResult) {
      // Function to find and fix all code containers
      const fixAllCodeContainers = function() {
          console.log("Fixing all code containers");
          
          // Find all code containers
          const containers = document.querySelectorAll('.ide-code-container');
          
          containers.forEach(container => {
              // Make sure the container is visible
              container.style.display = 'flex';
              container.style.visibility = 'visible';
              container.style.opacity = '1';
              container.style.zIndex = '10';
              
              // Find parent canvas instance if possible
              const canvasInstance = container.closest('.canvas-instance');
              if (canvasInstance) {
                  // Hide canvas element
                  const canvas = canvasInstance.querySelector('canvas');
                  if (canvas) {
                      canvas.style.display = 'none';
                  }
                  
                  // Hide instructions
                  const instructions = canvasInstance.querySelector('.instructions-overlay');
                  if (instructions) {
                      instructions.style.display = 'none';
                  }
              }
          });
          
          return `Fixed ${containers.length} code containers`;
      };
      
      // Set up a MutationObserver to watch for new code containers
      const observer = new MutationObserver(mutations => {
          let shouldFix = false;
          
          // Check if any new code containers have been added
          mutations.forEach(mutation => {
              if (mutation.addedNodes.length) {
                  mutation.addedNodes.forEach(node => {
                      if (node.nodeType === 1 && // Element node
                          ((node.classList && node.classList.contains('ide-code-container')) ||
                           node.id && node.id.startsWith('codeContainer_'))) {
                          shouldFix = true;
                      }
                  });
              }
          });
          
          if (shouldFix) {
              setTimeout(fixAllCodeContainers, 100);
          }
      });
      
      // Start observing the document
      observer.observe(document.body, { 
          childList: true, 
          subtree: true,
          attributes: false
      });
      
      // Run an initial fix
      setTimeout(fixAllCodeContainers, 100);
      
      // Also set a periodic check every 2 seconds for 30 seconds
      let checkCount = 0;
      const intervalId = setInterval(() => {
          fixAllCodeContainers();
          checkCount++;
          if (checkCount >= 15) { // 15 * 2 seconds = 30 seconds
              clearInterval(intervalId);
          }
      }, 2000);
      
      // Add a global fix function for manual use
      window.fixCodeContainers = fixAllCodeContainers;
  }
  
  // Also override the activation and displayCode methods directly on any active code module
  const fixActiveCodeModule = function() {
      if (!window.Commands || !window.Commands.canvasManager) {
          return;
      }
      
      const cm = window.Commands.canvasManager;
      const codeModule = cm.getModule('code');
      
      if (!codeModule) {
          return;
      }
      
      // Override activate method
      const originalActivate = codeModule.activate;
      codeModule.activate = function() {
          const result = originalActivate.call(this);
          
          // Ensure container is visible
          if (this.container) {
              this.container.style.display = 'flex';
              this.container.style.visibility = 'visible';
              this.container.style.opacity = '1';
              console.log("CodeModule container visibility fixed during activate");
          }
          
          return result;
      };
      
      // Override displayCode method
      const originalDisplayCode = codeModule.displayCode;
      codeModule.displayCode = function(code, language) {
          // Make sure container is visible before displaying code
          if (this.container) {
              this.container.style.display = 'flex';
              this.container.style.visibility = 'visible';
              this.container.style.opacity = '1';
          }
          
          const result = originalDisplayCode.call(this, code, language);
          
          // Make sure container is still visible after displaying code
          if (this.container) {
              this.container.style.display = 'flex';
              this.container.style.visibility = 'visible';
              this.container.style.opacity = '1';
              console.log("CodeModule container visibility fixed during displayCode");
          }
          
          return result;
      };
      
      console.log("Active CodeModule methods patched");
  };
  
  // Fix any active code module
  fixActiveCodeModule();
  
  // Add a quick enhancement to the content tab manager's code functions
  if (window.contentTabManager) {
      const originalCreateTabForCode = window.contentTabManager.createTabForCode;
      
      if (typeof originalCreateTabForCode === 'function') {
          window.contentTabManager.createTabForCode = function(code, language) {
              // Call the original function
              originalCreateTabForCode.call(window.contentTabManager, code, language);
              
              // Then fix any code containers after a delay
              if (window.fixCodeContainers) {
                  setTimeout(window.fixCodeContainers, 500);
              }
          };
          
          console.log("contentTabManager.createTabForCode enhanced");
      }
  }
  
  console.log("CodeModule container visibility fix applied");
})();

/**
 * Fix to create a unique tab for each code snippet
 * Add this at the end of your content-tab-manager.js file
 */

(function() {
  console.log("Applying unique code tabs fix");
  
  // Only proceed if contentTabManager exists
  if (!window.contentTabManager) {
      console.error("Cannot find contentTabManager object");
      return;
  }
  
  // Store the original function
  const originalCreateTabForCode = window.contentTabManager.createTabForCode;
  
  // Override the createTabForCode function to always create a new tab
  window.contentTabManager.createTabForCode = function(code, language) {
      console.log("Unique code tabs: Creating new tab for code");
      
      if (!window.Commands || !window.Commands.canvasManager) {
          console.error("Canvas manager not available");
          return;
      }
      
      const cm = window.Commands.canvasManager;
      
      // Always create a new tab with a unique ID based on timestamp
      const tabId = `code-${Date.now()}`;
      const langDisplay = language || 'code';
      const codePreview = getCodePreview(code || "");
      const tabTitle = `${langDisplay}: ${codePreview}`;
      
      console.log(`Creating new tab "${tabTitle}" for code`);
      
      // Create the tab
      cm.addNewCanvas(tabTitle, tabId, true);
      
      // Store the tab ID in our tracking (still useful for reference)
      if (window.contentTabs && window.contentTabs.code) {
          // Use the tabId as the key to ensure uniqueness
          // This is different from the original which used code hash as key
          const codeHash = hashCode(code || "");
          window.contentTabs.code[codeHash] = tabId;
      }
      
      // First, ensure the tab is fully activated
      setTimeout(() => {
          // Then activate the code module
          cm.activateModule('code');
          
          // Finally, display the code after the module is fully activated
          setTimeout(() => {
              // Use our existing displayCodeInCurrentTab function
              window.contentTabManager.displayCodeInCurrentTab(code, language);
              
              // Ensure container visibility after code is displayed
              setTimeout(() => {
                  if (window.fixCodeContainers) {
                      window.fixCodeContainers();
                  } else if (window.contentTabManager.fixCodeContainerVisibility) {
                      window.contentTabManager.fixCodeContainerVisibility(tabId);
                  }
              }, 200);
          }, 300);
      }, 200);
      
      // Ensure the canvas section is expanded
      cm.expandCanvasSection();
  };
  
  // Helper functions (duplicated in case they're not in scope)
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
  
  console.log("Unique code tabs fix applied");
})();

/**
 * FINAL FIX for unique code tabs - add this as the VERY LAST script in content-tab-manager.js
 * This version uses a direct hook into ChatCodeHandler instead of modifying contentTabManager
 */

(function() {
  console.log("Applying FINAL assertive fix for unique code tabs");
  
  // Most direct approach: replace the ChatCodeHandler.sendCodeToEditor method
  if (window.ChatCodeHandler && typeof window.ChatCodeHandler.sendCodeToEditor === 'function') {
      // Store the original method
      const originalSendCodeToEditor = window.ChatCodeHandler.sendCodeToEditor;
      
      // Replace with our enhanced version that always creates a new tab
      window.ChatCodeHandler.sendCodeToEditor = function(code, language) {
          console.log("ASSERTIVE FIX: Creating new tab for code");
          
          if (!window.Commands || !window.Commands.canvasManager) {
              console.error("Canvas manager not available");
              return false;
          }
          
          const cm = window.Commands.canvasManager;
          
          // Always create a new tab with a unique ID based on timestamp
          const tabId = `code-${Date.now()}`;
          const langDisplay = language || 'code';
          const codePreview = typeof code === 'string' ? 
              code.replace(/\s+/g, ' ').trim().substring(0, 12) + '...' : 
              'code';
          const tabTitle = `${langDisplay}: ${codePreview}`;
          
          console.log(`ASSERTIVE FIX: Creating tab "${tabTitle}" with ID ${tabId}`);
          
          // Create the tab
          cm.addNewCanvas(tabTitle, tabId, true);
          
          // First, ensure the tab is fully activated
          setTimeout(() => {
              // Then activate the code module
              cm.activateModule('code');
              
              // Finally, display the code after the module is fully activated
              setTimeout(() => {
                  // Get the code module directly
                  const codeModule = cm.getModule('code');
                  
                  if (!codeModule) {
                      console.error("Code module not found");
                      return;
                  }
                  
                  // Make sure container is visible
                  if (codeModule.container) {
                      codeModule.container.style.display = 'flex';
                      codeModule.container.style.visibility = 'visible';
                      codeModule.container.style.opacity = '1';
                  }
                  
                  // Display code directly through the module
                  if (typeof codeModule.displayCode === 'function') {
                      codeModule.displayCode(code, language);
                  } else if (typeof codeModule.handleCommand === 'function') {
                      codeModule.handleCommand('display', [code, language]);
                  }
                  
                  // Run additional fixes if available
                  setTimeout(() => {
                      if (typeof window.fixCodeContainers === 'function') {
                          window.fixCodeContainers();
                      }
                  }, 200);
              }, 300);
          }, 200);
          
          // Ensure the canvas section is expanded
          cm.expandCanvasSection();
          
          return true;
      };
      
      console.log("ASSERTIVE FIX: Successfully replaced ChatCodeHandler.sendCodeToEditor");
  } else {
      console.error("ChatCodeHandler not available, cannot apply assertive fix");
  }
  
  // Also check for direct code execution from the chat interface
  const chatInterface = window.chatInterface || window.ChatInterface;
  if (chatInterface) {
      // Try to hook into the executeCodeCommand method if it exists
      const originalMethods = [
          'executeCodeCommand',
          'executeCode',
          'handleCodeCommand',
          'processCodeCommand'
      ];
      
      let hooked = false;
      
      for (const methodName of originalMethods) {
          if (typeof chatInterface[methodName] === 'function') {
              const originalMethod = chatInterface[methodName];
              
              chatInterface[methodName] = function(code, language) {
                  console.log(`ASSERTIVE FIX: Intercepted ${methodName} call`);
                  
                  // Use our direct ChatCodeHandler replacement
                  if (window.ChatCodeHandler && typeof window.ChatCodeHandler.sendCodeToEditor === 'function') {
                      return window.ChatCodeHandler.sendCodeToEditor(code, language);
                  }
                  
                  // If that fails, call the original method
                  return originalMethod.apply(this, arguments);
              };
              
              console.log(`ASSERTIVE FIX: Hooked ${methodName} in chat interface`);
              hooked = true;
          }
      }
      
      if (!hooked) {
          console.warn("Could not find a method to hook in chat interface");
      }
  }
  
  console.log("ASSERTIVE FIX for unique code tabs applied");
})();