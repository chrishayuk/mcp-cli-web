/**
 * js/chat/chat-llm-openai-handler.js
 * Simplified Chat Interface Integration for OpenAI
 * 
 * This file provides the OpenAI integration for the chat interface
 * and registers the necessary slash commands.
 */

// Initialize as soon as the document is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("OpenAI handler: Starting initialization");
  
  // Wait for both OpenAIService and ChatInterface to be available
  let checkInterval = setInterval(function() {
    if (window.openAIService && window.ChatInterface) {
      clearInterval(checkInterval);
      console.log("OpenAI handler: Dependencies available, initializing");
      initOpenAIChatIntegration();
    }
  }, 100);
  
  // Set a timeout to avoid waiting forever
  setTimeout(function() {
    clearInterval(checkInterval);
    console.log("OpenAI handler: Initialization timeout reached");
  }, 5000);
});

/**
 * Initialize the OpenAI chat integration
 */
function initOpenAIChatIntegration() {
  console.log("Initializing OpenAI chat integration...");
  
  // Track API key status on ChatInterface
  window.ChatInterface.apiKeySet = window.openAIService.validateApiKey();
  
  // Add handleCommand to ChatInterface if it doesn't exist
  if (typeof window.ChatInterface.handleCommand !== 'function') {
    console.log("Creating handleCommand function on ChatInterface");
    
    window.ChatInterface.handleCommand = function(command) {
      console.log("Processing command:", command);
      
      // Handle AI commands
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
    
    console.log("Created handleCommand function for ChatInterface");
  }
  
  // Add processWithOpenAI to ChatInterface
  window.ChatInterface.processWithOpenAI = function(message) {
    processWithOpenAI(message, this);
  };
  
  // Register the slash commands if SlashCommands is available
  if (window.SlashCommands) {
    registerAISlashCommands();
  } else {
    // Listen for slash commands ready event
    document.addEventListener('slash-commands:ready', function() {
      if (window.SlashCommands) {
        registerAISlashCommands();
      }
    });
    
    // Also attempt to register on application ready
    document.addEventListener('canvas-terminal:ready', function() {
      if (window.SlashCommands && !window.aiSlashCommandsInitialized) {
        registerAISlashCommands();
      }
    });
  }
  
  // Initialize welcome messages
  setTimeout(function() {
    if (window.welcomeMessageShown) {
      console.log('Welcome message already shown, skipping');
      return;
    }
    
    if (typeof showWelcomeMessages === 'function') {
      showWelcomeMessages();
      window.welcomeMessageShown = true;
    } else {
      // Fallback welcome message
      const welcomeHTML = `
<div class="ai-welcome">
  <h3>🤖 Welcome to Terminal Chat Canvas with OpenAI Integration!</h3>
  <p>To get started:</p>
  <ol>
    <li>Enter <code>/ai key YOUR_OPENAI_API_KEY</code> to set your API key.</li>
    <li>Then type your questions or requests to chat with AI.</li>
  </ol>
  <p>Or use direct commands like <code>show image</code>, <code>chart pie</code>, <code>draw pattern</code>.</p>
  <p>Type <code>/ai help</code> for more commands.</p>
</div>
`;
      const systemMessage = window.ChatInterface.addSystemMessage(welcomeHTML);
      if (systemMessage) {
        const messageText = systemMessage.querySelector('.message-text');
        if (messageText) messageText.innerHTML = welcomeHTML;
      }
      window.welcomeMessageShown = true;
    }
  }, 1000);
  
  // Re-initialize the status bar
  if (typeof initStatusBar === 'function') {
    initStatusBar();
  }
  
  console.log('OpenAI chat integration initialized');
  
  // Make test function available
  window.testOpenAIMessage = function(message) {
    console.log("Testing OpenAI message:", message);
    if (window.ChatInterface && window.openAIService) {
      window.ChatInterface.addUserMessage(message);
      processWithOpenAI(message, window.ChatInterface);
      return "Message sent to OpenAI";
    }
    return "Error: Dependencies not available";
  };
}

/**
 * Register AI slash commands
 */
function registerAISlashCommands() {
  if (window.aiSlashCommandsInitialized) {
    console.log("AI slash commands already initialized, skipping");
    return;
  }
  
  console.log("Registering AI slash commands...");
  
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
    
    console.log("AI slash commands registered:", aiCommands.length);
    
    // Mark as initialized
    window.aiSlashCommandsInitialized = true;
    window.aiCommandsInitialized = true;
    
    // Register with application initialization system if available
    if (window.AppInit && typeof window.AppInit.register === 'function') {
      window.AppInit.register('aiCommands');
    }
  } catch (error) {
    console.error("Error registering AI slash commands:", error);
  }
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

// Make these functions global so they can be accessed from elsewhere
window.handleAICommand = handleAICommand;
window.processWithOpenAI = processWithOpenAI;
window.showAIHelp = showAIHelp;
window.showAISettings = showAISettings;