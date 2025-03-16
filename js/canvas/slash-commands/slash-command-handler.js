/**
 * Slash Command Handler for Terminal Canvas
 * 
 * Main slash command system that modules can extend with their own commands
 * Provides a unified interface for registering and executing slash commands
 */

// Initialize slash commands when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for other modules to load
    setTimeout(function() {
        if (window.Commands && window.Commands.canvasManager) {
            console.log("Initializing slash command handler...");
            initSlashCommandHandler();
        }
    }, 800);
});

/**
 * Initialize the slash command handler
 */
function initSlashCommandHandler() {
    // Create the global slash command registry
    window.SlashCommands = {
        // Command registries - split into global and module-specific
        commands: {
            global: {}, // Always available
            modules: {} // Organized by module name
        },
        
        descriptions: {
            global: {}, // Always available
            modules: {} // Organized by module name
        },
        
        // Tracks the currently active module
        activeModule: null,
        
        /**
         * Set the active module for slash commands
         * @param {string} moduleName - Name of the active module
         */
        setActiveModule: function(moduleName) {
            this.activeModule = moduleName;
            console.log(`Slash commands: active module set to ${moduleName}`);
            
            // Update any module-specific UI elements or features
            if (window['update' + capitalizeFirstLetter(moduleName) + 'Module']) {
                window['update' + capitalizeFirstLetter(moduleName) + 'Module']();
            }
        },
        
        /**
         * Register a global slash command (always available)
         * @param {string} command - Slash command (e.g., '/img')
         * @param {string} fullCommand - Full command to execute
         * @param {string} description - Description for autocomplete
         */
        registerGlobal: function(command, fullCommand, description) {
            if (!command.startsWith('/')) {
                command = '/' + command;
            }
            
            this.commands.global[command] = fullCommand;
            this.descriptions.global[command] = description || 'No description provided';
            console.log(`Registered global slash command: ${command}`);
        },
        
        /**
         * Register a module-specific slash command
         * @param {string} moduleName - Name of the module this command belongs to
         * @param {string} command - Slash command (e.g., '/run')
         * @param {string} fullCommand - Full command to execute
         * @param {string} description - Description for autocomplete
         * @param {boolean} showAlways - Whether to show this command even when module inactive
         */
        registerModuleCommand: function(moduleName, command, fullCommand, description, showAlways = false) {
            if (!command.startsWith('/')) {
                command = '/' + command;
            }
            
            // Initialize module registry if needed
            if (!this.commands.modules[moduleName]) {
                this.commands.modules[moduleName] = {};
                this.descriptions.modules[moduleName] = {};
            }
            
            // Register command
            this.commands.modules[moduleName][command] = {
                fullCommand: fullCommand,
                showAlways: showAlways
            };
            
            this.descriptions.modules[moduleName][command] = description || 'No description provided';
            console.log(`Registered ${showAlways ? 'always-available' : 'module-specific'} slash command for ${moduleName}: ${command}`);
        },
        
        /**
         * Get all currently available commands based on active module
         * @returns {Object} Object mapping command to full command
         */
        getAvailableCommands: function() {
            // Start with global commands
            const available = {...this.commands.global};
            
            // Add module-specific commands
            for (const moduleName in this.commands.modules) {
                const moduleCommands = this.commands.modules[moduleName];
                
                for (const cmd in moduleCommands) {
                    const commandInfo = moduleCommands[cmd];
                    
                    // Add if module is active or command is marked as always show
                    if (this.activeModule === moduleName || commandInfo.showAlways) {
                        available[cmd] = commandInfo.fullCommand;
                    }
                }
            }
            
            return available;
        },
        
        /**
         * Get descriptions for all currently available commands
         * @returns {Object} Object mapping command to description
         */
        getAvailableDescriptions: function() {
            // Start with global descriptions
            const available = {...this.descriptions.global};
            
            // Add module-specific descriptions
            for (const moduleName in this.commands.modules) {
                const moduleCommands = this.commands.modules[moduleName];
                
                for (const cmd in moduleCommands) {
                    const commandInfo = this.commands.modules[moduleName][cmd];
                    
                    // Add if module is active or command is marked as always show
                    if (this.activeModule === moduleName || commandInfo.showAlways) {
                        available[cmd] = this.descriptions.modules[moduleName][cmd];
                    }
                }
            }
            
            return available;
        },
        
        /**
         * Get a module command even if not active (for activation purposes)
         * @param {string} command - The slash command to look up
         * @returns {Object|null} Command info or null if not found
         */
        getModuleCommandByName: function(command) {
            for (const moduleName in this.commands.modules) {
                if (this.commands.modules[moduleName][command]) {
                    return {
                        moduleName: moduleName,
                        command: command,
                        info: this.commands.modules[moduleName][command]
                    };
                }
            }
            return null;
        }
    };
    
    // Initialize system components
    setupSlashCommandUI();
    registerCoreCommands();
    hookCanvasManagerActivation();
    
    console.log("Slash command handler initialized");
}

