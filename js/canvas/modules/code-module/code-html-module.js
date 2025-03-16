/**
 * js/canvas/modules/code-module/code-html-module.js
 * Enhanced CodeModule (Terminal Style) with improved tab support
 */
class CodeModule extends HtmlModule {
    constructor() {
        super();
        this.code = '';
        this.language = 'javascript';
        this.fontSize = 14;
        this.showLineNumbers = true;
        this.editorCollapsed = false;
        this.resultsCollapsed = false;
        this.htmlContainer = null;
        this.container = null;
        
        // Set default title for this module using the new tab manager API
        this.setModuleTitle('Code Display');
        // Explicitly set module name for multi-tab handling
        this.moduleName = 'code';
        
        // Define supported commands
        this.supportedCommands = [
            'display', 'language', 'fontsize', 'theme', 
            'toggleLineNumbers', 'toggleEditor', 'toggleResults', 'run'
        ];
    }
    
    /**
     * Get the module title.
     * @returns {string} Title to display when module is active.
     */
    getModuleTitle() {
        return 'Code Display';
    }
    
    /**
     * Set the module title.
     * @param {string} title - Title to display when module is active.
     * @returns {this} For method chaining.
     */
    setModuleTitle(title) {
        this._moduleTitle = title;
        // If active and a tab manager exists, update only the active tab's title.
        if (this.isActive && this.manager && this.manager.tabManager) {
            this.manager.tabManager.updateTabTitle(this.manager.activeCanvasId, title);
        }
        return this;
    }
    
    /**
     * Initialize the module.
     * Creates or uses an existing HTML container for code display.
     * Modified to better support the tab system.
     */
    init(element, ctx, manager) {
        // Store the manager reference first
        this.manager = manager;
        
        // Get the parent element for this canvas
        const parentElement = element.parentNode;
        if (!parentElement) {
            console.error("Code Module: No parent element found");
            return this;
        }
        
        // Generate a unique container ID based on canvas ID
        const canvasId = manager.activeCanvasId || 'main';
        const containerId = `codeContainer_${canvasId}`;
        
        // Check if a container already exists for this tab
        let container = parentElement.querySelector(`#${containerId}`);
        
        if (container) {
            // Use existing container
            console.log(`Code Module: Using existing container for ${canvasId}`);
            this.container = container;
        } else if (element.tagName.toLowerCase() === 'canvas') {
            // Create a new container with an ID linked to the canvas ID
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'ide-code-container';
            container.style.display = 'none';
            container.dataset.canvasId = canvasId;
            
            parentElement.insertBefore(container, element.nextSibling);
            this.container = container;
            console.log(`Code Module: Created new container for ${canvasId}`);
        } else {
            // Use the provided element as container
            this.container = element;
            this.container.classList.add('ide-code-container');
            this.container.dataset.canvasId = canvasId;
            console.log(`Code Module: Using element as container for ${canvasId}`);
        }
        
        // Clear the container and prepare it for content
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        console.log(`Code Module initialized for canvas: ${canvasId}`);
        return this;
    }
    
    /**
     * Activate the module.
     * Expands the canvas section, hides the base canvas, and shows the code container.
     */
    activate() {
        super.activate();
        
        // Explicitly expand the canvas section so the module is fully visible.
        if (this.manager && typeof this.manager.expandCanvasSection === 'function') {
            this.manager.expandCanvasSection();
        }
        
        // Update canvas status and hide instructions.
        if (this.manager) {
            this.manager.updateCanvasStatus('success', 'Code Module Active');
            this.manager.hideInstructions();
            
            // Update tab title
            const canvasId = this.manager.activeCanvasId;
            if (this.manager.tabManager) {
                this.manager.tabManager.updateTabTitle(canvasId, this.getModuleTitle());
            } else {
                const canvasTitle = document.getElementById('canvasTitle');
                if (canvasTitle) {
                    canvasTitle.textContent = this.getModuleTitle();
                }
            }
            
            // Make sure container is associated with the current canvas ID
            if (this.container && !this.container.dataset.canvasId) {
                this.container.dataset.canvasId = canvasId;
            }
        }
        
        // Hide the base canvas element (if any)
        const baseCanvas = document.getElementById('canvas');
        if (baseCanvas) {
            baseCanvas.style.display = 'none';
        }
        
        // Show this module's container
        if (this.container) {
            this.container.style.display = 'flex';
        }
        
        // If no code exists, set a default sample and render the UI
        if (!this.code) {
            this.code = '// Enter your code here\nconsole.log("Hello World");';
            this.render();
        }
        
        console.log(`Code Module activated for canvas: ${this.manager.activeCanvasId}`);
        return this;
    }
    
