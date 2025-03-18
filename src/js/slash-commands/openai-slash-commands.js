/**
 * js/slash-commands/openai-slash-commands.js
 * OpenAI Module Slash Commands
 * 
 * Registers slash commands for OpenAI integration
 * Follows the same modular pattern as other module-specific slash commands
 */

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("OpenAI slash commands: script loaded");
    
    // Register an event listener for when slash commands are ready
    document.addEventListener('slash-commands:ready', function() {
        console.log("OpenAI slash commands: slash-commands:ready event detected");
        if (window.SlashCommands && window.openAIService) {
            initOpenAISlashCommands();
        }
    });
    
    // Also listen for application ready event
    document.addEventListener('canvas-terminal:ready', function() {
        console.log("OpenAI slash commands: canvas-terminal:ready event detected");
        if (window.SlashCommands && window.openAIService && !window.aiSlashCommandsInitialized) {
            initOpenAISlashCommands();
        }
    });
    
    // Wait a short time to check if dependencies are already available
    setTimeout(function() {
        if (window.SlashCommands && window.openAIService && !window.aiSlashCommandsInitialized) {
            console.log("OpenAI slash commands: Dependencies available, initializing immediately");
            initOpenAISlashCommands();
        } else {
            console.log("OpenAI slash commands: Waiting for events, current state: SlashCommands=" + 
                        !!window.SlashCommands + ", openAIService=" + !!window.openAIService);
        }
    }, 500);
});

/**
 * Initialize slash commands for the OpenAI integration
 */
function initOpenAISlashCommands() {
    // Prevent duplicate initialization
    if (window.aiSlashCommandsInitialized) {
        console.log("OpenAI slash commands already initialized, skipping");
        return;
    }
    
    console.log("Initializing OpenAI slash commands...");
    
    try {
        // Register AI slash commands
        registerAISlashCommands();
        
        // Extend OpenAI integration with slash command support
        extendOpenAIIntegration();
        
        // Set initialization flag - make sure it's on the global window object
        window.aiSlashCommandsInitialized = true;
        window.aiCommandsInitialized = true;
        
        // Export functions to the global scope
        window.handleAICommand = handleAICommand;
        window.processWithOpenAI = processWithOpenAI;
        window.showAIHelp = showAIHelp;
        window.showAISettings = showAISettings;
        
        console.log("✅ OpenAI slash commands initialized");
        
        // Register with application initialization system if available
        if (window.AppInit && typeof window.AppInit.register === 'function') {
            window.AppInit.register('aiCommands');
        }
        
        // Dispatch event that initialization is complete
        document.dispatchEvent(new CustomEvent('openai-commands:ready'));
    } catch (error) {
        console.error("Error initializing OpenAI slash commands:", error);
    }
}

/**
 * Register AI slash commands
 */
function registerAISlashCommands() {
    try {
        // Create a virtual 'ai' module for command organization
        window.SlashCommands.registerModuleCommand(
            'ai', '/ai', 'ai help', 'Manage AI assistant settings', true
        );
        
        // Register AI configuration commands
        const aiCommands = [
            { cmd: '/ai-key', fullCmd: 'ai key', desc: 'Set your OpenAI API key' },
            { cmd: '/ai-model', fullCmd: 'ai model', desc: 'Set AI model (gpt-4o, gpt-4o-mini, gpt-3.5-turbo)' },
            { cmd: '/ai-endpoint', fullCmd: 'ai endpoint', desc: 'Set custom API endpoint URL' },
            { cmd: '/ai-reset-endpoint', fullCmd: 'ai reset-endpoint', desc: 'Reset API endpoint to default' },
            { cmd: '/ai-clear', fullCmd: 'ai clear', desc: 'Clear conversation history' },
            { cmd: '/ai-settings', fullCmd: 'ai settings', desc: 'Show current AI settings' },
            { cmd: '/ai-help', fullCmd: 'ai help', desc: 'Show AI help message' }
        ];
        
        // Register each command with the AI module
        aiCommands.forEach(command => {
            window.SlashCommands.registerModuleCommand(
                'ai', command.cmd, command.fullCmd, command.desc, true
            );
        });
        
        console.log("OpenAI slash commands registered:", aiCommands.length);
        
        // Force update available commands cache if method exists
        if (typeof window.SlashCommands.getAvailableCommands === 'function') {
            const available = window.SlashCommands.getAvailableCommands();
            console.log("Available commands after AI registration:", Object.keys(available).length);
        }
    } catch (error) {
        console.error("Error registering AI slash commands:", error);
        throw error; // Re-throw to prevent silent failures
    }
}

