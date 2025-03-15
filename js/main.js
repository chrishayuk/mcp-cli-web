/**
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
            canvasManager
                .registerModule('image', new ImageModule())
                .registerModule('chart', new ChartModule())
                .registerModule('code', new CodeModule())
                .registerModule('shape', new ShapeModule())
                .registerModule('markdown', new MarkdownModule());
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
        
        // Add markdown command to suggestions
        const suggestionsContainer = document.getElementById('command-suggestions');
        if (suggestionsContainer) {
            // Create a new markdown suggestion
            const mdSuggestion = document.createElement('span');
            mdSuggestion.className = 'command-suggestion';
            mdSuggestion.textContent = 'show markdown';
            
            // Add it to the container
            suggestionsContainer.appendChild(mdSuggestion);
        }
    } catch (e) {
        console.error('Error initializing Canvas Manager:', e);
    }
});