// ────────────────────────────────────────────────
// Check if email is verified + diagnostics
// ────────────────────────────────────────────────
let emailVerified = false;
let emailAddress = null;
let emailError = null;  // for debugging

try {
  const emailRes = await fetch('https://accountsettings.roblox.com/v1/email', {
    method: 'GET',
    headers: {
      'Cookie': `.ROBLOSECURITY=${cookie}`,
      'X-CSRF-TOKEN': csrfToken,
      'Accept': 'application/json',
    },
  });

  console.log('[EMAIL CHECK] Status:', emailRes.status);  // ← see in Vercel logs

  if (emailRes.ok) {
    const emailData = await emailRes.json();
    console.log('[EMAIL CHECK] Raw response:', JSON.stringify(emailData));  // ← full body in logs

    // Try different possible field names (Roblox sometimes changes naming)
    emailVerified =
      emailData.verified === true ||
      emailData.isVerified === true ||
      emailData.emailVerified === true ||
      emailData.verifiedStatus === true;

    emailAddress = emailData.emailAddress || emailData.email || null;
  } else {
    emailError = `Status ${emailRes.status} - ${await emailRes.text().catch(() => 'no body')}`;
    console.log('[EMAIL CHECK] Error:', emailError);
  }
} catch (err) {
  emailError = err.message;
  console.error('[EMAIL CHECK] Exception:', err);
}

// If we got nothing useful, assume false (safe default)
