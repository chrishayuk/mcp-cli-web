/**
 * js/chat/llms/openai-welcome-status.js
 * Welcome Messages and Status Bar for OpenAI Integration
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait for OpenAIService to be available before initializing
  const waitForOpenAI = setInterval(() => {
    if (window.openAIService) {
      clearInterval(waitForOpenAI);
      initStatusBar();
    }
  }, 200);
});

/**
 * Initialize the status bar with AI info
 */
function initStatusBar() {
  if (!window.openAIService) return;
  
  const isApiKeySet = window.openAIService.validateApiKey();
  const model = isApiKeySet ? window.openAIService.model : null;
  
  updateStatusBarWithAIInfo(model);
}

/**
 * Show a simple welcome message
 */
function showWelcomeMessages() {
  if (!window.openAIService || !window.ChatInterface) {
    return;
  }

  // Check if API key is already set
  const isApiKeySet = window.openAIService.validateApiKey();
  
  if (isApiKeySet) {
    // For returning users: Just a simple greeting
    const aiModel = window.openAIService.model;
    
    // Get time-based greeting
    const now = new Date();
    const hour = now.getHours();
    let greeting = "Hello";
    
    if (hour < 12) {
      greeting = "Good morning";
    } else if (hour < 18) {
      greeting = "Good afternoon";
    } else {
      greeting = "Good evening";
    }
    
    // Simple one-line welcome message
    const welcomeMessage = `${greeting}! Type a question or command to begin, or /help for more options.`;
    ChatInterface.addSystemMessage(welcomeMessage);
  } else {
    // For new users: Simple prompt to set up API key
    const welcomeMessage = `Welcome! Set your OpenAI API key with /ai key YOUR_KEY to get started.`;
    ChatInterface.addSystemMessage(welcomeMessage);
  }
}

/**
 * Update the status bar with AI provider and model information
 */
function updateStatusBarWithAIInfo(model) {
  const statusBar = document.querySelector('.status-bar');
  if (!statusBar) return;
  
  let aiStatusItem = document.getElementById('ai-status-item');
  
  if (!aiStatusItem) {
    aiStatusItem = document.createElement('div');
    aiStatusItem.className = 'status-item';
    aiStatusItem.id = 'ai-status-item';
    
    const lastItem = statusBar.lastElementChild;
    if (lastItem) {
      statusBar.insertBefore(aiStatusItem, lastItem);
    } else {
      statusBar.appendChild(aiStatusItem);
    }
  }
  
  if (model) {
    const capitalizedModel = model.charAt(0).toUpperCase() + model.slice(1);
    aiStatusItem.innerHTML = `
      <i class="fas fa-robot"></i>
      <span>AI: OpenAI ${capitalizedModel}</span>
    `;
    aiStatusItem.classList.add('status-connected');
    aiStatusItem.classList.remove('status-disconnected');
  } else {
    aiStatusItem.innerHTML = `
      <i class="fas fa-robot"></i>
      <span>AI: Not Connected</span>
    `;
    aiStatusItem.classList.add('status-disconnected');
    aiStatusItem.classList.remove('status-connected');
  }
  
  if (!aiStatusItem.hasClickHandler) {
    aiStatusItem.addEventListener('click', () => {
      if (window.openAIService && window.openAIService.validateApiKey()) {
        showAIStatusPopup();
      } else {
        if (typeof showAIConnectionPrompt === 'function') {
          showAIConnectionPrompt();
        } else {
          if (window.ChatInterface) {
            window.ChatInterface.processCommand('/ai help');
          }
        }
      }
    });
    aiStatusItem.hasClickHandler = true;
  }
}

/**
 * Show a popup with current AI status and settings
 */
function showAIStatusPopup() {
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
    const messageText = messageElement.querySelector('.message-text');
    if (messageText) {
      messageText.innerHTML = messageHTML;
    }
    
    const changeModelBtn = messageElement.querySelector('.change-model');
    const clearHistoryBtn = messageElement.querySelector('.clear-history');
    const closePopupBtn = messageElement.querySelector('.close-popup');
    
    if (changeModelBtn) {
      changeModelBtn.addEventListener('click', () => {
        if (window.ChatInterface) {
          ChatInterface.processCommand('/ai model');
        }
      });
    }
    
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        if (window.ChatInterface) {
          ChatInterface.processCommand('/ai clear');
        }
      });
    }
    
    if (closePopupBtn) {
      closePopupBtn.addEventListener('click', () => {
        messageElement.remove();
      });
    }
  }
}