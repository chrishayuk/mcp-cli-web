/**
 * Code Example Test Command
 * 
 * This script adds a command to insert pre-formatted code examples
 * in the chat for testing the code handling functionality
 */

// Wait for chat interface and code handler to be ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      if (window.ChatInterface && window.ChatCodeHandler) {
        addTestCodeCommand();
        console.log("Test code example command added");
      }
    }, 800);
  });
  
  /**
   * Add test code command to the command suggestions and chat processing
   */
  function addTestCodeCommand() {
    // Add test code command to suggestions
    const suggestionsContainer = document.getElementById('command-suggestions');
    if (suggestionsContainer) {
      const testCodeSuggestion = document.createElement('span');
      testCodeSuggestion.className = 'command-suggestion';
      testCodeSuggestion.innerHTML = '<i class="fas fa-vial"></i> test code';
      suggestionsContainer.appendChild(testCodeSuggestion);
      
      // Add click event listener
      testCodeSuggestion.addEventListener('click', () => {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
          chatInput.value = 'test code';
          chatInput.focus();
        }
      });
    }
    
    // Extend the command processor to handle the test code command
    const originalProcessCommand = window.ChatInterface.processCommand;
    window.ChatInterface.processCommand = function(command) {
      if (command.toLowerCase().trim() === 'test code' || 
          command.toLowerCase().startsWith('test code ')) {
        // Extract language if specified
        let language = 'javascript'; // Default
        let example = 'hello'; // Default
        
        // Parse command for options
        const parts = command.split(' ');
        if (parts.length > 2) {
          // Language is specified
          if (['javascript', 'js', 'python', 'py', 'html', 'css', 'java'].includes(parts[2].toLowerCase())) {
            language = parts[2].toLowerCase();
            if (language === 'js') language = 'javascript';
            if (language === 'py') language = 'python';
          }
          
          // Example type if specified
          if (parts.length > 3 && ['hello', 'function', 'class', 'loop', 'api'].includes(parts[3].toLowerCase())) {
            example = parts[3].toLowerCase();
          }
        }
        
        // Get the example code
        const codeExample = getCodeExample(language, example);
        
        // Add it as a system message
        this.addSystemMessage(`Here's a ${language} ${example} example to test code handling:\n\n\`\`\`${language}\n${codeExample}\n\`\`\``);
        
        return;
      }
      
      // Call original for all other commands
      return originalProcessCommand.call(this, command);
    };
  }
  
  /**
   * Get a code example for the specified language and type
   * 
   * @param {string} language - The programming language
   * @param {string} type - The example type (hello, function, class, loop, api)
   * @returns {string} The code example
   */
  function getCodeExample(language, type) {
    const examples = {
      javascript: {
        hello: 'console.log("Hello, world!");',
        
        function: `/**
   * Calculates the sum of an array of numbers
   * @param {number[]} numbers - Array of numbers to sum
   * @returns {number} The total sum
   */
  function sum(numbers) {
    return numbers.reduce((total, num) => total + num, 0);
  }
  
  // Example usage
  const result = sum([1, 2, 3, 4, 5]);
  console.log(\`Sum: \${result}\`);`,
        
        class: `class Person {
    constructor(name, age) {
      this.name = name;
      this.age = age;
    }
    
    greet() {
      return \`Hello, my name is \${this.name} and I am \${this.age} years old\`;
    }
    
    static fromBirthYear(name, birthYear) {
      const currentYear = new Date().getFullYear();
      return new Person(name, currentYear - birthYear);
    }
  }
  
  // Create instance and use methods
  const alice = new Person("Alice", 28);
  console.log(alice.greet());
  
  // Use static factory method
  const bob = Person.fromBirthYear("Bob", 1995);
  console.log(bob.greet());`,
        
        loop: `// Example of different loop types in JavaScript
  
  // For loop
  console.log("For loop:");
  for (let i = 0; i < 3; i++) {
    console.log(\`Iteration \${i + 1}\`);
  }
  
  // While loop
  console.log("\\nWhile loop:");
  let count = 0;
  while (count < 3) {
    console.log(\`Count: \${count + 1}\`);
    count++;
  }
  
  // For...of array iteration
  console.log("\\nFor...of loop:");
  const fruits = ["Apple", "Banana", "Cherry"];
  for (const fruit of fruits) {
    console.log(\`Fruit: \${fruit}\`);
  }
  
  // Array methods
  console.log("\\nArray methods:");
  const numbers = [1, 2, 3, 4, 5];
  const doubled = numbers.map(num => num * 2);
  console.log(\`Doubled: \${doubled}\`);
  
  const sum = numbers.reduce((total, num) => total + num, 0);
  console.log(\`Sum: \${sum}\`);`,
        
        api: `// Fetch data from an API with async/await
  async function fetchUserData(userId) {
    try {
      const response = await fetch(\`https://jsonplaceholder.typicode.com/users/\${userId}\`);
      
      if (!response.ok) {
        throw new Error(\`HTTP error! Status: \${response.status}\`);
      }
      
      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }
  
  // Example usage with async IIFE
  (async () => {
    try {
      console.log('Fetching user data...');
      const user = await fetchUserData(1);
      console.log('User data:', user);
      
      // Process the data
      console.log(\`\${user.name} works at \${user.company.name}\`);
      console.log(\`Email: \${user.email}\`);
      console.log(\`Address: \${user.address.street}, \${user.address.city}\`);
    } catch (error) {
      console.error('Error in main process:', error);
    }
  })();`
      },
      
      python: {
        hello: 'print("Hello, world!")',
        
        function: `def calculate_average(numbers):
      """
      Calculate the average of a list of numbers
      
      Args:
          numbers (list): A list of numbers
          
      Returns:
          float: The average value
      """
      if not numbers:
          return 0
      return sum(numbers) / len(numbers)
  
  # Example usage
  scores = [85, 92, 78, 90, 88]
  avg = calculate_average(scores)
  print(f"The average score is: {avg:.2f}")`,
        
        class: `class Animal:
      """A simple Animal class to demonstrate OOP in Python"""
      
      def __init__(self, name, species):
          self.name = name
          self.species = species
      
      def make_sound(self):
          pass
      
      def __str__(self):
          return f"{self.name} is a {self.species}"
  
  
  class Dog(Animal):
      """Dog class that inherits from Animal"""
      
      def __init__(self, name, breed):
          super().__init__(name, "Dog")
          self.breed = breed
      
      def make_sound(self):
          return "Woof!"
      
      def __str__(self):
          return f"{self.name} is a {self.breed} dog"
  
  
  # Create instances and use methods
  fido = Dog("Fido", "Golden Retriever")
  print(fido)
  print(f"{fido.name} says: {fido.make_sound()}")`,
        
        loop: `# Example of different loop types in Python
  
  # For loop with range
  print("For loop with range:")
  for i in range(3):
      print(f"Iteration {i + 1}")
  
  # While loop
  print("\\nWhile loop:")
  count = 0
  while count < 3:
      print(f"Count: {count + 1}")
      count += 1
  
  # Iteration over a list
  print("\\nList iteration:")
  fruits = ["Apple", "Banana", "Cherry"]
  for fruit in fruits:
      print(f"Fruit: {fruit}")
  
  # Enumeration
  print("\\nEnumeration:")
  for index, fruit in enumerate(fruits):
      print(f"{index + 1}. {fruit}")
  
  # List comprehension
  print("\\nList comprehension:")
  numbers = [1, 2, 3, 4, 5]
  squares = [n**2 for n in numbers]
  print(f"Original: {numbers}")
  print(f"Squares: {squares}")
  
  # Dictionary iteration
  print("\\nDictionary iteration:")
  person = {
      "name": "Alice",
      "age": 28,
      "city": "New York"
  }
  for key, value in person.items():
      print(f"{key}: {value}")`,
        
        api: `import requests
  
  def fetch_weather(city, api_key):
      """
      Fetch weather data for a given city
      
      Args:
          city (str): City name
          api_key (str): API key for the weather service
          
      Returns:
          dict: Weather data or None if request failed
      """
      base_url = "https://api.example.com/weather"
      params = {
          "q": city,
          "appid": api_key,
          "units": "metric"
      }
      
      try:
          response = requests.get(base_url, params=params)
          response.raise_for_status()  # Raise exception for HTTP errors
          
          return response.json()
      except requests.exceptions.RequestException as e:
          print(f"Error fetching weather data: {e}")
          return None
  
  # Example usage
  def main():
      city = "London"
      api_key = "YOUR_API_KEY"  # Replace with actual API key
      
      print(f"Fetching weather for {city}...")
      weather_data = fetch_weather(city, api_key)
      
      if weather_data:
          temp = weather_data.get("main", {}).get("temp", "N/A")
          description = weather_data.get("weather", [{}])[0].get("description", "N/A")
          
          print(f"Current temperature: {temp}°C")
          print(f"Weather conditions: {description}")
      else:
          print("Failed to fetch weather data")
  
  if __name__ == "__main__":
      main()`
      },
      
      html: {
        hello: `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hello World</title>
  </head>
  <body>
      <h1>Hello, World!</h1>
      <p>This is a simple HTML example.</p>
  </body>
  </html>`,
        
        function: `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Button Example</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin-top: 50px;
          }
          button {
              padding: 10px 20px;
              background-color: #4CAF50;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
          }
          button:hover {
              background-color: #45a049;
          }
      </style>
  </head>
  <body>
      <h1>Button Click Counter</h1>
      <p>You've clicked the button <span id="counter">0</span> times.</p>
      <button id="clickButton">Click Me!</button>
  
      <script>
          // Function to handle button clicks
          function setupCounter() {
              let count = 0;
              const counterElement = document.getElementById('counter');
              const button = document.getElementById('clickButton');
              
              button.addEventListener('click', function() {
                  count++;
                  counterElement.textContent = count;
              });
          }
  
          // Initialize when page loads
          document.addEventListener('DOMContentLoaded', setupCounter);
      </script>
  </body>
  </html>`
      },
      
      css: {
        hello: `/* Basic CSS example */
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  h1 {
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
  }
  
  p {
    margin-bottom: 20px;
  }
  
  .highlight {
    background-color: #ffffcc;
    padding: 5px;
    border-radius: 3px;
  }`,
        
        function: `/* CSS Custom Properties and Theming Example */
  
  :root {
    /* Base colors */
    --primary-color: #3498db;
    --secondary-color: #2ecc71;
    --accent-color: #e74c3c;
    --text-color: #333333;
    --background-color: #f5f5f5;
    
    /* Spacing */
    --spacing-small: 8px;
    --spacing-medium: 16px;
    --spacing-large: 24px;
    
    /* Typography */
    --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    --font-size-small: 0.875rem;
    --font-size-medium: 1rem;
    --font-size-large: 1.25rem;
    --font-size-xlarge: 1.5rem;
    
    /* Borders */
    --border-radius: 4px;
    --border-width: 1px;
    --border-color: #ddd;
  }
  
  /* Dark theme */
  .dark-theme {
    --primary-color: #2980b9;
    --secondary-color: #27ae60;
    --accent-color: #c0392b;
    --text-color: #f5f5f5;
    --background-color: #2c3e50;
    --border-color: #34495e;
  }
  
  /* Base styles */
  body {
    font-family: var(--font-family);
    color: var(--text-color);
    background-color: var(--background-color);
    margin: 0;
    padding: var(--spacing-large);
    transition: background-color 0.3s ease;
  }
  
  /* Button styles */
  .button {
    display: inline-block;
    padding: var(--spacing-small) var(--spacing-medium);
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius);
    font-size: var(--font-size-medium);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .button:hover {
    background-color: color-mix(in srgb, var(--primary-color), black 10%);
  }
  
  .button--secondary {
    background-color: var(--secondary-color);
  }
  
  .button--accent {
    background-color: var(--accent-color);
  }
  
  /* Card component */
  .card {
    background-color: white;
    border-radius: var(--border-radius);
    border: var(--border-width) solid var(--border-color);
    padding: var(--spacing-medium);
    margin-bottom: var(--spacing-medium);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .card__title {
    font-size: var(--font-size-large);
    margin-top: 0;
    margin-bottom: var(--spacing-small);
    color: var(--primary-color);
  }
  
  .card__content {
    font-size: var(--font-size-medium);
  }`
      }
    };
    
    // Return the requested example or a default if not found
    return examples[language] && examples[language][type] ? 
      examples[language][type] : 
      'console.log("Example not found. Try a different language or type.");';
  }