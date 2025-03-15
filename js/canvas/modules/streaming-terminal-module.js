/**
 * Streaming Terminal Module
 * A generic terminal emulator that handles streaming text I/O from any backend
 */
class StreamingTerminalModule extends CanvasModule {
    constructor() {
        super();
        
        // Check if properly extended
        if (typeof CanvasModule === 'undefined') {
            console.error('CanvasModule not found! Terminal module may not function correctly.');
        }
        
        console.log('StreamingTerminalModule constructed');
        
        // Terminal state
        this.connected = false;
        this.connection = null;
        this.inputBuffer = '';
        this.cursorVisible = true;
        this.cursorX = 0;
        this.cursorY = 0;
        this.cursorBlinkInterval = null;
        
        // Terminal display settings
        this.rows = 24;
        this.cols = 80;
        this.charWidth = 9;
        this.charHeight = 16;
        this.fontSize = 14;
        this.fontFamily = 'Consolas, "Courier New", monospace';
        this.textColor = '#00FF00';
        this.bgColor = 'rgba(0, 0, 0, 0.85)';
        this.cursorColor = '#FFFFFF';
        
        // Terminal buffer (2D array of characters with attributes)
        this.terminalBuffer = [];
        this.initializeBuffer();
        
        // Terminal history (for scrollback)
        this.terminalHistory = [];
        this.historyPosition = 0;
        this.maxHistoryLines = 1000;
        
        // ANSI state
        this.ansiState = {
            escapeSequence: false,
            controlSequence: false,
            buffer: '',
            currentFgColor: this.textColor,
            currentBgColor: this.bgColor,
            bold: false,
            italic: false,
            underline: false
        };
        
        // Key event handlers
        this.keyDownHandler = this.handleKeyDown.bind(this);
        this.pasteHandler = this.handlePaste.bind(this);
        
        // Connection handlers - these should be overridden for specific protocols
        this.connectionHandlers = {
            onData: (data) => this.processTerminalData(data),
            onConnect: () => {
                this.connected = true;
                this.writeToTerminal('Connected\r\n');
                this.manager.updateCanvasStatus('success', 'Connected');
            },
            onDisconnect: (reason) => {
                this.connected = false;
                this.writeToTerminal(`Disconnected: ${reason}\r\n`);
                this.manager.updateCanvasStatus('info', 'Disconnected');
            },
            onError: (error) => {
                this.writeToTerminal(`Error: ${error}\r\n`);
                this.manager.updateCanvasStatus('error', error);
            }
        };
    }
    
    /**
     * Initialize terminal buffer
     */
    initializeBuffer() {
        this.terminalBuffer = [];
        for (let y = 0; y < this.rows; y++) {
            const row = [];
            for (let x = 0; x < this.cols; x++) {
                row.push({
                    char: ' ',
                    fg: this.textColor,
                    bg: this.bgColor,
                    bold: false,
                    italic: false,
                    underline: false
                });
            }
            this.terminalBuffer.push(row);
        }
    }
    
    /**
     * Initialize module
     */
    init(canvas, ctx, manager) {
        super.init(canvas, ctx, manager);
        this.supportedCommands = ['connect', 'disconnect', 'send', 'clear', 'resize'];
        
        // Calculate dimensions based on canvas size
        this.calculateDimensions();
        
        return this;
    }
    
    /**
     * Calculate terminal dimensions based on canvas size
     */
    calculateDimensions() {
        // Determine how many rows/columns fit in the canvas
        this.cols = Math.floor(this.canvas.width / this.charWidth);
        this.rows = Math.floor(this.canvas.height / this.charHeight);
        
        // Re-initialize buffer with new dimensions
        this.initializeBuffer();
    }
    
    /**
     * Activate module
     */
    activate() {
        super.activate();
        this.manager.updateCanvasStatus('success', 'Terminal Module Active');
        
        // Start cursor blinking
        this.startCursorBlink();
        
        // Add key event listeners
        window.addEventListener('keydown', this.keyDownHandler);
        window.addEventListener('paste', this.pasteHandler);
        
        return this;
    }
    
    /**
     * Deactivate module
     */
    deactivate() {
        // Remove event listeners when module is deactivated
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('paste', this.pasteHandler);
        
        // Stop cursor blinking
        this.stopCursorBlink();
        
        return super.deactivate();
    }
    
    /**
     * Handle commands for this module
     * @param {string} command - Command to handle
     * @param {Array} args - Command arguments
     */
    handleCommand(command, args) {
        console.log(`StreamingTerminalModule.handleCommand called with command: ${command}, args:`, args);
        
        switch(command) {
            case 'connect':
                if (args && args.length >= 1) {
                    // The first arg is the connection URL/endpoint
                    // Additional args can be passed as connection options
                    const endpoint = args[0];
                    const options = args.length > 1 ? args.slice(1).join(' ') : '';
                    return this.connect(endpoint, options);
                }
                return false;
                
            case 'disconnect':
                return this.disconnect();
                
            case 'send':
                if (args && args.length > 0) {
                    const data = args.join(' ');
                    return this.sendData(data);
                }
                return false;
                
            case 'clear':
                this.clearTerminal();
                return true;
                
            case 'resize':
                if (args && args.length >= 2) {
                    const cols = parseInt(args[0]);
                    const rows = parseInt(args[1]);
                    if (!isNaN(cols) && !isNaN(rows)) {
                        this.resizeTerminal(cols, rows);
                        return true;
                    }
                }
                return false;
                
            default:
                console.error(`Unknown command for StreamingTerminalModule: ${command}`);
                return false;
        }
    }
    
