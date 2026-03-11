export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Tylko POST' });

  let { cookie: input } = req.body || {};
  if (!input || typeof input !== 'string' || input.length < 50) {
    return res.status(400).json({ error: 'Brak lub za krótki tekst' });
  }

  // 1. Wyciągamy .ROBLOSECURITY z całego bloku tekstu (PowerShell, JSON, cokolwiek)
  let robloSecurity = null;

  // Szukamy klasycznego formatu
  const matchDirect = input.match(/\.ROBLOSECURITY"?\s*[:=]\s*["']?([^"';|\s]+)/i);
  if (matchDirect) robloSecurity = matchDirect[1];

  // Szukamy w New-Object System.Net.Cookie
  if (!robloSecurity) {
    const matchCookie = input.match(/\.ROBLOSECURITY",?\s*"([^"]+)"/i);
    if (matchCookie) robloSecurity = matchCookie[1];
  }

  // Ostatnia deska – dowolny długi ciąg z |WARNING na początku
  if (!robloSecurity) {
    const longTokenMatch = input.match(/\|WARNING:.*?\|\s*([^"\s|]{200,})/i);
    if (longTokenMatch) robloSecurity = longTokenMatch[1];
  }

  if (!robloSecurity || robloSecurity.length < 200) {
    return res.status(400).json({ error: 'Nie znaleziono poprawnego .ROBLOSECURITY w tekście' });
  }

  try {
    // Krok A: CSRF Token
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${robloSecurity}`,
        'Content-Type': 'application/json',
      },
    });

    const csrfToken = tokenRes.headers.get('x-csrf-token');
    if (!csrfToken) throw new Error('Nie udało się pobrać CSRF (cookie prawdopodobnie nieważne)');

    // Krok B: Dane użytkownika
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      headers: {
        'Cookie': `.ROBLOSECURITY=${robloSecurity}`,
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json',
      },
    });

    if (!userRes.ok) {
      if (userRes.status === 401) throw new Error('Cookie nieważne lub wygasłe (401)');
      throw new Error(`Błąd Roblox: ${userRes.status}`);
    }

    const data = await userRes.json();
    const userId = data.id;

    // Krok C: Linki do avatara (publiczne, nie wymagają cookie!)
    const headshotUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`;
    const fullbodyUrl = `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x900&format=Png&isCircular=false`;

    // Zwracamy gotowe linki – frontend zrobi <img src={...}>
    res.status(200).json({
      success: true,
      username: data.name,
      displayName: data.displayName || data.name,
      userId: userId,
      headshot: headshotUrl,
      fullbody: fullbodyUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Coś poszło nie tak' });
  }
}
