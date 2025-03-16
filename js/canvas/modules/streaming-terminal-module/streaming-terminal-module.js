/**
 * Streaming Terminal Module
 * A simplified terminal emulator for web canvas with modular components
 */
class StreamingTerminalModule extends CanvasModule {
  constructor() {
    super();
    console.log('Terminal Module constructed');
    
    // Terminal state and display settings
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
    
    // Initialize modules
    this.initializeModules();
    
    // Add initial output
    this.initializeTerminalOutput();
  }
  
  /**
   * Initialize the WebSocket and SlashCommand modules
   */
  initializeModules() {
    // Initialize WebSocket handler with callbacks
    this.wsHandler = new WebSocketHandler({
      onConnect: (endpoint) => {
        this.terminalOutput.push(`Connected to ${endpoint}`);
        this.updateStatus('connected', 'Connected');
        this.manager?.updateCanvasStatus('success', 'Connected');
        this.render();
      },
      onDisconnect: () => {
        this.terminalOutput.push('Disconnected from server');
        this.updateStatus('disconnected', 'Disconnected');
        this.manager?.updateCanvasStatus('info', 'Disconnected');
        this.render();
      },
      onMessage: (data) => {
        this.terminalOutput.push(`${data}`);
        this.render();
      },
      onError: (error) => {
        this.terminalOutput.push(`Error: ${error.message || 'Unknown error'}`);
        this.updateStatus('error', 'Error');
        this.manager?.updateCanvasStatus('error', 'Connection error');
        this.render();
      },
      onStatusChange: (status, message) => {
        this.updateStatus(status, message);
      }
    });
    
    // SlashCommand handler will be initialized when UI is ready
    this.slashCommandHandler = null;
  }
  
  initializeTerminalOutput() {
    // Check if we have a connection
    const isConnected = this.wsHandler?.isConnected() || false;
    const endpoint = isConnected ? this.wsHandler.getEndpoint() : '';
    
    if (isConnected && endpoint) {
      this.terminalOutput = [
        "Terminal initialized",
        `Connected to ${endpoint}`
      ];
    } else {
      this.terminalOutput = [
        "Terminal initialized",
        "Type 'help' for available commands"
      ];
    }
    
    console.log("Terminal output initialized. Connected:", isConnected, "to", endpoint);
  }
  
  init(canvas, ctx, manager) {
    super.init(canvas, ctx, manager);
    this.supportedCommands = ['connect', 'disconnect', 'send', 'clear', 'help'];
    return this;
  }
  
  activate() {
    super.activate();
    this.manager?.updateCanvasStatus('success', 'Terminal Active');
    
    // Update canvas title to "Terminal Display"
    this.updateCanvasTitle('Terminal Display');
    
    this.enableDirectInput();
    return this;
  }
  
  deactivate() {
    if (this.wsHandler?.isConnected()) {
      this.wsHandler.disconnect();
    }
    
    // Restore canvas title to "Canvas Display"
    this.updateCanvasTitle('Canvas Display');
    
    this.disableDirectInput();
    return super.deactivate();
  }
  
