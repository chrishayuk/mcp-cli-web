/**
 * js/canvas/commands.js
 * Command processor for the Terminal Canvas
 */
class CommandProcessor {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.moduleCommands = {
            'image': ['display', 'load', 'random'],
            'chart': ['bar', 'line', 'pie', 'data', 'random'],
            'code': ['display', 'language', 'fontsize', 'theme'],
            'shape': ['draw', 'random', 'pattern', 'animate', 'stop'],
            'markdown': ['render', 'load', 'scroll', 'theme'],
            'terminal': ['connect', 'disconnect', 'send', 'clear', 'resize']
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
        
        // Handle explicit module selection commands (user must use these to change active module)
        if (command === 'use' || command === 'module') {
            if (args.length > 0) {
                return this.activateModule(args[0]);
            }
            terminal.addOutput('[ERROR] Module name required');
            return false;
        }
        
        // Specialized commands:
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
                // Instead of auto-activating the shape module, just execute the command.
                return this.canvasManager.executeCommand('random');
                
            case 'image':
                // Directly execute image commands without auto-switching tabs.
                if (args.length > 0) {
                    return this.canvasManager.executeCommand('display', args[0]);
                } else {
                    return this.canvasManager.executeCommand('random');
                }
                
            case 'chart':
                if (args.length > 0) {
                    if (['bar', 'line', 'pie'].includes(args[0])) {
                        return this.canvasManager.executeCommand(args[0]);
                    } else {
                        return this.canvasManager.executeCommand('random');
                    }
                } else {
                    return this.canvasManager.executeCommand('random');
                }
                
            case 'code':
                if (args.length > 0 && args[0] === 'display') {
                    const codeContent = commandText.substring(commandText.indexOf('display') + 8);
                    return this.canvasManager.executeCommand('display', codeContent);
                }
                return true;
                
            case 'markdown':
            case 'md':
                if (args.length > 0) {
                    if (args[0] === 'render') {
                        const mdContent = commandText.substring(commandText.indexOf('render') + 7);
                        return this.canvasManager.executeCommand('render', mdContent);
                    } else if (args[0] === 'load') {
                        if (args.length > 1) {
                            return this.canvasManager.executeCommand('load', args[1]);
                        } else {
                            terminal.addOutput('[ERROR] Source required for markdown load');
                            return false;
                        }
                    } else if (args[0] === 'scroll') {
                        if (args.length > 1) {
                            const direction = args[1];
                            const amount = args.length > 2 ? args[2] : null;
                            return this.canvasManager.executeCommand('scroll', direction, amount);
                        } else {
                            terminal.addOutput('[ERROR] Direction required for markdown scroll');
                            return false;
                        }
                    } else if (args[0] === 'theme') {
                        if (args.length > 1) {
                            return this.canvasManager.executeCommand('theme', args[1]);
                        } else {
                            terminal.addOutput('[ERROR] Theme name required for markdown theme');
                            return false;
                        }
                    }
                }
                terminal.addOutput(`
Markdown Module Commands:
-----------------------
render [text]     - Render markdown text
load [source]     - Load markdown from source (URL or 'sample')
scroll [up/down]  - Scroll markdown content
theme [name]      - Set theme (dark, light, dracula, github)

Example: markdown load sample
`);
                return true;
                
            case 'terminal':
            case 'term':
                if (args.length > 0) {
                    if (args[0] === 'connect') {
                        if (args.length > 1) {
                            const endpoint = args.slice(1).join(' ');
                            return this.canvasManager.executeCommand('connect', endpoint);
                        } else {
                            terminal.addOutput('[ERROR] Endpoint required for terminal connect');
                            return false;
                        }
                    } else if (args[0] === 'send') {
                        if (args.length > 1) {
                            const data = args.slice(1).join(' ');
                            return this.canvasManager.executeCommand('send', data);
                        } else {
                            terminal.addOutput('[ERROR] Command required for terminal send');
                            return false;
                        }
                    } else if (args[0] === 'disconnect') {
                        return this.canvasManager.executeCommand('disconnect');
                    } else if (args[0] === 'clear') {
                        return this.canvasManager.executeCommand('clear');
                    } else if (args[0] === 'resize') {
                        if (args.length > 2) {
                            const cols = parseInt(args[1]);
                            const rows = parseInt(args[2]);
                            if (!isNaN(cols) && !isNaN(rows)) {
                                return this.canvasManager.executeCommand('resize', cols, rows);
                            } else {
                                terminal.addOutput('[ERROR] Invalid dimensions for terminal resize');
                                return false;
                            }
                        } else {
                            terminal.addOutput('[ERROR] Dimensions required for terminal resize (cols rows)');
                            return false;
                        }
                    }
                }
                terminal.addOutput(`
Terminal Module Commands:
-----------------------
connect [endpoint] - Connect to a terminal server
send [data]        - Send data to the terminal
disconnect        - Disconnect from the terminal
clear             - Clear the terminal
resize [cols] [rows] - Resize the terminal

Example: terminal connect wss://echo.websocket.org
Example: terminal send ls -la
`);
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
                return true;
                
