/**
 * js/canvas/collapsible-canvas/canvas-tab-activation-handler.js
 * 
 * Handles canvas tab activation events and ensures proper tab navigation.
 * Implements a robust initialization pattern that waits for the canvas system
 * to be fully initialized before attaching event handlers.
 * 
 * The original issue was that this handler was initializing before the tab container
 * was created by the CollapsibleCanvasManager, causing tab clicking to not work.
 */

// Self-executing function to avoid polluting global scope
(function() {
    // Store references to key elements
    let tabsContainer = null;
    let canvasManager = null;
    let isInitialized = false;
    
    // Main initialization function
    function initCanvasTabActivationHandler() {
        console.log("Initializing canvas tab activation handler...");
        
        // Get reference to the canvas manager
        if (window.Commands && window.Commands.canvasManager) {
            canvasManager = window.Commands.canvasManager;
        } else {
            console.warn("Canvas manager not available yet, will retry");
            return false;
        }
        
        // Find tabs container using multiple potential selectors based on the log analysis
        tabsContainer = document.querySelector('.canvas-tabs');
        
        if (!tabsContainer) {
            // Try alternative selectors
            tabsContainer = document.querySelector('.canvas-tabs-list');
        }
        
        if (!tabsContainer) {
            // If not found, look for it on the canvas manager (based on your implementation)
            if (canvasManager.tabsContainer) {
                tabsContainer = canvasManager.tabsContainer;
            } else if (canvasManager.DOMManager && canvasManager.DOMManager.tabsContainer) {
                tabsContainer = canvasManager.DOMManager.tabsContainer;
            } else if (canvasManager.tabsList && canvasManager.tabsList.parentElement) {
                // If we have tabsList but not tabsContainer, use the parent of tabsList
                tabsContainer = canvasManager.tabsList.parentElement;
            } else {
                console.warn("Tabs container not found, will attempt to initialize later");
                return false;
            }
        }
        
        // Additional debug log
        console.log("Found tabs container:", tabsContainer);
        
        // Set up click event delegation on the tabs container
        setupTabsClickHandler();
        
        // Set up keyboard shortcuts
        setupKeyboardNavigation();
        
        // Setup mutations observer to handle dynamically added tabs
        setupMutationObserver();
        
        console.log("Canvas tab activation handler successfully initialized");
        isInitialized = true;
        return true;
    }
    
    // Set up click handler on tabs container using event delegation
    function setupTabsClickHandler() {
        if (!tabsContainer) {
            console.warn("Cannot set up click handler - tabs container not available");
            return;
        }
        
        // Remove any existing handlers to prevent duplicates
        tabsContainer.removeEventListener('click', handleTabClick);
        
        // Add the click handler
        tabsContainer.addEventListener('click', handleTabClick);
        
        // Add a visual indicator that tabs are clickable
        const tabElements = tabsContainer.querySelectorAll('.canvas-tab');
        tabElements.forEach(tab => {
            if (!tab.classList.contains('clickable-tab')) {
                tab.classList.add('clickable-tab');
            }
        });
        
        console.log(`Tab click handler initialized on ${tabElements.length} tabs`);
        
        // Dispatch a custom event to notify that we're ready
        const event = new CustomEvent('tabActivationHandlerReady');
        window.dispatchEvent(event);
    }
    
    // Handle tab click events
    function handleTabClick(e) {
        // Ignore if canvas manager not available
        if (!canvasManager) {
            console.warn("Tab click ignored: Canvas manager not available");
            return;
        }
        
        // Find the clicked tab, ignoring clicks on close button
        const tab = e.target.closest('.canvas-tab');
        if (!tab) return;
        if (e.target.closest('.canvas-tab-close')) return;
        
        // Get the canvas ID from the tab
        const canvasId = tab.dataset.canvasId;
        if (!canvasId) {
            console.error("Tab doesn't have a canvas ID");
            return;
        }
        
        console.log(`Tab clicked: ${canvasId}`);
        
        try {
            // Check if a canvas with this ID exists
            const existingCanvas = canvasManager.canvasInstances.find(inst => inst.id === canvasId);
            
            if (existingCanvas) {
                // Activate existing canvas
                console.log(`Activating existing canvas: ${canvasId}`);
                canvasManager.activateCanvas(canvasId);
            } else {
                // Create new canvas with this ID if it doesn't exist
                console.log(`Creating new canvas with ID: ${canvasId}`);
                canvasManager.addNewCanvas(`Canvas ${canvasId}`, canvasId, true);
            }
            
            // Always expand the canvas section
            canvasManager.expandCanvasSection();
        } catch (error) {
            console.error("Error handling tab click:", error);
        }
    }
    
    // Set up keyboard navigation
    function setupKeyboardNavigation() {
        // Remove any existing handlers to prevent duplicates
        document.removeEventListener('keydown', handleKeyNavigation);
        
        // Add keyboard shortcut handler
        document.addEventListener('keydown', handleKeyNavigation);
        
        console.log("Keyboard navigation initialized");
    }
    
    // Handle keyboard navigation events
    function handleKeyNavigation(e) {
        // Handle Ctrl+Tab for cycling through tabs
        if (e.ctrlKey && e.key === 'Tab') {
            e.preventDefault();
            
            if (!canvasManager || !canvasManager.canvasInstances) return;
            
            const canvases = canvasManager.canvasInstances;
            if (canvases.length <= 1) return;
            
            const currentIndex = canvases.findIndex(inst => inst.id === canvasManager.activeCanvasId);
            const nextIndex = (currentIndex + 1) % canvases.length;
            
            canvasManager.activateCanvas(canvases[nextIndex].id);
            canvasManager.expandCanvasSection();
        }
        
        // Handle Ctrl+Shift+Tab for reverse cycling
        else if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
            e.preventDefault();
            
            if (!canvasManager || !canvasManager.canvasInstances) return;
            
            const canvases = canvasManager.canvasInstances;
            if (canvases.length <= 1) return;
            
            const currentIndex = canvases.findIndex(inst => inst.id === canvasManager.activeCanvasId);
            const prevIndex = (currentIndex - 1 + canvases.length) % canvases.length;
            
            canvasManager.activateCanvas(canvases[prevIndex].id);
            canvasManager.expandCanvasSection();
        }
    }
    
    // Setup mutations observer to handle dynamically added tabs
    function setupMutationObserver() {
        // Create observer to watch for the tabs container if it doesn't exist yet
        if (!tabsContainer) {
            const bodyObserver = new MutationObserver(function(mutations) {
                // Check if tabs container now exists (specifically targeting the class names from the logs)
                const newTabsContainer = document.querySelector('.canvas-tabs');
                
                if (newTabsContainer) {
                    console.log("MutationObserver: Found tabs container");
                    tabsContainer = newTabsContainer;
                    setupTabsClickHandler();
                    
                    // Stop observing once we've found it
                    bodyObserver.disconnect();
                    
                    // Instead, observe the tabs container for new tabs
                    setupTabsObserver();
                } else {
                    // Try more selectors if the main one isn't found
                    const altTabsContainer = document.querySelector('.canvas-tabs-list');
                    if (altTabsContainer && altTabsContainer.parentElement) {
                        console.log("MutationObserver: Found alternative tabs container");
                        tabsContainer = altTabsContainer.parentElement;
                        setupTabsClickHandler();
                        
                        // Stop observing once we've found it
                        bodyObserver.disconnect();
                        
                        // Instead, observe the tabs container for new tabs
                        setupTabsObserver();
                    }
                }
            });
            
            // Start observing the body for child changes
            bodyObserver.observe(document.body, { childList: true, subtree: true });
        } else {
            // If tabs container exists, observe it for changes
            setupTabsObserver();
        }
    }
    
    // Setup observer for tabs container to handle dynamic tab additions
    function setupTabsObserver() {
        if (!tabsContainer) return;
        
        const tabsObserver = new MutationObserver(function(mutations) {
            // Refresh the click handler to ensure all tabs are covered
            setupTabsClickHandler();
        });
        
        // Observe the tabs container for new tabs
        tabsObserver.observe(tabsContainer, { childList: true });
    }
    
    // Initialize after the collapsible canvas system is fully loaded
    // This ensures the DOM elements and canvas manager are both ready
    document.addEventListener('DOMContentLoaded', function() {
        // First attempt with delay to let canvas system initialize
        setTimeout(function() {
            if (!initCanvasTabActivationHandler()) {
                console.log("First initialization attempt failed, scheduling retry...");
                // Try again after collapsible canvas system should be ready
                setTimeout(function() {
                    if (!initCanvasTabActivationHandler()) {
                        console.log("Second initialization attempt failed, scheduling final retry...");
                        // Final retry with longer delay
                        setTimeout(initCanvasTabActivationHandler, 1500);
                    }
                }, 1000);
            }
        }, 500);
    });
    
    // Also try to initialize when collapsible canvas system finishes
    if (typeof window.addEventListener === 'function') {
        window.addEventListener('canvasSystemInitialized', function() {
            console.log("Received canvasSystemInitialized event, initializing tab handler");
            initCanvasTabActivationHandler();
        });
    }
    
    // Export the initialization function to global scope
    window.initCanvasTabActivationHandler = initCanvasTabActivationHandler;
})();