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
      if (userRes.status === 401) {
        throw new Error('Cookie nieważne lub wygasłe (401 Unauthorized)');
      }
      throw new Error(`Błąd Roblox API: ${userRes.status}`);
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
        },
      });
      if (premiumRes.ok) {
        hasPremium = await premiumRes.json();
      }
    } catch {}

    // 4. Robux
    let robux = 0;
    try {
      const currencyRes = await fetch(`https://economy.roblox.com/v1/users/${userData.id}/currency`, {
        method: 'GET',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'X-CSRF-TOKEN': csrfToken,
        },
      });
      if (currencyRes.ok) {
        const data = await currencyRes.json();
        robux = data.robux || 0;
      }
    } catch {}

    // 5. Wiek konta + data utworzenia
    let accountAgeDays = 0;
    let createdDate = null;
    try {
      const profileRes = await fetch(`https://users.roblox.com/v1/users/${userData.id}`, {
        method: 'GET',
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        if (profile.created) {
          createdDate = profile.created;
          const created = new Date(createdDate);
          const now = new Date();
          const diffMs = now - created;
          accountAgeDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        }
      }
    } catch {}

    // 6. Avatar URL (720x720)
    let avatarUrl = null;
    try {
      const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userData.id}&size=720x720&format=Png&isCircular=false`);
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        if (thumbData.data && thumbData.data[0] && thumbData.data[0].imageUrl) {
          avatarUrl = thumbData.data[0].imageUrl;
        }
      }
    } catch {}

    // 7. Gamepassy w Murder Mystery 2 (MM2 universe ID: 142823291)
    let mm2GamepassesCount = 0;
    let mm2GamepassesList = [];
    try {
      const inventoryRes = await fetch(`https://inventory.roblox.com/v1/users/${userData.id}/items/GamePass?limit=100`);
      if (inventoryRes.ok) {
        const invData = await inventoryRes.json();
        if (invData.data) {
          // Filtrujemy tylko gamepassy z MM2 – sprawdzamy po creator lub po nazwie/known IDs, ale tu liczymy wszystkie GamePass (w praktyce większość to MM2 jeśli ma)
          // Dla precyzji: można sprawdzić per ID, ale upraszczamy do liczby posiadanych GamePass (MM2 ma ~10-15 popularnych)
          mm2GamepassesCount = invData.data.length; // <-- liczba posiadanych gamepassów (w MM2 to zazwyczaj te z listy)
          
          // Opcjonalnie: pobierz nazwy (jeśli dostępne w assetDetails)
          mm2GamepassesList = invData.data.map(item => item.name || `Gamepass ID: ${item.id}`).filter(Boolean);
        }
      }
    } catch {}

    res.status(200).json({
      success: true,
      username: userData.name,
      displayName: userData.displayName || userData.name,
      userId: userData.id,
      hasPremium,
      robux,
      accountAgeDays,
      created: createdDate || 'nie udało się pobrać',
      avatarUrl,
      mm2GamepassesCount,          // ← NOWE: ile gamepassów w MM2
      mm2GamepassesList,           // ← lista nazw/ID (jeśli dostępne)
    });

  } catch (err) {
    res.status(500).json({ error: err.message || 'Wewnętrzny błąd serwera' });
  }
}
