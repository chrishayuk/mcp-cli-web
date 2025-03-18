/**
 * js/slash-commands/slash-command-ui.js
 * UI Handler for Slash Commands
 * 
 * Provides the UI elements and interaction for the slash command system
 */

// Make sure this is only initialized once - using window to ensure global scope
window.slashCommandUIInitialized = window.slashCommandUIInitialized || false;

/**
 * Initialize the slash command UI elements and interactions
 * This should be called after the slash command core is initialized
 */
function initSlashCommandUI() {
    // Prevent duplicate initialization
    if (window.slashCommandUIInitialized) {
        console.log("Slash command UI already initialized, skipping");
        return;
    }
    
    console.log("Initializing slash command UI...");
    
    // Setup UI elements
    setupSlashCommandElements();
    
    // Mark as initialized - using window to ensure global scope
    window.slashCommandUIInitialized = true;
    
    console.log("✅ Slash command UI initialized successfully");
}

/**
 * Set up the UI elements for slash commands
 */
function setupSlashCommandElements() {
    // Get the chat input and container
    const chatInput = document.getElementById('chat-input');
    const chatInputContainer = document.querySelector('.chat-input-container');
    
    if (!chatInput || !chatInputContainer) {
        console.error("Chat input elements not found, can't setup slash command UI");
        return;
    }
    
    // Create the autocomplete dropdown if it doesn't exist
    let autocompleteDropdown = document.querySelector('.slash-command-autocomplete');
    if (!autocompleteDropdown) {
        autocompleteDropdown = document.createElement('div');
        autocompleteDropdown.className = 'slash-command-autocomplete';
        autocompleteDropdown.style.display = 'none';
        
        // Ensure dropdown is added to body to avoid positioning issues
        document.body.appendChild(autocompleteDropdown);
    }
    
    // Add slash command button if it doesn't exist
    let slashButton = document.querySelector('.slash-command-button');
    if (!slashButton) {
        slashButton = document.createElement('button');
        slashButton.className = 'slash-command-button';
        slashButton.title = 'Slash Commands';
        slashButton.innerHTML = '<i class="fas fa-slash"></i>';
        
        // Insert before the send button
        const sendButton = document.getElementById('chat-send');
        if (sendButton) {
            chatInputContainer.insertBefore(slashButton, sendButton);
        } else {
            chatInputContainer.appendChild(slashButton);
        }
    }
    
    // Event state object to be shared across event handlers
    const state = {
        isSlashCommandActive: false,
        selectedAutocompleteIndex: -1
    };
    
    // Clean up any existing event listeners to avoid duplicates
    const newChatInput = chatInput.cloneNode(true);
    chatInput.parentNode.replaceChild(newChatInput, chatInput);
    
    const newSlashButton = slashButton.cloneNode(true);
    slashButton.parentNode.replaceChild(newSlashButton, slashButton);
    
    // Add event listeners to cloned elements
    newChatInput.addEventListener('input', e => handleInputEvent(e, newChatInput, autocompleteDropdown, state));
    newChatInput.addEventListener('keydown', e => handleKeyDownEvent(e, newChatInput, autocompleteDropdown, state));
    
    // Add click event listener to button
    newSlashButton.addEventListener('click', () => {
        // Update input with slash and trigger autocomplete
        newChatInput.value = '/';
        newChatInput.focus();
        
        // Trigger input event to show autocomplete
        const inputEvent = new Event('input');
        newChatInput.dispatchEvent(inputEvent);
        
        // Show help message about available commands
        showSlashCommandHelp();
    });
    
    // Hide autocomplete when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (e.target !== autocompleteDropdown && !autocompleteDropdown.contains(e.target) && 
            e.target !== newChatInput && e.target !== newSlashButton) {
            autocompleteDropdown.style.display = 'none';
            state.isSlashCommandActive = false;
            newChatInput.classList.remove('slash-active');
        }
    });
    
    console.log("Slash command UI elements setup complete");
}

/**
 * Handle input events in the chat input
 */
function handleInputEvent(e, chatInput, dropdown, state) {
    const text = chatInput.value;
    
    // Check if starts with slash
    if (text.startsWith('/')) {
        state.isSlashCommandActive = true;
        chatInput.classList.add('slash-active');
        
        // Show autocomplete suggestions
        showAutocompleteSuggestions(text, chatInput, dropdown, state);
    } else {
        state.isSlashCommandActive = false;
        chatInput.classList.remove('slash-active');
        dropdown.style.display = 'none';
    }
}

/**
 * Handle keydown events in the chat input
 * For navigation and selection of autocomplete items
 */