            default:
                return this.handleModuleCommand(command, args);
        }
    }
    
    /**
     * Activate a specific module.
     * This method is now reserved for explicit module switching (via "use" or "module" commands).
     * @param {string} moduleName - Name of the module to activate.
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
     * Handle a module-specific command.
     * @param {string} command - Command to handle.
     * @param {Array} args - Command arguments.
     */
    handleModuleCommand(command, args) {
        for (const [moduleName, commands] of Object.entries(this.moduleCommands)) {
            if (commands.includes(command)) {
                // Instead of auto-activating the module, just execute its command.
                return this.canvasManager.executeCommand(command, ...args);
            }
        }
        
        terminal.addOutput(`[ERROR] Unknown command: ${command}`);
        terminal.addOutput('[INFO] Type "help" for available commands');
        return false;
    }
    
    /**
     * Handle fetch command.
     * @param {Array} args - Command arguments.
     */
    handleFetchCommand(args) {
        if (args.length === 0) {
            terminal.addOutput('[ERROR] Usage: fetch [url] or fetch image');
            return false;
        }
        
        if (args[0] === 'image') {
            if (args.length > 1) {
                return this.canvasManager.executeCommand('display', args[1]);
            } else {
                return this.canvasManager.executeCommand('random');
            }
        } else if (args[0] === 'markdown') {
            if (args.length > 1) {
                return this.canvasManager.executeCommand('load', args[1]);
            } else {
                terminal.addOutput('[ERROR] URL required for fetch markdown');
                return false;
            }
        } else if (args[0] === 'terminal') {
            if (args.length > 1) {
                return this.canvasManager.executeCommand('connect', args[1]);
            } else {
                terminal.addOutput('[ERROR] URL required for fetch terminal');
                return false;
            }
        } else {
            const url = args.join(' ');
            return this.fetchAPI(url);
        }
    }
    
    /**
     * Fetch data from an API.
     * @param {string} url - URL to fetch from.
     */
    fetchAPI(url) {
        if (!url) {
            terminal.addOutput('[ERROR] No URL provided for fetch');
            return false;
        }
        
        const fetchButton = document.getElementById('fetchButton');
        if (fetchButton) {
            fetchButton.classList.add('loading');
        }
        
        terminal.updateStatus('loading', `Fetching ${url}...`);
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                
                const contentType = response.headers.get('Content-Type') || '';
                if (contentType.includes('image/')) {
                    this.canvasManager.executeCommand('display', url);
                    terminal.updateStatus('success', 'Image loaded successfully');
                    if (fetchButton) {
                        fetchButton.classList.remove('loading');
                    }
                    return null;
                }
                
                return response.text().then(text => ({ text, contentType }));
            })
            .then(result => {
                if (!result) return;
                const { text, contentType } = result;
                const responseContainer = document.getElementById('responseContainer');
                
                try {
                    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                        const jsonData = JSON.parse(text);
                        if (responseContainer) {
                            responseContainer.textContent = JSON.stringify(jsonData, null, 2);
                        }
                        this.canvasManager.executeCommand('data', jsonData);
                        terminal.updateStatus('success', 'JSON data loaded successfully');
                    } else {
                        if (responseContainer) {
                            responseContainer.textContent = text;
                        }
                        
                        if (contentType.includes('markdown') || 
                            contentType.includes('text/md') || 
                            url.endsWith('.md') ||
                            text.includes('# ') || 
                            text.match(/\*\*.*\*\*/) || 
                            text.match(/\[.*\]\(.*\)/)) {
                            this.canvasManager.executeCommand('render', text);
                            terminal.updateStatus('success', 'Markdown rendered successfully');
                        }
                        else if (contentType.includes('javascript') || 
                                 contentType.includes('json') || 
                                 text.includes('function') || 
                                 text.includes('class')) {
                            this.canvasManager.executeCommand('display', text, 'javascript');
                        } else if (contentType.includes('html') || 
                                   text.includes('<html') || 
                                   text.includes('<body')) {
                            this.canvasManager.executeCommand('display', text, 'html');
                        } else if (text.match(/\.(jpeg|jpg|gif|png)$/i)) {
                            this.canvasManager.executeCommand('display', text);
                        }
                        
                        terminal.updateStatus('success', 'Data received successfully');
                    }
                } catch (e) {
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
     * List available modules.
     */
    listModules() {
        terminal.addOutput(`
Available modules:
-----------------
image    - Display and manipulate images
chart    - Create data visualizations
code     - Display formatted code
shape    - Draw shapes and patterns
markdown - Render and format markdown content
terminal - Connect to and interact with remote terminals

Use 'module [name]' to activate a module.
Use 'commands [module]' to see module-specific commands.
`);
        return true;
    }
    
    /**
     * List commands for a specific module.
     * @param {string} moduleName - Name of the module.
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
