/**
 * js/chat/chat-command-handlers.js
 * Command handlers for Terminal Chat Interface
 * 
 * Simplified implementation that uses ONLY slash commands for commands
 * and sends all other messages to the LLM
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
        // Store original handler if it exists
        if (typeof ChatInterface.handleCommand === 'function') {
            ChatInterface._originalHandleCommand = ChatInterface.handleCommand;
        }
        
        // Clean, simple command handler - slash commands ONLY or LLM
        ChatInterface.handleCommand = function(message) {
            console.log("Handling message:", message);
            
            // Show typing indicator for UI feedback
            this.showTypingIndicator();
            
            // Use a short delay for better UX
            setTimeout(() => {
                // Remove typing indicator
                this.hideTypingIndicator();
                
                // If it starts with slash, treat as a slash command
                if (message.startsWith('/')) {
                    console.log('Processing as slash command');
                    
                    // Special handling for AI slash commands
                    if (message.startsWith('/ai')) {
                        if (typeof window.handleAICommand === 'function') {
                            window.handleAICommand(message, this);
                            return;
                        }
                    }
                    
                    // Let the slash command system handle other slash commands
                    if (window.SlashCommands && typeof window.SlashCommands.executeCommand === 'function') {
                        const success = window.SlashCommands.executeCommand(message);
                        if (success) {
                            return;
                        }
                    }
                    
                    // If no slash command system found, show error
                    this.addSystemMessage(`Unknown slash command: ${message}. Type /help for available commands.`);
                }
                // If not a slash command, send to OpenAI
                else if (window.openAIService && window.openAIService.validateApiKey()) {
                    console.log('Processing as chat message with OpenAI');
                    if (typeof this.processWithOpenAI === 'function') {
                        this.processWithOpenAI(message);
                    } else if (typeof window.processWithOpenAI === 'function') {
                        window.processWithOpenAI(message, this);
                    } else {
                        this.addSystemMessage('Error: OpenAI processing method not available');
                    }
                }
                // Show error if OpenAI processing not available
                else {
                    console.log('OpenAI API key not set');
                    this.addSystemMessage("⚠️ Please set your OpenAI API key with '/ai key YOUR_API_KEY' to chat with AI.");
                }
            }, 300); // Short delay for UI feedback
        };
        
        // Make sure the processWithOpenAI method exists on ChatInterface
        if (typeof window.ChatInterface.processWithOpenAI !== 'function' && 
            typeof window.processWithOpenAI === 'function') {
            window.ChatInterface.processWithOpenAI = function(message) {
                window.processWithOpenAI(message, this);
            };
        }
        
        console.log("Slash commands only chat handler initialized");
        
        // Add a help message about the transition
        setTimeout(() => {
            const helpMessage = "📢 Commands have changed to use slash syntax only. For example:\n" +
                "- Instead of 'show image', use '/image'\n" +
                "- Instead of 'display code', use '/code'\n" +
                "- Instead of 'chart pie', use '/chart pie'\n\n" +
                "Type /help to see all available commands.";
                
            ChatInterface.addSystemMessage(helpMessage);
        }, 1000);
    }
});