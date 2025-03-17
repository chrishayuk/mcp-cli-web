/**
 * js/chat/prompt-manager.js
 * Advanced Prompt Management for OpenAI Integration
 * 
 * Provides a way to manage and customize system prompts for the OpenAI service
 */

class PromptManager {
    constructor() {
      // Default prompts
      this.defaultPrompts = {
        standard: `You are Canvas Assistant, an AI that helps users visualize data and create content in a terminal-like interface. 
  You can help with showing images, creating charts, displaying code, rendering markdown, and connecting to terminals.
  Always try to use the available canvas commands whenever possible.
  
  Available commands:
  - Image: "show image [url]" or "show random image"
  - Charts: "create pie chart", "bar chart", "line chart"
  - Code: "show code [your code]"
  - Markdown: "show markdown [text]" or "load markdown from [url]"
  - Terminal: "connect terminal" or "send to terminal [command]"
  - Shapes: "draw pattern", "draw random"
  - Canvas: "clear canvas"
  
  When responding to user requests for visualizations or code, suggest appropriate canvas commands.`,
  
        developer: `You are Canvas Assistant in Developer Mode, an AI specialized in coding, visualizations, and technical assistance.
  Focus on providing clean, efficient code examples and technical explanations.
  Always suggest the most direct canvas commands to visualize data or show code examples.
  
  Available commands:
  - Image: "show image [url]" or "show random image"
  - Charts: "create pie chart", "bar chart", "line chart"
  - Code: "show code [your code]"
  - Markdown: "show markdown [text]" or "load markdown from [url]"
  - Terminal: "connect terminal" or "send to terminal [command]"
  - Shapes: "draw pattern", "draw random"
  - Canvas: "clear canvas"
  
  When a user asks for code, format it properly with appropriate language syntax highlighting.
  If asked to explain code, provide comprehensive yet concise explanations.
  If asked to create a visualization, suggest appropriate charts for the data type.`,
  
        creative: `You are Canvas Assistant in Creative Mode, an AI focused on helping users explore visual and artistic expression.
  Encourage creative uses of the canvas and visualizations.
  Be imaginative and suggest unexpected ways to use the available tools.
  
  Available commands:
  - Image: "show image [url]" or "show random image"
  - Charts: "create pie chart", "bar chart", "line chart" (try using these creatively!)
  - Code: "show code [your code]" (can be used for ASCII art or creative coding)
  - Markdown: "show markdown [text]" (for formatted creative writing)
  - Shapes: "draw pattern", "draw random" (great for abstract designs)
  - Canvas: "clear canvas"
  
  Be playful and experimental. Suggest artistic combinations of features, like using charts to create abstract art or
  using code to generate visual patterns. Think outside the box and inspire creative exploration.`,
  
        minimal: `You are Canvas Assistant in Minimal Mode. Keep responses brief and focused on executing commands efficiently.
  Use the most direct approach to fulfill user requests with minimal explanation.
  
  Available commands:
  - Image: "show image [url]" or "show random image"
  - Charts: "chart [bar/pie/line]"
  - Code: "show code [your code]"
  - Markdown: "show markdown [text]"
  - Terminal: "connect terminal"
  - Shapes: "draw pattern"
  - Canvas: "clear canvas"
  
  Limit explanations. Focus on actions. Be concise.`
      };
      
      // Custom user prompts
      this.customPrompts = {};
      
      // Try to load saved prompts from localStorage
      this.loadSavedPrompts();
    }
    
    // Get available prompt templates
    getPromptTemplates() {
      // Combine default and custom prompts
      const allPrompts = {
        ...this.defaultPrompts,
        ...this.customPrompts
      };
      
      // Return prompt names and a preview of each
      return Object.keys(allPrompts).map(name => {
        const preview = allPrompts[name].substring(0, 60) + '...';
        return { name, preview };
      });
    }
    
    // Get a specific prompt by name
    getPrompt(name) {
      // Try custom prompts first, then defaults
      return this.customPrompts[name] || this.defaultPrompts[name] || this.defaultPrompts.standard;
    }
    
