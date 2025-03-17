/**
 * js/slash-commands/ai-slash-command-handler.js
 * AI Module Slash Command Handler - Fixed Version
 * 
 * Registers slash commands for OpenAI integration.
 * Provides AI configuration and conversation management through slash commands.
 */

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Prevent duplicate initialization
    if (window.aiSlashCommandsInitialized) {
        console.log("AI slash commands already initialized, skipping");
        return;
    }
    
    // Set initialization flag
    window.aiSlashCommandsInitialized = true;
    
    // Check for dependencies with improved error handling
    const checkDependencies = function() {
        if (window.SlashCommands && window.openAIService) {
            console.log("Dependencies for AI slash commands available");
            initAIModuleSlashCommands();
            
            // Check if API key exists in localStorage and validate it
            if (window.openAIService.apiKey) {
                console.log("OpenAI API key found in localStorage");
                const isValid = window.openAIService.validateApiKey();
                if (isValid) {
                    console.log("API key is valid");
                    if (window.ChatInterface) {
                        window.ChatInterface.apiKeySet = true;
                    }
                } else {
                    console.warn("Stored API key is invalid");
                }
            }
            return true;
        }
        
        // Log specific missing dependencies
        if (!window.SlashCommands) {
            console.warn("SlashCommands system not available yet");
        }
        if (!window.openAIService) {
            console.warn("OpenAI service not available yet");
        }
        
        return false;
    };
    
    // Try immediately, then with increasing delays
    if (!checkDependencies()) {
        setTimeout(function() {
            if (!checkDependencies()) {
                setTimeout(function() {
                    if (!checkDependencies()) {
                        console.error("Dependencies for AI slash commands not available after multiple attempts");
                        
                        // Last resort - try to initialize OpenAI service if available
                        if (window.SlashCommands && !window.openAIService) {
                            console.log("Attempting to register AI commands without full OpenAI service...");
                            window.openAIService = window.openAIService || {
                                apiKey: null,
                                apiEndpoint: "https://api.openai.com/v1",
                                model: "gpt-4o",
                                messageHistory: [],
                                validateApiKey: function() { return !!this.apiKey; },
                                setApiKey: function(key) {
                                    if (key && key.startsWith('sk-')) {
                                        this.apiKey = key;
                                        try {
                                            localStorage.setItem('canvas_openai_api_key', key);
                                        } catch(e) { 
                                            console.error("Failed to save API key to localStorage:", e);
                                        }
                                        return true;
                                    }
                                    return false;
                                },
                                setApiEndpoint: function(endpoint) {
                                    if (endpoint && (endpoint.startsWith('http://') || endpoint.startsWith('https://'))) {
                                        this.apiEndpoint = endpoint;
                                        return true;
                                    }
                                    return false;
                                },
                                resetApiEndpoint: function() {
                                    this.apiEndpoint = "https://api.openai.com/v1";
                                    return true;
                                },
                                setModel: function(model) {
                                    const validModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
                                    if (validModels.includes(model)) {
                                        this.model = model;
                                        return true;
                                    }
                                    return false;
                                },
                                resetConversation: function() {
                                    this.messageHistory = [];
                                    return true;
                                },
                                getSettings: function() {
                                    return {
                                        model: this.model,
                                        apiKeySet: !!this.apiKey,
                                        apiEndpoint: this.apiEndpoint,
                                        messageCount: this.messageHistory.length
                                    };
                                }
                            };
                            
                            // Try to load API key from localStorage
                            try {
                                const storedKey = localStorage.getItem('canvas_openai_api_key');
                                if (storedKey) {
                                    window.openAIService.apiKey = storedKey;
                                    console.log("Loaded API key from localStorage");
                                }
                            } catch(e) {
                                console.warn("Failed to load API key from localStorage:", e);
                            }
                            
                            initAIModuleSlashCommands();
                        }
                    }
                }, 3000);
            }
        }, 1500);
    }
});

/**
 * Initialize slash commands for the AI module.
 */
