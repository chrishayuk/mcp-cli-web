/**
 * js/terminal-initialization.js
 * Initializes and configures the terminal module
 */

// Terminal module initialization and repair
document.addEventListener('DOMContentLoaded', function() {
    // Wait for everything to load
    setTimeout(function() {
        console.log("Running terminal module check and repair...");
        if (window.Commands && window.Commands.canvasManager) {
            const cm = window.Commands.canvasManager;
            
            // Check if terminal module exists
            let terminalModule = cm.getModule('terminal');
            if (!terminalModule) {
                console.warn("Terminal module not found in canvas manager - attempting to register");
                
                // Try to register terminal module if available
                if (typeof window.StreamingTerminalModule === 'function') {
                    try {
                        console.log("Creating StreamingTerminalModule instance");
                        const newModule = new StreamingTerminalModule();
                        console.log("Registering terminal module with canvas manager");
                        cm.registerModule('terminal', newModule);
                        terminalModule = newModule;
                        console.log("Terminal module registered successfully");
                    } catch (e) {
                        console.error("Failed to create and register terminal module:", e);
                    }
                } else {
                    console.error("StreamingTerminalModule not available as a global class");
                }
            } else {
                console.log("Terminal module found in canvas manager");
            }
            
            // Add terminal debug function
            window.debugTerminalModule = function() {
                console.log("=== TERMINAL MODULE DEBUG ===");
                
                // Check if StreamingTerminalModule is defined
                console.log("StreamingTerminalModule defined globally:", 
                    typeof window.StreamingTerminalModule === 'function');
                
                // Check canvas manager
                if (!window.Commands || !window.Commands.canvasManager) {
                    console.error("Canvas Manager not available");
                    return;
                }
                
                const cm = window.Commands.canvasManager;
                console.log("Available modules:", Object.keys(cm.modules || {}));
                
                // Check terminal module
                const terminalModule = cm.getModule('terminal');
                if (!terminalModule) {
                    console.error("Terminal module not found in canvas manager");
                    return;
                }
                
                console.log("Terminal module properties:", Object.getOwnPropertyNames(terminalModule));
                console.log("Terminal module connected:", terminalModule.connected);
                
                // Test the module with basic connect function
                console.log("Testing terminal module connect function:");
                if (typeof terminalModule.connect === 'function') {
                    console.log("connect() method exists on terminal module");
                } else {
                    console.error("connect() method missing from terminal module");
                }
                
                // Test WASM integration
                console.log("Testing WASM integration:");
                if (terminalModule.wasmBridge) {
                    console.log("WASM bridge exists");
                    console.log("WASM exports available:", !!terminalModule.wasmBridge.wasmExports);
                } else {
                    console.warn("WASM bridge not found - terminal is using pure JavaScript");
                }
            };
            
            // Update command suggestions
            const suggestionsContainer = document.getElementById('command-suggestions');
            if (suggestionsContainer) {
                let hasTerminalSuggestion = false;
                
                // Check if terminal suggestion already exists
                Array.from(suggestionsContainer.children).forEach(child => {
                    if (child.textContent.includes('terminal')) {
                        hasTerminalSuggestion = true;
                    }
                });
                
                // Add terminal suggestion if not present
                if (!hasTerminalSuggestion && terminalModule) {
                    const terminalSuggestion = document.createElement('span');
                    terminalSuggestion.className = 'command-suggestion';
                    terminalSuggestion.innerHTML = '<i class="fas fa-terminal"></i> connect terminal';
                    suggestionsContainer.appendChild(terminalSuggestion);
                    
                    // Add event listener
                    terminalSuggestion.addEventListener('click', () => {
                        const chatInput = document.getElementById('chat-input');
                        if (chatInput) {
                            chatInput.value = 'connect terminal';
                            chatInput.focus();
                        }
                    });
                }
            }
        }
    }, 1000); // One second delay to ensure WASM has time to load

    // Initialize collapsible canvas system after other modules
    setTimeout(function() {
        console.log("Initializing collapsible canvas system...");
        
        // Check if the function exists
        if (typeof window.initCollapsibleCanvasSystem === 'function') {
            try {
                // Initialize the collapsible canvas system
                const collapsibleManager = window.initCollapsibleCanvasSystem();
                
                if (collapsibleManager) {
                    console.log("Collapsible canvas system initialized successfully");
                    
                    // Add new canvas command to suggestions
                    const suggestionsContainer = document.getElementById('command-suggestions');
                    if (suggestionsContainer) {
                        const newCanvasSuggestion = document.createElement('span');
                        newCanvasSuggestion.className = 'command-suggestion';
                        newCanvasSuggestion.innerHTML = '<i class="fas fa-plus"></i> new canvas';
                        suggestionsContainer.appendChild(newCanvasSuggestion);
                        
                        // Add event listener
                        newCanvasSuggestion.addEventListener('click', () => {
                            const chatInput = document.getElementById('chat-input');
                            if (chatInput) {
                                chatInput.value = 'new canvas';
                                chatInput.focus();
                            }
                            
                            // Also directly create a new canvas
                            if (window.Commands && window.Commands.canvasManager &&
                                typeof window.Commands.canvasManager.addNewCanvas === 'function') {
                                window.Commands.canvasManager.addNewCanvas('New Canvas');
                            }
                        });
                    }
                    
                    // Register a new command for creating canvases
                    if (window.Commands && typeof window.Commands.processCommand === 'function') {
                        const originalProcessCommand = window.Commands.processCommand;
                        
                        // Override the process command to handle canvas commands
                        window.Commands.processCommand = function(command) {
                            if (command === 'new canvas') {
                                if (typeof window.Commands.canvasManager.addNewCanvas === 'function') {
                                    window.Commands.canvasManager.addNewCanvas('New Canvas');
                                    return true;
                                }
                            } else if (command === 'minimize canvas') {
                                if (window.Commands.canvasManager.activeCanvasId && 
                                    typeof window.Commands.canvasManager.minimizeCanvas === 'function') {
                                    window.Commands.canvasManager.minimizeCanvas(window.Commands.canvasManager.activeCanvasId);
                                    return true;
                                }
                            } else if (command === 'close canvas') {
                                if (window.Commands.canvasManager.activeCanvasId &&
                                    typeof window.Commands.canvasManager.closeCanvas === 'function') {
                                    window.Commands.canvasManager.closeCanvas(window.Commands.canvasManager.activeCanvasId);
                                    return true;
                                }
                            } else if (command.startsWith('rename canvas ')) {
                                const newName = command.substring('rename canvas '.length).trim();
                                if (newName && window.Commands.canvasManager.activeCanvasId &&
                                    typeof window.Commands.canvasManager.renameCanvas === 'function') {
                                    window.Commands.canvasManager.renameCanvas(
                                        window.Commands.canvasManager.activeCanvasId, 
                                        newName
                                    );
                                    return true;
                                }
                            }
                            
                            // Call the original command processor
                            return originalProcessCommand.call(window.Commands, command);
                        };
                    }
                } else {
                    console.error("Failed to initialize collapsible canvas system");
                }
            } catch (e) {
                console.error("Error initializing collapsible canvas system:", e);
            }
        } else {
            // Try to load the script again if it's not available
            console.warn("initCollapsibleCanvasSystem function not available - attempting to load script");
            
            // Create and load the script
            const script = document.createElement('script');
            script.src = 'js/canvas/collapsible-canvas/collapsible-canvas-manager.js';
            script.onload = function() {
                console.log("Collapsible canvas manager script loaded successfully");
                if (typeof window.initCollapsibleCanvasSystem === 'function') {
                    try {
                        window.initCollapsibleCanvasSystem();
                        console.log("Collapsible canvas system initialized on second attempt");
                    } catch (e) {
                        console.error("Error initializing collapsible canvas system on second attempt:", e);
                    }
                } else {
                    console.error("initCollapsibleCanvasSystem function still not available after loading script");
                }
            };
            script.onerror = function() {
                console.error("Failed to load collapsible canvas manager script");
            };
            document.body.appendChild(script);
        }
    }, 1500);
});