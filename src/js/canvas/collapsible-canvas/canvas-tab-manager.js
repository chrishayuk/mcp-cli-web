/**
 * js/canvas/collapsible-canvas/canvas-tab-manager.js
 * Tab management for collapsible canvas system
 */

/**
 * Class to manage canvas tabs functionality
 */
class CanvasTabManager {
    /**
     * Create a tab manager
     * @param {CollapsibleCanvasManager} canvasManager - Parent canvas manager
     */
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.contextMenu = null;
        this._contextMenuHandler = null;
        this._escapeHandler = null;
        this._menuClickHandler = null;
    }
    
    /**
     * Initialize tab manager
     */
    initialize() {
        console.log("Initializing Canvas Tab Manager...");
        
        // Ensure we have a tabsList from the DOM manager
        if (!this.canvasManager.tabsList) {
            console.warn("TabsList not available in canvasManager, requesting creation");
            this.canvasManager.DOMManager.ensureTabsList();
        }
        
        // Set up context menu for tabs
        this.setupTabContextMenu();
        
        console.log("Canvas Tab Manager initialized");
    }
    
    /**
     * Create a tab for a canvas
     * @param {string} title - Canvas title
     * @param {string} id - Canvas ID
     * @returns {HTMLElement} - Created tab element
     */
    createTab(title, id) {
        console.log(`Creating tab for canvas: ${id} (${title})`);
        
        // Try using external function first
        if (window.canvasTabsFunctions && typeof window.canvasTabsFunctions.createCanvasTab === 'function') {
            return window.canvasTabsFunctions.createCanvasTab.call(this.canvasManager, title, id);
        }
        
        // Fallback to internal implementation
        return this.createTabFallback(title, id);
    }
    
    /**
     * Create a tab using internal implementation
     * @param {string} title - Canvas title 
     * @param {string} id - Canvas ID
     * @returns {HTMLElement} - Created tab element
     */
    createTabFallback(title, id) {
        // Ensure tabsList exists
        if (!this.canvasManager.tabsList || !document.body.contains(this.canvasManager.tabsList)) {
            console.warn("TabsList not available for createTabFallback, recreating...");
            this.canvasManager.DOMManager.ensureTabsList();
            
            if (!this.canvasManager.tabsList) {
                console.error("Failed to create tabsList for tab creation");
                return null;
            }
        }
        
        // Create tab element
        const tab = document.createElement('div');
        tab.className = 'canvas-tab';
        tab.dataset.canvasId = id;
        tab.innerHTML = `
            <i class="fas fa-desktop canvas-tab-icon"></i>
            <span class="canvas-tab-title">${title}</span>
            <span class="canvas-tab-close"><i class="fas fa-times"></i></span>
        `;
        
        // Add event listeners
        tab.addEventListener('click', (e) => {
            if (!e.target.closest('.canvas-tab-close')) {
                this.canvasManager.activateCanvas(id);
                this.canvasManager.expandCanvasSection();
            }
        });
        
        tab.addEventListener('dblclick', (e) => {
            if (!e.target.closest('.canvas-tab-close')) {
                this.canvasManager.minimizeCanvas(id);
            }
        });
        
        const closeBtn = tab.querySelector('.canvas-tab-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.canvasManager.closeCanvas(id);
            });
        }
        
        // Add tab to the tabs list container
        this.canvasManager.tabsList.appendChild(tab);
        
        return tab;
    }
    
    /**
     * Remove a tab
     * @param {string} id - Canvas ID
     */
    removeTab(id) {
        if (!this.canvasManager.tabsList) return;
        
        const tab = this.canvasManager.tabsList.querySelector(`.canvas-tab[data-canvas-id="${id}"]`);
        if (tab && tab.parentNode) {
            tab.parentNode.removeChild(tab);
        }
    }
    
    /**
     * Update a tab's title
     * @param {string} id - Canvas ID
     * @param {string} newTitle - New title
     */
    updateTabTitle(id, newTitle) {
        if (!this.canvasManager.tabsList) return;
        
        const tab = this.canvasManager.tabsList.querySelector(`.canvas-tab[data-canvas-id="${id}"]`);
        if (tab) {
            const titleSpan = tab.querySelector('.canvas-tab-title');
            if (titleSpan) {
                titleSpan.textContent = newTitle;
            }
        }
    }
    
    /**
     * Set a tab's minimized state
     * @param {string} id - Canvas ID
     * @param {boolean} minimized - Whether tab is minimized
     */
    setTabMinimized(id, minimized) {
        if (!this.canvasManager.tabsList) return;
        
        const tab = this.canvasManager.tabsList.querySelector(`.canvas-tab[data-canvas-id="${id}"]`);
        if (tab) {
            if (minimized) {
                tab.classList.add('minimized');
            } else {
                tab.classList.remove('minimized');
            }
        }
    }
    
    /**
     * Set up context menu for tabs
     */
    setupTabContextMenu() {
        // Skip if no tabs container
        if (!this.canvasManager.tabsContainer) {
            console.warn("tabsContainer not available for setupTabContextMenu");
            return;
        }
        
        // Try to find an existing context menu element
        this.contextMenu = document.getElementById('canvas-tab-context-menu') ||
                           document.getElementById('canvasTabContextMenu');
        
        // Create a new context menu if none exists
        if (!this.contextMenu) {
            console.log("Creating new context menu");
            this.contextMenu = document.createElement('div');
            this.contextMenu.id = 'canvas-tab-context-menu';
            this.contextMenu.className = 'context-menu';
            this.contextMenu.style.display = 'none'; // Hide initially
            this.contextMenu.innerHTML = `
                <ul>
                    <li data-action="new"><i class="fas fa-plus"></i> New Canvas</li>
                    <li data-action="rename"><i class="fas fa-edit"></i> Rename</li>
                    <li data-action="duplicate"><i class="fas fa-copy"></i> Duplicate</li>
                    <li data-action="minimize"><i class="fas fa-window-minimize"></i> Minimize</li>
                    <li class="divider"></li>
                    <li data-action="close"><i class="fas fa-times"></i> Close</li>
                    <li data-action="closeOthers"><i class="fas fa-times-circle"></i> Close Others</li>
                    <li data-action="closeAll"><i class="fas fa-trash-alt"></i> Close All</li>
                </ul>
            `;
            
            // Apply critical inline styles
            this.contextMenu.style.position = 'fixed';
            this.contextMenu.style.zIndex = '2000';
            this.contextMenu.style.backgroundColor = '#252525';
            this.contextMenu.style.border = '1px solid #444';
            this.contextMenu.style.borderRadius = '4px';
            this.contextMenu.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4)';
            
            document.body.appendChild(this.contextMenu);
        } else {
            console.log("Using existing context menu:", this.contextMenu.id);
            
            // Ensure the "New Canvas" option is present
            if (!this.contextMenu.querySelector('li[data-action="new"], .context-menu-item[data-action="new"]')) {
                const ul = this.contextMenu.querySelector('ul');
                if (ul) {
                    const newItem = document.createElement('li');
                    newItem.dataset.action = 'new';
                    newItem.innerHTML = '<i class="fas fa-plus"></i> New Canvas';
                    ul.insertBefore(newItem, ul.firstChild);
                }
            }
        }
        
        // Variable to track the tab that was right-clicked
        let targetTabId = null;
        
        // Remove any previous context menu handler
        if (this._contextMenuHandler) {
            this.canvasManager.tabsContainer.removeEventListener('contextmenu', this._contextMenuHandler);
        }
        
        // Define context menu handler function
        this._contextMenuHandler = (e) => {
            const tab = e.target.closest('.canvas-tab');
            if (!tab) return;
            
            e.preventDefault();
            targetTabId = tab.dataset.canvasId;
            this.contextMenu.style.left = `${e.pageX}px`;
            this.contextMenu.style.top = `${e.pageY}px`;
            this.contextMenu.style.display = 'block';
            
            // Add a one-time click handler to hide the context menu when clicking outside
            setTimeout(() => {
                document.addEventListener('click', function hideMenu(e) {
                    if (!this.contextMenu.contains(e.target)) {
                        this.contextMenu.style.display = 'none';
                        document.removeEventListener('click', hideMenu);
                    }
                }.bind(this));
            }, 10);
        };
        
        // Add context menu listener to tabs container
        this.canvasManager.tabsContainer.addEventListener('contextmenu', this._contextMenuHandler);
        
        // Handle Escape key to hide the context menu
        if (this._escapeHandler) {
            document.removeEventListener('keydown', this._escapeHandler);
        }
        
        this._escapeHandler = (e) => {
            if (e.key === 'Escape' && this.contextMenu.style.display === 'block') {
                this.contextMenu.style.display = 'none';
            }
        };
        
        document.addEventListener('keydown', this._escapeHandler);
        
        // Handle clicks on context menu items
        if (this._menuClickHandler) {
            this.contextMenu.removeEventListener('click', this._menuClickHandler);
        }
        
        this._menuClickHandler = (e) => {
            const action = e.target.closest('li')?.dataset.action ||
                           e.target.closest('.context-menu-item')?.dataset.action;
            if (!action || !targetTabId) return;
            this.handleContextMenuAction(action, targetTabId);
            this.contextMenu.style.display = 'none';
        };
        
        this.contextMenu.addEventListener('click', this._menuClickHandler);
        
        console.log("Tab context menu setup complete");
    }
    
    /**
     * Handle a context menu action.
     * @param {string} action - Action name.
     * @param {string} tabId - Target tab ID.
     */
    handleContextMenuAction(action, tabId) {
        const manager = this.canvasManager;
        switch (action) {
            case 'new':
                manager.addNewCanvas('New Canvas');
                break;
            case 'rename':
                const newName = prompt('Enter new name for canvas:', '');
                if (newName) manager.renameCanvas(tabId, newName);
                break;
            case 'duplicate':
                const instance = manager.canvasInstances.find(inst => inst.id === tabId);
                if (instance) {
                    manager.addNewCanvas(`${instance.title} (Copy)`);
                }
                break;
            case 'minimize':
                manager.minimizeCanvas(tabId);
                break;
            case 'close':
                manager.closeCanvas(tabId);
                break;
            case 'closeOthers':
                manager.closeOtherCanvases(tabId);
                break;
            case 'closeAll':
                manager.closeAllCanvases();
                break;
        }
    }
    
    /**
     * Clean up event listeners.
     */
    cleanup() {
        if (this._contextMenuHandler) {
            this.canvasManager.tabsContainer.removeEventListener('contextmenu', this._contextMenuHandler);
        }
        if (this._escapeHandler) {
            document.removeEventListener('keydown', this._escapeHandler);
        }
        if (this._menuClickHandler && this.contextMenu) {
            this.contextMenu.removeEventListener('click', this._menuClickHandler);
        }
    }
}

// Make available globally
window.CanvasTabManager = CanvasTabManager;