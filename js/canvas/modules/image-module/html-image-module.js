/**
 * js/canvas/modules/image-module/html-image-module.js
 * Enhanced HTML-based Image Module
 * Replaces the canvas-based image module with a cleaner HTML experience
 * similar to the code editor for a more modern UI feel
 */
class HtmlImageModule extends HtmlModule {
    constructor() {
        super();
        this.currentImage = null;
        this.zoomLevel = 1;
        this.imageInfo = {};
        this.supportedCommands = ['display', 'random', 'zoom', 'info', 'theme'];
        
        // Set default title for this module
        this.setModuleTitle('Image Viewer');
    }
    
    /**
     * Initialize the module.
     * Creates or uses existing HTML container for image display.
     */
    init(element, ctx, manager) {
        if (element.tagName.toLowerCase() === 'canvas') {
            // Create a container for our HTML if we're given a canvas
            const container = document.createElement('div');
            container.id = 'imageContainer_' + Date.now();
            container.className = 'image-viewer-container';
            container.style.display = 'none';
            element.parentNode.insertBefore(container, element.nextSibling);
            this.container = container;
        } else {
            // Use the provided container directly
            this.container = element;
            this.container.classList.add('image-viewer-container');
        }
        
        this.manager = manager;
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        // Log initialization
        console.log("HTML Image Module initialized");
        
        return this;
    }
    
    /**
     * Activate the module.
     * Shows image container and hides canvas.
     */
    activate() {
        super.activate();
        
        // Update canvas status
        if (this.manager) {
            this.manager.updateCanvasStatus('success', 'Image Module Active');
            this.manager.hideInstructions();
            
            // Update title
            if (typeof this.manager.updateCanvasTitle === 'function') {
                this.manager.updateCanvasTitle(this.getModuleTitle());
            }
        }
        
        // Hide canvas, show image container
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.style.display = 'none';
        }
        
        if (this.container) {
            this.container.style.display = 'flex';
        }
        
        // Create base UI if not already created
        if (!this.container.querySelector('.image-viewer-ui')) {
            this.createImageViewerUI();
        }
        
        console.log("HTML Image Module activated");
        
