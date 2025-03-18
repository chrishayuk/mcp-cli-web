/**
 * js/canvas/modules/terminal-module/slash-command-handler.js
 * Slash Command Handler Module
 * Manages slash commands and their UI implementation
 */
class SlashCommandHandler {
    /**
     * @param {Object} options - Configuration options
     * @param {Function} options.onCommandExecute - Callback when a command is executed
     * @param {HTMLElement} options.parentElement - Parent element to attach the dropdown to
     */
    constructor(options = {}) {
      this.commands = [];
      this.dropdownElement = null;
      this.parentElement = options.parentElement || document.body;
      this.onCommandExecute = options.onCommandExecute || (() => {});
      
      // Initialize default commands
      this.registerDefaultCommands();
    }
    
    /**
     * Register the default slash commands
     */
    registerDefaultCommands() {
      this.registerCommand('/help', 'Show help information', (args) => {
        this.onCommandExecute('help', args);
      });
      
      this.registerCommand('/clear', 'Clear the terminal', (args) => {
        this.onCommandExecute('clear', args);
      });
      
      this.registerCommand('/connect', 'Connect to WebSocket server', (args) => {
        this.onCommandExecute('connect', args);
      });
      
      this.registerCommand('/disconnect', 'Disconnect from server', (args) => {
        this.onCommandExecute('disconnect', args);
      });
    }
    
    /**
     * Register a new slash command
     * @param {string} command - The command text including the slash
     * @param {string} description - Description of what the command does
     * @param {Function} handler - Function to execute when command is invoked
     */
    registerCommand(command, description, handler) {
      if (!command.startsWith('/')) {
        command = '/' + command;
      }
      
      this.commands.push({
        command,
        description,
        handler
      });
      
      // Sort commands alphabetically for consistent display
      this.commands.sort((a, b) => a.command.localeCompare(b.command));
      
      // Rebuild the dropdown if it exists
      if (this.dropdownElement) {
        this.buildDropdownUI();
      }
    }
    
    /**
     * Process a slash command
     * @param {string} input - The full command input including the slash
     * @returns {boolean} - Whether the command was handled
     */
    processCommand(input) {
      if (!input.startsWith('/')) {
        return false;
      }
      
      // Parse the command and arguments
      const parts = input.trim().split(' ');
      const commandText = parts[0].toLowerCase();
      const args = parts.slice(1);
      
      // Find the command
      const command = this.commands.find(cmd => cmd.command.toLowerCase() === commandText);
      
      if (command) {
        command.handler(args);
        return true;
      }
      
      return false;
    }
    
    /**
     * Create and attach the slash command dropdown UI
     * @returns {HTMLElement} - The created dropdown element
     */
    createDropdownUI() {
      // Create dropdown container
      this.dropdownElement = document.createElement('div');
      this.dropdownElement.className = 'slash-command-dropdown';
      this.dropdownElement.style.cssText = `
        position: absolute;
        bottom: 60px;
        left: 10px;
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid #333;
        border-radius: 4px;
        padding: 5px 0;
        display: none;
        z-index: 103;
        font-family: monospace;
        font-size: 14px;
        color: #fff;
        width: 250px;
        max-height: 200px;
        overflow-y: auto;
      `;
      
      // Build the dropdown options
      this.buildDropdownUI();
      
      // Attach to parent
      this.parentElement.appendChild(this.dropdownElement);
      
      return this.dropdownElement;
    }
    
