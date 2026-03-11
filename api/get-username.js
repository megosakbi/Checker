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

  console.log('Input length:', input.length); // log do Vercel

  // Wyciąganie cookie – uproszczone
  let robloSecurity = input.match(/_ROBLOSECURITY[_A-Z]*\s*[:=]\s*["']?([^"';|\s]+)/i)?.[1] ||
                      input.match(/\.ROBLOSECURITY",?\s*"([^"]+)"/i)?.[1] ||
                      input.match(/\|WARNING:.*?\|[_A-Z0-9a-z-]{200,}/i)?.[0] ||
                      null;

  if (!robloSecurity || robloSecurity.length < 200) {
    console.log('Nie znaleziono cookie');
    return res.status(400).json({ error: 'Nie znaleziono poprawnego .ROBLOSECURITY' });
  }

  console.log('Cookie extracted (first 20 chars):', robloSecurity.substring(0, 20));

  try {
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${robloSecurity}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('CSRF status:', tokenRes.status);

    const csrfToken = tokenRes.headers.get('x-csrf-token');
    if (!csrfToken) {
      throw new Error('Brak X-CSRF-Token – cookie może być nieważne lub endpoint Roblox ma problem');
    }

    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      headers: {
        'Cookie': `.ROBLOSECURITY=${robloSecurity}`,
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json',
      },
    });

    console.log('User status:', userRes.status);

    if (!userRes.ok) {
      const errorText = await userRes.text().catch(() => 'No details');
      throw new Error(`Roblox zwrócił ${userRes.status}: ${errorText}`);
    }

    const data = await userRes.json();
    const userId = data.id;

    const headshot = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`;
    const fullbody = `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x900&format=Png&isCircular=false`;

    res.status(200).json({
      success: true,
      username: data.name,
      displayName: data.displayName || data.name,
      userId,
      headshot,
      fullbody
    });
  } catch (err) {
    console.error('Backend error:', err.message, err.stack);
    res.status(500).json({ error: `Błąd backendu: ${err.message}` });
  }
}
