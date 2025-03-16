/**
 * Slash Command Module Activation Connector
 * 
 * Ensures proper coordination between the slash command system
 * and the module activation system in the canvas manager
 */

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for slash commands and canvas manager to be initialized
    setTimeout(function() {
        if (window.SlashCommands && window.Commands && window.Commands.canvasManager) {
            console.log("Initializing slash command module activation connector...");
            initModuleActivationConnector();
        }
    }, 1200);
});

/**
 * Initialize the module activation connector
 */
function initModuleActivationConnector() {
    const cm = window.Commands.canvasManager;
    
    // Hook into chat interface to activate modules for module-specific commands
    if (window.ChatInterface && typeof window.ChatInterface.processCommand === 'function') {
        // Store original processCommand method
        const originalProcessCommand = window.ChatInterface.processCommand;
        
        // Replace with our extended version
        window.ChatInterface.processCommand = function(command) {
            // Check if this is a slash command
            if (command.startsWith('/')) {
                const parts = command.trim().split(' ');
                const slashCmd = parts[0].toLowerCase();
                
                // Check if this slash command belongs to a module that isn't active
                if (window.SlashCommands) {
                    const moduleCommand = window.SlashCommands.getModuleCommandByName(slashCmd);
                    
                    if (moduleCommand && window.SlashCommands.activeModule !== moduleCommand.moduleName) {
                        // Activate the module first
                        if (window.Commands && window.Commands.canvasManager) {
                            console.log(`Activating module ${moduleCommand.moduleName} for slash command ${slashCmd}`);
                            window.Commands.canvasManager.activateModule(moduleCommand.moduleName);
                        }
                    }
                }
            }
            
            // Call original process command
            return originalProcessCommand.call(this, command);
        };
        
        console.log("Extended chat interface to handle module activation from slash commands");
    }
    
    // Make command processor aware of slash commands
    if (window.Commands && typeof window.Commands.processCommand === 'function') {
        // Store original processCommand method
        const originalProcessCommand = window.Commands.processCommand;
        
        // Replace with our extended version
        window.Commands.processCommand = function(cmd) {
            // If this command originated from a slash command, it's already been processed
            // Just pass it through to the original handler
            return originalProcessCommand.call(this, cmd);
        };
    }
    
    console.log("Module activation connector initialized");
}

/**
 * Utility function to get the name of a module from its instance
 * @param {Object} canvasManager - The canvas manager instance
 * @param {Object} moduleInstance - The module instance
 * @returns {string|null} Module name or null if not found
 */
function getModuleName(canvasManager, moduleInstance) {
    // Search through modules to find a match
    for (const [name, module] of canvasManager.modules.entries()) {
        if (module === moduleInstance) {
            return name;
        }
    }
    return null;
}