    /**
     * Connect to a terminal server endpoint
     * This implementation uses WebSocket but could be adapted for other protocols
     * @param {string} endpoint - WebSocket endpoint URL
     * @param {string} options - Connection options (protocol-specific)
     */
    connect(endpoint, options = '') {
        if (this.connected) {
            console.log('Already connected, disconnecting first');
            this.disconnect();
        }
        
        this.clearTerminal();
        this.writeToTerminal(`Connecting to ${endpoint}...\r\n`);
        
        try {
            // Create WebSocket connection
            this.connection = new WebSocket(endpoint);
            
            // Set up event handlers
            this.connection.onopen = () => {
                console.log('Connection established');
                
                // Send connection options if provided
                if (options) {
                    this.connection.send(options);
                }
                
                this.connectionHandlers.onConnect();
                this.render();
            };
            
            this.connection.onmessage = (event) => {
                // Process incoming data
                const data = event.data;
                
                if (typeof data === 'string') {
                    this.connectionHandlers.onData(data);
                } else if (data instanceof Blob) {
                    // Handle binary data by converting to text
                    const reader = new FileReader();
                    reader.onload = () => {
                        this.connectionHandlers.onData(reader.result);
                    };
                    reader.readAsText(data);
                }
                
                this.render();
            };
            
            this.connection.onclose = (event) => {
                console.log('Connection closed', event);
                this.connectionHandlers.onDisconnect(event.reason || 'Connection closed');
                this.connection = null;
                this.render();
            };
            
            this.connection.onerror = (error) => {
                console.error('Connection error:', error);
                this.connectionHandlers.onError(error.message || 'Connection error');
                this.render();
            };
            
            return true;
        } catch (error) {
            console.error('Error connecting:', error);
            this.writeToTerminal(`Error connecting: ${error.message}\r\n`);
            this.manager.updateCanvasStatus('error', `Error: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Connect using a custom connection adapter
     * @param {Object} adapter - Connection adapter with methods: connect, disconnect, send
     * @param {Object} options - Connection options
     */
    connectWithAdapter(adapter, options = {}) {
        if (this.connected) {
            console.log('Already connected, disconnecting first');
            this.disconnect();
        }
        
        this.clearTerminal();
        this.writeToTerminal(`Connecting using custom adapter...\r\n`);
        
        try {
            // Store the adapter as our connection
            this.connection = adapter;
            
            // Setup adapter handlers
            adapter.onData = (data) => {
                this.connectionHandlers.onData(data);
                this.render();
            };
            
            adapter.onConnect = () => {
                this.connectionHandlers.onConnect();
                this.render();
            };
            
            adapter.onDisconnect = (reason) => {
                this.connectionHandlers.onDisconnect(reason);
                this.connection = null;
                this.render();
            };
            
            adapter.onError = (error) => {
                this.connectionHandlers.onError(error);
                this.render();
            };
            
            // Connect using the adapter
            adapter.connect(options);
            
            return true;
        } catch (error) {
            console.error('Error connecting with adapter:', error);
            this.writeToTerminal(`Error connecting: ${error.message}\r\n`);
            this.manager.updateCanvasStatus('error', `Error: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Disconnect from the terminal server
     */
    disconnect() {
        if (this.connection) {
            // Close the connection
            if (typeof this.connection.close === 'function') {
                // WebSocket style
                this.connection.close();
            } else if (typeof this.connection.disconnect === 'function') {
                // Custom adapter style
                this.connection.disconnect();
            }
            
            this.connection = null;
        }
        
        this.connected = false;
        this.writeToTerminal('Disconnected\r\n');
        this.manager.updateCanvasStatus('info', 'Disconnected');
        return true;
    }
    
    /**
     * Send data to the terminal server
     * @param {string} data - Data to send
     */
    sendData(data) {
        if (!this.connected || !this.connection) {
            this.writeToTerminal('Not connected\r\n');
            return false;
        }
        
        try {
            // Send data through the connection
            if (typeof this.connection.send === 'function') {
                this.connection.send(data);
            }
            
            return true;
        } catch (error) {
            console.error('Error sending data:', error);
            this.writeToTerminal(`Error sending data: ${error.message}\r\n`);
            return false;
        }
    }
    
    /**
     * Process terminal data with ANSI escape sequence support
     * @param {string} data - Terminal data
     */
    processTerminalData(data) {
        for (let i = 0; i < data.length; i++) {
            const char = data[i];
            
            // Handle ANSI escape sequences
            if (this.ansiState.escapeSequence) {
                if (this.ansiState.controlSequence) {
                    // Control Sequence Introducer (CSI) sequence
                    this.ansiState.buffer += char;
                    
                    // Check if this character ends the sequence
                    if ((char >= '@' && char <= '~')) {
                        this.processAnsiSequence(this.ansiState.buffer, char);
                        this.ansiState.escapeSequence = false;
                        this.ansiState.controlSequence = false;
                        this.ansiState.buffer = '';
                    }
                } else if (char === '[') {
                    // Start of CSI sequence
                    this.ansiState.controlSequence = true;
                    this.ansiState.buffer = '';
                } else {
                    // Simple escape sequence
                    this.processSimpleEscapeSequence(char);
                    this.ansiState.escapeSequence = false;
                }
                continue;
            }
            
            // Start of escape sequence
            if (char === '\x1b') {
                this.ansiState.escapeSequence = true;
                continue;
            }
            
            // Handle normal characters
            switch (char) {
                case '\r':
                    // Carriage return
                    this.cursorX = 0;
                    break;
                    
                case '\n':
                    // Line feed
                    this.cursorY++;
                    if (this.cursorY >= this.rows) {
                        this.scrollUp();
                        this.cursorY = this.rows - 1;
                    }
                    break;
                    
                case '\b':
                    // Backspace
                    if (this.cursorX > 0) {
                        this.cursorX--;
                    }
                    break;
                    
                case '\t':
                    // Tab (move cursor to next tab stop - every 8 columns)
                    this.cursorX = Math.floor((this.cursorX + 8) / 8) * 8;
                    if (this.cursorX >= this.cols) {
                        this.cursorX = 0;
                        this.cursorY++;
                        if (this.cursorY >= this.rows) {
                            this.scrollUp();
                            this.cursorY = this.rows - 1;
                        }
                    }
                    break;
                    
                case '\x07':
                    // Bell character - could trigger a sound or visual bell
                    break;
                    
                default:
                    // Regular character
                    if (this.cursorX >= this.cols) {
                        this.cursorX = 0;
                        this.cursorY++;
                        if (this.cursorY >= this.rows) {
                            this.scrollUp();
                            this.cursorY = this.rows - 1;
                        }
                    }
                    
                    // Write character to buffer with current attributes
                    if (this.cursorX < this.cols && this.cursorY < this.rows) {
                        this.terminalBuffer[this.cursorY][this.cursorX] = {
                            char: char,
                            fg: this.ansiState.currentFgColor,
                            bg: this.ansiState.currentBgColor,
                            bold: this.ansiState.bold,
                            italic: this.ansiState.italic,
                            underline: this.ansiState.underline
                        };
                        this.cursorX++;
                    }
                    break;
            }
        }
    }
    
    /**
     * Process ANSI Control Sequence Introducer (CSI) sequences
     * @param {string} sequence - The sequence without the ESC[ prefix
     * @param {string} terminator - The sequence terminator character
     */
    processAnsiSequence(sequence, terminator) {
        // Parse parameters
        const params = sequence.split(';').map(p => parseInt(p) || 0);
        
        switch (terminator) {
            case 'A': // Cursor Up
                this.cursorY = Math.max(0, this.cursorY - (params[0] || 1));
                break;
                
            case 'B': // Cursor Down
                this.cursorY = Math.min(this.rows - 1, this.cursorY + (params[0] || 1));
                break;
                
            case 'C': // Cursor Forward
                this.cursorX = Math.min(this.cols - 1, this.cursorX + (params[0] || 1));
                break;
                
            case 'D': // Cursor Back
                this.cursorX = Math.max(0, this.cursorX - (params[0] || 1));
                break;
                
            case 'E': // Cursor Next Line
                this.cursorY = Math.min(this.rows - 1, this.cursorY + (params[0] || 1));
                this.cursorX = 0;
                break;
                
            case 'F': // Cursor Previous Line
                this.cursorY = Math.max(0, this.cursorY - (params[0] || 1));
                this.cursorX = 0;
                break;
                
            case 'G': // Cursor Horizontal Absolute
                this.cursorX = Math.min(this.cols - 1, Math.max(0, (params[0] || 1) - 1));
                break;
                
            case 'H': // Cursor Position
            case 'f': // Horizontal and Vertical Position
                this.cursorY = Math.min(this.rows - 1, Math.max(0, (params[0] || 1) - 1));
                this.cursorX = Math.min(this.cols - 1, Math.max(0, (params[1] || 1) - 1));
                break;
                
            case 'J': // Erase in Display
                this.eraseInDisplay(params[0] || 0);
                break;
                
            case 'K': // Erase in Line
                this.eraseInLine(params[0] || 0);
                break;
                
            case 'm': // Select Graphic Rendition (SGR)
                this.processGraphicRendition(params);
                break;
                
            case 's': // Save Cursor Position
                this.savedCursorX = this.cursorX;
                this.savedCursorY = this.cursorY;
                break;
                
            case 'u': // Restore Cursor Position
                if (this.savedCursorX !== undefined && this.savedCursorY !== undefined) {
                    this.cursorX = this.savedCursorX;
                    this.cursorY = this.savedCursorY;
                }
                break;
        }
    }
    
    /**
     * Process simple escape sequences (non-CSI)
     * @param {string} char - Character after ESC
     */
    processSimpleEscapeSequence(char) {
        switch (char) {
            case 'c': // Reset terminal
                this.clearTerminal();
                this.cursorX = 0;
                this.cursorY = 0;
                this.ansiState.currentFgColor = this.textColor;
                this.ansiState.currentBgColor = this.bgColor;
                this.ansiState.bold = false;
                this.ansiState.italic = false;
                this.ansiState.underline = false;
                break;
                
            case 'D': // Index - move cursor down and scroll if needed
                this.cursorY++;
                if (this.cursorY >= this.rows) {
                    this.scrollUp();
                    this.cursorY = this.rows - 1;
                }
                break;
                
            case 'M': // Reverse Index - move cursor up and scroll if needed
                this.cursorY--;
                if (this.cursorY < 0) {
                    this.scrollDown();
                    this.cursorY = 0;
                }
                break;
                
            case 'E': // Next Line - like \r\n
                this.cursorX = 0;
                this.cursorY++;
                if (this.cursorY >= this.rows) {
                    this.scrollUp();
                    this.cursorY = this.rows - 1;
                }
                break;
                
            case '7': // Save Cursor
                this.savedCursorX = this.cursorX;
                this.savedCursorY = this.cursorY;
                break;
                
            case '8': // Restore Cursor
                if (this.savedCursorX !== undefined && this.savedCursorY !== undefined) {
                    this.cursorX = this.savedCursorX;
                    this.cursorY = this.savedCursorY;
                }
                break;
        }
    }
    
    /**
     * Process SGR (Select Graphic Rendition) parameters
     * @param {Array} params - SGR parameters
     */
    processGraphicRendition(params) {
        for (let i = 0; i < params.length; i++) {
            const param = params[i];
            
            if (param === 0) {
                // Reset all attributes
                this.ansiState.currentFgColor = this.textColor;
                this.ansiState.currentBgColor = this.bgColor;
                this.ansiState.bold = false;
                this.ansiState.italic = false;
                this.ansiState.underline = false;
            } else if (param === 1) {
                // Bold
                this.ansiState.bold = true;
            } else if (param === 3) {
                // Italic
                this.ansiState.italic = true;
            } else if (param === 4) {
                // Underline
                this.ansiState.underline = true;
            } else if (param === 22) {
                // Not bold
                this.ansiState.bold = false;
            } else if (param === 23) {
                // Not italic
                this.ansiState.italic = false;
            } else if (param === 24) {
                // Not underlined
                this.ansiState.underline = false;
            } else if (param >= 30 && param <= 37) {
                // Standard foreground color
                this.ansiState.currentFgColor = this.ansiColorToRgb(param - 30);
            } else if (param === 38 && params[i+1] === 5 && i+2 < params.length) {
                // 8-bit foreground color (256 colors)
                this.ansiState.currentFgColor = this.ansi256ToRgb(params[i+2]);
                i += 2;
            } else if (param === 38 && params[i+1] === 2 && i+4 < params.length) {
                // 24-bit foreground color (RGB)
                const r = params[i+2];
                const g = params[i+3];
                const b = params[i+4];
                this.ansiState.currentFgColor = `rgb(${r},${g},${b})`;
                i += 4;
            } else if (param >= 40 && param <= 47) {
                // Standard background color
                this.ansiState.currentBgColor = this.ansiColorToRgb(param - 40);
            } else if (param === 48 && params[i+1] === 5 && i+2 < params.length) {
                // 8-bit background color (256 colors)
                this.ansiState.currentBgColor = this.ansi256ToRgb(params[i+2]);
                i += 2;
            } else if (param === 48 && params[i+1] === 2 && i+4 < params.length) {
                // 24-bit background color (RGB)
                const r = params[i+2];
                const g = params[i+3];
                const b = params[i+4];
                this.ansiState.currentBgColor = `rgb(${r},${g},${b})`;
                i += 4;
            } else if (param === 39) {
                // Default foreground color
                this.ansiState.currentFgColor = this.textColor;
            } else if (param === 49) {
                // Default background color
                this.ansiState.currentBgColor = this.bgColor;
            } else if (param >= 90 && param <= 97) {
                // Bright foreground color
                this.ansiState.currentFgColor = this.ansiBrightColorToRgb(param - 90);
            } else if (param >= 100 && param <= 107) {
                // Bright background color
                this.ansiState.currentBgColor = this.ansiBrightColorToRgb(param - 100);
            }
        }
    }
    
    /**
     * Convert standard ANSI color (0-7) to RGB
     * @param {number} color - ANSI color index (0-7)
     * @returns {string} RGB color string
     */
    ansiColorToRgb(color) {
        const colors = [
            'rgb(0,0,0)',        // Black
            'rgb(170,0,0)',      // Red
            'rgb(0,170,0)',      // Green
            'rgb(170,85,0)',     // Yellow
            'rgb(0,0,170)',      // Blue
            'rgb(170,0,170)',    // Magenta
            'rgb(0,170,170)',    // Cyan
            'rgb(170,170,170)'   // White
        ];
        
        return colors[color % 8];
    }
    
    /**
     * Convert bright ANSI color (0-7) to RGB
     * @param {number} color - Bright ANSI color index (0-7)
     * @returns {string} RGB color string
     */
    ansiBrightColorToRgb(color) {
        const colors = [
            'rgb(85,85,85)',      // Bright Black (Gray)
            'rgb(255,85,85)',     // Bright Red
            'rgb(85,255,85)',     // Bright Green
            'rgb(255,255,85)',    // Bright Yellow
            'rgb(85,85,255)',     // Bright Blue
            'rgb(255,85,255)',    // Bright Magenta
            'rgb(85,255,255)',    // Bright Cyan
            'rgb(255,255,255)'    // Bright White
        ];
        
        return colors[color % 8];
    }
    
    /**
     * Convert 256-color ANSI code to RGB
     * @param {number} colorIndex - 256-color index (0-255)
     * @returns {string} RGB color string
     */
    ansi256ToRgb(colorIndex) {
        colorIndex = colorIndex % 256;
        
        // Standard 16 colors (0-15)
        if (colorIndex < 16) {
            if (colorIndex < 8) {
                return this.ansiColorToRgb(colorIndex);
            } else {
                return this.ansiBrightColorToRgb(colorIndex - 8);
            }
        }
        
        // 216 colors (16-231): 6×6×6 cube
        if (colorIndex >= 16 && colorIndex <= 231) {
            const c = colorIndex - 16;
            const r = Math.floor(c / 36) * 51;
            const g = Math.floor((c % 36) / 6) * 51;
            const b = (c % 6) * 51;
            return `rgb(${r},${g},${b})`;
        }
        
        // Grayscale (232-255): from black to white
        if (colorIndex >= 232) {
            const gray = (colorIndex - 232) * 10 + 8;
            return `rgb(${gray},${gray},${gray})`;
        }
        
        // Fallback
        return 'rgb(255,255,255)';
    }
    
    /**
     * Erase in display
     * @param {number} mode - Erase mode (0=cursor to end, 1=start to cursor, 2=all, 3=all+scrollback)
     */
    eraseInDisplay(mode) {
        switch (mode) {
            case 0: // Erase from cursor to end of screen
                // Clear current line from cursor to end
                for (let x = this.cursorX; x < this.cols; x++) {
                    this.terminalBuffer[this.cursorY][x] = {
                        char: ' ',
                        fg: this.ansiState.currentFgColor,
                        bg: this.ansiState.currentBgColor,
                        bold: false,
                        italic: false,
                        underline: false
                    };
                }
                
                // Clear all lines below cursor
                for (let y = this.cursorY + 1; y < this.rows; y++) {
                    for (let x = 0; x < this.cols; x++) {
                        this.terminalBuffer[y][x] = {
                            char: ' ',
                            fg: this.ansiState.currentFgColor,
                            bg: this.ansiState.currentBgColor,
                            bold: false,
                            italic: false,
                            underline: false
                        };
                    }
                }
                break;
                
            case 1: // Erase from start of screen to cursor
                // Clear all lines above cursor
                for (let y = 0; y < this.cursorY; y++) {
                    for (let x = 0; x < this.cols; x++) {
                        this.terminalBuffer[y][x] = {
                            char: ' ',
                            fg: this.ansiState.currentFgColor,
                            bg: this.ansiState.currentBgColor,
                            bold: false,
                            italic: false,
                            underline: false
                        };
                    }
                }
                
                // Clear current line from start to cursor
                for (let x = 0; x <= this.cursorX; x++) {
                    this.terminalBuffer[this.cursorY][x] = {
                        char: ' ',
                        fg: this.ansiState.currentFgColor,
                        bg: this.ansiState.currentBgColor,
                        bold: false,
                        italic: false,
                        underline: false
                    };
                }
                break;
                
            case 2: // Erase entire screen
            case 3: // Erase entire screen and scrollback (treat same as 2)
                this.clearTerminal();
                break;
        }
    }
    
    /**
     * Erase in line
     * @param {number} mode - Erase mode (0=cursor to end, 1=start to cursor, 2=entire line)
     */
    eraseInLine(mode) {
        switch (mode) {
            case 0: // Erase from cursor to end of line
                for (let x = this.cursorX; x < this.cols; x++) {
                    this.terminalBuffer[this.cursorY][x] = {
                        char: ' ',
                        fg: this.ansiState.currentFgColor,
                        bg: this.ansiState.currentBgColor,
                        bold: false,
                        italic: false,
                        underline: false
                    };
                }
                break;
                
            case 1: // Erase from start of line to cursor
                for (let x = 0; x <= this.cursorX; x++) {
                    this.terminalBuffer[this.cursorY][x] = {
                        char: ' ',
                        fg: this.ansiState.currentFgColor,
                        bg: this.ansiState.currentBgColor,
                        bold: false,
                        italic: false,
                        underline: false
                    };
                }
                break;
                
            case 2: // Erase entire line
                for (let x = 0; x < this.cols; x++) {
                    this.terminalBuffer[this.cursorY][x] = {
                        char: ' ',
                        fg: this.ansiState.currentFgColor,
                        bg: this.ansiState.currentBgColor,
                        bold: false,
                        italic: false,
                        underline: false
                    };
                }
                break;
        }
    }
    
    /**
     * Write text to terminal
     * @param {string} text - Text to write
     */
    writeToTerminal(text) {
        this.processTerminalData(text);
        this.render();
    }
    
    /**
     * Scroll terminal buffer up
     */
    scrollUp() {
        // Add current first row to history
        if (this.terminalHistory.length >= this.maxHistoryLines) {
            this.terminalHistory.shift();
        }
        this.terminalHistory.push([...this.terminalBuffer[0]]);
        
        // Shift rows up
        for (let y = 0; y < this.rows - 1; y++) {
            this.terminalBuffer[y] = [...this.terminalBuffer[y + 1]];
        }
        
        // Clear bottom row
        for (let x = 0; x < this.cols; x++) {
            this.terminalBuffer[this.rows - 1][x] = {
                char: ' ',
                fg: this.ansiState.currentFgColor,
                bg: this.ansiState.currentBgColor,
                bold: false,
                italic: false,
                underline: false
            };
        }
    }
    
    /**
     * Scroll terminal buffer down
     */
    scrollDown() {
        // Only if we have history
        if (this.terminalHistory.length === 0) return;
        
        // Shift rows down
        for (let y = this.rows - 1; y > 0; y--) {
            this.terminalBuffer[y] = [...this.terminalBuffer[y - 1]];
        }
        
        // Get row from history
        this.terminalBuffer[0] = this.terminalHistory.pop();
    }
    
    /**
     * Clear terminal
     */
    clearTerminal() {
        this.initializeBuffer();
        this.cursorX = 0;
        this.cursorY = 0;
        this.render();
        return true;
    }
    
    /**
     * Resize terminal
     * @param {number} cols - Number of columns
     * @param {number} rows - Number of rows
     */
    resizeTerminal(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        
        // Re-initialize buffer with new dimensions
        this.initializeBuffer();
        
        // If connected, send resize info if the connection supports it
        if (this.connected && this.connection && typeof this.connection.resize === 'function') {
            this.connection.resize(cols, rows);
        }
        
        this.render();
        return true;
    }
    
    /**
     * Start cursor blinking
     */
    startCursorBlink() {
        if (!this.cursorBlinkInterval) {
            this.cursorBlinkInterval = setInterval(() => {
                this.cursorVisible = !this.cursorVisible;
                this.render();
            }, 500);
        }
    }
    
    /**
     * Stop cursor blinking
     */
    stopCursorBlink() {
        if (this.cursorBlinkInterval) {
            clearInterval(this.cursorBlinkInterval);
            this.cursorBlinkInterval = null;
            this.cursorVisible = true;
        }
    }
    
    /**
     * Handle key down events
     * @param {KeyboardEvent} event - Key event
     */
    handleKeyDown(event) {
        // Only process key events if this module is active
        if (!this.isActive) return;
        
        // Prevent default for terminal-relevant keys
        if (
            (event.key.length === 1) || // Regular keys
            (event.key === 'Enter') ||
            (event.key === 'Backspace') ||
            (event.key === 'Delete') ||
            (event.key === 'Tab') ||
            (event.key === 'Escape') ||
            (event.key.startsWith('Arrow'))
        ) {
            event.preventDefault();
            
            // Only process if connected
            if (!this.connected) return;
            
            let data = '';
            
            // Handle special keys
            switch (event.key) {
                case 'Enter':
                    data = '\r';
                    break;
                    
                case 'Backspace':
                    data = '\b';
                    break;
                    
                case 'Delete':
                    data = '\x1b[3~'; // ANSI sequence for Delete key
                    break;
                    
                case 'Tab':
                    data = '\t';
                    break;
                    
                case 'Escape':
                    data = '\x1b'; // ESC character
                    break;
                    
                case 'ArrowUp':
                    data = '\x1b[A'; // ANSI sequence for up arrow
                    break;
                    
                case 'ArrowDown':
                    data = '\x1b[B'; // ANSI sequence for down arrow
                    break;
                    
                case 'ArrowRight':
                    data = '\x1b[C'; // ANSI sequence for right arrow
                    break;
                    
                case 'ArrowLeft':
                    data = '\x1b[D'; // ANSI sequence for left arrow
                    break;
                    
                default:
                    // Regular key
                    data = event.key;
                    break;
            }
            
            // Send data to terminal
            if (data) {
                this.sendData(data);
            }
        }
        
        // Allow Ctrl+C, Ctrl+D, etc.
        if (event.ctrlKey && event.key.length === 1) {
            event.preventDefault();
            
            // Only process if connected
            if (!this.connected) return;
            
            // Convert a-z to control characters (NUL to US)
            const charCode = event.key.toUpperCase().charCodeAt(0) - 64;
            if (charCode >= 1 && charCode <= 26) {
                const controlChar = String.fromCharCode(charCode);
                
                // Send control character to terminal
                this.sendData(controlChar);
            }
        }
    }
    
    /**
     * Handle paste events
     * @param {ClipboardEvent} event - Paste event
     */
    handlePaste(event) {
        // Only process paste events if this module is active
        if (!this.isActive) return;
        
        // Get pasted text
        const pastedText = event.clipboardData.getData('text');
        
        // Only process if connected
        if (!this.connected || !pastedText) return;
        
        // Send pasted text to terminal
        this.sendData(pastedText);
        
        // Prevent default paste behavior
        event.preventDefault();
    }
    
    /**
     * Render the terminal
     */
    render() {
        if (!this.ctx) return this;
        
        this.clear();
        
        // Draw terminal background
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw terminal content
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cell = this.terminalBuffer[y][x];
                
                // Draw cell background if different from terminal background
                if (cell.bg !== this.bgColor) {
                    this.ctx.fillStyle = cell.bg;
                    this.ctx.fillRect(
                        x * this.charWidth,
                        y * this.charHeight,
                        this.charWidth,
                        this.charHeight
                    );
                }
                
                // Skip empty cells (for performance)
                if (cell.char === ' ') continue;
                
                // Draw cell character
                this.ctx.fillStyle = cell.fg;
                let fontStyle = '';
                if (cell.bold) fontStyle += 'bold ';
                if (cell.italic) fontStyle += 'italic ';
                this.ctx.font = `${fontStyle}${this.fontSize}px ${this.fontFamily}`;
                this.ctx.textBaseline = 'top';
                
                this.ctx.fillText(
                    cell.char,
                    x * this.charWidth,
                    y * this.charHeight
                );
                
                // Draw underline if needed
                if (cell.underline) {
                    this.ctx.fillRect(
                        x * this.charWidth,
                        (y + 1) * this.charHeight - 2,
                        this.charWidth,
                        1
                    );
                }
            }
        }
        
        // Draw cursor
        if (this.cursorVisible && this.cursorX < this.cols && this.cursorY < this.rows) {
            this.ctx.fillStyle = this.cursorColor;
            this.ctx.fillRect(
                this.cursorX * this.charWidth,
                this.cursorY * this.charHeight,
                this.charWidth,
                this.charHeight
            );
            
            // Draw character over cursor for better visibility
            const cell = this.terminalBuffer[this.cursorY][this.cursorX];
            if (cell.char !== ' ') {
                this.ctx.fillStyle = this.bgColor; // Inverse the color
                this.ctx.fillText(
                    cell.char,
                    this.cursorX * this.charWidth,
                    this.cursorY * this.charHeight
                );
            }
        }
        
        return this;
    }
    
    /**
     * Create a MCP (Model Context Protocol) adapter
     * @param {string} url - MCP server URL
     * @param {Object} options - Connection options
     * @returns {Object} MCP adapter
     */
    static createMCPAdapter(url, options = {}) {
        return {
            // Connection state
            socket: null,
            connected: false,
            
            // Event handlers - will be set by the terminal
            onConnect: () => {},
            onDisconnect: () => {},
            onData: (data) => {},
            onError: (error) => {},
            
            // Connect to MCP server
            connect: function(options) {
                // Create WebSocket connection
                this.socket = new WebSocket(url);
                
                // Set up event handlers
                this.socket.onopen = () => {
                    console.log('MCP connection established');
                    
                    // Send initial handshake if needed
                    if (options.initialMessage) {
                        this.socket.send(JSON.stringify({
                            type: 'init',
                            data: options.initialMessage
                        }));
                    }
                    
                    this.connected = true;
                    this.onConnect();
                };
                
                this.socket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        
                        // Process message based on type
                        switch (message.type) {
                            case 'output':
                                // Terminal output
                                this.onData(message.data);
                                break;
                                
                            case 'error':
                                // Error message
                                this.onError(message.data);
                                break;
                                
                            case 'disconnect':
                                // Server initiated disconnect
                                this.connected = false;
                                this.onDisconnect(message.data);
                                break;
                                
                            default:
                                console.log('Unknown message type:', message.type);
                                break;
                        }
                    } catch (error) {
                        // Raw data (not JSON)
                        this.onData(event.data);
                    }
                };
                
                this.socket.onclose = (event) => {
                    console.log('MCP connection closed', event);
                    this.connected = false;
                    this.onDisconnect(event.reason || 'Connection closed');
                    this.socket = null;
                };
                
                this.socket.onerror = (error) => {
                    console.error('MCP connection error:', error);
                    this.onError(error.message || 'Connection error');
                };
            },
            
            // Disconnect from MCP server
            disconnect: function() {
                if (this.socket) {
                    this.socket.close();
                    this.socket = null;
                }
                this.connected = false;
            },
            
            // Send data to MCP server
            send: function(data) {
                if (!this.connected || !this.socket) {
                    return false;
                }
                
                try {
                    // Send input as JSON
                    this.socket.send(JSON.stringify({
                        type: 'input',
                        data: data
                    }));
                    return true;
                } catch (error) {
                    console.error('Error sending data to MCP server:', error);
                    return false;
                }
            },
            
            // Send resize event to MCP server
            resize: function(cols, rows) {
                if (!this.connected || !this.socket) {
                    return false;
                }
                
                try {
                    // Send resize event
                    this.socket.send(JSON.stringify({
                        type: 'resize',
                        data: {
                            cols: cols,
                            rows: rows
                        }
                    }));
                    return true;
                } catch (error) {
                    console.error('Error sending resize event to MCP server:', error);
                    return false;
                }
            }
        };
    }
}

