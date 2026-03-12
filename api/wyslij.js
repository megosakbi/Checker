// api/wyslij.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const body = await req.json();
  const tekst = body.tekst;

  if (!tekst) {
    return new Response(JSON.stringify({ error: 'Brak treści' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const webhook = Deno.env.get('WEBHOOK');   // ← w Edge działa Deno.env zamiast process.env !

  if (!webhook) {
    return new Response(JSON.stringify({ error: 'Brak WEBHOOK' }), { status: 500 });
  }

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: tekst })
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'Błąd webhooka' }), { status: res.status });
  }

  return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
}
