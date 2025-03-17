/**
 * js/chat/openai-integration.js
 * Combined OpenAI Integration for Terminal Chat Canvas
 * 
 * This file combines the OpenAI service and integration with the chat interface.
 * It now saves the API key to localStorage so that it is remembered across sessions.
 */

// OpenAI API Service
class OpenAIService {
  constructor() {
    // Configuration
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-4o-mini';
    this.apiKey = '';
    this.systemPrompt = `You are Canvas Assistant, an AI that helps users visualize data and create content in a terminal-like interface. 
You can help with showing images, creating charts, displaying code, rendering markdown, and connecting to terminals.
Always try to use the available canvas commands whenever possible.

Available commands:
- Image: "show image [url]" or "show random image"
- Charts: "create pie chart", "bar chart", "line chart"
- Code: "show code [your code]"
- Markdown: "show markdown [text]" or "load markdown from [url]"
- Terminal: "connect terminal" or "send to terminal [command]"
- Shapes: "draw pattern", "draw random"
- Canvas: "clear canvas"

When responding to user requests for visualizations or code, suggest appropriate canvas commands.`;
    this.messageHistory = [];

    // Load saved API key and endpoint (if available)
    this.loadSavedApiKey();
    this.loadSavedEndpoint();

    // Initialize conversation history with the system prompt
    this.addSystemMessageToHistory();
  }

  // Validate the API key format (basic check)
  validateApiKey() {
    return (this.apiKey &&
            typeof this.apiKey === 'string' &&
            this.apiKey.startsWith('sk-') &&
            this.apiKey.length > 30);
  }

  // Set API key and save it to localStorage
  setApiKey(key) {
    this.apiKey = key;
    try {
      localStorage.setItem('canvas_openai_api_key', key);
      console.log('[DEBUG] API key saved to localStorage as "canvas_openai_api_key":', key.substring(0, 6) + '...');
    } catch (e) {
      console.warn('[DEBUG] Could not save API key to localStorage', e);
    }
    return this.validateApiKey();
  }

  // Load the API key from localStorage
  loadSavedApiKey() {
    try {
      const savedKey = localStorage.getItem('canvas_openai_api_key');
      if (savedKey) {
        this.apiKey = savedKey;
        console.log('[DEBUG] Loaded API key from localStorage:', savedKey.substring(0, 6) + '...');
      } else {
        console.log('[DEBUG] No API key found in localStorage under "canvas_openai_api_key".');
      }
    } catch (e) {
      console.warn('[DEBUG] Could not load API key from localStorage', e);
    }
  }

  // Set API endpoint
  setApiEndpoint(endpoint) {
    try {
      const url = new URL(endpoint);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return false;
      }
      this.apiEndpoint = endpoint;
      try {
        localStorage.setItem('openai_api_endpoint', endpoint);
      } catch (e) {
        console.warn('Could not save API endpoint to localStorage', e);
      }
      return true;
    } catch (e) {
      console.error('Invalid URL format for API endpoint', e);
      return false;
    }
  }

  // Load saved API endpoint from localStorage
  loadSavedEndpoint() {
    try {
      const savedEndpoint = localStorage.getItem('openai_api_endpoint');
      if (savedEndpoint) {
        this.apiEndpoint = savedEndpoint;
        return true;
      }
    } catch (e) {
      console.warn('Could not load API endpoint from localStorage', e);
    }
    return false;
  }

  // Reset API endpoint to default
  resetApiEndpoint() {
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    try {
      localStorage.removeItem('openai_api_endpoint');
    } catch (e) {
      console.warn('Could not remove API endpoint from localStorage', e);
    }
    return true;
  }

  // Add the system prompt as the first message in history
  addSystemMessageToHistory() {
    this.messageHistory = [{
      role: 'system',
      content: this.systemPrompt
    }];
  }

  // Update the system prompt and reset conversation history
  updateSystemPrompt(prompt) {
    this.systemPrompt = prompt;
    this.addSystemMessageToHistory();
  }

  // Reset conversation history to just the system message
  resetConversation() {
    this.addSystemMessageToHistory();
  }

  // Add a user message to history; limit history to 20 messages
  addUserMessage(message) {
    this.messageHistory.push({ role: 'user', content: message });
    if (this.messageHistory.length > 20) {
      const systemIdx = this.messageHistory.findIndex(msg => msg.role === 'system');
      if (systemIdx === 0) {
        this.messageHistory.splice(1, 1);
      } else {
        this.messageHistory.splice(0, 1);
      }
    }
  }

  // Add an assistant message to history
  addAssistantMessage(message) {
    this.messageHistory.push({ role: 'assistant', content: message });
  }

  // Process the user message with OpenAI and return the assistant's response
  async processMessage(userMessage) {
    if (!this.validateApiKey()) {
      return { success: false, message: 'Please set your OpenAI API key first using the "/ai key" command.' };
    }
    this.addUserMessage(userMessage);
    try {
      const requestBody = {
        model: this.model,
        messages: this.messageHistory,
        max_tokens: 1000,
        temperature: 0.7
      };
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      const responseData = await response.json();
      if (!response.ok) {
        console.error('OpenAI API error:', responseData);
        return { success: false, message: `OpenAI API error: ${responseData.error?.message || 'Unknown error'}` };
      }
      const assistantMessage = responseData.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
      this.addAssistantMessage(assistantMessage);
      return { success: true, message: assistantMessage, totalTokens: responseData.usage?.total_tokens || 0 };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return { success: false, message: `Error: ${error.message || 'Failed to connect to OpenAI'}` };
    }
  }

  // Change the model if it is one of the allowed options
  setModel(model) {
    const validModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
    if (validModels.includes(model)) {
      this.model = model;
      return true;
    }
    return false;
  }

  // Return current settings for display
  getSettings() {
    return {
      model: this.model,
      apiKeySet: !!this.apiKey,
      apiEndpoint: this.apiEndpoint,
      messageCount: this.messageHistory.length,
      systemPromptPreview: this.systemPrompt.substring(0, 50) + '...'
    };
  }
}

// Initialize and integrate with ChatInterface
document.addEventListener('DOMContentLoaded', function() {
  // Create a global OpenAI service instance
  window.openAIService = new OpenAIService();

  // Wait for ChatInterface to be available
  const waitForChatInterface = setInterval(() => {
    if (window.ChatInterface) {
      clearInterval(waitForChatInterface);
      initOpenAIChatIntegration();
    }
  }, 100);

  function initOpenAIChatIntegration() {
    // Store original methods
    const originalSendMessage = ChatInterface.sendMessage;
    const originalProcessCommand = ChatInterface.processCommand;

    // Add a property to track API key status
    ChatInterface.apiKeySet = false;

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
      if (isDirectCommand || !window.openAIService.apiKey) {
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

    // API key command handling
    function handleApiKey(apiKey, chatInterface) {
      const result = window.openAIService.setApiKey(apiKey);
      if (result) {
        chatInterface.apiKeySet = true;
        window.ChatInterface.apiKeySet = true;
        chatInterface.addSystemMessage('✅ API key set successfully! Your key is stored in your browser.');
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

    // Reset API endpoint command
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

    // Display a welcome message with AI instructions
    setTimeout(() => {
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
    }, 1000);
  }
});