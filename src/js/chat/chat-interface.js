/**
 * js/chat/chat-interface.js
 * Core Chat Interface for Terminal Canvas
 * 
 * Provides a terminal-style chat interface that integrates with the existing
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
            
            // Add a terminal cursor effect to the chat input
            this.setupTerminalCursor();
            
            // Setup slash command key handling
            this.setupSlashCommandHandling();
            
            console.log('Terminal chat interface initialized');
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
            
            // Tab completion for commands
            this.chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    this.handleTabCompletion();
                }
            });
        },
        
        // Setup slash command handling - this fixes the slash key issues
        setupSlashCommandHandling: function() {
            console.log("Setting up slash command key handling...");
            
            // Add a direct keypress listener to handle slash command
            this.chatInput.addEventListener('keypress', (e) => {
                // Check for slash key press when input is empty
                if (e.key === '/' && this.chatInput.value === '') {
                    console.log("Slash key detected, activating slash command UI");
                    
                    // Let the key get added to the input naturally
                    setTimeout(() => {
                        // Then trigger the input event to show autocomplete
                        const inputEvent = new Event('input', { bubbles: true });
                        this.chatInput.dispatchEvent(inputEvent);
                        
                        // Also check if autocomplete didn't show up
                        setTimeout(() => {
                            const dropdown = document.querySelector('.slash-command-autocomplete');
                            if (dropdown && dropdown.style.display === 'none' && window.SlashCommands) {
                                console.log("Forcing autocomplete dropdown to display");
                                
                                // Force the dropdown to show
                                dropdown.style.display = 'block';
                                
                                // Position dropdown correctly
                                const rect = this.chatInput.getBoundingClientRect();
                                dropdown.style.top = `${rect.top - 10}px`;
                                dropdown.style.left = `${rect.left}px`;
                                dropdown.style.width = `${rect.width}px`;
                                
                                // Fill dropdown with commands if empty
                                if (dropdown.children.length === 0 && window.SlashCommands) {
                                    // Get available commands
                                    const availableCommands = window.SlashCommands.getAvailableCommands();
                                    const availableDescriptions = window.SlashCommands.getAvailableDescriptions();
                                    
                                    // Add commands to dropdown
                                    for (const cmd in availableCommands) {
                                        if (cmd.startsWith('/')) {
                                            const item = document.createElement('div');
                                            item.className = 'slash-command-item';
                                            item.dataset.command = cmd;
                                            item.innerHTML = `
                                                <span class="slash-command-name">${cmd}</span>
                                                <span class="slash-command-desc">${availableDescriptions[cmd] || ''}</span>
                                            `;
                                            dropdown.appendChild(item);
                                        }
                                    }
                                }
                            }
                        }, 50);
                    }, 10);
                }
            });
            
            // Also ensure the slash button works
            const slashButton = document.querySelector('.slash-command-button');
            if (slashButton) {
                // Remove existing event listeners by cloning
                const newSlashButton = slashButton.cloneNode(true);
                slashButton.parentNode.replaceChild(newSlashButton, slashButton);
                
                // Add new event listener
                newSlashButton.addEventListener('click', () => {
                    this.chatInput.value = '/';
                    this.chatInput.focus();
                    
                    // Trigger input event manually
                    const inputEvent = new Event('input', { bubbles: true });
                    this.chatInput.dispatchEvent(inputEvent);
                    
                    // Also ensure dropdown is shown
                    setTimeout(() => {
                        const dropdown = document.querySelector('.slash-command-autocomplete');
                        if (dropdown && window.SlashCommands) {
                            dropdown.style.display = 'block';
                            
                            // Position dropdown correctly
                            const rect = this.chatInput.getBoundingClientRect();
                            dropdown.style.top = `${rect.top - 10}px`;
                            dropdown.style.left = `${rect.left}px`;
                            dropdown.style.width = `${rect.width}px`;
                            
                            // Force showing help if function available
                            if (typeof showSlashCommandHelp === 'function') {
                                showSlashCommandHelp();
                            }
                        }
                    }, 50);
                });
            }
            
            console.log("Slash command key handling setup complete");
        },
        
        // Add tab completion for common commands
        handleTabCompletion: function() {
            const input = this.chatInput.value.toLowerCase().trim();
            
            // Common command prefixes
            const commandPrefixes = {
                'sh': 'show ',
                'cha': 'chart ',
                'dr': 'draw ',
                'co': 'connect ',
                'he': 'help',
                '/a': '/ai ',
                'cl': 'clear ',
                'sho': 'show ',
                'chart': 'chart ',
                'show i': 'show image ',
                'show r': 'show random image',
                'show c': 'show code ',
                'show m': 'show markdown ',
                'chart p': 'chart pie',
                'chart b': 'chart bar',
                'chart l': 'chart line',
                'draw p': 'draw pattern',
                'draw r': 'draw random'
            };
            
            // Find matching prefix
            for (const [prefix, completion] of Object.entries(commandPrefixes)) {
                if (input === prefix || input.startsWith(prefix + ' ')) {
                    this.chatInput.value = input.replace(prefix, completion);
                    return;
                }
            }
            
            // If we get here and input starts with /, try to find slash command completions
            if (input.startsWith('/') && window.SlashCommands) {
                const availableCommands = window.SlashCommands.getAvailableCommands();
                
                // Find commands that start with the current input
                const matchingCommands = Object.keys(availableCommands).filter(cmd => 
                    cmd.startsWith(input) && cmd !== input);
                
                // If we have matches, use the first one
                if (matchingCommands.length > 0) {
                    this.chatInput.value = matchingCommands[0] + ' ';
                    return;
                }
            }
        },
        
        // Add terminal-style cursor effect
        setupTerminalCursor: function() {
            // Add cursor element after the input
            const cursorSpan = document.createElement('span');
            cursorSpan.className = 'terminal-input-cursor';
            cursorSpan.innerHTML = '&nbsp;';
            
            // Get the parent container of the input
            const inputContainer = this.chatInput.parentElement;
            
            // Insert cursor after input if container exists
            if (inputContainer && !document.querySelector('.terminal-input-cursor')) {
                inputContainer.appendChild(cursorSpan);
                
                // Position it next to the input
                const positionCursor = () => {
                    if (document.activeElement === this.chatInput) {
                        cursorSpan.style.display = 'inline-block';
                    } else {
                        cursorSpan.style.display = 'none';
                    }
                };
                
                // Update cursor visibility on focus/blur
                this.chatInput.addEventListener('focus', positionCursor);
                this.chatInput.addEventListener('blur', positionCursor);
                
                // Initial position
                positionCursor();
            }
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
        
        // Add user message to chat with terminal styling
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
        
        // Add system message to chat with terminal styling
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
        
        // Add terminal-style typing indicator
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
                        <span class="terminal-processing">processing</span>
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
        
        // Process command by connecting to the existing command system
        processCommand: function(command) {
            // This will be implemented in chat-command-handlers.js
            if (typeof this.handleCommand === 'function') {
                this.handleCommand(command);
            } else {
                console.error("Command handler not available");
                this.addSystemMessage("Error: Command handler not loaded properly.");
            }
        }
    };
    
    // Initialize chat interface
    setTimeout(() => {
        ChatInterface.init();
    }, 100);
    
    // Add a function to fix slash commands that can be called from console if needed
    window.fixSlashCommandInput = function() {
        console.log("Attempting to fix slash command input handling...");
        
        // Get input element
        const chatInput = document.getElementById('chat-input');
        if (!chatInput) {
            console.error("Chat input not found");
            return false;
        }
        
        // Force reapply the slash command handling
        ChatInterface.setupSlashCommandHandling();
        
        console.log("Slash command handling fixed");
        return true;
    };
});