// api/wyslij.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Dozwolone tylko POST" });
  }

  try {
    const { tekst } = req.body;

    if (!tekst || typeof tekst !== "string" || tekst.length < 1) {
      return res.status(400).json({ error: "Brak treści" });
    }

    if (tekst.length > 10000) {
      return res.status(400).json({ error: "Tekst za długi (max 10 000 znaków)" });
    }

    const webhookUrl = process.env.WEBHOOK;

    if (!webhookUrl) {
      console.error("Brak zmiennej WEBHOOK w Environment Variables");
      return res.status(500).json({ error: "Błąd konfiguracji serwera" });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: tekst,
        // możesz dodać więcej pól, np.:
        // timestamp: new Date().toISOString(),
        // source: "web-form",
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "(brak opisu błędu)");
      console.error("Błąd wysyłania do webhooka:", response.status, errorText);
      return res.status(502).json({ error: "Błąd po stronie docelowego webhooka" });
    }

    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("Błąd w /api/wyslij:", err);
    return res.status(500).json({ error: "Wewnętrzny błąd serwera" });
  }
}