    /**
     * Deactivate the module.
     * Hides the code container.
     */
    deactivate() {
        super.deactivate();
        if (this.container) {
            this.container.style.display = 'none';
        }
        return this;
    }
    
    /**
     * Display code with an optional language override.
     * Improved to work better with the tab system.
     */
    displayCode(code, language) {
        if (this.manager) {
            this.manager.hideInstructions();
        }
        
        // Ensure we're using the right container for the current tab
        if (this.manager && this.manager.activeCanvasId) {
            const canvasId = this.manager.activeCanvasId;
            const container = document.querySelector(`.ide-code-container[data-canvas-id="${canvasId}"]`);
            
            if (container && container !== this.container) {
                console.log(`Code Module: Switching to container for canvas ${canvasId}`);
                this.container = container;
            }
        }
        
        if (typeof code !== 'string') {
            console.error('[ERROR] Invalid code format');
            if (this.container) {
                this.container.innerHTML = '<p style="color: var(--text-error); padding: 1rem;">Invalid Code Format</p>';
            }
            return false;
        }
        
        this.code = code;
        
        if (language) {
            this.language = language.toLowerCase();
            if (this.isActive && this.manager && this.manager.tabManager) {
                this.manager.tabManager.updateTabTitle(this.manager.activeCanvasId, this.getModuleTitle());
            }
        }
        
        this.render();
        
        console.log(`Code displayed (${this.code.split('\n').length} lines)`);
        return true;
    }
    
    /**
     * Handle module commands.
     */
    handleCommand(command, args) {
        switch (command) {
            case 'display':
                if (args && args.length > 0) {
                    return this.displayCode(args[0], args[1]);
                }
                return false;
            case 'language':
                if (args && args.length > 0) {
                    this.language = args[0].toLowerCase();
                    console.log(`Code language set to: ${this.language}`);
                    const renderResult = this.render();
                    if (this.isActive && this.manager && this.manager.tabManager) {
                        this.manager.tabManager.updateTabTitle(this.manager.activeCanvasId, this.getModuleTitle());
                    }
                    return renderResult;
                }
                return false;
            case 'fontsize':
                if (args && args.length > 0) {
                    const size = parseInt(args[0]);
                    if (!isNaN(size) && size > 0) {
                        this.fontSize = size;
                        console.log(`Font size set to: ${size}px`);
                        return this.render();
                    }
                }
                return false;
            case 'theme':
                if (args && args.length > 0) {
                    return this.setTheme(args[0]);
                }
                return false;
            case 'toggleLineNumbers':
                this.showLineNumbers = !this.showLineNumbers;
                console.log(`Line numbers ${this.showLineNumbers ? 'enabled' : 'disabled'}`);
                return this.render();
            case 'toggleEditor':
                this.editorCollapsed = !this.editorCollapsed;
                console.log(`Editor panel ${this.editorCollapsed ? 'collapsed' : 'expanded'}`);
                return this.updateCollapsibleState();
            case 'toggleResults':
                this.resultsCollapsed = !this.resultsCollapsed;
                console.log(`Results panel ${this.resultsCollapsed ? 'collapsed' : 'expanded'}`);
                return this.updateCollapsibleState();
            case 'run':
                return this.executeCode();
            default:
                console.error(`Unknown command for CodeModule: ${command}`);
                return false;
        }
    }
    
    /**
     * Set the theme for the code editor.
     */
    setTheme(theme) {
        if (!this.container) return false;
        
        this.container.classList.remove('ide-theme-dark', 'ide-theme-light');
        switch (theme.toLowerCase()) {
            case 'dark':
                this.container.classList.add('ide-theme-dark');
                break;
            case 'light':
                this.container.classList.add('ide-theme-light');
                break;
            default:
                this.container.classList.add('ide-theme-dark');
                break;
        }
        console.log(`Code theme set to: ${theme}`);
        return true;
    }
    
