/**
 * js/chat/chat-debug-utils.js
 * Debug utilities for Terminal Chat Interface
 * 
 * Provides debug functions for testing and troubleshooting modules
 */

document.addEventListener('DOMContentLoaded', function() {
    // Add debugging function to window for troubleshooting code module
    window.debugCodeModule = function() {
        console.log("=== CODE MODULE DEBUG ===");
        
        if (!window.Commands) {
            console.error("Commands object not available");
            return;
        }
        
        if (!window.Commands.canvasManager) {
            console.error("Canvas Manager not available");
            return;
        }
        
        const cm = window.Commands.canvasManager;
        console.log("Available modules:", Object.keys(cm.modules || {}));
        
        const codeModule = cm.getModule('code');
        if (!codeModule) {
            console.error("Code module not found in canvas manager");
            return;
        }
        
        console.log("Code module properties:", Object.getOwnPropertyNames(codeModule));
        console.log("Code module prototype methods:", 
                    Object.getOwnPropertyNames(Object.getPrototypeOf(codeModule)));
        
        // Test the module with a simple code snippet
        console.log("Testing code module directly:");
        try {
            const result = codeModule.displayCode('console.log("Test");');
            console.log("Direct displayCode result:", result);
        } catch (error) {
            console.error("Error calling displayCode directly:", error);
        }
    };
    
    // Add debugging function for markdown module
    window.debugMarkdownModule = function() {
        console.log("=== MARKDOWN MODULE DEBUG ===");
        
        if (!window.Commands) {
            console.error("Commands object not available");
            return;
        }
        
        if (!window.Commands.canvasManager) {
            console.error("Canvas Manager not available");
            return;
        }
        
        const cm = window.Commands.canvasManager;
        console.log("Available modules:", Object.keys(cm.modules || {}));
        
        const mdModule = cm.getModule('markdown');
        if (!mdModule) {
            console.error("Markdown module not found in canvas manager");
            return;
        }
        
        console.log("Markdown module properties:", Object.getOwnPropertyNames(mdModule));
        console.log("Markdown module prototype methods:", 
                   Object.getOwnPropertyNames(Object.getPrototypeOf(mdModule)));
        
        // Test the module with a simple markdown snippet
        console.log("Testing markdown module directly:");
        try {
            const result = mdModule.renderMarkdown('# Test Heading\n\nThis is a test.');
            console.log("Direct renderMarkdown result:", result);
        } catch (error) {
            console.error("Error calling renderMarkdown directly:", error);
        }
    };
    
    // Add debugging function for terminal module
    window.debugTerminalModule = function() {
        console.log("=== TERMINAL MODULE DEBUG ===");
        
        if (!window.Commands) {
            console.error("Commands object not available");
            return;
        }
        
        if (!window.Commands.canvasManager) {
            console.error("Canvas Manager not available");
            return;
        }
        
        const cm = window.Commands.canvasManager;
        console.log("Available modules:", Object.keys(cm.modules || {}));
        
        const terminalModule = cm.getModule('terminal');
        if (!terminalModule) {
            console.error("Terminal module not found in canvas manager");
            return;
        }
        
        console.log("Terminal module properties:", Object.getOwnPropertyNames(terminalModule));
        console.log("Terminal module prototype methods:", 
                   Object.getOwnPropertyNames(Object.getPrototypeOf(terminalModule)));
        
        // Test the module with basic functions
        console.log("Testing terminal module directly:");
        try {
            // Just report connection status
            console.log("Terminal connected:", terminalModule.connected);
        } catch (error) {
            console.error("Error accessing terminal module:", error);
        }
    };
    
    // General canvas manager debug utility
    window.debugCanvasManager = function() {
        console.log("=== CANVAS MANAGER DEBUG ===");
        
        if (!window.Commands) {
            console.error("Commands object not available");
            return;
        }
        
        if (!window.Commands.canvasManager) {
            console.error("Canvas Manager not available");
            return;
        }
        
        const cm = window.Commands.canvasManager;
        console.log("Canvas Manager:", cm);
        console.log("Available modules:", Object.keys(cm.modules || {}));
        console.log("Active module:", cm.activeModule);
        
        // List all methods
        console.log("Canvas Manager methods:", 
                   Object.getOwnPropertyNames(Object.getPrototypeOf(cm)).filter(p => typeof cm[p] === 'function'));
    };
    
    // AI integration debug utility
    window.debugAIIntegration = function() {
        console.log("=== AI INTEGRATION DEBUG ===");
        
        if (!window.openAIService) {
            console.error("OpenAI service not available");
            return;
        }
        
        console.log("OpenAI Service:", window.openAIService);
        console.log("API Key set:", window.openAIService.validateApiKey());
        console.log("Current model:", window.openAIService.model);
        console.log("Message history count:", window.openAIService.messageHistory.length);
        
        // Check if ChatInterface has AI flag set
        if (window.ChatInterface) {
            console.log("ChatInterface.apiKeySet:", window.ChatInterface.apiKeySet);
        }
    };
    
    console.log("Chat debug utilities initialized");
});