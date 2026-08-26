const json = (body) => new Response(JSON.stringify(body), {
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

export async function onRequest({ request, env }) {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  return json({ sitekey: env.TURNSTILE_SITE_KEY || '' });
}