// Make sure StreamingTerminalModule is globally available
if (typeof window !== 'undefined') {
    window.StreamingTerminalModule = StreamingTerminalModule;
    console.log('StreamingTerminalModule registered globally');
}

// Export for module system
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = StreamingTerminalModule;
}

/**
 * Add this code to the end of your streaming-terminal-module.js file
 * This adds direct terminal input capability
 */

// Extend StreamingTerminalModule with direct input functionality
if (typeof StreamingTerminalModule !== 'undefined') {
    // Add direct input methods to the prototype
    Object.assign(StreamingTerminalModule.prototype, {
        /**
         * Enable direct terminal input
         */
        enableDirectInput: function() {
            if (this.directInputEnabled) return;
            
            // Create input overlay for direct terminal input
            const canvasContainer = document.querySelector('.canvas-container');
            
            if (!canvasContainer) {
                console.error('Canvas container not found');
                return;
            }
            
            // Create terminal input overlay
            this.terminalInputOverlay = document.createElement('div');
            this.terminalInputOverlay.className = 'terminal-input-overlay';
            this.terminalInputOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
                cursor: text;
                z-index: 10;
            `;
            
            // Add overlay to canvas container
            canvasContainer.appendChild(this.terminalInputOverlay);
            
            // Add click handler to focus on terminal
            this.terminalInputOverlay.addEventListener('click', () => {
                this.focusTerminal();
            });
            
            // Create hidden textarea for capturing input
            this.terminalInputElement = document.createElement('textarea');
            this.terminalInputElement.className = 'terminal-direct-input';
            this.terminalInputElement.style.cssText = `
                position: absolute;
                left: -9999px;
                width: 0;
                height: 0;
                opacity: 0;
            `;
            
            // Add input element to body
            document.body.appendChild(this.terminalInputElement);
            
            // Add event listeners for direct terminal input
            this.terminalInputElement.addEventListener('keydown', this.handleKeyDown.bind(this));
            this.terminalInputElement.addEventListener('paste', this.handlePaste.bind(this));
            
            // Add status indicator
            this.terminalStatusIndicator = document.createElement('div');
            this.terminalStatusIndicator.className = 'terminal-status-indicator';
            this.terminalStatusIndicator.style.cssText = `
                position: absolute;
                bottom: 10px;
                right: 10px;
                padding: 5px 10px;
                background: rgba(0, 0, 0, 0.7);
                color: #0F0;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
                z-index: 11;
            `;
            
            // Add status indicator to canvas container
            canvasContainer.appendChild(this.terminalStatusIndicator);
            this.updateStatusIndicator();
            
            this.directInputEnabled = true;
            console.log('Direct terminal input enabled');
        },
        
        /**
         * Disable direct terminal input
         */
        disableDirectInput: function() {
            if (!this.directInputEnabled) return;
            
            // Remove input overlay
            if (this.terminalInputOverlay && this.terminalInputOverlay.parentNode) {
                this.terminalInputOverlay.parentNode.removeChild(this.terminalInputOverlay);
            }
            
            // Remove input element
            if (this.terminalInputElement && this.terminalInputElement.parentNode) {
                this.terminalInputElement.parentNode.removeChild(this.terminalInputElement);
            }
            
            // Remove status indicator
            if (this.terminalStatusIndicator && this.terminalStatusIndicator.parentNode) {
                this.terminalStatusIndicator.parentNode.removeChild(this.terminalStatusIndicator);
            }
            
            this.directInputEnabled = false;
            console.log('Direct terminal input disabled');
        },
        
        /**
         * Focus on terminal input
         */
        focusTerminal: function() {
            if (!this.directInputEnabled || !this.terminalInputElement) return;
            
            // Focus on input element
            this.terminalInputElement.focus();
            
            // Show visual indicator that terminal is focused
            if (this.terminalInputOverlay) {
                this.terminalInputOverlay.style.outline = '2px solid rgba(0, 255, 0, 0.5)';
                
                // Remove outline after a short time
                setTimeout(() => {
                    if (this.terminalInputOverlay) {
                        this.terminalInputOverlay.style.outline = 'none';
                    }
                }, 300);
            }
            
            // Update status indicator
            this.updateStatusIndicator('Active');
        },
        
        /**
         * Update status indicator
         */
        updateStatusIndicator: function(status) {
            if (!this.terminalStatusIndicator) return;
            
            const connectionStatus = this.connected ? 'Connected' : 'Disconnected';
            const inputStatus = status || (document.activeElement === this.terminalInputElement ? 'Active' : 'Inactive');
            
            this.terminalStatusIndicator.innerHTML = `
                <i class="fas fa-terminal"></i> Terminal: ${connectionStatus} | Input: ${inputStatus}
            `;
            
            // Update color based on connection status
            if (this.connected) {
                this.terminalStatusIndicator.style.color = '#0F0'; // Green for connected
            } else {
                this.terminalStatusIndicator.style.color = '#F00'; // Red for disconnected
            }
        },
        
        /**
         * Override the activate method to enable direct input
         */
        activate: function() {
            const result = CanvasModule.prototype.activate.call(this);
            this.enableDirectInput();
            this.focusTerminal();
            return result;
        },
        
        /**
         * Override the deactivate method to disable direct input
         */
        deactivate: function() {
            this.disableDirectInput();
            return CanvasModule.prototype.deactivate.call(this);
        }
    });
    
    // Override the connect method to focus terminal after connection
    const originalConnect = StreamingTerminalModule.prototype.connect;
    StreamingTerminalModule.prototype.connect = function(endpoint, options) {
        const result = originalConnect.call(this, endpoint, options);
        
        // Focus terminal after connection
        if (result && this.directInputEnabled) {
            setTimeout(() => {
                this.focusTerminal();
            }, 500);
        }
        
        return result;
    };
    
    console.log('StreamingTerminalModule enhanced with direct input capability');
}

/**
 * Add this to your chat-interface.js to handle terminal commands better
 */

// Extend ChatInterface with better terminal handling
if (window.ChatInterface) {
    // Add terminal support methods
    Object.assign(window.ChatInterface, {
        // Improved terminal command execution
        executeTerminalCommand: function(action, content) {
            try {
                console.log("Directly executing terminal command:", action, content);
                
                // Direct canvas-manager manipulation for terminal
                if (window.Commands && window.Commands.canvasManager) {
                    const cm = window.Commands.canvasManager;
                    
                    try {
                        cm.activateModule('terminal');
                        console.log("Terminal module activated");
                    } catch (e) {
                        console.error("Failed to activate terminal module:", e);
                        this.addSystemMessage("⚠️ Failed to activate terminal. Please reload the page and try again.");
                        return false;
                    }
                    
                    const terminalModule = cm.getModule('terminal');
                    
                    if (!terminalModule) {
                        console.error("Terminal module not found in canvas manager");
                        this.addSystemMessage("⚠️ Terminal module not found. Please reload the page and try again.");
                        return false;
                    }
                    
                    // Call specific methods based on action
                    switch(action) {
                        case 'connect':
                            if (content) {
                                const success = terminalModule.connect(content);
                                
                                if (success) {
                                    // Hide chat side when terminal is active (optional)
                                    // document.querySelector('.terminal-window').style.display = 'none';
                                    
                                    // Focus on terminal
                                    if (typeof terminalModule.focusTerminal === 'function') {
                                        setTimeout(() => terminalModule.focusTerminal(), 500);
                                    }
                                    
                                    return true;
                                } else {
                                    this.addSystemMessage(`⚠️ Failed to connect to ${content}. Please check the URL and try again.`);
                                    return false;
                                }
                            }
                            return false;
                            
                        case 'disconnect':
                            const disconnected = terminalModule.disconnect();
                            
                            if (disconnected) {
                                // Show chat side again if it was hidden
                                // document.querySelector('.terminal-window').style.display = '';
                                
                                return true;
                            }
                            return false;
                            
                        case 'send':
                            if (content && terminalModule.connected) {
                                return terminalModule.sendData(content);
                            }
                            return false;
                            
                        case 'clear':
                            return terminalModule.clearTerminal();
                            
                        default:
                            console.error("Unknown terminal action:", action);
                            return false;
                    }
                } else {
                    console.error("Canvas manager not available");
                }
                return false;
            } catch (e) {
                console.error("Error executing terminal command:", e);
                return false;
            }
        }
    });
    
    console.log('ChatInterface enhanced with better terminal handling');
}