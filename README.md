# Maze Navigation Puzzle - README

## Overview

This take-home puzzle asks you to implement a playable maze system using JavaScript and HTML5 Canvas. You'll design a data structure for representing mazes, render them to a canvas, and handle keyboard navigation.

**Time expectation:** 1-2 hours

## Context

At Art of Problem Solving, we use engaging puzzles to help students strengthen their problem-solving skills. Imagine we're building a system where kids (let's say 4th graders) can play mazes of various difficulties.

For our MVP, curriculum developers will hand-craft each maze. We want to skip building a maze editor and just get playable mazes in front of testers quickly. Our curriculum team is technical enough to work with arrays and simple JSON, and they'll copy-paste maze definitions from Google Docs into a text box. **This means we need a data format that's simple enough for non-engineers but expressive enough to handle both simple and complex mazes.**

## Getting Started

This zip file contains:

- **maze-game.html** - The HTML page that loads your code
- **maze-game.js** - The game initialization and canvas setup code
- **candidate-submission.js** - Your starting point (edit this file)

To test your code:
1. Edit `candidate-submission.js` with your implementation
2. Open `maze-game.html` in a web browser
3. Use arrow keys to navigate the maze

## Your Task

Edit `candidate-submission.js` to implement the three required components:

### 1. Design a Data Structure

Choose a format to represent mazes and hardcode the `mazeTiny` variable to represent the Tiny Maze from the assignment document.

**Critical:** Include comments explaining your format so reviewers can encode the other example mazes (such as small, medium, large from the assignment) and test your code.

You can assume:
- Mazes are always rectangular
- Each maze has exactly one solution path
- All parts of the maze are accessible
- No loops exist in the paths

### 2. Implement `drawMaze`

Complete the `drawMaze` function:
```javascript
/**
 * Draws the maze grid and initial player avatar onto the canvas.
 *
 * @param {Array} mazeData - The representation of the maze; structure depends on your chosen data format.
 * @param {number} width - The pixel width of the canvas.
 * @param {number} height - The pixel height of the canvas.
 */
const drawMaze = function(mazeData, width, height) {
  // Your implementation here
};
```

Your function will be called immediately after the canvas is initialized (see `maze-game.js`). It should:
- Draw the maze using the global `ctx` (canvas context) and `canvas` variables
- Scale to fill most of the canvas with reasonable padding (your discretion)
- Handle different maze sizes
- Draw a player avatar at the maze start (any simple shape is fine)

**Note:** We care about code quality and correctness, not visual aesthetics. Simple shapes and basic rendering are perfectly acceptable.

### 3. Implement `onKeyDown`

Complete the `onKeyDown` function to handle arrow key input:
```javascript
/**
 * Handles keyboard arrow key input to move the player within the maze.
 *
 * @param {KeyboardEvent} evt - The keyboard event corresponding to the key pressed.
 */
const onKeyDown = function(evt) {
  // Your implementation here
};
```

Arrow keys should move the avatar in the appropriate direction, with collision detection preventing movement through walls. Movement details (discrete vs. smooth, speed, etc.) are your choice.

## Available Variables

The following are available in global scope (defined in `maze-game.js`):

- `canvas` - The canvas element
- `ctx` - The 2D rendering context
- `canvasWidth` - Canvas width (700 by default, can be changed in HTML)
- `canvasHeight` - Canvas height (700 by default, can be changed in HTML)

## Testing

You can modify `maze-game.html` to test different canvas sizes by changing the width/height attributes of the canvas element.

After implementing `mazeTiny`, try encoding the other maze examples from the assignment document to verify your data structure works for different sizes.

## Submission

Submit **only** your `candidate-submission.js` file, renamed to:

`[lastname]_[firstname]_maze2025.js.txt`

Example: `doe_john_maze2025.js.txt` (all lowercase)

**Requirements:**
- Your file must define `mazeTiny`, `drawMaze`, and `onKeyDown`
- These must work when included via script tag as shown in `maze-game.html`
- Include clear comments documenting your maze data format
- No external dependencies beyond what's provided

## Evaluation

We'll assess:
- **Data structure design** - Is it intuitive for non-programmers? Does it handle all required maze sizes?
- **Code quality** - Is it well-organized, readable, and documented?
- **Correctness** - Does it work across different maze sizes?
