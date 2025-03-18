/**
 * js/slash-commands/slash-command-init.js
 * Slash Command System Initializer
 * 
 * Main initialization script for the slash command system
 * Loads components in the correct order with dependency checking
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing slash command system...");
    
    // Track initialization state - using both local and global flags
    const initState = {
        core: window.slashCommandHandlerInitialized || false,
        ui: window.slashCommandUIInitialized || false,
        connector: window.slashConnectorInitialized || false,
        aiCommands: window.aiSlashCommandsInitialized || false
    };
    
    /**
     * Initialize the core slash command registry
     */
    function initCore() {
        if (typeof initSlashCommandHandler === 'function') {
            initSlashCommandHandler();
            initState.core = window.slashCommandHandlerInitialized || true;
            console.log("✅ Slash command core initialized");
            checkDependencies();
        } else {
            console.error("initSlashCommandHandler function not available");
        }
    }
    
    /**
     * Initialize the slash command UI
     */
    function initUI() {
        if (!initState.core) {
            console.log("Waiting for core to initialize before UI");
            return;
        }
        
        if (typeof initSlashCommandUI === 'function') {
            initSlashCommandUI();
            initState.ui = window.slashCommandUIInitialized || true;
            console.log("✅ Slash command UI initialized");
            checkDependencies();
        } else {
            console.error("initSlashCommandUI function not available");
        }
    }
    
    /**
     * Initialize the module connector
     */
    function initConnector() {
        if (!initState.core) {
            console.log("Waiting for core to initialize before connector");
            return;
        }
        
        if (typeof initModuleConnector === 'function') {
            initModuleConnector();
            window.slashConnectorInitialized = true;
            initState.connector = true;
            console.log("✅ Slash command module connector initialized");
            checkDependencies();
        } else {
            console.error("initModuleConnector function not available");
        }
    }
    
    /**
     * Initialize the OpenAI commands
     * FIXED: Added proper dependency checking, error handling, and verification
     */
    function initAICommands() {
        if (!initState.core || !initState.connector) {
            console.log("Waiting for core and connector to initialize before AI commands");
            return;
        }
        
        // Check if the OpenAI service is available - this is the key dependency
        if (!window.openAIService) {
            console.log("OpenAI service not available yet, deferring AI commands initialization");
            
            // Set up a listener for when OpenAI service becomes available
            if (!window._openAIServiceWatcher) {
                window._openAIServiceWatcher = setInterval(function() {
                    if (window.openAIService) {
                        clearInterval(window._openAIServiceWatcher);
                        console.log("OpenAI service now available, retrying AI commands initialization");
                        initAICommands();
                    }
                }, 200);
                
                // Timeout after 10 seconds
                setTimeout(function() {
                    if (window._openAIServiceWatcher) {
                        clearInterval(window._openAIServiceWatcher);
                        console.warn("Timeout waiting for OpenAI service");
                    }
                }, 10000);
            }
            return;
        }
        
        if (typeof initOpenAISlashCommands === 'function') {
            try {
                console.log("Starting OpenAI slash commands initialization...");
                initOpenAISlashCommands();
                
                // Verify initialization was successful by checking flag
                if (window.aiSlashCommandsInitialized) {
                    initState.aiCommands = true;
                    console.log("✅ OpenAI slash commands initialized successfully");
                } else {
                    console.warn("OpenAI slash commands initialization did not set success flag");
                    
                    // If the function exists but initialization didn't set the flag, 
                    // let's create an emergency implementation
                    initEmergencyAICommands();
                }
                
                checkDependencies();
            } catch (error) {
                console.error("Error initializing OpenAI slash commands:", error);
                // Fall back to emergency implementation
                initEmergencyAICommands();
                checkDependencies();
            }
        } else {
            console.error("initOpenAISlashCommands function not available");
            // Create an emergency implementation
            initEmergencyAICommands();
            checkDependencies();
        }
    }
    
    /**
     * Emergency AI commands initialization if the normal method fails
     * NEW: Added as a fallback if regular initialization fails
     */
    function initEmergencyAICommands() {
        console.log("Starting emergency AI commands initialization...");
        
        try {
            // Check if we actually need to do this
            if (window.aiSlashCommandsInitialized) {
                console.log("AI commands already initialized, skipping emergency init");
                initState.aiCommands = true;
                return;
            }
            
            // Make sure we have the dependencies
            if (!window.SlashCommands || !window.openAIService) {
                console.error("Missing dependencies for emergency AI commands init");
                return;
            }
            
            // Register basic AI module commands
            window.SlashCommands.registerModuleCommand(
                'ai', '/ai', 'ai help', 'Manage AI assistant settings', true
            );
            
            // Register core AI commands
            const aiCommands = [
                { cmd: '/ai-key', fullCmd: 'ai key', desc: 'Set your OpenAI API key' },
                { cmd: '/ai-model', fullCmd: 'ai model', desc: 'Set AI model (gpt-4o, gpt-4o-mini, gpt-3.5-turbo)' },
                { cmd: '/ai-clear', fullCmd: 'ai clear', desc: 'Clear conversation history' },
                { cmd: '/ai-help', fullCmd: 'ai help', desc: 'Show AI help message' }
            ];
            
            aiCommands.forEach(command => {
                window.SlashCommands.registerModuleCommand(
                    'ai', command.cmd, command.fullCmd, command.desc, true
                );
            });
            
            // Create and register the handler function
            window.handleAICommand = function(command, chatInterface) {
                console.log("Handling AI command:", command);
                
                // Strip leading slash if present
                if (command.startsWith('/')) {
                    command = command.substring(1);
                }
                
                const parts = command.split(' ');
                const subCommand = parts.length > 1 ? parts[1].toLowerCase() : 'help';
                
                switch (subCommand) {
                    case 'key':
                        if (parts.length > 2) {
                            const apiKey = parts.slice(2).join(' ');
                            const result = window.openAIService.setApiKey(apiKey);
                            if (result) {
                                chatInterface.apiKeySet = true;
                                window.ChatInterface.apiKeySet = true;
                                chatInterface.addSystemMessage('✅ API key set successfully! Your key is stored in your browser.');
                            } else {
                                chatInterface.addSystemMessage('⚠️ Invalid API key format. Please ensure it starts with "sk-".');
                            }
                        } else {
                            chatInterface.addSystemMessage("⚠️ Please provide an API key after the command, e.g., '/ai key YOUR_API_KEY'");
                        }
                        break;
                        
                    case 'model':
                        if (parts.length > 2) {
                            const model = parts[2];
                            const result = window.openAIService.setModel(model);
                            chatInterface.addSystemMessage(result
                                ? `✅ Model changed to "${model}".`
                                : '⚠️ Invalid model name. Available models: gpt-4o, gpt-4o-mini, gpt-3.5-turbo');
                        } else {
                            chatInterface.addSystemMessage("⚠️ Please specify a model (e.g., 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo')");
                        }
                        break;
                        
                    case 'clear':
                        window.openAIService.resetConversation();
                        chatInterface.addSystemMessage('✅ Conversation history cleared. Starting fresh conversation.');
                        break;
                        
                    case 'help':
                    default:
                        // Show AI help
                        const messageHTML = `
<div class="ai-help-display">
  <div class="help-title">🤖 OpenAI Integration Commands</div>
  <div class="help-section">
    <div class="help-subtitle">Configuration:</div>
    <div class="command-list">
      <div class="command-item">
        <div class="command">/ai key YOUR_KEY</div>
        <div class="description">Set your OpenAI API key</div>
      </div>
      <div class="command-item">
        <div class="command">/ai model MODEL_NAME</div>
        <div class="description">Change model (gpt-4o, gpt-4o-mini, gpt-3.5-turbo)</div>
      </div>
    </div>
  </div>
  <div class="help-section">
    <div class="help-subtitle">Conversation:</div>
    <div class="command-list">
      <div class="command-item">
        <div class="command">/ai clear</div>
        <div class="description">Clear conversation history</div>
      </div>
      <div class="command-item">
        <div class="command">/ai help</div>
        <div class="description">Show this help message</div>
      </div>
    </div>
  </div>
  <div class="help-footer">
    To chat with AI, simply type your message after setting your API key.<br>
    To use direct commands (e.g., "show image", "chart pie"), type them normally.
  </div>
</div>`;
                        const systemMessage = chatInterface.addSystemMessage(messageHTML);
                        if (systemMessage) {
                            const messageText = systemMessage.querySelector('.message-text');
                            if (messageText) messageText.innerHTML = messageHTML;
                        }
                        break;
                }
            };
            
            // Fix the ChatInterface to handle AI commands
            if (window.ChatInterface && window.ChatInterface.handleCommand) {
                const originalHandleCommand = window.ChatInterface.handleCommand;
                
                // Only patch if not already patched
                if (!window.ChatInterface._handlesAiCommands) {
                    window.ChatInterface.handleCommand = function(command) {
                        if (command.startsWith('/ai') || command === 'ai help') {
                            window.handleAICommand(command, this);
                            return;
                        }
                        
                        // Call original handler for other commands
                        originalHandleCommand.call(this, command);
                    };
                    
                    window.ChatInterface._handlesAiCommands = true;
                    console.log("Patched ChatInterface.handleCommand for AI commands");
                }
            }
            
            // Set the initialization flags
            window.aiSlashCommandsInitialized = true;
            window.aiCommandsInitialized = true;
            initState.aiCommands = true;
            
            console.log("✅ Emergency AI commands initialization successful");
        } catch (error) {
            console.error("Emergency AI commands initialization failed:", error);
        }
    }
    
    /**
     * Check dependencies and initialize components in order
     */
    function checkDependencies() {
        // Update initState from global flags
        initState.core = window.slashCommandHandlerInitialized || initState.core;
        initState.ui = window.slashCommandUIInitialized || initState.ui;
        initState.connector = window.slashConnectorInitialized || initState.connector;
        initState.aiCommands = window.aiSlashCommandsInitialized || initState.aiCommands;
        
        // First initialize core
        if (!initState.core) {
            initCore();
            return;
        }
        
        // Then initialize UI and connector in parallel
        if (!initState.ui) {
            initUI();
        }
        
        if (!initState.connector) {
            initConnector();
        }
        
        // Finally initialize AI commands once core and connector are ready
        if (!initState.aiCommands && initState.core && initState.connector) {
            initAICommands();
        }
        
        // Check if all components are initialized
        if (initState.core && initState.ui && initState.connector && initState.aiCommands) {
            console.log("🚀 All slash command components initialized successfully!");
            
            // Dispatch an event that other parts of the system can listen for
            document.dispatchEvent(new CustomEvent('slash-commands:ready'));
            
            // Mark as initialized in global app state if available
            if (window.AppInit && typeof window.AppInit.register === 'function') {
                window.AppInit.register('slashCommands');
                window.AppInit.register('aiCommands');
            }
        }
    }
    
    // Start initialization process
    checkDependencies();
    
    // Set a timeout to retry initialization if some components fail
    setTimeout(function() {
        if (!initState.core || !initState.ui || !initState.connector || !initState.aiCommands) {
            console.warn("Some slash command components failed to initialize, retrying...");
            
            // Try to load any missing components
            if (!initState.core) initCore();
            if (!initState.ui) initUI();
            if (!initState.connector) initConnector();
            if (!initState.aiCommands) initAICommands();
            
            // Final check after 3 more seconds
            setTimeout(function() {
                if (!initState.core || !initState.ui || !initState.connector || !initState.aiCommands) {
                    console.error("Failed to initialize all slash command components after retries");
                    console.log("Current state:", initState);
                    
                    // Emergency initialization - force the available components
                    if (window.SlashCommands && !initState.core) {
                        console.log("Force-initializing core from existing SlashCommands object");
                        window.SlashCommands.init();
                        window.slashCommandHandlerInitialized = true;
                        initState.core = true;
                    }
                    
                    if (window.SlashCommands && !initState.ui) {
                        console.log("Attempting emergency UI initialization");
                        if (typeof initSlashCommandUI === 'function') {
                            initSlashCommandUI();
                            window.slashCommandUIInitialized = true;
                        } else {
                            setupEmergencyUI();
                        }
                        initState.ui = true;
                    }
                    
                    // NEW: Force AI commands initialization if it's still not done
                    if (!window.aiSlashCommandsInitialized && window.SlashCommands && window.openAIService) {
                        console.log("Forcing emergency AI commands initialization");
                        initEmergencyAICommands();
                    }
                    
                    // Check one last time and dispatch the ready event if all core components are ready
                    initState.aiCommands = window.aiSlashCommandsInitialized || initState.aiCommands;
                    if (initState.core && initState.ui && initState.connector && initState.aiCommands) {
                        console.log("✅ All slash command components initialized after emergency fixes");
                        document.dispatchEvent(new CustomEvent('slash-commands:ready'));
                        
                        if (window.AppInit && typeof window.AppInit.register === 'function') {
                            window.AppInit.register('slashCommands');
                            window.AppInit.register('aiCommands');
                        }
                    }
                } else {
                    console.log("✅ All slash command components initialized after retry");
                }
            }, 3000);
        }
    }, 5000);
    
    /**
     * Emergency UI setup in case the regular initialization fails
     */
    function setupEmergencyUI() {
        // Basic UI setup just to get slash commands working
        const chatInput = document.getElementById('chat-input');
        if (!chatInput) return;
        
        // Create the dropdown if needed
        let dropdown = document.querySelector('.slash-command-autocomplete');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'slash-command-autocomplete';
            dropdown.style.display = 'none';
            document.body.appendChild(dropdown);
        }
        
        // Set up basic slash handling for input
        chatInput.addEventListener('input', function(e) {
            if (chatInput.value.startsWith('/')) {
                // Get available commands
                const availableCommands = window.SlashCommands.getAvailableCommands();
                const availableDescriptions = window.SlashCommands.getAvailableDescriptions();
                
                // Populate dropdown
                dropdown.innerHTML = '';
                
                for (const cmd in availableCommands) {
                    if (cmd.startsWith(chatInput.value)) {
                        const item = document.createElement('div');
                        item.className = 'slash-command-item';
                        item.dataset.command = cmd;
                        item.innerHTML = `
                            <span class="slash-command-name">${cmd}</span>
                            <span class="slash-command-desc">${availableDescriptions[cmd] || ''}</span>
                        `;
                        
                        // Add click event
                        item.addEventListener('click', function() {
                            chatInput.value = cmd + ' ';
                            chatInput.focus();
                            dropdown.style.display = 'none';
                        });
                        
                        dropdown.appendChild(item);
                    }
                }
                
                // Position and show dropdown
                const rect = chatInput.getBoundingClientRect();
                dropdown.style.cssText = `
                    position: fixed !important;
                    top: ${rect.bottom + 5}px !important;
                    left: ${rect.left}px !important;
                    width: ${rect.width}px !important;
                    background: #1a1a1a !important;
                    border: 1px solid #444 !important;
                    border-radius: 4px !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
                    max-height: 300px !important;
                    overflow-y: auto !important;
                    z-index: 10000 !important;
                    display: block !important;
                `;
            } else {
                dropdown.style.display = 'none';
            }
        });
        
        // Set up tab completion
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Tab' && chatInput.value.startsWith('/')) {
                e.preventDefault();
                
                // Get available commands
                const availableCommands = window.SlashCommands.getAvailableCommands();
                const currentText = chatInput.value.toLowerCase();
                
                // Find a matching command
                for (const cmd in availableCommands) {
                    if (cmd.startsWith(currentText)) {
                        chatInput.value = cmd + ' ';
                        break;
                    }
                }
                
                dropdown.style.display = 'none';
            }
        });
        
        console.log("Emergency UI initialization complete");
        window.slashCommandUIInitialized = true;
        initState.ui = true;
    }
});