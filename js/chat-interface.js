/**
 * Chat Interface for Terminal Canvas
 * 
 * Provides a chat-like interface that integrates with the existing
 * canvas-manager and module system
 */
 
document.addEventListener('DOMContentLoaded', function() {
    // Check if global objects exist
    window.ChatInterface = {
        init: function() {
            // Setup chat interface
            this.chatMessages = document.getElementById('chat-messages');
            this.chatInput = document.getElementById('chat-input');
            this.chatSend = document.getElementById('chat-send');
            this.commandSuggestions = document.querySelectorAll('.command-suggestion');
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('Chat interface initialized');
            return true;
        },
        
        setupEventListeners: function() {
            // Auto-expand input as user types
            this.chatInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
                // Reset if empty
                if (this.value.trim() === '') {
                    this.style.height = '';
                }
            });
            
            // Command suggestions click handler
            this.commandSuggestions.forEach(suggestion => {
                suggestion.addEventListener('click', () => {
                    const command = suggestion.textContent;
                    this.chatInput.value = command;
                    this.chatInput.focus();
                });
            });
            
            // Send button click
            this.chatSend.addEventListener('click', () => {
                this.sendMessage();
            });
            
            // Enter key to send
            this.chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        },
        
        // Send message function
        sendMessage: function() {
            const message = this.chatInput.value.trim();
            if (message === '') return;
            
            // Add user message to chat
            this.addUserMessage(message);
            
            // Clear input
            this.chatInput.value = '';
            this.chatInput.style.height = '';
            
            // Process command
            this.processCommand(message);
        },
        
        // Add user message to chat
        addUserMessage: function(text) {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message user-message';
            messageDiv.innerHTML = `
                <div class="message-avatar user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="message-content user-content">
                    <div class="message-text">${text}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
            
            this.chatMessages.appendChild(messageDiv);
            this.scrollToBottom();
        },
        
        // Add system message to chat
        addSystemMessage: function(text) {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message system-message';
            messageDiv.innerHTML = `
                <div class="message-avatar system-avatar">
                    <i class="fas fa-desktop"></i>
                </div>
                <div class="message-content system-content">
                    <div class="message-text">${text}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
            
            this.chatMessages.appendChild(messageDiv);
            this.scrollToBottom();
            
            return messageDiv;
        },
        
        // Show typing indicator
        showTypingIndicator: function() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'chat-message system-message';
            typingDiv.id = 'typing-indicator';
            typingDiv.innerHTML = `
                <div class="message-avatar system-avatar">
                    <i class="fas fa-desktop"></i>
                </div>
                <div class="message-content system-content">
                    <div class="system-thinking">
                        <span>Processing</span>
                        <div class="thinking-dots">
                            <div class="thinking-dot"></div>
                            <div class="thinking-dot"></div>
                            <div class="thinking-dot"></div>
                        </div>
                    </div>
                </div>
            `;
            
            this.chatMessages.appendChild(typingDiv);
            this.scrollToBottom();
            
            return typingDiv;
        },
        
        // Hide typing indicator
        hideTypingIndicator: function() {
            const indicator = document.getElementById('typing-indicator');
            if (indicator) {
                indicator.remove();
            }
        },
        
        // Scroll to bottom of chat
        scrollToBottom: function() {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        },
        
        // Execute chart module commands directly for debugging
        executeChartCommand: function(chartType) {
            try {
                console.log("Directly executing chart command:", chartType);
                
                // Direct canvas-manager manipulation for charts
                if (window.Commands && window.Commands.canvasManager) {
                    const cm = window.Commands.canvasManager;
                    cm.activateModule('chart');
                    const chartModule = cm.getModule('chart');
                    
                    if (chartModule) {
                        // For chart module, first generate random data
                        chartModule.generateRandomData();
                        
                        // Then set chart type and render
                        chartModule.chartType = chartType;
                        chartModule.render();
                        return true;
                    }
                }
                return false;
            } catch (e) {
                console.error("Error executing chart command directly:", e);
                return false;
            }
        },
        
        // Execute code module commands directly
        executeCodeCommand: function(codeContent) {
            try {
                console.log("Directly executing code command with content length:", codeContent.length);
                
                // Direct canvas-manager manipulation for code display
                if (window.Commands && window.Commands.canvasManager) {
                    const cm = window.Commands.canvasManager;
                    cm.activateModule('code');
                    const codeModule = cm.getModule('code');
                    
                    if (codeModule) {
                        // Call the displayCode method directly
                        console.log("Code module found, calling displayCode directly");
                        if (typeof codeModule.displayCode === 'function') {
                            codeModule.displayCode(codeContent);
                            return true;
                        } else {
                            console.error("displayCode method not found on code module", codeModule);
                            // Try using the standard command interface as fallback
                            return cm.executeCommand('display', codeContent);
                        }
                    } else {
                        console.error("Code module not found in canvas manager");
                    }
                } else {
                    console.error("Canvas manager not available");
                }
                return false;
            } catch (e) {
                console.error("Error executing code command directly:", e);
                return false;
            }
        },
        
        // Execute markdown module commands directly
        executeMarkdownCommand: function(action, content) {
            try {
                console.log("Directly executing markdown command:", action, content);
                
                // Direct canvas-manager manipulation for markdown
                if (window.Commands && window.Commands.canvasManager) {
                    const cm = window.Commands.canvasManager;
                    cm.activateModule('markdown');
                    const mdModule = cm.getModule('markdown');
                    
                    if (mdModule) {
                        // Call specific methods based on action
                        if (action === 'render' && content) {
                            return mdModule.renderMarkdown(content);
                        } else if (action === 'load') {
                            return mdModule.loadMarkdown(content || 'sample');
                        } else if (action === 'theme') {
                            return mdModule.setTheme(content || 'dark');
                        } else if (action === 'scroll') {
                            // Handle scroll with default amount
                            const direction = content || 'down';
                            return mdModule.handleCommand('scroll', [direction]);
                        }
                    } else {
                        console.error("Markdown module not found in canvas manager");
                    }
                } else {
                    console.error("Canvas manager not available");
                }
                return false;
            } catch (e) {
                console.error("Error executing markdown command directly:", e);
                return false;
            }
        },
        
        // Execute terminal module commands directly
        executeTerminalCommand: function(action, content) {
            try {
                console.log("Directly executing terminal command:", action, content);
                
                // Direct canvas-manager manipulation for terminal
                if (window.Commands && window.Commands.canvasManager) {
                    const cm = window.Commands.canvasManager;
                    cm.activateModule('terminal');
                    const terminalModule = cm.getModule('terminal');
                    
                    if (terminalModule) {
                        // Call specific methods based on action
                        if (action === 'connect' && content) {
                            return terminalModule.connect(content);
                        } else if (action === 'send' && content) {
                            return terminalModule.sendData(content);
                        } else if (action === 'disconnect') {
                            return terminalModule.disconnect();
                        } else if (action === 'clear') {
                            return terminalModule.clearTerminal();
                        }
                    } else {
                        console.error("Terminal module not found in canvas manager");
                    }
                } else {
                    console.error("Canvas manager not available");
                }
                return false;
            } catch (e) {
                console.error("Error executing terminal command directly:", e);
                return false;
            }
        },
        
        // Process command by connecting to the existing command system
        processCommand: function(command) {
            // Show typing indicator
            this.showTypingIndicator();
            
            // Define expected response times based on command complexity
            let responseTime = 700; // default response time in ms
            
            // Simulate longer processing for complex commands
            if (command.includes('chart') || command.includes('pattern')) {
                responseTime = 1200;
            } else if (command.includes('image')) {
                responseTime = 900;
            } else if (command.includes('markdown') || command.includes(' md ')) {
                responseTime = 1000;
            } else if (command.includes('terminal') || command.includes('connect')) {
                responseTime = 1500;
            }
            
            // Process command after realistic delay
            setTimeout(() => {
                // Remove typing indicator
                this.hideTypingIndicator();
                
                // Handle chart commands directly due to common module issues
                let directChartMatch = command.match(/chart\s+(bar|pie|line)/i);
                let naturalChartMatch = command.match(/(show|create|make)\s+(a\s+)?(bar|pie|line)\s+chart/i);
                
                if (directChartMatch || naturalChartMatch) {
                    // Extract chart type
                    let chartType = (directChartMatch) ? 
                        directChartMatch[1].toLowerCase() : 
                        naturalChartMatch[3].toLowerCase();
                    
                    // Direct execution for charts
                    if (this.executeChartCommand(chartType)) {
                        this.addSystemMessage(`Here's your ${chartType} chart! You can try different types like bar, pie, or line charts.`);
                        return;
                    }
                }
                
                // Handle code commands directly, similar to chart commands
                let codeMatch = command.match(/^(show|display|highlight)\s+code/i);
                if (codeMatch) {
                    // Extract code content with a better regex that handles multi-line code
                    const codeContentMatch = command.match(/^(?:show|display|highlight)\s+code(?:[:]\s*|\s+)([\s\S]*)/i);
                    const codeContent = codeContentMatch && codeContentMatch[1] ? 
                        codeContentMatch[1].trim() : 'console.log("Hello World");';
                    
                    console.log("Processing code command with content length:", codeContent.length);
                    
                    // Try direct execution first
                    if (this.executeCodeCommand(codeContent)) {
                        this.addSystemMessage("I've formatted and displayed the code with syntax highlighting.");
                        return;
                    }
                }
                
                // Handle markdown commands directly
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
                            this.addSystemMessage("I've rendered the markdown for you. Try scrolling or changing the theme if you'd like.");
                            return;
                        }
                    } else {
                        // No specific content, load sample
                        if (this.executeMarkdownCommand('load', 'sample')) {
                            this.addSystemMessage("I've loaded a sample markdown document for you. You can scroll up/down to navigate.");
                            return;
                        }
                    }
                } else if (markdownLoadMatch) {
                    // Extract source if provided
                    const sourceMatch = command.match(/^(?:load|open)\s+(?:markdown|md)(?:\s+from)?\s+(.+)/i);
                    const source = sourceMatch && sourceMatch[1] ? 
                        sourceMatch[1].trim() : 'sample';
                    
                    if (this.executeMarkdownCommand('load', source)) {
                        this.addSystemMessage("I've loaded the markdown document for you. You can scroll up/down to navigate.");
                        return;
                    }
                } else if (markdownScrollMatch) {
                    // Extract direction
                    const directionMatch = command.match(/\b(up|down|top|bottom)\b/i);
                    const direction = directionMatch ? directionMatch[1].toLowerCase() : 'down';
                    
                    if (this.executeMarkdownCommand('scroll', direction)) {
                        this.addSystemMessage("I've scrolled the markdown content as requested.");
                        return;
                    }
                } else if (markdownThemeMatch) {
                    // Extract theme
                    const themeMatch = command.match(/\b(dark|light|dracula|github)\b/i);
                    const theme = themeMatch ? themeMatch[1].toLowerCase() : 'dark';
                    
                    if (this.executeMarkdownCommand('theme', theme)) {
                        this.addSystemMessage(`I've updated the markdown theme to ${theme}. You can also try 'light', 'dark', 'dracula', or 'github' themes.`);
                        return;
                    }
                }
                
                // Handle terminal commands directly
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
                        this.addSystemMessage(`Connected to terminal at ${endpoint}. You can now send commands using "send to terminal [command]".`);
                        return;
                    }
                } else if (terminalSendMatch) {
                    // Extract command to send
                    const commandMatch = command.match(/^(?:send|run|execute|type)(?:\s+(?:in|to))?\s*(?:terminal|term|console)(?:[:]\s*|\s+)([\s\S]*)/i);
                    const commandToSend = commandMatch && commandMatch[1] ? 
                        commandMatch[1].trim() : '';
                    
                    if (commandToSend && this.executeTerminalCommand('send', commandToSend)) {
                        this.addSystemMessage(`Command sent to terminal: "${commandToSend}"`);
                        return;
                    } else {
                        this.addSystemMessage("Please specify a command to send to the terminal.");
                        return;
                    }
                } else if (terminalDisconnectMatch) {
                    if (this.executeTerminalCommand('disconnect')) {
                        this.addSystemMessage("Disconnected from terminal.");
                        return;
                    }
                } else if (terminalClearMatch) {
                    if (this.executeTerminalCommand('clear')) {
                        this.addSystemMessage("Terminal cleared.");
                        return;
                    }
                }
                
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
                
                // Send to global Commands object if it exists
                let response = '';
                try {
                    if (window.Commands && typeof window.Commands.processCommand === 'function') {
                        // Add to terminal output for compatibility
                        if (window.terminal && typeof window.terminal.addOutput === 'function') {
                            window.terminal.addOutput(`$ ${terminalCommand}`);
                        }
                        
                        // Execute the actual command through the terminal system
                        window.Commands.processCommand(terminalCommand);
                        
                        // Generate appropriate response
                        if (command.includes('image')) {
                            response = "I've displayed the image for you! Let me know if you want to see a different one.";
                        } else if (command.includes('chart')) {
                            response = "Here's your chart! You can try different types like bar, pie, or line charts.";
                        } else if (command.includes('code')) {
                            response = "I've formatted and displayed the code with syntax highlighting.";
                        } 
                        // Markdown responses
                        else if (command.includes('markdown') || command.includes(' md ')) {
                            if (command.includes('load') || command.includes('open')) {
                                response = "I've loaded the markdown document for you. You can scroll up/down to navigate.";
                            } else if (command.includes('scroll') || command.includes('move')) {
                                response = "I've scrolled the markdown content as requested.";
                            } else if (command.includes('theme') || command.includes('style')) {
                                response = "I've updated the markdown theme. You can also try 'light', 'dark', 'dracula', or 'github' themes.";
                            } else {
                                response = "I've rendered the markdown for you. Try scrolling or changing the theme if you'd like.";
                            }
                        } 
                        // Terminal responses
                        else if (command.match(/(terminal|term|console)/i)) {
                            if (command.match(/connect|open/i)) {
                                response = "Terminal connection established. You can send commands with 'send to terminal [command]'.";
                            } else if (command.match(/send|run|execute|type/i)) {
                                response = "Command sent to terminal.";
                            } else if (command.match(/disconnect|close/i)) {
                                response = "Terminal connection closed.";
                            } else if (command.match(/clear/i)) {
                                response = "Terminal cleared.";
                            } else {
                                response = "Terminal command processed.";
                            }
                        }
                        else if (command.includes('pattern') || command.includes('shape')) {
                            response = "I've created a pattern for you! You can try 'draw random' for a different shape.";
                        } else if (command.includes('help')) {
                            response = `Here's what I can do:
- Show images: "show image [url]" or "show random image"
- Create charts: "create pie chart", "bar chart", "line chart"
- Display code with syntax highlighting: "show code [your code]"
- Render markdown: "show markdown [text]" or "load markdown from [url]"
- Connect to terminals: "connect terminal" or "send to terminal [command]"
- Draw shapes and patterns: "draw pattern", "draw random"
- Clear the canvas: "clear canvas"`;
                        } else {
                            response = "I've processed your command. Is there anything else you'd like to visualize?";
                        }
                    } else {
                        // If Commands object is not available
                        console.error("Commands object not available, using fallback", window.Commands);
                        
                        // Tell the user what to do
                        response = "I'm having trouble connecting to the visualization system. Please make sure all JavaScript files are loaded properly.";
                    }
                } catch (error) {
                    console.error("Error processing command", error);
                    response = `I encountered an error processing your command: ${error.message}`;
                }
                
                // Add system response
                this.addSystemMessage(response);
                
            }, responseTime);
        }
    };
    
    // Add debugging function to window for troubleshooting
    window.debugCodeModule = function() {
        console.log("=== CODE MODULE DEBUG ===");
        
        if (!window.Commands) {
            console.error("Commands object not available");
            return;
        }
        
        if (!window.Commands.canvasManager) {
            console.error("Canvas Manager not available");
            return;
        }
        
        const cm = window.Commands.canvasManager;
        console.log("Available modules:", Object.keys(cm.modules || {}));
        
        const codeModule = cm.getModule('code');
        if (!codeModule) {
            console.error("Code module not found in canvas manager");
            return;
        }
        
        console.log("Code module properties:", Object.getOwnPropertyNames(codeModule));
        console.log("Code module prototype methods:", 
                    Object.getOwnPropertyNames(Object.getPrototypeOf(codeModule)));
        
        // Test the module with a simple code snippet
        console.log("Testing code module directly:");
        try {
            const result = codeModule.displayCode('console.log("Test");');
            console.log("Direct displayCode result:", result);
        } catch (error) {
            console.error("Error calling displayCode directly:", error);
        }
    };
    
    // Add debugging function for markdown module
    window.debugMarkdownModule = function() {
        console.log("=== MARKDOWN MODULE DEBUG ===");
        
        if (!window.Commands) {
            console.error("Commands object not available");
            return;
        }
        
        if (!window.Commands.canvasManager) {
            console.error("Canvas Manager not available");
            return;
        }
        
        const cm = window.Commands.canvasManager;
        console.log("Available modules:", Object.keys(cm.modules || {}));
        
        const mdModule = cm.getModule('markdown');
        if (!mdModule) {
            console.error("Markdown module not found in canvas manager");
            return;
        }
        
        console.log("Markdown module properties:", Object.getOwnPropertyNames(mdModule));
        console.log("Markdown module prototype methods:", 
                   Object.getOwnPropertyNames(Object.getPrototypeOf(mdModule)));
        
        // Test the module with a simple markdown snippet
        console.log("Testing markdown module directly:");
        try {
            const result = mdModule.renderMarkdown('# Test Heading\n\nThis is a test.');
            console.log("Direct renderMarkdown result:", result);
        } catch (error) {
            console.error("Error calling renderMarkdown directly:", error);
        }
    };
    
    // Add debugging function for terminal module
    window.debugTerminalModule = function() {
        console.log("=== TERMINAL MODULE DEBUG ===");
        
        if (!window.Commands) {
            console.error("Commands object not available");
            return;
        }
        
        if (!window.Commands.canvasManager) {
            console.error("Canvas Manager not available");
            return;
        }
        
        const cm = window.Commands.canvasManager;
        console.log("Available modules:", Object.keys(cm.modules || {}));
        
        const terminalModule = cm.getModule('terminal');
        if (!terminalModule) {
            console.error("Terminal module not found in canvas manager");
            return;
        }
        
        console.log("Terminal module properties:", Object.getOwnPropertyNames(terminalModule));
        console.log("Terminal module prototype methods:", 
                   Object.getOwnPropertyNames(Object.getPrototypeOf(terminalModule)));
        
        // Test the module with basic functions
        console.log("Testing terminal module directly:");
        try {
            // Just report connection status
            console.log("Terminal connected:", terminalModule.connected);
        } catch (error) {
            console.error("Error accessing terminal module:", error);
        }
    };
    
    // Initialize chat interface
    setTimeout(() => {
        ChatInterface.init();
    }, 100);
});