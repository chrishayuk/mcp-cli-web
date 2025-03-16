/**
 * content-tab-manager.js - Enhanced with fixes for image and code displays
 *
 * This script fixes issues with displaying content in tabs,
 * particularly focusing on image and code display problems.
 */
(function() {
  console.log("Content Tab Manager: Starting initialization");

  // Global tracking for created tabs
  window.contentTabs = {
    images: {},
    code: {}
  };

  // Store original handler references
  let originalSendImage = null;
  let originalSendCode = null;

  // --- Utility functions ---
  function debugLog(message, data) {
    const timestamp = new Date().toISOString().substr(11, 12);
    if (data !== undefined) {
      console.log(`[${timestamp}] DEBUG - ${message}`, data);
    } else {
      console.log(`[${timestamp}] DEBUG - ${message}`);
    }
  }

  function getFilenameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      let filename = pathParts[pathParts.length - 1] || 'image';
      filename = filename.split('?')[0]; // Remove query params
      return filename.length > 15 ? filename.substring(0, 12) + '...' : filename;
    } catch (e) {
      return 'image';
    }
  }

  function getCodePreview(code, maxLength = 12) {
    if (!code) return 'empty';
    const cleaned = code.replace(/\s+/g, ' ').trim();
    return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned;
  }

  function hashCode(str) {
    let hash = 0;
    if (!str || str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // --- Core functions to create and display tabs ---
  function createTabForImage(url) {
    debugLog("Creating tab for image", url);
    if (!window.Commands || !window.Commands.canvasManager) {
      console.error("Canvas manager not available");
      return;
    }
    const cm = window.Commands.canvasManager;
    // Always create a new tab for images (unique tab per call)
    const tabId = `img-${Date.now()}`;
    const filename = getFilenameFromUrl(url);
    const tabTitle = `Image: ${filename}`;
    console.log(`Creating new tab "${tabTitle}" for image`);

    cm.addNewCanvas(tabTitle, tabId, true);
    window.contentTabs.images[url] = tabId;

    setTimeout(() => {
      cm.activateModule('image');
      setTimeout(() => {
        displayImageInCurrentTab(url);
        setTimeout(() => checkImageInDOM(tabId, url), 300);
      }, 300);
    }, 300);
    cm.expandCanvasSection();
  }

  function createTabForCode(code, language) {
    if (!window.Commands || !window.Commands.canvasManager) {
      console.error("Canvas manager not available");
      return;
    }
    const cm = window.Commands.canvasManager;
    // Always create a new tab for code; track using a hash for reference
    const codeHash = hashCode(code || "");
    const tabId = `code-${Date.now()}`;
    const langDisplay = language || 'code';
    const codePreview = getCodePreview(code || "");
    const tabTitle = `${langDisplay}: ${codePreview}`;
    console.log(`Creating new tab "${tabTitle}" for code`);

    cm.addNewCanvas(tabTitle, tabId, true);
    window.contentTabs.code[codeHash] = tabId;

    setTimeout(() => {
      cm.activateModule('code');
      setTimeout(() => {
        displayCodeInCurrentTab(code, language);
        // Fix container visibility after display
        setTimeout(() => {
          fixCodeContainerVisibility(tabId);
        }, 200);
      }, 300);
    }, 200);
    cm.expandCanvasSection();
  }

  function displayImageInCurrentTab(url) {
    debugLog("Displaying image", url);
    if (!window.Commands || !window.Commands.canvasManager) {
      console.error("Canvas manager not available");
      return;
    }
    const cm = window.Commands.canvasManager;
    const activeCanvasId = cm.activeCanvasId;
    console.log(`Displaying image in canvas ${activeCanvasId}`);
    const imageModule = cm.getModule('image');

    if (!imageModule) {
      console.error("Image module not found");
      if (originalSendImage) {
        console.log("Falling back to original image handler");
        return originalSendImage(url);
      }
      return;
    }

    try {
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
        console.error("No suitable method found to display image");
        if (originalSendImage) {
          console.log("Falling back to original image handler");
          return originalSendImage(url);
        }
      }
    } catch (err) {
      console.error("Error delegating image display:", err);
      if (originalSendImage) {
        console.log("Falling back to original image handler");
        originalSendImage(url);
      }
    }
  }

  function displayCodeInCurrentTab(code, language) {
    if (!window.Commands || !window.Commands.canvasManager) {
      console.error("Canvas manager not available");
      return;
    }
    const cm = window.Commands.canvasManager;
    const activeCanvasId = cm.activeCanvasId;
    console.log(`Displaying code in canvas ${activeCanvasId}`);
    const codeModule = cm.getModule('code');

    if (!codeModule) {
      console.error("Code module not found");
      return;
    }
    if (typeof code !== 'string') code = String(code);
    // Update container if found
    const container = document.querySelector(`.ide-code-container[data-canvas-id="${activeCanvasId}"]`);
    if (container && codeModule.container) {
      codeModule.container = container;
      console.log(`Updated code module container for canvas ${activeCanvasId}`);
    }
    try {
      if (typeof codeModule.displayCode === 'function') {
        codeModule.displayCode(code, language);
      } else if (typeof codeModule.handleCommand === 'function') {
        codeModule.handleCommand('display', [code, language]);
      } else {
        console.error("No suitable method found to display code");
      }
    } catch (err) {
      console.error("Error displaying code:", err);
      if (originalSendCode) {
        console.log("Falling back to original code handler");
        originalSendCode(code, language);
      }
    }
  }

  // --- DOM Fixes ---
  function checkImageInDOM(canvasId, url) {
    debugLog("Checking image in DOM for canvas", canvasId);
    const canvasElement = document.querySelector(`.canvas-instance[data-canvas-id="${canvasId}"]`);
    if (!canvasElement) {
      debugLog("Canvas element not found in DOM!");
      return;
    }
    const imageContainer = canvasElement.querySelector('.image-container, .html-image-container');
    const imageElement = canvasElement.querySelector('img');
    const canvas = canvasElement.querySelector('canvas');
    const instructionsElement = canvasElement.querySelector('.instructions-overlay');

    debugLog("DOM elements found", {
      hasImageContainer: !!imageContainer,
      hasImageElement: !!imageElement,
      hasCanvas: !!canvas,
      hasInstructions: !!instructionsElement
    });

    if (instructionsElement) {
      instructionsElement.style.display = 'none';
      debugLog("Hidden instructions overlay");
    }

    if (imageContainer) {
      Object.assign(imageContainer.style, {
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        zIndex: '10',
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%'
      });
      debugLog("Applied visibility fixes to image container");
      const images = imageContainer.querySelectorAll('img');
      images.forEach(img => {
        Object.assign(img.style, {
          display: 'block',
          visibility: 'visible',
          opacity: '1',
          maxWidth: '100%',
          maxHeight: '100%',
          margin: 'auto',
          objectFit: 'contain'
        });
      });
      if (images.length === 0 && url) {
        const newImage = document.createElement('img');
        newImage.src = url;
        Object.assign(newImage.style, {
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          display: 'block',
          margin: 'auto'
        });
        imageContainer.appendChild(newImage);
        debugLog("Created new image element in existing container");
      }
    } else if (imageElement) {
      Object.assign(imageElement.style, {
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        maxWidth: '100%',
        maxHeight: '100%',
        margin: 'auto',
        objectFit: 'contain'
      });
      debugLog("Applied visibility fixes to image element");
    } else if (url) {
      debugLog("Creating new image container for URL", url);
      const newContainer = document.createElement('div');
      newContainer.className = 'html-image-container';
      Object.assign(newContainer.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '10',
        backgroundColor: '#000'
      });
      const newImage = document.createElement('img');
      newImage.src = url;
      Object.assign(newImage.style, {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
      });
      newContainer.appendChild(newImage);
      canvasElement.appendChild(newContainer);
      if (canvas) canvas.style.display = 'none';
      if (instructionsElement) instructionsElement.style.display = 'none';
      debugLog("Created new image container with image");
    }
    if ((imageContainer || imageElement) && canvas) {
      canvas.style.display = 'none';
      debugLog("Hidden canvas element to show image");
    }
  }

  function fixCodeContainerVisibility(canvasId) {
    console.log(`Fixing code container visibility for ${canvasId}`);
    const containers = document.querySelectorAll(`.ide-code-container[data-canvas-id="${canvasId}"], #codeContainer_${canvasId}`);
    containers.forEach(container => {
      Object.assign(container.style, {
        display: 'flex',
        visibility: 'visible',
        opacity: '1',
        zIndex: '10'
      });
      const canvasInstance = container.closest('.canvas-instance') || document.querySelector(`.canvas-instance[data-canvas-id="${canvasId}"]`);
      if (canvasInstance) {
        const canvas = canvasInstance.querySelector('canvas');
        if (canvas) canvas.style.display = 'none';
        const instructions = canvasInstance.querySelector('.instructions-overlay');
        if (instructions) instructions.style.display = 'none';
      }
    });
  }

  // --- Initialization and Retry logic ---
  function initTabManager() {
    console.log("Content Tab Manager: Setting up hooks");
    // Hook into ChatImageHandler
    if (window.ChatImageHandler && typeof window.ChatImageHandler.sendImageToCanvas === 'function') {
      if (!originalSendImage) {
        originalSendImage = window.ChatImageHandler.sendImageToCanvas;
      }
      window.ChatImageHandler.sendImageToCanvas = function(url) {
        console.log("Processing image URL:", url.substring(0, 30) + "...");
        createTabForImage(url);
        return true;
      };
      console.log("Hooked into ChatImageHandler");
    } else {
      console.warn("ChatImageHandler not available yet");
    }

    // Hook into ChatCodeHandler
    if (window.ChatCodeHandler && typeof window.ChatCodeHandler.sendCodeToEditor === 'function') {
      if (!originalSendCode) {
        originalSendCode = window.ChatCodeHandler.sendCodeToEditor;
      }
      window.ChatCodeHandler.sendCodeToEditor = function(code, language) {
        console.log(`Processing code in ${language || 'unknown'}`);
        createTabForCode(code, language);
        return true;
      };
      console.log("Hooked into ChatCodeHandler");
    } else {
      console.warn("ChatCodeHandler not available yet");
    }
    console.log("Content Tab Manager: Initialization complete");
  }

  function checkAndRetryInit() {
    let needsRetry = false;
    if (window.ChatImageHandler &&
        typeof window.ChatImageHandler.sendImageToCanvas === 'function' &&
        window.ChatImageHandler.sendImageToCanvas.toString().indexOf('Content Tab Manager') === -1) {
      console.log("ChatImageHandler needs hooking");
      needsRetry = true;
    }
    if (window.ChatCodeHandler &&
        typeof window.ChatCodeHandler.sendCodeToEditor === 'function' &&
        window.ChatCodeHandler.sendCodeToEditor.toString().indexOf('Content Tab Manager') === -1) {
      console.log("ChatCodeHandler needs hooking");
      needsRetry = true;
    }
    if (needsRetry) {
      console.log("Retrying initialization");
      initTabManager();
    }
  }

  // --- Final and targeted fixes ---
  // Unique code tabs fix: always create a new tab for code snippets
  function uniqueCodeTabsFix(code, language) {
    console.log("Unique code tabs fix: Creating new tab for code");
    createTabForCode(code, language);
  }

  // Direct fix for CodeModule container visibility
  function patchCodeModuleInit() {
    if (typeof CodeModule !== 'function') {
      console.log("CodeModule not found in global scope");
      return false;
    }
    const originalInit = CodeModule.prototype.init;
    CodeModule.prototype.init = function(element, ctx, manager) {
      const result = originalInit.call(this, element, ctx, manager);
      if (this.container) {
        Object.assign(this.container.style, {
          display: 'flex',
          visibility: 'visible',
          opacity: '1',
          zIndex: '10'
        });
        console.log("CodeModule container visibility fixed during init");
      }
      return result;
    };
    console.log("Patched CodeModule.init successfully");
    return true;
  }

  // If CodeModule patching fails, observe the document to fix code containers
  function monitorAndFixCodeContainers() {
    function fixAllCodeContainers() {
      console.log("Fixing all code containers");
      const containers = document.querySelectorAll('.ide-code-container');
      containers.forEach(container => {
        Object.assign(container.style, {
          display: 'flex',
          visibility: 'visible',
          opacity: '1',
          zIndex: '10'
        });
        const canvasInstance = container.closest('.canvas-instance');
        if (canvasInstance) {
          const canvas = canvasInstance.querySelector('canvas');
          if (canvas) canvas.style.display = 'none';
          const instructions = canvasInstance.querySelector('.instructions-overlay');
          if (instructions) instructions.style.display = 'none';
        }
      });
      return `Fixed ${containers.length} code containers`;
    }
    const observer = new MutationObserver(mutations => {
      let shouldFix = false;
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && (node.classList.contains('ide-code-container') ||
                (node.id && node.id.startsWith('codeContainer_')))) {
              shouldFix = true;
            }
          });
        }
      });
      if (shouldFix) {
        setTimeout(fixAllCodeContainers, 100);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(fixAllCodeContainers, 100);
    let checkCount = 0;
    const intervalId = setInterval(() => {
      fixAllCodeContainers();
      checkCount++;
      if (checkCount >= 15) clearInterval(intervalId);
    }, 2000);
    window.fixCodeContainers = fixAllCodeContainers;
  }

  // --- Global contentTabManager object ---
  window.contentTabManager = {
    getTabsInfo: function() {
      return {
        imageTabs: Object.keys(window.contentTabs.images).length,
        codeTabs: Object.keys(window.contentTabs.code).length
      };
    },
    resetTabs: function() {
      window.contentTabs.images = {};
      window.contentTabs.code = {};
      console.log("All tabs reset");
      return true;
    },
    reinstall: function() {
      initTabManager();
      return true;
    },
    testDisplay: function(content, type, language) {
      if (type === 'image') {
        createTabForImage(content);
      } else if (type === 'code') {
        createTabForCode(content, language || 'javascript');
      }
    },
    fixImageDisplay: function(canvasId, url) {
      if (!url) {
        Object.entries(window.contentTabs.images).forEach(([imgUrl, id]) => {
          if (id === canvasId) url = imgUrl;
        });
      }
      checkImageInDOM(canvasId, url);
      return "Image display fix attempted for " + canvasId;
    },
    fixCodeContainerVisibility: fixCodeContainerVisibility,
    displayImageInCurrentTab: displayImageInCurrentTab,
    displayCodeInCurrentTab: displayCodeInCurrentTab,
    createTabForImage: createTabForImage,
    createTabForCode: createTabForCode,
    uniqueCodeTabsFix: uniqueCodeTabsFix
  };

  // --- Initialization ---
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initTabManager, 1000);
    setTimeout(checkAndRetryInit, 3000);
    setTimeout(checkAndRetryInit, 6000);
  });

  // --- Apply targeted fixes ---
  // Patch CodeModule container visibility
  if (!patchCodeModuleInit()) {
    monitorAndFixCodeContainers();
  } else {
    // Also patch activate and displayCode methods for active CodeModule
    if (window.Commands && window.Commands.canvasManager) {
      const codeModule = window.Commands.canvasManager.getModule('code');
      if (codeModule) {
        const origActivate = codeModule.activate;
        codeModule.activate = function() {
          const result = origActivate.call(this);
          if (this.container) {
            Object.assign(this.container.style, {
              display: 'flex',
              visibility: 'visible',
              opacity: '1'
            });
            console.log("Fixed container visibility during activate");
          }
          return result;
        };
        const origDisplayCode = codeModule.displayCode;
        codeModule.displayCode = function(code, language) {
          if (this.container) {
            Object.assign(this.container.style, {
              display: 'flex',
              visibility: 'visible',
              opacity: '1'
            });
          }
          const result = origDisplayCode.call(this, code, language);
          if (this.container) {
            Object.assign(this.container.style, {
              display: 'flex',
              visibility: 'visible',
              opacity: '1'
            });
            console.log("Fixed container visibility during displayCode");
          }
          return result;
        };
        console.log("Patched active CodeModule methods");
      }
    }
  }

  // FINAL assertive fix: Hook directly into ChatCodeHandler to ensure unique code tabs
  if (window.ChatCodeHandler && typeof window.ChatCodeHandler.sendCodeToEditor === 'function') {
    const originalSendCodeToEditor = window.ChatCodeHandler.sendCodeToEditor;
    window.ChatCodeHandler.sendCodeToEditor = function(code, language) {
      console.log("ASSERTIVE FIX: Creating new tab for code");
      if (!window.Commands || !window.Commands.canvasManager) {
        console.error("Canvas manager not available");
        return false;
      }
      const cm = window.Commands.canvasManager;
      const tabId = `code-${Date.now()}`;
      const langDisplay = language || 'code';
      const codePreview = typeof code === 'string' ?
          getCodePreview(code) : 'code';
      const tabTitle = `${langDisplay}: ${codePreview}`;
      console.log(`ASSERTIVE FIX: Creating tab "${tabTitle}" with ID ${tabId}`);
      cm.addNewCanvas(tabTitle, tabId, true);
      setTimeout(() => {
        cm.activateModule('code');
        setTimeout(() => {
          const codeModule = cm.getModule('code');
          if (!codeModule) {
            console.error("Code module not found");
            return;
          }
          if (codeModule.container) {
            Object.assign(codeModule.container.style, {
              display: 'flex',
              visibility: 'visible',
              opacity: '1'
            });
          }
          if (typeof codeModule.displayCode === 'function') {
            codeModule.displayCode(code, language);
          } else if (typeof codeModule.handleCommand === 'function') {
            codeModule.handleCommand('display', [code, language]);
          }
          setTimeout(() => {
            if (typeof window.fixCodeContainers === 'function') {
              window.fixCodeContainers();
            } else if (window.contentTabManager.fixCodeContainerVisibility) {
              window.contentTabManager.fixCodeContainerVisibility(tabId);
            }
          }, 200);
        }, 300);
      }, 200);
      cm.expandCanvasSection();
      return true;
    };
    console.log("ASSERTIVE FIX: Replaced ChatCodeHandler.sendCodeToEditor");
  } else {
    console.error("ChatCodeHandler not available, cannot apply assertive fix");
  }

  console.log("Content Tab Manager: Enhanced content display functionality installed");
})();