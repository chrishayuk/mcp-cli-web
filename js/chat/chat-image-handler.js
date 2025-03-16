/**
 * js/canvas/modules/image-module/chat-image-handler.js
 * Handles image detection and display in the chat interface
 * 
 * This module adds image detection and enhancement to chat messages,
 * including display of images directly in chat bubbles with action buttons.
 */

const ChatImageHandler = (function() {
    // Create a module object with a counter for unique image block IDs.
    const module = {};
    
    // Maximum dimensions for chat images (if needed for resizing)
    module.MAX_WIDTH = 300;
    module.MAX_HEIGHT = 200;
    
    // Counter for unique image block IDs
    module.imageBlockCounter = 0;
    
    // Initialize the image handler
    module.init = function() {
        if (!window.ChatInterface) {
            console.error("Chat interface not found. Image handler will not initialize.");
            return false;
        }
        
        // Extend the chat interface with image handling
        this.extendChatInterface();
        
        // Add command suggestions
        this.addCommandSuggestions();
        
        console.log("Chat image handler initialized");
        return true;
    };
    
    // Extend the chat interface with image handling
    module.extendChatInterface = function() {
        // Store original addSystemMessage function
        const originalAddSystemMessage = window.ChatInterface.addSystemMessage;
        
        // Override addSystemMessage
        window.ChatInterface.addSystemMessage = function(text) {
            // Skip URL text if it's just an image
            const urlOnly = isJustImageUrl(text);
            if (urlOnly) {
                // Create a blank system message and enhance it with the image only
                const messageDiv = this.createBlankSystemMessage();
                ChatImageHandler.enhanceMessageWithImageOnly(messageDiv, urlOnly);
                return messageDiv;
            }
            
            // Call the original function to create the message
            const messageDiv = originalAddSystemMessage.call(this, text);
            
            // Process the message to detect and enhance images
            ChatImageHandler.enhanceMessageWithImageDetection(messageDiv);
            
            return messageDiv;
        };
        
        // Store and override addUserMessage function
        const originalAddUserMessage = window.ChatInterface.addUserMessage;
        window.ChatInterface.addUserMessage = function(text) {
            // Skip URL text if it's just an image
            const urlOnly = isJustImageUrl(text);
            if (urlOnly) {
                // Create a blank user message and enhance it with the image only
                const messageDiv = this.createBlankUserMessage();
                ChatImageHandler.enhanceMessageWithImageOnly(messageDiv, urlOnly);
                return messageDiv;
            }
            
            // Call the original function
            originalAddUserMessage.call(this, text);
            
            // Get the last message (the one just added)
            const messageDiv = this.chatMessages.lastElementChild;
            
            // Process the message to detect images
            ChatImageHandler.enhanceMessageWithImageDetection(messageDiv);
        };
        
        // Helper method for creating a blank system message
        window.ChatInterface.createBlankSystemMessage = function() {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message system-message';
            messageDiv.innerHTML = `
                <div class="message-avatar system-avatar">
                    <i class="fas fa-desktop"></i>
                </div>
                <div class="message-content system-content">
                    <div class="message-text"></div>
                    <div class="message-time">${time}</div>
                </div>
            `;
            this.chatMessages.appendChild(messageDiv);
            this.scrollToBottom();
            return messageDiv;
        };
        
        // Helper method for creating a blank user message
        window.ChatInterface.createBlankUserMessage = function() {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message user-message';
            messageDiv.innerHTML = `
                <div class="message-avatar user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="message-content user-content">
                    <div class="message-text"></div>
                    <div class="message-time">${time}</div>
                </div>
            `;
            this.chatMessages.appendChild(messageDiv);
            this.scrollToBottom();
            return messageDiv;
        };
        
        // Helper to check if text is just an image URL
        function isJustImageUrl(text) {
            text = text.trim();
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
            if (text.startsWith('http') &&
                (imageExtensions.some(ext => text.toLowerCase().endsWith(ext)) ||
                 text.includes('unsplash.com/photo') ||
                 text.includes('images.unsplash.com') ||
                 text.includes('placehold.co'))) {
                return text;
            }
            const mdMatch = text.match(/^!\[.*?\]\((https?:\/\/[^\s]+)\)$/);
            if (mdMatch && mdMatch[1]) {
                return mdMatch[1];
            }
            return null;
        }
    };
    
    // Add image-related command suggestions to the UI
    module.addCommandSuggestions = function() {
        setTimeout(() => {
            const suggestionsContainer = document.getElementById('command-suggestions');
            if (!suggestionsContainer) return;
            
            let hasImageSuggestion = false;
            Array.from(suggestionsContainer.children).forEach(child => {
                if (child.textContent.includes('show image')) {
                    hasImageSuggestion = true;
                }
            });
            
            if (!hasImageSuggestion) {
                const showImageSuggestion = document.createElement('span');
                showImageSuggestion.className = 'command-suggestion';
                showImageSuggestion.innerHTML = '<i class="fas fa-image"></i> show image';
                suggestionsContainer.appendChild(showImageSuggestion);
                
                showImageSuggestion.addEventListener('click', () => {
                    const chatInput = document.getElementById('chat-input');
                    if (chatInput) {
                        chatInput.value = 'show image';
                        chatInput.focus();
                    }
                });
            }
        }, 800);
    };
    
    // Add only an image to a message
    module.enhanceMessageWithImageOnly = function(messageDiv, imageUrl) {
        if (!messageDiv) return;
        const messageText = messageDiv.querySelector('.message-text');
        if (!messageText) return;
        
        const imageBlock = this.createEnhancedImageBlock(imageUrl);
        messageText.innerHTML = '';
        messageText.appendChild(imageBlock);
    };
    
    // Detect and enhance images in a message
    module.enhanceMessageWithImageDetection = function(messageDiv) {
        if (!messageDiv) return;
        const messageText = messageDiv.querySelector('.message-text');
        if (!messageText) return;
        
        const originalText = messageText.innerHTML;
        const urls = this.extractImageUrls(originalText);
        if (urls.length === 0) return;
        
        // Build a document fragment containing the original text and image blocks
        const fragment = document.createDocumentFragment();
        const textNode = document.createElement('div');
        textNode.innerHTML = originalText;
        fragment.appendChild(textNode);
        
        urls.forEach(url => {
            const imageBlock = this.createEnhancedImageBlock(url);
            fragment.appendChild(imageBlock);
        });
        
        messageText.innerHTML = '';
        messageText.appendChild(fragment);
    };
    
    // Extract image URLs from text
    module.extractImageUrls = function(text) {
        const urls = [];
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
        
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        let match;
        while ((match = urlRegex.exec(text)) !== null) {
            const url = match[1];
            if (imageExtensions.some(ext => url.toLowerCase().endsWith(ext)) ||
                url.includes('unsplash.com/photo') ||
                url.includes('images.unsplash.com') ||
                url.includes('placehold.co')) {
                let cleanUrl = url.replace(/[,\.;\)]+$/, '');
                urls.push(cleanUrl);
            }
        }
        
        const mdRegex = /!\[.*?\]\((.*?)\)/g;
        while ((match = mdRegex.exec(text)) !== null) {
            urls.push(match[1]);
        }
        
        const commandRegex = /^show image (.+?)$/im;
        match = commandRegex.exec(text);
        if (match && match[1]) {
            urls.push(match[1]);
        }
        
        return urls;
    };
    
    // Create an enhanced image block with a unique id, action buttons, and a caption
    module.createEnhancedImageBlock = function(imageUrl) {
        // Increment counter and generate unique id
        this.imageBlockCounter++;
        const uniqueId = 'image-block-' + this.imageBlockCounter;
        
        const container = document.createElement('div');
        container.className = 'image-block-container';
        container.id = uniqueId;
        
        const header = document.createElement('div');
        header.className = 'image-block-header';
        
        const imageLabel = document.createElement('span');
        imageLabel.textContent = 'Image';
        header.appendChild(imageLabel);
        
        const actions = document.createElement('div');
        actions.className = 'image-block-actions';
        
        const openInTabBtn = document.createElement('button');
        openInTabBtn.className = 'terminal-button';
        openInTabBtn.innerHTML = '<i class="fas fa-external-link-alt"></i>';
        openInTabBtn.title = 'Open in New Tab';
        openInTabBtn.addEventListener('click', () => {
            window.open(imageUrl, '_blank');
        });
        
        const viewInCanvasBtn = document.createElement('button');
        viewInCanvasBtn.className = 'terminal-button';
        viewInCanvasBtn.innerHTML = '<i class="fas fa-expand"></i>';
        viewInCanvasBtn.title = 'View in Canvas';
        viewInCanvasBtn.addEventListener('click', () => {
            this.sendImageToCanvas(imageUrl);
        });
        
        actions.appendChild(openInTabBtn);
        actions.appendChild(viewInCanvasBtn);
        header.appendChild(actions);
        container.appendChild(header);
        
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-block-content';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Chat image';
        
        img.addEventListener('load', () => {
            console.log(`Image loaded: ${imageUrl}`);
        });
        
        img.addEventListener('error', () => {
            console.error(`Failed to load image: ${imageUrl}`);
            img.style.display = 'none';
            const errorMsg = document.createElement('div');
            errorMsg.className = 'image-block-error';
            errorMsg.textContent = 'Failed to load image';
            imageContainer.appendChild(errorMsg);
        });
        
        imageContainer.appendChild(img);
        container.appendChild(imageContainer);
        
        const caption = document.createElement('div');
        caption.className = 'image-block-caption';
        
        const link = document.createElement('a');
        link.href = imageUrl;
        link.textContent = imageUrl;
        link.target = '_blank';
        
        caption.appendChild(link);
        container.appendChild(caption);
        
        return container;
    };
    
    // Sends image to the canvas for display
    module.sendImageToCanvas = function(imageUrl) {
        try {
            if (window.Commands && window.Commands.canvasManager) {
                const cm = window.Commands.canvasManager;
                cm.activateModule('image');
                const imageModule = cm.getModule('image');
                if (imageModule) {
                    if (typeof imageModule.displayImage === 'function') {
                        imageModule.displayImage(imageUrl);
                        console.log("Image sent to canvas:", imageUrl);
                    } else if (typeof imageModule.handleCommand === 'function') {
                        imageModule.handleCommand('display', [imageUrl]);
                        console.log("Image sent to canvas via command:", imageUrl);
                    } else {
                        console.error("No suitable method found to display image");
                    }
                } else {
                    console.error("Image module not found");
                }
            } else {
                console.error("Canvas manager not available");
            }
        } catch (e) {
            console.error("Error sending image to canvas:", e);
        }
    };
    
    return module;
})();

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        ChatImageHandler.init();
    }, 500);
});

// Export the module to window for external access
window.ChatImageHandler = ChatImageHandler;