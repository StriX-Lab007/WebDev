// Responsive canvas
const canvas = document.getElementById('pongCanvas');
const baseWidth = 800;
const baseHeight = 500;
function resizeCanvas() {
  let w = Math.min(baseWidth, window.innerWidth * 0.95);
  let h = Math.min(baseHeight, window.innerHeight * 0.75);
  canvas.width = w;
  canvas.height = h;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const ctx = canvas.getContext('2d');

// Paddle settings
const PADDLE_WIDTH = 18;
const PADDLE_HEIGHT = 94;
const PADDLE_RADIUS = 14;
const PADDLE_MARGIN = 28;
const PADDLE_SPEED = 8;

// Ball settings
const BALL_RADIUS = 15;
const BALL_SPEED = 6;

// Score
let playerScore = 0;
let aiScore = 0;
const WIN_SCORE = 10;
let gameEnded = false;

// Paddle objects
let playerPaddle = {
  x: PADDLE_MARGIN,
  y: canvas.height / 2 - PADDLE_HEIGHT / 2,
  vy: 0,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT
};
let aiPaddle = {
  x: () => canvas.width - PADDLE_MARGIN - PADDLE_WIDTH,
  y: canvas.height / 2 - PADDLE_HEIGHT / 2,
  vy: 0,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT
};

// Ball object
let ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  vx: BALL_SPEED * (Math.random() < 0.5 ? 1 : -1),
  vy: BALL_SPEED * (Math.random() * 1.5 - 0.75)
};

// Mouse controls (smooth paddle)
let targetPaddleY = playerPaddle.y;
canvas.addEventListener('mousemove', function(evt) {
  if (gameEnded) return;
  const rect = canvas.getBoundingClientRect();
  let mouseY = evt.clientY - rect.top;
  targetPaddleY = mouseY - playerPaddle.height / 2;
});
// Touch controls (for mobile)
canvas.addEventListener('touchmove', function(evt) {
  if (gameEnded) return;
  const rect = canvas.getBoundingClientRect();
  let touchY = evt.touches[0].clientY - rect.top;
  targetPaddleY = touchY - playerPaddle.height / 2;
});

// Game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function update() {
  // Responsive
  playerPaddle.x = PADDLE_MARGIN;
  aiPaddle.x = canvas.width - PADDLE_MARGIN - aiPaddle.width;

  // Ball movement
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Smooth player paddle movement
  let diff = targetPaddleY - playerPaddle.y;
  playerPaddle.vy = diff * 0.22;
  playerPaddle.y += playerPaddle.vy;
  // Clamp paddle
  playerPaddle.y = Math.max(0, Math.min(canvas.height - playerPaddle.height, playerPaddle.y));

  // Wall collision (top and bottom)
  if (ball.y - BALL_RADIUS < 0) {
    ball.y = BALL_RADIUS;
    ball.vy *= -1;
  } else if (ball.y + BALL_RADIUS > canvas.height) {
    ball.y = canvas.height - BALL_RADIUS;
    ball.vy *= -1;
  }

  // Paddle collision (player)
  if (
    ball.x - BALL_RADIUS < playerPaddle.x + playerPaddle.width &&
    ball.y > playerPaddle.y &&
    ball.y < playerPaddle.y + playerPaddle.height
  ) {
    ball.x = playerPaddle.x + playerPaddle.width + BALL_RADIUS;
    ball.vx *= -1;
    // Effect based on where ball hits paddle
    let hitPos = (ball.y - (playerPaddle.y + playerPaddle.height / 2)) / (playerPaddle.height / 2);
    ball.vy = BALL_SPEED * hitPos * 1.15 + (playerPaddle.vy * 0.05);
    bumpScoreboard('playerScore');
  }

  // Paddle collision (AI)
  if (
    ball.x + BALL_RADIUS > aiPaddle.x &&
    ball.y > aiPaddle.y &&
    ball.y < aiPaddle.y + aiPaddle.height
  ) {
    ball.x = aiPaddle.x - BALL_RADIUS;
    ball.vx *= -1;
    let hitPos = (ball.y - (aiPaddle.y + aiPaddle.height / 2)) / (aiPaddle.height / 2);
    ball.vy = BALL_SPEED * hitPos * 1.15 + (aiPaddle.vy * 0.05);
    bumpScoreboard('aiScore');
  }

  // Score detection
  if (ball.x - BALL_RADIUS < 0) {
    aiScore++;
    updateScore();
    resetBall(-1);
    checkWin();
  } else if (ball.x + BALL_RADIUS > canvas.width) {
    playerScore++;
    updateScore();
    resetBall(1);
    checkWin();
  }

  // AI paddle movement (smooth, with error margin)
  let aiCenter = aiPaddle.y + aiPaddle.height / 2;
  let targetY = ball.y + (Math.random() * 60 - 30); // some error
  let aiDiff = targetY - aiCenter;
  aiPaddle.vy = Math.sign(aiDiff) * Math.min(Math.abs(aiDiff), PADDLE_SPEED + Math.random()*1.2);
  aiPaddle.y += aiPaddle.vy * 0.18;
  // Clamp AI paddle
  aiPaddle.y = Math.max(0, Math.min(canvas.height - aiPaddle.height, aiPaddle.y));
}

function resetBall(direction) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.vx = BALL_SPEED * direction;
  ball.vy = BALL_SPEED * (Math.random() * 1.2 - 0.6);
}

function updateScore() {
  document.getElementById('playerScore').textContent = playerScore;
  document.getElementById('aiScore').textContent = aiScore;
}

function bumpScoreboard(id) {
  const el = document.getElementById(id);
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 150);
}

function checkWin() {
  if (!gameEnded && (playerScore >= WIN_SCORE || aiScore >= WIN_SCORE)) {
    gameEnded = true;
    let msg = playerScore > aiScore ? "You Win! 🏆" : "AI Wins! 🤖";
    let winDiv = document.getElementById('winMessage');
    winDiv.innerHTML = msg + "<br><span style='font-size:1.1rem'>Refresh to play again!</span>";
    winDiv.style.display = "block";
  }
}

function draw() {
  // Resize canvas if needed, update positions
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw net
  ctx.save();
  ctx.strokeStyle = "#fff4";
  ctx.lineWidth = 3;
  ctx.setLineDash([18, 24]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Draw paddles (rounded)
  drawPaddle(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height, PADDLE_RADIUS, "#92c7ff", "#3a63ad");
  drawPaddle(aiPaddle.x, aiPaddle.y, aiPaddle.width, aiPaddle.height, PADDLE_RADIUS, "#fbc02d", "#ad6f3a");

  // Draw ball (shadow, gradient)
  ctx.save();
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
  let grad = ctx.createRadialGradient(ball.x, ball.y, BALL_RADIUS*0.2, ball.x, ball.y, BALL_RADIUS);
  grad.addColorStop(0, "#fff");
  grad.addColorStop(1, "#3a63ad");
  ctx.fillStyle = grad;
  ctx.shadowColor = "#4887f7";
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.restore();
}

function drawPaddle(x, y, w, h, r, color1, color2) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  // Gradient fill
  let grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  ctx.fillStyle = grad;
  ctx.shadowColor = color2 + "99";
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.restore();
}

// Start game loop
gameLoop();