/**
 * HTML Module
 * Handles displaying and manipulating HTML content in a designated container.
 * This module follows the same interface as your canvas modules so it can
 * be managed via the same CommandProcessor.
 */
class HtmlModule extends CanvasModule {
    constructor() {
        super();
        this.content = '';       // HTML content to display
        this.container = null;   // The container element where HTML content is rendered
        // Define supported commands similar to the other modules
        this.supportedCommands = ['display', 'update', 'theme', 'clear'];
    }
    
    /**
     * Initialize module with an HTML container instead of a canvas.
     * Here, the manager should pass a container element (which you could create
     * or select from the DOM) instead of a canvas and its context.
     *
     * @param {HTMLElement} container - The container element for HTML content.
     * @param {CanvasRenderingContext2D} ctx - Unused, but kept for interface compatibility.
     * @param {CanvasManager} manager - Reference to the manager.
     */
    init(container, ctx, manager) {
        // Instead of a canvas, we assume container is an HTML element
        this.container = container;
        this.manager = manager;
        // Optionally hide any instructions or initial messages
        if (this.container) {
            this.container.innerHTML = '';
        }
        return this;
    }
    
    /**
     * Activate the HTML module.
     * Makes the container visible and updates the canvas status.
     */
    activate() {
        super.activate();
        this.manager.updateCanvasStatus('success', 'HTML Module Active');
        if (this.container) {
            this.container.style.display = 'block';
        }
        return this;
    }
    
    /**
     * Handle commands for this module.
     * Supported commands:
     *  - display [html]: sets and renders new HTML content.
     *  - update [html]: updates existing HTML content.
     *  - theme [theme]: applies a theme (dark, light, or default).
     *  - clear: clears the HTML content.
     *
     * @param {string} command - The command name.
     * @param {Array} args - Command arguments.
     */
    handleCommand(command, args) {
        switch (command) {
            case 'display':
                if (args && args.length > 0) {
                    return this.displayContent(args[0]);
                }
                return false;
            case 'update':
                if (args && args.length > 0) {
                    return this.updateContent(args[0]);
                }
                return false;
            case 'theme':
                if (args && args.length > 0) {
                    return this.setTheme(args[0]);
                }
                return false;
            case 'clear':
                return this.clearContent();
            default:
                console.error(`Unknown command for HtmlModule: ${command}`);
                return false;
        }
    }
    
    /**
     * Display HTML content in the container.
     *
     * @param {string} html - The HTML string to display.
     */
    displayContent(html) {
        this.manager.hideInstructions();
        this.content = html;
        this.render();
        terminal.addOutput(`[INFO] HTML content displayed`);
        return true;
    }
    
    /**
     * Update the HTML content and re-render.
     *
     * @param {string} html - New HTML content.
     */
    updateContent(html) {
        this.content = html;
        this.render();
        terminal.addOutput(`[INFO] HTML content updated`);
        return true;
    }
    
    /**
     * Set a simple theme for the HTML content.
     * Themes can be customized via CSS.
     *
     * @param {string} theme - The theme name ('dark', 'light', or default).
     */
    setTheme(theme) {
        if (!this.container) return false;
        switch (theme.toLowerCase()) {
            case 'dark':
                this.container.style.backgroundColor = '#333';
                this.container.style.color = '#FFF';
                break;
            case 'light':
                this.container.style.backgroundColor = '#FFF';
                this.container.style.color = '#000';
                break;
            default:
                // Reset to default styles
                this.container.style.backgroundColor = '';
                this.container.style.color = '';
        }
        terminal.addOutput(`[INFO] HTML module theme set to: ${theme}`);
        return true;
    }
    
    /**
     * Clear the HTML content from the container.
     */
    clearContent() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        terminal.addOutput(`[INFO] HTML content cleared`);
        return true;
    }
    
    /**
     * Render the current HTML content into the container.
     */
    render() {
        if (!this.container) {
            console.error('HTML container element is not set');
            return false;
        }
        this.container.innerHTML = this.content;
        return true;
    }
}
