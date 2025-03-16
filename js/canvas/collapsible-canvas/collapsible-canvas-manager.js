/**
 * js/canvas/collapsible-canvas/collapsible-canvas-manager.js
 * Core manager for collapsible canvas functionality - Modular Implementation
 */

class CollapsibleCanvasManager extends CanvasManager {
    constructor() {
        super();
        
        // Initialize core properties
        this.canvasInstances = [];
        this.minimizedCanvases = [];
        this.activeCanvasId = null;
        
        // Initialize the system components in the proper order
        this.initDOMElements();     // First ensure DOM elements exist
        this.initComponents();      // Then initialize component systems
        this.initDefaultState();    // Finally set up the default state
        
        console.log("CollapsibleCanvasManager initialized successfully");
    }
    
    /**
     * Initialize DOM elements required by the system
     */
    initDOMElements() {
        this.DOMManager = new CanvasDOMManager(this);
        this.DOMManager.initialize();
        
        // Store crucial DOM references locally for direct access
        this.canvasContainer = this.DOMManager.canvasContainer;
        this.mainContainer = this.DOMManager.mainContainer;
        this.terminalWindow = this.DOMManager.terminalWindow;
        this.canvasWindow = this.DOMManager.canvasWindow;
        this.tabsList = this.DOMManager.tabsList;
        this.tabsContainer = this.DOMManager.tabsContainer;
        this.minimizedContainer = this.DOMManager.minimizedContainer;
    }
    
    /**
     * Initialize component systems using dependency injection
     */
    initComponents() {
        // Set up component managers with proper reference to this instance
        this.setupManager = new CanvasSetupManager(this);
        this.setupManager.initialize();
        
        this.layoutManager = new CanvasLayoutManager(this);
        this.layoutManager.initialize();
        
        this.tabManager = new CanvasTabManager(this);
        this.tabManager.initialize();
    }
    
    /**
     * Initialize default state of the canvas system
     */
    initDefaultState() {
        // Collapse canvas section by default
        this.collapseCanvasSection();
        
        // Create main canvas but don't display it yet
        this.addNewCanvas('Canvas Display', 'main', false);
    }
    
    /**
     * Toggle canvas section between collapsed and expanded
     */
    toggleCanvasSection() {
        if (this.canvasWindow.classList.contains('collapsed')) {
            this.expandCanvasSection();
        } else {
            this.collapseCanvasSection();
        }
    }
    
    /**
     * Collapse canvas section
     */
    collapseCanvasSection() {
        this.layoutManager.collapseCanvasSection();
    }
    
    /**
     * Expand canvas section
     */
    expandCanvasSection() {
        this.layoutManager.expandCanvasSection();
    }
    
    /**
     * Add a new canvas
     * @param {string} title - Canvas title
     * @param {string} id - Canvas ID (optional, generated if not provided)
     * @param {boolean} activate - Whether to activate the canvas immediately (default: true)
     */
    addNewCanvas(title, id = null, activate = true) {
        id = id || 'canvas-' + Date.now();
        
        // Use canvas instance factory to create the canvas instance
        const instance = this.createCanvasInstance(title, id);
        if (!instance) {
            console.error("Failed to create canvas instance");
            return null;
        }
        
        // Register the canvas instance
        this.canvasInstances.push(instance);
        
        // Create and add tab for this canvas
        this.tabManager.createTab(title, id);
        
        // Activate this canvas if requested
        if (activate) {
            this.activateCanvas(id);
            this.expandCanvasSection();
        }
        
        return id;
    }
    
    /**
     * Create a canvas instance (factory method)
     * @param {string} title - Canvas title
     * @param {string} id - Canvas ID
     * @returns {Object} - Canvas instance object
     */
    createCanvasInstance(title, id) {
        // Ensure canvas container exists
        if (!this.DOMManager.ensureCanvasContainer()) {
            return null;
        }
        
        // Create canvas instance container
        const container = document.createElement('div');
        container.className = 'canvas-instance';
        container.dataset.canvasId = id;
        
        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        canvas.id = `canvas-${id}`;
        container.appendChild(canvas);
        
        // Create title bar (hidden by CSS)
        const titleBar = document.createElement('div');
        titleBar.className = 'canvas-titlebar';
        titleBar.style.display = 'none'; // Hide with inline style
        titleBar.innerHTML = `
            <div class="canvas-title">
                <i class="fas fa-desktop"></i>
                <span>${title}</span>
            </div>
            <div class="status success">
                <i class="fas fa-check-circle"></i>
                <span>Ready</span>
            </div>
        `;
        container.appendChild(titleBar);
        
        // Create instructions overlay
        const instructions = document.createElement('div');
        instructions.className = 'instructions-overlay';
        instructions.innerHTML = `
            <i class="fas fa-photo-video"></i>
            <p>Ask the assistant to show an image or create a chart</p>
            <p>Try "show random image" or "chart pie"</p>
        `;
        container.appendChild(instructions);
        
        // Add controls
        const controls = document.createElement('div');
        controls.className = 'canvas-controls';
        controls.innerHTML = `
            <button class="terminal-button zoom-in-button">
                <i class="fas fa-search-plus"></i>
            </button>
            <button class="terminal-button zoom-out-button">
                <i class="fas fa-search-minus"></i>
            </button>
            <button class="terminal-button reset-view-button">
                <i class="fas fa-compress-arrows-alt"></i>
            </button>
        `;
        container.appendChild(controls);
        
        // Add to canvas container
        this.canvasContainer.appendChild(container);
        
        // Create and return canvas instance object
        return {
            id,
            title,
            container,
            canvas,
            ctx: canvas.getContext('2d'),
            modules: new Map()
        };
    }
    