    /**
     * Update collapsible panels state without full re-render.
     */
    updateCollapsibleState() {
        const editorWrapper = this.container.querySelector('.ide-code-wrapper');
        const resultsContainer = this.container.querySelector('.ide-result-container');
        const editorHeader = this.container.querySelector('.editor-section-header');
        const resultsHeader = this.container.querySelector('.results-section-header');
        
        if (editorWrapper && editorHeader) {
            if (this.editorCollapsed) {
                editorWrapper.classList.add('collapsed');
                editorHeader.classList.add('collapsed');
            } else {
                editorWrapper.classList.remove('collapsed');
                editorHeader.classList.remove('collapsed');
            }
        }
        
        if (resultsContainer && resultsHeader) {
            if (this.resultsCollapsed) {
                resultsContainer.classList.add('collapsed');
                resultsHeader.classList.add('collapsed');
            } else {
                resultsContainer.classList.remove('collapsed');
                resultsHeader.classList.remove('collapsed');
            }
        }
        return true;
    }
    
    /**
     * Generate line numbers for code display.
     */
    generateLineNumbers(code) {
        const lines = code.split('\n');
        let lineNumbersHtml = '';
        for (let i = 1; i <= lines.length; i++) {
            lineNumbersHtml += `<div class="ide-line-number">${i}</div>`;
        }
        return lineNumbersHtml;
    }
    