    /**
     * Build or rebuild the dropdown UI options
     */
    buildDropdownUI() {
      if (!this.dropdownElement) return;
      
      // Clear existing options
      this.dropdownElement.innerHTML = '';
      
      // Add each command as an option
      this.commands.forEach(cmd => {
        const option = document.createElement('div');
        option.className = 'slash-command-option';
        option.style.cssText = `
          padding: 5px 10px;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          justify-content: space-between;
        `;
        
        const commandSpan = document.createElement('span');
        commandSpan.style.fontWeight = 'bold';
        commandSpan.textContent = cmd.command;
        
        const descSpan = document.createElement('span');
        descSpan.style.opacity = '0.7';
        descSpan.style.marginLeft = '10px';
        descSpan.style.fontSize = '12px';
        descSpan.textContent = cmd.description;
        
        option.appendChild(commandSpan);
        option.appendChild(descSpan);
        
        // Hover effects
        option.addEventListener('mouseenter', () => {
          option.style.backgroundColor = '#333';
        });
        
        option.addEventListener('mouseleave', () => {
          option.style.backgroundColor = 'transparent';
        });
        
        // Click handler
        option.addEventListener('click', () => {
          // Return the command text for insertion
          if (this.onCommandSelect) {
            this.onCommandSelect(cmd.command);
          }
          
          // Hide dropdown
          this.hideDropdown();
        });
        
        this.dropdownElement.appendChild(option);
      });
    }
    
    /**
     * Filter dropdown options based on input
     * @param {string} inputText - The current input text
     * @returns {boolean} - Whether any options are visible
     */
    filterDropdown(inputText) {
      if (!this.dropdownElement) return false;
      
      // Ensure we only filter slash commands
      if (!inputText.startsWith('/')) {
        this.hideDropdown();
        return false;
      }
      
      const lowerInput = inputText.toLowerCase();
      const options = this.dropdownElement.querySelectorAll('.slash-command-option');
      let hasVisibleOptions = false;
      
      options.forEach(option => {
        const cmdText = option.querySelector('span').textContent.toLowerCase();
        if (cmdText.startsWith(lowerInput)) {
          option.style.display = 'flex';
          hasVisibleOptions = true;
        } else {
          option.style.display = 'none';
        }
      });
      
      // Show/hide dropdown based on matches
      if (hasVisibleOptions) {
        this.showDropdown();
      } else {
        this.hideDropdown();
      }
      
      return hasVisibleOptions;
    }
    
    /**
     * Show the dropdown with all options
     */
    showAllCommands() {
      if (!this.dropdownElement) return;
      
      const options = this.dropdownElement.querySelectorAll('.slash-command-option');
      options.forEach(option => {
        option.style.display = 'flex';
      });
      
      this.showDropdown();
    }
    
    /**
     * Show the dropdown
     */
    showDropdown() {
      if (this.dropdownElement) {
        this.dropdownElement.style.display = 'block';
      }
    }
    
    /**
     * Hide the dropdown
     */
    hideDropdown() {
      if (this.dropdownElement) {
        this.dropdownElement.style.display = 'none';
      }
    }
    
    /**
     * Set a callback for when a command is selected from the dropdown
     * @param {Function} callback - Function that receives the selected command
     */
    setCommandSelectCallback(callback) {
      this.onCommandSelect = callback;
    }
    
    /**
     * Get autocompletion for the current input
     * @param {string} input - The current input
     * @returns {string|null} - The autocompletion or null if none available
     */
    getAutocompletion(input) {
      if (!input.startsWith('/')) return null;
      
      const lowerInput = input.toLowerCase();
      const matching = this.commands.filter(cmd => 
        cmd.command.toLowerCase().startsWith(lowerInput)
      );
      
      // If exactly one command matches, return it
      if (matching.length === 1) {
        return matching[0].command;
      }
      
      return null;
    }
    
    /**
     * Clean up resources when no longer needed
     */
    destroy() {
      if (this.dropdownElement && this.dropdownElement.parentElement) {
        this.dropdownElement.parentElement.removeChild(this.dropdownElement);
      }
      this.dropdownElement = null;
      this.commands = [];
    }
  }
  
  // Export for module systems if available
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = SlashCommandHandler;
  } else {
    // Make globally available if in browser context
    if (typeof window !== 'undefined') {
      window.SlashCommandHandler = SlashCommandHandler;
    }
  }