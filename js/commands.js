/**
 * Command processor for the Terminal Canvas
 */
class CommandProcessor {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.moduleCommands = {
            'image': ['display', 'load', 'random'],
            'chart': ['bar', 'line', 'pie', 'data', 'random'],
            'code': ['display', 'language', 'fontsize', 'theme'],
            'shape': ['draw', 'random', 'pattern', 'animate', 'stop']
        };
    }
    
    /**
     * Process a command
     * @param {string} commandText - Command text to process
     */
    processCommand(commandText) {
        if (!commandText) return false;
        
        const parts = commandText.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        console.log(`Processing command: ${command}, args:`, args);
        
        // Handle module selection commands
        if (command === 'use' || command === 'module') {
            if (args.length > 0) {
                return this.activateModule(args[0]);
            }
            terminal.addOutput('[ERROR] Module name required');
            return false;
        }
        
        // Handle specialized commands
        switch (command) {
            case 'fetch':
            case 'get':
                return this.handleFetchCommand(args);
                
            case 'clear':
            case 'cls':
                if (args[0] === 'canvas') {
                    this.canvasManager.clearCanvas();
                    return true;
                } else {
                    terminal.clearOutput();
                    return true;
                }
                
            case 'draw':
            case 'generate':
                this.activateModule('shape');
                return this.canvasManager.executeCommand('random');
                
            case 'image':
                this.activateModule('image');
                if (args.length > 0) {
                    return this.canvasManager.executeCommand('display', args[0]);
                } else {
                    return this.canvasManager.executeCommand('random');
                }
                
            case 'chart':
                this.activateModule('chart');
                if (args.length > 0) {
                    if (args[0] === 'bar' || args[0] === 'line' || args[0] === 'pie') {
                        return this.canvasManager.executeCommand(args[0]);
                    } else {
                        return this.canvasManager.executeCommand('random');
                    }
                } else {
                    return this.canvasManager.executeCommand('random');
                }
                
            case 'code':
                this.activateModule('code');
                if (args.length > 0 && args[0] === 'display') {
                    const codeContent = commandText.substring(commandText.indexOf('display') + 8);
                    return this.canvasManager.executeCommand('display', codeContent);
                }
                return true;
                
            case 'help':
                terminal.showHelp();
                return true;
                
            case 'modules':
                return this.listModules();
                
            case 'commands':
                if (args.length > 0) {
                    return this.listModuleCommands(args[0]);
                } else {
                    terminal.addOutput('[ERROR] Module name required for commands list');
                    return false;
                }
                
            case 'exit':
            case 'quit':
                terminal.addOutput('[INFO] Cannot exit terminal in browser environment');
                return true;
                
            case 'apis':
            case 'api':
                terminal.showAvailableAPIs();
                return true;
                
            case '':
                // Empty command, do nothing
                return true;
                
            default:
                // Check if this is a module-specific command
                return this.handleModuleCommand(command, args);
        }
    }
    
    /**
     * Activate a specific module
     * @param {string} moduleName - Name of the module to activate
     */
    activateModule(moduleName) {
        const result = this.canvasManager.activateModule(moduleName);
        if (result) {
            terminal.addOutput(`[INFO] Activated module: ${moduleName}`);
            return true;
        } else {
            terminal.addOutput(`[ERROR] Module not found: ${moduleName}`);
            return false;
        }
    }
    
    /**
     * Handle a module-specific command
     * @param {string} command - Command to handle
     * @param {Array} args - Command arguments
     */
    handleModuleCommand(command, args) {
        // Check each module's commands
        for (const [moduleName, commands] of Object.entries(this.moduleCommands)) {
            if (commands.includes(command)) {
                this.activateModule(moduleName);
                return this.canvasManager.executeCommand(command, ...args);
            }
        }
        
        terminal.addOutput(`[ERROR] Unknown command: ${command}`);
        terminal.addOutput('[INFO] Type "help" for available commands');
        return false;
    }
    
    /**
     * Handle fetch command
     * @param {Array} args - Command arguments
     */
    handleFetchCommand(args) {
        if (args.length === 0) {
            terminal.addOutput('[ERROR] Usage: fetch [url] or fetch image');
            return false;
        }
        
        if (args[0] === 'image') {
            this.activateModule('image');
            if (args.length > 1) {
                return this.canvasManager.executeCommand('display', args[1]);
            } else {
                return this.canvasManager.executeCommand('random');
            }
        } else {
            // Regular API fetch
            const url = args.join(' ');
            return this.fetchAPI(url);
        }
    }
    
    /**
     * Fetch data from an API
     * @param {string} url - URL to fetch from
     */
    fetchAPI(url) {
        if (!url) {
            terminal.addOutput('[ERROR] No URL provided for fetch');
            return false;
        }
        
        const fetchButton = document.getElementById('fetchButton');
        
        // Show loading state
        if (fetchButton) {
            fetchButton.classList.add('loading');
        }
        
        terminal.updateStatus('loading', `Fetching ${url}...`);
        
        // Use standard Fetch API
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                
                // Store content type for later use
                const contentType = response.headers.get('Content-Type') || '';
                
                // If it's an image, display it directly
                if (contentType.includes('image/')) {
                    this.activateModule('image');
                    this.canvasManager.executeCommand('display', url);
                    terminal.updateStatus('success', 'Image loaded successfully');
                    
                    if (fetchButton) {
                        fetchButton.classList.remove('loading');
                    }
                    
                    return null; // Skip further processing
                }
                
                // For other content types, get the text
                return response.text().then(text => ({ text, contentType }));
            })
            .then(result => {
                // Skip if we already handled this as an image
                if (!result) return;
                
                const { text, contentType } = result;
                const responseContainer = document.getElementById('responseContainer');
                
                try {
                    // Try to parse as JSON if it looks like JSON
                    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                        const jsonData = JSON.parse(text);
                        
                        // Update response container
                        if (responseContainer) {
                            responseContainer.textContent = JSON.stringify(jsonData, null, 2);
                        }
                        
                        // If it looks like chart data, use chart module
                        this.activateModule('chart');
                        this.canvasManager.executeCommand('data', jsonData);
                        
                        terminal.updateStatus('success', 'JSON data loaded successfully');
                    } else {
                        // Not JSON, display as is
                        if (responseContainer) {
                            responseContainer.textContent = text;
                        }
                        
                        // Check if it looks like code
                        if (contentType.includes('javascript') || 
                            contentType.includes('json') || 
                            text.includes('function') || 
                            text.includes('class')) {
                            this.activateModule('code');
                            this.canvasManager.executeCommand('display', text, 'javascript');
                        } else if (contentType.includes('html') || 
                                  text.includes('<html') || 
                                  text.includes('<body')) {
                            this.activateModule('code');
                            this.canvasManager.executeCommand('display', text, 'html');
                        } else if (text.match(/\.(jpeg|jpg|gif|png)$/i)) {
                            // If it might be an image URL
                            this.activateModule('image');
                            this.canvasManager.executeCommand('display', text);
                        }
                        
                        terminal.updateStatus('success', 'Data received successfully');
                    }
                } catch (e) {
                    // Handle parsing error
                    console.error('Error parsing response:', e);
                    if (responseContainer) {
                        responseContainer.textContent = text;
                    }
                    terminal.updateStatus('error', `Error parsing response: ${e.message}`);
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                terminal.updateStatus('error', `Error: ${error.message}`);
            })
            .finally(() => {
                // Always clean up
                if (fetchButton) {
                    fetchButton.classList.remove('loading');
                }
                
                const memoryUsage = document.getElementById('memoryUsage');
                if (memoryUsage) {
                    memoryUsage.textContent = Math.floor(Math.random() * 1000 + 2000);
                }
            });
            
        return true;
    }
    
    /**
     * List available modules
     */
    listModules() {
        terminal.addOutput(`
Available modules:
-----------------
image - Display and manipulate images
chart - Create data visualizations
code  - Display formatted code
shape - Draw shapes and patterns

Use 'module [name]' to activate a module.
Use 'commands [module]' to see module-specific commands.
`);
        return true;
    }
    
    /**
     * List commands for a specific module
     * @param {string} moduleName - Name of the module
     */
    listModuleCommands(moduleName) {
        const commands = this.moduleCommands[moduleName];
        
        if (!commands) {
            terminal.addOutput(`[ERROR] Module not found: ${moduleName}`);
            return false;
        }
        
        terminal.addOutput(`
Commands for ${moduleName} module:
--------------------------------
${commands.join('\n')}

Use 'module ${moduleName}' to activate this module first.
`);
        return true;
    }
}