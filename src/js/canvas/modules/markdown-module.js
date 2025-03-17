/**
 * Markdown Module
 * Renders Markdown content on the canvas
 */

// Add this debugging log to verify the script is loading
console.log('Markdown module script loading');

class MarkdownModule extends CanvasModule {
    constructor() {
        super();
        console.log('MarkdownModule constructed');
        this.markdown = '';
        this.fontSize = 14;
        this.lineHeight = 1.5;
        this.padding = 20;
        this.scrollY = 0;
        this.scrollSpeed = 10;
        this.colors = {
            background: 'rgba(0, 0, 0, 0.8)',
            text: '#FFFFFF',
            heading1: '#FF79C6',
            heading2: '#BD93F9',
            heading3: '#50FA7B',
            heading4: '#FFB86C',
            link: '#8BE9FD',
            code: '#F1FA8C',
            blockquote: '#BFBFBF',
            listMarker: '#FF5555',
        };
        
        // Markdown parsing regex patterns
        this.mdPatterns = {
            heading1: /^# (.+)$/,
            heading2: /^## (.+)$/,
            heading3: /^### (.+)$/,
            heading4: /^#### (.+)$/,
            listItem: /^[\*\-] (.+)$/,
            numberedItem: /^(\d+)\. (.+)$/,
            blockquote: /^> (.+)$/,
            code: /^```([\s\S]*?)```$/m,
            inlineCode: /`([^`]+)`/g,
            bold: /\*\*([^*]+)\*\*/g,
            italic: /\*([^*]+)\*/g,
            link: /\[([^\]]+)\]\(([^)]+)\)/g,
            horizontalRule: /^---+$/,
        };
    }
    
    /**
     * Initialize module
     */
    init(canvas, ctx, manager) {
        super.init(canvas, ctx, manager);
        this.supportedCommands = ['render', 'load', 'scroll', 'theme'];
        
        // Setup scroll wheel handling
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        
        return this;
    }
    
    /**
     * Activate module
     */
    activate() {
        super.activate();
        this.manager.updateCanvasStatus('success', 'Markdown Module Active');
        return this;
    }
    
    /**
     * Handle commands for this module
     * @param {string} command - Command to handle
     * @param {Array} args - Command arguments
     */
    handleCommand(command, args) {
        console.log(`MarkdownModule.handleCommand called with command: ${command}, args:`, args);
        
        switch(command) {
            case 'render':
                if (args && args.length > 0) {
                    return this.renderMarkdown(args[0]);
                }
                return false;
                
            case 'load':
                if (args && args.length > 0) {
                    return this.loadMarkdown(args[0]);
                }
                return false;
                
            case 'scroll':
                if (args && args.length > 0) {
                    const direction = args[0].toLowerCase();
                    const amount = args[1] ? parseInt(args[1]) : this.scrollSpeed;
                    
                    if (direction === 'up') {
                        this.scrollY = Math.max(0, this.scrollY - amount);
                    } else if (direction === 'down') {
                        this.scrollY += amount;
                    } else if (direction === 'top') {
                        this.scrollY = 0;
                    } else if (direction === 'bottom') {
                        // Scroll to an estimated bottom (will be refined in render)
                        this.scrollY = 10000; // A large number
                    }
                    
                    return this.render();
                }
                return false;
                
            case 'theme':
                if (args && args.length > 0) {
                    return this.setTheme(args[0]);
                }
                return false;
                
            default:
                console.error(`Unknown command for MarkdownModule: ${command}`);
                return false;
        }
    }
    
    /**
     * Handle wheel events for scrolling
     * @param {Event} event - Wheel event
     */
    handleWheel(event) {
        if (this.isActive) {
            event.preventDefault();
            const scrollAmount = event.deltaY > 0 ? this.scrollSpeed : -this.scrollSpeed;
            this.scrollY = Math.max(0, this.scrollY + scrollAmount);
            this.render();
        }
    }
    
    /**
     * Render markdown on the canvas
     * @param {string} markdown - Markdown content to render
     */
    renderMarkdown(markdown) {
        this.manager.hideInstructions();
        
        if (typeof markdown !== 'string') {
            terminal.addOutput('[ERROR] Invalid markdown format');
            this.drawError('Invalid Markdown Format');
            return false;
        }
        
        this.markdown = markdown;
        this.render();
        terminal.addOutput(`[INFO] Markdown rendered (${this.markdown.split('\n').length} lines)`);
        return true;
    }
    
    /**
     * Load markdown from a URL or local file
     * @param {string} source - URL or file path
     */
    loadMarkdown(source) {
        this.manager.updateCanvasStatus('loading', `Loading markdown from ${source}...`);
        
        // Handle URL
        if (source.startsWith('http')) {
            fetch(source)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}`);
                    }
                    return response.text();
                })
                .then(text => {
                    this.renderMarkdown(text);
                    this.manager.updateCanvasStatus('success', 'Markdown loaded successfully');
                })
                .catch(error => {
                    console.error('Error loading markdown:', error);
                    this.manager.updateCanvasStatus('error', `Error: ${error.message}`);
                    this.drawError(`Failed to load markdown: ${error.message}`);
                });
        } else {
            // For demo, use a sample markdown if source is "sample" or "demo"
            if (source === 'sample' || source === 'demo') {
                this.renderMarkdown(this.getSampleMarkdown());
                this.manager.updateCanvasStatus('success', 'Sample markdown loaded');
                return true;
            }
            
            terminal.addOutput('[ERROR] Only URLs or "sample" are supported for now');
            this.drawError('Only URLs or "sample" are supported');
            return false;
        }
        
        return true;
    }
    
    /**
     * Set color theme
     * @param {string} theme - Theme name (dark, light, dracula, github)
     */
    setTheme(theme) {
        switch(theme.toLowerCase()) {
            case 'light':
                this.colors = {
                    background: 'rgba(255, 255, 255, 0.9)',
                    text: '#333333',
                    heading1: '#0066CC',
                    heading2: '#0080FF',
                    heading3: '#009933',
                    heading4: '#CC6600',
                    link: '#0000EE',
                    code: '#990000',
                    blockquote: '#666666',
                    listMarker: '#CC0000',
                };
                break;
                
            case 'dracula':
                this.colors = {
                    background: 'rgba(40, 42, 54, 0.95)',
                    text: '#F8F8F2',
                    heading1: '#FF79C6',
                    heading2: '#BD93F9',
                    heading3: '#50FA7B',
                    heading4: '#FFB86C',
                    link: '#8BE9FD',
                    code: '#F1FA8C',
                    blockquote: '#BFBFBF',
                    listMarker: '#FF5555',
                };
                break;
                
            case 'github':
                this.colors = {
                    background: 'rgba(255, 255, 255, 0.95)',
                    text: '#24292E',
                    heading1: '#0366D6',
                    heading2: '#0366D6',
                    heading3: '#24292E',
                    heading4: '#24292E',
                    link: '#0366D6',
                    code: '#D73A49',
                    blockquote: '#6A737D',
                    listMarker: '#6F42C1',
                };
                break;
                
            case 'dark':
            default:
                this.colors = {
                    background: 'rgba(0, 0, 0, 0.8)',
                    text: '#FFFFFF',
                    heading1: '#FF79C6',
                    heading2: '#BD93F9',
                    heading3: '#50FA7B',
                    heading4: '#FFB86C',
                    link: '#8BE9FD',
                    code: '#F1FA8C',
                    blockquote: '#BFBFBF',
                    listMarker: '#FF5555',
                };
        }
        
        terminal.addOutput(`[INFO] Markdown theme set to: ${theme}`);
        this.render();
        return true;
    }
    
    /**
     * Render the markdown content
     */
    render() {
        if (!this.markdown) {
            this.drawError('No Markdown Content To Display');
            return this;
        }
        
        this.clear();
        
        // Draw background
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Split markdown into lines
        const lines = this.markdown.split('\n');
        
        // Parse and render each line
        let y = this.padding - this.scrollY;
        let inCodeBlock = false;
        let codeContent = '';
        let maxY = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Handle code blocks
            if (line.trim() === '```') {
                if (inCodeBlock) {
                    // End of code block
                    y = this.renderCodeBlock(codeContent, y);
                    codeContent = '';
                }
                inCodeBlock = !inCodeBlock;
                continue;
            }
            
            if (inCodeBlock) {
                codeContent += line + '\n';
                continue;
            }
            
            // Skip rendering if line is above viewport
            if (y + this.fontSize * this.lineHeight < 0) {
                // Estimate the line height based on content type
                if (this.mdPatterns.heading1.test(line)) {
                    y += this.fontSize * 2.5;
                } else if (this.mdPatterns.heading2.test(line)) {
                    y += this.fontSize * 2.2;
                } else if (this.mdPatterns.heading3.test(line)) {
                    y += this.fontSize * 2;
                } else if (this.mdPatterns.heading4.test(line)) {
                    y += this.fontSize * 1.8;
                } else {
                    y += this.fontSize * this.lineHeight;
                }
                continue;
            }
            
            // Skip rendering if line is below viewport
            if (y > this.canvas.height) {
                continue;
            }
            
            // Render different markdown elements
            if (this.mdPatterns.heading1.test(line)) {
                const match = line.match(this.mdPatterns.heading1);
                y = this.renderHeading(match[1], y, 1);
            } else if (this.mdPatterns.heading2.test(line)) {
                const match = line.match(this.mdPatterns.heading2);
                y = this.renderHeading(match[1], y, 2);
            } else if (this.mdPatterns.heading3.test(line)) {
                const match = line.match(this.mdPatterns.heading3);
                y = this.renderHeading(match[1], y, 3);
            } else if (this.mdPatterns.heading4.test(line)) {
                const match = line.match(this.mdPatterns.heading4);
                y = this.renderHeading(match[1], y, 4);
            } else if (this.mdPatterns.listItem.test(line)) {
                const match = line.match(this.mdPatterns.listItem);
                y = this.renderListItem(match[1], y, 'bullet');
            } else if (this.mdPatterns.numberedItem.test(line)) {
                const match = line.match(this.mdPatterns.numberedItem);
                y = this.renderListItem(match[2], y, 'number', match[1]);
            } else if (this.mdPatterns.blockquote.test(line)) {
                const match = line.match(this.mdPatterns.blockquote);
                y = this.renderBlockquote(match[1], y);
            } else if (this.mdPatterns.horizontalRule.test(line)) {
                y = this.renderHorizontalRule(y);
            } else if (line.trim() === '') {
                y += this.fontSize * this.lineHeight;
            } else {
                y = this.renderParagraph(line, y);
            }
            
            maxY = y;
        }
        
        // Handle any remaining code block
        if (inCodeBlock && codeContent) {
            y = this.renderCodeBlock(codeContent, y);
            maxY = y;
        }
        
        // Render scroll indicators if needed
        if (this.scrollY > 0) {
            this.renderScrollIndicator('up');
        }
        
        if (maxY > this.canvas.height) {
            this.renderScrollIndicator('down');
        }
        
        return this;
    }
    
    /**
     * Render a heading
     * @param {string} text - Heading text
     * @param {number} y - Y position
     * @param {number} level - Heading level (1-4)
     * @returns {number} New Y position
     */
    renderHeading(text, y, level) {
        const sizes = {
            1: this.fontSize * 2,
            2: this.fontSize * 1.7,
            3: this.fontSize * 1.4,
            4: this.fontSize * 1.2
        };
        
        const colors = {
            1: this.colors.heading1,
            2: this.colors.heading2,
            3: this.colors.heading3,
            4: this.colors.heading4
        };
        
        const size = sizes[level] || this.fontSize;
        const color = colors[level] || this.colors.text;
        
        this.ctx.font = `bold ${size}px Arial, sans-serif`;
        this.ctx.fillStyle = color;
        this.ctx.textBaseline = 'top';
        
        // Apply formatting to the text
        const formattedText = this.applyInlineFormatting(text);
        
        // Draw the text
        this.ctx.fillText(formattedText, this.padding, y);
        
        // Draw a line under level 1 headings
        if (level === 1) {
            y += size + 5;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, y);
            this.ctx.lineTo(this.canvas.width - this.padding, y);
            this.ctx.stroke();
            y += 5;
        }
        
        return y + size * this.lineHeight;
    }
    
    /**
     * Render a paragraph
     * @param {string} text - Paragraph text
     * @param {number} y - Y position
     * @returns {number} New Y position
     */
    renderParagraph(text, y) {
        this.ctx.font = `${this.fontSize}px Arial, sans-serif`;
        this.ctx.fillStyle = this.colors.text;
        this.ctx.textBaseline = 'top';
        
        // Apply formatting to the text
        const formattedText = this.applyInlineFormatting(text);
        
        // Check if text needs wrapping
        const maxWidth = this.canvas.width - (this.padding * 2);
        const words = formattedText.split(' ');
        let line = '';
        let lineY = y;
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && i > 0) {
                this.ctx.fillText(line, this.padding, lineY);
                line = words[i] + ' ';
                lineY += this.fontSize * this.lineHeight;
            } else {
                line = testLine;
            }
        }
        
        this.ctx.fillText(line, this.padding, lineY);
        return lineY + this.fontSize * this.lineHeight;
    }
    
    /**
     * Render a list item
     * @param {string} text - List item text
     * @param {number} y - Y position
     * @param {string} type - List type ('bullet' or 'number')
     * @param {string} index - For numbered lists
     * @returns {number} New Y position
     */
    renderListItem(text, y, type, index) {
        this.ctx.font = `${this.fontSize}px Arial, sans-serif`;
        this.ctx.fillStyle = this.colors.listMarker;
        this.ctx.textBaseline = 'top';
        
        // Draw bullet or number
        if (type === 'bullet') {
            this.ctx.beginPath();
            this.ctx.arc(this.padding + 5, y + this.fontSize / 2, 3, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.fillText(`${index}.`, this.padding, y);
        }
        
        // Draw list item text
        this.ctx.fillStyle = this.colors.text;
        const indent = type === 'bullet' ? 20 : 30;
        
        // Apply formatting to the text
        const formattedText = this.applyInlineFormatting(text);
        
        // Check if text needs wrapping
        const maxWidth = this.canvas.width - (this.padding * 2) - indent;
        const words = formattedText.split(' ');
        let line = '';
        let lineY = y;
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && i > 0) {
                this.ctx.fillText(line, this.padding + indent, lineY);
                line = words[i] + ' ';
                lineY += this.fontSize * this.lineHeight;
            } else {
                line = testLine;
            }
        }
        
        this.ctx.fillText(line, this.padding + indent, lineY);
        return lineY + this.fontSize * this.lineHeight;
    }
    
    /**
     * Render a blockquote
     * @param {string} text - Blockquote text
     * @param {number} y - Y position
     * @returns {number} New Y position
     */
    renderBlockquote(text, y) {
        this.ctx.fillStyle = this.colors.blockquote;
        this.ctx.font = `italic ${this.fontSize}px Arial, sans-serif`;
        this.ctx.textBaseline = 'top';
        
        // Draw quote bar
        this.ctx.fillRect(this.padding, y, 3, this.fontSize * this.lineHeight);
        
        // Apply formatting to the text
        const formattedText = this.applyInlineFormatting(text);
        
        // Draw text with indent
        const indent = 15;
        
        // Check if text needs wrapping
        const maxWidth = this.canvas.width - (this.padding * 2) - indent;
        const words = formattedText.split(' ');
        let line = '';
        let lineY = y;
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && i > 0) {
                this.ctx.fillText(line, this.padding + indent, lineY);
                line = words[i] + ' ';
                lineY += this.fontSize * this.lineHeight;
                
                // Continue the quote bar for wrapped lines
                this.ctx.fillRect(this.padding, lineY, 3, this.fontSize * this.lineHeight);
            } else {
                line = testLine;
            }
        }
        
        this.ctx.fillText(line, this.padding + indent, lineY);
        return lineY + this.fontSize * this.lineHeight;
    }
    
    /**
     * Render a code block
     * @param {string} code - Code content
     * @param {number} y - Y position
     * @returns {number} New Y position
     */
    renderCodeBlock(code, y) {
        const padding = 10;
        const lineHeight = this.fontSize * 1.2;
        
        // Draw code background
        this.ctx.fillStyle = 'rgba(30, 30, 30, 0.7)';
        
        const lines = code.split('\n');
        const blockHeight = lines.length * lineHeight + padding * 2;
        
        this.ctx.fillRect(this.padding, y, this.canvas.width - (this.padding * 2), blockHeight);
        
        // Draw code
        this.ctx.font = `${this.fontSize}px Consolas, monospace`;
        this.ctx.fillStyle = this.colors.code;
        this.ctx.textBaseline = 'top';
        
        let codeY = y + padding;
        for (const line of lines) {
            this.ctx.fillText(line, this.padding + padding, codeY);
            codeY += lineHeight;
        }
        
        return y + blockHeight + this.fontSize * 0.5;
    }
    
    /**
     * Render a horizontal rule
     * @param {number} y - Y position
     * @returns {number} New Y position
     */
    renderHorizontalRule(y) {
        const padding = 5;
        y += padding;
        
        this.ctx.strokeStyle = 'rgba(150, 150, 150, 0.6)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding, y);
        this.ctx.lineTo(this.canvas.width - this.padding, y);
        this.ctx.stroke();
        
        return y + this.fontSize * this.lineHeight;
    }
    
    /**
     * Apply inline formatting to text
     * @param {string} text - Text to format
     * @returns {string} Formatted text
     */
    applyInlineFormatting(text) {
        // This is a simplified approach that doesn't actually format the text visually
        // In a real implementation, you would need to break the text into segments and render each with different styles
        
        // For now, we'll just strip the formatting markers from the text
        let formatted = text;
        
        // Remove inline code markers
        formatted = formatted.replace(this.mdPatterns.inlineCode, '$1');
        
        // Remove bold markers
        formatted = formatted.replace(this.mdPatterns.bold, '$1');
        
        // Remove italic markers
        formatted = formatted.replace(this.mdPatterns.italic, '$1');
        
        // Replace links with text
        formatted = formatted.replace(this.mdPatterns.link, '$1');
        
        return formatted;
    }
    
    /**
     * Render scroll indicators
     * @param {string} direction - 'up' or 'down'
     */
    renderScrollIndicator(direction) {
        const size = 20;
        const padding = 10;
        const x = this.canvas.width - size - padding;
        
        if (direction === 'up') {
            const y = padding;
            
            this.ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + size);
            this.ctx.lineTo(x + size, y + size);
            this.ctx.lineTo(x + size/2, y);
            this.ctx.closePath();
            this.ctx.fill();
        } else {
            const y = this.canvas.height - size - padding;
            
            this.ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + size, y);
            this.ctx.lineTo(x + size/2, y + size);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    /**
     * Draw an error message
     * @param {string} message - Error message
     */
    drawError(message) {
        this.clear();
        
        // Draw background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw error icon
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 - 40;
        const radius = 30;
        
        this.ctx.fillStyle = '#FF5555';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('!', centerX, centerY);
        
        // Draw error message
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(message, centerX, centerY + 70);
        
        // Draw hint
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Try "markdown load sample" for a demo', centerX, centerY + 100);
    }
    
    /**
     * Get sample markdown content
     * @returns {string} Sample markdown
     */
    getSampleMarkdown() {
        return `# Markdown Viewer Demo

## Welcome to the Markdown Viewer!

This module renders **Markdown** content on the *Canvas Terminal*.

### Features

- Headings (levels 1-4)
- Paragraphs with wrapping
- Bold and italic text
- Bulleted lists
- Numbered lists
- Code blocks
- Blockquotes
- Horizontal rules

### Usage Examples

To load markdown content:

\`\`\`
markdown load sample
markdown render "# Your markdown here"
\`\`\`

> This is a blockquote that demonstrates how blockquotes are rendered in this viewer.

#### Styling Options

You can change the theme using:

\`\`\`
markdown theme dark
markdown theme light
markdown theme dracula
markdown theme github
\`\`\`

1. First numbered item
2. Second numbered item
3. Third numbered item

---

This is regular paragraph text that will automatically wrap when it reaches the edge of the viewing area. It demonstrates paragraph rendering capabilities.

## Scrolling

Use the mouse wheel or these commands to scroll:

\`\`\`
markdown scroll up
markdown scroll down
markdown scroll top
markdown scroll bottom
\`\`\`

*End of demo*
`;
    }
}

// Make sure MarkdownModule is globally available
if (typeof window !== 'undefined') {
    window.MarkdownModule = MarkdownModule;
    console.log('MarkdownModule registered globally');
}

// Export for module system
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = MarkdownModule;
}