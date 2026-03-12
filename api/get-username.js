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
      throw new Error('Failed to obtain X-CSRF-Token');
    }

    // 2. Dane zalogowanego użytkownika
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
        userRes.status === 401
          ? 'Invalid or expired cookie'
          : `API error: ${userRes.status}`
      );
    }

    const userData = await userRes.json();

    // 3. Roblox Premium?
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
      if (premiumRes.ok) {
        hasPremium = await premiumRes.json();
      }
    } catch {
      // silent fail
    }

    // 4. Robux
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
    } catch {
      // silent
    }

    // 5. Wiek konta + data założenia
    let accountAgeDays = 0;
    let createdDate = null;
    try {
      const profileRes = await fetch(`https://users.roblox.com/v1/users/${userData.id}`);
      if (profileRes.ok) {
        const profile = await profileRes.json();
        if (profile.created) {
          createdDate = profile.created;
          const created = new Date(createdDate);
          accountAgeDays = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
        }
      }
    } catch {
      // silent
    }

    // 6. Avatar
    let avatarUrl = null;
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userData.id}&size=720x720&format=Png&isCircular=false`
      );
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        avatarUrl = thumbData.data?.[0]?.imageUrl || null;
      }
    } catch {
      // silent
    }

    // 7. Sprawdzenie gamepassów MM2 (Elite i Radio)
    const mm2GamePassIds = [429957, 1308795];
    const hasGamePasses = [];

    try {
      for (const passId of mm2GamePassIds) {
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
        // 404 / inne błędy → traktujemy jako "nie posiada"
      }
    } catch {
      // silent fail – nie psujemy całego zapytania
    }

    // 8. Odpowiedź
    res.status(200).json({
      success: true,
      username: userData.name,
      displayName: userData.displayName || userData.name,
      userId: userData.id,
      hasPremium,
      robux,
      accountAgeDays,
      created: createdDate || 'failed to fetch',
      avatarUrl,
      hasGamePasses,           // ← tablica np. [] , [429957] , [1308795] , [429957, 1308795]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message || 'Internal server error',
    });
  }
}
