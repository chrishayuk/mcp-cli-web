# Terminal Canvas - Pure JavaScript Version

This version of the Terminal Canvas application has been updated to run without WebAssembly, making it easier to deploy and use without compilation steps.

## Project Structure

```
terminal-canvas/
├── index.html              # Main HTML file
├── styles/
│   └── main.css            # CSS styles for the UI
└── js/
    ├── terminal.js         # Terminal functionality
    ├── canvas.js           # Canvas handling and visualization
    ├── commands.js         # Command processing
    └── main.js             # Main initialization
```

## Running the Project

Since this version doesn't require WebAssembly compilation, you can run it directly with any static web server:

```bash
npx serve
```

Then open your browser at the provided URL (typically http://localhost:3000).

## Features

### Terminal Commands

- `fetch [url]` - Fetch data from any API
- `fetch image [url]` - Fetch and display an image (random image if no URL provided)
- `image [url]` - Display an image (random image if no URL provided)
- `draw` or `generate` - Draw a random shape
- `clear canvas` - Clear the canvas
- `clear` or `cls` - Clear terminal output
- `apis` - Show available API endpoints
- `help` - Show available commands

### Image Display

The "fetch image" command now works entirely with JavaScript:

1. You can use it without a URL to get a random image:
   ```
   fetch image
   ```

2. You can provide a specific image URL:
   ```
   fetch image https://example.com/image.jpg
   ```

3. You can also use the shorter `image` command:
   ```
   image https://example.com/image.jpg
   ```

### API Integration

The application can fetch data from any API and will:
- Display JSON responses in a formatted way
- Detect image responses and display them in the canvas
- Handle errors gracefully

## Quick API Examples

- JSON data: `fetch https://jsonplaceholder.typicode.com/todos