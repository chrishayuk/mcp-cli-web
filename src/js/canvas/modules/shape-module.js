/**
 * Shape Module
 * Handles drawing shapes and patterns on the canvas
 */
class ShapeModule extends CanvasModule {
    constructor() {
        super();
        this.shapes = [];
        this.animationFrameId = null;
    }
    
    /**
     * Initialize module
     */
    init(canvas, ctx, manager) {
        super.init(canvas, ctx, manager);
        this.supportedCommands = ['draw', 'random', 'pattern', 'animate', 'stop'];
        return this;
    }
    
    /**
     * Activate module
     */
    activate() {
        super.activate();
        this.manager.updateCanvasStatus('success', 'Shape Module Active');
        return this;
    }
    
    /**
     * Deactivate module
     */
    deactivate() {
        super.deactivate();
        // Stop any running animations
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        return this;
    }
    
    /**
     * Handle commands for this module
     * @param {string} command - Command to handle
     * @param {Array} args - Command arguments
     */
    handleCommand(command, args) {
        switch(command) {
            case 'draw':
                if (args && args.length >= 5) {
                    const [type, x, y, width, height] = args;
                    return this.drawShape(type, x, y, width, height);
                }
                return false;
                
            case 'random':
                return this.drawRandomShape();
                
            case 'pattern':
                if (args && args.length > 0) {
                    return this.drawPattern(args[0]);
                }
                return this.drawPattern('grid');
                
            case 'animate':
                return this.startAnimation();
                
            case 'stop':
                return this.stopAnimation();
                
            default:
                console.error(`Unknown command for ShapeModule: ${command}`);
                return false;
        }
    }
    
    /**
     * Draw a shape on the canvas
     * @param {string} type - Type of shape (rect, circle, triangle)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Width of shape
     * @param {number} height - Height of shape
     */
    drawShape(type, x, y, width, height) {
        const greenIntensity = Math.random() * 0.8 + 0.2;
        this.ctx.save();
        
        // Terminal-style effect - add slight glow
        this.ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = `rgb(0, ${Math.floor(greenIntensity * 255)}, 0)`;
        
        switch(type) {
            case 'rect':
                this.ctx.fillRect(x, y, width, height);
                break;
                
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(x + width/2, y + height/2, Math.min(width, height)/2, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(x + width/2, y);
                this.ctx.lineTo(x + width, y + height);
                this.ctx.lineTo(x, y + height);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            default:
                this.ctx.fillRect(x, y, width, height);
        }
        
        this.ctx.restore();
        
        // Add shape to our collection
        this.shapes.push({
            type,
            x,
            y,
            width,
            height,
            color: greenIntensity
        });
        
        return true;
    }
    
    /**
     * Draw a random shape
     */
    drawRandomShape() {
        this.manager.hideInstructions();
        
        // Generate random position and size
        const x = Math.floor(Math.random() * (this.canvas.width - 200));
        const y = Math.floor(Math.random() * (this.canvas.height - 200));
        const width = Math.floor(Math.random() * 150) + 50;
        const height = Math.floor(Math.random() * 150) + 50;
        
        // Pick a random shape type
        const types = ['rect', 'circle', 'triangle'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Draw the shape
        this.drawShape(type, x, y, width, height);
        
        terminal.addOutput(`[INFO] ${type} generated at (${x},${y}) with size ${width}x${height}`);
        return true;
    }
    
    /**
     * Draw a pattern of shapes
     * @param {string} pattern - Pattern type (grid, radial, random)
     */
    drawPattern(pattern) {
        this.manager.hideInstructions();
        this.clear();
        this.shapes = [];
        
        switch(pattern) {
            case 'grid':
                this.drawGridPattern();
                break;
                
            case 'radial':
                this.drawRadialPattern();
                break;
                
            case 'random':
                for (let i = 0; i < 20; i++) {
                    this.drawRandomShape();
                }
                break;
                
            default:
                this.drawGridPattern();
        }
        
        terminal.addOutput(`[INFO] Pattern '${pattern}' generated`);
        return true;
    }
    
    /**
     * Draw a grid pattern
     */
    drawGridPattern() {
        const rows = 5;
        const cols = 5;
        const cellSize = 60;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                // Skip some squares for visual interest
                if (Math.random() > 0.7) continue;
                
                const x = 150 + j * (cellSize + 20);
                const y = 120 + i * (cellSize + 20);
                
                this.drawShape('rect', x, y, cellSize, cellSize);
            }
        }
    }
    
