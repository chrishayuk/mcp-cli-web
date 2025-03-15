/**
 * Image Module
 * Handles displaying and manipulating images in the canvas
 */
class ImageModule extends CanvasModule {
    constructor() {
        super();
        this.currentImage = null;
        this.isLoading = false;
    }
    
    /**
     * Initialize module
     */
    init(canvas, ctx, manager) {
        super.init(canvas, ctx, manager);
        this.supportedCommands = ['display', 'load', 'random'];
        return this;
    }
    
    /**
     * Activate module
     */
    activate() {
        super.activate();
        this.manager.updateCanvasStatus('success', 'Image Module Active');
        return this;
    }
    
    /**
     * Handle commands for this module
     * @param {string} command - Command to handle
     * @param {Array} args - Command arguments
     */
    handleCommand(command, args) {
        switch(command) {
            case 'display':
            case 'load':
                if (args && args.length > 0) {
                    return this.displayImage(args[0]);
                }
                return false;
                
            case 'random':
                return this.loadRandomImage();
                
            default:
                console.error(`Unknown command for ImageModule: ${command}`);
                return false;
        }
    }
    
    /**
     * Display an image on the canvas
     * @param {string} imageUrl - URL of the image to display
     */
    displayImage(imageUrl) {
        this.manager.hideInstructions();
        this.manager.updateCanvasStatus('loading', 'Loading image...');
        this.isLoading = true;
        
        // Clear the canvas first
        this.clear();
        
        // Create an image element
        const img = new Image();
        
        // Set up the onload handler
        img.onload = () => {
            this.isLoading = false;
            this.currentImage = img;
            this.renderImage();
            
            // Show success message
            this.manager.updateCanvasStatus('success', 'Image displayed');
            terminal.addOutput(`[INFO] Image displayed: ${imageUrl}`);
        };
        
        // Handle errors
        img.onerror = () => {
            this.isLoading = false;
            this.manager.updateCanvasStatus('error', 'Failed to load image');
            terminal.addOutput(`[ERROR] Failed to load image: ${imageUrl}`);
            
            // Draw an error message on the canvas
            this.drawError('Image Load Error');
        };
        
        // Set the source to trigger loading
        img.src = imageUrl;
        
        return true;
    }
    
    /**
     * Load a random image
     */
    loadRandomImage() {
        const randomParam = Math.random();
        const imageUrl = `https://picsum.photos/800/600?random=${randomParam}`;
        return this.displayImage(imageUrl);
    }
    
    /**
     * Render the current image to the canvas
     */
    render() {
        if (this.currentImage) {
            this.renderImage();
        }
        return this;
    }
    
    /**
     * Render the image with proper scaling
     */
    renderImage() {
        // Calculate scaled dimensions while maintaining aspect ratio
        const canvasRatio = this.canvas.width / this.canvas.height;
        const imgRatio = this.currentImage.width / this.currentImage.height;
        
        let drawWidth, drawHeight, x, y;
        
        if (imgRatio > canvasRatio) {
            // Image is wider than canvas (relative to height)
            drawWidth = this.canvas.width;
            drawHeight = this.canvas.width / imgRatio;
            x = 0;
            y = (this.canvas.height - drawHeight) / 2;
        } else {
            // Image is taller than canvas (relative to width)
            drawHeight = this.canvas.height;
            drawWidth = this.canvas.height * imgRatio;
            x = (this.canvas.width - drawWidth) / 2;
            y = 0;
        }
        
        // Clear canvas and draw the image
        this.clear();
        this.ctx.drawImage(this.currentImage, x, y, drawWidth, drawHeight);
    }
    
    /**
     * Handle resize event
     */
    resize() {
        if (this.currentImage) {
            this.renderImage();
        }
    }
}

// Export for module system
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = ImageModule;
}