function initAIModuleSlashCommands() {
    // Don't initialize if SlashCommands is not available
    if (!window.SlashCommands) {
        console.error("SlashCommands not available for AI commands registration");
        return;
    }
    
    // Prevent duplicate initialization
    if (window.aiCommandsInitialized) {
        console.log("AI commands already registered, skipping");
        return;
    }
    
    // Register AI commands as global commands
    registerAICommands();
    
    // Set flag to prevent re-initialization
    window.aiCommandsInitialized = true;
    
    // Mark as initialized in global app state if available
    if (window.AppInit && typeof window.AppInit.register === 'function') {
        window.AppInit.register('aiCommands');
    }
    
    console.log("✅ AI slash commands initialized successfully");
}

/**
 * Register always-available AI commands as global commands.
 */
function registerAICommands() {
    try {
        // Main AI command group
        window.SlashCommands.registerGlobal(
            '/ai',
            'ai help',
            'Manage AI assistant settings'
        );
        
        // Register all AI commands as global commands
        window.SlashCommands.registerGlobal(
            '/ai key',
            '/ai key',
            'Set your OpenAI API key'
        );
        window.SlashCommands.registerGlobal(
            '/ai model',
            '/ai model',
            'Set AI model (gpt-4o, gpt-4o-mini, gpt-3.5-turbo)'
        );
        window.SlashCommands.registerGlobal(
            '/ai endpoint',
            '/ai endpoint',
            'Set custom API endpoint URL'
        );
        window.SlashCommands.registerGlobal(
            '/ai reset-endpoint',
            '/ai reset-endpoint',
            'Reset API endpoint to default'
        );
        window.SlashCommands.registerGlobal(
            '/ai clear',
            '/ai clear',
            'Clear conversation history'
        );
        window.SlashCommands.registerGlobal(
            '/ai settings',
            '/ai settings',
            'Show current AI settings'
        );
        window.SlashCommands.registerGlobal(
            '/ai help',
            '/ai help',
            'Show AI assistant help'
        );
        
        // Hook into slash command execution for AI commands
        hookSlashCommandExecution();
        
        console.log("AI commands registered successfully");
    } catch (e) {
        console.error("Error registering AI commands:", e);
    }
}

/**
 * Hook into slash command execution to handle AI commands.
 */
function hookSlashCommandExecution() {
    if (!window.SlashCommands) {
        console.error("Slash commands not available for AI integration hook");
        return;
    }
    
    // Listen for clicks in the autocomplete dropdown with retry logic
    const setupAutocompleteListener = function() {
        const autocompleteDropdown = document.querySelector('.slash-command-autocomplete');
        if (!autocompleteDropdown) {
            console.log("Autocomplete dropdown not found, retrying in 500ms");
            setTimeout(setupAutocompleteListener, 500);
            return;
        }
        
        // Clone and replace to avoid duplicate event listeners
        const newDropdown = autocompleteDropdown.cloneNode(true);
        autocompleteDropdown.parentNode.replaceChild(newDropdown, autocompleteDropdown);
        
        newDropdown.addEventListener('click', function(e) {
            const item = e.target.closest('.slash-command-item');
            if (!item) return;
            const command = item.dataset.command;
            if (command && command.startsWith('/ai ')) {
                handleAISlashCommand(command, e);
            }
        });
        
        console.log("AI slash command autocomplete listener attached successfully");
    };
    
    // Start trying to set up the autocomplete listener
    setupAutocompleteListener();
    
    // Modify the chat input to handle AI commands when Enter is pressed
    const setupChatInputListener = function() {
        const chatInput = document.getElementById('chat-input');
        if (!chatInput) {
            console.log("Chat input not found, retrying in 500ms");
            setTimeout(setupChatInputListener, 500);
            return;
        }
        
        // Define handler function for AI commands
        function aiCommandKeydownHandler(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                const text = this.value.trim();
                if (text.startsWith('/ai ')) {
                    e.preventDefault();
                    handleAICommandExecution(text);
                    return;
                }
            }
        }
        
        // Clone and replace to avoid duplicate event listeners
        const newChatInput = chatInput.cloneNode(true);
        chatInput.parentNode.replaceChild(newChatInput, chatInput);
        
        // Add the handler to the new input
        newChatInput.addEventListener('keydown', aiCommandKeydownHandler);
        
        console.log("AI slash command chat input listener attached successfully");
    };
    
    // Start trying to set up the chat input listener
    setupChatInputListener();
}

