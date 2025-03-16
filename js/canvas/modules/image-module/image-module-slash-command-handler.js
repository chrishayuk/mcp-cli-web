/**
 * js/canvas/modules/image-module/image-module-slash-command-handler.js
 * Slash Command Handler for the HTML Image Module
 * 
 * Registers slash commands specific to the image module
 */

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for slash command handler and image module to be initialized
    setTimeout(function() {
        if (window.SlashCommands && window.Commands && window.Commands.canvasManager) {
            console.log("Initializing image module slash commands...");
            initImageModuleSlashCommands();
        }
    }, 1200);
});

/**
 * Initialize slash commands for the image module
 */
function initImageModuleSlashCommands() {
    // Register activation commands (always available)
    registerImageActivationCommands();
    
    // Register module-specific commands (only available when image module is active)
    registerImageModuleCommands();
    
    // Register module update function (called when image module becomes active)
    window.updateImageModule = function() {
        extendImageModuleWithSlashSupport();
    };
    
    console.log("Image module slash commands initialized");
}

/**
 * Register always-available image module activation commands
 */
function registerImageActivationCommands() {
    // Main image commands
    window.SlashCommands.registerModuleCommand(
        'image',              // Module name
        '/image',             // Slash command
        'show image',         // Full command to execute
        'Display an image from URL', // Description
        true                  // Show always (even when module not active)
    );
    
    window.SlashCommands.registerModuleCommand(
        'image',              // Module name
        '/img',               // Slash command
        'show image',         // Full command to execute
        'Display an image from URL', // Description
        true                  // Show always (even when module not active)
    );
    
    // Random image command
    window.SlashCommands.registerModuleCommand(
        'image',                 // Module name
        '/random-image',         // Slash command
        'show random image',     // Full command to execute
        'Display a random image', // Description
        true                     // Show always
    );
    
    // Other useful image commands
    const imageCommands = [
        { cmd: 'nature', desc: 'Show a nature image' },
        { cmd: 'city', desc: 'Show a city/architecture image' },
        { cmd: 'animal', desc: 'Show an animal image' },
        { cmd: 'tech', desc: 'Show a technology image' },
        { cmd: 'space', desc: 'Show a space image' }
    ];
    
    // Register each image category command
    imageCommands.forEach(cmd => {
        window.SlashCommands.registerModuleCommand(
            'image',                             // Module name
            `/${cmd.cmd}`,                       // Slash command
            `show image ${cmd.cmd}`,             // Full command to execute
            cmd.desc,                            // Description
            true                                 // Show always
        );
    });
}

/**
 * Register module-specific commands (only visible when image module is active)
 */
function registerImageModuleCommands() {
    // Zoom controls
    window.SlashCommands.registerModuleCommand(
        'image', '/zoom-in', 'image zoom +', 'Zoom in on the image', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'image', '/zoom-out', 'image zoom -', 'Zoom out on the image', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'image', '/zoom-reset', 'image zoom reset', 'Reset image zoom', false
    );
    
    // Theme commands
    window.SlashCommands.registerModuleCommand(
        'image', '/image-theme', 'image theme toggle', 'Toggle image viewer theme', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'image', '/image-dark', 'image theme dark', 'Set dark theme for image viewer', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'image', '/image-light', 'image theme light', 'Set light theme for image viewer', false
    );
    
    // Information and actions
    window.SlashCommands.registerModuleCommand(
        'image', '/image-info', 'image info', 'Show detailed image information', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'image', '/save-image', 'image save', 'Save the current image', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'image', '/open-image', 'image open', 'Open image in new tab', false
    );
}

/**
 * Extend the image module with slash command support
 * Called when the image module becomes active
 */
function extendImageModuleWithSlashSupport() {
    if (!window.Commands || !window.Commands.canvasManager) {
        console.error("Canvas manager not available for image module extension");
        return;
    }
    
    const imageModule = window.Commands.canvasManager.getModule('image');
    
    if (!imageModule) {
        console.error("Image module not found for slash command extension");
        return;
    }
    
    // Skip if already extended
    if (imageModule._slashCommandsExtended) {
        return;
    }
    
    console.log("Extending image module with slash command support");
    
    // Store original handleCommand method
    const originalHandleCommand = imageModule.handleCommand;
    
    // Replace with our extended version
    imageModule.handleCommand = function(command, args) {
        // Handle new commands
        switch (command) {
            case 'save':
                if (typeof this.saveImage === 'function') {
                    return this.saveImage();
                }
                break;
                
            case 'open':
                if (typeof this.openInNewTab === 'function') {
                    return this.openInNewTab();
                }
                break;
                
            // Handle category-specific image commands
            case 'nature':
            case 'city':
            case 'animal':
            case 'tech':
            case 'space':
                return this.displayRandomCategoryImage(command);
        }
        
        // Call original for all other commands
        return originalHandleCommand.call(this, command, args);
    };
    
    // Add helper method for category-specific images if it doesn't exist
    if (typeof imageModule.displayRandomCategoryImage !== 'function') {
        imageModule.displayRandomCategoryImage = function(category) {
            // Generate a random width and height
            const width = 600;
            const height = 400;
            
            // Use a placeholder service
            const url = `https://source.unsplash.com/random/${width}x${height}/?${category}`;
            
            if (typeof this.updateImageTitle === 'function') {
                this.updateImageTitle(`Random ${category} image`);
            }
            
            if (typeof this.displayImage === 'function') {
                return this.displayImage(url);
            } else {
                return this.handleCommand('display', [url]);
            }
        };
    }
    
    imageModule._slashCommandsExtended = true;
}

// Export module update function for the slash commands system
if (typeof window !== 'undefined') {
    window.updateImageModule = updateImageModule;
}