/**
 * chat-code-handler.js
 * Handles code detection, formatting, and interaction in the chat interface
 * 
 * This module adds code block detection and enhancement to chat messages,
 * including syntax highlighting and actions to interact with the code module
 */

// Define a self-contained module for code handling in chat
const ChatCodeHandler = {
    // Initialize the code handler
    init: function() {
        if (!window.ChatInterface) {
            console.error("Chat interface not found. Code handler will not initialize.");
            return false;
        }
        
        // Extend the chat interface with code handling
        this.extendChatInterface();
        
        // Add command suggestions
        this.addCommandSuggestions();
        
        // Add event listeners for pre-send code detection
        this.setupCodeDetection();
        
        console.log("Chat code handler initialized");
        return true;
    },
    
    // Extend the chat interface with code handling
    extendChatInterface: function() {
        // Store original addSystemMessage function
        const originalAddSystemMessage = window.ChatInterface.addSystemMessage;
        
        // Override addSystemMessage
        window.ChatInterface.addSystemMessage = function(text) {
            // Call the original function to create the message
            const messageDiv = originalAddSystemMessage.call(this, text);
            
            // Process the message to detect and enhance code blocks
            ChatCodeHandler.enhanceMessageWithCodeDetection(messageDiv);
            
            return messageDiv;
        };
        
        // Store and override addUserMessage function
        const originalAddUserMessage = window.ChatInterface.addUserMessage;
        window.ChatInterface.addUserMessage = function(text) {
            // Call the original function
            originalAddUserMessage.call(this, text);
            
            // Get the last message which would be the one we just added
            const messageDiv = this.chatMessages.lastElementChild;
            
            // Process the message to detect code
            ChatCodeHandler.enhanceMessageWithCodeDetection(messageDiv);
        };
    },
    
    // Add code-related command suggestions to the UI
    addCommandSuggestions: function() {
        setTimeout(() => {
            const suggestionsContainer = document.getElementById('command-suggestions');
            if (!suggestionsContainer) return;
            
            // Check if code suggestion already exists
            let hasFormatCodeSuggestion = false;
            Array.from(suggestionsContainer.children).forEach(child => {
                if (child.textContent.includes('format code')) {
                    hasFormatCodeSuggestion = true;
                }
            });
            
            // Only add if it doesn't exist
            if (!hasFormatCodeSuggestion) {
                const formatCodeSuggestion = document.createElement('span');
                formatCodeSuggestion.className = 'command-suggestion';
                formatCodeSuggestion.innerHTML = '<i class="fas fa-code"></i> format code';
                suggestionsContainer.appendChild(formatCodeSuggestion);
                
                // Add click event listener
                formatCodeSuggestion.addEventListener('click', () => {
                    const chatInput = document.getElementById('chat-input');
                    if (chatInput) {
                        this.formatCodeInInput(chatInput);
                        chatInput.focus();
                    }
                });
            }
        }, 800);
    },
    
    // Set up event listeners for code detection
    setupCodeDetection: function() {
        setTimeout(() => {
            const sendButton = document.getElementById('chat-send');
            if (!sendButton) return;
            
            // Store original onclick handler
            const originalClickHandler = sendButton.onclick;
            
            // Override with our enhanced version
            sendButton.onclick = function(event) {
                const chatInput = document.getElementById('chat-input');
                if (chatInput) {
                    // Check input for code and offer to format it
                    ChatCodeHandler.checkAndOfferFormatting(chatInput);
                }
                
                // Call the original handler
                if (originalClickHandler) {
                    originalClickHandler.call(this, event);
                }
            };
        }, 800);
    },
    
    // Check input for code and offer to format it
    checkAndOfferFormatting: function(inputElement) {
        if (!inputElement || !inputElement.value) return;
        
        const text = inputElement.value.trim();
        
        // Skip if already formatted or empty
        if (text.length === 0 || /```/.test(text)) return;
        
        // Check if message contains code with heuristics
        const codeSignatures = /function|class|const|let|var|if|for|while|\{|\}|==|=>|console\.log|import|export|return/i;
        
        if (codeSignatures.test(text)) {
            // Only suggest formatting if it looks substantial
            if (text.split('\n').length > 1 || text.length > 50) {
                const wantsToFormat = confirm("This looks like code. Format it with syntax highlighting?");
                if (wantsToFormat) {
                    // Try to detect language
                    let language = "javascript"; // Default
                    
                    // Python detection
                    if (/def |import |if __name__ ==|class .*\(.*\):|print\(/.test(text)) {
                        language = "python";
                    }
                    // HTML detection
                    else if (/<html|<body|<div|<p>|<script/.test(text)) {
                        language = "html";
                    }
                    // CSS detection
                    else if (/{[\s\S]*?}/.test(text) && /body|margin|padding|color|font-size/.test(text)) {
                        language = "css";
                    }
                    
                    inputElement.value = "```" + language + "\n" + text + "\n```";
                }
            }
        }
    },
    
    // Format code in the input field
    formatCodeInInput: function(inputElement) {
        if (!inputElement) return;
        
        const text = inputElement.value.trim();
        
        // Skip if empty
        if (text.length === 0) return;
        
        // If not already formatted with backticks
        if (!text.startsWith('```') && !text.endsWith('```')) {
            // Try to detect language
            let language = "javascript"; // Default
            
            // Python detection
            if (/def |import |if __name__ ==|class .*\(.*\):|print\(/.test(text)) {
                language = "python";
            }
            // HTML detection
            else if (/<html|<body|<div|<p>|<script/.test(text)) {
                language = "html";
            }
            // CSS detection
            else if (/{[\s\S]*?}/.test(text) && /body|margin|padding|color|font-size/.test(text)) {
                language = "css";
            }
            
            inputElement.value = "```" + language + "\n" + text + "\n```";
        }
    },
    
    // Detect and enhance code blocks in a message
    enhanceMessageWithCodeDetection: function(messageDiv) {
        if (!messageDiv) return;
        
        const messageText = messageDiv.querySelector('.message-text');
        if (!messageText) return;
        
        // Check for code blocks with markdown backticks: ```code```
        const codeBlockRegex = /```(?:([\w-]+)\n)?([\s\S]*?)```/g;
        
        // Create a document fragment to build the new content
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;
        let hasCodeBlock = false;
        
        // Get the original text content
        const originalText = messageText.innerHTML;
        
        // Find all code blocks
        while ((match = codeBlockRegex.exec(originalText)) !== null) {
            hasCodeBlock = true;
            
            // Add text before the code block
            const textBeforeMatch = originalText.substring(lastIndex, match.index);
            const textNode = document.createElement('div');
            textNode.innerHTML = textBeforeMatch;
            fragment.appendChild(textNode);
            
            // Extract language and code
            const language = match[1] || 'javascript'; // Default to javascript if not specified
            const code = match[2].trim();
            
            // Create enhanced code block
            const codeBlock = this.createEnhancedCodeBlock(code, language);
            fragment.appendChild(codeBlock);
            
            lastIndex = match.index + match[0].length;
        }
        
        // If no code blocks were found, exit early
        if (!hasCodeBlock) return;
        
        // Add any remaining text after the last code block
        if (lastIndex < originalText.length) {
            const textNode = document.createElement('div');
            textNode.innerHTML = originalText.substring(lastIndex);
            fragment.appendChild(textNode);
        }
        
        // Replace the message text content with our enhanced version
        messageText.innerHTML = '';
        messageText.appendChild(fragment);
    },
    
    // Create an enhanced code block with syntax highlighting and action buttons
    createEnhancedCodeBlock: function(code, language) {
        // Create container for code block
        const container = document.createElement('div');
        container.className = 'code-block-container';
        
        // Create code header with language and actions
        const header = document.createElement('div');
        header.className = 'code-block-header';
        
        // Add language indicator
        const langLabel = document.createElement('span');
        langLabel.textContent = language;
        header.appendChild(langLabel);
        
        // Add actions container
        const actions = document.createElement('div');
        actions.className = 'code-block-actions';
        
        // Add copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'terminal-button';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.title = 'Copy code';
        
        // Add event listener to copy code
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(code)
                .then(() => {
                    // Show a temporary "Copied!" message
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                        copyBtn.classList.remove('copied');
                    }, 1000);
                })
                .catch(err => {
                    console.error('Could not copy code: ', err);
                });
        });
        
        // Add send to editor button
        const sendToEditorBtn = document.createElement('button');
        sendToEditorBtn.className = 'terminal-button';
        sendToEditorBtn.innerHTML = '<i class="fas fa-code"></i> Edit';
        sendToEditorBtn.title = 'Send to Code Editor';
        
        // Add event listener to send code to the editor
        sendToEditorBtn.addEventListener('click', () => {
            this.sendCodeToEditor(code, language);
        });
        
        // Add buttons to actions
        actions.appendChild(copyBtn);
        actions.appendChild(sendToEditorBtn);
        header.appendChild(actions);
        
        // Add header to container
        container.appendChild(header);
        
        // Create code block
        const codeElement = document.createElement('pre');
        const codeContent = document.createElement('code');
        codeContent.className = language;
        codeContent.textContent = code;
        
        // Add code to container
        codeElement.appendChild(codeContent);
        container.appendChild(codeElement);
        
        // Apply syntax highlighting if available
        if (typeof hljs !== 'undefined') {
            try {
                hljs.highlightElement(codeContent);
            } catch (e) {
                console.error('Error applying syntax highlighting:', e);
            }
        }
        
        return container;
    },
    
    // Sends code to the Code Module for editing without displaying system messages
    sendCodeToEditor: function(code, language) {
        try {
            if (window.Commands && window.Commands.canvasManager) {
                const cm = window.Commands.canvasManager;
                
                // Simply activate and display code without system message
                cm.activateModule('code');
                const codeModule = cm.getModule('code');
                
                if (codeModule && typeof codeModule.displayCode === 'function') {
                    codeModule.displayCode(code, language);
                    console.log("Code sent to editor");
                    
                    // No system message - this prevents the "Code sent to editor" message
                } else {
                    console.error("Code module or displayCode method not found");
                }
            } else {
                console.error("Canvas manager not available");
            }
        } catch (e) {
            console.error("Error sending code to editor:", e);
        }
    }
};

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for chat interface to be ready
    setTimeout(() => {
        ChatCodeHandler.init();
    }, 500);
});

// Export the module to window for external access
window.ChatCodeHandler = ChatCodeHandler;