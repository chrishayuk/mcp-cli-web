/**
 * Terminal functionality for the Canvas Terminal
 */
class Terminal {
    constructor() {
        this.commandHistory = [];
        this.historyIndex = -1;
        this.setupEventListeners();
        this.updateClock();
    }
    
    /**
     * Set up terminal event listeners
     */
    setupEventListeners() {
        // Command input handler
        const commandInput = document.getElementById('commandInput');
        commandInput.addEventListener('keydown', this.handleCommandInput.bind(this));
        
        // Keep focus on terminal input
        document.addEventListener('click', () => {
            commandInput.focus();
        });
        
        // Help button
        const helpButton = document.getElementById('helpButton');
        if (helpButton) {
            helpButton.addEventListener('click', () => {
                this.showHelp();
            });
        }
        
        // Show initial help message after a delay
        setTimeout(() => {
            this.addOutput(`
[INFO] The following modules are available:
      - image: Display and manipulate images
      - chart: Create data visualizations
      - code: Display formatted code
      - shape: Draw shapes and patterns

[INFO] Try these example commands:
      $ module image
      $ fetch image
      $ module chart
      $ chart random
      $ module code
      $ code display console.log("Hello World");
      $ module shape
      $ draw pattern

[INFO] Type "help" for all available commands
`);
        }, 1000);
    }
    
    /**
     * Handle command input keydown events
     */
    handleCommandInput(e) {
        const commandInput = e.target;
        
        if (e.key === 'Enter') {
            e.preventDefault();
            const command = commandInput.value.trim();
            
            if (command) {
                // Add to history
                this.commandHistory.push(command);
                this.historyIndex = this.commandHistory.length;
                
                // Add command to output
                this.addOutput(`$ ${command}`);
                
                // Process command
                Commands.processCommand(command);
                
                // Clear input
                commandInput.value = '';
            }
        } else if (e.key === 'ArrowUp') {
            // Navigate command history - previous
            e.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                commandInput.value = this.commandHistory[this.historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            // Navigate command history - next
            e.preventDefault();
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
                commandInput.value = this.commandHistory[this.historyIndex];
            } else {
                this.historyIndex = this.commandHistory.length;
                commandInput.value = '';
            }
        }
    }
    
    /**
     * Add text to terminal output
     */
    addOutput(text) {
        const output = document.createElement('div');
        output.className = 'terminal-output';
        output.textContent = text;
        
        const content = document.getElementById('terminal-content');
        
        // Find the right place to insert - before any command sections
        const commandSections = content.querySelectorAll('.command-section');
        if (commandSections.length > 0) {
            content.insertBefore(output, commandSections[0]);
        } else {
            content.appendChild(output);
        }
        
        // Scroll to show the new output
        output.scrollIntoView({ behavior: 'smooth' });
        
        return output;
    }
    
    /**
     * Clear terminal output
     */
    clearOutput() {
        const content = document.getElementById('terminal-content');
        const children = Array.from(content.children);
        
        // Remove all terminal outputs but keep command sections
        for (const child of children) {
            if (child.classList.contains('terminal-output')) {
                content.removeChild(child);
            }
        }
        
        this.addOutput('[INFO] Terminal cleared');
    }
    
    /**
     * Update status indicator
     */
    updateStatus(state, message) {
        const indicator = document.getElementById('statusIndicator');
        indicator.className = 'status ' + state;
        
        let icon = 'circle';
        if (state === 'loading') icon = 'spinner fa-spin';
        else if (state === 'success') icon = 'check-circle';
        else if (state === 'error') icon = 'exclamation-circle';
        
        indicator.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
        
        // Add to terminal output
        this.addOutput(`[${state.toUpperCase()}] ${message}`);
    }
    
    /**
     * Show help information
     */
    showHelp() {
        this.addOutput(`
Available commands:
-------------------
module [name]     - Switch to a specific module (image, chart, code, shape)
fetch [url]       - Fetch data from API
fetch image       - Fetch and display a random image

Module commands:
---------------
image:
  display [url]   - Display an image
  random          - Show a random image

chart:
  bar             - Create a bar chart
  line            - Create a line chart
  pie             - Create a pie chart
  random          - Generate random chart data

code:
  display [code]  - Display code with syntax highlighting
  language [lang] - Set code language (javascript, python, html)
  theme [theme]   - Set theme (dark, light)

shape:
  draw [type]     - Draw a specific shape
  random          - Draw a random shape
  pattern [type]  - Create a pattern (grid, radial)
  animate         - Animate shapes
  stop            - Stop animation

General commands:
---------------
clear canvas      - Clear the canvas
clear/cls         - Clear terminal output
commands [module] - List commands for a specific module
modules           - List available modules
help              - Show this help message
`);
        return true;
    }
    
    /**
     * Show available APIs
     */
    showAvailableAPIs() {
        this.addOutput(`
Available APIs:
--------------
fetch https://jsonplaceholder.typicode.com/todos/1    - JSON Placeholder (Todo)
fetch https://randomuser.me/api/                      - Random User Generator
fetch image                                           - Random image

Content detection:
  - JSON data will be visualized as charts
  - Images will be displayed in the image module
  - Code will be displayed with syntax highlighting
`);
    }
    
    /**
     * Update clock in status bar
     */
    updateClock() {
        const now = new Date();
        const time = now.toTimeString().split(' ')[0];
        document.getElementById('currentTime').textContent = time;
        setTimeout(() => this.updateClock(), 1000);
    }
}

// Create global terminal instance
const terminal = new Terminal();