function handleKeyDownEvent(e, chatInput, dropdown, state) {
    // Only process if slash command is active
    if (!state.isSlashCommandActive || dropdown.style.display === 'none') {
        return;
    }
    
    const suggestions = dropdown.querySelectorAll('.slash-command-item');
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            state.selectedAutocompleteIndex = Math.min(state.selectedAutocompleteIndex + 1, suggestions.length - 1);
            highlightSelected(dropdown, state.selectedAutocompleteIndex);
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            state.selectedAutocompleteIndex = Math.max(state.selectedAutocompleteIndex - 1, 0);
            highlightSelected(dropdown, state.selectedAutocompleteIndex);
            break;
            
        case 'Tab':
        case 'Enter':
            // Only complete if we have something selected
            if (state.selectedAutocompleteIndex >= 0 && state.selectedAutocompleteIndex < suggestions.length) {
                e.preventDefault();
                const selectedCommand = suggestions[state.selectedAutocompleteIndex].dataset.command;
                applySelectedCommand(selectedCommand, e.key === 'Enter', chatInput, dropdown, state);
            } else if (suggestions.length > 0) {
                // Select first item if nothing selected
                e.preventDefault();
                const selectedCommand = suggestions[0].dataset.command;
                applySelectedCommand(selectedCommand, e.key === 'Enter', chatInput, dropdown, state);
            }
            break;
            
        case 'Escape':
            e.preventDefault();
            dropdown.style.display = 'none';
            state.isSlashCommandActive = false;
            chatInput.classList.remove('slash-active');
            break;
    }
}

/**
 * Highlight the selected autocomplete item
 */
function highlightSelected(dropdown, selectedIndex) {
    const items = dropdown.querySelectorAll('.slash-command-item');
    
    // Clear all highlights
    items.forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add highlight to selected
    if (selectedIndex >= 0 && selectedIndex < items.length) {
        items[selectedIndex].classList.add('selected');
        
        // Scroll into view if needed
        items[selectedIndex].scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
        });
    }
}

/**
 * Apply the selected slash command to the input
 * @param {string} command - The command to apply
 * @param {boolean} execute - Whether to execute the command
 */
function applySelectedCommand(command, execute, chatInput, dropdown, state) {
    if (!window.SlashCommands) {
        console.error("SlashCommands not available");
        return;
    }
    
    const availableCommands = window.SlashCommands.getAvailableCommands();
    
    // Handle module activation commands
    const moduleCommand = window.SlashCommands.getModuleCommandByName(command);
    if (!availableCommands[command] && moduleCommand) {
        const { moduleName, info } = moduleCommand;
        
        if (window.Commands && window.Commands.canvasManager) {
            // Activate the module first
            window.Commands.canvasManager.activateModule(moduleName);
            window.SlashCommands.setActiveModule(moduleName);
            
            // Use the command's target
            const fullCommand = info.fullCommand;
            
            if (execute) {
                // Execute the command
                chatInput.value = fullCommand;
                
                // Direct execution
                if (window.Commands && typeof window.Commands.processCommand === 'function') {
                    window.Commands.processCommand(fullCommand);
                }
                
                // Trigger send
                const sendButton = document.getElementById('chat-send');
                if (sendButton) {
                    sendButton.click();
                }
            } else {
                // Just complete the command
                chatInput.value = command + ' ';
                chatInput.focus();
            }
        }
    }
    // Handle regular commands
    else if (availableCommands[command]) {
        if (execute) {
            // For Enter key, execute the command directly
            const fullCommand = availableCommands[command];
            chatInput.value = fullCommand;
            
            // Execute via Commands processor
            if (window.Commands && typeof window.Commands.processCommand === 'function') {
                console.log("Executing command via processor:", fullCommand);
                window.Commands.processCommand(fullCommand);
            }
            
            // Also trigger send button
            const sendButton = document.getElementById('chat-send');
            if (sendButton) {
                sendButton.click();
            }
        } else {
            // For Tab key, just complete the command
            chatInput.value = command + ' ';
            chatInput.focus();
        }
    }
    
    // Hide dropdown and reset state after applying
    dropdown.style.display = 'none';
    
    // Reset state
    state.isSlashCommandActive = false;
    chatInput.classList.remove('slash-active');
}

/**
 * Show autocomplete suggestions in the dropdown
 */
