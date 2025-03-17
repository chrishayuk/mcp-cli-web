/**
 * js/chat/openai-welcome-status.js
 * Welcome Messages and Status Bar for OpenAI Integration
 * 
 * This file handles welcome messages and the status bar indicator
 * for the OpenAI integration in Terminal Chat Canvas.
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
    // Check if OpenAI service is available
    if (!window.openAIService) return;
    
    // Initialize status bar with current state
    const isApiKeySet = window.openAIService.validateApiKey();
    const model = isApiKeySet ? window.openAIService.model : null;
    
    // Update status bar
    updateStatusBarWithAIInfo(model);
    
    console.log('OpenAI status bar initialized');
  }
  
  /**
   * Show welcome messages based on API key status
   */
  function showWelcomeMessages() {
    // Check if required objects are available
    if (!window.openAIService || !window.ChatInterface) {
      console.error('Required dependencies not available for welcome messages');
      return;
    }
  
    // Check if API key is already set
    const isApiKeySet = window.openAIService.validateApiKey();
    
    if (isApiKeySet) {
      // For returning users: Show welcome message from AI assistant
      const aiModel = window.openAIService.model;
      const capitalizedModel = aiModel.charAt(0).toUpperCase() + aiModel.slice(1);
      
      const welcomeHTML = `
  <div class="ai-welcome returning-user">
    <h3>🤖 Welcome to Canvas Terminal with OpenAI ${capitalizedModel}!</h3>
    <p>I'm your AI assistant powered by OpenAI's ${capitalizedModel} model. How can I help you today?</p>
    <p>I can help you with:</p>
    <ul>
      <li>Creating visualizations (<code>chart pie</code>, <code>bar chart</code>, etc.)</li>
      <li>Showing images (<code>show image</code>)</li>
      <li>Displaying code with syntax highlighting</li>
      <li>Drawing patterns and shapes</li>
      <li>Answering questions about any topic</li>
    </ul>
    <p>Just start typing your question or request!</p>
  </div>
  `;
      // Process welcome message through AI service to make it seem like it's coming from the AI
      window.openAIService.addAssistantMessage(welcomeHTML);
      const systemMessage = ChatInterface.addSystemMessage(welcomeHTML);
      if (systemMessage) {
        const messageText = systemMessage.querySelector('.message-text');
        if (messageText) messageText.innerHTML = welcomeHTML;
        
        // Add AI avatar to make it look like it's from the AI
        const avatar = systemMessage.querySelector('.message-avatar');
        if (avatar) {
          avatar.innerHTML = '<i class="fas fa-robot"></i>';
          avatar.classList.remove('system-avatar');
          avatar.classList.add('ai-avatar');
        }
      }
      
      // Generate a personalized greeting based on time of day
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
      
      // Process a simple follow-up message
      setTimeout(() => {
        const followUpMessage = `${greeting}! Type a question or try one of my commands like "create a pie chart" or "show a random image".`;
        window.openAIService.addAssistantMessage(followUpMessage);
        const followUpElement = ChatInterface.addSystemMessage(followUpMessage);
        
        // Add AI avatar to follow-up message
        if (followUpElement) {
          const avatar = followUpElement.querySelector('.message-avatar');
          if (avatar) {
            avatar.innerHTML = '<i class="fas fa-robot"></i>';
            avatar.classList.remove('system-avatar');
            avatar.classList.add('ai-avatar');
          }
        }
      }, 1000);
      
    } else {
      // For new users: Show setup instructions
      const welcomeHTML = `
  <div class="ai-welcome new-user">
    <h3>🚀 Welcome to Terminal Chat Canvas with OpenAI Integration!</h3>
    <p>This is your first time here! To get started with the AI assistant:</p>
    <ol>
      <li>Enter <code>/ai key YOUR_OPENAI_API_KEY</code> to set your API key</li>
      <li>Your key will be saved securely in your browser for future sessions</li>
      <li>Then simply type your questions or requests to chat with the AI</li>
    </ol>
    <p class="welcome-tip"><i class="fas fa-lightbulb"></i> Tip: You can get an OpenAI API key from <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com/api-keys</a></p>
    <p>Or use direct commands without AI:</p>
    <div class="command-examples">
      <span class="example-command">show random image</span>
      <span class="example-command">chart pie</span>
      <span class="example-command">draw pattern</span>
    </div>
    <p>Type <code>/ai help</code> for more AI commands or <code>/help</code> for general commands.</p>
  </div>
  `;
      const systemMessage = ChatInterface.addSystemMessage(welcomeHTML);
      if (systemMessage) {
        const messageText = systemMessage.querySelector('.message-text');
        if (messageText) messageText.innerHTML = welcomeHTML;
      }
      
      // Add event listeners to example commands
      setTimeout(() => {
        const commandExamples = document.querySelectorAll('.example-command');
        commandExamples.forEach(example => {
          example.addEventListener('click', () => {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
              chatInput.value = example.textContent;
              chatInput.focus();
            }
          });
        });
      }, 100);
    }
    
    console.log('Welcome messages displayed');
  }
  
  /**
   * Update the status bar with AI provider and model information
   * @param {string|null} model - The AI model name, or null if not connected
   */
  function updateStatusBarWithAIInfo(model) {
    // Find the status bar
    const statusBar = document.querySelector('.status-bar');
    if (!statusBar) return;
    
    // Look for existing AI status item
    let aiStatusItem = document.getElementById('ai-status-item');
    
    // Create if it doesn't exist
    if (!aiStatusItem) {
      aiStatusItem = document.createElement('div');
      aiStatusItem.className = 'status-item';
      aiStatusItem.id = 'ai-status-item';
      
      // Insert before the last item (usually the clock)
      const lastItem = statusBar.lastElementChild;
      if (lastItem) {
        statusBar.insertBefore(aiStatusItem, lastItem);
      } else {
        statusBar.appendChild(aiStatusItem);
      }
    }
    
    // Update content based on connection status
    if (model) {
      const capitalizedModel = model.charAt(0).toUpperCase() + model.slice(1);
      aiStatusItem.innerHTML = `
        <i class="fas fa-robot"></i>
        <span>AI: OpenAI ${capitalizedModel}</span>
      `;
      aiStatusItem.classList.add('status-connected');
      aiStatusItem.classList.remove('status-disconnected');
      
      // Add status-updated class briefly for animation
      aiStatusItem.classList.add('status-updated');
      setTimeout(() => {
        aiStatusItem.classList.remove('status-updated');
      }, 500);
    } else {
      aiStatusItem.innerHTML = `
        <i class="fas fa-robot"></i>
        <span>AI: Not Connected</span>
      `;
      aiStatusItem.classList.add('status-disconnected');
      aiStatusItem.classList.remove('status-connected');
    }
    
    // Add click event to show AI settings if not already added
    if (!aiStatusItem.hasClickHandler) {
      aiStatusItem.addEventListener('click', () => {
        if (window.openAIService.validateApiKey()) {
          // If connected, show current settings
          showAIStatusPopup();
        } else {
          // If not connected, show connection prompt
          showAIConnectionPrompt();
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
      
      // Add event listeners for buttons
      const changeModelBtn = messageElement.querySelector('.change-model');
      const clearHistoryBtn = messageElement.querySelector('.clear-history');
      const closePopupBtn = messageElement.querySelector('.close-popup');
      
      if (changeModelBtn) {
        changeModelBtn.addEventListener('click', () => {
          // Execute the model selection command
          if (window.ChatInterface) {
            ChatInterface.processCommand('/ai model');
          }
        });
      }
      
      if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
          // Execute the clear history command
          if (window.ChatInterface) {
            ChatInterface.processCommand('/ai clear');
          }
        });
      }
      
      if (closePopupBtn) {
        closePopupBtn.addEventListener('click', () => {
          // Remove the message element
          messageElement.remove();
        });
      }
    }
  }