    /**
     * Draw a radial pattern
     */
    drawRadialPattern() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const numShapes = 12;
        const radius = Math.min(this.canvas.width, this.canvas.height) * 0.4;
        
        for (let i = 0; i < numShapes; i++) {
            const angle = (i / numShapes) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius - 25;
            const y = centerY + Math.sin(angle) * radius - 25;
            
            this.drawShape('circle', x, y, 50, 50);
        }
    }
    
    /**
     * Start animation of shapes
     */
    startAnimation() {
        // Stop any existing animation
        this.stopAnimation();
        
        // Create some initial shapes if none exist
        if (this.shapes.length === 0) {
            this.drawPattern('random');
        }
        
        // Animation variables
        const speeds = this.shapes.map(() => ({
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2
        }));
        
        // Animation function
        const animate = () => {
            this.clear();
            
            // Update and draw each shape
            for (let i = 0; i < this.shapes.length; i++) {
                const shape = this.shapes[i];
                
                // Update position
                shape.x += speeds[i].x;
                shape.y += speeds[i].y;
                
                // Bounce off edges
                if (shape.x < 0 || shape.x + shape.width > this.canvas.width) {
                    speeds[i].x *= -1;
                }
                if (shape.y < 0 || shape.y + shape.height > this.canvas.height) {
                    speeds[i].y *= -1;
                }
                
                // Draw shape
                this.ctx.save();
                this.ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
                this.ctx.shadowBlur = 10;
                this.ctx.fillStyle = `rgb(0, ${Math.floor(shape.color * 255)}, 0)`;
                
                switch(shape.type) {
                    case 'rect':
                        this.ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
                        break;
                        
                    case 'circle':
                        this.ctx.beginPath();
                        this.ctx.arc(shape.x + shape.width/2, shape.y + shape.height/2, 
                                     Math.min(shape.width, shape.height)/2, 0, Math.PI * 2);
                        this.ctx.fill();
                        break;
                        
                    case 'triangle':
                        this.ctx.beginPath();
                        this.ctx.moveTo(shape.x + shape.width/2, shape.y);
                        this.ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
                        this.ctx.lineTo(shape.x, shape.y + shape.height);
                        this.ctx.closePath();
                        this.ctx.fill();
                        break;
                }
                
                this.ctx.restore();
            }
            
            // Continue animation
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        // Start animation
        this.animationFrameId = requestAnimationFrame(animate);
        terminal.addOutput('[INFO] Shape animation started');
        
        return true;
    }
    
    /**
     * Stop animation
     */
    stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            terminal.addOutput('[INFO] Shape animation stopped');
            return true;
        }
        return false;
    }
    
    /**
     * Render the current shapes
     */
    render() {
        this.clear();
        
        // Redraw all shapes
        for (const shape of this.shapes) {
            this.ctx.save();
            this.ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = `rgb(0, ${Math.floor(shape.color * 255)}, 0)`;
            
            switch(shape.type) {
                case 'rect':
                    this.ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
                    break;
                    
                case 'circle':
                    this.ctx.beginPath();
                    this.ctx.arc(shape.x + shape.width/2, shape.y + shape.height/2, 
                                 Math.min(shape.width, shape.height)/2, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                    
                case 'triangle':
                    this.ctx.beginPath();
                    this.ctx.moveTo(shape.x + shape.width/2, shape.y);
                    this.ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
                    this.ctx.lineTo(shape.x, shape.y + shape.height);
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
            }
            
            this.ctx.restore();
        }
        
        return this;
    }
}

// Export for module system
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = ShapeModule;
}