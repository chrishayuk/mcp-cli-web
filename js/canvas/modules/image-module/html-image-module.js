/**
 * js/canvas/modules/image-module/html-image-module.js
 * Enhanced HTML-based Image Module with improved tab support
 */
class HtmlImageModule extends HtmlModule {
    constructor() {
        super();
        this.currentImage = null;
        this.zoomLevel = 1;
        this.imageInfo = {};
        this.supportedCommands = ['display', 'random', 'zoom', 'info', 'theme'];
        
        // Set default title using the new tab manager API
        this.setModuleTitle('Image Viewer');
        // Explicitly set module name for multi-tab handling
        this.moduleName = 'image';
    }
    
    /**
     * Get the module title.
     * @returns {string} Title to display when module is active.
     */
    getModuleTitle() {
        return 'Image Viewer';
    }
    
    /**
     * Set the module title.
     * @param {string} title - Title to display when module is active.
     * @returns {this} For method chaining.
     */
    setModuleTitle(title) {
        this._moduleTitle = title;
        if (this.isActive && this.manager && this.manager.tabManager) {
            this.manager.tabManager.updateTabTitle(this.manager.activeCanvasId, title);
        }
        return this;
    }
    
    /**
     * Initialize the module.
     * Creates or uses an existing HTML container for image display.
     * Modified to better support the tab system.
     */
    init(element, ctx, manager) {
        // Store the manager reference first
        this.manager = manager;
        
        // Get the parent element for this canvas
        const parentElement = element.parentNode;
        if (!parentElement) {
            console.error("HTML Image Module: No parent element found");
            return this;
        }
        
        // Generate a unique container ID based on canvas ID
        const canvasId = manager.activeCanvasId || 'main';
        const containerId = `imageContainer_${canvasId}`;
        
        // Check if a container already exists for this tab
        let container = parentElement.querySelector(`#${containerId}`);
        
        if (container) {
            // Use existing container
            console.log(`HTML Image Module: Using existing container for ${canvasId}`);
            this.container = container;
        } else if (element.tagName.toLowerCase() === 'canvas') {
            // Create a new container with an ID linked to the canvas ID
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'image-viewer-container';
            container.style.display = 'none';
            container.dataset.canvasId = canvasId;
            
            parentElement.insertBefore(container, element.nextSibling);
            this.container = container;
            console.log(`HTML Image Module: Created new container for ${canvasId}`);
        } else {
            // Use the provided element as container
            this.container = element;
            this.container.classList.add('image-viewer-container');
            this.container.dataset.canvasId = canvasId;
            console.log(`HTML Image Module: Using element as container for ${canvasId}`);
        }
        
        // Clear the container and prepare it for content
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        console.log(`HTML Image Module initialized for canvas: ${canvasId}`);
        return this;
    }
    
    /**
     * Activate the module.
     * Expands the canvas section, hides the base canvas, and shows this module's container.
     */
    activate() {
        super.activate();
        
        // Expand the collapsible canvas section
        if (this.manager && typeof this.manager.expandCanvasSection === 'function') {
            this.manager.expandCanvasSection();
        }
        
        // Update status and tab title
        if (this.manager) {
            this.manager.updateCanvasStatus('success', 'Image Module Active');
            this.manager.hideInstructions();
            
            // Update tab title
            const canvasId = this.manager.activeCanvasId;
            if (this.manager.tabManager) {
                this.manager.tabManager.updateTabTitle(canvasId, this.getModuleTitle());
            } else if (typeof this.manager.updateCanvasTitle === 'function') {
                this.manager.updateCanvasTitle(this.getModuleTitle());
            }
            
            // Make sure container is associated with the current canvas ID
            if (this.container && !this.container.dataset.canvasId) {
                this.container.dataset.canvasId = canvasId;
            }
        }
        
        // Hide the base canvas element if present
        const baseCanvas = document.getElementById('canvas');
        if (baseCanvas) {
            baseCanvas.style.display = 'none';
        }
        
        // Show this module's container
        if (this.container) {
            this.container.style.display = 'flex';
        }
        
        // Create the UI if not already present
        if (!this.container.querySelector('.image-viewer-ui')) {
            this.createImageViewerUI();
        }
        
        console.log(`HTML Image Module activated for canvas: ${this.manager.activeCanvasId}`);
        return this;
    }
    
    /**
     * Deactivate the module.
     * Hides the image container.
     */
    deactivate() {
        super.deactivate();
        if (this.container) {
            this.container.style.display = 'none';
        }
        return this;
    }
    
