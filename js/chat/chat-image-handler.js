/**
 * chat-image-handler.js
 * Handles image detection and display in the chat interface
 * 
 * This module adds image detection and enhancement to chat messages,
 * including display of images directly in chat bubbles with action buttons
 */

// Define a self-contained module for image handling in chat
const ChatImageHandler = (function() {
    // Create a module with private variables
    const module = {};
    
    // Maximum dimensions for chat images
    module.MAX_WIDTH = 300;
    module.MAX_HEIGHT = 200;
    
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
                // Just display the image without the URL text
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
                // Just display the image without the URL text
                const messageDiv = this.createBlankUserMessage();
                ChatImageHandler.enhanceMessageWithImageOnly(messageDiv, urlOnly);
                return messageDiv;
            }
            
            // Call the original function
            originalAddUserMessage.call(this, text);
            
            // Get the last message which would be the one we just added
            const messageDiv = this.chatMessages.lastElementChild;
            
            // Process the message to detect images
            ChatImageHandler.enhanceMessageWithImageDetection(messageDiv);
        };
        
        // Add helper method for creating a blank system message
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
        
        // Add helper method for creating a blank user message
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
            
            // Image extensions we recognize
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
            
            // Check if it's a URL
            if (text.startsWith('http') && 
                (imageExtensions.some(ext => text.toLowerCase().endsWith(ext)) || 
                 text.includes('unsplash.com/photo') ||
                 text.includes('images.unsplash.com') ||
                 text.includes('placehold.co'))) {
                return text;
            }
            
            // Check if it's markdown image notation
            const mdMatch = text.match(/^!\[.*?\]\((https?:\/\/[^\s]+)\)$/);
            if (mdMatch && mdMatch[1]) {
                return mdMatch[1];
            }
            
            // Not just an image
            return null;
        }
    };
    
    // Add image-related command suggestions to the UI
    module.addCommandSuggestions = function() {
        setTimeout(() => {
            const suggestionsContainer = document.getElementById('command-suggestions');
            if (!suggestionsContainer) return;
            
            // Check if image suggestion already exists
            let hasImageSuggestion = false;
            Array.from(suggestionsContainer.children).forEach(child => {
                if (child.textContent.includes('show image')) {
                    hasImageSuggestion = true;
                }
            });
            
            // Only add if it doesn't exist
            if (!hasImageSuggestion) {
                const showImageSuggestion = document.createElement('span');
                showImageSuggestion.className = 'command-suggestion';
                showImageSuggestion.innerHTML = '<i class="fas fa-image"></i> show image';
                suggestionsContainer.appendChild(showImageSuggestion);
                
                // Add click event listener
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
        messageText.appendChild(imageBlock);
    };
    
    // Detect and enhance images in a message
    module.enhanceMessageWithImageDetection = function(messageDiv) {
        if (!messageDiv) return;
        
        const messageText = messageDiv.querySelector('.message-text');
        if (!messageText) return;
        
        // Get the original text content
        const originalText = messageText.innerHTML;
        
        // Check for image patterns
        const urls = this.extractImageUrls(originalText);
        
        if (urls.length === 0) {
            return; // No image URLs found
        }
        
        // Process for "test image" command
        if (originalText.includes('test') && originalText.includes('image')) {
            // Special processing for test image commands - clean text
            const imgHeader = originalText.replace(/https?:\/\/[^\s]+/, '');
            const cleanedText = imgHeader.replace(/(Here's a test.*?format):.*$/s, '$1');
            
            // Create a document fragment
            const fragment = document.createDocumentFragment();
            
            // Add the cleaned text
            const textNode = document.createElement('div');
            textNode.innerHTML = cleanedText;
            fragment.appendChild(textNode);
            
            // Add each image
            urls.forEach(url => {
                const imageBlock = this.createEnhancedImageBlock(url);
                fragment.appendChild(imageBlock);
            });
            
            // Replace the message text content
            messageText.innerHTML = '';
            messageText.appendChild(fragment);
            return;
        }
        
        // Create a document fragment to build the new content
        const fragment = document.createDocumentFragment();
        
        // For regular messages, keep original text but remove URLs
        const textWithoutUrls = originalText;
        const textNode = document.createElement('div');
        textNode.innerHTML = textWithoutUrls;
        fragment.appendChild(textNode);
        
        // Add each image
        urls.forEach(url => {
            const imageBlock = this.createEnhancedImageBlock(url);
            fragment.appendChild(imageBlock);
        });
        
        // Replace the message text content with our enhanced version
        messageText.innerHTML = '';
        messageText.appendChild(fragment);
    };
    
    // Extract image URLs from text
    module.extractImageUrls = function(text) {
        const urls = [];
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
        
        // Extract URLs from plain text
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        let match;
        while ((match = urlRegex.exec(text)) !== null) {
            const url = match[1];
            // Check if URL ends with an image extension or contains image-specific patterns
            if (imageExtensions.some(ext => url.toLowerCase().endsWith(ext)) || 
                url.includes('unsplash.com/photo') ||
                url.includes('images.unsplash.com') ||
                url.includes('placehold.co')) {
                
                // Clean up URL by removing any closing punctuation
                let cleanUrl = url.replace(/[,\.;\)]+$/, '');
                
                // If URL is already in an HTML tag, extract it
                if (cleanUrl.includes('src="')) {
                    const srcMatch = cleanUrl.match(/src="([^"]+)"/);
                    if (srcMatch && srcMatch[1]) {
                        cleanUrl = srcMatch[1];
                    }
                }
                
                urls.push(cleanUrl);
            }
        }
        
        // Extract URLs from Markdown syntax: ![alt](url)
        const markdownRegex = /!\[.*?\]\((.*?)\)/g;
        while ((match = markdownRegex.exec(text)) !== null) {
            urls.push(match[1]);
        }
        
        // Extract URLs from "show image URL" commands
        const commandRegex = /^show image (.+?)$/im;
        match = commandRegex.exec(text);
        if (match && match[1]) {
            urls.push(match[1]);
        }
        
        return urls;
    };
    
    // Create an enhanced image block with the image and action buttons
    module.createEnhancedImageBlock = function(imageUrl) {
        // Create container for image block
        const container = document.createElement('div');
        container.className = 'image-block-container';
        
        // Create image header with actions
        const header = document.createElement('div');
        header.className = 'image-block-header';
        
        // Add image label
        const imageLabel = document.createElement('span');
        imageLabel.textContent = 'Image';
        header.appendChild(imageLabel);
        
        // Add actions container
        const actions = document.createElement('div');
        actions.className = 'image-block-actions';
        
        // Add view in canvas button
        const viewInCanvasBtn = document.createElement('button');
        viewInCanvasBtn.className = 'terminal-button';
        viewInCanvasBtn.innerHTML = '<i class="fas fa-expand"></i>';
        viewInCanvasBtn.title = 'View in Canvas';
        
        // Add event listener to send image to canvas
        viewInCanvasBtn.addEventListener('click', () => {
            this.sendImageToCanvas(imageUrl);
        });
        
        // Add open in new tab button
        const openInTabBtn = document.createElement('button');
        openInTabBtn.className = 'terminal-button';
        openInTabBtn.innerHTML = '<i class="fas fa-external-link-alt"></i>';
        openInTabBtn.title = 'Open in New Tab';
        
        // Add event listener to open in new tab
        openInTabBtn.addEventListener('click', () => {
            window.open(imageUrl, '_blank');
        });
        
        // Add buttons to actions
        actions.appendChild(openInTabBtn);
        actions.appendChild(viewInCanvasBtn);
        header.appendChild(actions);
        
        // Add header to container
        container.appendChild(header);
        
        // Create image content container (for proper sizing)
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-block-content';
        
        // Create image element
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Chat image';
        
        // Add loading and error handling
        img.addEventListener('load', () => {
            console.log(`Image loaded: ${imageUrl}`);
        });
        
        img.addEventListener('error', () => {
            console.error(`Failed to load image: ${imageUrl}`);
            img.style.display = 'none';
            
            // Create error message
            const errorMsg = document.createElement('div');
            errorMsg.className = 'image-block-error';
            errorMsg.textContent = 'Failed to load image';
            imageContainer.appendChild(errorMsg);
        });
        
        // Add image to container
        imageContainer.appendChild(img);
        container.appendChild(imageContainer);
        
        // Add URL caption
        const caption = document.createElement('div');
        caption.className = 'image-block-caption';
        
        // Create link element
        const link = document.createElement('a');
        link.href = imageUrl;
        link.textContent = imageUrl;
        link.target = '_blank';
        
        caption.appendChild(link);
        container.appendChild(caption);
        
        return container;
    };
    
    // Sends image to the Canvas for display without showing system messages
    module.sendImageToCanvas = function(imageUrl) {
        try {
            if (window.Commands && window.Commands.canvasManager) {
                const cm = window.Commands.canvasManager;
                
                // Silently activate image module
                cm.activateModule('image');
                const imageModule = cm.getModule('image');
                
                if (imageModule) {
                    // Display the image
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
    // Wait for chat interface to be ready
    setTimeout(() => {
        ChatImageHandler.init();
    }, 500);
});

// Export the module to window for external access
window.ChatImageHandler = ChatImageHandler;