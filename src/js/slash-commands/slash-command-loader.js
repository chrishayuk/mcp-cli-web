/**
 * js/slash-commands/slash-command-loader.js
 * Loader Script for Slash Command System
 * 
 * This script dynamically loads all slash command components in the correct order
 * Include this script in your HTML to set up the entire slash command system
 */

(function() {
    console.log("Loading slash command system...");
    
    // Configuration - paths to all slash command scripts
    const scripts = [
        // Core components (load in order)
        'js/slash-commands/slash-command-core.js',         // Core registry
        'js/slash-commands/slash-command-ui.js',           // UI components
        'js/slash-commands/slash-command-module-connector.js', // Module connector
        
        // Module-specific slash commands
        'js/slash-commands/openai-slash-commands.js',      // OpenAI commands
        
        // Debug utilities (load last)
        'js/slash-commands/slash-command-debug.js',        // Debug utilities
        
        // Initializer (load after all components)
        'js/slash-commands/slash-command-init.js'          // Main initializer
    ];
    
    // Keep track of loaded scripts
    let loadedCount = 0;
    const scriptStatus = {};
    
    /**
     * Load a script dynamically
     * @param {string} src - Script source URL
     * @param {Function} callback - Callback function when script loads
     */
    function loadScript(src, callback) {
        console.log(`Loading script: ${src}`);
        
        // Check if script is already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
            console.log(`Script already loaded: ${src}`);
            callback(true);
            return;
        }
        
        // Create script element
        const script = document.createElement('script');
        script.src = src;
        script.async = false; // Maintain order
        
        // Set up callbacks
        script.onload = function() {
            console.log(`Script loaded: ${src}`);
            scriptStatus[src] = 'loaded';
            callback(true);
        };
        
        script.onerror = function(e) {
            console.error(`Failed to load script: ${src}`, e);
            scriptStatus[src] = 'error';
            callback(false);
        };
        
        // Add to document
        document.head.appendChild(script);
    }
    
    /**
     * Load scripts in order
     * @param {Array} scriptUrls - Array of script URLs
     * @param {number} index - Current index to load
     */
    function loadScriptsSequentially(scriptUrls, index = 0) {
        if (index >= scriptUrls.length) {
            console.log("All slash command scripts loaded!");
            return;
        }
        
        loadScript(scriptUrls[index], function(success) {
            loadedCount += success ? 1 : 0;
            
            // Wait a short delay before loading next script
            setTimeout(function() {
                loadScriptsSequentially(scriptUrls, index + 1);
            }, 100);
        });
    }
    
    // Begin loading scripts when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadScriptsSequentially(scripts);
        });
    } else {
        loadScriptsSequentially(scripts);
    }
    
    // Add a global function to check loading status
    window.checkSlashCommandsLoading = function() {
        console.log(`Slash command scripts loaded: ${loadedCount}/${scripts.length}`);
        console.log("Script loading status:", scriptStatus);
        
        return {
            total: scripts.length,
            loaded: loadedCount,
            status: scriptStatus
        };
    };
})();