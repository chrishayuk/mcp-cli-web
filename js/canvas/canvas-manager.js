/**
 * js/canvas-manager.js
 * Canvas Manager - Manages multiple visualization modules
 * Serves as the central controller for all canvas operations
 * Enhanced with title management support
 */
class CanvasManager {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.modules = new Map();
        this.currentModule = null;
        this.zoomLevel = 1;
        
        // Title management
        const canvasTitle = document.getElementById('canvasTitle');
        this._defaultTitle = canvasTitle ? canvasTitle.textContent : 'Canvas Display';
        
        this.setupEventListeners();
        this.updateCanvasStatus('success', 'Ready');
    }
    
    /**
     * Update the canvas title
     * @param {string} title - New title or null to reset to default
     * @returns {this} For method chaining
     */
    updateCanvasTitle(title) {
        const canvasTitle = document.getElementById('canvasTitle');
        if (canvasTitle) {
            canvasTitle.textContent = title || this._defaultTitle;
        }
        return this;
    }
    
    /**
     * Reset the canvas title to default
     * @returns {this} For method chaining
     */
    resetCanvasTitle() {
        return this.updateCanvasTitle(this._defaultTitle);
    }
    
    /**
     * Register a module with the canvas manager
     * @param {string} name - Name of the module
     * @param {CanvasModule} module - Module instance
     */
    registerModule(name, module) {
        module.init(this.canvas, this.ctx, this);
        this.modules.set(name, module);
        console.log(`Registered module: ${name}`);
        return this;
    }
    
    /**
     * Activate a specific module
     * @param {string} name - Name of the module to activate
     */
    activateModule(name) {
        if (!this.modules.has(name)) {
            console.error(`Module not found: ${name}`);
            return false;
        }
        
        // Deactivate current module if one is active
        if (this.currentModule) {
            this.currentModule.deactivate();
        }
        
        // Activate new module
        this.currentModule = this.modules.get(name);
        this.currentModule.activate();
        
        // Update title if module didn't set one
        if (!this.currentModule.getModuleTitle()) {
            this.resetCanvasTitle();
        }
        
        console.log(`Activated module: ${name}`);
        return true;
    }
    
    /**
     * Get a registered module
     * @param {string} name - Name of the module
     * @returns {CanvasModule} The requested module
     */
    getModule(name) {
        return this.modules.get(name);
    }
    
    /**
     * Clear the canvas
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.showInstructions();
        return this;
    }
    
    /**
     * Execute a command on the current module
     * @param {string} command - Command to execute
     * @param {Array} args - Arguments for the command
     */
    executeCommand(command, ...args) {
        if (!this.currentModule) {
            console.error('No active module to execute command on');
            return false;
        }
        
        return this.currentModule.handleCommand(command, args);
    }
    
    /**
     * Set up canvas event listeners
     */
    setupEventListeners() {
        // Zoom in button
        document.getElementById('zoomInButton').addEventListener('click', () => {
            this.zoomIn();
        });
        
        // Zoom out button
        document.getElementById('zoomOutButton').addEventListener('click', () => {
            this.zoomOut();
        });
        
        // Reset view button
        document.getElementById('resetViewButton').addEventListener('click', () => {
            this.resetZoom();
        });
        
        // Clear button
        document.getElementById('clearButton').addEventListener('click', () => {
            this.clearCanvas();
            terminal.addOutput('$ clear canvas');
        });
        
        // Window resize event
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    /**
     * Handle window resize event
     */
    handleResize() {
        if (this.currentModule) {
            this.currentModule.resize();
        }
    }
    
    /**
     * Update canvas status
     */
    updateCanvasStatus(state, message) {
        const indicator = document.getElementById('canvasStatus');
        if (!indicator) return;
        
        indicator.className = 'status ' + state;
        
        let icon = 'desktop';
        if (state === 'loading') icon = 'spinner fa-spin';
        else if (state === 'success') icon = 'check-circle';
        else if (state === 'error') icon = 'exclamation-circle';
        
        indicator.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
    }
    
    /**
     * Hide canvas instructions
     */
    hideInstructions() {
        const instructions = document.getElementById('canvasInstructions');
        if (instructions) {
            instructions.style.display = 'none';
        }
    }
    
    /**
     * Show canvas instructions
     */
    showInstructions() {
        const instructions = document.getElementById('canvasInstructions');
        if (instructions) {
            instructions.style.display = 'block';
        }
    }
    
    /**
     * Zoom in on canvas
     */
    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel + 0.1, 3);
        this.applyZoom();
    }
    
    /**
     * Zoom out on canvas
     */
    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5);
        this.applyZoom();
    }
    
    /**
     * Reset zoom level
     */
    resetZoom() {
        this.zoomLevel = 1;
        this.applyZoom();
    }
    
    /**
     * Apply zoom transformation
     */
    applyZoom() {
        this.canvas.style.transform = `scale(${this.zoomLevel})`;
    }
}

// Export for module system
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = CanvasManager;
}