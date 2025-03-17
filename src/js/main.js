/**
 * main.js
 * Main entry point for the Terminal Canvas
 * 
 * Initializes the canvas manager, registers modules,
 * and sets up the command processor
 */

// Global safety check to prevent script errors
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element not found: #${id}, creating dummy`);
        const dummy = document.createElement('div');
        dummy.id = id;
        dummy.style.display = 'none';
        dummy.addEventListener = function() {}; // Empty function
        document.body.appendChild(dummy);
        return dummy;
    }
    return element;
}

// Make sure we expose the Commands object globally
window.Commands = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Terminal Canvas initialized');
    
    try {
        // Initialize canvas manager with error handling
        const canvasManager = new CanvasManager();
        
        // Register modules with error handling
        try {
            console.log("Registering standard modules...");
            
            // Create modules with titles
            const imageModule = new HtmlImageModule();
            const chartModule = new ChartModule();
            const codeModule = new CodeModule();
            const shapeModule = new ShapeModule();
            const markdownModule = new MarkdownModule();
            
            // Set default titles for modules
            imageModule.setModuleTitle('Image Viewer');
            chartModule.setModuleTitle('Chart Visualization');
            codeModule.setModuleTitle('Code Display'); // This is redundant if CodeModule already sets its title in constructor
            shapeModule.setModuleTitle('Shape Editor');
            markdownModule.setModuleTitle('Markdown Viewer');
            
            // Register modules with canvas manager
            canvasManager
                .registerModule('image', imageModule)
                .registerModule('chart', chartModule)
                .registerModule('code', codeModule)
                .registerModule('shape', shapeModule)
                .registerModule('markdown', markdownModule);
            
            console.log("Standard modules registered successfully");
            
            // Register terminal module separately with more error handling
            try {
                console.log("Attempting to register terminal module...");
                if (typeof StreamingTerminalModule === 'undefined') {
                    throw new Error("StreamingTerminalModule class is not defined");
                }
                const terminalModule = new StreamingTerminalModule();
                
                // Set terminal module title
                if (typeof terminalModule.setModuleTitle === 'function') {
                    terminalModule.setModuleTitle('Terminal Connection');
                }
                
                console.log("Terminal module instance created:", terminalModule);
                canvasManager.registerModule('terminal', terminalModule);
                console.log("Terminal module registered successfully");
            } catch (e) {
                console.error('Error registering terminal module:', e);
            }
        } catch (e) {
            console.error('Error registering modules:', e);
        }
        
        // Initialize command processor with canvas manager and make it global
        try {
            window.Commands = new CommandProcessor(canvasManager);
        } catch (e) {
            console.error('Error initializing command processor:', e);
            // Create a basic command processor if needed
            window.Commands = {
                processCommand: function(cmd) {
                    console.log('Processing command:', cmd);
                    if (cmd.startsWith('fetch image')) {
                        canvasManager.activateModule('image');
                        const imageUrl = cmd.replace('fetch image', '').trim() || null;
                        canvasManager.getModule('image').handleCommand('display', [imageUrl]);
                    } else if (cmd.startsWith('chart')) {
                        canvasManager.activateModule('chart');
                        const chartType = cmd.split(' ')[1] || 'bar';
                        canvasManager.getModule('chart').handleCommand(chartType);
                    } else if (cmd.startsWith('draw')) {
                        canvasManager.activateModule('shape');
                        canvasManager.getModule('shape').handleCommand('random');
                    } else if (cmd === 'clear canvas') {
                        canvasManager.clearCanvas();
                    } else if (cmd.startsWith('terminal')) {
                        const parts = cmd.split(' ');
                        if (parts.length > 1) {
                            canvasManager.activateModule('terminal');
                            if (parts[1] === 'connect' && parts.length > 2) {
                                canvasManager.getModule('terminal').handleCommand('connect', [parts.slice(2).join(' ')]);
                            } else if (parts[1] === 'send' && parts.length > 2) {
                                canvasManager.getModule('terminal').handleCommand('send', [parts.slice(2).join(' ')]);
                            } else if (parts[1] === 'disconnect') {
                                canvasManager.getModule('terminal').handleCommand('disconnect');
                            } else if (parts[1] === 'clear') {
                                canvasManager.getModule('terminal').handleCommand('clear');
                            }
                        }
                    }
                    return true;
                }
            };
        }
        
        // Activate shape module by default
        try {
            canvasManager.activateModule('shape');
        } catch (e) {
            console.error('Error activating shape module:', e);
        }
        
        // Set initial memory usage display
        const memoryUsage = safeGetElement('memoryUsage');
        memoryUsage.textContent = Math.floor(Math.random() * 1000 + 2000);
        
        // Update memory display periodically
        setInterval(() => {
            memoryUsage.textContent = Math.floor(Math.random() * 1000 + 2000);
        }, 5000);
        
        // Update clock in status bar
        function updateClock() {
            const now = new Date();
            const time = now.toTimeString().split(' ')[0];
            const currentTime = safeGetElement('currentTime');
            currentTime.textContent = time;
            setTimeout(updateClock, 1000);
        }
        updateClock();
        
        // Draw a welcome pattern after a short delay
        setTimeout(() => {
            try {
                // Draw a terminal-style pattern
                const shapeModule = canvasManager.getModule('shape');
                if (shapeModule) {
                    shapeModule.handleCommand('pattern', ['grid']);
                    console.log('Welcome pattern drawn');
                }
            } catch (e) {
                console.error('Error drawing welcome pattern:', e);
            }
        }, 1000);
        
        // Update command suggestions
        const suggestionsContainer = document.getElementById('command-suggestions');
        if (suggestionsContainer) {
            // Add markdown and terminal suggestions
            const additionalSuggestions = [
                { text: 'show markdown', icon: 'fa-file-alt' },
                { text: 'connect terminal', icon: 'fa-terminal' }
            ];
            
            additionalSuggestions.forEach(suggestion => {
                const suggestionElement = document.createElement('span');
                suggestionElement.className = 'command-suggestion';
                
                // Add icon if specified
                if (suggestion.icon) {
                    suggestionElement.innerHTML = `<i class="fas ${suggestion.icon}"></i> ${suggestion.text}`;
                } else {
                    suggestionElement.textContent = suggestion.text;
                }
                
                suggestionsContainer.appendChild(suggestionElement);
            });
        }
    } catch (e) {
        console.error('Error initializing Canvas Manager:', e);
    }
});