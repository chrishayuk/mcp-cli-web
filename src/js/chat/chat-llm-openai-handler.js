/**
 * js/chat/chat-llm-openai-handler.js.js
 * Simplified Chat Interface Integration for OpenAI
 * 
 * This file provides only the basic OpenAI message processing functionality.
 * All slash command handling is deferred to the new slash command system.
 */

// Wait for both OpenAIService and ChatInterface to be available, then initialize integration
document.addEventListener('DOMContentLoaded', () => {
  const waitForDependencies = setInterval(() => {
    if (window.openAIService && window.ChatInterface) {
      clearInterval(waitForDependencies);
      initOpenAIChatIntegration();
    }
  }, 100);
});

const initOpenAIChatIntegration = () => {
  console.log("Initializing OpenAI chat integration...");
  
  // Track API key status on ChatInterface
  window.ChatInterface.apiKeySet = window.openAIService.validateApiKey();
  
  // Create a function to process messages with OpenAI
  const processWithOpenAI = async (message, chatInterface) => {
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
  };
  
  // Expose processWithOpenAI on ChatInterface for other components to use
  window.ChatInterface.processWithOpenAI = function(message) {
    processWithOpenAI(message, this);
  };
  
  // Add checkAndExecuteCommands to recognize commands in AI responses
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
  
  // Initialize welcome messages only once after a short delay
  setTimeout(() => {
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
      const systemMessage = ChatInterface.addSystemMessage(welcomeHTML);
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
  
  // Return a test function for debugging
  window.testOpenAIMessage = function(message) {
    console.log("Testing OpenAI message:", message);
    if (window.ChatInterface && window.openAIService) {
      window.ChatInterface.addUserMessage(message);
      processWithOpenAI(message, window.ChatInterface);
      return "Message sent to OpenAI";
    }
    return "Error: Dependencies not available";
  };
};