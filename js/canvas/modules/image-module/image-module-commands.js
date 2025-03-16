/**
 * js/canvas/modules/image-module/image-module-commands.js
 * Image Module Command Handler
 *
 * Handles chat commands for the image module in the terminal chat interface,
 * similar to how code-module-commands.js works.
 */

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (window.Commands && window.Commands.canvasManager) {
            console.log("Registering image module commands...");
            
            extendImageCommands();
            addImageCommandSuggestions();
        }
    }, 800);
});

/**
 * Extend the command processor with image-specific commands.
 */
function extendImageCommands() {
    const originalProcessCommand = window.Commands.processCommand;
    
    // Replace the existing processCommand with our extended version
    window.Commands.processCommand = function(cmd) {
        const lowerCmd = cmd.toLowerCase().trim();
        
        // Helper: expand + activate image module.
        function expandAndActivateImage() {
            const cm = window.Commands.canvasManager;
            // Expand the canvas section
            cm.expandCanvasSection();
            // Activate the image module
            cm.activateModule('image');
            return cm.getModule('image');
        }
        
        // 1. "show image [url]" or "display image [url]"
        if (lowerCmd.startsWith('show image') || lowerCmd.startsWith('display image')) {
            try {
                const imageModule = expandAndActivateImage();
                
                // Extract URL after the word "image"
                let url = cmd.substring(cmd.indexOf('image') + 5).trim();
                if (!url) {
                    // If no URL, fallback to random image
                    imageModule.handleCommand('random');
                    return true;
                }
                
                // If user typed "show image random", call random command
                if (url === 'random') {
                    imageModule.handleCommand('random');
                    return true;
                }
                
                // Otherwise, display the specified URL
                imageModule.handleCommand('display', [url]);
                return true;
            } catch (e) {
                console.error('Error showing image:', e);
                if (typeof terminal !== 'undefined') {
                    terminal.addOutput(`[ERROR] Failed to show image: ${e.message}`);
                }
                return false;
            }
        }
        // 2. "random image"
        else if (lowerCmd === 'random image') {
            try {
                const imageModule = expandAndActivateImage();
                imageModule.handleCommand('random');
                return true;
            } catch (e) {
                console.error('Error showing random image:', e);
                return false;
            }
        }
        // 3. "zoom image [action]"
        else if (lowerCmd.startsWith('zoom image')) {
            try {
                const parts = lowerCmd.split(' ');
                // Expecting format "zoom image +" or "zoom image -" or "zoom image reset"
                const action = parts.length > 2 ? parts[2] : null;
                const imageModule = expandAndActivateImage();
                if (action) {
                    imageModule.handleCommand('zoom', [action]);
                } else {
                    if (typeof terminal !== 'undefined') {
                        terminal.addOutput('[INFO] Usage: zoom image + | - | reset');
                    }
                }
                return true;
            } catch (e) {
                console.error('Error zooming image:', e);
                return false;
            }
        }
        // 4. "image info" or "show image info"
        else if (lowerCmd === 'image info' || lowerCmd === 'show image info') {
            try {
                const imageModule = expandAndActivateImage();
                imageModule.handleCommand('info');
                return true;
            } catch (e) {
                console.error('Error showing image info:', e);
                return false;
            }
        }
        // 5. "image theme [dark|light|toggle]"
        else if (lowerCmd.startsWith('image theme')) {
            try {
                const cm = window.Commands.canvasManager;
                cm.expandCanvasSection();
                cm.activateModule('image');
                const imageModule = cm.getModule('image');
                
                // Extract the theme from the command; default is dark
                const parts = lowerCmd.split(' ');
                let theme = 'dark';
                if (parts.length > 2) {
                    theme = parts[2].trim();
                }
                imageModule.handleCommand('theme', [theme]);
                return true;
            } catch (e) {
                console.error('Error setting image theme:', e);
                return false;
            }
        }
        
        // Otherwise, fall back to the original processCommand function.
        return originalProcessCommand.call(window.Commands, cmd);
    };
}

/**
 * Add image command suggestions to the command suggestions UI.
 */
function addImageCommandSuggestions() {
    const suggestionsContainer = document.getElementById('command-suggestions');
    if (!suggestionsContainer) return;
    
    let hasImageSuggestion = false;
    Array.from(suggestionsContainer.children).forEach(child => {
        if (child.textContent.includes('show image') || child.textContent.includes('random image')) {
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
                chatInput.value = 'show image ';
                chatInput.focus();
            }
        });
        
        const randomImageSuggestion = document.createElement('span');
        randomImageSuggestion.className = 'command-suggestion';
        randomImageSuggestion.innerHTML = '<i class="fas fa-random"></i> random image';
        suggestionsContainer.appendChild(randomImageSuggestion);
        
        randomImageSuggestion.addEventListener('click', () => {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.value = 'random image';
                chatInput.focus();
            }
        });
    }
}
