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
    // 1. Logout → pobranie X-CSRF-Token
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: { 
        'Cookie': `.ROBLOSECURITY=${cookie}`, 
        'Content-Type': 'application/json' 
      },
    });
    const csrfToken = tokenRes.headers.get('x-csrf-token');
    if (!csrfToken) throw new Error('Failed to obtain X-CSRF-Token');

    // 2. Sprawdzamy czy cookie jest ważne + pobieramy dane użytkownika
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      method: 'GET',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json',
      },
    });

    if (!userRes.ok) {
      throw new Error(userRes.status === 401 ? 'Invalid or expired cookie' : `API error: ${userRes.status}`);
    }

    const userData = await userRes.json();

    // ────────────────────────────────────────────────
    //     NOWOŚĆ: Sprawdzanie czy 2FA jest włączone
    // ────────────────────────────────────────────────
    let has2FA = false;
    try {
      const reauthRes = await fetch('https://auth.roblox.com/v2/reauthenticate', {
        method: 'POST',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'X-CSRF-TOKEN': csrfToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (reauthRes.status === 401 || reauthRes.status === 403) {
        const errData = await reauthRes.json().catch(() => ({}));
        const has2FAError = errData.errors?.some(e =>
          e.message?.toLowerCase().includes('two-step') ||
          e.message?.toLowerCase().includes('verification') ||
          e.message?.toLowerCase().includes('2fa') ||
          e.code === 2 || e.code === 10
        );
        if (has2FAError) {
          has2FA = true;
        }
      }
      // jeśli 200 / 204 → 2FA jest wyłączone → has2FA zostaje false
    } catch {
      // w razie błędu zostawiamy false (bezpieczniej niż błędne true)
    }

    // ────────────────────────────────────────────────
    //     Reszta kodu bez zmian
    // ────────────────────────────────────────────────

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

    // GAMEPASSES
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
    //     Odpowiedź z nowym polem has2FA
    // ────────────────────────────────────────────────
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
      hasGamePasses,
      has2FA,                // <--- DODANE
    });

  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
