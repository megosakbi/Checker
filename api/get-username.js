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
    // ... (wszystko do userData zostaje bez zmian – cookie potrzebne tylko do autoryzacji użytkownika)

    // Avatar, Premium, Robux, wiek – bez zmian

    // PUBLICZNY check gamepassów MM2 – bez cookie, po userId i gamepassId
    let mm2GamepassesCount = 0;
    const mm2GamepassIds = [1308795, 429957]; // Radio i Elite – poprawne ID

    for (const gpId of mm2GamepassIds) {
      try {
        // Publiczny endpoint ownership (Roblox pozwala na check bez autoryzacji dla gamepassów)
        const ownRes = await fetch(`https://economy.roblox.com/v1/users/${userData.id}/game-pass-ownership?gamePassId=${gpId}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (ownRes.ok) {
          const data = await ownRes.json();
          if (data.owned === true) {
            mm2GamepassesCount++;
          }
        }
      } catch (err) {
        // fallback jeśli endpoint nie działa
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
    res.status(500).json({ error: err.message || 'Wewnętrzny błąd serwera' });
  }
}
