/**
 * js/canvas/modules/code-module/code-module-slash-command-handler.js
 * Code Module Slash Command Handler
 * 
 * Registers slash commands specific to the code module
 * Provides code snippet functionality through slash commands
 */

// Initialize when slash command system is ready
document.addEventListener('slash-commands:ready', function() {
    console.log("Slash commands ready, initializing code module commands...");
    initCodeModuleSlashCommands();
});

// Fallback initialization if the event doesn't fire
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (window.SlashCommands && 
            typeof window.SlashCommands.registerModuleCommand === 'function') {
            console.log("Initializing code module slash commands via fallback...");
            initCodeModuleSlashCommands();
        }
    }, 1200);
});

/**
 * Initialize slash commands for the code module
 */
function initCodeModuleSlashCommands() {
    // Prevent multiple initialization
    if (window.codeModuleSlashCommandsInitialized) {
        return;
    }
    
    // Register activation commands (always available)
    registerCodeActivationCommands();
    
    // Register module-specific commands (only available when code module is active)
    registerCodeModuleCommands();
    
    // Register snippet commands
    registerCodeSnippetCommands();
    
    // Define the module update function - completely overwrite any existing one
    window.updateCodeModule = function() {
        extendCodeModuleWithSlashSupport();
    };
    
    // Set initialization flag
    window.codeModuleSlashCommandsInitialized = true;
    
    console.log("✅ Code module slash commands initialized");
}

/**
 * Register always-available code module activation commands
 */
function registerCodeActivationCommands() {
    // Main code command
    window.SlashCommands.registerModuleCommand(
        'code',              // Module name
        '/code',             // Slash command
        'display code',      // Full command to execute
        'Display code with syntax highlighting', // Description
        true                 // Show always (even when module not active)
    );
    
    // Programming language commands that also activate the code module
    const languages = [
        { cmd: 'js', full: 'javascript', desc: 'JavaScript' },
        { cmd: 'py', full: 'python', desc: 'Python' },
        { cmd: 'html', full: 'html', desc: 'HTML' },
        { cmd: 'css', full: 'css', desc: 'CSS' },
        { cmd: 'java', full: 'java', desc: 'Java' },
        { cmd: 'cpp', full: 'cpp', desc: 'C++' },
        { cmd: 'cs', full: 'csharp', desc: 'C#' },
        { cmd: 'go', full: 'go', desc: 'Go' },
        { cmd: 'rust', full: 'rust', desc: 'Rust' },
        { cmd: 'php', full: 'php', desc: 'PHP' },
        { cmd: 'ruby', full: 'ruby', desc: 'Ruby' },
        { cmd: 'swift', full: 'swift', desc: 'Swift' },
        { cmd: 'ts', full: 'typescript', desc: 'TypeScript' }
    ];
    
    // Register each language command
    languages.forEach(lang => {
        window.SlashCommands.registerModuleCommand(
            'code',                                     // Module name
            `/${lang.cmd}`,                             // Slash command
            `code language ${lang.full}`,               // Full command to execute
            `Set code language to ${lang.desc}`,        // Description
            true                                        // Show always
        );
    });
}

/**
 * Register module-specific commands (only visible when code module is active)
 */
function registerCodeModuleCommands() {
    // Code execution
    window.SlashCommands.registerModuleCommand(
        'code', '/run', 'run code', 'Run the current code', false
    );
    
    // Editor appearance
    window.SlashCommands.registerModuleCommand(
        'code', '/theme', 'code theme dark', 'Set code theme (dark by default)', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'code', '/light', 'code theme light', 'Set light code theme', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'code', '/dark', 'code theme dark', 'Set dark code theme', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'code', '/lines', 'toggle line numbers', 'Toggle line numbers', false
    );
    
    // Panel controls
    window.SlashCommands.registerModuleCommand(
        'code', '/collapse', 'collapse editor', 'Collapse editor panel', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'code', '/expand', 'expand editor', 'Expand editor panel', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'code', '/results', 'toggle results', 'Toggle results panel', false
    );
    
    // Font size commands
    window.SlashCommands.registerModuleCommand(
        'code', '/fontsize', 'code fontsize 14', 'Set code font size', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'code', '/bigger', 'code fontsize 16', 'Increase font size', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'code', '/smaller', 'code fontsize 12', 'Decrease font size', false
    );
}

