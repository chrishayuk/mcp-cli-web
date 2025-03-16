/**
 * js/canvas/collapsible-canvas/canvas-setup-manager.js
 * Component initialization for collapsible canvas system
 */

class CanvasSetupManager {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this._shortcutsDisplay = null;
        this._shortcutsToggle = null;
    }
    
    initialize() {
        console.log("Initializing Canvas Setup Manager...");
        
        try {
            this.setupCanvasTabs();
            this.setupLayoutControls();
            this.setupModuleSwitcher();
            this.setupKeyboardShortcuts();
            this.setupContentMonitors();
            
            console.log("Canvas Setup Manager initialized");
        } catch (error) {
            console.error("Error during canvas system setup:", error);
        }
    }
    
    setupCanvasTabs() {
        console.log("Setting up canvas tabs system");
        // No extra code needed; DOM manager ensures tabs exist
    }
    
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
            
            // Set new widths
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
    
    setupModuleSwitcher() {
        console.log("Setting up module switcher");
        
        const canvasTitlebar = document.querySelector('.canvas-window .canvas-titlebar');
        if (!canvasTitlebar) {
            console.error("Cannot set up module switcher - titlebar not found");
            return;
        }
        
        // Remove existing switcher if present
        const existingSwitcher = canvasTitlebar.querySelector('.module-switcher');
        if (existingSwitcher) {
            existingSwitcher.remove();
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
            
            // If you do want the module to open on click, you can keep these lines:
            // Otherwise, comment them out to only open via slash command or bubble
            button.addEventListener('click', () => {
                this.canvasManager.expandCanvasSection();
                this.canvasManager.activateModule(module.name);
            });
            
            moduleSwitcher.appendChild(button);
        });
        
        // Insert module switcher in the titlebar
        const titleElement = canvasTitlebar.querySelector('.canvas-title');
        if (titleElement) {
            if (titleElement.nextSibling) {
                canvasTitlebar.insertBefore(moduleSwitcher, titleElement.nextSibling);
            } else {
                canvasTitlebar.appendChild(moduleSwitcher);
            }
        } else {
            if (canvasTitlebar.firstChild) {
                canvasTitlebar.insertBefore(moduleSwitcher, canvasTitlebar.firstChild);
            } else {
                canvasTitlebar.appendChild(moduleSwitcher);
            }
        }
        
        console.log("Module switcher added to canvas titlebar");
        
        // Store reference for updating active state
        this.canvasManager.moduleSwitcher = moduleSwitcher;
        
        // If there's an already active module, mark its button
        if (this.canvasManager.currentModule && this.canvasManager.currentModule.moduleName) {
            this.updateModuleSwitcherActiveState(this.canvasManager.currentModule.moduleName);
        }
    }

    updateModuleSwitcherActiveState(moduleName) {
        if (!this.canvasManager.moduleSwitcher) return;
        const buttons = this.canvasManager.moduleSwitcher.querySelectorAll('.module-button');
        buttons.forEach(button => button.classList.remove('active'));
        
        const activeButton = this.canvasManager.moduleSwitcher.querySelector(`.module-button[data-module="${moduleName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }
    
    setupKeyboardShortcuts() {
        console.log("Setting up keyboard shortcuts");
        const manager = this.canvasManager;
        
        document.addEventListener('keydown', (e) => {
            // Ctrl+T -> new canvas
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                manager.addNewCanvas('New Canvas');
            }
            
            // Ctrl+W -> close current canvas
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                if (manager.activeCanvasId) {
                    manager.closeCanvas(manager.activeCanvasId);
                }
            }
            
            // Ctrl+Tab -> switch canvases
            if (e.ctrlKey && e.key === 'Tab') {
                e.preventDefault();
                const canvases = manager.canvasInstances;
                if (canvases.length > 1) {
                    const currentIndex = canvases.findIndex(c => c.id === manager.activeCanvasId);
                    const nextIndex = (currentIndex + 1) % canvases.length;
                    manager.activateCanvas(canvases[nextIndex].id);
                }
            }
            
            // Escape -> collapse (if no modal is open)
            if (e.key === 'Escape' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                const activeModal = document.querySelector(
                  '.modal.active, .dialog.active, .popup.active, .context-menu[style*="display: block"]'
                );
                if (!activeModal) {
                    manager.collapseCanvasSection();
                }
            }
        });
        
        this.setupKeyboardShortcutsDisplay();
    }
    
    setupKeyboardShortcutsDisplay() {
        // Remove existing elements
        const existingShortcuts = document.querySelector('.keyboard-shortcut-hints');
        if (existingShortcuts) existingShortcuts.remove();
        
        const existingCompact = document.querySelector('.keyboard-shortcut-compact');
        if (existingCompact) existingCompact.remove();
        
        const existingToggle = document.querySelector('.keyboard-shortcut-toggle');
        if (existingToggle) existingToggle.remove();
        
        // Create a compact shortcuts display
        const shortcutsDisplay = document.createElement('div');
        shortcutsDisplay.className = 'keyboard-shortcut-compact hidden';
        shortcutsDisplay.innerHTML = `
            <div class="shortcut-title">Keyboard Shortcuts <i class="fas fa-keyboard"></i></div>
            <div class="shortcut-list">
                <div><kbd>Ctrl</kbd>+<kbd>T</kbd> New</div>
                <div><kbd>Ctrl</kbd>+<kbd>W</kbd> Close</div>
                <div><kbd>Ctrl</kbd>+<kbd>Tab</kbd> Switch</div>
                <div><kbd>Dbl-click</kbd> Min</div>
            </div>
        `;
        
        const toggleButton = document.createElement('div');
        toggleButton.className = 'keyboard-shortcut-toggle';
        toggleButton.innerHTML = '<i class="fas fa-keyboard"></i>';
        toggleButton.title = 'Toggle Keyboard Shortcuts';
        
        toggleButton.addEventListener('click', () => {
            shortcutsDisplay.classList.toggle('hidden');
        });
        
        document.body.appendChild(shortcutsDisplay);
        document.body.appendChild(toggleButton);
        
        this._shortcutsDisplay = shortcutsDisplay;
        this._shortcutsToggle = toggleButton;
        
        // Auto-hide after 3s
        setTimeout(() => {
            shortcutsDisplay.classList.add('hidden');
        }, 3000);
    }
    
    setupContentMonitors() {
        console.log("Setting up content monitors");
        this.setupChatMonitors();
        this.setupCanvasContentObserver();
    }
    
    setupChatMonitors() {
        const manager = this.canvasManager;
        
        // Locate chat container
        const chatContainer = document.querySelector('.chat-messages');
        if (chatContainer) {
            // If you want to open the editor ONLY when a user explicitly clicks "Open in Editor",
            // remove or comment out these auto-activation lines:
            chatContainer.addEventListener('click', e => {
                // For example, "chat-image-send" auto-activation:
                /*
                if (e.target.closest('.chat-image-send') || 
                    e.target.closest('[data-action="showInCanvas"]')) {
                    
                    setTimeout(() => {
                        manager.expandCanvasSection();
                        manager.activateModule('image');
                    }, 100);
                }
                */
                
                // Code display auto-activation:
                /*
                if (e.target.closest('.chat-code-send') || 
                    e.target.closest('[data-action="sendToEditor"]')) {
                    
                    setTimeout(() => {
                        manager.expandCanvasSection();
                        manager.activateModule('code');
                    }, 100);
                }
                */
                
                // Chart auto-activation:
                /*
                if (e.target.closest('[data-action="createChart"]')) {
                    setTimeout(() => {
                        manager.expandCanvasSection();
                        manager.activateModule('chart');
                    }, 100);
                }
                */
            });
        }
        
        // Also monitor command suggestions
        const commandSuggestions = document.getElementById('command-suggestions');
        if (commandSuggestions) {
            commandSuggestions.addEventListener('click', e => {
                const suggestion = e.target.closest('.command-suggestion');
                if (!suggestion) return;
                
                const text = suggestion.textContent.toLowerCase().trim();
                
                // Similarly, comment out or remove these lines:
                /*
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
                */
            });
        }
    }
    
    setupCanvasContentObserver() {
        if (!this.canvasManager.canvasContainer) return;
        
        const observer = new MutationObserver(mutations => {
            // Check if content was added
            const hasActiveContent = Array.from(
                document.querySelectorAll('.canvas-instance')
            ).some(instance => {
                return (
                    instance.children.length > 3 ||
                    (instance.querySelector('img') && instance.querySelector('img').src) ||
                    instance.querySelector('.code-editor') ||
                    instance.querySelector('.chart-container')
                );
            });
            
            // By default, the code auto-expands if new content is detected:
            // if (hasActiveContent) {
            //     this.canvasManager.expandCanvasSection();
            // }
            
            // If you only want to expand the canvas manually, comment out or remove the above line
        });
        
        observer.observe(this.canvasManager.canvasContainer, { 
            childList: true, 
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'style', 'class']
        });
    }
    
    cleanup() {
        if (this._shortcutsDisplay && document.body.contains(this._shortcutsDisplay)) {
            document.body.removeChild(this._shortcutsDisplay);
        }
        
        if (this._shortcutsToggle && document.body.contains(this._shortcutsToggle)) {
            document.body.removeChild(this._shortcutsToggle);
        }
    }
}

// Make available globally
window.CanvasSetupManager = CanvasSetupManager;