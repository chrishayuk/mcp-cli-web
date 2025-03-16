/**
 * js/canvas/modules/code-module/code-module-commands.js
 * Code Module Command Handler
 * 
 * Handles chat commands for the code module in the terminal chat interface.
 * This script integrates with your existing command processor and chat interface.
 */

// Register commands when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for everything else to load
    setTimeout(function() {
        if (window.Commands && window.Commands.canvasManager) {
            console.log("Registering code module commands...");
            
            // Extend the command processor with code-specific commands
            extendCommandProcessor();
            
            // Add code suggestion to command suggestions
            addCodeCommandSuggestions();
        }
    }, 800);
});

/**
 * Extend the command processor with code-specific commands
 */
function extendCommandProcessor() {
    // Store original processCommand function
    const originalProcessCommand = window.Commands.processCommand;
    
    // Replace with extended version
    window.Commands.processCommand = function(cmd) {
        const lowerCmd = cmd.toLowerCase().trim();
        
        // Helper: expand + activate code
        function expandAndActivateCode() {
            const cm = window.Commands.canvasManager;
            // Explicitly expand the canvas (remove if you prefer manual control)
            cm.expandCanvasSection();
            // Now activate the code module
            cm.activateModule('code');
            return cm.getModule('code');
        }
        
        // 1. "display code" or "code" command
        if (lowerCmd.startsWith('display code') || lowerCmd === 'display code' || lowerCmd === 'code' || lowerCmd.startsWith('code ')) {
            try {
                const codeModule = expandAndActivateCode();
                
                // Extract code after the command if present
                let code = '';
                const cmdPrefix = lowerCmd.startsWith('display code') ? 'display code' : 'code';
                if (cmd.length > cmdPrefix.length) {
                    code = cmd.substring(cmdPrefix.length).trim();
                }
                
                // If no code was provided, use a default sample
                if (!code) {
                    code = `// Sample code
function helloWorld() {
  console.log("Hello, Terminal Canvas!");
  return "Code execution complete";
}

helloWorld();`;
                }
                
                // Extract language if specified (format: "display code language:python\nrest of code")
                let language = 'javascript'; // Default
                if (code.startsWith('language:')) {
                    const firstLineBreak = code.indexOf('\n');
                    if (firstLineBreak > 0) {
                        language = code.substring('language:'.length, firstLineBreak).trim().toLowerCase();
                        code = code.substring(firstLineBreak + 1);
                    }
                }
                
                // Display the code with the chosen language
                codeModule.handleCommand('display', [code, language]);
                return true;
            } catch (e) {
                console.error('Error handling code command:', e);
                if (typeof terminal !== 'undefined') {
                    terminal.addOutput(`[ERROR] Failed to display code: ${e.message}`);
                }
                return false;
            }
        }
        
        // 2. "run code" command
        else if (lowerCmd.startsWith('run code') || lowerCmd === 'run code') {
            try {
                const cm = window.Commands.canvasManager;
                const codeModule = cm.getModule('code');
                
                // Expand & activate if needed
                if (!codeModule || !codeModule.isActive) {
                    cm.expandCanvasSection();
                    cm.activateModule('code');
                }
                
                codeModule.handleCommand('run');
                return true;
            } catch (e) {
                console.error('Error running code:', e);
                if (typeof terminal !== 'undefined') {
                    terminal.addOutput(`[ERROR] Failed to run code: ${e.message}`);
                }
                return false;
            }
        }
        
        // 3. "code theme" or "set code theme"
        else if (lowerCmd.startsWith('code theme') || lowerCmd.startsWith('set code theme')) {
            try {
                const cm = window.Commands.canvasManager;
                // Expand + activate
                cm.expandCanvasSection();
                cm.activateModule('code');
                
                const codeModule = cm.getModule('code');
                
                // Extract theme name
                let theme = 'dark'; // Default
                if (lowerCmd.includes('light')) {
                    theme = 'light';
                } else if (lowerCmd.includes('dark')) {
                    theme = 'dark';
                }
                
                codeModule.handleCommand('theme', [theme]);
                return true;
            } catch (e) {
                console.error('Error setting code theme:', e);
                return false;
            }
        }
        
        // 4. "toggle line numbers"
        else if (lowerCmd.includes('toggle line numbers') || lowerCmd.includes('line numbers')) {
            try {
                const cm = window.Commands.canvasManager;
                // Expand + activate
                cm.expandCanvasSection();
                cm.activateModule('code');
                
                const codeModule = cm.getModule('code');
                codeModule.handleCommand('toggleLineNumbers');
                return true;
            } catch (e) {
                console.error('Error toggling line numbers:', e);
                return false;
            }
        }
        
        // 5. "toggle editor", "collapse editor", or "expand editor"
        else if (lowerCmd.includes('toggle editor') || lowerCmd === 'collapse editor' || lowerCmd === 'expand editor') {
            try {
                const cm = window.Commands.canvasManager;
                cm.expandCanvasSection();
                cm.activateModule('code');
                
                const codeModule = cm.getModule('code');
                codeModule.handleCommand('toggleEditor');
                return true;
            } catch (e) {
                console.error('Error toggling editor panel:', e);
                return false;
            }
        }
        
        // 6. "toggle results", "collapse results", or "expand results"
        else if (lowerCmd.includes('toggle results') || lowerCmd === 'collapse results' || lowerCmd === 'expand results') {
            try {
                const cm = window.Commands.canvasManager;
                cm.expandCanvasSection();
                cm.activateModule('code');
                
                const codeModule = cm.getModule('code');
                codeModule.handleCommand('toggleResults');
                return true;
            } catch (e) {
                console.error('Error toggling results panel:', e);
                return false;
            }
        }
        
        // 7. "set language" or "code language"
        else if (lowerCmd.startsWith('set language') || lowerCmd.startsWith('code language')) {
            try {
                const cm = window.Commands.canvasManager;
                cm.expandCanvasSection();
                cm.activateModule('code');
                
                const codeModule = cm.getModule('code');
                
                // Extract language from the command
                let language = 'javascript'; // default
                const parts = lowerCmd.split(' ');
                if (parts.length > 2) {
                    language = parts[parts.length - 1].trim();
                }
                
                codeModule.handleCommand('language', [language]);
                return true;
            } catch (e) {
                console.error('Error setting code language:', e);
                return false;
            }
        }
        
        // Fall back to original command processor
        return originalProcessCommand.call(window.Commands, cmd);
    };
}

