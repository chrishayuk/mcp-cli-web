/**
 * js/slash-commands/slash-command-module-connector.js
 * Module activation connector for slash commands
 * 
 * Connects the slash command system with the canvas manager module system
 * Ensures proper coordination between slash commands and module activation
 */

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for dependencies to be loaded
    setTimeout(function() {
        if (window.SlashCommands && window.Commands && window.Commands.canvasManager) {
            console.log("Initializing slash command module connector...");
            initModuleConnector();
        }
    }, 1200);
});

/**
 * Initialize the module connector
 */
function initModuleConnector() {
    // Hook into canvas manager for module activation
    hookCanvasManagerActivation();
    
    // Hook into chat interface for module activation via slash commands
    hookChatInterface();
    
    console.log("✅ Slash command module connector initialized");
}

/**
 * Hook into canvas manager's module activation to update the active module
 */
function hookCanvasManagerActivation() {
    if (!window.Commands || !window.Commands.canvasManager) {
        console.error("Canvas manager not available for module connector");
        return;
    }
    
    const cm = window.Commands.canvasManager;
    
    // Store the original activateModule function if not already hooked
    if (!cm._originalActivateModule && typeof cm.activateModule === 'function') {
        cm._originalActivateModule = cm.activateModule;
        
        // Replace with our extended version
        cm.activateModule = function(name) {
            // Call original function first
            const result = this._originalActivateModule.call(this, name);
            
            // Then update slash commands active module
            if (result && window.SlashCommands) {
                window.SlashCommands.setActiveModule(name);
                
                // Show module activation message with available commands
                showModuleActivationMessage(name);
            }
            
            return result;
        };
        
        // Initialize with current module if one is active
        if (cm.currentModule) {
            // Find the module name
            for (const name in cm.modules) {
                if (cm.modules[name] === cm.currentModule) {
                    window.SlashCommands.setActiveModule(name);
                    break;
                }
            }
        }
        
        console.log("Hooked into canvas manager for module activation");
    } else {
        console.log("Canvas manager activation already hooked or not available");
    }
}

/**
 * Hook into chat interface to activate modules for module-specific commands
 */
function hookChatInterface() {
    if (!window.ChatInterface || typeof window.ChatInterface.processCommand !== 'function') {
        console.error("Chat interface not available for slash command module connector");
        return;
    }
    
    // Store original processCommand method if not already hooked
    if (!window.ChatInterface._originalProcessCommand) {
        window.ChatInterface._originalProcessCommand = window.ChatInterface.processCommand;
        
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
            return this._originalProcessCommand.call(this, command);
        };
        
        console.log("Hooked into chat interface for module activation from slash commands");
    } else {
        console.log("Chat interface command processor already hooked");
    }
    
    // Make command processor aware of slash commands (if not already hooked)
    if (window.Commands && typeof window.Commands.processCommand === 'function' && 
        !window.Commands._originalProcessCommand) {
        
        // Store original processCommand method
        window.Commands._originalProcessCommand = window.Commands.processCommand;
        
        // Replace with our extended version
        window.Commands.processCommand = function(cmd) {
            // If this command originated from a slash command, it's already been processed
            // Just pass it through to the original handler
            return this._originalProcessCommand.call(this, cmd);
        };
        
        console.log("Hooked into command processor for slash command handling");
    }
}

/**
 * Show a message about available slash commands when a module is activated
 * @param {string} moduleName - Name of the activated module
 */
function showModuleActivationMessage(moduleName) {
    if (!window.ChatInterface || 
        typeof window.ChatInterface.addSystemMessage !== 'function' || 
        !window.SlashCommands ||
        !window.SlashCommands.commands.modules[moduleName]) {
        return;
    }
    
    // Get module commands and descriptions
    const moduleCommands = window.SlashCommands.commands.modules[moduleName];
    const moduleDescriptions = window.SlashCommands.descriptions.modules[moduleName];
    
    // Filter to show only module-specific commands (not always visible ones)
    const moduleSpecificCommands = [];
    
    for (const cmd in moduleCommands) {
        const commandInfo = moduleCommands[cmd];
        
        // Skip always-visible commands as user already knows about them
        if (!commandInfo.showAlways) {
            moduleSpecificCommands.push({
                command: cmd,
                description: moduleDescriptions[cmd] || 'No description'
            });
        }
    }
    
    // Don't show if no module-specific commands
    if (moduleSpecificCommands.length === 0) return;
    
    // Limit to top 5 commands to avoid spamming
    const topCommands = moduleSpecificCommands.slice(0, 5);
    
    // Format message
    let message = `<i class="fas fa-magic"></i> <strong>${capitalizeFirstLetter(moduleName)} module activated!</strong><br>`;
    message += `Available slash commands:<br>`;
    
    topCommands.forEach(cmd => {
        message += `<span class="slash-command-example">${cmd.command}</span> - ${cmd.description}<br>`;
    });
    
    if (moduleSpecificCommands.length > 5) {
        message += `<em>...and ${moduleSpecificCommands.length - 5} more. Type / to see all.</em>`;
    }
    
    // Show message
    window.ChatInterface.addSystemMessage(message);
}

/**
 * Utility function to capitalize the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}