/**
 * Handle AI slash command click in the dropdown.
 * @param {string} command - The slash command.
 * @param {Event} event - The click event.
 */
function handleAISlashCommand(command, event) {
    event.preventDefault();
    event.stopPropagation();
    const dropdown = document.querySelector('.slash-command-autocomplete');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    if (command === '/ai key') {
        promptForAPIKey();
    } else if (command === '/ai model') {
        promptForModelSelection();
    } else if (command === '/ai endpoint') {
        promptForAPIEndpoint();
    } else if (command === '/ai reset-endpoint') {
        handleResetApiEndpointCommand();
    } else if (command === '/ai clear') {
        handleClearConversationCommand();
    } else if (command === '/ai settings') {
        showAISettings();
    } else if (command === '/ai help') {
        showAIHelp();
    }
}

/**
 * Handle execution of AI slash commands from chat input.
 * @param {string} command - The full command text.
 */
function handleAICommandExecution(command) {
    // Clear the input
    const chatInput = document.getElementById('chat-input');
    if (chatInput) chatInput.value = '';
    
    // Add command to chat as a user message
    if (window.ChatInterface && typeof window.ChatInterface.addUserMessage === 'function') {
        window.ChatInterface.addUserMessage(command);
    }
    
    const parts = command.split(' ');
    if (parts.length < 2) {
        showAIHelp();
        return;
    }
    
    const subCommand = parts[1].toLowerCase();
    switch (subCommand) {
        case 'key':
            if (parts.length < 3) {
                promptForAPIKey();
                return;
            }
            const apiKey = parts.slice(2).join(' ');
            handleApiKeyCommand(apiKey);
            break;
        case 'endpoint':
            if (parts.length < 3) {
                promptForAPIEndpoint();
                return;
            }
            const apiEndpoint = parts.slice(2).join(' ');
            handleApiEndpointCommand(apiEndpoint);
            break;
        case 'reset-endpoint':
            handleResetApiEndpointCommand();
            break;
        case 'model':
            if (parts.length < 3) {
                promptForModelSelection();
                return;
            }
            const model = parts[2];
            handleSetModelCommand(model);
            break;
        case 'clear':
            handleClearConversationCommand();
            break;
        case 'settings':
            showAISettings();
            break;
        case 'help':
            showAIHelp();
            break;
        default:
            showSystemMessage(`⚠️ Unknown AI command: ${subCommand}. Type "/ai help" for available commands.`);
    }
}

/**
 * Prompt for API key with a better UI.
 */
function promptForAPIKey() {
    const messageHTML = `
<div class="ai-input-prompt">
  <div class="prompt-title">Enter your OpenAI API Key</div>
  <div class="prompt-desc">Your API key is stored only in your browser.</div>
  <input type="password" id="ai-api-key-input" class="prompt-input" placeholder="sk-..." />
  <div class="prompt-actions">
    <button id="ai-api-key-submit" class="prompt-button primary">Save API Key</button>
    <button id="ai-api-key-cancel" class="prompt-button">Cancel</button>
  </div>
</div>
`;
    const msgElement = showSystemMessage(messageHTML);
    
    // Add short delay to ensure DOM is updated
    setTimeout(() => {
        const keyInput = msgElement.querySelector('#ai-api-key-input');
        const submitBtn = msgElement.querySelector('#ai-api-key-submit');
        const cancelBtn = msgElement.querySelector('#ai-api-key-cancel');
        
        if (keyInput && submitBtn && cancelBtn) {
            submitBtn.addEventListener('click', function() {
                const apiKey = keyInput.value.trim();
                if (apiKey) {
                    handleApiKeyCommand(apiKey);
                }
            });
            cancelBtn.addEventListener('click', function() {
                showSystemMessage('API key setup cancelled.');
            });
            keyInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const apiKey = keyInput.value.trim();
                    if (apiKey) {
                        handleApiKeyCommand(apiKey);
                    }
                }
            });
            keyInput.focus();
        }
    }, 100);
}

