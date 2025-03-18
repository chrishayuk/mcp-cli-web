/**
 * js/slash-commands/slash-command-init.js
 * Slash Command System Initializer
 * 
 * Main initialization script for the slash command system
 * Loads components in the correct order with dependency checking
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing slash command system...");
    
    // Track initialization state - using both local and global flags
    const initState = {
        core: window.slashCommandHandlerInitialized || false,
        ui: window.slashCommandUIInitialized || false,
        connector: window.slashConnectorInitialized || false,
        aiCommands: window.aiSlashCommandsInitialized || false
    };
    
    /**
     * Initialize the core slash command registry
     */
    function initCore() {
        if (typeof initSlashCommandHandler === 'function') {
            initSlashCommandHandler();
            initState.core = window.slashCommandHandlerInitialized || true;
            console.log("✅ Slash command core initialized");
            checkDependencies();
        } else {
            console.error("initSlashCommandHandler function not available");
        }
    }
    
    /**
     * Initialize the slash command UI
     */
    function initUI() {
        if (!initState.core) {
            console.log("Waiting for core to initialize before UI");
            return;
        }
        
        if (typeof initSlashCommandUI === 'function') {
            initSlashCommandUI();
            initState.ui = window.slashCommandUIInitialized || true;
            console.log("✅ Slash command UI initialized");
            checkDependencies();
        } else {
            console.error("initSlashCommandUI function not available");
        }
    }
    
    /**
     * Initialize the module connector
     */
    function initConnector() {
        if (!initState.core) {
            console.log("Waiting for core to initialize before connector");
            return;
        }
        
        if (typeof initModuleConnector === 'function') {
            initModuleConnector();
            window.slashConnectorInitialized = true;
            initState.connector = true;
            console.log("✅ Slash command module connector initialized");
            checkDependencies();
        } else {
            console.error("initModuleConnector function not available");
        }
    }
    
    /**
     * Initialize the OpenAI commands
     */
    function initAICommands() {
        if (!initState.core || !initState.connector) {
            console.log("Waiting for core and connector to initialize before AI commands");
            return;
        }
        
        if (typeof initOpenAISlashCommands === 'function') {
            initOpenAISlashCommands();
            initState.aiCommands = window.aiSlashCommandsInitialized || true;
            console.log("✅ OpenAI slash commands initialized");
            checkDependencies();
        } else {
            console.error("initOpenAISlashCommands function not available");
        }
    }
    
    /**
     * Check dependencies and initialize components in order
     */
    function checkDependencies() {
        // Update initState from global flags
        initState.core = window.slashCommandHandlerInitialized || initState.core;
        initState.ui = window.slashCommandUIInitialized || initState.ui;
        initState.connector = window.slashConnectorInitialized || initState.connector;
        initState.aiCommands = window.aiSlashCommandsInitialized || initState.aiCommands;
        
        // First initialize core
        if (!initState.core) {
            initCore();
            return;
        }
        
        // Then initialize UI and connector in parallel
        if (!initState.ui) {
            initUI();
        }
        
        if (!initState.connector) {
            initConnector();
        }
        
        // Finally initialize AI commands once core and connector are ready
        if (!initState.aiCommands && initState.core && initState.connector) {
            initAICommands();
        }
        
        // Check if all components are initialized
        if (initState.core && initState.ui && initState.connector && initState.aiCommands) {
            console.log("🚀 All slash command components initialized successfully!");
            
            // Dispatch an event that other parts of the system can listen for
            document.dispatchEvent(new CustomEvent('slash-commands:ready'));
            
            // Mark as initialized in global app state if available
            if (window.AppInit && typeof window.AppInit.register === 'function') {
                window.AppInit.register('slashCommands');
                window.AppInit.register('aiCommands');
            }
        }
    }
    
    // Start initialization process
    checkDependencies();
    
    // Set a timeout to retry initialization if some components fail
    setTimeout(function() {
        if (!initState.core || !initState.ui || !initState.connector || !initState.aiCommands) {
            console.warn("Some slash command components failed to initialize, retrying...");
            
            // Try to load any missing components
            if (!initState.core) initCore();
            if (!initState.ui) initUI();
            if (!initState.connector) initConnector();
            if (!initState.aiCommands) initAICommands();
            
            // Final check after 3 more seconds
            setTimeout(function() {
                if (!initState.core || !initState.ui || !initState.connector || !initState.aiCommands) {
                    console.error("Failed to initialize all slash command components after retries");
                    console.log("Current state:", initState);
                    
                    // Emergency initialization - force the available components
                    if (window.SlashCommands && !initState.core) {
                        console.log("Force-initializing core from existing SlashCommands object");
                        window.SlashCommands.init();
                        window.slashCommandHandlerInitialized = true;
                        initState.core = true;
                    }
                    
                    if (window.SlashCommands && !initState.ui) {
                        console.log("Attempting emergency UI initialization");
                        if (typeof initSlashCommandUI === 'function') {
                            initSlashCommandUI();
                            window.slashCommandUIInitialized = true;
                        } else {
                            setupEmergencyUI();
                        }
                        initState.ui = true;
                    }
                } else {
                    console.log("✅ All slash command components initialized after retry");
                }
            }, 3000);
        }
    }, 5000);
    
    /**
     * Emergency UI setup in case the regular initialization fails
     */
    function setupEmergencyUI() {
        // Basic UI setup just to get slash commands working
        const chatInput = document.getElementById('chat-input');
        if (!chatInput) return;
        
        // Create the dropdown if needed
        let dropdown = document.querySelector('.slash-command-autocomplete');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'slash-command-autocomplete';
            dropdown.style.display = 'none';
            document.body.appendChild(dropdown);
        }
        
        // Set up basic slash handling for input
        chatInput.addEventListener('input', function(e) {
            if (chatInput.value.startsWith('/')) {
                // Get available commands
                const availableCommands = window.SlashCommands.getAvailableCommands();
                const availableDescriptions = window.SlashCommands.getAvailableDescriptions();
                
                // Populate dropdown
                dropdown.innerHTML = '';
                
                for (const cmd in availableCommands) {
                    if (cmd.startsWith(chatInput.value)) {
                        const item = document.createElement('div');
                        item.className = 'slash-command-item';
                        item.dataset.command = cmd;
                        item.innerHTML = `
                            <span class="slash-command-name">${cmd}</span>
                            <span class="slash-command-desc">${availableDescriptions[cmd] || ''}</span>
                        `;
                        
                        // Add click event
                        item.addEventListener('click', function() {
                            chatInput.value = cmd + ' ';
                            chatInput.focus();
                            dropdown.style.display = 'none';
                        });
                        
                        dropdown.appendChild(item);
                    }
                }
                
                // Position and show dropdown
                const rect = chatInput.getBoundingClientRect();
                dropdown.style.cssText = `
                    position: fixed !important;
                    top: ${rect.bottom + 5}px !important;
                    left: ${rect.left}px !important;
                    width: ${rect.width}px !important;
                    background: #1a1a1a !important;
                    border: 1px solid #444 !important;
                    border-radius: 4px !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
                    max-height: 300px !important;
                    overflow-y: auto !important;
                    z-index: 10000 !important;
                    display: block !important;
                `;
            } else {
                dropdown.style.display = 'none';
            }
        });
        
        // Set up tab completion
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Tab' && chatInput.value.startsWith('/')) {
                e.preventDefault();
                
                // Get available commands
                const availableCommands = window.SlashCommands.getAvailableCommands();
                const currentText = chatInput.value.toLowerCase();
                
                // Find a matching command
                for (const cmd in availableCommands) {
                    if (cmd.startsWith(currentText)) {
                        chatInput.value = cmd + ' ';
                        break;
                    }
                }
                
                dropdown.style.display = 'none';
            }
        });
        
        console.log("Emergency UI initialization complete");
        window.slashCommandUIInitialized = true;
        initState.ui = true;
    }
});