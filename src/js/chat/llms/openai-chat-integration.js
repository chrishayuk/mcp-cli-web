/**
 * js/chat/openai-chat-integration.js
 * Chat Interface Integration for OpenAI
 * 
 * This file integrates the OpenAI service with the chat interface.
 * It handles command processing and chat interactions.
 */

// Initialize and integrate with ChatInterface
document.addEventListener('DOMContentLoaded', function() {
  // Wait for both OpenAIService and ChatInterface to be available
  const waitForDependencies = setInterval(() => {
    if (window.openAIService && window.ChatInterface) {
      clearInterval(waitForDependencies);
      initOpenAIChatIntegration();
    }
  }, 100);
});

function initOpenAIChatIntegration() {
  // Store original methods
  const originalSendMessage = ChatInterface.sendMessage;
  const originalProcessCommand = ChatInterface.processCommand;
  
  // Add a property to track API key status
  ChatInterface.apiKeySet = window.openAIService.validateApiKey();
  
  // Override sendMessage to intercept AI slash commands before normal processing
  ChatInterface.sendMessage = function() {
    const message = this.chatInput.value.trim();
    if (message === '') return;
    
    // Add user message to chat
    this.addUserMessage(message);
    // Clear input and reset style
    this.chatInput.value = '';
    this.chatInput.style.height = '';
    
    // If message starts with "/ai ", handle it directly
    if (message.startsWith('/ai ')) {
      const parts = message.split(' ');
      const subCommand = parts[1]?.toLowerCase();
      
      if (subCommand === 'key' && parts.length > 2) {
        const apiKey = parts.slice(2).join(' ');
        handleApiKey(apiKey, this);
        return;
      } else if (subCommand === 'endpoint' && parts.length > 2) {
        const endpoint = parts.slice(2).join(' ');
        handleApiEndpoint(endpoint, this);
        return;
      } else if (subCommand === 'reset-endpoint') {
        handleResetApiEndpoint(this);
        return;
      } else if (subCommand === 'model' && parts.length > 2) {
        const model = parts[2];
        handleSetModel(model, this);
        return;
      } else if (subCommand === 'clear') {
        handleClearConversation(this);
        return;
      } else if (subCommand === 'settings') {
        showAISettings(this);
        return;
      } else if (subCommand === 'help') {
        showAIHelp(this);
        return;
      }
    }
    
    // For messages that are direct commands or if API key isn't set,
    // fall back to the original command processing.
    const isDirectCommand = message.startsWith('show ') ||
                              message.startsWith('chart ') ||
                              message.startsWith('draw ') ||
                              message.startsWith('connect ') ||
                              message.startsWith('help') ||
                              message.startsWith('clear ') ||
                              message.startsWith('/');
    if (isDirectCommand || !window.openAIService.validateApiKey()) {
      originalProcessCommand.call(this, message);
    } else {
      // Otherwise process with AI
      processWithAI(message, this);
    }
  };
  
  // Process message with OpenAI
  async function processWithAI(message, chatInterface) {
    chatInterface.showTypingIndicator();
    const result = await window.openAIService.processMessage(message);
    chatInterface.hideTypingIndicator();
    
    if (result.success) {
      const responseElement = chatInterface.addSystemMessage(result.message);
      if (typeof chatInterface.checkAndExecuteCommands === 'function') {
        chatInterface.checkAndExecuteCommands(result.message);
      }
    } else {
      chatInterface.addSystemMessage(`⚠️ ${result.message}`);
    }
  }
  
  // API key command handling (unified)
  function handleApiKey(apiKey, chatInterface) {
    console.log('[DEBUG] handleApiKey called with:', apiKey.substring(0,6) + '...');
    const result = window.openAIService.setApiKey(apiKey);
    if (result) {
      chatInterface.apiKeySet = true;
      window.ChatInterface.apiKeySet = true;
      chatInterface.addSystemMessage('✅ API key set successfully! Your key is stored in your browser.');
      
      // Update status bar
      if (typeof updateStatusBarWithAIInfo === 'function') {
        updateStatusBarWithAIInfo(window.openAIService.model);
      }
    } else {
      chatInterface.addSystemMessage('⚠️ Invalid API key format. Please ensure it starts with "sk-".');
    }
  }
  
  // API endpoint command handling
  function handleApiEndpoint(endpoint, chatInterface) {
    const result = window.openAIService.setApiEndpoint(endpoint);
    if (result) {
      chatInterface.addSystemMessage(`✅ API endpoint set to: ${endpoint}`);
    } else {
      chatInterface.addSystemMessage('⚠️ Invalid API endpoint URL. Please provide a valid HTTP/HTTPS URL.');
    }
  }
  
  // Reset API endpoint command handling
  function handleResetApiEndpoint(chatInterface) {
    const result = window.openAIService.resetApiEndpoint();
    chatInterface.addSystemMessage(result ? '✅ API endpoint reset to default.' : '⚠️ Could not reset API endpoint.');
  }
  
  // Set model command handling
  function handleSetModel(model, chatInterface) {
    const result = window.openAIService.setModel(model);
    chatInterface.addSystemMessage(result ? `✅ Model changed to "${model}".` : '⚠️ Invalid model name. Available models: gpt-4o, gpt-4o-mini, gpt-3.5-turbo');
  }
  
  // Clear conversation command handling
  function handleClearConversation(chatInterface) {
    window.openAIService.resetConversation();
    chatInterface.addSystemMessage('✅ Conversation history cleared. Starting fresh conversation.');
  }
  
  // Display current AI settings
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
  
  // Display help for AI commands
  function showAIHelp(chatInterface) {
    const messageHTML = `
<div class="ai-help-display">
  <div class="help-title">🤖 OpenAI Integration Commands</div>
  <div class="help-section">
    <div class="help-subtitle">Configuration:</div>
    <div class="command-list">
      <div class="command-item"><div class="command">/ai key YOUR_KEY</div><div class="description">Set your OpenAI API key</div></div>
      <div class="command-item"><div class="command">/ai model MODEL_NAME</div><div class="description">Change model (gpt-4o, gpt-4o-mini, gpt-3.5-turbo)</div></div>
      <div class="command-item"><div class="command">/ai endpoint URL</div><div class="description">Set a custom API endpoint</div></div>
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
    const systemMessage = chatInterface.addSystemMessage(messageHTML);
    if (systemMessage) {
      const messageText = systemMessage.querySelector('.message-text');
      if (messageText) messageText.innerHTML = messageHTML;
    }
  }
  
  // Optionally register slash commands with a global SlashCommands system if available
  if (window.SlashCommands) {
    window.SlashCommands.registerGlobal('/ai', 'ai help', 'Manage AI assistant settings');
    const aiCommands = [
      { cmd: '/ai key', desc: 'Set your OpenAI API key' },
      { cmd: '/ai model', desc: 'Set AI model (gpt-4o, gpt-4o-mini, gpt-3.5-turbo)' },
      { cmd: '/ai endpoint', desc: 'Set custom API endpoint URL' },
      { cmd: '/ai reset-endpoint', desc: 'Reset API endpoint to default' },
      { cmd: '/ai clear', desc: 'Clear conversation history' },
      { cmd: '/ai settings', desc: 'Show current AI settings' },
      { cmd: '/ai help', desc: 'Show this help message' }
    ];
    aiCommands.forEach(command => {
      window.SlashCommands.registerGlobal(command.cmd, command.cmd, command.desc);
    });
  }
  
  // Initialize welcome messages - ONLY ONCE
  setTimeout(() => {
    // Use global welcome message flag
    if (window.welcomeMessageShown) {
      console.log('Welcome message already shown, skipping');
      return;
    }
    
    // Load welcome messages from separate file if available
    if (typeof showWelcomeMessages === 'function') {
      showWelcomeMessages();
      // Mark message as shown globally
      window.welcomeMessageShown = true;
    } else {
      // Simple fallback welcome message
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
      const systemMessage = ChatInterface.addSystemMessage(welcomeHTML);
      if (systemMessage) {
        const messageText = systemMessage.querySelector('.message-text');
        if (messageText) messageText.innerHTML = welcomeHTML;
      }
      
      // Mark welcome message as shown globally
      window.welcomeMessageShown = true;
    }
  }, 1000);
  
  // Initialize status bar
  if (typeof initStatusBar === 'function') {
    initStatusBar();
  }
  
  console.log('OpenAI chat integration initialized');
}