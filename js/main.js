/**
 * Main entry point for the Terminal Canvas
 * 
 * Initializes the canvas manager, registers modules,
 * and sets up the command processor
 */

// Make sure we expose the Commands object globally
let Commands;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Terminal Canvas initialized');
    
    // Initialize canvas manager
    const canvasManager = new CanvasManager();
    
    // Register modules
    canvasManager
        .registerModule('image', new ImageModule())
        .registerModule('chart', new ChartModule())
        .registerModule('code', new CodeModule())
        .registerModule('shape', new ShapeModule());
    
    // Initialize command processor with canvas manager and make it global
    window.Commands = new CommandProcessor(canvasManager);
    Commands = window.Commands; // Ensure it's available in this scope too
    
    // Activate shape module by default
    canvasManager.activateModule('shape');
    
    // Set initial memory usage display
    const memoryUsage = document.getElementById('memoryUsage');
    if (memoryUsage) {
        memoryUsage.textContent = Math.floor(Math.random() * 1000 + 2000);
    }
    
    // Draw a welcome pattern after a short delay
    setTimeout(() => {
        // Draw a terminal-style pattern
        try {
            canvasManager.getModule('shape').handleCommand('pattern', ['grid']);
            terminal.addOutput('[INFO] Welcome pattern generated. Type "help" for available commands');
        } catch (error) {
            console.error('Error generating welcome pattern:', error);
            terminal.addOutput('[ERROR] Could not generate welcome pattern. Type "help" for available commands');
        }
    }, 500);
    
    // Initialize event handlers for existing DOM elements directly
    initializeUIHandlers(canvasManager);
});

/**
 * Initialize UI event handlers directly
 * This is a backup method to ensure key UI elements work
 */
function initializeUIHandlers(canvasManager) {
    // API link handlers
    document.querySelectorAll('.api-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const url = link.getAttribute('data-url');
            const type = link.getAttribute('data-type');
            
            if (type === 'image') {
                // Handle image URLs differently
                terminal.addOutput(`$ fetch image ${url}`);
                Commands.processCommand(`fetch image ${url}`);
            } else {
                // Regular API data
                terminal.addOutput(`$ fetch ${url}`);
                Commands.fetchAPI(url);
            }
        });
    });
    
    // Fetch button handler
    const fetchButton = document.getElementById('fetchButton');
    if (fetchButton) {
        fetchButton.addEventListener('click', () => {
            const urlInput = document.getElementById('urlInput');
            if (urlInput && urlInput.value) {
                terminal.addOutput(`$ fetch ${urlInput.value}`);
                Commands.processCommand(`fetch ${urlInput.value}`);
            } else {
                terminal.addOutput('[ERROR] No URL specified for fetch');
            }
        });
    }
    
    // Draw button handler
    const drawButton = document.getElementById('drawButton');
    if (drawButton) {
        drawButton.addEventListener('click', () => {
            terminal.addOutput('$ draw random');
            Commands.processCommand('draw random');
        });
    }
    
    // Clear button handler
    const clearButton = document.getElementById('clearButton');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            terminal.addOutput('$ clear canvas');
            Commands.processCommand('clear canvas');
        });
    }
    
    // Help button handler
    const helpButton = document.getElementById('helpButton');
    if (helpButton) {
        helpButton.addEventListener('click', () => {
            terminal.showHelp();
        });
    }
}