    /**
     * Activate a specific canvas
     * @param {string} id - Canvas ID to activate
     */
    activateCanvas(id) {
        // Verify tabsList still exists
        this.DOMManager.ensureTabsList();
        
        // Deactivate current canvas
        if (this.activeCanvasId) {
            const currentTab = this.tabsList.querySelector(`.canvas-tab[data-canvas-id="${this.activeCanvasId}"]`);
            const currentCanvas = document.querySelector(`.canvas-instance[data-canvas-id="${this.activeCanvasId}"]`);
            
            if (currentTab) currentTab.classList.remove('active');
            if (currentCanvas) currentCanvas.classList.remove('active');
        }
        
        // Activate new canvas
        const newTab = this.tabsList.querySelector(`.canvas-tab[data-canvas-id="${id}"]`);
        const newCanvas = document.querySelector(`.canvas-instance[data-canvas-id="${id}"]`);
        
        if (newTab) newTab.classList.add('active');
        if (newCanvas) newCanvas.classList.add('active');
        
        this.activeCanvasId = id;
        
        // If it was minimized, restore it
        this.restoreCanvas(id);
        
        // Update canvas references
        this.updateCanvasReferences(id);
        
        return this;
    }
    
    /**
     * Update canvas references when activating a canvas
     * @param {string} id - Canvas ID
     */
    updateCanvasReferences(id) {
        const instance = this.canvasInstances.find(instance => instance.id === id);
        if (!instance) return;
        
        // Update canvas and context
        this.canvas = instance.canvas;
        this.ctx = instance.ctx;
        
        // Update module if there is one
        if (instance.currentModule) {
            this.currentModule = instance.currentModule;
            
            // Force module activation
            if (this.currentModule && typeof this.currentModule.activate === 'function') {
                setTimeout(() => {
                    this.currentModule.activate();
                    
                    // Update module switcher if it exists
                    if (this.moduleSwitcher && this.currentModule.moduleName) {
                        this.updateModuleSwitcher(this.currentModule.moduleName);
                    }
                }, 50);
            }
        }
        
        // Update title in main titlebar
        const titleElement = document.querySelector('.canvas-window .canvas-titlebar .canvas-title span');
        if (titleElement && instance.title) {
            titleElement.textContent = instance.title;
        }
    }
    
    /**
     * Update the module switcher UI
     * @param {string} moduleName - Name of active module
     */
    updateModuleSwitcher(moduleName) {
        if (!this.moduleSwitcher) return;
        
        // Reset all buttons
        const buttons = this.moduleSwitcher.querySelectorAll('.module-button');
        buttons.forEach(button => {
            button.dataset.active = "false";
            button.classList.remove('active');
        });
        
        // Set active button
        const activeButton = this.moduleSwitcher.querySelector(`.module-button[data-module="${moduleName}"]`);
        if (activeButton) {
            activeButton.dataset.active = "true";
            activeButton.classList.add('active');
        }
    }
    
    /**
     * Close a canvas
     * @param {string} id - Canvas ID to close
     */
    closeCanvas(id) {
        // Don't close if it's the last one
        if (this.canvasInstances.length <= 1) {
            this.collapseCanvasSection();
            return false;
        }
        
        // Get references before removing
        const instance = this.canvasInstances.find(instance => instance.id === id);
        if (!instance) return false;
        
        // Remove tab element
        this.tabManager.removeTab(id);
        
        // Remove canvas element
        if (instance.container && instance.container.parentNode) {
            instance.container.parentNode.removeChild(instance.container);
        }
        
        // Remove from minimized list if it's there
        this.restoreCanvas(id);
        
        // Remove from instances array
        const index = this.canvasInstances.findIndex(instance => instance.id === id);
        if (index !== -1) {
            this.canvasInstances.splice(index, 1);
        }
        
        // If closing the active canvas, activate another one
        if (this.activeCanvasId === id && this.canvasInstances.length > 0) {
            this.activateCanvas(this.canvasInstances[0].id);
        }
        
        // If no more canvases, collapse section
        if (this.canvasInstances.length === 0) {
            this.collapseCanvasSection();
        }
        
        return true;
    }
    
