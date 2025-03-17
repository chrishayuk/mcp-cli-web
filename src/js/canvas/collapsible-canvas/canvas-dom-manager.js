/**
 * js/canvas/collapsible-canvas/canvas-dom-manager.js
 * DOM element management for collapsible canvas system
 */

/**
 * Class to manage DOM elements for the canvas system
 */
class CanvasDOMManager {
    /**
     * Create a DOM manager
     * @param {CollapsibleCanvasManager} canvasManager - Parent canvas manager
     */
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        
        // DOM references - initialized in initialize()
        this.canvasContainer = null;
        this.mainContainer = null;
        this.terminalWindow = null;
        this.canvasWindow = null;
        this.tabsContainer = null;
        this.tabsList = null;
        this.minimizedContainer = null;
    }
    
    /**
     * Initialize and verify all required DOM elements
     */
    initialize() {
        console.log("Initializing Canvas DOM Manager...");
        
        // Ensure main elements exist
        this.ensureMainContainers();
        
        // Ensure tab elements exist
        this.ensureTabsList();
        
        // Ensure minimized container exists
        this.ensureMinimizedContainer();
        
        console.log("Canvas DOM Manager initialized");
    }
    
    /**
     * Ensure all main container elements exist
     */
    ensureMainContainers() {
        // Get or create canvas container
        this.ensureCanvasContainer();
        
        // Get main layout elements
        this.mainContainer = document.querySelector('.main-container');
        this.terminalWindow = document.querySelector('.terminal-window');
        this.canvasWindow = document.querySelector('.canvas-window');
        
        // Create missing elements if needed
        this.ensureMainLayoutElements();
    }
    
    /**
     * Ensure canvas container exists
     * @returns {boolean} - Whether the container exists or was created
     */
    ensureCanvasContainer() {
        this.canvasContainer = document.querySelector('.canvas-container');
        
        if (!this.canvasContainer || !document.body.contains(this.canvasContainer)) {
            console.warn("Canvas container not found, creating one");
            
            this.canvasContainer = document.createElement('div');
            this.canvasContainer.className = 'canvas-container';
            
            // Find main layout to append to
            const mainLayout = document.querySelector('.main-layout, .app-layout, .main-container');
            if (mainLayout) {
                mainLayout.appendChild(this.canvasContainer);
            } else {
                document.body.appendChild(this.canvasContainer);
                console.warn("Had to append canvas container to body - layout elements not found");
            }
        }
        
        return !!this.canvasContainer;
    }
    
    /**
     * Ensure main layout elements exist
     */
    ensureMainLayoutElements() {
        if (!this.mainContainer || !document.body.contains(this.mainContainer)) {
            console.warn("Main container not found, creating one");
            this.mainContainer = document.createElement('div');
            this.mainContainer.className = 'main-container';
            document.body.appendChild(this.mainContainer);
        }
        
        if (!this.terminalWindow || !document.body.contains(this.terminalWindow)) {
            console.warn("Terminal window not found, creating one");
            this.terminalWindow = document.createElement('div');
            this.terminalWindow.className = 'terminal-window';
            this.mainContainer.appendChild(this.terminalWindow);
        }
        
        if (!this.canvasWindow || !document.body.contains(this.canvasWindow)) {
            console.warn("Canvas window not found, creating one");
            this.canvasWindow = document.createElement('div');
            this.canvasWindow.className = 'canvas-window';
            this.mainContainer.appendChild(this.canvasWindow);
            
            // Add title bar if missing
            this.ensureCanvasTitleBar();
        }
    }
    
    /**
     * Ensure canvas window has a title bar
     */
    ensureCanvasTitleBar() {
        if (!this.canvasWindow) return;
        
        const titleBar = this.canvasWindow.querySelector('.canvas-titlebar');
        if (!titleBar) {
            const newTitleBar = document.createElement('div');
            newTitleBar.className = 'canvas-titlebar';
            newTitleBar.innerHTML = `
                <div class="canvas-title">
                    <i class="fas fa-desktop"></i>
                    <span>Canvas Display</span>
                </div>
            `;
            this.canvasWindow.appendChild(newTitleBar);
        }
    }
    
    /**
     * Ensure tabs list exists
     * @returns {HTMLElement} - The tabs list element
     */
    ensureTabsList() {
        // Skip if tabsList already exists and is in the DOM
        if (this.tabsList && document.body.contains(this.tabsList)) {
            return this.tabsList;
        }
        
        console.log("Creating tabs list container...");
        
        // Try to find existing tabs list first
        const existingTabsList = document.querySelector('.canvas-tabs .canvas-tabs-list');
        if (existingTabsList && document.body.contains(existingTabsList)) {
            this.tabsList = existingTabsList;
            this.tabsContainer = existingTabsList.closest('.canvas-tabs');
            console.log("Found existing tabs list in DOM");
            return this.tabsList;
        }
        
        // Create new tabs container and list
        if (this.canvasWindow) {
            // Create tabs container
            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'canvas-tabs';
            tabsContainer.innerHTML = `
                <div class="canvas-tabs-list"></div>
                <div class="canvas-tabs-actions">
                    <button class="tab-action-button" id="newCanvasButton">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            `;
            
            // Insert at the beginning of canvas window
            if (this.canvasWindow.firstChild) {
                this.canvasWindow.insertBefore(tabsContainer, this.canvasWindow.firstChild);
            } else {
                this.canvasWindow.appendChild(tabsContainer);
            }
            
            // Store references
            this.tabsContainer = tabsContainer;
            this.tabsList = tabsContainer.querySelector('.canvas-tabs-list');
            
            // Add event listener to new canvas button
            const newCanvasButton = document.getElementById('newCanvasButton');
            if (newCanvasButton) {
                newCanvasButton.addEventListener('click', () => {
                    this.canvasManager.expandCanvasSection();
                    this.canvasManager.addNewCanvas('New Canvas');
                });
            }
            
            console.log("Successfully created tabs container and tabs list");
        } else {
            console.error("Cannot create tabs list - canvas window not found");
        }
        
        return this.tabsList;
    }
    
    /**
     * Ensure minimized container exists
     * @returns {HTMLElement} - The minimized container element
     */
    ensureMinimizedContainer() {
        // Skip if already exists and is in DOM
        if (this.minimizedContainer && document.body.contains(this.minimizedContainer)) {
            return this.minimizedContainer;
        }
        
        console.log("Creating minimized canvases container...");
        
        // Try to find if it already exists
        let minimizedContainer = document.querySelector('.minimized-canvases');
        
        if (!minimizedContainer || !document.body.contains(minimizedContainer)) {
            // Create minimized canvases container
            minimizedContainer = document.createElement('div');
            minimizedContainer.className = 'minimized-canvases';
            document.body.appendChild(minimizedContainer);
        }
        
        this.minimizedContainer = minimizedContainer;
        console.log("Minimized container initialized");
        
        return this.minimizedContainer;
    }
    
    /**
     * Clean up DOM references - useful for testing
     */
    cleanup() {
        this.canvasContainer = null;
        this.mainContainer = null;
        this.terminalWindow = null;
        this.canvasWindow = null;
        this.tabsContainer = null;
        this.tabsList = null;
        this.minimizedContainer = null;
    }
}

// Make available globally
window.CanvasDOMManager = CanvasDOMManager;