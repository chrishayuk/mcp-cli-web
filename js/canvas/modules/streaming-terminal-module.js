/**
 * Streaming Terminal Module (WASM Version)
 * A terminal emulator powered by WebAssembly for maximum performance
 */
class StreamingTerminalModule extends CanvasModule {
    constructor() {
        super();
        console.log('Terminal Module constructed');
        
        // Terminal state and display settings
        this.connected = false;
        this.connection = null;
        this.rows = 24;
        this.cols = 80;
        this.charWidth = 9;
        this.charHeight = 16;
        this.fontSize = 14;
        this.fontFamily = 'Consolas, "Courier New", monospace';
        this.textColor = '#00FF00';
        this.bgColor = 'rgba(0, 0, 0, 0.85)';
        this.cursorColor = '#FFFFFF';

        // WASM bridge
        this.wasmBridge = new WasmTerminalBridge();
        
        // Track WASM availability
        this.wasmAvailable = true;
        
        // Terminal buffer and cursor state
        this.terminalBuffer = [];
        this.cursorX = 0;
        this.cursorY = 0;
        this.cursorVisible = true;
        this.cursorBlinkInterval = null;
        
        // Input handling
        this.inputOverlay = null;
        this.inputElement = null;
        this.statusIndicator = null;
        this.directInputEnabled = false;
        
        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handlePaste = this.handlePaste.bind(this);
        this.initTerminalBuffer = this.initTerminalBuffer.bind(this);

        // Initialize terminal buffer
        this.initTerminalBuffer();
    }
    