/**
 * Prompt for API endpoint.
 */
function promptForAPIEndpoint() {
    if (!window.openAIService) {
        showSystemMessage('⚠️ OpenAI service not initialized.');
        return;
    }
    
    const currentEndpoint = window.openAIService.apiEndpoint;
    const messageHTML = `
<div class="ai-input-prompt">
  <div class="prompt-title">Enter API Endpoint URL</div>
  <div class="prompt-desc">Use this to connect to custom OpenAI-compatible endpoints.</div>
  <input type="text" id="ai-endpoint-input" class="prompt-input" value="${currentEndpoint}" />
  <div class="prompt-actions">
    <button id="ai-endpoint-submit" class="prompt-button primary">Save Endpoint</button>
    <button id="ai-endpoint-cancel" class="prompt-button">Cancel</button>
  </div>
</div>
`;
    const msgElement = showSystemMessage(messageHTML);
    
    // Add short delay to ensure DOM is updated
    setTimeout(() => {
        const endpointInput = msgElement.querySelector('#ai-endpoint-input');
        const submitBtn = msgElement.querySelector('#ai-endpoint-submit');
        const cancelBtn = msgElement.querySelector('#ai-endpoint-cancel');
        
        if (endpointInput && submitBtn && cancelBtn) {
            submitBtn.addEventListener('click', function() {
                const endpoint = endpointInput.value.trim();
                if (endpoint) {
                    handleApiEndpointCommand(endpoint);
                }
            });
            cancelBtn.addEventListener('click', function() {
                showSystemMessage('API endpoint setup cancelled.');
            });
            endpointInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const endpoint = endpointInput.value.trim();
                    if (endpoint) {
                        handleApiEndpointCommand(endpoint);
                    }
                }
            });
            endpointInput.focus();
            endpointInput.select();
        }
    }, 100);
}

/**
 * Prompt for model selection.
 */
function promptForModelSelection() {
    if (!window.openAIService) {
        showSystemMessage('⚠️ OpenAI service not initialized.');
        return;
    }
    
    const currentModel = window.openAIService.model;
    const messageHTML = `
<div class="ai-input-prompt">
  <div class="prompt-title">Select AI Model</div>
  <div class="prompt-desc">Choose the model to use for generating responses.</div>
  <div class="prompt-radio-group">
    <label class="prompt-radio">
      <input type="radio" name="ai-model" value="gpt-4o" ${currentModel === 'gpt-4o' ? 'checked' : ''} />
      <span>GPT-4o (Most capable)</span>
    </label>
    <label class="prompt-radio">
      <input type="radio" name="ai-model" value="gpt-4o-mini" ${currentModel === 'gpt-4o-mini' ? 'checked' : ''} />
      <span>GPT-4o Mini (Faster, cheaper)</span>
    </label>
    <label class="prompt-radio">
      <input type="radio" name="ai-model" value="gpt-3.5-turbo" ${currentModel === 'gpt-3.5-turbo' ? 'checked' : ''} />
      <span>GPT-3.5 Turbo</span>
    </label>
  </div>
  <div class="prompt-actions">
    <button id="ai-model-submit" class="prompt-button primary">Save Model</button>
    <button id="ai-model-cancel" class="prompt-button">Cancel</button>
  </div>
</div>
`;
    const msgElement = showSystemMessage(messageHTML);
    
    // Add short delay to ensure DOM is updated
    setTimeout(() => {
        const submitBtn = msgElement.querySelector('#ai-model-submit');
        const cancelBtn = msgElement.querySelector('#ai-model-cancel');
        const radioInputs = msgElement.querySelectorAll('input[name="ai-model"]');
        
        if (submitBtn && cancelBtn) {
            submitBtn.addEventListener('click', function() {
                let selectedModel = null;
                radioInputs.forEach(input => {
                    if (input.checked) {
                        selectedModel = input.value;
                    }
                });
                if (selectedModel) {
                    handleSetModelCommand(selectedModel);
                }
            });
            cancelBtn.addEventListener('click', function() {
                showSystemMessage('Model selection cancelled.');
            });
        }
    }, 100);
}

