/**
 * js/canvas-tab-context-menu.js
 * Handles the context menu for canvas tabs
 */

// Initialize the canvas tab context menu
document.addEventListener('DOMContentLoaded', function() {
    // Wait for canvas manager to be loaded
    setTimeout(function() {
        const contextMenu = document.getElementById('canvasTabContextMenu');
        if (!contextMenu) {
            // Create the context menu if it doesn't exist
            const menu = document.createElement('div');
            menu.id = 'canvasTabContextMenu';
            menu.className = 'context-menu';
            menu.style.display = 'none';
            menu.innerHTML = `
                <div class="context-menu-item" data-action="new">New Canvas</div>
                <div class="context-menu-item" data-action="rename">Rename Canvas</div>
                <div class="context-menu-item" data-action="minimize">Minimize Canvas</div>
                <div class="context-menu-item" data-action="close">Close Canvas</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="closeOthers">Close Other Canvases</div>
                <div class="context-menu-item" data-action="closeAll">Close All Canvases</div>
            `;
            document.body.appendChild(menu);
            
            // Add styles if needed
            const styleExists = Array.from(document.styleSheets).some(sheet => {
                try {
                    return Array.from(sheet.cssRules).some(rule => 
                        rule.selectorText && rule.selectorText.includes('.context-menu'));
                } catch (e) {
                    // CORS might prevent accessing cssRules
                    return false;
                }
            });
            
            if (!styleExists) {
                const style = document.createElement('style');
                style.textContent = `
                    .context-menu {
                        position: absolute;
                        background-color: #252525;
                        border: 1px solid #444;
                        border-radius: 4px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
                        z-index: 1000;
                        min-width: 180px;
                        padding: 4px 0;
                        font-size: 12px;
                        user-select: none;
                    }
                    
                    .context-menu-item {
                        padding: 6px 12px;
                        cursor: pointer;
                        color: #ddd;
                        transition: background-color 0.2s;
                    }
                    
                    .context-menu-item:hover {
                        background-color: #333;
                        color: #fff;
                    }
                    
                    .context-menu-separator {
                        height: 1px;
                        background-color: #444;
                        margin: 4px 0;
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        let activeTabId = null;
        
        // Add event listener for right-click on canvas tab
        document.addEventListener('contextmenu', function(e) {
            // First check if collapsible canvas system is active
            if (!window.Commands || !window.Commands.canvasManager || 
                typeof window.Commands.canvasManager.addNewCanvas !== 'function') {
                return;
            }
            
            // Check if right-click happened on a canvas tab
            const tab = e.target.closest('.canvas-tab');
            if (tab) {
                e.preventDefault();
                
                const contextMenu = document.getElementById('canvasTabContextMenu');
                if (!contextMenu) return;
                
                // Position menu at cursor
                contextMenu.style.left = e.pageX + 'px';
                contextMenu.style.top = e.pageY + 'px';
                contextMenu.style.display = 'block';
                
                // Store active tab ID
                activeTabId = tab.dataset.canvasId;
            } else {
                // Hide menu if clicking elsewhere
                const contextMenu = document.getElementById('canvasTabContextMenu');
                if (contextMenu) contextMenu.style.display = 'none';
            }
        });
        
        // Hide menu when clicking elsewhere
        document.addEventListener('click', function() {
            const contextMenu = document.getElementById('canvasTabContextMenu');
            if (contextMenu) contextMenu.style.display = 'none';
        });
        
        // Handle menu item clicks
        document.addEventListener('click', function(e) {
            const action = e.target.dataset && e.target.dataset.action;
            if (!action || !activeTabId || !window.Commands || !window.Commands.canvasManager) return;
            
            const cm = window.Commands.canvasManager;
            
            switch(action) {
                case 'new':
                    if (typeof cm.addNewCanvas === 'function') {
                        cm.addNewCanvas('New Canvas');
                    }
                    break;
                case 'rename':
                    const newName = prompt('Enter new canvas name:', '');
                    if (newName && typeof cm.renameCanvas === 'function') {
                        cm.renameCanvas(activeTabId, newName);
                    }
                    break;
                case 'minimize':
                    if (typeof cm.minimizeCanvas === 'function') {
                        cm.minimizeCanvas(activeTabId);
                    }
                    break;
                case 'close':
                    if (typeof cm.closeCanvas === 'function') {
                        cm.closeCanvas(activeTabId);
                    }
                    break;
                case 'closeOthers':
                    if (typeof cm.closeOtherCanvases === 'function') {
                        cm.closeOtherCanvases(activeTabId);
                    } else if (typeof cm.canvasInstances === 'object' && 
                              typeof cm.closeCanvas === 'function') {
                        // Fallback implementation
                        const toClose = cm.canvasInstances
                            .filter(instance => instance.id !== activeTabId)
                            .map(instance => instance.id);
                        
                        toClose.forEach(id => cm.closeCanvas(id));
                    }
                    break;
                case 'closeAll':
                    if (typeof cm.closeAllCanvases === 'function') {
                        cm.closeAllCanvases();
                    } else if (typeof cm.canvasInstances === 'object' && 
                              typeof cm.closeCanvas === 'function' &&
                              typeof cm.addNewCanvas === 'function') {
                        // Fallback implementation - close all and create a new one
                        const toClose = cm.canvasInstances.map(instance => instance.id);
                        toClose.forEach(id => cm.closeCanvas(id));
                        cm.addNewCanvas('Canvas Display');
                    }
                    break;
            }
        });
    }, 2000); // Slightly longer delay to ensure other modules are loaded
});