/**
 * Set up the UI elements for slash commands
 */
function setupSlashCommandUI() {
    const chatInput = document.getElementById('chat-input');
    const chatInputContainer = document.querySelector('.chat-input-container');
    
    if (!chatInput || !chatInputContainer) {
        console.error("Chat input elements not found, can't setup slash command UI");
        return;
    }
    
    // Create the autocomplete dropdown
    const autocompleteDropdown = document.createElement('div');
    autocompleteDropdown.className = 'slash-command-autocomplete';
    autocompleteDropdown.style.display = 'none';
    chatInputContainer.appendChild(autocompleteDropdown);
    
    // Add slash command button
    const slashButton = document.createElement('button');
    slashButton.className = 'slash-command-button';
    slashButton.title = 'Slash Commands';
    slashButton.innerHTML = '<i class="fas fa-slash"></i>';
    
    // Insert before the send button
    const sendButton = document.getElementById('chat-send');
    if (sendButton) {
        chatInputContainer.insertBefore(slashButton, sendButton);
    } else {
        chatInputContainer.appendChild(slashButton);
    }
    
    // Track command state
    let isSlashCommandActive = false;
    let selectedAutocompleteIndex = -1;
    
    // Event listeners
    chatInput.addEventListener('input', handleInput);
    chatInput.addEventListener('keydown', handleKeyDown);
    
    // Add click event listener to button
    slashButton.addEventListener('click', function() {
        // Update input with slash and trigger autocomplete
        chatInput.value = '/';
        chatInput.focus();
        
        // Trigger input event to show autocomplete
        const inputEvent = new Event('input');
        chatInput.dispatchEvent(inputEvent);
        
        // Show help message about available commands
        showSlashCommandHelp();
    });
    
    // Hide autocomplete when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (e.target !== autocompleteDropdown && !autocompleteDropdown.contains(e.target) && 
            e.target !== chatInput && e.target !== slashButton) {
            autocompleteDropdown.style.display = 'none';
            isSlashCommandActive = false;
            chatInput.classList.remove('slash-active');
        }
    });
    
    /**
     * Handle input events in the chat input
     */
    function handleInput(e) {
        const text = chatInput.value;
        
        // Check if starts with slash
        if (text.startsWith('/')) {
            isSlashCommandActive = true;
            chatInput.classList.add('slash-active');
            
            // Show autocomplete suggestions
            showAutocompleteSuggestions(text);
        } else {
            isSlashCommandActive = false;
            chatInput.classList.remove('slash-active');
            autocompleteDropdown.style.display = 'none';
        }
    }
    
    /**
     * Handle keydown events in the chat input
     * For navigation and selection of autocomplete items
     */
    function handleKeyDown(e) {
        // Only process if slash command is active
        if (!isSlashCommandActive || autocompleteDropdown.style.display === 'none') {
            return;
        }
        
        const suggestions = autocompleteDropdown.querySelectorAll('.slash-command-item');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedAutocompleteIndex = Math.min(selectedAutocompleteIndex + 1, suggestions.length - 1);
                highlightSelected();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                selectedAutocompleteIndex = Math.max(selectedAutocompleteIndex - 1, 0);
                highlightSelected();
                break;
                
            case 'Tab':
            case 'Enter':
                // Only complete if we have something selected
                if (selectedAutocompleteIndex >= 0 && selectedAutocompleteIndex < suggestions.length) {
                    e.preventDefault();
                    const selectedCommand = suggestions[selectedAutocompleteIndex].dataset.command;
                    applySelectedCommand(selectedCommand, e.key === 'Enter');
                } else if (suggestions.length > 0) {
                    // Select first item if nothing selected
                    e.preventDefault();
                    const selectedCommand = suggestions[0].dataset.command;
                    applySelectedCommand(selectedCommand, e.key === 'Enter');
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                autocompleteDropdown.style.display = 'none';
                isSlashCommandActive = false;
                chatInput.classList.remove('slash-active');
                break;
        }
    }
    
    /**
     * Highlight the selected autocomplete item
     */
    function highlightSelected() {
        const items = autocompleteDropdown.querySelectorAll('.slash-command-item');
        
        // Clear all highlights
        items.forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add highlight to selected
        if (selectedAutocompleteIndex >= 0 && selectedAutocompleteIndex < items.length) {
            items[selectedAutocompleteIndex].classList.add('selected');
            
            // Scroll into view if needed
            items[selectedAutocompleteIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }
    
    /**
     * Apply the selected slash command to the input
     * @param {string} command - The command to apply
     * @param {boolean} execute - Whether to execute the command
     */
    function applySelectedCommand(command, execute) {
        const availableCommands = window.SlashCommands.getAvailableCommands();
        
        // Handle module activation commands
        const moduleCommand = window.SlashCommands.getModuleCommandByName(command);
        if (!availableCommands[command] && moduleCommand) {
            const { moduleName, info } = moduleCommand;
            
            if (window.Commands && window.Commands.canvasManager) {
                // Activate the module first
                window.Commands.canvasManager.activateModule(moduleName);
                window.SlashCommands.setActiveModule(moduleName);
                
                // Use the command's target
                const fullCommand = info.fullCommand;
                
                if (execute) {
                    // Execute the command
                    chatInput.value = fullCommand;
                    
                    // Trigger send
                    const sendButton = document.getElementById('chat-send');
                    if (sendButton) {
                        sendButton.click();
                    }
                } else {
                    // Just complete the command
                    chatInput.value = command + ' ';
                    chatInput.focus();
                }
            }
        }
        // Handle regular commands
        else if (availableCommands[command]) {
            if (execute) {
                // For Enter key, execute the command directly
                chatInput.value = availableCommands[command];
                
                // Trigger send
                const sendButton = document.getElementById('chat-send');
                if (sendButton) {
                    sendButton.click();
                }
            } else {
                // For Tab key, just complete the command
                chatInput.value = command + ' ';
                chatInput.focus();
            }
        }
        
        // Hide dropdown and reset state after applying
        autocompleteDropdown.style.display = 'none';
        chatInput.classList.remove('slash-active');
    }
    
    /**
     * Show slash command autocomplete suggestions based on input
     * @param {string} text - Current input text
     */
    function showAutocompleteSuggestions(text) {
        // Extract slash command
        const parts = text.split(' ');
        const slashCommand = parts[0].toLowerCase();
        
        // Get available commands and descriptions
        const availableCommands = window.SlashCommands.getAvailableCommands();
        const availableDescriptions = window.SlashCommands.getAvailableDescriptions();
        
        // Find matching commands
        const matches = [];
        for (const cmd in availableCommands) {
            if (cmd.startsWith(slashCommand)) {
                matches.push(cmd);
            }
        }
        
        // Clear current suggestions
        autocompleteDropdown.innerHTML = '';
        
        // No matches, show nothing or "no commands found"
        if (matches.length === 0) {
            autocompleteDropdown.style.display = 'none';
            return;
        }
        
        // Group matches by category for better organization
        const categorizedMatches = groupCommandsByCategory(
            Object.fromEntries(matches.map(m => [m, availableCommands[m]])),
            Object.fromEntries(matches.map(m => [m, availableDescriptions[m]]))
        );
        
        // Add matches by category
        for (const category in categorizedMatches) {
            const categoryCommands = categorizedMatches[category];
            
            // Skip empty categories
            if (categoryCommands.length === 0) continue;
            
            // Add category header
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'slash-command-category';
            categoryHeader.textContent = category;
            autocompleteDropdown.appendChild(categoryHeader);
            
            // Add commands in this category
            categoryCommands.forEach(cmd => {
                const item = document.createElement('div');
                item.className = 'slash-command-item';
                item.dataset.command = cmd;
                
                // Create formatted item content with description
                item.innerHTML = `
                    <span class="slash-command-name">${cmd}</span>
                    <span class="slash-command-desc">${availableDescriptions[cmd] || ''}</span>
                `;
                
                // Add click event to apply command
                item.addEventListener('click', function(e) {
                    applySelectedCommand(cmd, true);
                });
                
                autocompleteDropdown.appendChild(item);
            });
        }
        
        // Reset selected index
        selectedAutocompleteIndex = -1;
        
        // Position and show dropdown
        const rect = chatInput.getBoundingClientRect();
        autocompleteDropdown.style.top = `${rect.top - 10}px`;
        autocompleteDropdown.style.left = `${rect.left}px`;
        autocompleteDropdown.style.width = `${rect.width}px`;
        autocompleteDropdown.style.display = 'block';
    }
    
    /**
     * Show a help message with available slash commands
     */
    function showSlashCommandHelp() {
        // Get available commands and descriptions
        const availableCommands = window.SlashCommands.getAvailableCommands();
        const availableDescriptions = window.SlashCommands.getAvailableDescriptions();
        
        // Group by category for better organization
        const categorizedCommands = groupCommandsByCategory(
            availableCommands,
            availableDescriptions
        );
        
        // Build help message
        let helpMessage = '<strong>Available Slash Commands:</strong><br><br>';
        
        for (const category in categorizedCommands) {
            const commands = categorizedCommands[category];
            if (commands.length === 0) continue;
            
            helpMessage += `<u>${category} Commands:</u><br>`;
            
            commands.forEach(cmd => {
                helpMessage += `<span class="slash-command-example">${cmd}</span> - ${availableDescriptions[cmd]}<br>`;
            });
            
            helpMessage += '<br>';
        }
        
        helpMessage += "Type a slash (/) followed by a command. Press Tab to autocomplete.";
        
        // Display message in chat
        if (window.ChatInterface && typeof window.ChatInterface.addSystemMessage === 'function') {
            window.ChatInterface.addSystemMessage(helpMessage);
        }
    }
}

/**
 * Register core slash commands that are always available
 */
function registerCoreCommands() {
    // Register global commands
    window.SlashCommands.registerGlobal('/help', 'help', 'Show available commands');
    window.SlashCommands.registerGlobal('/clear', 'clear canvas', 'Clear the canvas');
    window.SlashCommands.registerGlobal('/img', 'show image', 'Display an image');
    window.SlashCommands.registerGlobal('/image', 'show random image', 'Display a random image');
    window.SlashCommands.registerGlobal('/draw', 'draw pattern', 'Draw a pattern');
    window.SlashCommands.registerGlobal('/shape', 'draw pattern', 'Draw a shape or pattern');
    
    // Canvas operations
    window.SlashCommands.registerGlobal('/modules', 'modules', 'List available modules');
    window.SlashCommands.registerGlobal('/zoom', 'zoom in', 'Zoom in the canvas');
    window.SlashCommands.registerGlobal('/zoomin', 'zoom in', 'Zoom in the canvas');
    window.SlashCommands.registerGlobal('/zoomout', 'zoom out', 'Zoom out the canvas');
    window.SlashCommands.registerGlobal('/reset', 'reset view', 'Reset canvas view');
    
    // Module activation commands - these will work via special handling
    window.SlashCommands.registerModuleCommand('chart', '/chart', 'chart', 'Create a chart visualization', true);
    window.SlashCommands.registerModuleCommand('chart', '/pie', 'chart pie', 'Create a pie chart', true);
    window.SlashCommands.registerModuleCommand('chart', '/bar', 'chart bar', 'Create a bar chart', true);
    window.SlashCommands.registerModuleCommand('chart', '/line', 'chart line', 'Create a line chart', true);
    
    window.SlashCommands.registerModuleCommand('markdown', '/md', 'show markdown', 'Render markdown content', true);
    window.SlashCommands.registerModuleCommand('markdown', '/markdown', 'show markdown', 'Render markdown content', true);
    
    window.SlashCommands.registerModuleCommand('terminal', '/terminal', 'connect terminal', 'Connect to a terminal', true);
    window.SlashCommands.registerModuleCommand('terminal', '/connect', 'connect terminal', 'Connect to a terminal', true);
    
    console.log("Core slash commands registered");
}

/**
 * Hook into canvas manager's module activation to update the active module
 */
function hookCanvasManagerActivation() {
    // Wait for canvas manager to be available
    setTimeout(function() {
        if (window.Commands && window.Commands.canvasManager) {
            const cm = window.Commands.canvasManager;
            
            // Store the original activateModule function
            const originalActivateModule = cm.activateModule;
            
            // Replace with our extended version
            cm.activateModule = function(name) {
                // Call original function first
                const result = originalActivateModule.call(this, name);
                
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
                for (const [name, module] of cm.modules.entries()) {
                    if (module === cm.currentModule) {
                        window.SlashCommands.setActiveModule(name);
                        break;
                    }
                }
            }
            
            console.log("Hooked into canvas manager for module activation");
        }
    }, 1000);
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
 * Group commands by category for better organization
 * @param {Object} commands - Available commands
 * @param {Object} descriptions - Command descriptions
 * @returns {Object} Grouped commands by category
 */
function groupCommandsByCategory(commands, descriptions) {
    const categories = {
        'Canvas': [],
        'Code': [],
        'Markdown': [],
        'Terminal': [],
        'Chart': [],
        'Other': []
    };
    
    for (const cmd in commands) {
        const desc = descriptions[cmd] || '';
        
        // Categorize based on command or description content
        if (cmd.startsWith('/code') || cmd.startsWith('/js') || 
            cmd.startsWith('/py') || cmd === '/run' || 
            desc.toLowerCase().includes('code')) {
            categories['Code'].push(cmd);
        }
        else if (cmd.startsWith('/chart') || cmd.startsWith('/pie') || 
                 cmd.startsWith('/bar') || cmd.startsWith('/line')) {
            categories['Chart'].push(cmd);
        }
        else if (cmd.startsWith('/md') || cmd.startsWith('/markdown')) {
            categories['Markdown'].push(cmd);
        }
        else if (cmd.startsWith('/term') || cmd.startsWith('/connect') || 
                 cmd.startsWith('/disconnect')) {
            categories['Terminal'].push(cmd);
        }
        else if (cmd.startsWith('/clear') || cmd.startsWith('/img') || 
                 cmd.startsWith('/image') || cmd.startsWith('/draw')) {
            categories['Canvas'].push(cmd);
        }
        else {
            categories['Other'].push(cmd);
        }
    }
    
    return categories;
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Debug function to help identify issues with slash commands
 * Can be called from console: debugSlashCommands()
 */
window.debugSlashCommands = function() {
    console.log("=== SLASH COMMANDS DEBUG ===");
    
    if (!window.SlashCommands) {
        console.error("SlashCommands object not found");
        return;
    }
    
    // Show active module
    console.log("Active module:", window.SlashCommands.activeModule || "none");
    
    // Show registered global commands
    console.log("\nGlobal commands:");
    const globalCommands = window.SlashCommands.commands.global;
    for (const cmd in globalCommands) {
        console.log(`  ${cmd} → ${globalCommands[cmd]}`);
    }
    
    // Show registered module commands
    console.log("\nModule commands:");
    const moduleCommands = window.SlashCommands.commands.modules;
    for (const moduleName in moduleCommands) {
        console.log(`  ${moduleName.toUpperCase()}:`);
        
        for (const cmd in moduleCommands[moduleName]) {
            const commandInfo = moduleCommands[moduleName][cmd];
            console.log(`    ${cmd} → ${commandInfo.fullCommand} (${commandInfo.showAlways ? 'always visible' : 'module-specific'})`);
        }
    }
    
    // Show currently available commands
    console.log("\nCurrently available commands:");
    const availableCommands = window.SlashCommands.getAvailableCommands();
    for (const cmd in availableCommands) {
        console.log(`  ${cmd} → ${availableCommands[cmd]}`);
    }
    
    // DOM elements check
    console.log("\nDOM elements:");
    const autocomplete = document.querySelector('.slash-command-autocomplete');
    console.log(`  Autocomplete dropdown: ${autocomplete ? 'Found' : 'Not found'}`);
    
    const slashButton = document.querySelector('.slash-command-button');
    console.log(`  Slash button: ${slashButton ? 'Found' : 'Not found'}`);
    
    const cssLink = document.querySelector('link[href*="slash-commands.css"]');
    console.log(`  CSS link: ${cssLink ? 'Found' : 'Not found'}`);
    
    console.log("=== END SLASH COMMANDS DEBUG ===");
};