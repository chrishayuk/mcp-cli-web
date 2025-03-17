/**
 * js/canvas/collapsible-canvas/canvas-layout-manager.js
 * Layout management for collapsible canvas system
 */

/**
 * Class to manage canvas layout and sizing
 */
class CanvasLayoutManager {
    /**
     * Create a layout manager
     * @param {CollapsibleCanvasManager} canvasManager - Parent canvas manager
     */
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.resizer = null;
        this.expandButton = null;
    }
    
    /**
     * Initialize layout manager
     */
    initialize() {
        console.log("Initializing Canvas Layout Manager...");
        
        // Set up layout controls
        this.setupLayoutControls();
        
        console.log("Canvas Layout Manager initialized");
    }
    
    /**
     * Set up layout controls
     */
    setupLayoutControls() {
        // Get references to main elements
        const { mainContainer, terminalWindow, canvasWindow } = this.canvasManager;
        
        if (!mainContainer || !terminalWindow || !canvasWindow) {
            console.error("Cannot set up layout controls - missing DOM elements");
            return;
        }
        
        // Create resizer handle if it doesn't exist
        if (!mainContainer.querySelector('.canvas-resizer')) {
            this.createResizer(mainContainer, terminalWindow, canvasWindow);
        }
        
        // Create collapse/expand button if it doesn't exist
        const titleBar = canvasWindow.querySelector('.canvas-titlebar');
        if (titleBar && !titleBar.querySelector('.canvas-collapse-button')) {
            this.createCollapseButton(titleBar);
        }
        
        // Create expand button that shows when canvas is collapsed
        if (!mainContainer.querySelector('.expanding-button')) {
            this.createExpandButton(mainContainer);
        }
    }
    
    /**
     * Create resizer handle
     * @param {HTMLElement} mainContainer - Main container element
     * @param {HTMLElement} terminalWindow - Terminal window element
     * @param {HTMLElement} canvasWindow - Canvas window element
     */
    createResizer(mainContainer, terminalWindow, canvasWindow) {
        // Create resizer element
        this.resizer = document.createElement('div');
        this.resizer.className = 'canvas-resizer';
        mainContainer.appendChild(this.resizer);
        
        // Add resize functionality
        let isResizing = false;
        let lastX = 0;
        
        this.resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            lastX = e.clientX;
            document.body.classList.add('resizing');
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - lastX;
            const terminalWidth = parseInt(getComputedStyle(terminalWindow).width, 10);
            const canvasWidth = parseInt(getComputedStyle(canvasWindow).width, 10);
            
            // Set new widths based on delta
            terminalWindow.style.width = `${terminalWidth - deltaX}px`;
            canvasWindow.style.width = `${canvasWidth + deltaX}px`;
            
            lastX = e.clientX;
        });
        
        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.classList.remove('resizing');
        });
    }
    
    /**
     * Create collapse button in title bar
     * @param {HTMLElement} titleBar - Title bar element
     */
    createCollapseButton(titleBar) {
        const collapseButton = document.createElement('button');
        collapseButton.className = 'canvas-collapse-button';
        collapseButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        collapseButton.title = 'Collapse canvas section';
        
        collapseButton.addEventListener('click', () => {
            this.canvasManager.toggleCanvasSection();
        });
        
        titleBar.appendChild(collapseButton);
    }
    
    /**
     * Create expand button for collapsed state
     * @param {HTMLElement} mainContainer - Main container element
     */
    createExpandButton(mainContainer) {
        this.expandButton = document.createElement('button');
        this.expandButton.className = 'expanding-button';
        this.expandButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        this.expandButton.title = 'Expand canvas section';
        
        this.expandButton.addEventListener('click', () => {
            this.canvasManager.expandCanvasSection();
        });
        
        mainContainer.appendChild(this.expandButton);
    }
    
    /**
     * Collapse canvas section
     */
    collapseCanvasSection() {
        const { canvasWindow, terminalWindow } = this.canvasManager;
        
        if (canvasWindow) {
            canvasWindow.classList.add('collapsed');
        }
        
        if (terminalWindow) {
            terminalWindow.classList.add('expanded');
        }
        
        // Update collapse button icon if it exists
        const collapseButton = document.querySelector('.canvas-collapse-button');
        if (collapseButton) {
            collapseButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
            collapseButton.title = 'Expand canvas section';
        }
    }
    
    /**
     * Expand canvas section
     */
    expandCanvasSection() {
        const { canvasWindow, terminalWindow, activeCanvasId } = this.canvasManager;
        
        if (canvasWindow) {
            canvasWindow.classList.remove('collapsed');
        }
        
        if (terminalWindow) {
            terminalWindow.classList.remove('expanded');
        }
        
        // Update collapse button icon if it exists
        const collapseButton = document.querySelector('.canvas-collapse-button');
        if (collapseButton) {
            collapseButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
            collapseButton.title = 'Collapse canvas section';
        }
        
        // Show active canvas if there is one
        if (activeCanvasId) {
            const activeCanvas = this.canvasManager.canvasInstances.find(
                instance => instance.id === activeCanvasId
            );
            
            if (activeCanvas && activeCanvas.container) {
                activeCanvas.container.classList.add('active');
                
                // Re-activate the current module if it exists
                if (activeCanvas.currentModule && typeof activeCanvas.currentModule.activate === 'function') {
                    setTimeout(() => {
                        activeCanvas.currentModule.activate();
                    }, 50);
                }
            }
        }
    }
    
    /**
     * Clean up event listeners - useful for testing and disposal
     */
    cleanup() {
        // Nothing to clean up yet
    }
}

// Make available globally
window.CanvasLayoutManager = CanvasLayoutManager;