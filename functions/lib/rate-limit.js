const rateLimitJson = (body, status) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Retry-After': '60'
  }
});

export async function requireMutationRateLimit(env, key) {
  if (!env.IOS_INTEREST_RATE_LIMIT) return { response: null };

  try {
    const { success } = await env.IOS_INTEREST_RATE_LIMIT.limit({ key });
    if (!success) {
      return { response: rateLimitJson({ ok: false, error: 'Too many requests. Please try again in a minute.' }, 429) };
    }
  } catch (_) {
    // Fail open if the optional edge limiter is unavailable; Turnstile still protects the write.
  }

  return { response: null };
}