/**
 * Register code snippet commands
 */
function registerCodeSnippetCommands() {
    // Main snippet command (always available)
    window.SlashCommands.registerModuleCommand(
        'code', '/snippet', 'code snippet hello', 'Insert code snippet', true
    );
    
    // Specific snippet types (only available when code module is active)
    window.SlashCommands.registerModuleCommand(
        'code', '/hello', 'code snippet hello', 'Insert hello world snippet', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'code', '/function', 'code snippet function', 'Insert function snippet', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'code', '/class', 'code snippet class', 'Insert class snippet', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'code', '/loop', 'code snippet loop', 'Insert loop snippet', false
    );
    
    window.SlashCommands.registerModuleCommand(
        'code', '/api', 'code snippet api', 'Insert API fetch snippet', false
    );
}

/**
 * Extend the code module with slash command support
 * Called when the code module becomes active
 */
function extendCodeModuleWithSlashSupport() {
    if (!window.Commands || !window.Commands.canvasManager) {
        console.error("Canvas manager not available for code module extension");
        return;
    }
    
    const codeModule = window.Commands.canvasManager.getModule('code');
    
    if (!codeModule) {
        console.error("Code module not found for slash command extension");
        return;
    }
    
    // Skip if already extended
    if (codeModule._slashCommandsExtended) {
        return;
    }
    
    console.log("Extending code module with slash command support");
    
    // Add snippet library
    codeModule.snippets = getCodeSnippets();
    
    // Store original handleCommand method
    const originalHandleCommand = codeModule.handleCommand;
    
    // Replace with our extended version
    codeModule.handleCommand = function(command, args) {
        // Add snippet command support
        if (command === 'snippet') {
            return handleSnippetCommand(this, args);
        }
        
        // Call original for all other commands
        return originalHandleCommand.call(this, command, args);
    };
    
    codeModule._slashCommandsExtended = true;
}

/**
 * Handle snippet command
 * @param {Object} codeModule - The code module instance
 * @param {Array} args - Command arguments
 * @returns {boolean} Success status
 */
function handleSnippetCommand(codeModule, args) {
    // Default to 'hello' snippet if none specified
    const snippetType = args && args.length > 0 ? args[0] : 'hello';
    
    // Get current language
    const language = codeModule.language || 'javascript';
    
    // Get snippets
    const snippets = codeModule.snippets || getCodeSnippets();
    
    // Check if snippet type exists
    if (!snippets[snippetType]) {
        console.error(`Snippet type not found: ${snippetType}`);
        return false;
    }
    
    // Get language-specific snippet or fall back to JavaScript
    const snippet = snippets[snippetType][language] || 
                   snippets[snippetType]['javascript'];
    
    if (!snippet) {
        console.error(`No snippet available for ${snippetType} in ${language}`);
        return false;
    }
    
    // Display the snippet
    return codeModule.handleCommand('display', [snippet, language]);
}

/**
 * Get code snippets library
 * @returns {Object} Library of code snippets organized by type and language
 */