/**
 * Handle API key command.
 * @param {string} apiKey - The API key to set.
 */
function handleApiKeyCommand(apiKey) {
    if (!window.openAIService) {
        showSystemMessage('⚠️ OpenAI service not initialized.');
        return;
    }
    
    console.log('[DEBUG] handleApiKeyCommand called with:', apiKey.substring(0,6) + '...');
    
    // First, ensure the API key is properly set in the OpenAIService instance
    const result = window.openAIService.setApiKey(apiKey);
    
    if (result) {
        // Update ChatInterface to reflect the key is set
        if (window.ChatInterface) {
            window.ChatInterface.apiKeySet = true;
        }
        
        // Double-check localStorage was updated
        try {
            const storedKey = localStorage.getItem('canvas_openai_api_key');
            console.log('[DEBUG] Verified key in localStorage:', storedKey ? (storedKey.substring(0,6) + '...') : 'Not found');
            
            // If not found in localStorage despite successful set, manually save it
            if (!storedKey) {
                localStorage.setItem('canvas_openai_api_key', apiKey);
                console.log('[DEBUG] Manually saved API key to localStorage');
            }
        } catch (e) {
            console.warn('[DEBUG] Error verifying localStorage:', e);
        }
        
        showSystemMessage('✅ API key set successfully! Your key is stored in your browser.');
    } else {
        showSystemMessage('⚠️ Invalid API key format. Please provide a valid key starting with "sk-".');
    }
}

/**
 * Handle API endpoint command.
 * @param {string} apiEndpoint - The API endpoint to set.
 */
function handleApiEndpointCommand(apiEndpoint) {
    if (!window.openAIService) {
        showSystemMessage('⚠️ OpenAI service not initialized.');
        return;
    }
    const result = window.openAIService.setApiEndpoint(apiEndpoint);
    if (result) {
        showSystemMessage(`✅ API endpoint set to: ${apiEndpoint}`);
    } else {
        showSystemMessage('⚠️ Invalid API endpoint URL format. Please provide a valid HTTP/HTTPS URL.');
    }
}

/**
 * Handle reset API endpoint command.
 */
function handleResetApiEndpointCommand() {
    if (!window.openAIService) {
        showSystemMessage('⚠️ OpenAI service not initialized.');
        return;
    }
    const result = window.openAIService.resetApiEndpoint();
    if (result) {
        showSystemMessage('✅ API endpoint reset to default OpenAI endpoint.');
    } else {
        showSystemMessage('⚠️ Could not reset API endpoint.');
    }
}

/**
 * Handle set model command.
 * @param {string} model - The model to set.
 */
function handleSetModelCommand(model) {
    if (!window.openAIService) {
        showSystemMessage('⚠️ OpenAI service not initialized.');
        return;
    }
    const result = window.openAIService.setModel(model);
    if (result) {
        showSystemMessage(`✅ Model changed to "${model}".`);
    } else {
        showSystemMessage('⚠️ Invalid model name. Available models: gpt-4o, gpt-4o-mini, gpt-3.5-turbo');
    }
}

/**
 * Handle clear conversation command.
 */
function handleClearConversationCommand() {
    if (!window.openAIService) {
        showSystemMessage('⚠️ OpenAI service not initialized.');
        return;
    }
    window.openAIService.resetConversation();
    showSystemMessage('✅ Conversation history cleared. Starting fresh conversation.');
}

/**
 * Show AI settings.
 */
