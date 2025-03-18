/**
 * js/chat/chat-llm-openai-service.js
 * Core OpenAI API Service
 * 
 * This file provides the basic OpenAI service for API integration.
 * It handles API keys, endpoints, and communication with OpenAI.
 */

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

    console.log('[DEBUG] OpenAIService initialized');
    
    // Set initialization flag for slash command system to detect
    window.openAIServiceInitialized = true;
  }

  // Validate the API key format (basic check)
  validateApiKey() {
    return (
      this.apiKey &&
      typeof this.apiKey === 'string' &&
      this.apiKey.startsWith('sk-') &&
      this.apiKey.length > 30
    );
  }

  // Set API key and save it to localStorage
  setApiKey(key) {
    this.apiKey = key;
    try {
      localStorage.setItem('canvas_openai_api_key', key);
      console.log(
        '[DEBUG] API key saved to localStorage as "canvas_openai_api_key":',
        key.substring(0, 6) + '...'
      );
    } catch (e) {
      console.warn('[DEBUG] Could not save API key to localStorage', e);
    }
    const isValid = this.validateApiKey();
    // Update ChatInterface flag if available
    if (isValid && window.ChatInterface) {
      window.ChatInterface.apiKeySet = true;
    }
    // Update status bar if available
    if (typeof updateStatusBarWithAIInfo === 'function') {
      updateStatusBarWithAIInfo(this.model);
    }
    
    // Dispatch an event that the slash command system can listen for
    document.dispatchEvent(new CustomEvent('openai:api-key-updated', { 
      detail: { valid: isValid }
    }));
    
    return isValid;
  }

  // Load the API key from localStorage
  loadSavedApiKey() {
    try {
      const savedKey = localStorage.getItem('canvas_openai_api_key');
      if (savedKey) {
        this.apiKey = savedKey;
        console.log(
          '[DEBUG] Loaded API key from localStorage:',
          savedKey.substring(0, 6) + '...'
        );
        // Delay update to allow ChatInterface to initialize
        if (this.validateApiKey()) {
          setTimeout(() => {
            if (window.ChatInterface) {
              window.ChatInterface.apiKeySet = true;
              console.log('[DEBUG] Updated ChatInterface.apiKeySet to true after loading API key');
            }
            
            // Dispatch an event that the slash command system can listen for
            document.dispatchEvent(new CustomEvent('openai:api-key-loaded', { 
              detail: { valid: true }
            }));
          }, 500);
        }
      } else {
        console.log('[DEBUG] No API key found in localStorage under "canvas_openai_api_key".');
      }
    } catch (e) {
      console.warn('[DEBUG] Could not load API key from localStorage', e);
    }
  }

  // Set API endpoint and save it to localStorage
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
      
      // Dispatch an event that the slash command system can listen for
      document.dispatchEvent(new CustomEvent('openai:endpoint-updated', { 
        detail: { endpoint: endpoint }
      }));
      
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

  // Reset API endpoint to default and remove from localStorage
  resetApiEndpoint() {
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    try {
      localStorage.removeItem('openai_api_endpoint');
    } catch (e) {
      console.warn('Could not remove API endpoint from localStorage', e);
    }
    
    // Dispatch an event that the slash command system can listen for
    document.dispatchEvent(new CustomEvent('openai:endpoint-reset', {}));
    
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
    
    // Dispatch an event that the slash command system can listen for
    document.dispatchEvent(new CustomEvent('openai:conversation-reset', {}));
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
      if (typeof updateStatusBarWithAIInfo === 'function' && this.validateApiKey()) {
        updateStatusBarWithAIInfo(model);
      }
      
      // Dispatch an event that the slash command system can listen for
      document.dispatchEvent(new CustomEvent('openai:model-changed', { 
        detail: { model: model }
      }));
      
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

// Initialize OpenAI service when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.openAIService = new OpenAIService();

  // Wait for ChatInterface to be available, then update API key status
  const waitForChatInterface = setInterval(() => {
    if (window.ChatInterface) {
      clearInterval(waitForChatInterface);
      // Just set the API key status without initializing the old integration
      window.ChatInterface.apiKeySet = window.openAIService.validateApiKey();
      
      // Let the system know the chat interface is ready
      document.dispatchEvent(new CustomEvent('openai:chat-interface-ready', {}));
    }
  }, 100);
});

// Debug helper function to inspect OpenAI service state
window.debugOpenAIService = () => {
  console.log("=== OpenAI Service Debug ===");
  if (!window.openAIService) {
    console.error("OpenAI service not initialized yet");
    return;
  }
  console.log("API Key:", window.openAIService.apiKey ? window.openAIService.apiKey.substring(0, 6) + "..." : "Not set");
  console.log("API Key Valid:", window.openAIService.validateApiKey());
  try {
    const storedKey = localStorage.getItem('canvas_openai_api_key');
    console.log("LocalStorage API Key:", storedKey ? storedKey.substring(0, 6) + "..." : "Not found");
  } catch (e) {
    console.error("Cannot access localStorage:", e);
  }
  console.log("ChatInterface.apiKeySet:", window.ChatInterface ? window.ChatInterface.apiKeySet : "Not initialized");
  console.log("Current Model:", window.openAIService.model);
  console.log("API Endpoint:", window.openAIService.apiEndpoint);
  console.log("Message History Length:", window.openAIService.messageHistory.length);
  console.log("=== End Debug ===");
};