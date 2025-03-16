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
        
        // Add to tabs list
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
        
        // Create context menu if it doesn't exist
        this.contextMenu = document.getElementById('canvas-tab-context-menu');
        
        if (!this.contextMenu) {
            this.contextMenu = document.createElement('div');
            this.contextMenu.id = 'canvas-tab-context-menu';
            this.contextMenu.className = 'context-menu';
            this.contextMenu.innerHTML = `
                <ul>
                    <li data-action="rename"><i class="fas fa-edit"></i> Rename</li>
                    <li data-action="duplicate"><i class="fas fa-copy"></i> Duplicate</li>
                    <li data-action="minimize"><i class="fas fa-window-minimize"></i> Minimize</li>
                    <li class="divider"></li>
                    <li data-action="close"><i class="fas fa-times"></i> Close</li>
                    <li data-action="closeOthers"><i class="fas fa-times-circle"></i> Close Others</li>
                    <li data-action="closeAll"><i class="fas fa-trash-alt"></i> Close All</li>
                </ul>
            `;
            
            document.body.appendChild(this.contextMenu);
        }
        
        // Track which tab was right-clicked
        let targetTabId = null;
        
        // Add context menu event to tabs container
        this.canvasManager.tabsContainer.addEventListener('contextmenu', (e) => {
            const tab = e.target.closest('.canvas-tab');
            if (!tab) return;
            
            e.preventDefault();
            
            // Store the target tab ID
            targetTabId = tab.dataset.canvasId;
            
            // Position and show context menu
            this.contextMenu.style.left = `${e.pageX}px`;
            this.contextMenu.style.top = `${e.pageY}px`;
            this.contextMenu.classList.add('active');
            
            // Add one-time event listener to hide on click outside
            setTimeout(() => {
                document.addEventListener('click', function hideMenu(e) {
                    if (!this.contextMenu.contains(e.target)) {
                        this.contextMenu.classList.remove('active');
                        document.removeEventListener('click', hideMenu);
                    }
                }.bind(this));
            }, 0);
        });
        
        // Handle context menu actions
        this.contextMenu.addEventListener('click', (e) => {
            const action = e.target.closest('li')?.dataset.action;
            if (!action || !targetTabId) return;
            
            this.handleContextMenuAction(action, targetTabId);
            this.contextMenu.classList.remove('active');
        });
        
        // Hide context menu on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.contextMenu.classList.contains('active')) {
                this.contextMenu.classList.remove('active');
            }
        });
    }
    
    /**
     * Handle a context menu action
     * @param {string} action - Action name
     * @param {string} tabId - Target tab ID
     */
    handleContextMenuAction(action, tabId) {
        const manager = this.canvasManager;
        
        switch (action) {
            case 'rename':
                const newName = prompt('Enter new name for canvas:', '');
                if (newName) manager.renameCanvas(tabId, newName);
                break;
                
            case 'duplicate':
                const instance = manager.canvasInstances.find(instance => instance.id === tabId);
                if (instance) {
                    // Simple duplication - in real implementation we would copy canvas content
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
}

// Make available globally
window.CanvasTabManager = CanvasTabManager;