function showAISettings() {
    if (!window.openAIService) {
        showSystemMessage('⚠️ OpenAI service not initialized.');
        return;
    }
    const settings = window.openAIService.getSettings();
    const messageHTML = `
<div class="ai-settings-display">
  <div class="settings-title">🤖 OpenAI Integration Settings</div>
  <table class="settings-table">
    <tr><td>Model:</td><td>${settings.model}</td></tr>
    <tr><td>API Key:</td><td>${settings.apiKeySet ? '✅ Set' : '❌ Not set'}</td></tr>
    <tr><td>API Endpoint:</td><td>${settings.apiEndpoint}</td></tr>
    <tr><td>Messages:</td><td>${settings.messageCount} in history</td></tr>
  </table>
</div>
`;
    showSystemMessage(messageHTML);
}

/**
 * Show AI help.
 */
function showAIHelp() {
    const messageHTML = `
<div class="ai-help-display">
  <div class="help-title">🤖 OpenAI Integration Commands</div>
  <div class="help-section">
    <div class="help-subtitle">Configuration:</div>
    <div class="command-list">
      <div class="command-item"><div class="command">/ai key YOUR_KEY</div><div class="description">Set your OpenAI API key</div></div>
      <div class="command-item"><div class="command">/ai model MODEL_NAME</div><div class="description">Change model (gpt-4o, gpt-4o-mini, gpt-3.5-turbo)</div></div>
      <div class="command-item"><div class="command">/ai endpoint URL</div><div class="description">Set custom API endpoint</div></div>
      <div class="command-item"><div class="command">/ai reset-endpoint</div><div class="description">Reset to default endpoint</div></div>
    </div>
  </div>
  <div class="help-section">
    <div class="help-subtitle">Conversation:</div>
    <div class="command-list">
      <div class="command-item"><div class="command">/ai clear</div><div class="description">Clear conversation history</div></div>
      <div class="command-item"><div class="command">/ai settings</div><div class="description">Show current AI settings</div></div>
      <div class="command-item"><div class="command">/ai help</div><div class="description">Show this help message</div></div>
    </div>
  </div>
  <div class="help-footer">
    To chat with AI, simply type your message after setting your API key.<br>
    To use direct commands (e.g., "show image", "chart pie"), type them normally.
  </div>
</div>
`;
    showSystemMessage(messageHTML);
}

/**
 * Helper function to show a system message.
 * @param {string} message - Message to show.
 * @returns {HTMLElement} Message element.
 */
function showSystemMessage(message) {
    if (window.ChatInterface && typeof window.ChatInterface.addSystemMessage === 'function') {
        const messageElement = window.ChatInterface.addSystemMessage(message);
        if (message.includes('<') && message.includes('>')) {
            const messageText = messageElement.querySelector('.message-text');
            if (messageText) {
                messageText.innerHTML = message;
            }
        }
        return messageElement;
    }
    console.log('System message:', message);
    return null;
}

/**
 * Debug function for AI slash commands.
 */
window.debugAISlashCommands = function() {
    console.log("=== AI SLASH COMMANDS DEBUG ===");
    if (window.openAIService) {
        console.log("OpenAI Service Found:");
        console.log("  Model:", window.openAIService.model);
        console.log("  API Key Set:", !!window.openAIService.apiKey);
        console.log("  API Key Valid:", window.openAIService.validateApiKey());
        console.log("  API Key in localStorage:", !!localStorage.getItem('canvas_openai_api_key'));
        console.log("  API Endpoint:", window.openAIService.apiEndpoint);
        console.log("  Message History:", window.openAIService.messageHistory.length, "messages");
    } else {
        console.error("OpenAI Service not found");
    }
    
    if (window.SlashCommands) {
        console.log("\nSlash Commands Registration:");
        console.log("  Global AI Commands:");
        const globalCommands = window.SlashCommands.commands.global;
        for (const cmd in globalCommands) {
            if (cmd.startsWith('/ai')) {
                console.log(`    ${cmd} → ${globalCommands[cmd]}`);
            }
        }
    } else {
        console.error("Slash Commands system not found");
    }
    
    if (window.ChatInterface) {
        console.log("\nChatInterface Status:");
        console.log("  apiKeySet:", window.ChatInterface.apiKeySet);
    }
    
    console.log("=== END AI SLASH COMMANDS DEBUG ===");
};