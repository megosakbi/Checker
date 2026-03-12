// ... po let robux = ... (już masz)

// 5. Pending Robux – sumujemy z transakcji typu Sale (najczęstsze źródło pending)
let pendingRobux = 0;
try {
  let cursor = null;
  let page = 0;
  const maxPages = 3; // ograniczamy, żeby nie spamować API (rate limit ~100-200 req/min)

  do {
    const url = `https://economy.roblox.com/v1/users/${userData.id}/transactions?transactionType=Sale&limit=100` 
      + (cursor ? `&cursor=${cursor}` : '');

    const transRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json',
      },
    });

    if (!transRes.ok) break;

    const transData = await transRes.json();
    const transactions = transData.data || [];

    for (const tx of transactions) {
      if (tx.isPending && tx.currency && tx.currency.amount) {
        pendingRobux += tx.currency.amount; // zazwyczaj dodatnie dla Sale
      }
    }

    cursor = transData.nextPageCursor;
    page++;
  } while (cursor && page < maxPages);

} catch (e) {
  // cicho pomijamy – pendingRobux zostaje 0
  console.error('Błąd pending check:', e);
}

// W odpowiedzi json dodaj:
res.status(200).json({
  success: true,
  username: userData.name,
  displayName: userData.displayName || userData.name,
  userId: userData.id,
  hasPremium: hasPremium,
  robux: robux,
  pendingRobux: pendingRobux   // ← NOWOŚĆ
});
