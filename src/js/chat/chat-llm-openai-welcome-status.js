/**
 * js/chat/llms/chat-llm-openai-welcome-status.js
 * Welcome Messages and Status Bar for OpenAI Integration
 */

// Initialize status bar once OpenAIService is ready
document.addEventListener('DOMContentLoaded', () => {
  const waitForOpenAI = setInterval(() => {
    if (window.openAIService) {
      clearInterval(waitForOpenAI);
      initStatusBar();
    }
  }, 200);
});

// Initialize the status bar with current AI info
const initStatusBar = () => {
  if (!window.openAIService) return;
  const isApiKeySet = window.openAIService.validateApiKey();
  const model = isApiKeySet ? window.openAIService.model : null;
  updateStatusBarWithAIInfo(model);
};

// Show welcome messages based on API key status
const showWelcomeMessages = () => {
  if (!window.openAIService || !window.ChatInterface) return;
  
  const isApiKeySet = window.openAIService.validateApiKey();
  let welcomeMessage = '';
  
  if (isApiKeySet) {
    // Time-based greeting
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    welcomeMessage = `${greeting}! Type a question or command to begin, or /help for more options.`;
  } else {
    // Prompt to set API key
    welcomeMessage = 'Welcome! Set your OpenAI API key with /ai key YOUR_KEY to get started.';
  }
  
  ChatInterface.addSystemMessage(welcomeMessage);
};

// Update the status bar with AI model info
const updateStatusBarWithAIInfo = (model) => {
  const statusBar = document.querySelector('.status-bar');
  if (!statusBar) return;
  
  let aiStatusItem = document.getElementById('ai-status-item');
  if (!aiStatusItem) {
    aiStatusItem = document.createElement('div');
    aiStatusItem.className = 'status-item';
    aiStatusItem.id = 'ai-status-item';
    // Insert before the last item if available, else append
    const lastItem = statusBar.lastElementChild;
    lastItem ? statusBar.insertBefore(aiStatusItem, lastItem) : statusBar.appendChild(aiStatusItem);
  }
  
  if (model) {
    // Display model info if API key is valid
    const capitalizedModel = model.charAt(0).toUpperCase() + model.slice(1);
    aiStatusItem.innerHTML = `
      <i class="fas fa-robot"></i>
      <span>AI: OpenAI ${capitalizedModel}</span>
    `;
    aiStatusItem.classList.add('status-connected');
    aiStatusItem.classList.remove('status-disconnected');
  } else {
    // Display disconnected status
    aiStatusItem.innerHTML = `
      <i class="fas fa-robot"></i>
      <span>AI: Not Connected</span>
    `;
    aiStatusItem.classList.add('status-disconnected');
    aiStatusItem.classList.remove('status-connected');
  }
  
  // Add click handler if not already set
  if (!aiStatusItem.hasClickHandler) {
    aiStatusItem.addEventListener('click', () => {
      if (window.openAIService?.validateApiKey()) {
        showAIStatusPopup();
      } else if (typeof showAIConnectionPrompt === 'function') {
        showAIConnectionPrompt();
      } else if (window.ChatInterface) {
        window.ChatInterface.processCommand('/ai help');
      }
    });
    aiStatusItem.hasClickHandler = true;
  }
};

// Show popup with AI status and settings
const showAIStatusPopup = () => {
  if (!window.openAIService) return;
  
  const settings = window.openAIService.getSettings();
  const messageHTML = `
    <div class="ai-status-popup">
      <div class="popup-header">
        <i class="fas fa-robot"></i>
        <span>AI Connection Status</span>
      </div>
      <div class="popup-content">
        <table class="status-table">
          <tr>
            <td>Provider:</td>
            <td>OpenAI</td>
          </tr>
          <tr>
            <td>Model:</td>
            <td>${settings.model}</td>
          </tr>
          <tr>
            <td>Status:</td>
            <td><span class="status-badge connected">Connected</span></td>
          </tr>
          <tr>
            <td>API Key:</td>
            <td>${settings.apiKeySet ? '✅ Set' : '❌ Not set'}</td>
          </tr>
          <tr>
            <td>API Endpoint:</td>
            <td class="endpoint-cell">${settings.apiEndpoint}</td>
          </tr>
          <tr>
            <td>Messages:</td>
            <td>${settings.messageCount} in history</td>
          </tr>
        </table>
      </div>
      <div class="popup-actions">
        <button class="popup-action change-model">Change Model</button>
        <button class="popup-action clear-history">Clear History</button>
        <button class="popup-action close-popup">Close</button>
      </div>
    </div>
  `;
  
  const messageElement = ChatInterface.addSystemMessage(messageHTML);
  if (messageElement) {
    // Update the message text with the popup content
    const messageText = messageElement.querySelector('.message-text');
    if (messageText) messageText.innerHTML = messageHTML;
    
    // Add event listeners for popup actions
    messageElement.querySelector('.change-model')?.addEventListener('click', () => {
      ChatInterface.processCommand('/ai model');
    });
    messageElement.querySelector('.clear-history')?.addEventListener('click', () => {
      ChatInterface.processCommand('/ai clear');
    });
    messageElement.querySelector('.close-popup')?.addEventListener('click', () => {
      messageElement.remove();
    });
  }
};