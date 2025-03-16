/**
 * Streaming Terminal Module (Fixed Version)
 * A simplified terminal emulator for web canvas
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
      
      // Terminal output and history
      this.terminalOutput = [];
      this.commandHistory = [];
      this.historyIndex = -1;
      
      // Input handling
      this.inputOverlay = null;
      this.inputElement = null;
      this.statusIndicator = null;
      this.directInputEnabled = false;
      this.outputContainer = null;
      
      // Add initial output
      this.terminalOutput.push("Terminal initialized");
      this.terminalOutput.push("Type 'help' for available commands");
    }
    
    init(canvas, ctx, manager) {
      super.init(canvas, ctx, manager);
      this.supportedCommands = ['connect', 'disconnect', 'send', 'clear', 'help'];
      return this;
    }
    
    activate() {
      super.activate();
      this.manager?.updateCanvasStatus('success', 'Terminal Active');
      this.enableDirectInput();
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
        
        // Create HTML terminal output container
        this.outputContainer = document.createElement('div');
        this.outputContainer.className = 'terminal-output-container';
        this.outputContainer.style.cssText = `
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          bottom: 70px;
          overflow-y: auto;
          font-family: monospace;
          font-size: 14px;
          line-height: 1.3;
          white-space: pre-wrap;
          color: #00FF00;
          background-color: rgba(0, 0, 0, 0.8);
          border-radius: 4px;
          padding: 10px;
          z-index: 98;
        `;
        
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
            
            if (command && command.trim()) {
              // Add command to output history
              this.terminalOutput.push(`> ${command}`);
              
              // Process the command
              this.processCommand(command);
              
              // Add to command history
              if (this.commandHistory.length === 0 || 
                  this.commandHistory[this.commandHistory.length - 1] !== command) {
                this.commandHistory.push(command);
                this.historyIndex = this.commandHistory.length;
              }
            }
            
            // Clear input
            this.inputElement.value = '';
            this.visibleInput.textContent = '';
            
            // Update display
            this.render();
            return;
          }
          
          // Handle Backspace
          if (e.key === 'Backspace') {
            setTimeout(() => {
              this.visibleInput.textContent = this.inputElement.value;
            }, 0);
          }
          
          // Handle Up arrow for command history
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.commandHistory.length > 0 && this.historyIndex > 0) {
              this.historyIndex--;
              const prevCmd = this.commandHistory[this.historyIndex];
              this.inputElement.value = prevCmd;
              this.visibleInput.textContent = prevCmd;
            }
            return;
          }
          
          // Handle Down arrow for command history
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex < this.commandHistory.length - 1) {
              this.historyIndex++;
              const nextCmd = this.commandHistory[this.historyIndex];
              this.inputElement.value = nextCmd;
              this.visibleInput.textContent = nextCmd;
            } else {
              this.historyIndex = this.commandHistory.length;
              this.inputElement.value = '';
              this.visibleInput.textContent = '';
            }
            return;
          }
        });
        
        // Add elements to container
        canvasContainer.appendChild(this.outputContainer);
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
        
        // Initial render to show prompt
        this.render();
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
        if (this.outputContainer && this.outputContainer.parentElement) {
          this.outputContainer.parentElement.removeChild(this.outputContainer);
        }
        
        this.inputOverlay = null;
        this.inputElement = null;
        this.statusIndicator = null;
        this.commandLine = null;
        this.visibleInput = null;
        this.cursor = null;
        this.outputContainer = null;
        
        this.directInputEnabled = false;
        console.log('Direct terminal input disabled');
      } catch (error) {
        console.error('Error disabling direct input:', error);
      }
    }
    
    processCommand(command) {
      console.log('Processing command:', command);
      const parts = command.split(' ');
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);
      
      switch (cmd) {
        case 'help':
          this.terminalOutput.push("Available commands:");
          this.terminalOutput.push("  help        - Show this help message");
          this.terminalOutput.push("  clear       - Clear the terminal screen");
          this.terminalOutput.push("  connect URL - Connect to WebSocket server");
          this.terminalOutput.push("  disconnect  - Disconnect from server");
          this.terminalOutput.push("  send <msg>  - Send a message to the server");
          this.terminalOutput.push("");
          this.terminalOutput.push("When connected, you can type any text to send it directly to the server.");
          break;
          
        case 'clear':
          this.terminalOutput = [];
          break;
          
        case 'connect':
          if (args.length > 0) {
            this.connect(args[0]);
          } else {
            this.terminalOutput.push("Error: Please specify a WebSocket URL");
            this.terminalOutput.push("Example: connect wss://echo.websocket.org");
          }
          break;
          
        case 'disconnect':
          this.disconnect();
          break;
          
        case 'send':
          if (args.length > 0) {
            const message = args.join(' ');
            this.sendData(message);
          } else {
            this.terminalOutput.push("Error: Please specify a message to send");
            this.terminalOutput.push("Example: send Hello World");
          }
          break;
          
        default:
          // If connected, treat any unrecognized command as data to send
          if (this.connected && this.connection) {
            this.sendData(command);
          } else {
            this.terminalOutput.push(`Error: Unknown command: ${cmd}`);
            this.terminalOutput.push("Type 'help' for available commands");
          }
      }
      
      this.render();
    }
    
    connect(endpoint) {
      if (this.connected) {
        console.log('Already connected, disconnecting first');
        this.disconnect();
      }
      
      try {
        // Add message to output
        this.terminalOutput.push(`Connecting to ${endpoint}...`);
        this.render();
        
        this.connection = new WebSocket(endpoint);
        this.updateStatus('connecting', 'Connecting...');
        
        this.connection.onopen = () => {
          console.log('Connection established');
          this.connected = true;
          
          // Add connection message to terminal output
          this.terminalOutput.push(`Connected to ${endpoint}`);
          
          this.updateStatus('connected', 'Connected');
          this.manager?.updateCanvasStatus('success', 'Connected');
          if (this.inputElement) {
            this.inputElement.focus();
          }
          
          this.render();
        };
        
        this.connection.onmessage = (event) => {
          console.log('WebSocket message received:', event.data);
          
          // Add received message directly to terminal output
          this.terminalOutput.push(`Received: ${event.data}`);
          
          // Force render update to display new message
          this.render();
        };
        
        this.connection.onclose = (event) => {
          console.log('Connection closed', event);
          this.connected = false;
          this.connection = null;
          
          // Add disconnection message to terminal output
          this.terminalOutput.push(`Disconnected from server`);
          
          this.updateStatus('disconnected', 'Disconnected');
          this.manager?.updateCanvasStatus('info', 'Disconnected');
          
          this.render();
        };
        
        this.connection.onerror = (error) => {
          console.error('Connection error:', error);
          
          // Add error message to terminal output
          this.terminalOutput.push(`Connection error`);
          
          this.updateStatus('error', 'Connection Error');
          this.manager?.updateCanvasStatus('error', 'Connection error');
          
          this.render();
        };
        
        return true;
      } catch (error) {
        console.error('Error connecting:', error);
        
        // Add error message to terminal output
        this.terminalOutput.push(`Error connecting: ${error.message}`);
        
        this.updateStatus('error', `Error: ${error.message}`);
        this.manager?.updateCanvasStatus('error', `Error: ${error.message}`);
        
        this.render();
        return false;
      }
    }
    
    disconnect() {
      if (this.connection) {
        this.connection.close();
        this.connection = null;
      }
      
      this.connected = false;
      this.terminalOutput.push("Disconnected from server");
      this.updateStatus('disconnected', 'Disconnected');
      this.manager?.updateCanvasStatus('info', 'Disconnected');
      this.render();
      
      return true;
    }
    
    sendData(data) {
      if (!this.connected || !this.connection) {
        this.terminalOutput.push("Error: Not connected to a server");
        this.render();
        return false;
      }
      
      try {
        this.connection.send(data);
        
        // Add sent message to terminal output
        this.terminalOutput.push(`Sent: ${data}`);
        
        this.render();
        return true;
      } catch (error) {
        console.error('Error sending data:', error);
        
        // Add error message to terminal output
        this.terminalOutput.push(`Error sending data: ${error.message}`);
        
        this.render();
        return false;
      }
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
    
    render() {
      // Clear the canvas
      this.clear();
      
      // Update HTML output
      this.renderOutput();
      
      // Make sure input is focused
      if (this.inputElement) {
        setTimeout(() => this.inputElement.focus(), 0);
      }
      
      return this;
    }
    
    renderOutput() {
      if (!this.outputContainer) return;
      
      // Clear the output container
      this.outputContainer.innerHTML = '';
      
      // Add each line to the output
      for (const line of this.terminalOutput) {
        const lineElement = document.createElement('div');
        lineElement.className = 'terminal-line';
        
        // Style based on content
        if (line.startsWith('Error:')) {
          lineElement.style.color = '#FF5555'; // Red for errors
        } else if (line.startsWith('Sent:')) {
          lineElement.style.color = '#55AAFF'; // Blue for sent messages
        } else if (line.startsWith('Received:')) {
          lineElement.style.color = '#AAFFAA'; // Green for received messages
        } else if (line.includes('Connected')) {
          lineElement.style.color = '#FFAA55'; // Orange for connection status
        } else if (line.startsWith('>')) {
          lineElement.style.color = '#FFFFFF'; // White for commands
        }
        
        lineElement.textContent = line;
        this.outputContainer.appendChild(lineElement);
      }
      
      // Scroll to bottom
      this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
    }
    
    handleCommand(command, args) {
      console.log(`Terminal.handleCommand: ${command}, args:`, args);
      
      switch(command) {
        case 'connect':
          if (args && args.length >= 1) {
            return this.connect(args[0]);
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
          this.terminalOutput = [];
          this.render();
          return true;
        case 'help':
          this.processCommand('help');
          return true;
        default:
          // If connected, treat any unrecognized command as data to send
          if (this.connected && this.connection) {
            const fullCommand = [command, ...args].join(' ');
            return this.sendData(fullCommand);
          } else {
            this.terminalOutput.push(`Error: Unknown command: ${command}`);
            this.terminalOutput.push("Type 'help' for available commands");
            this.render();
            return false;
          }
      }
    }
  }
  
  // Make StreamingTerminalModule globally available
  if (typeof window !== 'undefined') {
    window.StreamingTerminalModule = StreamingTerminalModule;
    console.log('StreamingTerminalModule registered globally');
  }