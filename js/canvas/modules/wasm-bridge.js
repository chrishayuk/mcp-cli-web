/**
 * WebAssembly Terminal Bridge
 * Provides interface between JavaScript and WASM terminal module
 */
class WasmTerminalBridge {
    constructor() {
        this.wasmExports = null;
        this.wasmMemory = null;
        this.wasmInstance = null;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.webSocket = null; // WebSocket connection
        
        // Initialize memory tracking
        this._memoryAllocations = [];
        this._currentHeapEnd = 1024; // Start at 1KB offset to avoid null pointers
    }
    
    /**
     * Initialize the WASM module
     * @param {string} wasmPath - Path to the WASM file
     * @returns {Promise<boolean>} - Success status
     */
    async initialize(wasmPath) {
        try {
            // Import object with the "terminal" namespace as required by the WASM module
            const importObject = {
                env: {
                    memory: new WebAssembly.Memory({ initial: 2, maximum: 10 }), // Increase memory size
                    abort: this._abort.bind(this)
                },
                // Use "terminal" namespace as expected by the compiled WASM
                terminal: {
                    // Core functions from AssemblyScript declarations
                    consoleLog: this._consoleLog.bind(this),
                    consoleError: this._consoleError.bind(this),
                    sendWebSocketMessage: this._sendWebSocketMessage.bind(this),
                    isWebSocketConnected: this._isWebSocketConnected.bind(this)
                }
            };
            
            // Fetch and instantiate the WASM module
            const response = await fetch(wasmPath);
            const bytes = await response.arrayBuffer();
            const result = await WebAssembly.instantiate(bytes, importObject);
            
            // Store module exports and memory
            this.wasmInstance = result.instance;
            this.wasmExports = result.instance.exports;
            this.wasmMemory = this.wasmExports.memory;
            
            // Initialize the terminal in WASM
            if (this.wasmExports.initTerminal) {
                this.wasmExports.initTerminal();
            }
            
            return true;
        } catch (error) {
            console.error('Failed to initialize WASM module:', error);
            return false;
        }
    }
    
    /**
     * AssemblyScript import functions
     * These functions are required by the AssemblyScript WASM module
     */
    _consoleLog(ptr) {
        const message = this.getStringOrFallback(ptr, "[Log message truncated]");
        console.log('[Terminal]', message);
        
        // Special commands handling
        if (message === "CLEAR_SCREEN") {
            this._clearTerminalScreen();
        } else if (message.startsWith("CONNECT:")) {
            const url = message.substring(8);
            this._connectToWebSocket(url);
        } else if (message === "CONNECT_DEFAULT") {
            this._connectToWebSocket("ws://localhost:8080");
        } else if (message === "DISCONNECT") {
            this._disconnectWebSocket();
        }
        
        return 0;
    }
    
    _consoleError(ptr) {
        const message = this.getStringOrFallback(ptr, "[Error message truncated]");
        console.error('[Terminal Error]', message);
        return 0;
    }
    
    _sendWebSocketMessage(ptr) {
        const message = this.getStringOrFallback(ptr, "");
        if (message && this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
            this.webSocket.send(message);
            return 1;
        }
        return 0;
    }
    
    _isWebSocketConnected() {
        return !!(this.webSocket && this.webSocket.readyState === WebSocket.OPEN);
    }
    
    /**
     * Helper methods for terminal functionality
     */
    _clearTerminalScreen() {
        // Dispatch event for UI to clear screen
        const event = new CustomEvent('terminal:clear');
        window.dispatchEvent(event);
    }
    
    _connectToWebSocket(url) {
        try {
            // Close existing connection if any
            if (this.webSocket) {
                this.webSocket.close();
            }
            
            // Create new WebSocket connection
            this.webSocket = new WebSocket(url);
            
            this.webSocket.onopen = () => {
                console.log(`[Terminal] Connected to ${url}`);
                if (this.wasmExports.processWebSocketMessage) {
                    const msgPtr = this.allocateString(`Connected to ${url}`);
                    this.wasmExports.processWebSocketMessage(msgPtr);
                }
            };
            
            this.webSocket.onmessage = (event) => {
                if (this.wasmExports.processWebSocketMessage) {
                    const msgPtr = this.allocateString(event.data);
                    this.wasmExports.processWebSocketMessage(msgPtr);
                }
            };
            
            this.webSocket.onclose = () => {
                console.log('[Terminal] WebSocket connection closed');
                if (this.wasmExports.processWebSocketMessage) {
                    const msgPtr = this.allocateString('Connection closed');
                    this.wasmExports.processWebSocketMessage(msgPtr);
                }
            };
            
            this.webSocket.onerror = (error) => {
                console.error('[Terminal] WebSocket error:', error);
                if (this.wasmExports.processWebSocketMessage) {
                    const msgPtr = this.allocateString('Connection error');
                    this.wasmExports.processWebSocketMessage(msgPtr);
                }
            };
            
            return true;
        } catch (error) {
            console.error('[Terminal] Error connecting to WebSocket:', error);
            return false;
        }
    }
    
