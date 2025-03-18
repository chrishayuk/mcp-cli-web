/**
 * js/slash-commands/slash-command-core.js
 * Core Slash Command Registry System for Terminal Canvas
 */

// Global slash command registry 
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
     * Initialize the slash command system
     */
    init() {
        console.log("Initializing SlashCommands core system...");
        
        // Register core commands
        this.registerCoreCommands();
        
        // Set initialization flag
        window.slashCommandHandlerInitialized = true;
        
        console.log("✅ SlashCommands core system initialized");
        
        // Mark as initialized in global app state if available
        if (window.AppInit && typeof window.AppInit.register === 'function') {
            window.AppInit.register('slashCommands');
        }
        
        return true;
    },
    
    /**
     * Set the active module for slash commands
     * @param {string} moduleName - Name of the active module
     */
    setActiveModule(moduleName) {
        this.activeModule = moduleName;
        console.log(`Slash commands: active module set to ${moduleName}`);
        
        // Update any module-specific UI elements or features
        try {
            if (window['update' + this.capitalizeFirstLetter(moduleName) + 'Module']) {
                window['update' + this.capitalizeFirstLetter(moduleName) + 'Module']();
            }
        } catch (e) {
            console.error("Error updating module:", e);
        }
    },
    
    /**
     * Register a global slash command (always available)
     * @param {string} command - Slash command (e.g., '/img')
     * @param {string} fullCommand - Full command to execute
     * @param {string} description - Description for autocomplete
     */
    registerGlobal(command, fullCommand, description) {
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
    registerModuleCommand(moduleName, command, fullCommand, description, showAlways = false) {
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
    getAvailableCommands() {
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
    getAvailableDescriptions() {
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
    getModuleCommandByName(command) {
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
    },
    
    /**
     * Register core slash commands that are always available
     */
    registerCoreCommands() {
        // Register global commands
        this.registerGlobal('/help', 'help', 'Show available commands');
        this.registerGlobal('/clear', 'clear canvas', 'Clear the canvas');
        this.registerGlobal('/img', 'show image', 'Display an image');
        this.registerGlobal('/image', 'show random image', 'Display a random image');
        this.registerGlobal('/draw', 'draw pattern', 'Draw a pattern');
        this.registerGlobal('/shape', 'draw pattern', 'Draw a shape or pattern');
        
        // Canvas operations
        this.registerGlobal('/modules', 'modules', 'List available modules');
        this.registerGlobal('/zoom', 'zoom in', 'Zoom in the canvas');
        this.registerGlobal('/zoomin', 'zoom in', 'Zoom in the canvas');
        this.registerGlobal('/zoomout', 'zoom out', 'Zoom out the canvas');
        this.registerGlobal('/reset', 'reset view', 'Reset canvas view');
        
        // Module activation commands - these will work via special handling
        try {
            this.registerModuleCommand('chart', '/chart', 'chart', 'Create a chart visualization', true);
            this.registerModuleCommand('chart', '/pie', 'chart pie', 'Create a pie chart', true);
            this.registerModuleCommand('chart', '/bar', 'chart bar', 'Create a bar chart', true);
            this.registerModuleCommand('chart', '/line', 'chart line', 'Create a line chart', true);
            
            this.registerModuleCommand('markdown', '/md', 'show markdown', 'Render markdown content', true);
            this.registerModuleCommand('markdown', '/markdown', 'show markdown', 'Render markdown content', true);
            
            this.registerModuleCommand('terminal', '/terminal', 'connect terminal', 'Connect to a terminal', true);
            this.registerModuleCommand('terminal', '/connect', 'connect terminal', 'Connect to a terminal', true);
        } catch (e) {
            console.error("Error registering module commands:", e);
        }
        
        console.log("Core slash commands registered");
    },
    
    /**
     * Group commands by category for better organization
     * @param {Object} commands - Available commands
     * @param {Object} descriptions - Command descriptions
     * @returns {Object} Grouped commands by category
     */
    groupCommandsByCategory(commands, descriptions) {
        // Check for empty inputs
        if (!commands || !descriptions) {
            console.error("Invalid input to groupCommandsByCategory");
            return { 'Other': [] };
        }
        
        const categories = {
            'Canvas': [],
            'Code': [],
            'Markdown': [],
            'Terminal': [],
            'Chart': [],
            'AI': [],
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
            else if (cmd.startsWith('/ai')) {
                categories['AI'].push(cmd);
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
    },
    
    /**
     * Utility function to capitalize the first letter of a string
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    capitalizeFirstLetter(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};

/**
 * Initialize the slash command handler
 * This is the main entry point for the slash command system
 */
function initSlashCommandHandler() {
    // Do not initialize twice
    if (window.slashCommandHandlerInitialized) {
        console.log("SlashCommands already initialized, skipping");
        return;
    }
    
    // Initialize the SlashCommands object
    SlashCommands.init();
}