    /**
     * Display an image by URL.
     * Improved to work better with the tab system.
     */
    displayImage(url) {
        if (!url) {
            console.error("No image URL provided");
            return false;
        }
        
        // Ensure we're using the right container for the current tab
        if (this.manager && this.manager.activeCanvasId) {
            const canvasId = this.manager.activeCanvasId;
            const container = document.querySelector(`.image-viewer-container[data-canvas-id="${canvasId}"]`);
            
            if (container && container !== this.container) {
                console.log(`HTML Image Module: Switching to container for canvas ${canvasId}`);
                this.container = container;
                
                // Create UI if needed for this container
                if (!this.container.querySelector('.image-viewer-ui')) {
                    this.createImageViewerUI();
                }
            }
        }
        
        this.setLoadingState(true);
        this.updateImageTitle("Loading image...");
        this.updateUrlDisplay(url);
        
        const img = new Image();
        img.onload = () => {
            this.currentImage = img;
            this.imageInfo = {
                url: url,
                width: img.naturalWidth,
                height: img.naturalHeight,
                aspectRatio: img.naturalWidth / img.naturalHeight,
                loaded: true
            };
            
            this.renderImage();
            this.setLoadingState(false);
            this.updateImageMetadata();
            
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
        
        img.src = url;
        return true;
    }
    
    // The rest of the methods remain the same
    
    /**
     * Create the base image viewer UI.
     */
    createImageViewerUI() {
        // Clear the container
        this.container.innerHTML = '';
        
        // Create a UI container with a terminal-like aesthetic
        const ui = document.createElement('div');
        ui.className = 'image-viewer-ui';
        
        // Header: image info and controls
        const header = document.createElement('div');
        header.className = 'image-viewer-header';
        
        // Left side: image title/info
        const imageInfo = document.createElement('div');
        imageInfo.className = 'image-info';
        imageInfo.innerHTML = '<span class="image-title">No image loaded</span>';
        header.appendChild(imageInfo);
        
        // Right side: controls
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
        
        // Additional controls (theme toggle, save, open in new tab)
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
        
        // Placeholder for when no image is loaded
        const placeholderContainer = document.createElement('div');
        placeholderContainer.className = 'image-placeholder';
        placeholderContainer.innerHTML = '<i class="fas fa-image"></i><p>No image loaded</p><p>Use "show image [url]" to display an image</p>';
        viewingArea.appendChild(placeholderContainer);
        
        // Image container for displaying the loaded image
        const imageContainer = document.createElement('div');
        imageContainer.className = 'main-image-container';
        viewingArea.appendChild(imageContainer);
        
        ui.appendChild(viewingArea);
        
        // Footer: displays URL and metadata
        const footer = document.createElement('div');
        footer.className = 'image-viewer-footer';
        
        const urlDisplay = document.createElement('div');
        urlDisplay.className = 'image-url';
        urlDisplay.textContent = 'No image loaded';
        footer.appendChild(urlDisplay);
        
        const metadata = document.createElement('div');
        metadata.className = 'image-metadata';
        metadata.innerHTML = '<span class="dimensions">-</span> | <span class="file-size">-</span>';
        footer.appendChild(metadata);
        
        ui.appendChild(footer);
        
        // Terminal-style overlay (e.g. scanlines)
        const scanlines = document.createElement('div');
        scanlines.className = 'viewer-scanlines';
        ui.appendChild(scanlines);
        
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
     * Display a random image.
     */
    displayRandomImage() {
        const categories = ['nature', 'technology', 'animals', 'architecture'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        const width = 600;
        const height = 400;
        const url = `https://source.unsplash.com/random/${width}x${height}/?${category}`;
        
        this.updateImageTitle(`Random ${category} image`);
        return this.displayImage(url);
    }
    
    /**
     * Zoom image in, out, or reset.
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
                const level = parseFloat(action);
                if (!isNaN(level) && level > 0) {
                    this.zoomLevel = Math.min(Math.max(level, 0.2), 3);
                }
        }
        
        this.renderImage();
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
        
        const viewingArea = this.container.querySelector('.image-viewing-area');
        let infoPanel = viewingArea.querySelector('.image-info-panel');
        
        if (!infoPanel) {
            infoPanel = document.createElement('div');
            infoPanel.className = 'image-info-panel';
            viewingArea.appendChild(infoPanel);
        }
        
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
        
        const closeButton = infoPanel.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            infoPanel.remove();
        });
        
        return true;
    }
    
    /**
     * Set the theme for the image viewer.
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
        
        const link = document.createElement('a');
        link.href = this.currentImage.src;
        const filename = this.extractImageName(this.imageInfo.url) || 'image.jpg';
        link.download = filename;
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
        
        imageContainer.innerHTML = '';
        if (placeholderContainer) {
            placeholderContainer.style.display = 'none';
        }
        
        const img = document.createElement('img');
        img.src = this.currentImage.src;
        img.className = 'displayed-image';
        img.style.transform = `scale(${this.zoomLevel})`;
        img.style.transformOrigin = 'center center';
        imageContainer.appendChild(img);
        
        return true;
    }
    
    /**
     * Set the loading state of the UI.
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
     */
    updateImageTitle(title) {
        const imageTitle = this.container.querySelector('.image-title');
        if (imageTitle) {
            imageTitle.textContent = title;
        }
    }
    
    /**
     * Update the URL display in the UI.
     */
    updateUrlDisplay(url) {
        const urlDisplay = this.container.querySelector('.image-url');
        if (urlDisplay) {
            const displayUrl = url.length > 60 ? url.substring(0, 57) + '...' : url;
            urlDisplay.textContent = displayUrl;
            urlDisplay.title = url;
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
     */
    extractImageName(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop();
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