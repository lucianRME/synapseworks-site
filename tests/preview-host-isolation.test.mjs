import assert from 'node:assert/strict';
import test from 'node:test';
import preview from '../readonly-preview.js';

const host = 'feat-synapseworks-suite-refresh-synapseworks-site.lucianirimie.workers.dev';

test('dedicated preview rejects mutations on every route before touching any binding or network', async () => {
  const env = new Proxy({}, { get() { throw new Error('Unexpected preview binding access'); } });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Unexpected external request'); };
  try {
    for (const hostname of [host, 'unexpected.example']) {
      for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'PROPFIND']) {
        for (const path of ['/', '/suite.css', '/api/ios-interest', '/api/ios-interest-email', '/api/future-write']) {
          const response = await preview.fetch(new Request(`https://${hostname}${path}`, { method }), env, {});
          assert.equal(response.status, 403);
          assert.equal((await response.json()).code, 'PREVIEW_READ_ONLY');
          assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
          assert.equal(response.headers.get('Cache-Control'), 'no-store');
        }
      }
    }
  } finally { globalThis.fetch = originalFetch; }
});

test('preview count uses only a fixed public GET and never forwards user input or credentials', async () => {
  let calls = 0;
  const env = { PUBLIC_SITE_READ: { fetch: async (request) => {
    calls += 1;
    assert.equal(request.url, 'https://synapseworks.org/api/ios-interest');
    assert.equal(request.method, 'GET');
    assert.equal(request.redirect, 'manual');
    assert.deepEqual([...request.headers], []);
    assert.equal(request.body, null);
    return Response.json({ thresholdReached: false });
  } } };
  const response = await preview.fetch(new Request(`https://${host}/api/ios-interest/?untrusted=value`, {
    headers: { Authorization: 'fixture', Cookie: 'fixture', 'X-Turnstile-Token': 'fixture' }
  }), env, {});
  assert.equal(calls, 1);
  assert.deepEqual(await response.json(), { thresholdReached: false });
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
});

test('all preview reads and redirects receive noindex while preserving their responses', async () => {
  const env = { ASSETS: { fetch: async () => new Response('asset', {
    headers: { 'Content-Type': 'text/css', 'Cache-Control': 'max-age=300' }
  }) }, TURNSTILE_SITE_KEY: 'fixture-public-key' };
  const asset = await preview.fetch(new Request(`https://${host}/suite.css`), env, {});
  assert.equal(await asset.text(), 'asset');
  assert.equal(asset.headers.get('Content-Type'), 'text/css');
  assert.equal(asset.headers.get('Cache-Control'), 'max-age=300');
  assert.equal(asset.headers.get('X-Robots-Tag'), 'noindex');
  assert.equal(asset.headers.get('X-SynapseWorks-Preview'), 'pr-6-read-only');
  const redirect = await preview.fetch(new Request(`https://${host}/store?ref=fixture`), env, {});
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get('Location'), `https://${host}/products/?ref=fixture`);
  assert.equal(redirect.headers.get('X-Robots-Tag'), 'noindex');
  const config = await preview.fetch(new Request(`https://${host}/api/ios-interest-config`), env, {});
  assert.equal(config.status, 200);
  assert.equal(config.headers.get('X-Robots-Tag'), 'noindex');
  assert.deepEqual(await config.json(), { sitekey: 'fixture-public-key' });
});
