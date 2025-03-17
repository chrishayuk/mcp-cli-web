/**
 * js/chat/chat-command-handlers.js
 * Command handlers for Terminal Chat Interface
 * 
 * Extends ChatInterface with command processing capabilities
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait for ChatInterface to be available
    const waitForChatInterface = setInterval(() => {
        if (window.ChatInterface) {
            clearInterval(waitForChatInterface);
            initCommandHandlers();
        }
    }, 100);
    
    function initCommandHandlers() {
        // Add command handling methods to ChatInterface
        
        // Main command handler
        ChatInterface.handleCommand = function(command) {
            // Show typing indicator
            this.showTypingIndicator();
            
            // Define expected response times based on command complexity
            let responseTime = 500; // reduced default response time in ms
            
            // Simulate longer processing for complex commands
            if (command.includes('chart') || command.includes('pattern')) {
                responseTime = 800;
            } else if (command.includes('image')) {
                responseTime = 600;
            } else if (command.includes('markdown') || command.includes(' md ')) {
                responseTime = 700;
            } else if (command.includes('terminal') || command.includes('connect')) {
                responseTime = 1000;
            }
            
            // Process command after realistic delay
            setTimeout(() => {
                // Remove typing indicator
                this.hideTypingIndicator();
                
                // First try direct module execution
                if (this.tryDirectModuleExecution(command)) {
                    return; // Command was handled directly
                }
                
                // Otherwise, convert to terminal command and process
                const terminalCommand = this.convertToTerminalCommand(command);
                this.executeTerminalCommand(terminalCommand, command);
                
            }, responseTime);
        };
        
        // Try direct module execution for certain commands
        ChatInterface.tryDirectModuleExecution = function(command) {
            // Handle chart commands directly
            let directChartMatch = command.match(/chart\s+(bar|pie|line)/i);
            let naturalChartMatch = command.match(/(show|create|make)\s+(a\s+)?(bar|pie|line)\s+chart/i);
            
            if (directChartMatch || naturalChartMatch) {
                // Extract chart type
                let chartType = (directChartMatch) ? 
                    directChartMatch[1].toLowerCase() : 
                    naturalChartMatch[3].toLowerCase();
                
                // Direct execution for charts
                if (this.executeChartCommand(chartType)) {
                    this.addSystemMessage(`Generated ${chartType} chart. Try 'chart bar', 'chart pie', or 'chart line' for different visualizations.`);
                    return true;
                }
            }
            
            // Handle code commands directly
            let codeMatch = command.match(/^(show|display|highlight)\s+code/i);
            if (codeMatch) {
                // Extract code content with a better regex that handles multi-line code
                const codeContentMatch = command.match(/^(?:show|display|highlight)\s+code(?:[:]\s*|\s+)([\s\S]*)/i);
                const codeContent = codeContentMatch && codeContentMatch[1] ? 
                    codeContentMatch[1].trim() : 'console.log("Hello World");';
                
                // Try direct execution first
                if (this.executeCodeCommand(codeContent)) {
                    this.addSystemMessage("Code rendered with syntax highlighting.");
                    return true;
                }
            }
            
            // Handle markdown commands directly
            if (this.tryMarkdownCommands(command)) {
                return true;
            }
            
            // Handle terminal commands directly
            if (this.tryTerminalDirectCommands(command)) {
                return true;
            }
            
            // No direct module could handle the command
            return false;
        };
        
        // Try to handle markdown commands directly
        ChatInterface.tryMarkdownCommands = function(command) {
            let markdownRenderMatch = command.match(/^(show|display|render)\s+(markdown|md)/i);
            let markdownLoadMatch = command.match(/^(load|open)\s+(markdown|md)/i);
            let markdownScrollMatch = command.match(/^(scroll|move)\s+(markdown|md)/i);
            let markdownThemeMatch = command.match(/^(change|set)\s+(markdown|md)\s+(theme|style)/i);
            
            if (markdownRenderMatch) {
                // Extract markdown content
                const mdContentMatch = command.match(/^(?:show|display|render)\s+(?:markdown|md)(?:[:]\s*|\s+)([\s\S]*)/i);
                const mdContent = mdContentMatch && mdContentMatch[1] ? 
                    mdContentMatch[1].trim() : null;
                
                if (mdContent) {
                    // User provided specific markdown content
                    if (this.executeMarkdownCommand('render', mdContent)) {
                        this.addSystemMessage("Markdown rendered. Use 'scroll markdown up/down' to navigate.");
                        return true;
                    }
                } else {
                    // No specific content, load sample
                    if (this.executeMarkdownCommand('load', 'sample')) {
                        this.addSystemMessage("Sample markdown loaded. Use 'scroll markdown up/down' to navigate.");
                        return true;
                    }
                }
            } else if (markdownLoadMatch) {
                // Extract source if provided
                const sourceMatch = command.match(/^(?:load|open)\s+(?:markdown|md)(?:\s+from)?\s+(.+)/i);
                const source = sourceMatch && sourceMatch[1] ? 
                    sourceMatch[1].trim() : 'sample';
                
                if (this.executeMarkdownCommand('load', source)) {
                    this.addSystemMessage(`Markdown from '${source}' loaded successfully.`);
                    return true;
                }
            } else if (markdownScrollMatch) {
                // Extract direction
                const directionMatch = command.match(/\b(up|down|top|bottom)\b/i);
                const direction = directionMatch ? directionMatch[1].toLowerCase() : 'down';
                
                if (this.executeMarkdownCommand('scroll', direction)) {
                    this.addSystemMessage(`Scrolled markdown ${direction}.`);
                    return true;
                }
            } else if (markdownThemeMatch) {
                // Extract theme
                const themeMatch = command.match(/\b(dark|light|dracula|github)\b/i);
                const theme = themeMatch ? themeMatch[1].toLowerCase() : 'dark';
                
                if (this.executeMarkdownCommand('theme', theme)) {
                    this.addSystemMessage(`Markdown theme set to ${theme}.`);
                    return true;
                }
            }
            
            return false;
        };
        
        // Try to handle terminal commands directly
        ChatInterface.tryTerminalDirectCommands = function(command) {
            let terminalConnectMatch = command.match(/^(connect|open)\s+(terminal|term|console)/i);
            let terminalSendMatch = command.match(/^(send|run|execute|type)\s+(in|to)?\s*(terminal|term|console)/i);
            let terminalDisconnectMatch = command.match(/^(disconnect|close)\s+(terminal|term|console)/i);
            let terminalClearMatch = command.match(/^(clear)\s+(terminal|term|console)/i);
            
            if (terminalConnectMatch) {
                // Extract endpoint if provided
                const endpointMatch = command.match(/\b(to|with|at|using)\s+(.+)$/i);
                const endpoint = endpointMatch && endpointMatch[2] ? 
                    endpointMatch[2].trim() : 'wss://echo.websocket.org';
                
                if (this.executeTerminalCommand('connect', endpoint)) {
                    this.addSystemMessage(`Terminal connected to ${endpoint}. Use 'send to terminal [command]' to send commands.`);
                    return true;
                }
            } else if (terminalSendMatch) {
                // Extract command to send
                const commandMatch = command.match(/^(?:send|run|execute|type)(?:\s+(?:in|to))?\s*(?:terminal|term|console)(?:[:]\s*|\s+)([\s\S]*)/i);
                const commandToSend = commandMatch && commandMatch[1] ? 
                    commandMatch[1].trim() : '';
                
                if (commandToSend && this.executeTerminalCommand('send', commandToSend)) {
                    this.addSystemMessage(`Command sent: "${commandToSend}"`);
                    return true;
                } else {
                    this.addSystemMessage("Error: No command specified for terminal.");
                    return true;
                }
            } else if (terminalDisconnectMatch) {
                if (this.executeTerminalCommand('disconnect')) {
                    this.addSystemMessage("Terminal disconnected.");
                    return true;
                }
            } else if (terminalClearMatch) {
                if (this.executeTerminalCommand('clear')) {
                    this.addSystemMessage("Terminal cleared.");
                    return true;
                }
            }
            
            return false;
        };
        
        // Convert chat-style commands to terminal commands
        ChatInterface.convertToTerminalCommand = function(command) {
            // Convert chat-style commands to terminal commands
            let terminalCommand = command;
            
            // Replace common chat phrases with terminal commands
            if (command.match(/^(show|display) (random )?image/i)) {
                terminalCommand = command.replace(/^(show|display) (random )?image/i, 'fetch image');
            } else if (command.match(/^(show|create|make) (a |the )?(bar|pie|line) chart/i)) {
                const chartType = command.match(/bar|pie|line/i)[0].toLowerCase();
                terminalCommand = `chart ${chartType}`;
            } else if (command.match(/^(show|display|highlight) code/i)) {
                // Improved code content extraction
                const codeContentMatch = command.match(/^(?:show|display|highlight)\s+code(?:[:]\s*|\s+)([\s\S]*)/i);
                const codeContent = codeContentMatch && codeContentMatch[1] ? 
                    codeContentMatch[1].trim() : 'console.log("Hello World");';
                terminalCommand = `code display ${codeContent}`;
            } 
            // Markdown commands
            else if (command.match(/^(show|display|render) (markdown|md)/i)) {
                // Extract markdown content
                const mdMatch = command.match(/^(?:show|display|render)\s+(?:markdown|md)(?:[:]\s*|\s+)([\s\S]*)/i);
                if (mdMatch && mdMatch[1]) {
                    // User provided specific markdown content
                    terminalCommand = `markdown render ${mdMatch[1].trim()}`;
                } else {
                    // No specific content, load sample
                    terminalCommand = 'markdown load sample';
                }
            } else if (command.match(/^(load|open) (markdown|md)/i)) {
                // Extract source if provided
                const sourceMatch = command.match(/^(?:load|open)\s+(?:markdown|md)(?:\s+from)?\s+(.+)/i);
                if (sourceMatch && sourceMatch[1]) {
                    terminalCommand = `markdown load ${sourceMatch[1].trim()}`;
                } else {
                    // Default to sample
                    terminalCommand = 'markdown load sample';
                }
            } else if (command.match(/^(scroll|move) (markdown|md) (up|down|top|bottom)/i)) {
                // Extract direction
                const directionMatch = command.match(/\b(up|down|top|bottom)\b/i);
                if (directionMatch) {
                    terminalCommand = `markdown scroll ${directionMatch[1].toLowerCase()}`;
                }
            } else if (command.match(/^(change|set) (markdown|md) (theme|style)/i)) {
                // Extract theme
                const themeMatch = command.match(/\b(dark|light|dracula|github)\b/i);
                if (themeMatch) {
                    terminalCommand = `markdown theme ${themeMatch[1].toLowerCase()}`;
                } else {
                    terminalCommand = 'markdown theme dark'; // Default
                }
            } 
            // Terminal commands
            else if (command.match(/^(connect|open) (terminal|term|console)/i)) {
                // Extract endpoint if provided
                const endpointMatch = command.match(/\b(to|with|at|using)\s+(.+)$/i);
                const endpoint = endpointMatch && endpointMatch[2] ? 
                    endpointMatch[2].trim() : 'wss://echo.websocket.org';
                
                terminalCommand = `terminal connect ${endpoint}`;
            } else if (command.match(/^(send|run|execute|type) (in|to)? (terminal|term|console)/i)) {
                // Extract command to send
                const commandMatch = command.match(/^(?:send|run|execute|type)(?:\s+(?:in|to))?\s*(?:terminal|term|console)(?:[:]\s*|\s+)([\s\S]*)/i);
                const commandToSend = commandMatch && commandMatch[1] ? 
                    commandMatch[1].trim() : '';
                
                if (commandToSend) {
                    terminalCommand = `terminal send ${commandToSend}`;
                } else {
                    terminalCommand = `terminal send`;
                }
            } else if (command.match(/^(disconnect|close) (terminal|term|console)/i)) {
                terminalCommand = 'terminal disconnect';
            } else if (command.match(/^(clear) (terminal|term|console)/i)) {
                terminalCommand = 'terminal clear';
            } else if (command.match(/^(draw|create|make) (a |the )?(pattern|shape)/i)) {
                terminalCommand = 'draw pattern';
            } else if (command.match(/^(help|commands|what can you do)/i)) {
                terminalCommand = 'help';
            }
            
            return terminalCommand;
        };
        
        // Execute command through the terminal system
        ChatInterface.executeTerminalCommand = function(terminalCommand, originalCommand) {
            let response = '';
            try {
                if (window.Commands && typeof window.Commands.processCommand === 'function') {
                    // Add to terminal output for compatibility
                    if (window.terminal && typeof window.terminal.addOutput === 'function') {
                        window.terminal.addOutput(`$ ${terminalCommand}`);
                    }
                    
                    // Execute the actual command through the terminal system
                    window.Commands.processCommand(terminalCommand);
                    
                    // Generate appropriate terminal-style response
                    originalCommand = originalCommand || terminalCommand;
                    
                    if (originalCommand.includes('image')) {
                        response = "Image rendered. Use 'show random image' for a different image.";
                    } else if (originalCommand.includes('chart')) {
                        response = "Chart generated. Available types: bar, pie, line.";
                    } else if (originalCommand.includes('code')) {
                        response = "Code rendered with syntax highlighting.";
                    } 
                    // Markdown responses
                    else if (originalCommand.includes('markdown') || originalCommand.includes(' md ')) {
                        if (originalCommand.includes('load') || originalCommand.includes('open')) {
                            response = "Markdown loaded. Use 'scroll markdown up/down' to navigate.";
                        } else if (originalCommand.includes('scroll') || originalCommand.includes('move')) {
                            response = "Markdown scrolled.";
                        } else if (originalCommand.includes('theme') || originalCommand.includes('style')) {
                            response = "Markdown theme updated.";
                        } else {
                            response = "Markdown rendered. Available themes: dark, light, dracula, github.";
                        }
                    } 
                    // Terminal responses
                    else if (originalCommand.match(/(terminal|term|console)/i)) {
                        if (originalCommand.match(/connect|open/i)) {
                            response = "Terminal connection established.";
                        } else if (originalCommand.match(/send|run|execute|type/i)) {
                            response = "Command sent to terminal.";
                        } else if (originalCommand.match(/disconnect|close/i)) {
                            response = "Terminal connection closed.";
                        } else if (originalCommand.match(/clear/i)) {
                            response = "Terminal cleared.";
                        } else {
                            response = "Terminal command processed.";
                        }
                    }
                    else if (originalCommand.includes('pattern') || originalCommand.includes('shape')) {
                        response = "Pattern rendered. Try 'draw random' for a different pattern.";
                    } else if (originalCommand.includes('help')) {
                        response = `Available commands:
- show image [url] | show random image
- chart pie | chart bar | chart line
- show code [your code]
- show markdown [text] | load markdown from [url]
- connect terminal | send to terminal [command]
- draw pattern | draw random
- clear canvas
- /ai help (AI commands)`;
                    } else {
                        response = "Command processed.";
                    }
                } else {
                    // If Commands object is not available
                    console.error("Commands object not available, using fallback", window.Commands);
                    
                    // Tell the user what to do
                    response = "Error: visualization system not available. Check console for details.";
                }
            } catch (error) {
                console.error("Error processing command", error);
                response = `Error: ${error.message}`;
            }
            
            // Add system response
            this.addSystemMessage(response);
        };
        
        console.log("Chat command handlers initialized");
    }
});