/**
 * js/slash-commands/ai-slash-command-handler.js
 * AI Module Slash Command Handler
 * 
 * Registers slash commands for OpenAI integration.
 * Provides AI configuration and conversation management through slash commands.
 */

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for both the SlashCommands system and OpenAI service to be initialized
    setTimeout(function() {
        if (window.SlashCommands && window.openAIService) {
            console.log("Initializing AI slash commands...");
            initAIModuleSlashCommands();
        }
    }, 1200);
});

/**
 * Initialize slash commands for the AI module.
 */
function initAIModuleSlashCommands() {
    // Register AI commands as global commands (not module commands)
    registerAICommands();
    console.log("AI slash commands initialized");
}

/**
 * Register always-available AI commands as global commands.
 */
function registerAICommands() {
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
}

/**
 * Hook into slash command execution to handle AI commands.
 */
function hookSlashCommandExecution() {
    if (!window.SlashCommands) {
        console.error("Slash commands not available for AI integration hook");
        return;
    }
    
    // Listen for clicks in the autocomplete dropdown
    const autocompleteDropdown = document.querySelector('.slash-command-autocomplete');
    if (autocompleteDropdown) {
        autocompleteDropdown.addEventListener('click', function(e) {
            const item = e.target.closest('.slash-command-item');
            if (!item) return;
            const command = item.dataset.command;
            if (command && command.startsWith('/ai ')) {
                handleAISlashCommand(command, e);
            }
        });
    }
    
    // Modify the chat input to handle AI commands when Enter is pressed
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    if (chatInput && chatSend) {
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                const text = chatInput.value.trim();
                if (text.startsWith('/ai ')) {
                    e.preventDefault();
                    handleAICommandExecution(text);
                    return;
                }
            }
        });
    }
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
        setTimeout(() => {
            keyInput.focus();
        }, 100);
    }
}

/**
 * Prompt for API endpoint.
 */
function promptForAPIEndpoint() {
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
        setTimeout(() => {
            endpointInput.focus();
            endpointInput.select();
        }, 100);
    }
}

/**
 * Prompt for model selection.
 */
function promptForModelSelection() {
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
    const result = window.openAIService.setApiKey(apiKey);
    if (result) {
        if (window.ChatInterface) {
            window.ChatInterface.apiKeySet = true;
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
    console.log("=== END AI SLASH COMMANDS DEBUG ===");
};
