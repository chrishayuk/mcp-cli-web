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
        
        // Initialize the system components in the proper order:
        // 1. Ensure DOM elements exist.
        // 2. Initialize component systems.
        // 3. Set up the default state.
        this.initDOMElements();
        this.initComponents();
        this.initDefaultState();
        
        console.log("CollapsibleCanvasManager initialized successfully");
    }
    
    /**
     * Initialize DOM elements required by the system.
     */
    initDOMElements() {
        this.DOMManager = new CanvasDOMManager(this);
        this.DOMManager.initialize();
        
        // Store crucial DOM references locally for easy access.
        this.canvasContainer = this.DOMManager.canvasContainer;
        this.mainContainer = this.DOMManager.mainContainer;
        this.terminalWindow = this.DOMManager.terminalWindow;
        this.canvasWindow = this.DOMManager.canvasWindow;
        this.tabsList = this.DOMManager.tabsList;
        this.tabsContainer = this.DOMManager.tabsContainer;
        this.minimizedContainer = this.DOMManager.minimizedContainer;
    }
    
    /**
     * Initialize component systems using dependency injection.
     */
    initComponents() {
        // Set up component managers with the proper reference to this instance.
        this.setupManager = new CanvasSetupManager(this);
        this.setupManager.initialize();
        
        this.layoutManager = new CanvasLayoutManager(this);
        this.layoutManager.initialize();
        
        this.tabManager = new CanvasTabManager(this);
        this.tabManager.initialize();
    }
    
    /**
     * Initialize the default state of the canvas system.
     */
    initDefaultState() {
        // Collapse the canvas section by default.
        this.collapseCanvasSection();
        
        // Create a main canvas but do not display it immediately.
        this.addNewCanvas('Canvas Display', 'main', false);
    }
    
    /**
     * Toggle the canvas section between collapsed and expanded.
     */
    toggleCanvasSection() {
        if (this.canvasWindow.classList.contains('collapsed')) {
            this.expandCanvasSection();
        } else {
            this.collapseCanvasSection();
        }
    }
    
    /**
     * Collapse the canvas section.
     */
    collapseCanvasSection() {
        this.layoutManager.collapseCanvasSection();
    }
    
    /**
     * Expand the canvas section.
     */
    expandCanvasSection() {
        this.layoutManager.expandCanvasSection();
    }
    
    /**
     * Add a new canvas instance.
     * @param {string} title - Canvas title.
     * @param {string} id - Canvas ID (optional; generated if not provided).
     * @param {boolean} activate - Whether to activate the canvas immediately (default: true).
     * @returns {string|null} - The canvas instance ID, or null if creation failed.
     */
    addNewCanvas(title, id = null, activate = true) {
        id = id || 'canvas-' + Date.now();
        
        // Create a new canvas instance.
        const instance = this.createCanvasInstance(title, id);
        if (!instance) {
            console.error("Failed to create canvas instance");
            return null;
        }
        
        // Register the new canvas instance.
        this.canvasInstances.push(instance);
        
        // Create and add a corresponding tab.
        this.tabManager.createTab(title, id);
        
        // Activate the new canvas if requested.
        if (activate) {
            this.activateCanvas(id);
            this.expandCanvasSection();
        }
        
        return id;
    }
    
    /**
     * Create a canvas instance (factory method).
     * @param {string} title - Canvas title.
     * @param {string} id - Canvas ID.
     * @returns {Object|null} - The canvas instance object, or null on failure.
     */
    createCanvasInstance(title, id) {
        // Ensure the canvas container exists.
        if (!this.DOMManager.ensureCanvasContainer()) {
            return null;
        }
        
        // Create the container for the canvas instance.
        const container = document.createElement('div');
        container.className = 'canvas-instance';
        container.dataset.canvasId = id;
        
        // Create the actual canvas element.
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        canvas.id = `canvas-${id}`;
        container.appendChild(canvas);
        
        // Create a hidden title bar (styled via CSS).
        const titleBar = document.createElement('div');
        titleBar.className = 'canvas-titlebar';
        titleBar.style.display = 'none';
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
        
        // Create an instructions overlay.
        const instructions = document.createElement('div');
        instructions.className = 'instructions-overlay';
        instructions.innerHTML = `
            <i class="fas fa-photo-video"></i>
            <p>Ask the assistant to show an image or create a chart</p>
            <p>Try "show random image" or "chart pie"</p>
        `;
        container.appendChild(instructions);
        
        // Add control buttons (e.g., zoom in/out, reset view).
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
        
        // Append the canvas instance container to the main canvas container.
        this.canvasContainer.appendChild(container);
        
        // Return the instance object.
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
     * Activate a specific canvas instance.
     * @param {string} id - Canvas ID to activate.
     * @returns {CollapsibleCanvasManager} - This canvas manager instance.
     */
    activateCanvas(id) {
        // Ensure that the tabs list exists.
        this.DOMManager.ensureTabsList();
        
        // 1. Deactivate the previously active module (if any).
        if (this.activeCanvasId && this.activeCanvasId !== id) {
            const oldInstance = this.canvasInstances.find(inst => inst.id === this.activeCanvasId);
            if (oldInstance && oldInstance.currentModule) {
                oldInstance.currentModule.deactivate();
            }
        }
        
        // 2. Hide all other canvas instances; show only the target.
        this.canvasInstances.forEach(instance => {
            instance.container.style.display = (instance.id === id) ? 'flex' : 'none';
        });
        
        // 3. Update tab classes: remove 'active' from the old, add to the new.
        if (this.activeCanvasId) {
            const prevTab = this.tabsList.querySelector(`.canvas-tab[data-canvas-id="${this.activeCanvasId}"]`);
            if (prevTab) prevTab.classList.remove('active');
            const prevCanvas = document.querySelector(`.canvas-instance[data-canvas-id="${this.activeCanvasId}"]`);
            if (prevCanvas) prevCanvas.classList.remove('active');
        }
        const newTab = this.tabsList.querySelector(`.canvas-tab[data-canvas-id="${id}"]`);
        const newCanvas = document.querySelector(`.canvas-instance[data-canvas-id="${id}"]`);
        if (newTab) newTab.classList.add('active');
        if (newCanvas) newCanvas.classList.add('active');
        
        // 4. Update activeCanvasId.
        this.activeCanvasId = id;
        
        // 5. If the canvas was minimized, restore it.
        this.restoreCanvas(id);
        
        // 6. Update references and activate the module in the new instance.
        this.updateCanvasReferences(id);
        
        return this;
    }
    
    /**
     * Update canvas references when a canvas is activated.
     * @param {string} id - Canvas ID.
     */
    updateCanvasReferences(id) {
        const instance = this.canvasInstances.find(inst => inst.id === id);
        if (!instance) return;
        
        // Update the main canvas and context references.
        this.canvas = instance.canvas;
        this.ctx = instance.ctx;
        
        // Activate the module associated with this instance (if any).
        if (instance.currentModule) {
            this.currentModule = instance.currentModule;
            if (this.currentModule && typeof this.currentModule.activate === 'function') {
                setTimeout(() => {
                    this.currentModule.activate();
                    if (this.moduleSwitcher && this.currentModule.moduleName) {
                        this.updateModuleSwitcher(this.currentModule.moduleName);
                    }
                }, 50);
            }
        }
        
        // Update the main titlebar with the instance's title.
        const titleElement = document.querySelector('.canvas-window .canvas-titlebar .canvas-title span');
        if (titleElement && instance.title) {
            titleElement.textContent = instance.title;
        }
    }
    
    /**
     * Update the module switcher UI to reflect the active module.
     * @param {string} moduleName - Name of the active module.
     */
    updateModuleSwitcher(moduleName) {
        if (!this.moduleSwitcher) return;
        const buttons = this.moduleSwitcher.querySelectorAll('.module-button');
        buttons.forEach(button => {
            button.dataset.active = "false";
            button.classList.remove('active');
        });
        const activeButton = this.moduleSwitcher.querySelector(`.module-button[data-module="${moduleName}"]`);
        if (activeButton) {
            activeButton.dataset.active = "true";
            activeButton.classList.add('active');
        }
    }
    
    /**
     * Close a canvas instance.
     * @param {string} id - Canvas ID to close.
     * @returns {boolean} - Whether the canvas was successfully closed.
     */
    closeCanvas(id) {
        // Do not close if it's the last canvas.
        if (this.canvasInstances.length <= 1) {
            this.collapseCanvasSection();
            return false;
        }
        
        const instance = this.canvasInstances.find(inst => inst.id === id);
        if (!instance) return false;
        
        // Remove the associated tab.
        this.tabManager.removeTab(id);
        
        // Remove the canvas instance from the DOM.
        if (instance.container && instance.container.parentNode) {
            instance.container.parentNode.removeChild(instance.container);
        }
        
        // If the canvas was minimized, restore it first.
        this.restoreCanvas(id);
        
        // Remove the instance from the array.
        const index = this.canvasInstances.findIndex(inst => inst.id === id);
        if (index !== -1) {
            this.canvasInstances.splice(index, 1);
        }
        
        // If the closed canvas was active, activate another one.
        if (this.activeCanvasId === id && this.canvasInstances.length > 0) {
            this.activateCanvas(this.canvasInstances[0].id);
        }
        
        // If no canvases remain, collapse the canvas section.
        if (this.canvasInstances.length === 0) {
            this.collapseCanvasSection();
        }
        
        return true;
    }
    
    /**
     * Close all canvases except the one specified.
     * @param {string} exceptId - ID of the canvas to keep open.
     * @returns {boolean} - Whether the operation was successful.
     */
    closeOtherCanvases(exceptId) {
        const toClose = this.canvasInstances
            .filter(inst => inst.id !== exceptId)
            .map(inst => inst.id);
        toClose.forEach(id => this.closeCanvas(id));
        return true;
    }
    
    /**
     * Close all canvases and create a new default one.
     * @returns {boolean} - Whether the operation was successful.
     */
    closeAllCanvases() {
        const toClose = this.canvasInstances.map(inst => inst.id);
        toClose.forEach(id => this.closeCanvas(id));
        
        this.collapseCanvasSection();
        
        if (this.canvasInstances.length === 0) {
            this.addNewCanvas('Canvas Display', null, false);
        }
        
        return true;
    }
    
    /**
     * Rename a canvas instance.
     * @param {string} id - Canvas ID to rename.
     * @param {string} newName - New canvas name.
     * @returns {boolean} - Whether the renaming was successful.
     */
    renameCanvas(id, newName) {
        if (!newName) return false;
        
        // Update the tab title.
        this.tabManager.updateTabTitle(id, newName);
        
        // Update the canvas instance's title in the DOM.
        const canvas = document.querySelector(`.canvas-instance[data-canvas-id="${id}"]`);
        if (canvas) {
            const titleSpan = canvas.querySelector('.canvas-title span');
            if (titleSpan) titleSpan.textContent = newName;
        }
        
        // Also update the main titlebar if this is the active canvas.
        if (id === this.activeCanvasId) {
            const mainTitleSpan = document.querySelector('.canvas-window .canvas-titlebar .canvas-title span');
            if (mainTitleSpan) mainTitleSpan.textContent = newName;
        }
        
        // Update the instance in the internal array.
        const instance = this.canvasInstances.find(inst => inst.id === id);
        if (instance) {
            instance.title = newName;
        }
        
        return true;
    }
    
    /**
     * Minimize a canvas instance.
     * @param {string} id - Canvas ID to minimize.
     * @returns {boolean} - Whether minimization was successful.
     */
    minimizeCanvas(id) {
        this.DOMManager.ensureMinimizedContainer();
        
        if (this.minimizedCanvases.includes(id)) {
            return false;
        }
        
        this.minimizedCanvases.push(id);
        
        const instance = this.canvasInstances.find(inst => inst.id === id);
        if (!instance) return false;
        
        const minimized = this.createMinimizedElement(id, instance.title);
        this.minimizedContainer.appendChild(minimized);
        
        this.tabManager.setTabMinimized(id, true);
        
        if (this.activeCanvasId === id) {
            this.activateAnotherCanvas(id);
        }
        
        return true;
    }
    
    /**
     * Create a minimized element for a canvas instance.
     * @param {string} id - Canvas ID.
     * @param {string} title - Canvas title.
     * @returns {HTMLElement} - The minimized element.
     */
    createMinimizedElement(id, title) {
        const minimized = document.createElement('div');
        minimized.className = 'minimized-canvas';
        minimized.dataset.canvasId = id;
        minimized.innerHTML = `
            <i class="fas fa-desktop minimized-canvas-icon"></i>
            <span>${title}</span>
        `;
        minimized.addEventListener('click', () => {
            this.restoreCanvas(id);
            this.activateCanvas(id);
            this.expandCanvasSection();
        });
        return minimized;
    }
    
    /**
     * Activate another canvas instance when the current one is minimized or closed.
     * @param {string} currentId - ID of the canvas being closed or minimized.
     */
    activateAnotherCanvas(currentId) {
        const nextCanvas = this.canvasInstances.find(
            inst => !this.minimizedCanvases.includes(inst.id) && inst.id !== currentId
        );
        if (nextCanvas) {
            this.activateCanvas(nextCanvas.id);
        } else {
            this.collapseCanvasSection();
        }
    }
    
    /**
     * Restore a minimized canvas instance.
     * @param {string} id - Canvas ID to restore.
     * @returns {boolean} - Whether restoration was successful.
     */
    restoreCanvas(id) {
        const index = this.minimizedCanvases.indexOf(id);
        if (index === -1) return false;
        
        this.minimizedCanvases.splice(index, 1);
        
        if (this.minimizedContainer) {
            const minimized = this.minimizedContainer.querySelector(`.minimized-canvas[data-canvas-id="${id}"]`);
            if (minimized) this.minimizedContainer.removeChild(minimized);
        }
        
        this.tabManager.setTabMinimized(id, false);
        return true;
    }
    
    /**
     * Register a module with the canvas manager.
     * @param {string} name - Module name.
     * @param {CanvasModule} module - Module instance.
     * @returns {CollapsibleCanvasManager} - This canvas manager instance.
     */
    registerModule(name, module) {
        super.registerModule(name, module);
        module.moduleName = name;
        this.registerModuleWithActiveCanvas(name, module);
        return this;
    }
    
    /**
     * Register a module with the currently active canvas.
     * @param {string} name - Module name.
     * @param {CanvasModule} module - Module instance.
     */
    registerModuleWithActiveCanvas(name, module) {
        const instance = this.canvasInstances.find(inst => inst.id === this.activeCanvasId);
        if (!instance) return;
        const moduleClone = this.cloneModule(module, name);
        moduleClone.init(instance.canvas, instance.ctx, this);
        instance.modules.set(name, moduleClone);
    }
    
    /**
     * Clone a canvas module.
     * @param {CanvasModule} module - Original module.
     * @param {string} name - Module name.
     * @returns {CanvasModule} - Cloned module.
     */
    cloneModule(module, name) {
        try {
            if (module.constructor && typeof module.constructor === 'function') {
                const clone = new module.constructor();
                clone.moduleName = name;
                return clone;
            }
        } catch (e) {
            console.error("Error cloning module:", e);
        }
        return module;
    }
    
    /**
     * Activate a module by name.
     * @param {string} name - Module name to activate.
     * @returns {boolean} - Whether activation was successful.
     */
    activateModule(name) {
        const instance = this.canvasInstances.find(inst => inst.id === this.activeCanvasId);
        if (instance && instance.modules.has(name)) {
            return this.activateInstanceModule(instance, name);
        } else {
            return this.activateFallbackModule(name);
        }
    }
    
    /**
     * Activate an instance-specific module.
     * @param {Object} instance - Canvas instance.
     * @param {string} name - Module name.
     * @returns {boolean} - Success status.
     */
    activateInstanceModule(instance, name) {
        const module = instance.modules.get(name);
        if (this.currentModule) {
            this.currentModule.deactivate();
        }
        this.currentModule = module;
        this.currentModule.activate();
        instance.currentModule = this.currentModule;
        this.updateModuleSwitcher(name);
        console.log(`Activated module: ${name} for canvas: ${instance.id}`);
        return true;
    }
    
    /**
     * Activate a module using the original CanvasManager method.
     * @param {string} name - Module name.
     * @returns {boolean} - Success status.
     */
    activateFallbackModule(name) {
        const result = super.activateModule(name);
        if (result) {
            this.updateModuleSwitcher(name);
        }
        return result;
    }
}

/**
 * Initialize the collapsible canvas system.
 * This function replaces the existing canvas manager with the collapsible one.
 */
function initCollapsibleCanvasSystem() {
    console.log("Starting collapsible canvas system initialization");
    try {
        // Create the collapsible canvas manager
        const collapsibleManager = new CollapsibleCanvasManager();
        if (window.Commands && window.Commands.canvasManager) {
            const oldManager = window.Commands.canvasManager;
            if (oldManager.modules) {
                oldManager.modules.forEach((module, name) => {
                    collapsibleManager.registerModule(name, module);
                });
            }
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