    _disconnectWebSocket() {
        if (this.webSocket) {
            this.webSocket.close();
            this.webSocket = null;
            console.log('[Terminal] WebSocket disconnected');
            return true;
        }
        return false;
    }
    
    /**
     * Handle abort from WASM
     * @param {string} message - Error message
     * @param {string} fileName - Source file name
     * @param {number} lineNumber - Source line number
     * @param {number} columnNumber - Source column number
     */
    _abort(message, fileName, lineNumber, columnNumber) {
        console.error(`WASM Abort: ${message} at ${fileName}:${lineNumber}:${columnNumber}`);
    }
    

    
    /**
     * Safely get string from WASM memory or return fallback
     * @param {number} ptr - Pointer to string in WASM memory
     * @param {string} fallback - Fallback message if string retrieval fails
     * @returns {string} - Retrieved string or fallback
     */
    getStringOrFallback(ptr, fallback = "") {
        if (!ptr) return fallback;
        try {
            return this.getString(ptr);
        } catch (e) {
            console.error("Error getting string from WASM:", e);
            return fallback;
        }
    }
    
    /**
     * Get string from WASM memory
     * @param {number} ptr - Pointer to string in WASM memory
     * @returns {string} - Retrieved string
     */
    getString(ptr) {
        if (!ptr) return "";
        
        try {
            // Get the string length
            const memory = this.wasmMemory.buffer;
            const view = new Uint32Array(memory);
            let len = 0;
            
            // If the pointer is aligned properly, try to read length prefix
            if (ptr % 4 === 0) {
                // AssemblyScript style length-prefixed string
                len = view[ptr / 4 - 1]; // Length prefix
            }
            
            // Validate or estimate string length
            if (len <= 0 || len > memory.byteLength) {
                // Either invalid length or not a length-prefixed string
                // Estimate by finding null terminator (C-style string)
                const bytes = new Uint8Array(memory);
                len = 0;
                while (ptr + len < memory.byteLength && bytes[ptr + len] !== 0) {
                    len++;
                    // Safety cap
                    if (len > 1024) break;
                }
            }
            
            // Clamp to reasonable size and available memory
            const safeLen = Math.min(len, 1024, memory.byteLength - ptr);
            
            if (safeLen <= 0) {
                return "";
            }
            
            // Create a safe view of only the data we need
            const bytes = new Uint8Array(memory, ptr, safeLen);
            
            // Convert to string
            const decoder = new TextDecoder();
            return decoder.decode(bytes);
        } catch (error) {
            console.error("Error in getString:", error);
            return ""; // Gracefully fail with empty string
        }
    }
    
    /**
     * Allocate string in WASM memory (safe implementation)
     * @param {string} str - String to allocate
     * @returns {number|null} - Pointer to string in WASM memory or null on failure
     */
    /**
     * Add AssemblyScript helper functions to the import object
     * @param {Object} importObject - The import object for WebAssembly
     */
    _addAssemblyScriptHelpers(importObject) {
        // Create a runtime namespace if it doesn't exist
        if (!importObject.runtime) {
            importObject.runtime = {};
        }
        
        // Add minimal string allocation utilities that AssemblyScript might expect
        importObject.runtime.__new = (size, id) => {
            // Simple memory allocator - returns pointer to allocated memory
            const ptr = this._malloc(size);
            return ptr;
        };
        
        importObject.runtime.__newString = (str) => {
            const strLen = str.length;
            const bufLen = strLen * 2 + 4; // UTF-16 + length prefix
            
            // Allocate memory for the string (length prefix + string data)
            const ptr = this._malloc(bufLen);
            if (!ptr) return 0;
            
            try {
                const memory = importObject.env.memory.buffer;
                const view32 = new Uint32Array(memory);
                const view16 = new Uint16Array(memory);
                
                // Write length prefix
                view32[ptr >> 2] = strLen;
                
                // Write string data as UTF-16
                const dataOffset = (ptr + 4) >> 1;
                for (let i = 0; i < strLen; i++) {
                    view16[dataOffset + i] = str.charCodeAt(i);
                }
                
                return ptr + 4; // Return pointer to string data (after length prefix)
            } catch (e) {
                console.error("Error in __newString:", e);
                return 0;
            }
        };
    }
    
