export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Dozwolone tylko POST" });
  }

  // Debug – usuń później!
  console.log("WEBHOOK istnieje?", !!process.env.WEBHOOK);
  console.log("Dostępne env z HOOK:", Object.keys(process.env).filter(k => k.includes("HOOK")));

  const webhookUrl = process.env.WEBHOOK;

  if (!webhookUrl) {
    return res.status(500).json({ 
      error: "Brak WEBHOOK", 
      debug: "Sprawdź logi funkcji – zmienna nie dotarła" 
    });
  }

  // reszta Twojego kodu fetch...
}