        return this;
    }
    
    /**
     * Deactivate the module.
     * Hides image container.
     */
    deactivate() {
        super.deactivate();
        
        if (this.container) {
            this.container.style.display = 'none';
        }
        
        return this;
    }
    
    /**
     * Create the base image viewer UI
     */
    createImageViewerUI() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create UI container with a terminal-like aesthetic
        const ui = document.createElement('div');
        ui.className = 'image-viewer-ui';
        
        // Header with info and controls
        const header = document.createElement('div');
        header.className = 'image-viewer-header';
        
        // Left side info
        const imageInfo = document.createElement('div');
        imageInfo.className = 'image-info';
        imageInfo.innerHTML = '<span class="image-title">No image loaded</span>';
        header.appendChild(imageInfo);
        
        // Right side controls
        const controls = document.createElement('div');
        controls.className = 'image-controls';
        
        // Zoom controls
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoom-controls';
        
        const zoomOut = document.createElement('button');
        zoomOut.className = 'terminal-button zoom-out';
        zoomOut.innerHTML = '<i class="fas fa-search-minus"></i>';
        zoomOut.title = 'Zoom Out';
        zoomOut.addEventListener('click', () => this.handleCommand('zoom', ['-']));
        
        const zoomReset = document.createElement('button');
        zoomReset.className = 'terminal-button zoom-reset';
        zoomReset.innerHTML = '<i class="fas fa-compress-arrows-alt"></i>';
        zoomReset.title = 'Reset Zoom';
        zoomReset.addEventListener('click', () => this.handleCommand('zoom', ['reset']));
        
        const zoomIn = document.createElement('button');
        zoomIn.className = 'terminal-button zoom-in';
        zoomIn.innerHTML = '<i class="fas fa-search-plus"></i>';
        zoomIn.title = 'Zoom In';
        zoomIn.addEventListener('click', () => this.handleCommand('zoom', ['+']));
        
        zoomControls.appendChild(zoomOut);
        zoomControls.appendChild(zoomReset);
        zoomControls.appendChild(zoomIn);
        controls.appendChild(zoomControls);
        
        // Additional controls like theme, save, etc.
        const additionalControls = document.createElement('div');
        additionalControls.className = 'additional-controls';
        
        const themeToggle = document.createElement('button');
        themeToggle.className = 'terminal-button theme-toggle';
        themeToggle.innerHTML = '<i class="fas fa-adjust"></i>';
        themeToggle.title = 'Toggle Theme';
        themeToggle.addEventListener('click', () => this.handleCommand('theme', ['toggle']));
        
        const saveImage = document.createElement('button');
        saveImage.className = 'terminal-button save-image';
        saveImage.innerHTML = '<i class="fas fa-download"></i>';
        saveImage.title = 'Save Image';
        saveImage.addEventListener('click', () => this.saveImage());
        
        const openInNewTab = document.createElement('button');
        openInNewTab.className = 'terminal-button open-tab';
        openInNewTab.innerHTML = '<i class="fas fa-external-link-alt"></i>';
        openInNewTab.title = 'Open in New Tab';
        openInNewTab.addEventListener('click', () => this.openInNewTab());
        
        additionalControls.appendChild(themeToggle);
        additionalControls.appendChild(saveImage);
        additionalControls.appendChild(openInNewTab);
        controls.appendChild(additionalControls);
        
        header.appendChild(controls);
        ui.appendChild(header);
        
        // Main image viewing area
        const viewingArea = document.createElement('div');
        viewingArea.className = 'image-viewing-area';
        
        // Image placeholder or initial state
        const placeholderContainer = document.createElement('div');
        placeholderContainer.className = 'image-placeholder';
        placeholderContainer.innerHTML = '<i class="fas fa-image"></i><p>No image loaded</p><p>Use "show image [url]" to display an image</p>';
        viewingArea.appendChild(placeholderContainer);
        
        // Image container (will be populated when an image loads)
        const imageContainer = document.createElement('div');
        imageContainer.className = 'main-image-container';
        viewingArea.appendChild(imageContainer);
        
        ui.appendChild(viewingArea);
        
        // Footer with image metadata/information
        const footer = document.createElement('div');
        footer.className = 'image-viewer-footer';
        
        // Image URL display
        const urlDisplay = document.createElement('div');
        urlDisplay.className = 'image-url';
        urlDisplay.textContent = 'No image loaded';
        footer.appendChild(urlDisplay);
        
        // Image metadata
        const metadata = document.createElement('div');
        metadata.className = 'image-metadata';
        metadata.innerHTML = '<span class="dimensions">-</span> | <span class="file-size">-</span>';
        footer.appendChild(metadata);
        
        ui.appendChild(footer);
        
        // Add terminal-style overlays
        const scanlines = document.createElement('div');
        scanlines.className = 'viewer-scanlines';
        ui.appendChild(scanlines);
        
        // Add the UI to the container
        this.container.appendChild(ui);
    }
    
    /**
     * Handle module commands.
     */
    handleCommand(command, args) {
        switch (command) {
            case 'display':
                if (args && args.length > 0) {
                    return this.displayImage(args[0]);
                }
                return false;
                
            case 'random':
                return this.displayRandomImage();
                
            case 'zoom':
                if (args && args.length > 0) {
                    return this.zoomImage(args[0]);
                }
                return false;
                
            case 'info':
                return this.showImageInfo();
                
            case 'theme':
                if (args && args.length > 0) {
                    return this.setTheme(args[0]);
                }
                return false;
                
            default:
                console.error(`Unknown command for HtmlImageModule: ${command}`);
                return false;
        }
    }
    
    /**
     * Display an image by URL.
     * @param {string} url - The image URL to display
     */
    displayImage(url) {
        if (!url) {
            console.error("No image URL provided");
            return false;
        }
        
        // Update UI to show loading state
        this.setLoadingState(true);
        this.updateImageTitle("Loading image...");
        this.updateUrlDisplay(url);
        
        // Create a new image element
        const img = new Image();
        img.onload = () => {
            // Store image and info
            this.currentImage = img;
            this.imageInfo = {
                url: url,
                width: img.naturalWidth,
                height: img.naturalHeight,
                aspectRatio: img.naturalWidth / img.naturalHeight,
                loaded: true
            };
            
            // Update the UI with the image
            this.renderImage();
            this.setLoadingState(false);
            this.updateImageMetadata();
            
            // Extract image title/name from URL
            const imageName = this.extractImageName(url);
            this.updateImageTitle(imageName);
            
            console.log(`Image loaded: ${url}, ${img.naturalWidth}x${img.naturalHeight}`);
        };
        
        img.onerror = () => {
            this.setLoadingState(false);
            this.showErrorState("Failed to load image");
            this.updateImageTitle("Error loading image");
            console.error(`Failed to load image: ${url}`);
        };
        
        // Set the source to start loading
        img.src = url;
        
        return true;
    }
    
    /**
     * Display a random image.
     */
    displayRandomImage() {
        // Sample categories to choose from
        const categories = ['nature', 'technology', 'animals', 'architecture'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        // Generate a random width and height
        const width = 600;
        const height = 400;
        
        // Use a placeholder service
        const url = `https://source.unsplash.com/random/${width}x${height}/?${category}`;
        
        this.updateImageTitle(`Random ${category} image`);
        return this.displayImage(url);
    }
    
    /**
     * Zoom image in, out, or reset.
     * @param {string} action - '+', '-', or 'reset'
     */
    zoomImage(action) {
        if (!this.currentImage) {
            console.error("No image to zoom");
            return false;
        }
        
        switch (action) {
            case '+':
                this.zoomLevel = Math.min(this.zoomLevel + 0.1, 3);
                break;
            case '-':
                this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.2);
                break;
            case 'reset':
                this.zoomLevel = 1;
                break;
            default:
                // Try to parse as a numeric zoom level
                const level = parseFloat(action);
                if (!isNaN(level) && level > 0) {
                    this.zoomLevel = Math.min(Math.max(level, 0.2), 3);
                }
        }
        
        this.renderImage();
        
        // Update metadata to include zoom
        this.updateImageMetadata();
        
        return true;
    }
    
    /**
     * Show detailed image information.
     */
    showImageInfo() {
        if (!this.currentImage || !this.imageInfo.loaded) {
            console.error("No image loaded to show info");
            return false;
        }
        
        // Create or update an info panel
        const viewingArea = this.container.querySelector('.image-viewing-area');
        let infoPanel = viewingArea.querySelector('.image-info-panel');
        
        if (!infoPanel) {
            infoPanel = document.createElement('div');
            infoPanel.className = 'image-info-panel';
            viewingArea.appendChild(infoPanel);
        }
        
        // Set info panel content
        infoPanel.innerHTML = `
            <div class="info-header">
                <h3>Image Information</h3>
                <button class="close-button terminal-button"><i class="fas fa-times"></i></button>
            </div>
            <div class="info-content">
                <p><strong>Dimensions:</strong> ${this.imageInfo.width} × ${this.imageInfo.height}</p>
                <p><strong>Aspect Ratio:</strong> ${this.imageInfo.aspectRatio.toFixed(2)}</p>
                <p><strong>Current Zoom:</strong> ${(this.zoomLevel * 100).toFixed(0)}%</p>
                <p><strong>URL:</strong> <a href="${this.imageInfo.url}" target="_blank">${this.imageInfo.url}</a></p>
            </div>
        `;
        
        // Add close button event
        const closeButton = infoPanel.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            infoPanel.remove();
        });
        
        return true;
    }
    
    /**
     * Set the theme for the image viewer.
     * @param {string} theme - 'dark', 'light', or 'toggle'
     */
    setTheme(theme) {
        const isDark = this.container.classList.contains('dark-theme');
        
        if (theme === 'toggle') {
            this.container.classList.toggle('dark-theme');
            this.container.classList.toggle('light-theme');
        } else if (theme === 'dark' && !isDark) {
            this.container.classList.add('dark-theme');
            this.container.classList.remove('light-theme');
        } else if (theme === 'light' && isDark) {
            this.container.classList.add('light-theme');
            this.container.classList.remove('dark-theme');
        }
        
        return true;
    }
    
    /**
     * Save the current image.
     */
    saveImage() {
        if (!this.currentImage || !this.imageInfo.loaded) {
            console.error("No image to save");
            return false;
        }
        
        // Create a download link
        const link = document.createElement('a');
        link.href = this.currentImage.src;
        
        // Extract filename from URL or use default
        const filename = this.extractImageName(this.imageInfo.url) || 'image.jpg';
        link.download = filename;
        
        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return true;
    }
    
    /**
     * Open the image in a new tab.
     */
    openInNewTab() {
        if (!this.currentImage || !this.imageInfo.loaded) {
            console.error("No image to open");
            return false;
        }
        
        window.open(this.currentImage.src, '_blank');
        return true;
    }
    
    /**
     * Render the current image with proper sizing and zoom.
     */
    renderImage() {
        if (!this.currentImage) return false;
        
        const imageContainer = this.container.querySelector('.main-image-container');
        const placeholderContainer = this.container.querySelector('.image-placeholder');
        
        if (!imageContainer) return false;
        
        // Clear container and hide placeholder
        imageContainer.innerHTML = '';
        if (placeholderContainer) {
            placeholderContainer.style.display = 'none';
        }
        
        // Create the image element
        const img = document.createElement('img');
        img.src = this.currentImage.src;
        img.className = 'displayed-image';
        img.style.transform = `scale(${this.zoomLevel})`;
        img.style.transformOrigin = 'center center';
        
        // Display the image
        imageContainer.appendChild(img);
        
        return true;
    }
    
    /**
     * Set the loading state of the UI.
     * @param {boolean} isLoading - Whether the image is loading
     */
    setLoadingState(isLoading) {
        const viewingArea = this.container.querySelector('.image-viewing-area');
        const placeholderContainer = this.container.querySelector('.image-placeholder');
        
        if (isLoading) {
            if (placeholderContainer) {
                placeholderContainer.style.display = 'flex';
                placeholderContainer.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Loading image...</p>';
            }
            viewingArea.classList.add('loading');
        } else {
            viewingArea.classList.remove('loading');
        }
    }
    
    /**
     * Show error state in the UI.
     * @param {string} message - Error message to display
     */
    showErrorState(message) {
        const placeholderContainer = this.container.querySelector('.image-placeholder');
        
        if (placeholderContainer) {
            placeholderContainer.style.display = 'flex';
            placeholderContainer.innerHTML = `<i class="fas fa-exclamation-triangle"></i><p>${message}</p>`;
        }
    }
    
    /**
     * Update the image title in the UI.
     * @param {string} title - The title to display
     */
    updateImageTitle(title) {
        const imageTitle = this.container.querySelector('.image-title');
        
        if (imageTitle) {
            imageTitle.textContent = title;
        }
    }
    
    /**
     * Update the URL display in the UI.
     * @param {string} url - The URL to display
     */
    updateUrlDisplay(url) {
        const urlDisplay = this.container.querySelector('.image-url');
        
        if (urlDisplay) {
            // Truncate URL if too long
            const displayUrl = url.length > 60 ? url.substring(0, 57) + '...' : url;
            urlDisplay.textContent = displayUrl;
            urlDisplay.title = url; // Show full URL on hover
        }
    }
    
    /**
     * Update the image metadata display.
     */
    updateImageMetadata() {
        if (!this.currentImage || !this.imageInfo.loaded) return;
        
        const dimensionsElement = this.container.querySelector('.dimensions');
        
        if (dimensionsElement) {
            const zoom = (this.zoomLevel * 100).toFixed(0);
            dimensionsElement.textContent = `${this.imageInfo.width} × ${this.imageInfo.height} (${zoom}%)`;
        }
    }
    
    /**
     * Extract a reasonable image name from a URL.
     * @param {string} url - The image URL
     * @returns {string} The extracted image name
     */
    extractImageName(url) {
        try {
            // Try to get the filename from the URL
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop();
            
            // Clean up the filename
            return filename.split('?')[0] || 'Image';
        } catch (e) {
            return 'Image';
        }
    }
}

// Export for module system
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = HtmlImageModule;
}