    /**
     * Simple memory allocator for WASM
     * @param {number} size - Size in bytes to allocate
     * @returns {number} - Pointer to allocated memory
     */
    _malloc(size) {
        try {
            // Round up to multiple of 8 for alignment
            size = (size + 7) & ~7;
            
            const ptr = this._currentHeapEnd;
            this._currentHeapEnd += size;
            
            // Make sure we don't exceed memory limits
            const memory = this.wasmMemory || (this.wasmExports && this.wasmExports.memory);
            if (memory) {
                const currentPages = memory.buffer.byteLength / 65536;
                const requiredPages = Math.ceil(this._currentHeapEnd / 65536);
                
                if (requiredPages > currentPages) {
                    try {
                        memory.grow(requiredPages - currentPages);
                    } catch (e) {
                        console.error("Failed to grow memory:", e);
                        return 0;
                    }
                }
            }
            
            // Track allocation for debugging
            if (this._memoryAllocations) {
                this._memoryAllocations.push({ ptr, size });
            }
            return ptr;
        } catch (e) {
            console.error("Error in _malloc:", e);
            return 0;
        }
    }
    
    /**
     * Allocate string in WASM memory
     * @param {string} str - String to allocate
     * @returns {number|null} - Pointer to string in WASM memory or null on failure
     */
    allocateString(str) {
        try {
            if (!str) return 0;
            if (!this.wasmExports) return 0;
            
            // Try to use our own string allocator first
            if (typeof this._malloc === 'function') {
                const strLen = str.length;
                const bufLen = strLen * 2 + 4; // UTF-16 + length prefix
                
                // Allocate memory for the string (length prefix + string data)
                const ptr = this._malloc(bufLen);
                if (!ptr) return 0;
                
                // Write the string data
                const memory = this.wasmExports.memory.buffer;
                const view32 = new Uint32Array(memory);
                const view16 = new Uint16Array(memory);
                
                // Write length prefix
                view32[ptr >> 2] = strLen;
                
                // Write string data as UTF-16
                const dataOffset = (ptr + 4) >> 1;
                for (let i = 0; i < strLen; i++) {
                    view16[dataOffset + i] = str.charCodeAt(i);
                }
                
                return ptr + 4; // Return pointer to string data (after length prefix)
            }
            
            // If __newString exists, use it directly
            if (typeof this.wasmExports.__newString === 'function') {
                return this.wasmExports.__newString(str);
            }
            
            // If allocateUTF8 exists, use it (Emscripten style)
            if (typeof this.wasmExports.allocateUTF8 === 'function') {
                return this.wasmExports.allocateUTF8(str);
            }
            
            // Fallback for custom allocators
            if (typeof this.wasmExports.__new === 'function') {
                const encoder = new TextEncoder();
                const bytes = encoder.encode(str);
                const len = bytes.length;
                
                // Allocate memory: string bytes + null terminator
                const ptr = this.wasmExports.__new(len + 1, 1);
                if (!ptr) return 0;
                
                // Write the string bytes to memory
                const memory = this.wasmExports.memory.buffer;
                const view = new Uint8Array(memory);
                for (let i = 0; i < len; i++) {
                    view[ptr + i] = bytes[i];
                }
                view[ptr + len] = 0; // null terminator
                
                return ptr;
            }
            
            // Last resort - if we can't allocate properly, return 0
            console.warn("No string allocation method available in WASM module");
            return 0;
        } catch (error) {
            console.error("Error allocating string:", error);
            return 0;
        }
    }
    