/**
 * Extend the OpenAI integration with slash command support
 */
function extendOpenAIIntegration() {
    // Check if ChatInterface exists
    if (!window.ChatInterface) {
        console.error("ChatInterface not available for OpenAI slash command integration");
        throw new Error("ChatInterface not available"); // Throw error to prevent silent failures
    }
    
    // First, make sure ChatInterface has a handleCommand function
    if (typeof window.ChatInterface.handleCommand !== 'function') {
        console.log("Creating handleCommand function on ChatInterface");
        
        window.ChatInterface.handleCommand = function(command) {
            console.log("Processing command:", command);
            
            // Special handling for AI commands
            if (command.startsWith('/ai') || command === 'ai help') {
                handleAICommand(command, this);
                return;
            }
            
            // Check if message is a direct command for a module
            const isDirectCommand = command.startsWith('show ') ||
                command.startsWith('chart ') ||
                command.startsWith('draw ') ||
                command.startsWith('connect ') ||
                command.startsWith('help') ||
                command.startsWith('clear ') ||
                (command.startsWith('/') && !command.startsWith('/ai'));
            
            // Process message based on type
            if (isDirectCommand && window.Commands) {
                console.log("Processing as direct command");
                window.Commands.processCommand(command);
            } else if (!window.openAIService.validateApiKey()) {
                console.log("No API key set, showing help message");
                this.addSystemMessage("⚠️ Please set your OpenAI API key with '/ai key YOUR_API_KEY' to chat with AI.");
            } else {
                console.log("Processing with OpenAI API");
                processWithOpenAI(command, this);
            }
        };
    } else {
        // If handleCommand already exists, patch it to handle AI commands
        const originalHandleCommand = window.ChatInterface.handleCommand;
        
        // Only patch if not already patched
        if (!window.ChatInterface._handlesAiCommands) {
            window.ChatInterface.handleCommand = function(command) {
                if (command.startsWith('/ai') || command === 'ai help') {
                    handleAICommand(command, this);
                    return;
                }
                
                // Call original handler for other commands
                originalHandleCommand.call(this, command);
            };
            
            window.ChatInterface._handlesAiCommands = true;
            console.log("Patched existing ChatInterface.handleCommand for AI commands");
        }
    }
    
    // Add processWithOpenAI to ChatInterface if not already present
    if (typeof window.ChatInterface.processWithOpenAI !== 'function') {
        window.ChatInterface.processWithOpenAI = function(message) {
            processWithOpenAI(message, this);
        };
        console.log("Added processWithOpenAI method to ChatInterface");
    }
    
    console.log("Successfully extended ChatInterface with OpenAI support");
}

/**
 * Process messages with OpenAI
 * @param {string} message - The message to process
 * @param {Object} chatInterface - The chat interface instance
 */
async function processWithOpenAI(message, chatInterface) {
    console.log("Processing message with OpenAI:", message);
    chatInterface.showTypingIndicator();
    
    try {
        const result = await window.openAIService.processMessage(message);
        console.log("OpenAI result:", result);
        chatInterface.hideTypingIndicator();
        
        if (result.success) {
            const responseElement = chatInterface.addSystemMessage(result.message);
            checkAndExecuteCommands(result.message, chatInterface);
        } else {
            chatInterface.addSystemMessage(`⚠️ ${result.message}`);
        }
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        chatInterface.hideTypingIndicator();
        chatInterface.addSystemMessage(`⚠️ Error: ${error.message || 'Failed to connect to OpenAI'}`);
    }
}