    /**
     * Close all canvases except one
     * @param {string} exceptId - ID of canvas to keep open
     */
    closeOtherCanvases(exceptId) {
        const toClose = this.canvasInstances
            .filter(instance => instance.id !== exceptId)
            .map(instance => instance.id);
        
        toClose.forEach(id => this.closeCanvas(id));
        return true;
    }
    
    /**
     * Close all canvases and create a new default one
     */
    closeAllCanvases() {
        const toClose = this.canvasInstances.map(instance => instance.id);
        toClose.forEach(id => this.closeCanvas(id));
        
        // Collapse canvas section
        this.collapseCanvasSection();
        
        // Create a new canvas if all are closed
        if (this.canvasInstances.length === 0) {
            this.addNewCanvas('Canvas Display', null, false);
        }
        
        return true;
    }
    
    /**
     * Rename a canvas
     * @param {string} id - Canvas ID to rename
     * @param {string} newName - New canvas name
     */
    renameCanvas(id, newName) {
        if (!newName) return false;
        
        // Update tab title
        this.tabManager.updateTabTitle(id, newName);
        
        // Update canvas title
        const canvas = document.querySelector(`.canvas-instance[data-canvas-id="${id}"]`);
        if (canvas) {
            const titleSpan = canvas.querySelector('.canvas-title span');
            if (titleSpan) titleSpan.textContent = newName;
        }
        
        // Update main titlebar if this is the active canvas
        if (id === this.activeCanvasId) {
            const mainTitleSpan = document.querySelector('.canvas-window .canvas-titlebar .canvas-title span');
            if (mainTitleSpan) mainTitleSpan.textContent = newName;
        }
        
        // Update in instances array
        const instance = this.canvasInstances.find(instance => instance.id === id);
        if (instance) {
            instance.title = newName;
        }
        
        return true;
    }
    
    /**
     * Minimize a canvas
     * @param {string} id - Canvas ID to minimize
     */
    minimizeCanvas(id) {
        // Ensure minimized container exists
        this.DOMManager.ensureMinimizedContainer();
        
        // Ignore if already minimized
        if (this.minimizedCanvases.includes(id)) {
            return false;
        }
        
        // Add to minimized list
        this.minimizedCanvases.push(id);
        
        // Create minimized representation
        const instance = this.canvasInstances.find(instance => instance.id === id);
        if (!instance) return false;
        
        // Create the minimized element
        const minimized = this.createMinimizedElement(id, instance.title);
        this.minimizedContainer.appendChild(minimized);
        
        // Update tab to show minimized state
        this.tabManager.setTabMinimized(id, true);
        
        // If minimizing the active one, activate another
        if (this.activeCanvasId === id) {
            this.activateAnotherCanvas(id);
        }
        
        return true;
    }
    
    /**
     * Create a minimized element for a canvas
     * @param {string} id - Canvas ID
     * @param {string} title - Canvas title
     * @returns {HTMLElement} - Minimized element
     */
    createMinimizedElement(id, title) {
        const minimized = document.createElement('div');
        minimized.className = 'minimized-canvas';
        minimized.dataset.canvasId = id;
        minimized.innerHTML = `
            <i class="fas fa-desktop minimized-canvas-icon"></i>
            <span>${title}</span>
        `;
        
        // Add event listener to restore
        minimized.addEventListener('click', () => {
            this.restoreCanvas(id);
            this.activateCanvas(id);
            this.expandCanvasSection();
        });
        
        return minimized;
    }
    
    /**
     * Activate another canvas when the active one is closed or minimized
     * @param {string} currentId - ID of canvas being closed/minimized
     */
    activateAnotherCanvas(currentId) {
        // Find another non-minimized canvas
        const nextCanvas = this.canvasInstances.find(instance => 
            !this.minimizedCanvases.includes(instance.id) && instance.id !== currentId
        );
        
        if (nextCanvas) {
            this.activateCanvas(nextCanvas.id);
        } else {
            // No non-minimized canvases left, collapse section
            this.collapseCanvasSection();
        }
    }
    
    /**
     * Restore a minimized canvas
     * @param {string} id - Canvas ID to restore
     */
    restoreCanvas(id) {
        // Check if it's actually minimized
        const index = this.minimizedCanvases.indexOf(id);
        if (index === -1) return false;
        
        // Remove from minimized list
        this.minimizedCanvases.splice(index, 1);
        
        // Remove minimized representation
        if (this.minimizedContainer) {
            const minimized = this.minimizedContainer.querySelector(`.minimized-canvas[data-canvas-id="${id}"]`);
            if (minimized) this.minimizedContainer.removeChild(minimized);
        }
        
        // Update tab to remove minimized state
        this.tabManager.setTabMinimized(id, false);
        
        return true;
    }
    
