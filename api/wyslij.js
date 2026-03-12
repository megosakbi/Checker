export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { tekst } = body;

    if (!tekst || typeof tekst !== 'string') {
      return new Response(JSON.stringify({ error: 'Brak treści' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const webhookUrl = Deno.env.get('WEBHOOK');  // ← edge używa Deno.env zamiast process.env

    if (!webhookUrl) {
      console.log('Brak WEBHOOK w Deno.env');
      return new Response(JSON.stringify({ error: 'Brak konfiguracji webhooka' }), { status: 500 });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: tekst })
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Błąd wysyłania' }), { status: 502 });
    }

    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Wewnętrzny błąd' }), { status: 500 });
  }
}
