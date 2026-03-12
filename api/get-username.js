export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Tylko POST dozwolone' });
  }

  const { cookie } = req.body || {};
  if (!cookie || typeof cookie !== 'string' || cookie.length < 200) {
    return res.status(400).json({ error: 'Brak poprawnego cookie' });
  }

  try {
    // 1. Pobierz X-CSRF-Token
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

    // 2. Dane użytkownika (username, displayName, id)
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      method: 'GET',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json',
      },
    });

    if (!userRes.ok) {
      if (userRes.status === 401) {
        throw new Error('Cookie nieważne lub wygasłe (401 Unauthorized)');
      }
      throw new Error(`Błąd Roblox: ${userRes.status}`);
    }

    const userData = await userRes.json();

    // 3. Premium
    let hasPremium = false;
    try {
      const premiumRes = await fetch(`https://premiumfeatures.roblox.com/v1/users/${userData.id}/validate-membership`, {
        method: 'GET',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'X-CSRF-TOKEN': csrfToken,
          'Accept': 'application/json',
        },
      });
      if (premiumRes.ok) {
        hasPremium = await premiumRes.json(); // true/false
      }
    } catch (e) {}

    // 4. Robux balance
    let robux = 0;
    try {
      const currencyRes = await fetch(`https://economy.roblox.com/v1/users/${userData.id}/currency`, {
        method: 'GET',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'X-CSRF-TOKEN': csrfToken,
          'Accept': 'application/json',
        },
      });
      if (currencyRes.ok) {
        const currencyData = await currencyRes.json();
        robux = currencyData.robux || 0;
      }
    } catch (e) {
      // jeśli błąd → robux zostaje 0
    }

    // 5. Wiek konta – data utworzenia + dni
    let accountAgeDays = 0;
    let createdDate = null;

    try {
      const profileRes = await fetch(`https://users.roblox.com/v1/users/${userData.id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          // Cookie i CSRF nie są tutaj wymagane – endpoint jest publiczny
        },
      });

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.created) {
          createdDate = profileData.created; // np. "2015-07-20T14:35:22.12Z"

          const created = new Date(createdDate);
          const now = new Date();

          // różnica w milisekundach → dni
          const diffMs = now - created;
          accountAgeDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        }
      }
    } catch (e) {
      // jeśli coś pójdzie nie tak → wiek zostaje 0, nie psujemy reszty
      console.error('Błąd podczas pobierania created date:', e);
    }

    res.status(200).json({
      success: true,
      username: userData.name,
      displayName: userData.displayName || userData.name,
      userId: userData.id,
      hasPremium: hasPremium,
      robux: robux,
      accountAgeDays: accountAgeDays,           // ← nowe
      created: createdDate || 'nie udało się pobrać'  // ← opcjonalnie pełna data ISO
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
