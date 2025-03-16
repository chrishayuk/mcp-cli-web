/**
 * js/canvas/collapsible-canvas/canvas-setup-manager.js
 * Component initialization for collapsible canvas system
 */

/**
 * Class to manage component setup and initialization
 */
class CanvasSetupManager {
    /**
     * Create a setup manager
     * @param {CollapsibleCanvasManager} canvasManager - Parent canvas manager
     */
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
    }
    
    /**
     * Initialize all canvas system components
     */
    initialize() {
        console.log("Initializing Canvas Setup Manager...");
        
        try {
            // Initialize tab system
            this.setupCanvasTabs();
            
            // Initialize layout controls
            this.setupLayoutControls();
            
            // Setup module switcher
            this.setupModuleSwitcher();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Setup content monitors
            this.setupContentMonitors();
            
            console.log("Canvas Setup Manager initialized");
        } catch (error) {
            console.error("Error during canvas system setup:", error);
        }
    }
    
    /**
     * Set up canvas tabs system
     */
    setupCanvasTabs() {
        // No setup required - the DOM manager has already ensured tabsList exists
        console.log("Setting up canvas tabs system");
    }
    
    /**
     * Set up layout controls
     */
    setupLayoutControls() {
        console.log("Setting up layout controls");
        const { mainContainer, canvasWindow, terminalWindow } = this.canvasManager;
        
        if (!mainContainer || !canvasWindow || !terminalWindow) {
            console.error("Cannot set up layout controls - missing DOM elements");
            return;
        }
        
        // Create resizer handle
        const resizer = document.createElement('div');
        resizer.className = 'canvas-resizer';
        mainContainer.appendChild(resizer);
        
        // Add resize functionality
        let isResizing = false;
        let lastX = 0;
        
        resizer.addEventListener('mousedown', (e) => {
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
        
        // Add collapse/expand button if needed
        const titleBar = canvasWindow.querySelector('.canvas-titlebar');
        if (titleBar && !titleBar.querySelector('.canvas-collapse-button')) {
            const collapseButton = document.createElement('button');
            collapseButton.className = 'canvas-collapse-button';
            collapseButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
            collapseButton.title = 'Collapse canvas section';
            
            collapseButton.addEventListener('click', () => {
                this.canvasManager.toggleCanvasSection();
            });
            
            titleBar.appendChild(collapseButton);
        }
    }
    
    /**
     * Set up module switcher
     */
    setupModuleSwitcher() {
        console.log("Setting up module switcher");
        // Add module buttons to canvas titlebar
        const canvasTitlebar = document.querySelector('.canvas-window .canvas-titlebar');
        if (!canvasTitlebar) {
            console.error("Cannot set up module switcher - titlebar not found");
            return;
        }
        
        // Skip if already exists
        if (canvasTitlebar.querySelector('.module-switcher')) {
            console.log("Module switcher already exists, skipping creation");
            return;
        }
        
        // Create module switcher container
        const moduleSwitcher = document.createElement('div');
        moduleSwitcher.className = 'module-switcher';
        
        // Common modules
        const modules = [
            { name: 'image', icon: 'image', title: 'Image Module' },
            { name: 'code', icon: 'code', title: 'Code Module' },
            { name: 'chart', icon: 'chart-pie', title: 'Chart Module' },
            { name: 'shape', icon: 'shapes', title: 'Shape Module' },
            { name: 'markdown', icon: 'file-alt', title: 'Markdown Module' },
            { name: 'terminal', icon: 'terminal', title: 'Terminal Module' }
        ];
        
        // Create buttons for each module
        modules.forEach(module => {
            const button = document.createElement('button');
            button.className = 'module-button';
            button.dataset.module = module.name;
            button.innerHTML = `<i class="fas fa-${module.icon}"></i>`;
            button.title = module.title;
            
            button.addEventListener('click', () => {
                this.canvasManager.expandCanvasSection();
                this.canvasManager.activateModule(module.name);
            });
            
            moduleSwitcher.appendChild(button);
        });
        
        // Insert module switcher after canvas title
        const titleElement = canvasTitlebar.querySelector('.canvas-title');
        if (titleElement) {
            titleElement.parentNode.insertBefore(moduleSwitcher, titleElement.nextSibling);
        } else {
            canvasTitlebar.appendChild(moduleSwitcher);
        }
        
        // Store reference for updating active state
        this.canvasManager.moduleSwitcher = moduleSwitcher;
    }
    
    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        console.log("Setting up keyboard shortcuts");
        const manager = this.canvasManager;
        
        document.addEventListener('keydown', (e) => {
            // Ctrl+T to create new canvas
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                manager.addNewCanvas('New Canvas');
            }
            
            // Ctrl+W to close current canvas
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                if (manager.activeCanvasId) {
                    manager.closeCanvas(manager.activeCanvasId);
                }
            }
            
            // Ctrl+Tab to switch canvases
            if (e.ctrlKey && e.key === 'Tab') {
                e.preventDefault();
                const canvases = manager.canvasInstances;
                if (canvases.length > 1) {
                    const currentIndex = canvases.findIndex(c => c.id === manager.activeCanvasId);
                    const nextIndex = (currentIndex + 1) % canvases.length;
                    manager.activateCanvas(canvases[nextIndex].id);
                }
            }
            
            // Escape to collapse canvas section
            if (e.key === 'Escape' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                // Only collapse if no modal is open
                const activeModal = document.querySelector('.modal.active, .dialog.active, .popup.active');
                if (!activeModal) {
                    manager.collapseCanvasSection();
                }
            }
        });
        
        // Create a more compact keyboard shortcuts display
        this.setupKeyboardShortcutsDisplay();
    }
    
    /**
     * Set up keyboard shortcuts display
     */
    setupKeyboardShortcutsDisplay() {
        // Find existing keyboard shortcuts
        const existingShortcuts = document.querySelector('.keyboard-shortcut-hints');
        if (existingShortcuts) {
            // Remove existing or hide it
            existingShortcuts.remove();
        }
        
        // Create a more compact keyboard shortcuts display
        const shortcutsDisplay = document.createElement('div');
        shortcutsDisplay.className = 'keyboard-shortcut-compact';
        shortcutsDisplay.innerHTML = `
            <div class="shortcut-title">Keyboard Shortcuts <i class="fas fa-keyboard"></i></div>
            <div class="shortcut-list">
                <div><kbd>Ctrl</kbd>+<kbd>T</kbd> New</div>
                <div><kbd>Ctrl</kbd>+<kbd>W</kbd> Close</div>
                <div><kbd>Ctrl</kbd>+<kbd>Tab</kbd> Switch</div>
                <div><kbd>Dbl-click</kbd> Min</div>
            </div>
        `;
        
        // Add to bottom of chat window instead
        const terminalWindow = document.querySelector('.terminal-window');
        if (terminalWindow) {
            terminalWindow.appendChild(shortcutsDisplay);
        }
    }
    
    /**
     * Set up content monitors
     */
    setupContentMonitors() {
        console.log("Setting up content monitors");
        this.setupChatMonitors();
        this.setupCanvasContentObserver();
    }
    
    /**
     * Monitor chat content buttons for canvas interaction
     */
    setupChatMonitors() {
        const manager = this.canvasManager;
        
        // Monitor chat content buttons
        const chatContainer = document.querySelector('.chat-messages');
        if (chatContainer) {
            // Monitor for clicks on image display buttons and code buttons
            chatContainer.addEventListener('click', e => {
                // Image display buttons
                if (e.target.closest('.chat-image-send') || 
                    e.target.closest('[data-action="showInCanvas"]')) {
                    
                    setTimeout(() => {
                        manager.expandCanvasSection();
                        manager.activateModule('image');
                    }, 100);
                }
                
                // Code display buttons
                if (e.target.closest('.chat-code-send') || 
                    e.target.closest('[data-action="sendToEditor"]')) {
                    
                    setTimeout(() => {
                        manager.expandCanvasSection();
                        manager.activateModule('code');
                    }, 100);
                }
                
                // Chart buttons
                if (e.target.closest('[data-action="createChart"]')) {
                    setTimeout(() => {
                        manager.expandCanvasSection();
                        manager.activateModule('chart');
                    }, 100);
                }
            });
        }
        
        // Also monitor command suggestions
        const commandSuggestions = document.getElementById('command-suggestions');
        if (commandSuggestions) {
            commandSuggestions.addEventListener('click', e => {
                const suggestion = e.target.closest('.command-suggestion');
                if (!suggestion) return;
                
                const text = suggestion.textContent.toLowerCase().trim();
                
                // Check what type of command was clicked
                if (text.includes('chart') || text.includes('pie') || text.includes('bar')) {
                    setTimeout(() => {
                        manager.expandCanvasSection();
                        manager.activateModule('chart');
                    }, 100);
                } else if (text.includes('image')) {
                    setTimeout(() => {
                        manager.expandCanvasSection();
                        manager.activateModule('image');
                    }, 100);
                } else if (text.includes('code') || text.includes('display code')) {
                    setTimeout(() => {
                        manager.expandCanvasSection();
                        manager.activateModule('code');
                    }, 100);
                } else if (text.includes('markdown')) {
                    setTimeout(() => {
                        manager.expandCanvasSection();
                        manager.activateModule('markdown');
                    }, 100);
                } else if (text.includes('terminal')) {
                    setTimeout(() => {
                        manager.expandCanvasSection();
                        manager.activateModule('terminal');
                    }, 100);
                }
            });
        }
    }
    
    /**
     * Monitor for content being added to canvas
     */
    setupCanvasContentObserver() {
        if (!this.canvasManager.canvasContainer) return;
        
        // Create observer to watch for changes
        const observer = new MutationObserver(mutations => {
            // Check if content has been added to canvas instances
            const hasActiveContent = Array.from(document.querySelectorAll('.canvas-instance')).some(instance => {
                // Check if instance has content besides instructions
                return instance.children.length > 3 || // More than basic elements
                      (instance.querySelector('img') && instance.querySelector('img').src) || // Image content
                      instance.querySelector('.code-editor') || // Code editor content
                      instance.querySelector('.chart-container'); // Chart content
            });
            
            if (hasActiveContent) {
                this.canvasManager.expandCanvasSection();
            }
        });
        
        // Start observing changes
        observer.observe(this.canvasManager.canvasContainer, { 
            childList: true, 
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'style', 'class']
        });
    }
}

// Make available globally
window.CanvasSetupManager = CanvasSetupManager;