  // Update the canvas title in the UI
  updateCanvasTitle(title) {
    try {
      const canvasTitleElement = document.querySelector('.canvas-title span');
      if (canvasTitleElement) {
        canvasTitleElement.textContent = title;
      }
    } catch (error) {
      console.error('Error updating canvas title:', error);
    }
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
      
      // Disable auto-focus behavior to prevent stealing focus from other inputs
      this.autoFocus = false;
      
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
      
      // Initialize the slash command handler
      this.slashCommandHandler = new SlashCommandHandler({
        parentElement: canvasContainer,
        onCommandExecute: (cmd, args) => {
          // Convert slash commands to regular commands
          this.processCommand(cmd + (args.length > 0 ? ' ' + args.join(' ') : ''));
        }
      });
      
      // Create slash command dropdown
      this.slashCommandDropdown = this.slashCommandHandler.createDropdownUI();
      
      // Set command select callback
      this.slashCommandHandler.setCommandSelectCallback((command) => {
        this.inputElement.value = command;
        this.visibleInput.textContent = command;
        this.inputElement.focus();
      });
      
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
        if (this.autoFocus !== false) {
          this.inputElement.focus();
        }
        
        // Hide slash command dropdown
        this.slashCommandHandler.hideDropdown();
      });
      
      // Event listener for key input
      this.inputElement.addEventListener('input', (e) => {
        // Update visible text
        this.visibleInput.textContent = this.inputElement.value;
        
        // Handle slash commands
        if (this.inputElement.value === '/') {
          this.slashCommandHandler.showAllCommands();
        } else if (this.inputElement.value.startsWith('/')) {
          this.slashCommandHandler.filterDropdown(this.inputElement.value);
        } else {
          this.slashCommandHandler.hideDropdown();
        }
      });
      
      // Handle special keys
      this.inputElement.addEventListener('keydown', (e) => {
        this.handleInputKeyDown(e);
      });
      
      // Add elements to container
      canvasContainer.appendChild(this.outputContainer);
      canvasContainer.appendChild(this.inputOverlay);
      canvasContainer.appendChild(this.inputElement);
      canvasContainer.appendChild(this.commandLine);
      canvasContainer.appendChild(this.statusIndicator);
      
      this.directInputEnabled = true;
      
      // Focus input on click only, not automatically
      if (this.autoFocus !== false) {
        this.inputElement.focus();
        this.focusInterval = setInterval(() => {
          if (document.activeElement !== this.inputElement && this.autoFocus !== false) {
            this.inputElement.focus();
          }
        }, 1000);
      }
      
      console.log('Direct terminal input enabled');
      
      // Initial render to show prompt
      this.render();
    } catch (error) {
      console.error('Error enabling direct input:', error);
    }
  }
  
  /**
   * Handle keyboard input events
   * @param {KeyboardEvent} e - The keyboard event
   */
  handleInputKeyDown(e) {
    // Handle Enter to process command
    if (e.key === 'Enter') {
      e.preventDefault();
      const command = this.inputElement.value;
      
      // Hide slash command dropdown
      this.slashCommandHandler.hideDropdown();
      
      if (command && command.trim()) {
        // Add command to output history
        this.terminalOutput.push(`${command}`);
        
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
        
        // If the input is now just "/", show all commands
        if (this.inputElement.value === '/') {
          this.slashCommandHandler.showAllCommands();
        } else if (this.inputElement.value.startsWith('/')) {
          this.slashCommandHandler.filterDropdown(this.inputElement.value);
        } else {
          this.slashCommandHandler.hideDropdown();
        }
      }, 0);
    }
    
    // Handle Escape to hide dropdown
    if (e.key === 'Escape') {
      this.slashCommandHandler.hideDropdown();
    }
    
    // Handle Up arrow for command history
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.commandHistory.length > 0 && this.historyIndex > 0) {
        this.historyIndex--;
        const prevCmd = this.commandHistory[this.historyIndex];
        this.inputElement.value = prevCmd;
        this.visibleInput.textContent = prevCmd;
        
        // Hide dropdown when navigating history
        this.slashCommandHandler.hideDropdown();
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
      
      // Hide dropdown when navigating history
      this.slashCommandHandler.hideDropdown();
      return;
    }
    
    // Tab to autocomplete slash command
    if (e.key === 'Tab' && this.inputElement.value.startsWith('/')) {
      e.preventDefault();
      
      const completion = this.slashCommandHandler.getAutocompletion(this.inputElement.value);
      if (completion) {
        this.inputElement.value = completion;
        this.visibleInput.textContent = completion;
        
        // Hide dropdown after autocomplete
        this.slashCommandHandler.hideDropdown();
      }
    }
  }
  
  disableDirectInput() {
    if (!this.directInputEnabled) return;
    try {
      if (this.focusInterval) {
        clearInterval(this.focusInterval);
        this.focusInterval = null;
      }
      
      // Clean up slash command handler
      if (this.slashCommandHandler) {
        this.slashCommandHandler.destroy();
        this.slashCommandHandler = null;
      }
      
      // Remove UI elements
      const elementsToRemove = [
        this.inputOverlay, 
        this.inputElement, 
        this.statusIndicator, 
        this.commandLine, 
        this.outputContainer
      ];
      
      elementsToRemove.forEach(element => {
        if (element && element.parentElement) {
          element.parentElement.removeChild(element);
        }
      });
      
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
    
    // Check for slash commands first
    if (command.startsWith('/')) {
      // Remove the slash and pass to slash command handler
      const cmdWithoutSlash = command.slice(1);
      if (this.slashCommandHandler.processCommand(command)) {
        return true;
      }
      // If slash command handler didn't process it, continue with normal command processing
      command = cmdWithoutSlash;
    }
    
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
        this.terminalOutput.push("Special slash commands:");
        this.terminalOutput.push("  /help       - Display this help message");
        this.terminalOutput.push("  /clear      - Clear the terminal");
        this.terminalOutput.push("  /connect URL - Connect to WebSocket server");
        this.terminalOutput.push("  /disconnect - Disconnect from server");
        this.terminalOutput.push("");
        this.terminalOutput.push("When connected, you can type any text to send it directly to the server.");
        break;
        
      case 'clear':
        this.clearTerminal();
        return true;
        
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
        if (this.wsHandler && this.wsHandler.isConnected()) {
          this.sendData(command);
        } else {
          this.terminalOutput.push(`Error: Unknown command: ${cmd}`);
          this.terminalOutput.push("Type 'help' or '/help' for available commands");
        }
    }
    
    this.render();
    
    // If user types / after a command, make sure we show all options
    if (this.inputElement && this.inputElement.value === '/') {
      this.slashCommandHandler.showAllCommands();
    }
    
    return true;
  }
  
  clearTerminal() {
    console.log("Clearing terminal. Connected:", this.wsHandler?.isConnected());
    
    // Use the same initialization method to ensure consistency
    this.initializeTerminalOutput();
    
    // Force a render to ensure the changes are displayed
    this.render();
  }
  
  connect(endpoint) {
    // No need to add a message here - WebSocketHandler will show connecting status
    
    // Use the WebSocket handler to establish the connection
    this.wsHandler.connect(endpoint)
      .catch(error => {
        console.error('Connection error:', error);
        this.terminalOutput.push(`Error connecting: ${error.message}`);
        this.render();
      });
  }
  
  disconnect() {
    return this.wsHandler.disconnect();
  }
  
  sendData(data) {
    if (!this.wsHandler || !this.wsHandler.isConnected()) {
      this.terminalOutput.push("Error: Not connected to a server");
      this.render();
      return false;
    }
    
    try {
      // Send data through WebSocket handler
      return this.wsHandler.sendData(data);
    } catch (error) {
      console.error('Error sending data:', error);
      this.terminalOutput.push(`Error sending data: ${error.message}`);
      this.render();
      return false;
    }
  }
  
  updateStatus(status, message) {
    if (this.statusIndicator) {
      // Update internal status indicator
      this.statusIndicator.textContent = message || status;
      switch (status) {
        case 'connected': this.statusIndicator.style.color = '#00ff00'; break;
        case 'disconnected': this.statusIndicator.style.color = '#ff0000'; break;
        case 'connecting': this.statusIndicator.style.color = '#ffff00'; break;
        case 'error': this.statusIndicator.style.color = '#ff5500'; break;
        default: this.statusIndicator.style.color = '#ffffff';
      }
    }
    
    // Also update the global status bar with server information
    this.updateGlobalStatus(status, message);
  }
  
  // Add a method to update the global status bar
  updateGlobalStatus(status, message) {
    try {
      // Find the status bar connected indicator
      const statusBarConnected = document.querySelector('.status-bar .status-item:last-child span');
      if (statusBarConnected) {
        if (status === 'connected' && this.wsHandler && this.wsHandler.endpoint) {
          // Show endpoint in status bar when connected
          statusBarConnected.textContent = `Connected to ${this.wsHandler.endpoint}`;
        } else if (status === 'disconnected') {
          statusBarConnected.textContent = 'Disconnected';
        } else if (status === 'connecting') {
          statusBarConnected.textContent = 'Connecting...';
        } else if (status === 'error') {
          statusBarConnected.textContent = message || 'Connection Error';
        } else {
          statusBarConnected.textContent = message || status;
        }
      }
      
      // Also update the main canvas status indicator
      const canvasStatus = document.getElementById('canvasStatus');
      if (canvasStatus) {
        const statusSpan = canvasStatus.querySelector('span');
        const statusIcon = canvasStatus.querySelector('i');
        
        if (statusSpan && statusIcon) {
          if (status === 'connected') {
            statusSpan.textContent = `Connected to ${this.wsHandler.endpoint}`;
            canvasStatus.className = 'status success';
            statusIcon.className = 'fas fa-check-circle';
          } else if (status === 'disconnected') {
            statusSpan.textContent = 'Disconnected';
            canvasStatus.className = 'status info';
            statusIcon.className = 'fas fa-info-circle';
          } else if (status === 'connecting') {
            statusSpan.textContent = 'Connecting...';
            canvasStatus.className = 'status warning';
            statusIcon.className = 'fas fa-sync fa-spin';
          } else if (status === 'error') {
            statusSpan.textContent = message || 'Connection Error';
            canvasStatus.className = 'status error';
            statusIcon.className = 'fas fa-exclamation-circle';
          }
        }
      }
    } catch (error) {
      console.error('Error updating global status:', error);
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
        this.clearTerminal();
        this.render();
        return true;
      case 'help':
        this.processCommand('help');
        return true;
      default:
        // If connected, treat any unrecognized command as data to send
        if (this.wsHandler && this.wsHandler.isConnected()) {
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