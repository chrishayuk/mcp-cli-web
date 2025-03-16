/**
 * WebSocket Handler Module
 * Handles WebSocket connection logic separate from the terminal UI
 */
class WebSocketHandler {
  constructor(callbacks = {}) {
    this.connection = null;
    this.connected = false;
    this.endpoint = null;
    
    // Callbacks for different connection events
    this.callbacks = {
      onConnect: callbacks.onConnect || (() => {}),
      onDisconnect: callbacks.onDisconnect || (() => {}),
      onMessage: callbacks.onMessage || (() => {}),
      onError: callbacks.onError || (() => {}),
      onStatusChange: callbacks.onStatusChange || (() => {})
    };
  }
  
  /**
   * Connect to a WebSocket endpoint
   * @param {string} endpoint - The WebSocket URL to connect to
   * @returns {Promise} - Resolves on connection, rejects on error
   */
  connect(endpoint) {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        this.disconnect();
      }
      
      try {
        // Update status and notify
        this.endpoint = endpoint;
        this.callbacks.onStatusChange('connecting', `Connecting to ${endpoint}...`);
        
        // Create WebSocket connection
        this.connection = new WebSocket(endpoint);
        
        // Setup event handlers
        this.connection.onopen = () => {
          this.connected = true;
          this.callbacks.onStatusChange('connected', `Connected to ${endpoint}`);
          this.callbacks.onConnect(endpoint);
          resolve(endpoint);
        };
        
        this.connection.onmessage = (event) => {
          this.callbacks.onMessage(event.data);
        };
        
        this.connection.onclose = (event) => {
          this.connected = false;
          this.connection = null;
          this.callbacks.onStatusChange('disconnected', 'Disconnected from server');
          this.callbacks.onDisconnect(event);
        };
        
        this.connection.onerror = (error) => {
          this.callbacks.onStatusChange('error', 'Connection error');
          this.callbacks.onError(error);
          reject(error);
        };
      } catch (error) {
        this.callbacks.onStatusChange('error', `Error: ${error.message}`);
        this.callbacks.onError(error);
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from the current WebSocket
   * @returns {boolean} - Success status
   */
  disconnect() {
    if (!this.connection) {
      return false;
    }
    
    try {
      this.connection.close();
      this.connection = null;
      this.connected = false;
      return true;
    } catch (error) {
      this.callbacks.onError(error);
      return false;
    }
  }
  
  /**
   * Send data to the connected WebSocket
   * @param {string} data - The data to send
   * @returns {boolean} - Success status
   */
  sendData(data) {
    if (!this.connected || !this.connection) {
      this.callbacks.onError(new Error("Not connected to a server"));
      return false;
    }
    
    try {
      this.connection.send(data);
      return true;
    } catch (error) {
      this.callbacks.onError(error);
      return false;
    }
  }
  
  /**
   * Check if currently connected
   * @returns {boolean} - Connection status
   */
  isConnected() {
    return this.connected && this.connection !== null;
  }
  
  /**
   * Get the current endpoint URL if connected
   * @returns {string|null} - The endpoint URL or null if not connected
   */
  getEndpoint() {
    return this.connected ? this.endpoint : null;
  }
}

// Export for module systems if available
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = WebSocketHandler;
} else {
  // Make globally available if in browser context
  if (typeof window !== 'undefined') {
    window.WebSocketHandler = WebSocketHandler;
  }
}