    /**
     * Render the code editor interface.
     */
    render() {
        if (!this.container) return this;
        
        if (!this.code) {
            this.container.innerHTML = '<p style="color: var(--text-error); padding: 1rem;">No Code To Display</p>';
            return this;
        }
        
        this.container.innerHTML = '';
        
        // Create IDE header (titlebar)
        const header = document.createElement('div');
        header.className = 'ide-header';
        
        // Language indicator with terminal icon
        const langLabel = document.createElement('span');
        langLabel.className = 'ide-lang-label';
        langLabel.textContent = this.language;
        header.appendChild(langLabel);
        
        // Spacer element
        const spacer = document.createElement('div');
        spacer.className = 'ide-spacer';
        header.appendChild(spacer);
        
        // Toggle line numbers button
        const lineNumbersBtn = document.createElement('button');
        lineNumbersBtn.className = 'ide-button';
        lineNumbersBtn.title = 'Toggle Line Numbers';
        lineNumbersBtn.innerHTML = '<i class="fas fa-list-ol"></i>';
        lineNumbersBtn.addEventListener('click', () => this.handleCommand('toggleLineNumbers'));
        header.appendChild(lineNumbersBtn);
        
        // Copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'ide-button';
        copyButton.title = 'Copy Code';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(this.code)
                .then(() => {
                    console.log('Code copied to clipboard');
                })
                .catch(() => {
                    console.error('Failed to copy code');
                });
        });
        header.appendChild(copyButton);
        
        // Run button with play icon
        const runButton = document.createElement('button');
        runButton.className = 'ide-button';
        runButton.title = 'Run Code';
        runButton.innerHTML = '<i class="fas fa-play"></i>';
        runButton.addEventListener('click', () => this.executeCode());
        header.appendChild(runButton);
        
        this.container.appendChild(header);
        
        // Editor Section Header (collapsible)
        const editorHeader = document.createElement('div');
        editorHeader.className = 'ide-section-header editor-section-header';
        if (this.editorCollapsed) editorHeader.classList.add('collapsed');
        editorHeader.innerHTML = `
            <span>Editor</span>
            <span class="toggle-icon">▼</span>
        `;
        editorHeader.addEventListener('click', () => this.handleCommand('toggleEditor'));
        this.container.appendChild(editorHeader);
        
        // Create collapsible code editor wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'ide-code-wrapper';
        if (this.editorCollapsed) wrapper.classList.add('collapsed');
        
        const editor = document.createElement('div');
        editor.className = this.showLineNumbers ? 'ide-code-editor with-line-numbers' : 'ide-code-editor';
        
        // Terminal scanlines effect
        const scanlines = document.createElement('div');
        scanlines.className = 'ide-scanlines';
        editor.appendChild(scanlines);
        
        // Add line numbers if enabled
        if (this.showLineNumbers) {
            const lineNumbers = document.createElement('div');
            lineNumbers.className = 'ide-line-numbers';
            lineNumbers.innerHTML = this.generateLineNumbers(this.code);
            editor.appendChild(lineNumbers);
        }
        
        // Code block with language syntax
        const pre = document.createElement('pre');
        const codeElem = document.createElement('code');
        codeElem.className = this.language;
        codeElem.style.fontSize = `${this.fontSize}px`;
        codeElem.textContent = this.code;
        
        // Make code editable
        codeElem.setAttribute('contenteditable', 'true');
        codeElem.style.outline = 'none';
        codeElem.addEventListener('input', (e) => {
            this.code = e.target.textContent;
            if (this.showLineNumbers) {
                const lineNumbers = editor.querySelector('.ide-line-numbers');
                if (lineNumbers) {
                    lineNumbers.innerHTML = this.generateLineNumbers(this.code);
                }
            }
        });
        
        pre.appendChild(codeElem);
        editor.appendChild(pre);
        wrapper.appendChild(editor);
        this.container.appendChild(wrapper);
        
        // Results Section Header (collapsible)
        const resultsHeader = document.createElement('div');
        resultsHeader.className = 'ide-section-header results-section-header';
        if (this.resultsCollapsed) resultsHeader.classList.add('collapsed');
        resultsHeader.innerHTML = `
            <span>Execution Results</span>
            <span class="toggle-icon">▼</span>
        `;
        resultsHeader.addEventListener('click', () => this.handleCommand('toggleResults'));
        this.container.appendChild(resultsHeader);
        
        // Results panel
        const resultContainer = document.createElement('div');
        resultContainer.className = 'ide-result-container';
        if (this.resultsCollapsed) resultContainer.classList.add('collapsed');
        
        const resultArea = document.createElement('div');
        resultArea.className = 'ide-result-area';
        resultArea.textContent = 'Execution results will appear here...';
        resultContainer.appendChild(resultArea);
        this.container.appendChild(resultContainer);
        
        // Status bar
        const statusBar = document.createElement('div');
        statusBar.className = 'ide-status-bar';
        statusBar.innerHTML = `
            <div class="ide-status-item">
                <i class="fas fa-code"></i>
                <span>${this.language}</span>
            </div>
            <div class="ide-status-item">
                <i class="fas fa-align-left"></i>
                <span>${this.code.split('\n').length} lines</span>
            </div>
            <div class="ide-spacer"></div>
            <div class="ide-status-item">
                <span>Ready</span>
            </div>
        `;
        this.container.appendChild(statusBar);
        
        // Apply syntax highlighting if available
        if (typeof hljs !== 'undefined') {
            try {
                hljs.highlightElement(codeElem);
            } catch (e) {
                console.error('Error applying syntax highlighting:', e);
            }
        }
        
        return this;
    }
    
    /**
     * Execute code and show results.
     */
    executeCode() {
        const resultArea = this.container.querySelector('.ide-result-area');
        const statusItem = this.container.querySelector('.ide-status-bar .ide-status-item:last-child');
        
        if (!resultArea || !statusItem) return false;
        
        // Update status to "running"
        statusItem.innerHTML = '<span class="execution-running">Running...</span>';
        
        if (this.resultsCollapsed) {
            this.resultsCollapsed = false;
            this.updateCollapsibleState();
        }
        
        console.log(`Executing ${this.language} code...`);
        
        setTimeout(() => {
            let outputText = '';
            if (this.language.toLowerCase() === 'javascript') {
                try {
                    const originalLog = console.log;
                    const logs = [];
                    console.log = function() {
                        logs.push(Array.from(arguments).join(' '));
                        originalLog.apply(console, arguments);
                    };
                    try {
                        const result = new Function(this.code)();
                        if (logs.length > 0) {
                            outputText = logs.join('\n');
                        } else if (result !== undefined) {
                            outputText = String(result);
                        } else {
                            outputText = 'Code executed successfully with no output.';
                        }
                        statusItem.innerHTML = '<span class="execution-success">Success</span>';
                    } catch (e) {
                        outputText = `Error: ${e.message}\n\nStack trace:\n${e.stack}`;
                        statusItem.innerHTML = '<span class="execution-error">Error</span>';
                    }
                    console.log = originalLog;
                } catch (e) {
                    outputText = `Could not execute code: ${e.message}`;
                    statusItem.innerHTML = '<span class="execution-error">Error</span>';
                }
            } else {
                outputText = `Simulated execution for ${this.language}:\n`;
                outputText += `Language: ${this.language}\n`;
                outputText += `Lines of code: ${this.code.split('\n').length}\n`;
                outputText += `Characters: ${this.code.length}\n`;
                outputText += '---\n';
                outputText += 'Note: Actual execution only available for JavaScript';
                statusItem.innerHTML = '<span class="execution-success">Simulated</span>';
            }
            resultArea.innerHTML = '';
            const pre = document.createElement('pre');
            pre.textContent = outputText;
            resultArea.appendChild(pre);
            
            console.log(`Code execution complete`);
        }, 300);
        
        return true;
    }
}

// Export for module system
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = CodeModule;
}