let canvas;
let ctx;
let canvasWidth;
let canvasHeight;

const MIN_SIZE = 2;
const MAX_SIZE = 50;
const DEFAULT_SIZE = 5;

// Reads a number input, falling back to the default and clamping to the allowed range.
const readSize = function(input) {
  if (input.value.trim() === '') return DEFAULT_SIZE;
  const n = Math.floor(Number(input.value));
  if (!Number.isFinite(n)) return DEFAULT_SIZE;
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, n));
};

window.addEventListener('load', function() {
  canvas = document.getElementById("mazeCanvas");
  ctx = canvas.getContext("2d");
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;
  drawCanvas();
  drawMaze(mazeTiny, canvasWidth, canvasHeight);

  document.getElementById("generateBtn").addEventListener('click', function() {
    const widthInput = document.getElementById("mazeWidth");
    const heightInput = document.getElementById("mazeHeight");
    const width = readSize(widthInput);
    const height = readSize(heightInput);
    widthInput.value = width;   // show the clamped value back to the user
    heightInput.value = height;
    drawCanvas();
    drawMaze(generateMaze(width, height), canvasWidth, canvasHeight);
    this.blur(); // so arrow keys go to the maze, not the button
  });
});

document.addEventListener('keydown', function(evt) {
  onKeyDown(evt);
});

const drawCanvas = function() {
  //Fills the entire canvas with a greenish blue
  ctx.fillStyle = "#00C0CC";
  ctx.beginPath();
  ctx.rect(0, 0, canvasWidth, canvasHeight);
  ctx.fill();
};