/**
 * Check for and execute any commands in the AI response
 * @param {string} responseText - The AI response text
 * @param {Object} chatInterface - The chat interface instance
 */
function checkAndExecuteCommands(responseText, chatInterface) {
    // Only execute commands if the CommandProcessor is available
    if (!window.Commands || !window.Commands.parseAIResponse) {
        return;
    }
    
    try {
        // Extract commands from the response
        const commands = window.Commands.parseAIResponse(responseText);
        
        // Execute commands if any found
        if (commands && commands.length > 0) {
            console.log("Found commands in AI response:", commands);
            window.Commands.executeAICommands(responseText);
        }
    } catch (error) {
        console.error("Error executing commands from AI response:", error);
    }
}

/**
 * Handle AI specific commands
 * @param {string} command - The command to handle
 * @param {Object} chatInterface - The chat interface instance
 */
function handleAICommand(command, chatInterface) {
    console.log("Handling AI command:", command);
    
    // Strip leading slash if present
    if (command.startsWith('/')) {
        command = command.substring(1);
    }
    
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    const subCommand = parts.length > 1 ? parts[1].toLowerCase() : '';
    
    console.log(`Parsed AI command - cmd: ${cmd}, subCommand: ${subCommand}`);
    
    // Handle various AI commands
    switch (subCommand) {
        case 'key':
            if (parts.length > 2) {
                const apiKey = parts.slice(2).join(' ');
                handleApiKey(apiKey, chatInterface);
            } else {
                chatInterface.addSystemMessage("⚠️ Please provide an API key after the command, e.g., '/ai key YOUR_API_KEY'");
            }
            break;
            
        case 'endpoint':
            if (parts.length > 2) {
                const endpoint = parts.slice(2).join(' ');
                handleApiEndpoint(endpoint, chatInterface);
            } else {
                chatInterface.addSystemMessage("⚠️ Please provide an endpoint URL after the command, e.g., '/ai endpoint https://custom-endpoint.com'");
            }
            break;
            
        case 'reset-endpoint':
            handleResetApiEndpoint(chatInterface);
            break;
            
        case 'model':
            if (parts.length > 2) {
                const model = parts[2];
                handleSetModel(model, chatInterface);
            } else {
                chatInterface.addSystemMessage("⚠️ Please specify a model (e.g., 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo')");
            }
            break;
            
        case 'clear':
            handleClearConversation(chatInterface);
            break;
            
        case 'settings':
            showAISettings(chatInterface);
            break;
            
        case 'help':
        default:
            showAIHelp(chatInterface);
            break;
    }
}

/**
 * Handle API key command (/ai key YOUR_KEY)
 * @param {string} apiKey - The API key to set
 * @param {Object} chatInterface - The chat interface instance
 */
function handleApiKey(apiKey, chatInterface) {
    console.log('[DEBUG] handleApiKey called with:', apiKey.substring(0, 6) + '...');
    const result = window.openAIService.setApiKey(apiKey);
    if (result) {
        chatInterface.apiKeySet = true;
        window.ChatInterface.apiKeySet = true;
        chatInterface.addSystemMessage('✅ API key set successfully! Your key is stored in your browser.');
        if (typeof updateStatusBarWithAIInfo === 'function') {
            updateStatusBarWithAIInfo(window.openAIService.model);
        }
    } else {
        chatInterface.addSystemMessage('⚠️ Invalid API key format. Please ensure it starts with "sk-".');
    }
}

