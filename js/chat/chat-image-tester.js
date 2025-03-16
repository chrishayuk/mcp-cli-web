/**
 * chat-image-tester.js
 * 
 * Adds test commands to insert image examples in the chat
 * for testing the image handling functionality
 */

// Wait for chat interface and image handler to be ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      if (window.ChatInterface) {
        addTestImageCommand();
        console.log("Test image command added");
      }
    }, 800);
  });
  
  /**
   * Add test image command to the command suggestions and chat processing
   */
  function addTestImageCommand() {
    // Add test image command to suggestions
    const suggestionsContainer = document.getElementById('command-suggestions');
    if (suggestionsContainer) {
      const testImageSuggestion = document.createElement('span');
      testImageSuggestion.className = 'command-suggestion';
      testImageSuggestion.innerHTML = '<i class="fas fa-vial"></i> test image';
      suggestionsContainer.appendChild(testImageSuggestion);
      
      // Add click event listener
      testImageSuggestion.addEventListener('click', () => {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
          chatInput.value = 'test image';
          chatInput.focus();
        }
      });
    }
    
    // Extend the command processor to handle the test image command
    const originalProcessCommand = window.ChatInterface.processCommand;
    window.ChatInterface.processCommand = function(command) {
      if (command.toLowerCase().trim() === 'test image' || 
          command.toLowerCase().startsWith('test image ')) {
        
        // Extract category if specified
        let category = 'nature'; // Default
        let format = 'url'; // Default: direct URL
        
        // Parse command for options
        const parts = command.split(' ');
        if (parts.length > 2) {
          // Category specified
          if (['nature', 'abstract', 'animal', 'technology', 'space', 'art', 'logo'].includes(parts[2].toLowerCase())) {
            category = parts[2].toLowerCase();
          }
          
          // Format specified
          if (parts.length > 3 && ['url', 'markdown', 'embed'].includes(parts[3].toLowerCase())) {
            format = parts[3].toLowerCase();
          }
        }
        
        // Get the test image
        const imageExample = getImageExample(category);
        
        // Format the image according to requested format
        let formattedImage = formatImage(imageExample, format);
        
        // Add it as a system message
        this.addSystemMessage(`Here's a test ${category} image (${format} format):\n\n${formattedImage}`);
        
        return;
      }
      
      // Call original for all other commands
      return originalProcessCommand.call(this, command);
    };
  }
  
  /**
   * Format an image example in the requested format
   * 
   * @param {object} imageExample - The image example object
   * @param {string} format - The format to use (url, markdown, embed)
   * @returns {string} The formatted image reference
   */
  function formatImage(imageExample, format) {
    switch (format) {
      case 'markdown':
        return `![${imageExample.alt}](${imageExample.url})`;
      
      case 'embed':
        return `<img src="${imageExample.url}" alt="${imageExample.alt}" width="300" />`;
      
      case 'url':
      default:
        return imageExample.url;
    }
  }
  
  /**
   * Get an image example from the specified category
   * 
   * @param {string} category - The image category
   * @returns {object} An image example with url and alt properties
   */
  function getImageExample(category) {
    // Collection of test images organized by category
    const imageExamples = {
      nature: [
        {
          url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format',
          alt: 'Foggy mountain landscape at sunrise'
        },
        {
          url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format',
          alt: 'Sunlight streaming through forest trees'
        },
        {
          url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&auto=format',
          alt: 'Calm lake with mountain reflections'
        }
      ],
      
      animal: [
        {
          url: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=600&auto=format',
          alt: 'Fox closeup portrait'
        },
        {
          url: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&auto=format',
          alt: 'Bird perched on a branch'
        },
        {
          url: 'https://images.unsplash.com/photo-1484406566174-9da000fda645?w=600&auto=format',
          alt: 'Wolf in a snowy landscape'
        }
      ],
      
      abstract: [
        {
          url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format',
          alt: 'Abstract light trails'
        },
        {
          url: 'https://images.unsplash.com/photo-1507908708918-778587c9e563?w=600&auto=format',
          alt: 'Colorful abstract fluid art'
        },
        {
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format',
          alt: 'Geometric abstract shapes'
        }
      ],
      
      technology: [
        {
          url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format',
          alt: 'Technology circuit board closeup'
        },
        {
          url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format',
          alt: 'Digital code on a screen'
        },
        {
          url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format',
          alt: 'Server room with data cables'
        }
      ],
      
      space: [
        {
          url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&auto=format',
          alt: 'Galaxy and stars in deep space'
        },
        {
          url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format',
          alt: 'Earth from space'
        },
        {
          url: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600&auto=format',
          alt: 'Nebula in outer space'
        }
      ],
      
      art: [
        {
          url: 'https://images.unsplash.com/photo-1579965342575-16428a7c8881?w=600&auto=format',
          alt: 'Colorful abstract painting'
        },
        {
          url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&auto=format',
          alt: 'Classic sculpture in museum'
        },
        {
          url: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=600&auto=format',
          alt: 'Street art mural on wall'
        }
      ],
      
      logo: [
        {
          url: 'https://placehold.co/500x300/00dd00/ffffff?text=Terminal+Canvas',
          alt: 'Terminal Canvas logo placeholder'
        },
        {
          url: 'https://placehold.co/500x300/00aa00/ffffff?text=CODE+MODULE',
          alt: 'Code Module logo placeholder'
        },
        {
          url: 'https://placehold.co/500x300/00ff00/000000?text=IMAGE+TEST',
          alt: 'Image Test logo placeholder'
        }
      ]
    };
    
    // Get the examples for the requested category or use nature as fallback
    const examples = imageExamples[category] || imageExamples.nature;
    
    // Return a random example from the category
    return examples[Math.floor(Math.random() * examples.length)];
  }