/**
 * Add code module suggestions to the command suggestions UI
 */
function addCodeCommandSuggestions() {
    const suggestionsContainer = document.getElementById('command-suggestions');
    if (!suggestionsContainer) return;
    
    // Check if code suggestion already exists
    let hasCodeSuggestion = false;
    Array.from(suggestionsContainer.children).forEach(child => {
        if (child.textContent.includes('code') || child.textContent.includes('display code')) {
            hasCodeSuggestion = true;
        }
    });
    
    // Only add if it doesn't exist
    if (!hasCodeSuggestion) {
        const codeSuggestion = document.createElement('span');
        codeSuggestion.className = 'command-suggestion';
        codeSuggestion.innerHTML = '<i class="fas fa-code"></i> display code';
        suggestionsContainer.appendChild(codeSuggestion);
        
        // Add click event listener
        codeSuggestion.addEventListener('click', () => {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.value = 'display code';
                chatInput.focus();
            }
        });
        
        // Add another command suggestion for running code
        const runCodeSuggestion = document.createElement('span');
        runCodeSuggestion.className = 'command-suggestion';
        runCodeSuggestion.innerHTML = '<i class="fas fa-play"></i> run code';
        suggestionsContainer.appendChild(runCodeSuggestion);
        
        runCodeSuggestion.addEventListener('click', () => {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.value = 'run code';
                chatInput.focus();
            }
        });
    }
}

/**
 * Utility function to check if code module is registered and working
 * Can be called from the console for debugging
 */
window.debugCodeModule = function() {
    console.log("=== CODE MODULE DEBUG ===");
    
    if (!window.Commands || !window.Commands.canvasManager) {
        console.error("Canvas Manager not available");
        return false;
    }
    
    const cm = window.Commands.canvasManager;
    console.log("Available modules:", Object.keys(cm.modules || {}));
    
    const codeModule = cm.getModule('code');
    if (!codeModule) {
        console.error("Code module not found in canvas manager");
        return false;
    }
    
    console.log("Code module properties:", Object.getOwnPropertyNames(codeModule));
    console.log("Code module language:", codeModule.language);
    console.log("Code module isActive:", codeModule.isActive);
    
    // Test basic methods
    console.log("Testing code module methods:");
    if (typeof codeModule.displayCode === 'function') {
        console.log("displayCode() method exists");
    } else {
        console.error("displayCode() method missing");
    }
    
    if (typeof codeModule.render === 'function') {
        console.log("render() method exists");
    } else {
        console.error("render() method missing");
    }
    
    console.log("=== END CODE MODULE DEBUG ===");
    return true;
};