/**
 * Handle API endpoint command (/ai endpoint URL)
 * @param {string} endpoint - The endpoint URL to set
 * @param {Object} chatInterface - The chat interface instance
 */
function handleApiEndpoint(endpoint, chatInterface) {
    const result = window.openAIService.setApiEndpoint(endpoint);
    result
        ? chatInterface.addSystemMessage(`✅ API endpoint set to: ${endpoint}`)
        : chatInterface.addSystemMessage('⚠️ Invalid API endpoint URL. Please provide a valid HTTP/HTTPS URL.');
}

/**
 * Handle API endpoint reset command (/ai reset-endpoint)
 * @param {Object} chatInterface - The chat interface instance
 */
function handleResetApiEndpoint(chatInterface) {
    const result = window.openAIService.resetApiEndpoint();
    chatInterface.addSystemMessage(result
        ? '✅ API endpoint reset to default.'
        : '⚠️ Could not reset API endpoint.');
}

/**
 * Handle model change command (/ai model MODEL_NAME)
 * @param {string} model - The model name to set
 * @param {Object} chatInterface - The chat interface instance
 */
function handleSetModel(model, chatInterface) {
    const result = window.openAIService.setModel(model);
    chatInterface.addSystemMessage(result
        ? `✅ Model changed to "${model}".`
        : '⚠️ Invalid model name. Available models: gpt-4o, gpt-4o-mini, gpt-3.5-turbo');
}

/**
 * Handle clear conversation command (/ai clear)
 * @param {Object} chatInterface - The chat interface instance
 */
function handleClearConversation(chatInterface) {
    window.openAIService.resetConversation();
    chatInterface.addSystemMessage('✅ Conversation history cleared. Starting fresh conversation.');
}

/**
 * Display current AI settings in a system message popup
 * @param {Object} chatInterface - The chat interface instance
 */
function showAISettings(chatInterface) {
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
    const systemMessage = chatInterface.addSystemMessage(messageHTML);
    if (systemMessage) {
        const messageText = systemMessage.querySelector('.message-text');
        if (messageText) messageText.innerHTML = messageHTML;
    }
}

/**
 * Display help for AI commands in a system message popup
 * @param {Object} chatInterface - The chat interface instance
 */
function showAIHelp(chatInterface) {
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
      <div class="command-item">
        <div class="command">/ai endpoint URL</div>
        <div class="description">Set a custom API endpoint</div>
      </div>
      <div class="command-item">
        <div class="command">/ai reset-endpoint</div>
        <div class="description">Reset to default endpoint</div>
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
        <div class="command">/ai settings</div>
        <div class="description">Show current AI settings</div>
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
</div>
`;
    const systemMessage = chatInterface.addSystemMessage(messageHTML);
    if (systemMessage) {
        const messageText = systemMessage.querySelector('.message-text');
        if (messageText) messageText.innerHTML = messageHTML;
    }
}

// Provide a force initialization function for emergency fixes
window.forceInitOpenAICommands = function() {
    console.log("🔧 Forcing OpenAI slash command initialization");
    
    // Create or get SlashCommands object
    if (!window.SlashCommands) {
        console.error("SlashCommands not available");
        return false;
    }
    
    // Force initialization
    try {
        registerAISlashCommands();
        extendOpenAIIntegration();
        
        // Make functions globally available
        window.handleAICommand = handleAICommand;
        window.processWithOpenAI = processWithOpenAI;
        window.showAIHelp = showAIHelp;
        window.showAISettings = showAISettings;
        
        // Set flags
        window.aiSlashCommandsInitialized = true;
        window.aiCommandsInitialized = true;
        
        console.log("✅ OpenAI slash commands forcefully initialized");
        
        // Register with application initialization system if available
        if (window.AppInit && typeof window.AppInit.register === 'function') {
            window.AppInit.register('aiCommands');
        }
        
        return true;
    } catch (error) {
        console.error("Error during forced initialization:", error);
        return false;
    }
};