/**
 * Code Module
 * Handles displaying and formatting code in the canvas
 */
class CodeModule extends CanvasModule {
    constructor() {
        super();
        this.code = '';
        this.language = 'javascript';
        this.fontSize = 14;
        this.lineHeight = 1.5;
        this.padding = 20;
        this.colors = {
            background: 'rgba(0, 0, 0, 0.8)',
            text: '#0FFF0F',
            keywords: '#00FFFF',
            strings: '#FFFF00',
            numbers: '#FF00FF',
            comments: '#808080',
            lineNumbers: '#555555'
        };
    }
    
    /**
     * Initialize module
     */
    init(canvas, ctx, manager) {
        super.init(canvas, ctx, manager);
        this.supportedCommands = ['display', 'language', 'fontsize', 'theme'];
        return this;
    }
    
    /**
     * Activate module
     */
    activate() {
        super.activate();
        this.manager.updateCanvasStatus('success', 'Code Module Active');
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
     * Display code on the canvas
     * @param {string} code - Code to display
     * @param {string} language - Programming language
     */
    displayCode(code, language) {
        this.manager.hideInstructions();
        
        if (typeof code !== 'string') {
            terminal.addOutput('[ERROR] Invalid code format');
            this.drawError('Invalid Code Format');
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
     * Set color theme
     * @param {string} theme - Theme name (default, dark, light)
     */
    setTheme(theme) {
        switch(theme.toLowerCase()) {
            case 'dark':
                this.colors = {
                    background: 'rgba(0, 0, 0, 0.9)',
                    text: '#0FFF0F',
                    keywords: '#00FFFF',
                    strings: '#FFFF00',
                    numbers: '#FF00FF',
                    comments: '#808080',
                    lineNumbers: '#555555'
                };
                break;
                
            case 'light':
                this.colors = {
                    background: 'rgba(240, 240, 240, 0.9)',
                    text: '#008800',
                    keywords: '#000088',
                    strings: '#880000',
                    numbers: '#885500',
                    comments: '#555555',
                    lineNumbers: '#AAAAAA'
                };
                break;
                
            default:
                // Terminal green theme (default)
                this.colors = {
                    background: 'rgba(0, 0, 0, 0.8)',
                    text: '#0FFF0F',
                    keywords: '#00FFFF',
                    strings: '#FFFF00',
                    numbers: '#FF00FF',
                    comments: '#808080',
                    lineNumbers: '#555555'
                };
        }
        
        terminal.addOutput(`[INFO] Code theme set to: ${theme}`);
        this.render();
        return true;
    }
    
    /**
     * Render the code
     */
    render() {
        if (!this.code) {
            this.drawError('No Code To Display');
            return this;
        }
        
        this.clear();
        
        // Draw background
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set up code font
        this.ctx.font = `${this.fontSize}px monospace`;
        this.ctx.textBaseline = 'top';
        
        // Split code into lines
        const lines = this.code.split('\n');
        
        // Calculate metrics
        const lineHeight = this.fontSize * this.lineHeight;
        const maxLines = Math.floor((this.canvas.height - this.padding * 2) / lineHeight);
        
        // Initialize syntax highlighting
        const tokens = this.tokenize(this.code);
        
        // Draw code lines
        let currentY = this.padding;
        let lineNumber = 1;
        let tokenIndex = 0;
        
        for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
            // Draw line number
            this.ctx.fillStyle = this.colors.lineNumbers;
            this.ctx.textAlign = 'right';
            this.ctx.fillText(lineNumber.toString(), this.padding + 30, currentY);
            
            // Draw code with syntax highlighting
            this.ctx.textAlign = 'left';
            let currentX = this.padding + 50;
            
            const lineTokens = this.getLineTokens(tokens, lines[i]);
            
            for (const token of lineTokens) {
                switch (token.type) {
                    case 'keyword':
                        this.ctx.fillStyle = this.colors.keywords;
                        break;
                    case 'string':
                        this.ctx.fillStyle = this.colors.strings;
                        break;
                    case 'number':
                        this.ctx.fillStyle = this.colors.numbers;
                        break;
                    case 'comment':
                        this.ctx.fillStyle = this.colors.comments;
                        break;
                    default:
                        this.ctx.fillStyle = this.colors.text;
                }
                
                this.ctx.fillText(token.value, currentX, currentY);
                currentX += this.ctx.measureText(token.value).width;
            }
            
            currentY += lineHeight;
            lineNumber++;
        }
        
        // Draw "more lines" indicator if needed
        if (lines.length > maxLines) {
            this.ctx.fillStyle = this.colors.text;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`... ${lines.length - maxLines} more lines ...`, 
                             this.canvas.width / 2, this.canvas.height - this.padding);
        }
        
        return this;
    }
    
    /**
     * Simple tokenizer for syntax highlighting
     * @param {string} code - Code to tokenize
     */
    tokenize(code) {
        // This is a very simplified tokenizer for demonstration
        // In a real implementation, you would use a proper lexer for each language
        
        let tokens = [];
        
        // Define language keywords
        const languages = {
            'javascript': ['const', 'let', 'var', 'function', 'class', 'return', 'if', 'else', 
                          'for', 'while', 'switch', 'case', 'break', 'continue', 'new', 'this',
                          'import', 'export', 'from', 'try', 'catch', 'throw', 'async', 'await'],
            'python': ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'in',
                      'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with',
                      'lambda', 'pass', 'break', 'continue', 'global', 'nonlocal'],
            'html': ['html', 'head', 'body', 'div', 'span', 'h1', 'h2', 'h3', 'p', 'a',
                    'img', 'script', 'style', 'link', 'meta', 'title', 'form', 'input']
        };
        
        // Use javascript keywords as default
        const keywords = languages[this.language] || languages['javascript'];
        
        // Split the code into words and symbols
        const words = code.split(/(\s+|[(){}[\]<>,.;:?!+\-*\/=&|^~%])/);
        
        for (const word of words) {
            if (!word) continue;
            
            // Check for comments
            if ((this.language === 'javascript' && word.startsWith('//')) ||
                (this.language === 'python' && word.startsWith('#'))) {
                tokens.push({ type: 'comment', value: word });
            }
            // Check for strings
            else if (word.startsWith('"') || word.startsWith("'")) {
                tokens.push({ type: 'string', value: word });
            }
            // Check for numbers
            else if (!isNaN(parseFloat(word)) && isFinite(word)) {
                tokens.push({ type: 'number', value: word });
            }
            // Check for keywords
            else if (keywords.includes(word)) {
                tokens.push({ type: 'keyword', value: word });
            }
            // Everything else
            else {
                tokens.push({ type: 'text', value: word });
            }
        }
        
        return tokens;
    }
    
    /**
     * Get tokens for a specific line
     * @param {Array} allTokens - All tokens
     * @param {string} line - Current line text
     */
    getLineTokens(allTokens, line) {
        // This is a simplified approach
        // In a real implementation, you would track token positions
        
        // For this demo, we'll retokenize each line separately
        return this.tokenize(line);
    }
}

// Export for module system
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = CodeModule;
}