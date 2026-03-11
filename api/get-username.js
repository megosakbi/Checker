    // Krok 4 – Robux
    let robux = 0;
    try {
      console.log(`Próba pobrania Robux dla userId: ${userId}`);
      const currencyRes = await fetch(`https://economy.roblox.com/v1/users/${userId}/currency`, {
        method: 'GET',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'X-CSRF-TOKEN': csrfToken,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
      });

      console.log('Robux response status:', currencyRes.status);

      if (currencyRes.ok) {
        const data = await currencyRes.json();
        robux = Number(data.robux) || 0;
        console.log('Pobrano Robux:', robux);
      } else {
        const errorText = await currencyRes.text();
        console.error('Błąd Robux endpoint:', currencyRes.status, errorText);
      }
    } catch (currencyErr) {
      console.error('Wyjątek przy Robux:', currencyErr.message);
    }

    // Odpowiedź – zawsze wysyłamy robux (nawet 0)
    res.status(200).json({
      success: true,
      username: userData.name || 'Nieznane',
      displayName: userData.displayName || userData.name || 'Nieznane',
      userId: userData.id || 0,
      hasPremium: hasPremium,
      robux: robux  // gwarantowane pole
    });
