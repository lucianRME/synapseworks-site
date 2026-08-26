const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const turnstileJson = (body, status) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

export async function requireTurnstile(request, env) {
  const token = request.headers.get('X-Turnstile-Token')?.trim();

  if (!token) {
    return { response: turnstileJson({ ok: false, error: 'Complete the security verification before continuing.' }, 400) };
  }

  if (!env.TURNSTILE_SECRET_KEY) {
    return { response: turnstileJson({ ok: false, error: 'Security verification is not configured.' }, 503) };
  }

  const formData = new FormData();
  formData.append('secret', env.TURNSTILE_SECRET_KEY);
  formData.append('response', token);

  let verification;
  try {
    verification = await fetch(SITEVERIFY_URL, { method: 'POST', body: formData });
  } catch (_) {
    return { response: turnstileJson({ ok: false, error: 'Security verification is temporarily unavailable. Please try again.' }, 502) };
  }

  if (!verification.ok) {
    return { response: turnstileJson({ ok: false, error: 'Security verification is temporarily unavailable. Please try again.' }, 502) };
  }

  let result;
  try {
    result = await verification.json();
  } catch (_) {
    return { response: turnstileJson({ ok: false, error: 'Security verification is temporarily unavailable. Please try again.' }, 502) };
  }

  if (!result.success) {
    return { response: turnstileJson({ ok: false, error: 'Security verification failed. Please try again.' }, 403) };
  }

  return { response: null };
}
