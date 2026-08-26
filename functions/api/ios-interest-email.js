import { requireTurnstile } from '../lib/turnstile.js';
import { requireMutationRateLimit } from '../lib/rate-limit.js';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed.' }, 405);
  }

  const rateLimit = await requireMutationRateLimit(context.env, 'ios-interest-email');
  if (rateLimit.response) return rateLimit.response;

  const turnstile = await requireTurnstile(context.request, context.env);
  if (turnstile.response) return turnstile.response;

  let email;
  try {
    const payload = await context.request.json();
    email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  } catch (_) {
    return json({ ok: false, error: 'Enter a valid email address.' }, 400);
  }

  if (!isValidEmail(email)) {
    return json({ ok: false, error: 'Enter a valid email address.' }, 400);
  }

  const db = context.env.IOS_INTEREST_DB;
  if (!db) return json({ ok: false, error: 'Service unavailable.' }, 503);

  try {
    await db.prepare('INSERT OR IGNORE INTO ios_interest_email (email, created_at) VALUES (?, ?)')
      .bind(email, new Date().toISOString())
      .run();
    return json({ ok: true });
  } catch (_) {
    return json({ ok: false, error: 'Service unavailable.' }, 503);
  }
}
