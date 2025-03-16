/**
 * CodeModule (IDE Style HTML Version, Editable)
 * Displays, formats, and allows editing of code using an HTML container with an IDE-style header.
 * Features:
 *   - A header showing the language.
 *   - A copy icon to copy the code.
 *   - A play icon to run the code.
 *   - A styled, editable code block with syntax highlighting.
 */
class CodeModule extends HtmlModule {
    constructor() {
        super();
        this.code = '';
        this.language = 'javascript';
        this.fontSize = 14;
        // Supported commands: display, language, fontsize, theme
        this.supportedCommands = ['display', 'language', 'fontsize', 'theme'];
    }
    
    /**
     * Initialize the module.
     * If a canvas element is passed, a dedicated HTML container is created.
     *
     * @param {HTMLElement} element - Either a container element or a canvas.
     * @param {CanvasRenderingContext2D} ctx - Unused here.
     * @param {CanvasManager} manager - The central manager instance.
     * @returns {CodeModule}
     */
    init(element, ctx, manager) {
        if (element.tagName.toLowerCase() === 'canvas') {
            const codeContainer = document.createElement('div');
            codeContainer.id = 'codeContainer_' + Date.now();
            codeContainer.className = 'ide-code-container';
            codeContainer.style.display = 'none';
            element.parentNode.insertBefore(codeContainer, element.nextSibling);
            this.container = codeContainer;
        } else {
            this.container = element;
            this.container.classList.add('ide-code-container');
        }
        this.manager = manager;
        if (this.container) {
            this.container.innerHTML = '';
        }
        return this;
    }
    
    /**
     * Activate the module.
     * Hides other modules (e.g. the canvas) and shows the code container.
     */
    activate() {
        super.activate();
        this.manager.updateCanvasStatus('success', 'Code Module Active');
        // Hide the canvas if present
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.style.display = 'none';
        }
        // Hide other module containers (if they use a common class)
        const others = document.querySelectorAll('.module-container');
        others.forEach(el => el.style.display = 'none');
        if (this.container) {
            this.container.style.display = 'block';
        }
        return this;
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
                    this.language = args[0];
                    terminal.addOutput(`[INFO] Code language set to: ${this.language}`);
                    return this.render();
                }
                return false;
            case 'fontsize':
                if (args && args.length > 0) {
                    const size = parseInt(args[0]);
                    if (!isNaN(size) && size > 0) {
                        this.fontSize = size;
                        terminal.addOutput(`[INFO] Font size set to: ${size}px`);
                        return this.render();
                    }
                }
                return false;
            case 'theme':
                if (args && args.length > 0) {
                    return this.setTheme(args[0]);
                }
                return false;
            default:
                console.error(`Unknown command for CodeModule: ${command}`);
                return false;
        }
    }
    
    /**
     * Display code.
     */
    displayCode(code, language) {
        this.manager.hideInstructions();
        if (typeof code !== 'string') {
            terminal.addOutput('[ERROR] Invalid code format');
            this.container.innerHTML = '<p style="color: red;">Invalid Code Format</p>';
            return false;
        }
        this.code = code;
        if (language) {
            this.language = language;
        }
        this.render();
        terminal.addOutput(`[INFO] Code displayed (${this.code.split('\n').length} lines)`);
        return true;
    }
    
    /**
     * Set the theme by adding appropriate CSS classes.
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
                break;
        }
        terminal.addOutput(`[INFO] Code theme set to: ${theme}`);
        this.render();
        return true;
    }
    
    /**
     * Render the code with an IDE-style header and an editable code block.
     */
    render() {
        if (!this.code) {
            this.container.innerHTML = '<p style="color: red;">No Code To Display</p>';
            return this;
        }
        this.container.innerHTML = '';
        
        // Create IDE header
        const header = document.createElement('div');
        header.className = 'ide-header';
        
        // Language label
        const langLabel = document.createElement('span');
        langLabel.className = 'ide-lang-label';
        langLabel.textContent = this.language;
        header.appendChild(langLabel);
        
        // Spacer
        const spacer = document.createElement('div');
        spacer.className = 'ide-spacer';
        header.appendChild(spacer);
        
        // Copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'ide-copy-button';
        copyButton.title = 'Copy Code';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(this.code)
                .then(() => terminal.addOutput('[INFO] Code copied to clipboard'))
                .catch(() => terminal.addOutput('[ERROR] Failed to copy code'));
        });
        header.appendChild(copyButton);
        
        // Run button
        const runButton = document.createElement('button');
        runButton.className = 'ide-run-button';
        runButton.title = 'Run Code';
        runButton.innerHTML = '<i class="fas fa-play"></i>';
        runButton.addEventListener('click', () => {
            terminal.addOutput(`[INFO] Executing code:\n${this.code}`);
            if (this.language.toLowerCase() === 'javascript') {
                try {
                    const result = eval(this.code);
                    terminal.addOutput(`[RESULT] ${result}`);
                } catch (err) {
                    terminal.addOutput(`[ERROR] ${err.message}`);
                }
            }
        });
        header.appendChild(runButton);
        
        this.container.appendChild(header);
        
        // Create a wrapper for the code block
        const wrapper = document.createElement('div');
        wrapper.className = 'ide-code-wrapper';
        
        const pre = document.createElement('pre');
        pre.style.margin = '0';
        const codeElem = document.createElement('code');
        codeElem.className = this.language;
        codeElem.style.fontSize = `${this.fontSize}px`;
        codeElem.textContent = this.code;
        // Make the code block editable
        codeElem.setAttribute('contenteditable', 'true');
        codeElem.style.outline = 'none';
        // Update internal code state on input
        codeElem.addEventListener('input', (e) => {
            this.code = e.target.textContent;
        });
        
        pre.appendChild(codeElem);
        wrapper.appendChild(pre);
        this.container.appendChild(wrapper);
        
        // Apply syntax highlighting if available
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(codeElem);
        }
        return this;
    }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = CodeModule;
}