    // Add or update a custom prompt
    saveCustomPrompt(name, promptText) {
      // Don't allow overwriting default prompts
      if (this.defaultPrompts[name]) {
        return { success: false, message: `Cannot overwrite default prompt "${name}". Choose a different name.` };
      }
      
      // Save the prompt
      this.customPrompts[name] = promptText;
      
      // Save to localStorage
      this.saveToLocalStorage();
      
      return { success: true, message: `Prompt "${name}" saved successfully.` };
    }
    
    // Delete a custom prompt
    deleteCustomPrompt(name) {
      // Check if it exists
      if (!this.customPrompts[name]) {
        return { success: false, message: `Prompt "${name}" not found.` };
      }
      
      // Delete the prompt
      delete this.customPrompts[name];
      
      // Save to localStorage
      this.saveToLocalStorage();
      
      return { success: true, message: `Prompt "${name}" deleted.` };
    }
    
    // Save prompts to localStorage
    saveToLocalStorage() {
      try {
        localStorage.setItem('canvasAssistant_customPrompts', JSON.stringify(this.customPrompts));
        return true;
      } catch (error) {
        console.error('Error saving prompts to localStorage:', error);
        return false;
      }
    }
    
    // Load prompts from localStorage
    loadSavedPrompts() {
      try {
        const saved = localStorage.getItem('canvasAssistant_customPrompts');
        if (saved) {
          this.customPrompts = JSON.parse(saved);
        }
        return true;
      } catch (error) {
        console.error('Error loading prompts from localStorage:', error);
        this.customPrompts = {};
        return false;
      }
    }
    
    // Reset to default prompts
    resetToDefaults() {
      this.customPrompts = {};
      this.saveToLocalStorage();
      return { success: true, message: 'All custom prompts deleted and reset to defaults.' };
    }
    
    // Create a prompt manager UI dialog
    createPromptManagerDialog() {
      // Check if dialog already exists
      let dialog = document.getElementById('prompt-manager-dialog');
      if (dialog) {
        dialog.style.display = 'flex';
        return dialog;
      }
      
      // Create dialog container
      dialog = document.createElement('div');
      dialog.id = 'prompt-manager-dialog';
      dialog.className = 'terminal-dialog';
      
      // Set dialog content
      dialog.innerHTML = `
        <div class="dialog-content">
          <div class="dialog-header">
            <h2>AI Prompt Manager</h2>
            <button class="dialog-close">&times;</button>
          </div>
          <div class="dialog-body">
            <div class="prompt-selector">
              <label for="prompt-select">Select Prompt:</label>
              <div class="select-container">
                <select id="prompt-select"></select>
              </div>
              <button id="load-prompt-btn" class="terminal-button">Load</button>
              <button id="delete-prompt-btn" class="terminal-button">Delete</button>
            </div>
            
            <div class="prompt-editor">
              <label for="prompt-name">Prompt Name:</label>
              <input type="text" id="prompt-name" placeholder="Enter prompt name" />
              <label for="prompt-text">System Prompt:</label>
              <textarea id="prompt-text" rows="10" placeholder="Enter system prompt..."></textarea>
            </div>
            
            <div class="dialog-actions">
              <button id="save-prompt-btn" class="terminal-button primary">Save Prompt</button>
              <button id="reset-prompts-btn" class="terminal-button danger">Reset All</button>
            </div>
          </div>
        </div>
      `;
      
      // Add to document
      document.body.appendChild(dialog);
      
      // Setup event listeners
      this.setupDialogEvents(dialog);
      
      // Populate prompt selector
      this.populatePromptSelector();
      
      return dialog;
    }
    