    /**
     * Register a module with the canvas manager
     * @param {string} name - Name of the module
     * @param {CanvasModule} module - Module instance
     * @returns {CollapsibleCanvasManager} - This canvas manager instance
     */
    registerModule(name, module) {
        // Do normal registration for backward compatibility
        super.registerModule(name, module);
        
        // Store module name for easier reference
        module.moduleName = name;
        
        // Register with current canvas instance
        this.registerModuleWithActiveCanvas(name, module);
        
        return this;
    }
    
    /**
     * Register a module with the currently active canvas
     * @param {string} name - Name of the module
     * @param {CanvasModule} module - Module instance
     */
    registerModuleWithActiveCanvas(name, module) {
        const instance = this.canvasInstances.find(instance => instance.id === this.activeCanvasId);
        if (!instance) return;
        
        // Try to clone the module to avoid sharing state
        let moduleClone = this.cloneModule(module, name);
        
        // Initialize the clone with this canvas
        moduleClone.init(instance.canvas, instance.ctx, this);
        instance.modules.set(name, moduleClone);
    }
    
    /**
     * Clone a canvas module
     * @param {CanvasModule} module - Original module 
     * @param {string} name - Module name
     * @returns {CanvasModule} - Cloned module
     */
    cloneModule(module, name) {
        try {
            // For most modules, creating a new instance works
            if (module.constructor && typeof module.constructor === 'function') {
                const clone = new module.constructor();
                clone.moduleName = name;
                return clone;
            }
        } catch (e) {
            console.error("Error cloning module:", e);
        }
        
        // Fallback to using the original module
        return module;
    }
    
    /**
     * Activate a module
     * @param {string} name - Name of the module to activate
     * @returns {boolean} - Whether activation was successful
     */
    activateModule(name) {
        // Try instance-specific module first
        const instance = this.canvasInstances.find(instance => instance.id === this.activeCanvasId);
        if (instance && instance.modules.has(name)) {
            return this.activateInstanceModule(instance, name);
        } else {
            // Fall back to original behavior
            return this.activateFallbackModule(name);
        }
    }
    
    /**
     * Activate an instance-specific module
     * @param {Object} instance - Canvas instance
     * @param {string} name - Module name
     * @returns {boolean} - Success state
     */
    activateInstanceModule(instance, name) {
        const module = instance.modules.get(name);
        
        // Deactivate current module
        if (this.currentModule) {
            this.currentModule.deactivate();
        }
        
        // Activate new module
        this.currentModule = module;
        this.currentModule.activate();
        
        // Store reference in canvas instance
        instance.currentModule = this.currentModule;
        
        // Update module switcher
        this.updateModuleSwitcher(name);
        
        console.log(`Activated module: ${name} for canvas: ${instance.id}`);
        return true;
    }
    
    /**
     * Activate a module using the original CanvasManager method
     * @param {string} name - Module name
     * @returns {boolean} - Success state
     */
    activateFallbackModule(name) {
        const result = super.activateModule(name);
        
        // Update module switcher if successful
        if (result) {
            this.updateModuleSwitcher(name);
        }
        
        return result;
    }
}

/**
 * Initialize collapsible canvas system
 * This function replaces the existing canvas manager with the collapsible one
 */
function initCollapsibleCanvasSystem() {
    console.log("Starting collapsible canvas system initialization");
    
    try {
        // Create the collapsible canvas manager
        const collapsibleManager = new CollapsibleCanvasManager();
        
        // Replace the existing canvas manager
        if (window.Commands && window.Commands.canvasManager) {
            // Store reference to old manager
            const oldManager = window.Commands.canvasManager;
            
            // Copy over registered modules to the new manager
            if (oldManager.modules) {
                oldManager.modules.forEach((module, name) => {
                    collapsibleManager.registerModule(name, module);
                });
            }
            
            // Replace the manager in the Commands object
            window.Commands.canvasManager = collapsibleManager;
            
            console.log("Initialized collapsible canvas system");
        } else {
            console.error("Commands.canvasManager not found, cannot initialize collapsible system");
        }
        
        return collapsibleManager;
    } catch (error) {
        console.error("Error initializing collapsible canvas system:", error);
        return null;
    }
}

// Expose to global scope
window.CollapsibleCanvasManager = CollapsibleCanvasManager;
window.initCollapsibleCanvasSystem = initCollapsibleCanvasSystem;

console.log("Collapsible Canvas Manager script loaded");