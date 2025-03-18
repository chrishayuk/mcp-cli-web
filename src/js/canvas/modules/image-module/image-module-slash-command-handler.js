/**
 * js/canvas/modules/image-module/image-module-slash-command-handler.js
 * Slash Command Handler for the HTML Image Module
 * 
 * Registers slash commands specific to the image module.
 */

// Initialize when slash command system is ready
document.addEventListener('slash-commands:ready', function() {
    console.log("Slash commands ready, initializing image module commands...");
    initImageModuleSlashCommands();
});

// Fallback initialization if the event doesn't fire
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (window.SlashCommands && 
            typeof window.SlashCommands.registerModuleCommand === 'function') {
            console.log("Initializing image module slash commands via fallback...");
            initImageModuleSlashCommands();
        }
    }, 1200);
});

/**
 * Initialize slash commands for the image module.
 */
function initImageModuleSlashCommands() {
    // Prevent multiple initialization
    if (window.imageModuleSlashCommandsInitialized) {
        return;
    }
    
    // Register always-available image activation commands
    registerImageActivationCommands();
    
    // Register module-specific commands (only available when image module is active)
    registerImageModuleCommands();
    
    // Define the module update function - completely overwrite any existing one
    window.updateImageModule = function(settings) {
        const imageModule = window.Commands?.canvasManager?.getModule('image');
        if (!imageModule) {
            console.error("Image module not found");
            return;
        }
        
        // Apply settings if provided
        if (settings?.theme && typeof imageModule.setTheme === 'function') {
            imageModule.setTheme(settings.theme);
        }
        
        if (settings?.zoom && typeof imageModule.setZoom === 'function') {
            imageModule.setZoom(settings.zoom);
        }
        
        // Extend with slash commands support
        extendImageModuleWithSlashSupport();
        
        console.log("Image module updated with settings:", settings);
    };
    
    // Extend the image module immediately
    extendImageModuleWithSlashSupport();
    
    // Set initialization flag
    window.imageModuleSlashCommandsInitialized = true;
    
    console.log("✅ Image module slash commands initialized");
}

/**
 * Register always-available image module activation commands.
 */
function registerImageActivationCommands() {
    // Main image commands: allow users to type "/image" or "/img" to display an image from URL.
    window.SlashCommands.registerModuleCommand(
        'image',              // Module name
        '/image',             // Slash command
        'show image',         // Full command to execute
        'Display an image from URL', // Description
        true                  // Always available even when module is not active
    );
    
    window.SlashCommands.registerModuleCommand(
        'image',
        '/img',
        'show image',
        'Display an image from URL',
        true
    );
    
    // Random image command
    window.SlashCommands.registerModuleCommand(
        'image',
        '/random-image',
        'show random image',
        'Display a random image',
        true
    );
    
    // Category commands (for quick access)
    const imageCategories = [
        { cmd: 'nature', desc: 'Show a nature image' },
        { cmd: 'city', desc: 'Show a city/architecture image' },
        { cmd: 'animal', desc: 'Show an animal image' },
        { cmd: 'tech', desc: 'Show a technology image' },
        { cmd: 'space', desc: 'Show a space image' }
    ];
    
    imageCategories.forEach(item => {
        window.SlashCommands.registerModuleCommand(
            'image',
            `/${item.cmd}`,
            `show image ${item.cmd}`,
            item.desc,
            true
        );
    });
}

/**
 * Register module-specific commands (only visible when image module is active).
 */
function registerImageModuleCommands() {
    // Zoom controls
    window.SlashCommands.registerModuleCommand(
        'image',
        '/zoom-in',
        'image zoom +',
        'Zoom in on the image',
        false
    );
    
    window.SlashCommands.registerModuleCommand(
        'image',
        '/zoom-out',
        'image zoom -',
        'Zoom out on the image',
        false
    );
    
    window.SlashCommands.registerModuleCommand(
        'image',
        '/zoom-reset',
        'image zoom reset',
        'Reset image zoom',
        false
    );
    
    // Theme commands
    window.SlashCommands.registerModuleCommand(
        'image',
        '/image-theme',
        'image theme toggle',
        'Toggle image viewer theme',
        false
    );
    
    window.SlashCommands.registerModuleCommand(
        'image',
        '/image-dark',
        'image theme dark',
        'Set dark theme for image viewer',
        false
    );
    
    window.SlashCommands.registerModuleCommand(
        'image',
        '/image-light',
        'image theme light',
        'Set light theme for image viewer',
        false
    );
    
    // Information and actions
    window.SlashCommands.registerModuleCommand(
        'image',
        '/image-info',
        'image info',
        'Show detailed image information',
        false
    );
    
    window.SlashCommands.registerModuleCommand(
        'image',
        '/save-image',
        'image save',
        'Save the current image',
        false
    );
    
    window.SlashCommands.registerModuleCommand(
        'image',
        '/open-image',
        'image open',
        'Open image in new tab',
        false
    );
}

/**
 * Extend the image module with additional slash command support.
 * Called when the image module becomes active.
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
    
    // Replace with extended version to support new commands
    imageModule.handleCommand = function(command, args) {
        switch (command) {
            case 'save':
                return (typeof this.saveImage === 'function') ? this.saveImage() : false;
            case 'open':
                return (typeof this.openInNewTab === 'function') ? this.openInNewTab() : false;
            // Category commands (e.g., "nature", "city", etc.)
            case 'nature':
            case 'city':
            case 'animal':
            case 'tech':
            case 'space':
                return this.displayRandomCategoryImage(command);
            default:
                return originalHandleCommand.call(this, command, args);
        }
    };
    
    // Add helper for category-specific images
    imageModule.displayRandomCategoryImage = function(category) {
        const width = 600;
        const height = 400;
        const url = `https://source.unsplash.com/random/${width}x${height}/?${category}`;
        
        if (typeof this.updateImageTitle === 'function') {
            this.updateImageTitle(`Random ${category} image`);
        }
        
        return (typeof this.displayImage === 'function')
            ? this.displayImage(url)
            : this.handleCommand('display', [url]);
    };
    
    imageModule._slashCommandsExtended = true;
}