    // Setup dialog event listeners
    setupDialogEvents(dialog) {
      // Close dialog
      const closeBtn = dialog.querySelector('.dialog-close');
      closeBtn.addEventListener('click', () => {
        dialog.style.display = 'none';
      });
      
      // Load prompt
      const loadBtn = dialog.querySelector('#load-prompt-btn');
      loadBtn.addEventListener('click', () => {
        const selector = dialog.querySelector('#prompt-select');
        const name = selector.value;
        const promptText = this.getPrompt(name);
        
        const nameInput = dialog.querySelector('#prompt-name');
        const textArea = dialog.querySelector('#prompt-text');
        
        nameInput.value = name;
        textArea.value = promptText;
        
        // Disable name input for default prompts
        nameInput.disabled = this.defaultPrompts[name] !== undefined;
      });
      
      // Delete prompt
      const deleteBtn = dialog.querySelector('#delete-prompt-btn');
      deleteBtn.addEventListener('click', () => {
        const selector = dialog.querySelector('#prompt-select');
        const name = selector.value;
        
        // Can't delete default prompts
        if (this.defaultPrompts[name]) {
          alert('Cannot delete default prompts.');
          return;
        }
        
        if (confirm(`Are you sure you want to delete the prompt "${name}"?`)) {
          const result = this.deleteCustomPrompt(name);
          alert(result.message);
          
          // Refresh selector
          this.populatePromptSelector();
          
          // Clear inputs
          dialog.querySelector('#prompt-name').value = '';
          dialog.querySelector('#prompt-text').value = '';
        }
      });
      
      // Save prompt
      const saveBtn = dialog.querySelector('#save-prompt-btn');
      saveBtn.addEventListener('click', () => {
        const nameInput = dialog.querySelector('#prompt-name');
        const textArea = dialog.querySelector('#prompt-text');
        
        const name = nameInput.value.trim();
        const promptText = textArea.value.trim();
        
        if (!name) {
          alert('Please enter a name for the prompt.');
          return;
        }
        
        if (!promptText) {
          alert('Please enter the prompt text.');
          return;
        }
        
        const result = this.saveCustomPrompt(name, promptText);
        alert(result.message);
        
        // Refresh selector
        this.populatePromptSelector();
        
        // Select the new/updated prompt
        const selector = dialog.querySelector('#prompt-select');
        selector.value = name;
      });
      
      // Reset all prompts
      const resetBtn = dialog.querySelector('#reset-prompts-btn');
      resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all custom prompts and reset to defaults?')) {
          const result = this.resetToDefaults();
          alert(result.message);
          
          // Refresh selector
          this.populatePromptSelector();
          
          // Clear inputs
          dialog.querySelector('#prompt-name').value = '';
          dialog.querySelector('#prompt-text').value = '';
        }
      });
      
      // Select change
      const selector = dialog.querySelector('#prompt-select');
      selector.addEventListener('change', () => {
        const name = selector.value;
        const promptText = this.getPrompt(name);
        
        const nameInput = dialog.querySelector('#prompt-name');
        const textArea = dialog.querySelector('#prompt-text');
        
        nameInput.value = name;
        textArea.value = promptText;
        
        // Disable name input for default prompts
        nameInput.disabled = this.defaultPrompts[name] !== undefined;
      });
    }
    
    // Populate prompt selector dropdown
    populatePromptSelector() {
      const selector = document.querySelector('#prompt-select');
      if (!selector) return;
      
      // Clear existing options
      selector.innerHTML = '';
      
      // Get all prompts
      const defaultPromptNames = Object.keys(this.defaultPrompts);
      const customPromptNames = Object.keys(this.customPrompts);
      
      // Add default prompts group
      if (defaultPromptNames.length > 0) {
        const defaultGroup = document.createElement('optgroup');
        defaultGroup.label = 'Default Prompts';
        
        defaultPromptNames.forEach(name => {
          const option = document.createElement('option');
          option.value = name;
          option.textContent = name;
          defaultGroup.appendChild(option);
        });
        
        selector.appendChild(defaultGroup);
      }
      
      // Add custom prompts group
      if (customPromptNames.length > 0) {
        const customGroup = document.createElement('optgroup');
        customGroup.label = 'Custom Prompts';
        
        customPromptNames.forEach(name => {
          const option = document.createElement('option');
          option.value = name;
          option.textContent = name;
          customGroup.appendChild(option);
        });
        
        selector.appendChild(customGroup);
      }
      
      // Trigger change event to update fields
      if (selector.options.length > 0) {
        selector.selectedIndex = 0;
        selector.dispatchEvent(new Event('change'));
      }
    }
  }
  
  // Export as global variable
  window.promptManager = new PromptManager();