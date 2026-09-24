let canvas;
let ctx;
let canvasWidth;
let canvasHeight;

window.addEventListener('load', function() {
  canvas = document.getElementById("mazeCanvas");
  ctx = canvas.getContext("2d");
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;
  drawCanvas();
  drawMaze(mazeTiny, canvasWidth, canvasHeight);
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