    initTerminalBuffer() {
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
    
    async init(canvas, ctx, manager) {
        super.init(canvas, ctx, manager);
        this.supportedCommands = ['connect', 'disconnect', 'send', 'clear', 'resize'];
        this.calculateDimensions();
        this.initTerminalBuffer();
        
        try {
            // Set a timeout to prevent hangs during WASM initialization
            const wasmPromise = this.wasmBridge.initialize('js/canvas/modules/terminal.wasm');
            
            // Add timeout for WASM loading
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('WASM loading timed out')), 5000);
            });
            
            // Race the promises
            await Promise.race([wasmPromise, timeoutPromise]);
            
            // Check if initialization actually succeeded by testing if wasmExports exists
            if (!this.wasmBridge.wasmExports) {
                throw new Error('WASM bridge exports not available after initialization');
            }
            
            // Verify memory size is adequate
            const memorySize = this.wasmBridge.wasmExports.memory?.buffer?.byteLength || 0;
            console.log(`WASM memory size: ${memorySize} bytes`);
            
            if (memorySize < 1048576) { // 1MB minimum
                console.warn('WASM memory size may be too small for terminal operations');
            }
            
            // Verify essential exports exist based on what the AssemblyScript actually provides
            if (!this.wasmBridge.wasmExports.getTerminalState || 
                !this.wasmBridge.wasmExports.processCommand || 
                !this.wasmBridge.wasmExports.getPreviousCommand || 
                !this.wasmBridge.wasmExports.getNextCommand) {
                throw new Error('Required WASM exports are missing');
            }
            
            this.manager?.updateCanvasStatus('success', 'WASM terminal ready');
            console.log('WASM module loaded successfully');
        } catch (error) {
            console.error('Error initializing WASM:', error);
            this.manager?.updateCanvasStatus('error', 'WASM initialization failed');
            
            // Create a fallback plain terminal for display purposes only
            this.initFallbackTerminal();
            
            // Mark WASM as unavailable
            this.wasmAvailable = false;
            
            // Don't throw - allow the application to continue with limited functionality
            console.warn('Running in limited functionality mode - WASM features unavailable');
        }
        
        return this;
    }

    renderTerminalState(state) {
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!state) {
            // Draw error state
            this.ctx.fillStyle = this.textColor;
            this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
            this.ctx.textBaseline = 'top';
            this.ctx.fillText('Terminal Ready', 10, 10);
            return;
        }
        
        try {
            let terminalState;
            
            if (typeof state === 'string') {
                try {
                    // Try to parse as JSON first
                    terminalState = JSON.parse(state);
                } catch (e) {
                    // If not valid JSON, it might be the string format from the AssemblyScript code
                    // Parse the formatted string to extract relevant information
                    const lines = state.split(/\r?\n/);
                    const parsedState = { cells: [] };
                    
                    // Create a cursor at position 0,0
                    parsedState.cursor = { x: 0, y: 0, visible: true };
                    
                    // Parse lines into cells
                    for (let y = 0; y < lines.length && y < this.rows; y++) {
                        const line = lines[y];
                        for (let x = 0; x < line.length && x < this.cols; x++) {
                            parsedState.cells.push({
                                x,
                                y,
                                char: line[x],
                                fgColor: this.textColor,
                                bgColor: this.bgColor,
                                bold: false,
                                italic: false,
                                underline: false
                            });
                        }
                    }
                    
                    terminalState = parsedState;
                }
            } else {
                terminalState = state;
            }
            
            // If the state doesn't have cells array, try to create one
            if (!terminalState.cells || !Array.isArray(terminalState.cells)) {
                terminalState.cells = [];
                
                // If we have a text description from the AssemblyScript module
                if (terminalState.text || (typeof state === 'string' && state.length > 0)) {
                    const text = terminalState.text || state;
                    const lines = text.split(/\r?\n/);
                    
                    for (let y = 0; y < lines.length && y < this.rows; y++) {
                        const line = lines[y];
                        for (let x = 0; x < line.length && x < this.cols; x++) {
                            terminalState.cells.push({
                                x,
                                y,
                                char: line[x],
                                fgColor: this.textColor,
                                bgColor: this.bgColor,
                                bold: false,
                                italic: false,
                                underline: false
                            });
                        }
                    }
                }
            }
            
            // Make sure cursor exists
            if (!terminalState.cursor) {
                terminalState.cursor = { x: 0, y: 0, visible: true };
            }
            
            // Render cells
            if (terminalState.cells && Array.isArray(terminalState.cells)) {
                // Only draw the first 2000 cells to prevent performance issues
                const cellsToDraw = terminalState.cells.slice(0, 2000);
                
                for (let i = 0; i < cellsToDraw.length; i++) {
                    const cell = cellsToDraw[i];
                    
                    // Skip invalid cells
                    if (!cell || typeof cell.x !== 'number' || typeof cell.y !== 'number') {
                        continue;
                    }
                    
                    const x = cell.x, y = cell.y;
                    
                    // Skip out of bounds cells
                    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) {
                        continue;
                    }
                    
                    if (cell.bgColor && cell.bgColor !== this.bgColor) {
                        this.ctx.fillStyle = cell.bgColor;
                        this.ctx.fillRect(x * this.charWidth, y * this.charHeight, this.charWidth, this.charHeight);
                    }
                    
                    if (!cell.char || cell.char === ' ') continue;
                    
                    this.ctx.fillStyle = cell.fgColor || this.textColor;
                    let fontStyle = '';
                    if (cell.bold) fontStyle += 'bold ';
                    if (cell.italic) fontStyle += 'italic ';
                    this.ctx.font = `${fontStyle}${this.fontSize}px ${this.fontFamily}`;
                    this.ctx.textBaseline = 'top';
                    this.ctx.fillText(cell.char, x * this.charWidth, y * this.charHeight);
                    
                    if (cell.underline) {
                        this.ctx.fillRect(x * this.charWidth, (y + 1) * this.charHeight - 2, this.charWidth, 1);
                    }
                }
            }
            
            // Render cursor
            if (terminalState.cursor && terminalState.cursor.visible) {
                const x = terminalState.cursor.x, y = terminalState.cursor.y;
                
                // Skip out of bounds cursor
                if (x >= 0 && y >= 0 && x < this.cols && y < this.rows) {
                    this.ctx.fillStyle = this.cursorColor;
                    this.ctx.fillRect(x * this.charWidth, y * this.charHeight, this.charWidth, this.charHeight);
                    
                    if (terminalState.cells && Array.isArray(terminalState.cells)) {
                        const cursorCell = terminalState.cells.find(cell => cell && cell.x === x && cell.y === y);
                        if (cursorCell && cursorCell.char && cursorCell.char !== ' ') {
                            this.ctx.fillStyle = cursorCell.bgColor || this.bgColor;
                            this.ctx.fillText(cursorCell.char, x * this.charWidth, y * this.charHeight);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error rendering terminal state:', error);
            
            // Show error message in terminal
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
            this.ctx.textBaseline = 'top';
            this.ctx.fillText('Terminal Error - Check Console', 10, 10);
        }
    }
    
    calculateDimensions() {
        this.cols = Math.floor(this.canvas.width / this.charWidth);
        this.rows = Math.floor(this.canvas.height / this.charHeight);
    }
    
    handleCommand(command, args) {
        console.log(`Terminal.handleCommand: ${command}, args:`, args);
        
        // If WASM is not available, we can only handle limited commands
        if (!this.wasmAvailable) {
            if (command === 'status') {
                console.log("Terminal status: Fallback mode (WASM unavailable)");
                this.updateStatus('error', 'Fallback mode - Limited functionality');
                return true;
            }
            console.warn(`Command '${command}' unavailable in fallback mode`);
            this.updateStatus('error', 'Command unavailable in fallback mode');
            return false;
        }
        
        switch(command) {
            case 'connect':
                if (args && args.length >= 1) {
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
                if (this.wasmBridge.wasmExports && this.wasmBridge.wasmExports.processCommand) {
                    this.wasmBridge.wasmExports.processCommand(this.wasmBridge.allocateString("clear"));
                    this.render();
                    return true;
                }
                return false;
            case 'resize':
                if (args && args.length >= 2) {
                    const cols = parseInt(args[0]);
                    const rows = parseInt(args[1]);
                    if (!isNaN(cols) && !isNaN(rows)) {
                        if (this.wasmBridge.wasmExports && this.wasmBridge.wasmExports.resizeTerminal) {
                            this.wasmBridge.wasmExports.resizeTerminal(cols, rows);
                            this.cols = cols;
                            this.rows = rows;
                            this.render();
                            return true;
                        }
                    }
                }
                return false;
            case 'status':
                console.log("Terminal status: " + (this.connected ? "Connected" : "Disconnected"));
                this.updateStatus(this.connected ? 'connected' : 'disconnected', 
                                 this.connected ? 'Connected' : 'Disconnected');
                return true;
            default:
                if (this.wasmBridge.processCommand) {
                    const commandStr = `${command} ${args.join(' ')}`.trim();
                    return this.wasmBridge.processCommand(commandStr);
                }
                return false;
        }
    }
    
    activate() {
        super.activate();
        this.manager?.updateCanvasStatus('success', 'Terminal Active');
        this.enableDirectInput();
        
        // Always render when activated to show current state
        this.render();
        
        // Ensure input is focused when activated
        if (this.inputElement) {
            setTimeout(() => {
                this.inputElement.focus();
                this.inputElement.click();
            }, 100);
        }
        
        return this;
    }
    
    deactivate() {
        if (this.connected) {
            this.disconnect();
        }
        this.disableDirectInput();
        return super.deactivate();
    }
    
    enableDirectInput() {
        if (this.directInputEnabled) return;
        console.log('Enabling direct terminal input...');
        try {
            const canvasContainer = this.canvas.parentElement;
            if (!canvasContainer) {
                console.error('Canvas container not found');
                return;
            }
            
            // Create a visible command line at the bottom of the terminal
            this.commandLine = document.createElement('div');
            this.commandLine.className = 'terminal-command-line';
            this.commandLine.style.cssText = `
                position: absolute;
                bottom: 30px;
                left: 10px;
                right: 10px;
                height: 24px;
                background: rgba(0, 0, 0, 0.8);
                color: #0f0;
                padding: 2px 5px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 14px;
                z-index: 102;
                display: flex;
                align-items: center;
            `;
            
            // Add prompt
            const promptSpan = document.createElement('span');
            promptSpan.textContent = '> ';
            promptSpan.style.color = '#0f0';
            promptSpan.style.marginRight = '5px';
            this.commandLine.appendChild(promptSpan);
            
            // Add visible input
            this.visibleInput = document.createElement('span');
            this.visibleInput.textContent = '';
            this.visibleInput.style.color = '#fff';
            this.commandLine.appendChild(this.visibleInput);
            
            // Add blinking cursor
            this.cursor = document.createElement('span');
            this.cursor.textContent = '█';
            this.cursor.style.color = '#fff';
            this.cursor.style.animation = 'blink 1s step-end infinite';
            this.commandLine.appendChild(this.cursor);
            
            // Add style for cursor blinking
            const style = document.createElement('style');
            style.textContent = `
                @keyframes blink {
                    0% { opacity: 1; }
                    50% { opacity: 0; }
                    100% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            
            // Overlay for capturing clicks
            this.inputOverlay = document.createElement('div');
            this.inputOverlay.className = 'terminal-input-overlay';
            this.inputOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
                cursor: text;
                z-index: 100;
            `;
            
            // Hidden input element for capturing keystrokes
            this.inputElement = document.createElement('input');
            this.inputElement.className = 'terminal-direct-input';
            this.inputElement.type = 'text';
            this.inputElement.autocomplete = 'off';
            this.inputElement.autocorrect = 'off';
            this.inputElement.autocapitalize = 'off';
            this.inputElement.spellcheck = false;
            this.inputElement.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0;
                background: transparent;
                border: none;
                outline: none;
                padding: 0;
                margin: 0;
                z-index: 101;
                caret-color: transparent;
                color: transparent;
                font-family: monospace;
            `;
            
            this.statusIndicator = document.createElement('div');
            this.statusIndicator.className = 'terminal-status';
            this.statusIndicator.textContent = 'Terminal Ready';
            this.statusIndicator.style.cssText = `
                position: absolute;
                bottom: 5px;
                right: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: #0f0;
                padding: 2px 6px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 10px;
                z-index: 102;
            `;
            
            // Event listener for clicking in the terminal
            this.inputOverlay.addEventListener('click', () => {
                console.log('Input overlay clicked, focusing input');
                this.inputElement.focus();
            });
            
            // Event listener for key input
            this.inputElement.addEventListener('input', (e) => {
                // Update visible text
                this.visibleInput.textContent = this.inputElement.value;
            });
            
            // Handle special keys
            this.inputElement.addEventListener('keydown', (e) => {
                // Handle Enter to process command
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const command = this.inputElement.value;
                    console.log('Processing command:', command);
                    
                    if (command && command.trim()) {
                        if (this.wasmAvailable) {
                            this.wasmBridge.processCommand(command);
                        } else {
                            console.log('Command entered (no WASM):', command);
                        }
                    }
                    
                    // Clear input
                    this.inputElement.value = '';
                    this.visibleInput.textContent = '';
                    
                    // Ensure terminal renders updated state
                    setTimeout(() => this.render(), 10);
                    return;
                }
                
                // Handle Backspace (special case since input event doesn't capture it)
                if (e.key === 'Backspace') {
                    // Let the native handling occur, then update visible input
                    setTimeout(() => {
                        this.visibleInput.textContent = this.inputElement.value;
                    }, 0);
                }
                
                // Handle Up/Down for command history
                if (e.key === 'ArrowUp' && this.wasmAvailable) {
                    e.preventDefault();
                    const prevCmd = this.getPreviousCommand();
                    if (prevCmd) {
                        this.inputElement.value = prevCmd;
                        this.visibleInput.textContent = prevCmd;
                    }
                    return;
                }
                
                if (e.key === 'ArrowDown' && this.wasmAvailable) {
                    e.preventDefault();
                    const nextCmd = this.getNextCommand();
                    if (nextCmd !== undefined) {
                        this.inputElement.value = nextCmd;
                        this.visibleInput.textContent = nextCmd;
                    } else {
                        this.inputElement.value = '';
                        this.visibleInput.textContent = '';
                    }
                    return;
                }
            });
            
            // Add elements to container
            canvasContainer.appendChild(this.inputOverlay);
            canvasContainer.appendChild(this.inputElement);
            canvasContainer.appendChild(this.commandLine);
            canvasContainer.appendChild(this.statusIndicator);
            
            this.directInputEnabled = true;
            
            // Focus input and remind about it periodically
            this.inputElement.focus();
            this.focusInterval = setInterval(() => {
                if (document.activeElement !== this.inputElement) {
                    this.inputElement.focus();
                }
            }, 1000);
            
            console.log('Direct terminal input enabled');
        } catch (error) {
            console.error('Error enabling direct input:', error);
        }
    }
    
    disableDirectInput() {
        if (!this.directInputEnabled) return;
        try {
            if (this.focusInterval) {
                clearInterval(this.focusInterval);
                this.focusInterval = null;
            }
            
            if (this.inputOverlay && this.inputOverlay.parentElement) {
                this.inputOverlay.parentElement.removeChild(this.inputOverlay);
            }
            if (this.inputElement && this.inputElement.parentElement) {
                this.inputElement.parentElement.removeChild(this.inputElement);
            }
            if (this.statusIndicator && this.statusIndicator.parentElement) {
                this.statusIndicator.parentElement.removeChild(this.statusIndicator);
            }
            if (this.commandLine && this.commandLine.parentElement) {
                this.commandLine.parentElement.removeChild(this.commandLine);
            }
            
            this.inputOverlay = null;
            this.inputElement = null;
            this.statusIndicator = null;
            this.commandLine = null;
            this.visibleInput = null;
            this.cursor = null;
            
            this.directInputEnabled = false;
            console.log('Direct terminal input disabled');
        } catch (error) {
            console.error('Error disabling direct input:', error);
        }
    }
    
    handleKeyDown(event) {
        // For special keys only
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Escape'].includes(event.key)) {
            event.preventDefault();
            
            // Get command history if arrow up/down
            if (event.key === 'ArrowUp' && this.wasmAvailable) {
                const prevCmd = this.getPreviousCommand();
                if (prevCmd) {
                    this.inputElement.value = prevCmd;
                }
                return;
            }
            
            if (event.key === 'ArrowDown' && this.wasmAvailable) {
                const nextCmd = this.getNextCommand();
                if (nextCmd !== undefined) {
                    this.inputElement.value = nextCmd;
                }
                return;
            }
            
            // Handle control key combinations
            if (event.ctrlKey && event.key.length === 1) {
                const charCode = event.key.toUpperCase().charCodeAt(0) - 64;
                if (charCode >= 1 && charCode <= 26) {
                    const ctrlChar = String.fromCharCode(charCode);
                    console.log('Ctrl key combination:', ctrlChar);
                    // Process ctrl commands here if needed
                }
            }
        }
    }
    
    handlePaste(event) {
        if (!this.connected) return;
        event.preventDefault();
        const text = (event.clipboardData || window.clipboardData).getData('text');
        if (text) {
            this.wasmBridge.processCommand(text);
            this.sendData(text);
            this.render();
        }
    }
    
    connect(endpoint, options = '') {
        if (this.connected) {
            console.log('Already connected, disconnecting first');
            this.disconnect();
        }
        try {
            this.connection = new WebSocket(endpoint);
            this.updateStatus('connecting', 'Connecting...');
            this.connection.onopen = () => {
                console.log('Connection established');
                if (options) { this.connection.send(options); }
                this.connected = true;
                // No direct setConnected in the WASM module, use processCommand instead
            if (this.wasmBridge.wasmExports && this.wasmBridge.wasmExports.processCommand) {
                // Notify the terminal about the connection
                this.wasmBridge.wasmExports.processCommand(this.wasmBridge.allocateString("__internal_connected"));
            }
                this.updateStatus('connected', 'Connected');
                this.manager?.updateCanvasStatus('success', 'Connected');
                if (this.inputElement) { this.inputElement.focus(); }
                this.wasmBridge.processCommand('help');
            };
            this.connection.onmessage = (event) => {
                this.wasmBridge.processWebSocketMessage(event.data);
                this.render();
            };
            this.connection.onclose = (event) => {
                console.log('Connection closed', event);
                this.connected = false;
                this.connection = null;
                // No direct setConnected in the WASM module, use processCommand instead
            if (this.wasmBridge.wasmExports && this.wasmBridge.wasmExports.processCommand) {
                // Notify the terminal about the disconnection
                this.wasmBridge.wasmExports.processCommand(this.wasmBridge.allocateString("__internal_disconnected"));
            }
                this.updateStatus('disconnected', 'Disconnected');
                this.manager?.updateCanvasStatus('info', 'Disconnected');
            };
            this.connection.onerror = (error) => {
                console.error('Connection error:', error);
                this.updateStatus('error', 'Connection Error');
                this.manager?.updateCanvasStatus('error', 'Connection error');
            };
            return true;
        } catch (error) {
            console.error('Error connecting:', error);
            this.updateStatus('error', `Error: ${error.message}`);
            this.manager?.updateCanvasStatus('error', `Error: ${error.message}`);
            return false;
        }
    }
    
    disconnect() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        this.connected = false;
        if (this.wasmBridge.wasmExports && this.wasmBridge.wasmExports.setConnected) {
            this.wasmBridge.wasmExports.setConnected(0);
        }
        this.updateStatus('disconnected', 'Disconnected');
        this.manager?.updateCanvasStatus('info', 'Disconnected');
        return true;
    }
    
    updateStatus(status, message) {
        if (this.statusIndicator) {
            this.statusIndicator.textContent = message || status;
            switch (status) {
                case 'connected': this.statusIndicator.style.color = '#00ff00'; break;
                case 'disconnected': this.statusIndicator.style.color = '#ff0000'; break;
                case 'connecting': this.statusIndicator.style.color = '#ffff00'; break;
                case 'error': this.statusIndicator.style.color = '#ff5500'; break;
                default: this.statusIndicator.style.color = '#ffffff';
            }
        }
    }
    
    sendData(data) {
        if (!this.connected || !this.connection) return false;
        try {
            this.connection.send(data);
            return true;
        } catch (error) {
            console.error('Error sending data:', error);
            return false;
        }
    }
    
    render() {
        if (!this.ctx) return this;
        this.clear();
        
        if (this.wasmAvailable) {
            const state = this.getTerminalState();
            this.renderTerminalState(state);
        } else {
            this.renderFallbackTerminal();
        }
        
        // When rendering completes, make sure the input element is in focus
        if (this.inputElement) {
            setTimeout(() => this.inputElement.focus(), 0);
        }
        
        return this;
    }
    
    // Helper methods for WASM communication
    getPreviousCommand() {
        if (!this.wasmBridge.wasmExports) return "";
        try {
            const ptr = this.wasmBridge.wasmExports.getPreviousCommand();
            return ptr ? this.wasmBridge.getString(ptr) : "";
        } catch (error) {
            console.error("Error getting previous command:", error);
            return "";
        }
    }
    
    getNextCommand() {
        if (!this.wasmBridge.wasmExports) return "";
        try {
            const ptr = this.wasmBridge.wasmExports.getNextCommand();
            return ptr ? this.wasmBridge.getString(ptr) : "";
        } catch (error) {
            console.error("Error getting next command:", error);
            return "";
        }
    }
    
    getTerminalState() {
        if (!this.wasmAvailable || !this.wasmBridge.wasmExports) {
            console.error("WASM module not loaded or not available");
            return null;
        }
        
        try {
            const ptr = this.wasmBridge.wasmExports.getTerminalState();
            if (!ptr) return null;
            
            // Get raw string from WASM
            const rawState = this.wasmBridge.getString(ptr);
            
            // Try to convert it to proper terminal state
            try {
                // First, try to parse as JSON
                return JSON.parse(rawState);
            } catch (parseError) {
                // If not valid JSON, return raw string for custom parsing
                return rawState;
            }
        } catch (error) {
            console.error("Error getting terminal state:", error);
            return null;
        }
    }
    
    initFallbackTerminal() {
        // Set up a simple fallback terminal state
        this.fallbackBuffer = [];
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
            this.fallbackBuffer.push(row);
        }
        
        // Add a message to the fallback terminal
        const message = "Terminal in fallback mode - WASM features disabled";
        for (let i = 0; i < message.length && i < this.cols; i++) {
            this.fallbackBuffer[1][i + 2].char = message.charAt(i);
        }
    }
    
    renderFallbackTerminal() {
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render the fallback buffer
        if (this.fallbackBuffer) {
            for (let y = 0; y < this.fallbackBuffer.length; y++) {
                for (let x = 0; x < this.fallbackBuffer[y].length; x++) {
                    const cell = this.fallbackBuffer[y][x];
                    
                    if (cell.bgColor && cell.bgColor !== this.bgColor) {
                        this.ctx.fillStyle = cell.bgColor;
                        this.ctx.fillRect(x * this.charWidth, y * this.charHeight, 
                                         this.charWidth, this.charHeight);
                    }
                    
                    if (!cell.char || cell.char === ' ') continue;
                    
                    this.ctx.fillStyle = cell.fg;
                    let fontStyle = '';
                    if (cell.bold) fontStyle += 'bold ';
                    if (cell.italic) fontStyle += 'italic ';
                    this.ctx.font = `${fontStyle}${this.fontSize}px ${this.fontFamily}`;
                    this.ctx.textBaseline = 'top';
                    this.ctx.fillText(cell.char, x * this.charWidth, y * this.charHeight);
                    
                    if (cell.underline) {
                        this.ctx.fillRect(x * this.charWidth, 
                                         (y + 1) * this.charHeight - 2, 
                                         this.charWidth, 1);
                    }
                }
            }
        } else {
            // If no fallback buffer is available, just show a message
            this.ctx.fillStyle = this.textColor;
            this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
            this.ctx.textBaseline = 'top';
            this.ctx.fillText("Terminal in fallback mode - WASM features disabled", 10, 20);
        }
    }
}

// Make StreamingTerminalModule globally available
if (typeof window !== 'undefined') {
    window.StreamingTerminalModule = StreamingTerminalModule;
    console.log('StreamingTerminalModule registered globally');
}