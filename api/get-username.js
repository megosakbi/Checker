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
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'Content-Type': 'application/json' },
    });
    const csrfToken = tokenRes.headers.get('x-csrf-token');
    if (!csrfToken) throw new Error('Nie udało się pobrać X-CSRF-Token');

    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      method: 'GET',
      headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json' },
    });
    if (!userRes.ok) throw new Error(userRes.status === 401 ? 'Cookie nieważne' : `Błąd Roblox: ${userRes.status}`);
    const userData = await userRes.json();

    // Premium
    let hasPremium = false;
    try {
      const p = await fetch(`https://premiumfeatures.roblox.com/v1/users/${userData.id}/validate-membership`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken }
      });
      if (p.ok) hasPremium = await p.json();
    } catch {}

    // Robux
    let robux = 0;
    try {
      const r = await fetch(`https://economy.roblox.com/v1/users/${userData.id}/currency`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken }
      });
      if (r.ok) {
        const d = await r.json();
        robux = d.robux || 0;
      }
    } catch {}

    // Wiek konta
    let accountAgeDays = 0;
    let createdDate = null;
    try {
      const profileRes = await fetch(`https://users.roblox.com/v1/users/${userData.id}`);
      if (profileRes.ok) {
        const profile = await profileRes.json();
        if (profile.created) {
          createdDate = profile.created;
          accountAgeDays = Math.floor((new Date() - new Date(createdDate)) / (1000 * 60 * 60 * 24));
        }
      }
    } catch {}

    // Avatar
    let avatarUrl = null;
    try {
      const t = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userData.id}&size=720x720&format=Png&isCircular=false`);
      if (t.ok) {
        const td = await t.json();
        avatarUrl = td.data?.[0]?.imageUrl || null;
      }
    } catch {}

    // Sprawdzenie dokładnie Radio i Elite MM2
    let mm2GamepassesCount = 0;
    const mm2Ids = [1308795, 429957]; // Radio + Elite

    for (const id of mm2Ids) {
      try {
        const ownRes = await fetch(`https://inventory.roblox.com/v1/users/${userData.id}/items/GamePass/${id}`, {
          headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json' }
        });
        if (ownRes.ok && ownRes.status === 200) {
          mm2GamepassesCount++;
        }
      } catch (err) {
        // pomijamy błędy per ID
      }
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
      avatarUrl,
      mm2GamepassesCount
    });

  } catch (err) {
    res.status(500).json({ error: err.message || 'Wewnętrzny błąd' });
  }
}
