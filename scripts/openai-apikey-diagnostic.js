/**
 * api-key-diagnosis-tool.js
 * Diagnostic tool for OpenAI API key persistence issues
 * 
 * This can be pasted directly into the browser console to diagnose issues.
 */

/**
 * Run a full diagnosis of API key persistence issues
 */
function diagnoseAPIKeyPersistence() {
    console.log("=== API Key Persistence Diagnostic Tool ===");
    console.log("Running comprehensive diagnosis on API key persistence...");
    
    // Check if key components are available
    checkCoreComponents();
    
    // Check localStorage access
    checkLocalStorage();
    
    // Check API key values in different locations
    checkAPIKeyValues();
    
    // Check command handlers
    checkCommandHandlers();
    
    // Provide recommendations
    provideRecommendations();
  }
  
  /**
   * Fix common API key persistence issues automatically
   */
  function fixAPIKeyIssues() {
    console.log("=== Attempting to fix API key persistence issues ===");
    
    // 1. Check if we have an OpenAIService
    if (!window.openAIService) {
      console.log("❌ Cannot fix issues: OpenAIService not found");
      console.log("   Make sure openai-integration.js is loaded first");
      return;
    }
    
    // 2. Check if we have an API key in the service
    const currentKey = window.openAIService.apiKey;
    if (!currentKey) {
      // Try to load from localStorage
      try {
        const storedKey = localStorage.getItem('canvas_openai_api_key');
        if (storedKey) {
          console.log("Found API key in localStorage, applying to service");
          window.openAIService.apiKey = storedKey;
        } else {
          console.log("❌ No API key found in service or localStorage");
          console.log("   Please set your API key first using /ai key YOUR_KEY");
          return;
        }
      } catch (e) {
        console.log("❌ Error accessing localStorage:", e.message);
        return;
      }
    }
    
    // 3. Validate the key
    const isValid = window.openAIService.validateApiKey();
    if (!isValid) {
      console.log("❌ Current API key is invalid");
      console.log("   Please set a valid API key using /ai key YOUR_KEY");
      return;
    }
    
    // 4. Ensure the key is in localStorage
    try {
      const storedKey = localStorage.getItem('canvas_openai_api_key');
      if (!storedKey || storedKey !== window.openAIService.apiKey) {
        localStorage.setItem('canvas_openai_api_key', window.openAIService.apiKey);
        console.log("✅ Updated API key in localStorage");
      }
    } catch (e) {
      console.log("❌ Error saving to localStorage:", e.message);
    }
    
    // 5. Update ChatInterface
    if (window.ChatInterface) {
      window.ChatInterface.apiKeySet = true;
      console.log("✅ Updated ChatInterface.apiKeySet to true");
    }
    
    console.log("\n✅ All fixes applied!");
    console.log("   If you're still having issues:");
    console.log("   1. Reload the page and check if the API key persists");
    console.log("   2. Try setting the key again with /ai key YOUR_KEY");
    console.log("   3. Check browser console for any errors");
  }
  
  // Export diagnosis functions to global scope
  window.diagnoseAPIKeyPersistence = diagnoseAPIKeyPersistence;
  window.fixAPIKeyIssues = fixAPIKeyIssues;
  
  // Auto-run diagnosis if script is executed directly
  console.log("API Key Persistence Diagnostic Tool loaded");
  console.log("Run diagnoseAPIKeyPersistence() to start diagnosis");
  console.log("Run fixAPIKeyIssues() to attempt automatic fixes");
  
  
  function checkCoreComponents() {
    console.log("\n=== Core Components ===");
    
    // Check OpenAIService
    if (window.openAIService) {
      console.log("✅ OpenAIService found");
      console.log("  Model:", window.openAIService.model);
      console.log("  API Endpoint:", window.openAIService.apiEndpoint);
      
      if (typeof window.openAIService.validateApiKey === 'function') {
        console.log("✅ validateApiKey method found");
      } else {
        console.log("❌ validateApiKey method NOT found");
      }
      
      if (typeof window.openAIService.setApiKey === 'function') {
        console.log("✅ setApiKey method found");
      } else {
        console.log("❌ setApiKey method NOT found");
      }
      
      if (typeof window.openAIService.loadSavedApiKey === 'function') {
        console.log("✅ loadSavedApiKey method found");
      } else {
        console.log("❌ loadSavedApiKey method NOT found");
      }
    } else {
      console.log("❌ OpenAIService NOT found");
    }
    
    // Check ChatInterface
    if (window.ChatInterface) {
      console.log("✅ ChatInterface found");
      console.log("  apiKeySet property:", window.ChatInterface.apiKeySet);
      
      if (typeof window.ChatInterface.sendMessage === 'function') {
        console.log("✅ sendMessage method found");
      } else {
        console.log("❌ sendMessage method NOT found");
      }
    } else {
      console.log("❌ ChatInterface NOT found");
    }
    
    // Check SlashCommands
    if (window.SlashCommands) {
      console.log("✅ SlashCommands found");
      
      // Check if AI commands are registered
      const hasAICommands = window.SlashCommands.commands && 
                           window.SlashCommands.commands.global && 
                           window.SlashCommands.commands.global['/ai key'];
      
      console.log("  AI commands registered:", hasAICommands ? "Yes" : "No");
    } else {
      console.log("❌ SlashCommands NOT found");
    }
  }
  
  function checkLocalStorage() {
    console.log("\n=== localStorage Access ===");
    
    try {
      // Test localStorage access
      const testKey = "_test_key_" + Date.now();
      localStorage.setItem(testKey, "test");
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved === "test") {
        console.log("✅ localStorage is accessible and working");
      } else {
        console.log("❌ localStorage not working correctly");
        console.log("  Set value:", "test");
        console.log("  Retrieved value:", retrieved);
      }
    } catch (e) {
      console.log("❌ Error accessing localStorage:", e.message);
      console.log("  This might be due to private browsing mode or browser settings");
    }
    
    // Check for relevant keys
    try {
      const apiKey = localStorage.getItem('canvas_openai_api_key');
      console.log("  'canvas_openai_api_key':", apiKey ? `Found (starts with ${apiKey.substring(0, 6)}...)` : "Not found");
      
      const apiEndpoint = localStorage.getItem('openai_api_endpoint');
      console.log("  'openai_api_endpoint':", apiEndpoint || "Not found");
    } catch (e) {
      console.log("❌ Error reading values from localStorage:", e.message);
    }
  }
  
  function checkAPIKeyValues() {
    console.log("\n=== API Key Values ===");
    
    // OpenAIService apiKey value
    if (window.openAIService) {
      const apiKey = window.openAIService.apiKey;
      console.log("OpenAIService.apiKey:", apiKey ? `Set (starts with ${apiKey.substring(0, 6)}...)` : "Not set");
      
      const isValid = window.openAIService.validateApiKey();
      console.log("API key is valid:", isValid ? "Yes" : "No");
    }
    
    // Check localStorage value
    try {
      const storedKey = localStorage.getItem('canvas_openai_api_key');
      console.log("localStorage API key:", storedKey ? `Found (starts with ${storedKey.substring(0, 6)}...)` : "Not found");
      
      // Compare the two
      if (window.openAIService && storedKey) {
        const match = window.openAIService.apiKey === storedKey;
        console.log("API keys match between service and localStorage:", match ? "Yes" : "No");
      }
    } catch (e) {
      console.log("Error reading API key from localStorage:", e.message);
    }
    
    // Check ChatInterface state
    if (window.ChatInterface) {
      console.log("ChatInterface.apiKeySet:", window.ChatInterface.apiKeySet ? "True" : "False");
    }
  }
  
  function checkCommandHandlers() {
    console.log("\n=== Command Handlers ===");
    
    // Check for slash command handlers
    if (window.SlashCommands) {
      const hasAIKeyCommand = window.SlashCommands.commands && 
                             window.SlashCommands.commands.global && 
                             window.SlashCommands.commands.global['/ai key'];
      
      console.log("/ai key command registered:", hasAIKeyCommand ? "Yes" : "No");
    }
    
    // Check for handleApiKey function in OpenAI integration
    let handleApiKeyFound = false;
    
    // Look for the function in the global scope and all accessible objects
    if (typeof handleApiKey === 'function') {
      handleApiKeyFound = true;
      console.log("handleApiKey function found in global scope");
    } else if (window.handleApiKey && typeof window.handleApiKey === 'function') {
      handleApiKeyFound = true;
      console.log("handleApiKey function found as window property");
    } else {
      console.log("handleApiKey function not found in global scope");
    }
    
    // Check for direct integration in ChatInterface
    let chatInterfaceHandlerFound = false;
    if (window.ChatInterface && window.ChatInterface.sendMessage) {
      const sendMessageStr = window.ChatInterface.sendMessage.toString();
      if (sendMessageStr.includes('handleApiKey')) {
        chatInterfaceHandlerFound = true;
        console.log("handleApiKey reference found in ChatInterface.sendMessage");
      } else {
        console.log("No handleApiKey reference found in ChatInterface.sendMessage");
      }
    }
    
    console.log("Command handlers status:", 
      (hasAIKeyCommand && (handleApiKeyFound || chatInterfaceHandlerFound)) ? 
        "Appear to be properly set up" : 
        "May have issues");
  }