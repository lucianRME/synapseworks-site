import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../worker.js';

const previewHosts = [
  'feat-synapseworks-suite-refresh-synapseworks-site.lucianirimie.workers.dev',
  'dea7f7f5-synapseworks-site.lucianirimie.workers.dev',
  'review-42-synapseworks-site.lucianirimie.workers.dev'
];
const productionHosts = [
  'synapseworks.org',
  'www.synapseworks.org',
  'synapseworks-site.lucianirimie.workers.dev'
];
const mutationPaths = ['/api/ios-interest', '/api/ios-interest-email'];
const incoming = (host, path, method = 'GET', token = 'fixture-token') => new Request(`https://${host}${path}`, {
  method,
  headers: {
    ...(token ? { 'X-Turnstile-Token': token } : {}),
    'Content-Type': 'application/json',
    Origin: 'https://synapseworks.org',
    Referer: 'https://synapseworks.org/rme-pdf-scanner/'
  },
  body: ['GET', 'HEAD'].includes(method) ? undefined : JSON.stringify({ email: 'fixture@example.com' })
});

const makeEnv = ({ limited = false } = {}) => {
  const effects = { databaseCalls: 0, writes: 0, limiterCalls: 0 };
  return {
    effects,
    env: {
      IOS_INTEREST_DB: {
        prepare() {
          effects.databaseCalls += 1;
          return {
            first: async () => ({ count: 0 }),
            bind: () => ({ run: async () => { effects.writes += 1; return { success: true }; } })
          };
        }
      },
      IOS_INTEREST_RATE_LIMIT: {
        limit: async () => { effects.limiterCalls += 1; return { success: !limited }; }
      },
      TURNSTILE_SECRET_KEY: 'fixture-secret',
      TURNSTILE_SITE_KEY: 'fixture-sitekey',
      ASSETS: { fetch: async () => new Response('fixture asset') }
    }
  };
};

const withSiteverify = async (success, run) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url) => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    calls += 1;
    return new Response(JSON.stringify({ success }), { headers: { 'Content-Type': 'application/json' } });
  };
  try { await run(() => calls); } finally { globalThis.fetch = originalFetch; }
};

test('preview mutations stop before any environment binding or external request', async () => {
  const forbiddenEnv = new Proxy({}, {
    get(_target, name) { throw new Error(`Preview touched binding ${String(name)}`); }
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Preview made an external request'); };
  try {
    for (const host of previewHosts) {
      for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'PROPFIND']) {
        for (const path of [...mutationPaths, '/api/ios-interest/', '/api/ios-interest-config', '/api/future-write']) {
          const response = await worker.fetch(incoming(host, path, method), forbiddenEnv, {});
          assert.equal(response.status, 403, `${host} ${method} ${path}`);
          assert.deepEqual(await response.json(), {
            ok: false,
            code: 'PREVIEW_READ_ONLY',
            error: 'Write operations are disabled on preview deployments.'
          });
          assert.equal(response.headers.get('Cache-Control'), 'no-store');
          assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
        }
      }
    }
  } finally { globalThis.fetch = originalFetch; }
});

test('production domains and the primary workers.dev host retain valid writes using simulated D1', async () => {
  await withSiteverify(true, async (calls) => {
    for (const host of productionHosts) {
      const { env, effects } = makeEnv();
      const before = calls();
      for (const path of mutationPaths) {
        const response = await worker.fetch(incoming(host, path, 'POST'), env, {});
        assert.equal(response.status, 200, `${host} ${path}`);
        assert.deepEqual(await response.json(), { ok: true });
      }
      assert.equal(effects.writes, 2);
      assert.equal(effects.limiterCalls, 2);
      assert.equal(calls() - before, 2);
    }
  });
});

test('production Turnstile and rate-limit failures still reject writes', async () => {
  for (const path of mutationPaths) {
    for (const scenario of [
      { token: '', success: true, limited: false, status: 400 },
      { token: 'invalid-fixture-token', success: false, limited: false, status: 403 },
      { token: 'limited-fixture-token', success: true, limited: true, status: 429 }
    ]) {
      await withSiteverify(scenario.success, async () => {
        const { env, effects } = makeEnv(scenario);
        const response = await worker.fetch(incoming('synapseworks.org', path, 'POST', scenario.token), env, {});
        assert.equal(response.status, scenario.status);
        assert.notEqual((await response.json()).code, 'PREVIEW_READ_ONLY');
        assert.equal(effects.writes, 0);
      });
    }
  }
});

test('preview read methods keep the existing API, asset, and redirect behavior', async () => {
  for (const host of previewHosts) {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      for (const path of ['/api/ios-interest', '/api/ios-interest-config', '/api/ios-interest-email', '/suite.css']) {
        const preview = makeEnv();
        const production = makeEnv();
        const previewResponse = await worker.fetch(incoming(host, path, method), preview.env, {});
        const productionResponse = await worker.fetch(incoming('synapseworks.org', path, method), production.env, {});
        assert.equal(previewResponse.status, productionResponse.status, `${host} ${method} ${path}`);
        assert.equal(await previewResponse.text(), await productionResponse.text());
        assert.equal(preview.effects.writes, 0);
        assert.equal(preview.effects.limiterCalls, 0);
      }
    }
    const response = await worker.fetch(incoming(host, '/pageharbor/?ref=fixture'), {}, {});
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('Location'), `https://${host}/rme-pdf-scanner/?ref=fixture`);
  }
});
