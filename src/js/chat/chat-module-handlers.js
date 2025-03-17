/**
 * js/chat/chat-module-handlers.js
 * Direct module handlers for Terminal Chat Interface
 * 
 * Extends ChatInterface with direct module execution methods
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait for ChatInterface to be available
    const waitForChatInterface = setInterval(() => {
        if (window.ChatInterface) {
            clearInterval(waitForChatInterface);
            initModuleHandlers();
        }
    }, 100);
    
    function initModuleHandlers() {
        // Add direct module execution methods to ChatInterface
        
        // Execute chart module commands directly
        ChatInterface.executeChartCommand = function(chartType) {
            try {
                console.log("Directly executing chart command:", chartType);
                
                // Direct canvas-manager manipulation for charts
                if (window.Commands && window.Commands.canvasManager) {
                    const cm = window.Commands.canvasManager;
                    cm.activateModule('chart');
                    const chartModule = cm.getModule('chart');
                    
                    if (chartModule) {
                        // For chart module, first generate random data
                        chartModule.generateRandomData();
                        
                        // Then set chart type and render
                        chartModule.chartType = chartType;
                        chartModule.render();
                        return true;
                    }
                }
                return false;
            } catch (e) {
                console.error("Error executing chart command directly:", e);
                return false;
            }
        };
        
        // Execute code module commands directly
        ChatInterface.executeCodeCommand = function(codeContent) {
            try {
                console.log("Directly executing code command with content length:", codeContent.length);
                
                // Direct canvas-manager manipulation for code display
                if (window.Commands && window.Commands.canvasManager) {
                    const cm = window.Commands.canvasManager;
                    cm.activateModule('code');
                    const codeModule = cm.getModule('code');
                    
                    if (codeModule) {
                        // Call the displayCode method directly
                        console.log("Code module found, calling displayCode directly");
                        if (typeof codeModule.displayCode === 'function') {
                            codeModule.displayCode(codeContent);
                            return true;
                        } else {
                            console.error("displayCode method not found on code module", codeModule);
                            // Try using the standard command interface as fallback
                            return cm.executeCommand('display', codeContent);
                        }
                    } else {
                        console.error("Code module not found in canvas manager");
                    }
                } else {
                    console.error("Canvas manager not available");
                }
                return false;
            } catch (e) {
                console.error("Error executing code command directly:", e);
                return false;
            }
        };
        
        // Execute markdown module commands directly
        ChatInterface.executeMarkdownCommand = function(action, content) {
            try {
                console.log("Directly executing markdown command:", action, content);
                
                // Direct canvas-manager manipulation for markdown
                if (window.Commands && window.Commands.canvasManager) {
                    const cm = window.Commands.canvasManager;
                    cm.activateModule('markdown');
                    const mdModule = cm.getModule('markdown');
                    
                    if (mdModule) {
                        // Call specific methods based on action
                        if (action === 'render' && content) {
                            return mdModule.renderMarkdown(content);
                        } else if (action === 'load') {
                            return mdModule.loadMarkdown(content || 'sample');
                        } else if (action === 'theme') {
                            return mdModule.setTheme(content || 'dark');
                        } else if (action === 'scroll') {
                            // Handle scroll with default amount
                            const direction = content || 'down';
                            return mdModule.handleCommand('scroll', [direction]);
                        }
                    } else {
                        console.error("Markdown module not found in canvas manager");
                    }
                } else {
                    console.error("Canvas manager not available");
                }
                return false;
            } catch (e) {
                console.error("Error executing markdown command directly:", e);
                return false;
            }
        };
        
        // Execute terminal module commands directly
        ChatInterface.executeTerminalCommand = function(action, content) {
            try {
                console.log("Directly executing terminal command:", action, content);
                
                // Direct canvas-manager manipulation for terminal
                if (window.Commands && window.Commands.canvasManager) {
                    const cm = window.Commands.canvasManager;
                    cm.activateModule('terminal');
                    const terminalModule = cm.getModule('terminal');
                    
                    if (terminalModule) {
                        // Call specific methods based on action
                        if (action === 'connect' && content) {
                            return terminalModule.connect(content);
                        } else if (action === 'send' && content) {
                            return terminalModule.sendData(content);
                        } else if (action === 'disconnect') {
                            return terminalModule.disconnect();
                        } else if (action === 'clear') {
                            return terminalModule.clearTerminal();
                        }
                    } else {
                        console.error("Terminal module not found in canvas manager");
                    }
                } else {
                    console.error("Canvas manager not available");
                }
                return false;
            } catch (e) {
                console.error("Error executing terminal command directly:", e);
                return false;
            }
        };
        
        console.log("Chat module handlers initialized");
    }
});