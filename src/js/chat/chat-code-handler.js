/**
 * js/canvas/modules/code-module/chat-code-handler.js
 * Handles code detection, formatting, and interaction in the chat interface
 * 
 * This module adds code block detection and enhancement to chat messages,
 * including syntax highlighting and actions to interact with the code module.
 */

const ChatCodeHandler = {
    // A counter to assign unique IDs to each code block
    codeBlockCounter: 0,
    
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
    
    // Extend the chat interface by overriding message creation methods
    extendChatInterface: function() {
        // Store original addSystemMessage function
        const originalAddSystemMessage = window.ChatInterface.addSystemMessage;
        
        // Override addSystemMessage to enhance messages
        window.ChatInterface.addSystemMessage = function(text) {
            const messageDiv = originalAddSystemMessage.call(this, text);
            ChatCodeHandler.enhanceMessageWithCodeDetection(messageDiv);
            return messageDiv;
        };
        
        // Similarly override addUserMessage
        const originalAddUserMessage = window.ChatInterface.addUserMessage;
        window.ChatInterface.addUserMessage = function(text) {
            originalAddUserMessage.call(this, text);
            const messageDiv = this.chatMessages.lastElementChild;
            ChatCodeHandler.enhanceMessageWithCodeDetection(messageDiv);
        };
    },
    
    // Add code-related command suggestions to the UI
    addCommandSuggestions: function() {
        setTimeout(() => {
            const suggestionsContainer = document.getElementById('command-suggestions');
            if (!suggestionsContainer) return;
            
            let hasFormatCodeSuggestion = false;
            Array.from(suggestionsContainer.children).forEach(child => {
                if (child.textContent.includes('format code')) {
                    hasFormatCodeSuggestion = true;
                }
            });
            
            if (!hasFormatCodeSuggestion) {
                const formatCodeSuggestion = document.createElement('span');
                formatCodeSuggestion.className = 'command-suggestion';
                formatCodeSuggestion.innerHTML = '<i class="fas fa-code"></i> format code';
                suggestionsContainer.appendChild(formatCodeSuggestion);
                
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
    
    // Set up event listeners for code detection before sending messages
    setupCodeDetection: function() {
        setTimeout(() => {
            const sendButton = document.getElementById('chat-send');
            if (!sendButton) return;
            
            const originalClickHandler = sendButton.onclick;
            
            sendButton.onclick = function(event) {
                const chatInput = document.getElementById('chat-input');
                if (chatInput) {
                    ChatCodeHandler.checkAndOfferFormatting(chatInput);
                }
                
                if (originalClickHandler) {
                    originalClickHandler.call(this, event);
                }
            };
        }, 800);
    },
    
    // Check the chat input for code-like content and offer formatting
    checkAndOfferFormatting: function(inputElement) {
        if (!inputElement || !inputElement.value) return;
        
        const text = inputElement.value.trim();
        if (text.length === 0 || /```/.test(text)) return;
        
        const codeSignatures = /function|class|const|let|var|if|for|while|\{|\}|==|=>|console\.log|import|export|return/i;
        if (codeSignatures.test(text)) {
            if (text.split('\n').length > 1 || text.length > 50) {
                const wantsToFormat = confirm("This looks like code. Format it with syntax highlighting?");
                if (wantsToFormat) {
                    let language = "javascript"; // Default
                    
                    if (/def |import |if __name__ ==|class .*\(.*\):|print\(/.test(text)) {
                        language = "python";
                    } else if (/<html|<body|<div|<p>|<script/.test(text)) {
                        language = "html";
                    } else if (/{[\s\S]*?}/.test(text) && /body|margin|padding|color|font-size/.test(text)) {
                        language = "css";
                    }
                    
                    inputElement.value = "```" + language + "\n" + text + "\n```";
                }
            }
        }
    },
    
    // Format the chat input's code if not already formatted
    formatCodeInInput: function(inputElement) {
        if (!inputElement) return;
        
        const text = inputElement.value.trim();
        if (text.length === 0) return;
        
        if (!text.startsWith('```') && !text.endsWith('```')) {
            let language = "javascript";
            
            if (/def |import |if __name__ ==|class .*\(.*\):|print\(/.test(text)) {
                language = "python";
            } else if (/<html|<body|<div|<p>|<script/.test(text)) {
                language = "html";
            } else if (/{[\s\S]*?}/.test(text) && /body|margin|padding|color|font-size/.test(text)) {
                language = "css";
            }
            
            inputElement.value = "```" + language + "\n" + text + "\n```";
        }
    },
    
    // Enhance a chat message by detecting and replacing code blocks with enhanced ones
    enhanceMessageWithCodeDetection: function(messageDiv) {
        if (!messageDiv) return;
        
        const messageText = messageDiv.querySelector('.message-text');
        if (!messageText) return;
        
        const codeBlockRegex = /```(?:([\w-]+)\n)?([\s\S]*?)```/g;
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;
        let hasCodeBlock = false;
        const originalText = messageText.innerHTML;
        
        while ((match = codeBlockRegex.exec(originalText)) !== null) {
            hasCodeBlock = true;
            const textBeforeMatch = originalText.substring(lastIndex, match.index);
            const textNode = document.createElement('div');
            textNode.innerHTML = textBeforeMatch;
            fragment.appendChild(textNode);
            
            const language = match[1] || 'javascript';
            const code = match[2].trim();
            
            const codeBlock = this.createEnhancedCodeBlock(code, language);
            fragment.appendChild(codeBlock);
            
            lastIndex = match.index + match[0].length;
        }
        
        if (!hasCodeBlock) return;
        
        if (lastIndex < originalText.length) {
            const textNode = document.createElement('div');
            textNode.innerHTML = originalText.substring(lastIndex);
            fragment.appendChild(textNode);
        }
        
        messageText.innerHTML = '';
        messageText.appendChild(fragment);
    },
    
    // Create an enhanced code block with a unique id, syntax highlighting, and action buttons
    createEnhancedCodeBlock: function(code, language) {
        this.codeBlockCounter++;
        const uniqueId = 'code-block-' + this.codeBlockCounter;
        
        const container = document.createElement('div');
        container.className = 'code-block-container';
        container.id = uniqueId;
        
        const header = document.createElement('div');
        header.className = 'code-block-header';
        
        const langLabel = document.createElement('span');
        langLabel.textContent = language;
        header.appendChild(langLabel);
        
        const actions = document.createElement('div');
        actions.className = 'code-block-actions';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'terminal-button';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.title = 'Copy code';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(code)
                .then(() => {
                    const originalHTML = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHTML;
                        copyBtn.classList.remove('copied');
                    }, 1000);
                })
                .catch(err => {
                    console.error('Could not copy code: ', err);
                });
        });
        
        const sendToEditorBtn = document.createElement('button');
        sendToEditorBtn.className = 'terminal-button';
        sendToEditorBtn.innerHTML = '<i class="fas fa-code"></i> Edit';
        sendToEditorBtn.title = 'Send to Code Editor';
        sendToEditorBtn.addEventListener('click', () => {
            this.sendCodeToEditor(code, language);
        });
        
        actions.appendChild(copyBtn);
        actions.appendChild(sendToEditorBtn);
        header.appendChild(actions);
        container.appendChild(header);
        
        const pre = document.createElement('pre');
        const codeContent = document.createElement('code');
        codeContent.className = language;
        codeContent.textContent = code;
        pre.appendChild(codeContent);
        container.appendChild(pre);
        
        if (typeof hljs !== 'undefined') {
            try {
                hljs.highlightElement(codeContent);
            } catch (e) {
                console.error('Error applying syntax highlighting:', e);
            }
        }
        
        return container;
    },
    
    // Sends code to the Code Module for editing
    sendCodeToEditor: function(code, language) {
        try {
            if (window.Commands && window.Commands.canvasManager) {
                const cm = window.Commands.canvasManager;
                cm.activateModule('code');
                const codeModule = cm.getModule('code');
                if (codeModule && typeof codeModule.displayCode === 'function') {
                    codeModule.displayCode(code, language);
                    console.log("Code sent to editor");
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
    setTimeout(() => {
        ChatCodeHandler.init();
    }, 500);
});

// Expose the module globally
window.ChatCodeHandler = ChatCodeHandler;