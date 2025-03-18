/**
 * js/chat/chat-interface.js
 * Core Chat Interface for Terminal Canvas
 * 
 * Provides a terminal-style chat interface that integrates with the existing
 * canvas-manager and module system.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Create a global ChatInterface object
  window.ChatInterface = {
    /**
     * Initialize the chat interface by caching DOM elements,
     * setting up event listeners, and applying UI enhancements.
     */
    init() {
      // Cache references to DOM elements
      this.chatMessages = document.getElementById('chat-messages');
      this.chatInput = document.getElementById('chat-input');
      this.chatSend = document.getElementById('chat-send');
      this.commandSuggestions = document.querySelectorAll('.command-suggestion');

      // Setup event listeners and UI enhancements
      this.setupEventListeners();
      this.setupTerminalCursor();
      this.setupSlashCommandHandling();

      console.log('Terminal chat interface initialized');
      return true;
    },

    /**
     * Setup event listeners for user interactions.
     */
    setupEventListeners() {
      // Auto-expand chat input as user types
      this.chatInput.addEventListener('input', (e) => {
        const inputEl = e.target;
        inputEl.style.height = 'auto';
        inputEl.style.height = `${inputEl.scrollHeight}px`;
        if (inputEl.value.trim() === '') {
          inputEl.style.height = '';
        }
      });

      // Handle clicks on command suggestion elements
      this.commandSuggestions.forEach((suggestion) => {
        suggestion.addEventListener('click', () => {
          const command = suggestion.textContent;
          this.chatInput.value = command;
          this.chatInput.focus();
        });
      });

      // Send button click
      this.chatSend.addEventListener('click', () => {
        this.sendMessage();
      });

      // Send on Enter (without Shift)
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Handle Tab for command completion
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          this.handleTabCompletion();
        }
      });
    },

    /**
     * Setup slash command key handling.
     * Listens for the slash key when the input is empty to trigger the autocomplete UI.
     */
    setupSlashCommandHandling() {
      console.log('Setting up slash command key handling...');

      // Listen for slash key when input is empty
      this.chatInput.addEventListener('keypress', (e) => {
        if (e.key === '/' && this.chatInput.value === '') {
          console.log('Slash key detected, activating slash command UI');
          
          // Allow the slash to be entered, then trigger proper handling
          setTimeout(() => {
            // If slash command system is initialized, use its function
            if (window.showAutocompleteSuggestions && window.SlashCommands) {
              // Create or get dropdown
              let dropdown = document.querySelector('.slash-command-autocomplete');
              if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.className = 'slash-command-autocomplete';
                dropdown.style.display = 'none';
                document.body.appendChild(dropdown);
              }
              
              // Use the proper function from slash command system
              window.showAutocompleteSuggestions('/', this.chatInput, dropdown, {
                isSlashCommandActive: true,
                selectedAutocompleteIndex: -1
              });
            } else {
              // Fallback: Just dispatch input event to allow other handlers to run
              this.chatInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }, 10);
        }
      });

      // Ensure the slash button (if exists) activates slash commands properly
      const slashButton = document.querySelector('.slash-command-button');
      if (slashButton) {
        // Replace the existing button to remove old listeners
        const newSlashButton = slashButton.cloneNode(true);
        slashButton.parentNode.replaceChild(newSlashButton, slashButton);

        newSlashButton.addEventListener('click', () => {
          this.chatInput.value = '/';
          this.chatInput.focus();
          
          // Properly trigger the slash command system
          if (window.showAutocompleteSuggestions && window.SlashCommands) {
            // Get or create dropdown
            let dropdown = document.querySelector('.slash-command-autocomplete');
            if (!dropdown) {
              dropdown = document.createElement('div');
              dropdown.className = 'slash-command-autocomplete';
              dropdown.style.display = 'none';
              document.body.appendChild(dropdown);
            }
            
            // Use the proper function
            window.showAutocompleteSuggestions('/', this.chatInput, dropdown, {
              isSlashCommandActive: true,
              selectedAutocompleteIndex: -1
            });
            
            // Show help if available
            if (typeof window.showSlashCommandHelp === 'function') {
              window.showSlashCommandHelp();
            }
          }
        });
      }

      console.log('Slash command key handling setup complete');
    },

    /**
     * Handle tab completion for common commands.
     */
    handleTabCompletion() {
      const input = this.chatInput.value.toLowerCase().trim();
      const commandPrefixes = {
        sh: 'show ',
        cha: 'chart ',
        dr: 'draw ',
        co: 'connect ',
        he: 'help',
        '/a': '/ai ',
        cl: 'clear ',
        sho: 'show ',
        chart: 'chart ',
        'show i': 'show image ',
        'show r': 'show random image',
        'show c': 'show code ',
        'show m': 'show markdown ',
        'chart p': 'chart pie',
        'chart b': 'chart bar',
        'chart l': 'chart line',
        'draw p': 'draw pattern',
        'draw r': 'draw random'
      };

      // Find matching prefix and update input
      for (const [prefix, completion] of Object.entries(commandPrefixes)) {
        if (input === prefix || input.startsWith(prefix + ' ')) {
          this.chatInput.value = input.replace(prefix, completion);
          return;
        }
      }

      // If input starts with '/' and SlashCommands exists, attempt slash command completion
      if (input.startsWith('/') && window.SlashCommands) {
        const availableCommands = window.SlashCommands.getAvailableCommands();
        const matchingCommands = Object.keys(availableCommands).filter(
          cmd => cmd.startsWith(input) && cmd !== input
        );
        if (matchingCommands.length > 0) {
          this.chatInput.value = `${matchingCommands[0]} `;
        }
      }
    },

    /**
     * Add a terminal-style blinking cursor effect next to the chat input.
     */
    setupTerminalCursor() {
      const cursorSpan = document.createElement('span');
      cursorSpan.className = 'terminal-input-cursor';
      cursorSpan.innerHTML = '&nbsp;';

      const inputContainer = this.chatInput.parentElement;
      if (inputContainer && !document.querySelector('.terminal-input-cursor')) {
        inputContainer.appendChild(cursorSpan);

        // Toggle cursor visibility based on focus
        const positionCursor = () => {
          cursorSpan.style.display = (document.activeElement === this.chatInput)
            ? 'inline-block'
            : 'none';
        };

        this.chatInput.addEventListener('focus', positionCursor);
        this.chatInput.addEventListener('blur', positionCursor);
        positionCursor();
      }
    },

    /**
     * Send the message from the chat input.
     */
    sendMessage() {
      const message = this.chatInput.value.trim();
      if (message === '') return;
      
      // Add the user's message to the chat and clear the input
      this.addUserMessage(message);
      this.chatInput.value = '';
      this.chatInput.style.height = '';

      // Process the message (commands are intercepted by the integration)
      this.processCommand(message);
    },

    /**
     * Add a user message to the chat with terminal styling.
     */
    addUserMessage(text) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message user-message';
      messageDiv.innerHTML = `
        <div class="message-avatar user-avatar">
          <i class="fas fa-user"></i>
        </div>
        <div class="message-content user-content">
          <div class="message-text">${text}</div>
          <div class="message-time">${time}</div>
        </div>
      `;
      this.chatMessages.appendChild(messageDiv);
      this.scrollToBottom();
    },

    /**
     * Add a system message to the chat (styled as system).
     */
    addSystemMessage(text) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message system-message';
      messageDiv.innerHTML = `
        <div class="message-avatar system-avatar">
          <i class="fas fa-desktop"></i>
        </div>
        <div class="message-content system-content">
          <div class="message-text">${text}</div>
          <div class="message-time">${time}</div>
        </div>
      `;
      this.chatMessages.appendChild(messageDiv);
      this.scrollToBottom();
      return messageDiv;
    },

    /**
     * Show a typing indicator in the chat.
     */
    showTypingIndicator() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'chat-message system-message';
      typingDiv.id = 'typing-indicator';
      typingDiv.innerHTML = `
        <div class="message-avatar system-avatar">
          <i class="fas fa-desktop"></i>
        </div>
        <div class="message-content system-content">
          <div class="system-thinking">
            <span class="terminal-processing">processing</span>
            <div class="thinking-dots">
              <div class="thinking-dot"></div>
              <div class="thinking-dot"></div>
              <div class="thinking-dot"></div>
            </div>
          </div>
        </div>
      `;
      this.chatMessages.appendChild(typingDiv);
      this.scrollToBottom();
      return typingDiv;
    },

    /**
     * Hide the typing indicator from the chat.
     */
    hideTypingIndicator() {
      const indicator = document.getElementById('typing-indicator');
      if (indicator) {
        indicator.remove();
      }
    },

    /**
     * Scroll the chat to the bottom.
     */
    scrollToBottom() {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    },

    /**
     * Process a command by delegating to an external command handler.
     */
    processCommand(command) {
      if (typeof this.handleCommand === 'function') {
        this.handleCommand(command);
      } else {
        console.error('Command handler not available');
        this.addSystemMessage('Error: Command handler not loaded properly.');
      }
    }
  };

  // Initialize the chat interface shortly after DOM is ready
  setTimeout(() => {
    ChatInterface.init();
  }, 100);

  // Expose a function to fix slash command input handling if needed
  window.fixSlashCommandInput = () => {
    console.log('Attempting to fix slash command input handling...');
    const chatInput = document.getElementById('chat-input');
    if (!chatInput) {
      console.error('Chat input not found');
      return false;
    }
    
    // Force create dropdown if it doesn't exist
    let dropdown = document.querySelector('.slash-command-autocomplete');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.className = 'slash-command-autocomplete';
      dropdown.style.display = 'none';
      document.body.appendChild(dropdown);
      console.log('Created missing slash command dropdown');
    }
    
    // Force initialize slash commands if needed
    if (window.SlashCommands && !window.slashCommandHandlerInitialized) {
      console.log('Initializing SlashCommands core');
      window.SlashCommands.init();
    }
    
    if (typeof window.initSlashCommandUI === 'function' && !window.slashCommandUIInitialized) {
      console.log('Initializing slash command UI');
      window.initSlashCommandUI();
    }
    
    // Reset and reapply event listeners
    ChatInterface.setupSlashCommandHandling();
    console.log('Slash command handling fixed');
    return true;
  };
});