import { requireTurnstile } from '../lib/turnstile.js';
import { requireMutationRateLimit } from '../lib/rate-limit.js';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

const displayCount = (count) => `${Math.floor(count / 100) * 100}+`;

export async function onRequest(context) {
  if (context.request.method === 'POST') {
    const rateLimit = await requireMutationRateLimit(context.env, 'ios-interest');
    if (rateLimit.response) return rateLimit.response;

    const turnstile = await requireTurnstile(context.request, context.env);
    if (turnstile.response) return turnstile.response;

    const db = context.env.IOS_INTEREST_DB;
    if (!db) return json({ ok: false, error: 'Service unavailable.' }, 503);

    try {
      await db.prepare('INSERT INTO ios_interest (created_at) VALUES (?)').bind(new Date().toISOString()).run();
      return json({ ok: true });
    } catch (_) {
      return json({ ok: false, error: 'Service unavailable.' }, 503);
    }
  }

  if (context.request.method === 'GET') {
    const db = context.env.IOS_INTEREST_DB;
    if (!db) return json({ ok: false, error: 'Service unavailable.' }, 503);

    try {
      const row = await db.prepare('SELECT COUNT(*) AS count FROM ios_interest').first();
      const count = Number(row?.count || 0);
      return count >= 1000
        ? json({ thresholdReached: true, displayCount: displayCount(count) })
        : json({ thresholdReached: false });
    } catch (_) {
      return json({ ok: false, error: 'Service unavailable.' }, 503);
    }
  }

  return json({ ok: false, error: 'Method not allowed.' }, 405);
}