function getCodeSnippets() {
    return {
        // Hello world snippets
        hello: {
            javascript: 'console.log("Hello, world!");',
            python: 'print("Hello, world!")',
            html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Hello World</title>\n</head>\n<body>\n  <h1>Hello, world!</h1>\n</body>\n</html>',
            css: 'body {\n  font-family: sans-serif;\n  color: navy;\n  text-align: center;\n}\n\nh1 {\n  margin-top: 50px;\n}',
            java: 'public class HelloWorld {\n  public static void main(String[] args) {\n    System.out.println("Hello, world!");\n  }\n}',
            cpp: '#include <iostream>\n\nint main() {\n  std::cout << "Hello, world!" << std::endl;\n  return 0;\n}',
            csharp: 'using System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine("Hello, world!");\n  }\n}'
        },
        
        // Function snippets
        function: {
            javascript: '/**\n * Sample function with documentation\n * @param {string} name - Name parameter\n * @returns {string} Greeting message\n */\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\n// Example usage\nconsole.log(greet("Terminal Canvas"));',
            python: 'def greet(name):\n    """Return a personalized greeting.\n    \n    Args:\n        name (str): The name to greet\n        \n    Returns:\n        str: The greeting message\n    """\n    return f"Hello, {name}!"\n\n# Example usage\nprint(greet("Terminal Canvas"))',
            java: 'public class Greeter {\n  /**\n   * Returns a personalized greeting\n   * @param name The name to greet\n   * @return The greeting message\n   */\n  public String greet(String name) {\n    return "Hello, " + name + "!";\n  }\n  \n  public static void main(String[] args) {\n    Greeter greeter = new Greeter();\n    System.out.println(greeter.greet("Terminal Canvas"));\n  }\n}'
        },
        
        // Class snippets
        class: {
            javascript: '/**\n * User class with basic properties and methods\n */\nclass User {\n  /**\n   * Create a new User\n   * @param {string} name - User name\n   * @param {string} email - User email\n   */\n  constructor(name, email) {\n    this.name = name;\n    this.email = email;\n    this.createdAt = new Date();\n  }\n  \n  /**\n   * Get user info\n   * @returns {string} Formatted user info\n   */\n  getInfo() {\n    return `${this.name} (${this.email})`;\n  }\n}\n\n// Example usage\nconst user = new User("John Doe", "john@example.com");\nconsole.log(user.getInfo());',
            python: 'class User:\n    """User class with basic properties and methods"""\n    \n    def __init__(self, name, email):\n        """Initialize a new user\n        \n        Args:\n            name (str): User name\n            email (str): User email\n        """\n        self.name = name\n        self.email = email\n        self.created_at = "2023-01-01" # Using string instead of datetime for simplicity\n    \n    def get_info(self):\n        """Get formatted user info\n        \n        Returns:\n            str: Formatted user info\n        """\n        return f"{self.name} ({self.email})"\n\n# Example usage\nuser = User("John Doe", "john@example.com")\nprint(user.get_info())'
        },
        
        // Loop snippets
        loop: {
            javascript: '// For loop\nfor (let i = 0; i < 5; i++) {\n  console.log(`Iteration ${i}`);\n}\n\n// While loop\nlet count = 0;\nwhile (count < 3) {\n  console.log(`Count: ${count}`);\n  count++;\n}\n\n// Array iteration\nconst items = ["apple", "banana", "orange"];\nitems.forEach((item, index) => {\n  console.log(`${index}: ${item}`);\n});\n\n// Map transformation\nconst numbers = [1, 2, 3, 4];\nconst squared = numbers.map(n => n * n);\nconsole.log(squared);',
            python: '# For loop\nfor i in range(5):\n    print(f"Iteration {i}")\n\n# While loop\ncount = 0\nwhile count < 3:\n    print(f"Count: {count}")\n    count += 1\n\n# List iteration\nitems = ["apple", "banana", "orange"]\nfor index, item in enumerate(items):\n    print(f"{index}: {item}")\n\n# List comprehension\nnumbers = [1, 2, 3, 4]\nsquared = [n * n for n in numbers]\nprint(squared)'
        },
        
        // API fetch snippets
        api: {
            javascript: '/**\n * Fetch data from an API\n * @param {string} url - API endpoint\n * @returns {Promise<Object>} API response data\n */\nasync function fetchData(url) {\n  try {\n    const response = await fetch(url);\n    \n    if (!response.ok) {\n      throw new Error(`HTTP Error: ${response.status}`);\n    }\n    \n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error("Fetch error:", error);\n    throw error;\n  }\n}\n\n// Example usage\nfetchData("https://jsonplaceholder.typicode.com/todos/1")\n  .then(data => console.log("API response:", data))\n  .catch(error => console.error("Error:", error));',
            python: 'import requests\n\ndef fetch_data(url):\n    """Fetch data from an API\n    \n    Args:\n        url (str): API endpoint\n        \n    Returns:\n        dict: API response data\n        \n    Raises:\n        Exception: If the request fails\n    """\n    try:\n        response = requests.get(url)\n        response.raise_for_status()  # Raise exception for 4XX/5XX status\n        \n        return response.json()\n    except Exception as e:\n        print(f"Fetch error: {e}")\n        raise\n\n# Example usage\ntry:\n    data = fetch_data("https://jsonplaceholder.typicode.com/todos/1")\n    print("API response:", data)\nexcept Exception as e:\n    print("Error:", e)'
        }
    };
}