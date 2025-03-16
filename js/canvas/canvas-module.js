/**
 * Base Canvas Module Interface with Title Support
 * All canvas visualization modules should extend this class
 */
class CanvasModule {
    constructor() {
        this.moduleTitle = null; // Title to display when module is active
        this.isActive = false;
    }
    
    /**
     * Initialize the module
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {CanvasManager} manager - Reference to the canvas manager
     */
    init(canvas, ctx, manager) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.manager = manager;
        return this;
    }
    
    /**
     * Get the module's display title
     * @returns {string|null} The title to display, or null for default title
     */
    getModuleTitle() {
        return this.moduleTitle;
    }
    
    /**
     * Set the module's display title
     * @param {string} title - The title to display when module is active
     * @returns {this} For method chaining
     */
    setModuleTitle(title) {
        this.moduleTitle = title;
        
        // Update title immediately if we're active
        if (this.isActive && this.manager && typeof this.manager.updateCanvasTitle === 'function') {
            this.manager.updateCanvasTitle(title);
        }
        
        return this;
    }
    
    /**
     * Activate this module
     */
    activate() {
        this.isActive = true;
        this.manager.hideInstructions();
        
        // Update title if we have one
        if (this.manager && typeof this.manager.updateCanvasTitle === 'function') {
            this.manager.updateCanvasTitle(this.getModuleTitle());
        }
        
        return this;
    }
    
    /**
     * Deactivate this module
     */
    deactivate() {
        this.isActive = false;
        return this;
    }
    
    /**
     * Render content to the canvas
     * Should be implemented by subclasses
     */
    render() {
        throw new Error('Method render() must be implemented by subclass');
    }
    
    /**
     * Handle a command
     * @param {string} command - Command to handle
     * @param {Array} args - Command arguments
     */
    handleCommand(command, args) {
        throw new Error('Method handleCommand() must be implemented by subclass');
    }
    
    /**
     * Handle canvas resize
     */
    resize() {
        // Default implementation - can be overridden by subclasses
        this.render();
    }
    
    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        return this;
    }
    
    /**
     * Draw error message on canvas
     * @param {string} message - Error message to display
     */
    drawError(message) {
        this.clear();
        this.ctx.fillStyle = '#0FFF0F';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(message, this.canvas.width/2, this.canvas.height/2);
        return this;
    }
}

// Export for module system
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = CanvasModule;
}