    /**
     * Process command in WASM
     * @param {string} command - Command to process
     * @returns {boolean} - Success status
     */
    processCommand(command) {
        try {
            if (!command) return false;
            
            // Check for WASM processCommand function
            if (!this.wasmExports || typeof this.wasmExports.processCommand !== 'function') {
                console.warn("WASM processCommand function not available");
                return false;
            }
            
            // Add to command history if not empty
            if (command.trim() && !command.includes('\r') && !command.includes('\n')) {
                this.commandHistory.push(command);
                this.historyIndex = this.commandHistory.length;
            }
            
            // Create a simplified C-style null-terminated string
            // This approach is more compatible with different WASM modules
            try {
                // Get memory
                const memory = this.wasmExports.memory.buffer;
                const view = new Uint8Array(memory);
                
                // Simple UTF-8 encoding
                const encoder = new TextEncoder();
                const bytes = encoder.encode(command);
                const len = bytes.length;
                
                // Allocate string directly in memory
                const ptr = this._malloc(len + 1);
                if (!ptr) {
                    console.error("Failed to allocate memory for command");
                    return false;
                }
                
                // Copy string bytes
                for (let i = 0; i < len; i++) {
                    view[ptr + i] = bytes[i];
                }
                // Null terminator
                view[ptr + len] = 0;
                
                // Process the command
                this.wasmExports.processCommand(ptr);
                return true;
            } catch (error) {
                console.error("Error processing command:", error);
                return false;
            }
        } catch (error) {
            console.error("Error in processCommand:", error);
            return false;
        }
    }
    
    /**
     * Process WebSocket message in WASM
     * @param {string} message - Message to process
     * @returns {boolean} - Success status
     */
    processWebSocketMessage(message) {
        try {
            if (!message) return false;
            
            // If processWSMessage is available (specific function), use it
            if (this.wasmExports && typeof this.wasmExports.processWebSocketMessage === 'function') {
                // Create a simplified C-style null-terminated string
                try {
                    // Get memory
                    const memory = this.wasmExports.memory.buffer;
                    const view = new Uint8Array(memory);
                    
                    // Simple UTF-8 encoding
                    const encoder = new TextEncoder();
                    const bytes = encoder.encode(message);
                    const len = bytes.length;
                    
                    // Allocate string directly in memory
                    const ptr = this._malloc(len + 1);
                    if (!ptr) {
                        console.error("Failed to allocate memory for message");
                        return false;
                    }
                    
                    // Copy string bytes
                    for (let i = 0; i < len; i++) {
                        view[ptr + i] = bytes[i];
                    }
                    // Null terminator
                    view[ptr + len] = 0;
                    
                    // Process the message
                    this.wasmExports.processWebSocketMessage(ptr);
                    return true;
                } catch (error) {
                    console.error("Error processing WebSocket message:", error);
                    return false;
                }
            }
            
            // If processCommand is available, use it as fallback
            if (this.wasmExports && typeof this.wasmExports.processCommand === 'function') {
                return this.processCommand(message);
            }
            
            // No suitable function found
            console.warn("No WebSocket message processor available in WASM");
            return false;
        } catch (error) {
            console.error("Error processing WebSocket message:", error);
            return false;
        }
    }
    
    /**
     * Get previous command from history
     * @returns {string} - Previous command
     */
    getPreviousCommand() {
        if (this.commandHistory.length === 0) return "";
        
        this.historyIndex = Math.max(0, this.historyIndex - 1);
        return this.commandHistory[this.historyIndex];
    }
    
    /**
     * Get next command from history
     * @returns {string} - Next command
     */
    getNextCommand() {
        if (this.commandHistory.length === 0) return "";
        
        this.historyIndex = Math.min(this.commandHistory.length, this.historyIndex + 1);
        if (this.historyIndex === this.commandHistory.length) return "";
        
        return this.commandHistory[this.historyIndex];
    }
    
    /**
     * Get terminal state
     * @returns {Object} - Terminal state
     */
    getTerminalState() {
        try {
            if (!this.wasmExports || typeof this.wasmExports.getTerminalState !== 'function') {
                // Return minimal terminal state
                return {
                    cells: [],
                    cursor: { x: 0, y: 0, visible: true }
                };
            }
            
            const ptr = this.wasmExports.getTerminalState();
            if (!ptr) return null;
            
            const stateStr = this.getString(ptr);
            try {
                return JSON.parse(stateStr);
            } catch (e) {
                console.error("Error parsing terminal state:", e);
                return null;
            }
        } catch (error) {
            console.error("Error getting terminal state:", error);
            return null;
        }
    }
    
    /**
     * Register terminal renderer to receive WASM callbacks
     * @param {Object} renderer - Terminal renderer object
     */
    registerRenderer(renderer) {
        if (typeof window !== 'undefined') {
            window.terminalRenderer = renderer;
        }
    }
    
    /**
     * Register terminal event handler
     * @param {Function} handler - Event handler function
     */
    registerEventHandler(handler) {
        if (typeof window !== 'undefined') {
            window.terminalEventHandler = handler;
        }
    }
}

// Make WasmTerminalBridge globally available
if (typeof window !== 'undefined') {
    window.WasmTerminalBridge = WasmTerminalBridge;
}