function showAutocompleteSuggestions(text, chatInput, dropdown, state) {
    if (!window.SlashCommands) {
        console.error("SlashCommands not initialized");
        return;
    }
    
    // Extract slash command
    const parts = text.split(' ');
    const slashCommand = parts[0].toLowerCase();
    
    // Get available commands and descriptions
    const availableCommands = window.SlashCommands.getAvailableCommands();
    const availableDescriptions = window.SlashCommands.getAvailableDescriptions();
    
    // Find matching commands
    const matches = [];
    for (const cmd in availableCommands) {
        if (cmd.startsWith(slashCommand)) {
            matches.push(cmd);
        }
    }
    
    // Clear current suggestions
    dropdown.innerHTML = '';
    
    // No matches, show nothing or "no commands found"
    if (matches.length === 0) {
        dropdown.style.display = 'none';
        return;
    }
    
    // Group matches by category for better organization
    const categorizedMatches = window.SlashCommands.groupCommandsByCategory(
        Object.fromEntries(matches.map(m => [m, availableCommands[m]])),
        Object.fromEntries(matches.map(m => [m, availableDescriptions[m]]))
    );
    
    // Add matches by category
    for (const category in categorizedMatches) {
        const categoryCommands = categorizedMatches[category];
        
        // Skip empty categories
        if (categoryCommands.length === 0) continue;
        
        // Add category header
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'slash-command-category';
        categoryHeader.textContent = category;
        dropdown.appendChild(categoryHeader);
        
        // Add commands in this category
        categoryCommands.forEach(cmd => {
            const item = document.createElement('div');
            item.className = 'slash-command-item';
            item.dataset.command = cmd;
            
            // Create formatted item content with description
            item.innerHTML = `
                <span class="slash-command-name">${cmd}</span>
                <span class="slash-command-desc">${availableDescriptions[cmd] || ''}</span>
            `;
            
            // Add click event to apply command
            item.addEventListener('click', (e) => {
                applySelectedCommand(cmd, true, chatInput, dropdown, state);
                e.stopPropagation(); // Prevent document click from immediately hiding dropdown
            });
            
            dropdown.appendChild(item);
        });
    }
    
    // Reset selected index
    state.selectedAutocompleteIndex = -1;
    
    // Get the position of the input element
    const rect = chatInput.getBoundingClientRect();
    
    // Move dropdown to body if not already there
    if (dropdown.parentNode !== document.body) {
        document.body.appendChild(dropdown);
    }
    
    // Position dropdown BELOW the input with fixed positioning
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
        transform: none !important;
        margin: 0 !important;
        display: block !important;
    `;
    
    console.log(`Showing dropdown with ${matches.length} commands at position: top=${rect.bottom + 5}px, left=${rect.left}px`);
}

/**
 * Show a help message with available slash commands
 */
function showSlashCommandHelp() {
    if (!window.SlashCommands) {
        console.error("SlashCommands not initialized");
        return;
    }
    
    // Get available commands and descriptions
    const availableCommands = window.SlashCommands.getAvailableCommands();
    const availableDescriptions = window.SlashCommands.getAvailableDescriptions();
    
    // Group by category for better organization
    const categorizedCommands = window.SlashCommands.groupCommandsByCategory(
        availableCommands,
        availableDescriptions
    );
    
    // Build help message
    let helpMessage = '<strong>Available Slash Commands:</strong><br><br>';
    
    for (const category in categorizedCommands) {
        const commands = categorizedCommands[category];
        if (commands.length === 0) continue;
        
        helpMessage += `<u>${category} Commands:</u><br>`;
        
        commands.forEach(cmd => {
            helpMessage += `<span class="slash-command-example">${cmd}</span> - ${availableDescriptions[cmd]}<br>`;
        });
        
        helpMessage += '<br>';
    }
    
    helpMessage += "Type a slash (/) followed by a command. Press Tab to autocomplete.";
    
    // Display message in chat
    if (window.ChatInterface && typeof window.ChatInterface.addSystemMessage === 'function') {
        window.ChatInterface.addSystemMessage(helpMessage);
    }
}

// Make functions available globally for debugging and other modules
window.showAutocompleteSuggestions = showAutocompleteSuggestions;
window.initSlashCommandUI = initSlashCommandUI;
window.setupSlashCommandElements = setupSlashCommandElements;

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for slash command core to be initialized
    const checkDependencies = function() {
        if (window.SlashCommands) {
            initSlashCommandUI();
            return true;
        }
        return false;
    };
    
    // Try to initialize immediately
    if (!checkDependencies()) {
        // First retry after 1 second
        setTimeout(function() {
            if (!checkDependencies()) {
                // Second retry after 2 more seconds
                setTimeout(function() {
                    if (!checkDependencies()) {
                        console.error("SlashCommands core not available after multiple attempts");
                    }
                }, 2000);
            }
        }, 1000);
    }
});