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
    // Krok 1 – pobierz X-CSRF-Token
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

    // Krok 2 – pobierz dane użytkownika
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
      throw new Error(`Błąd Roblox: ${userRes.status} – ${await userRes.text()}`);
    }

    const userData = await userRes.json();
    const userId = userData.id;

    // Krok 3 – sprawdź czy ma Premium
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

      if (premiumRes.ok) {
        const premiumData = await premiumRes.json();
        hasPremium = !!premiumData; // true / false
      }
      // Jeśli nie ok → zostawiamy false (najczęściej 403/401 przy złym tokenie)
    } catch (premiumErr) {
      // cichy fail – premium nie jest krytyczne
      console.error('Premium check error:', premiumErr);
    }

    res.status(200).json({
      success: true,
      username: userData.name,
      displayName: userData.displayName || userData.name,
      userId: userData.id,
      hasPremium: hasPremium
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
