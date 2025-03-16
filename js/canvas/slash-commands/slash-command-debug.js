/**
 * Slash Commands Debug Helper
 * 
 * Utility functions to help debug the slash command system
 * Can be called from the browser console
 */

/**
 * Debug the slash command system and show available commands
 * Call this function from the browser console: debugSlashCommands()
 */
window.debugSlashCommands = function() {
    console.log("=== SLASH COMMANDS DEBUG ===");
    
    if (!window.SlashCommands) {
        console.error("SlashCommands not initialized");
        return;
    }
    
    // Show active module
    console.log("Active module:", window.SlashCommands.activeModule || "none");
    
    // Show global commands
    console.log("\nGlobal commands:");
    for (const cmd in window.SlashCommands.commands.global) {
        console.log(`  ${cmd} → ${window.SlashCommands.commands.global[cmd]}`);
    }
    
    // Show module-specific commands
    console.log("\nModule-specific commands:");
    for (const moduleName in window.SlashCommands.commands.modules) {
        console.log(`\n  ${moduleName.toUpperCase()}:`);
        
        const moduleCommands = window.SlashCommands.commands.modules[moduleName];
        for (const cmd in moduleCommands) {
            const commandInfo = moduleCommands[cmd];
            console.log(`    ${cmd} → ${commandInfo.fullCommand} ${commandInfo.showAlways ? '(always visible)' : ''}`);
        }
    }
    
    // Show currently available commands
    console.log("\nCurrently available commands:");
    const availableCommands = window.SlashCommands.getAvailableCommands();
    for (const cmd in availableCommands) {
        console.log(`  ${cmd} → ${availableCommands[cmd]}`);
    }
    
    console.log("\n=== END DEBUG ===");
};

/**
 * Test a specific slash command to see what it would do
 * Call this function from the browser console: testSlashCommand('/code')
 * @param {string} command - The slash command to test (e.g., '/code')
 */
window.testSlashCommand = function(command) {
    if (!command.startsWith('/')) {
        command = '/' + command;
    }
    
    console.log(`Testing slash command: ${command}`);
    
    if (!window.SlashCommands) {
        console.error("SlashCommands not initialized");
        return;
    }
    
    // Check if it's a global command
    if (window.SlashCommands.commands.global[command]) {
        console.log(`✓ Global command: ${command} → ${window.SlashCommands.commands.global[command]}`);
        return;
    }
    
    // Check if it's a module command
    const moduleCommand = window.SlashCommands.getModuleCommandByName(command);
    if (moduleCommand) {
        console.log(`✓ Module command for ${moduleCommand.moduleName}: ${command} → ${moduleCommand.info.fullCommand}`);
        console.log(`  Show always: ${moduleCommand.info.showAlways}`);
        console.log(`  Description: ${window.SlashCommands.descriptions.modules[moduleCommand.moduleName][command]}`);
        
        // Check if the command's module is active
        if (window.SlashCommands.activeModule === moduleCommand.moduleName) {
            console.log(`✓ Module ${moduleCommand.moduleName} is active, command is available`);
        } else {
            console.log(`⚠ Module ${moduleCommand.moduleName} is not active, but command ${moduleCommand.info.showAlways ? 'is' : 'is not'} always visible`);
        }
        
        return;
    }
    
    console.log(`✗ Command not found: ${command}`);
};

/**
 * Simulate activating a module and show which slash commands would become available
 * Call this function from the browser console: simulateModuleActivation('code')
 * @param {string} moduleName - The name of the module to simulate activation
 */
window.simulateModuleActivation = function(moduleName) {
    console.log(`Simulating activation of module: ${moduleName}`);
    
    if (!window.SlashCommands) {
        console.error("SlashCommands not initialized");
        return;
    }
    
    if (!window.SlashCommands.commands.modules[moduleName]) {
        console.error(`Module not found: ${moduleName}`);
        return;
    }
    
    // Store current active module
    const originalModule = window.SlashCommands.activeModule;
    
    // Temporarily set the active module
    window.SlashCommands.activeModule = moduleName;
    
    // Get commands that would be available
    const availableCommands = window.SlashCommands.getAvailableCommands();
    
    // Find commands that are specific to this module
    const moduleSpecificCommands = {};
    for (const cmd in availableCommands) {
        // Skip global commands
        if (window.SlashCommands.commands.global[cmd]) continue;
        
        // Check if this command belongs to the simulated module
        const moduleCommand = window.SlashCommands.getModuleCommandByName(cmd);
        if (moduleCommand && moduleCommand.moduleName === moduleName) {
            moduleSpecificCommands[cmd] = availableCommands[cmd];
        }
    }
    
    // Show module-specific commands
    console.log(`\nSlash commands that would become available when ${moduleName} is activated:`);
    for (const cmd in moduleSpecificCommands) {
        console.log(`  ${cmd} → ${moduleSpecificCommands[cmd]}`);
    }
    
    // Restore original active module
    window.SlashCommands.activeModule = originalModule;
    console.log(`\nActive module restored to: ${originalModule || 'none'}`);
};

/**
 * Register a test command to see if the slash command system is working
 * Call this function from the browser console: registerTestCommand()
 */
window.registerTestCommand = function() {
    if (!window.SlashCommands) {
        console.error("SlashCommands not initialized");
        return;
    }
    
    // Create a unique test command
    const testCmd = `/test${Date.now()}`;
    
    // Register as global command
    window.SlashCommands.registerGlobal(testCmd, 'help', 'Test command');
    
    console.log(`Registered test command: ${testCmd}`);
    console.log(`Type ${testCmd} in the chat input to test`);
};

console.log("Slash commands debug helper loaded - Type 'debugSlashCommands()' in console to debug");