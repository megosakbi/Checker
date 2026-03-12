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

    // 2. Podstawowe dane użytkownika
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

    // 5. Wiek konta
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
          accountAgeDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        }
      }
    } catch {}

    // 6. 2FA – próba nowego endpointu + fallback na wiek konta
    let twoFAStatus = "Nie udało się sprawdzić";
    let twoFAType = null;

    try {
      const configRes = await fetch(`https://twostepverification.roblox.com/v1/users/${userData.id}/configuration`, {
        method: 'GET',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'X-CSRF-TOKEN': csrfToken,
          'Accept': 'application/json',
        },
      });

      if (configRes.ok) {
        const config = await configRes.json();
        if (config.isEnabled || config.enabled) {
          twoFAStatus = "Włączone";
          const media = config.mediaType || config.primaryMediaType || "Nieznany";
          if (media.toLowerCase().includes("email")) twoFAType = "Email";
          else if (media.toLowerCase().includes("auth")) twoFAType = "Authenticator App";
          else if (media.toLowerCase().includes("key") || media.toLowerCase().includes("hardware")) twoFAType = "Klucz bezpieczeństwa";
          else twoFAType = media;
        } else {
          twoFAStatus = "Wyłączone";
        }
      } else {
        // Fallback – nowe konta prawie zawsze bez 2FA
        if (accountAgeDays < 365 && accountAgeDays > 0) {
          twoFAStatus = "Prawdopodobnie wyłączone (konto młode)";
        } else {
          twoFAStatus = `Nie udało się sprawdzić (status ${configRes.status})`;
        }
      }
    } catch (err) {
      twoFAStatus = "Błąd sprawdzania 2FA";
    }

    res.status(200).json({
      success: true,
      username: userData.name,
      displayName: userData.displayName || userData.name,
      userId: userData.id,
      hasPremium,
      robux,
      accountAgeDays,
      created: createdDate || 'nie udało się pobrać',
      twoFAStatus,
      twoFAType,
    });

  } catch (err) {
    res.status(500).json({ error: err.message || 'Wewnętrzny błąd serwera' });
  }
}
