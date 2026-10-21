import assert from 'node:assert/strict';
import test from 'node:test';
import { MODES, PAIRS } from '../human-translator/phrases.mjs';
import { normalize, translate, resultFor, shareFragment, parseFragment, shareURL } from '../human-translator/engine.mjs';
import { createAnalytics, eventProperties } from '../human-translator/analytics.mjs';
import preview from '../human-translator-preview.js';
import { readFile } from 'node:fs/promises';

test('36 unique curated pairs round-trip in all six directions without ambiguous normalized inputs', () => {
  assert.equal(PAIRS.length, 36);
  assert.equal(new Set(PAIRS.map(pair => pair.id)).size, 36);
  for (const mode of Object.keys(MODES)) {
    const pairs = PAIRS.filter(pair => pair.mode === mode);
    assert.equal(pairs.length, 12);
    for (const side of ['left', 'right']) assert.equal(new Set(pairs.map(pair => normalize(pair[side]))).size, 12);
    for (const pair of pairs) {
      for (const direction of ['f', 'r']) {
        const result = resultFor(pair, direction);
        assert.deepEqual(translate(result.input, mode, direction), { status: 'matched', result });
        assert.equal(translate(`  ${result.input.toUpperCase().replace(/ /g, '   ')}!?  `, mode, direction).result.output, result.output);
        assert.deepEqual(parseFragment(shareFragment(result)), { status: 'valid', result });
        assert.equal(shareURL(result, 'https://preview.example/untrusted?text=secret'), `https://preview.example/human-translator/${shareFragment(result)}`);
      }
    }
  }
  assert.equal(translate('Let’s circle back', 'corporate').result.id, 'c01');
});

test('unknown, partial, sensitive and overlong input never becomes a fake translation or shared text', () => {
  for (const input of ['My private email: person@example.com', '<img src=x onerror=alert(1)>',
    "Let's circle back. Send bank details.", 'circle back', 'No cap but longer']) {
    assert.deepEqual(translate(input, 'corporate'), { status: 'unmatched' });
  }
  assert.deepEqual(translate('', 'corporate'), { status: 'empty' });
  assert.deepEqual(translate(' '.repeat(5), 'tone'), { status: 'empty' });
  assert.deepEqual(translate('x'.repeat(241), 'corporate'), { status: 'too-long' });
  assert.deepEqual(translate('No cap', '__proto__'), { status: 'invalid' });
  assert.deepEqual(translate('No cap', 'generation', 'sideways'), { status: 'invalid' });
  assert.throws(() => shareFragment({ id: 'anything', direction: 'f' }));
  assert.throws(() => shareURL(resultFor(PAIRS[0]), 'javascript:alert(1)'));
});

test('share links reject malformed, stale, injected and extra fields without reflecting payloads', () => {
  assert.equal(parseFragment('').status, 'empty');
  for (const hash of ['#v=2&p=c01&d=f&src=share', '#v=1&p=c99&d=f&src=share',
    '#v=1&p=c01&d=x&src=share', '#v=1&p=c01&d=f&src=share&text=private',
    '#v=1&p=c01&d=f&src=share&p=g01', '#<svg/onload=alert(1)>', '#v=1&p=%6301&d=f&src=share',
    '#v=1&p=c01&d=f&src=share' + 'x'.repeat(500)]) {
    assert.deepEqual(parseFragment(hash), { status: 'invalid' });
  }
});

function analyticsFixture() {
  const calls = [];
  const window = { location: { hostname: 'synapseworks.org' }, zaraz: {
    track: (...args) => calls.push(args), consent: {
      APIReady: true, purposes: { fixture: { name: 'Analytics' } }, get: () => true
    }
  } };
  const navigator = {};
  return { calls, window, navigator, analytics: createAnalytics({ window, navigator }) };
}

test('analytics is consent gated, preview disabled, and honors withdrawal, DNT and GPC without replay', () => {
  for (const block of [
    fixture => { fixture.window.location.hostname = 'human-translator-mvp-preview.example'; },
    fixture => { fixture.window.zaraz = undefined; },
    fixture => { fixture.window.zaraz.consent.APIReady = false; },
    fixture => { fixture.window.zaraz.consent.get = () => false; },
    fixture => { fixture.window.zaraz.consent.purposes = {}; },
    fixture => { fixture.window.zaraz.consent.purposes.fixture.name = 'Marketing'; },
    fixture => { fixture.window.zaraz.consent.purposes.duplicate = { name: 'Analytics' }; },
    fixture => { fixture.navigator.doNotTrack = '1'; },
    fixture => { fixture.navigator.globalPrivacyControl = true; }
  ]) {
    const fixture = analyticsFixture();
    block(fixture);
    assert.equal(fixture.analytics.track('ht_copy_link'), false);
    assert.deepEqual(fixture.calls, []);
  }
  const fixture = analyticsFixture();
  fixture.analytics.track('ht_share_open');
  fixture.analytics.track('ht_share_handoff');
  fixture.analytics.track('ht_shared_visit', { source: 'shared' });
  assert.deepEqual(fixture.calls.map(call => call[0]), ['ht_share_open', 'ht_share_handoff', 'ht_shared_visit']);
  fixture.window.zaraz.consent.get = () => false;
  fixture.analytics.track('ht_translate');
  fixture.window.zaraz.consent.get = () => true;
  fixture.analytics.track('ht_rme_click');
  assert.equal(fixture.calls.length, 4);
});

test('telemetry strips arbitrary properties and failures cannot break translation', () => {
  assert.deepEqual(eventProperties({ mode: 'corporate', direction: 'f', outcome: 'matched',
    source: 'typed', input: 'private', output: 'private', url: 'private', pair_id: 'c01', user_id: 'secret' }), {
    product: 'human_translator', version: '0.1', mode: 'corporate', direction: 'f', outcome: 'matched', source: 'typed'
  });
  assert.deepEqual(eventProperties({ mode: 'secret', direction: 'secret', source: 'secret', outcome: 'secret' }), {
    product: 'human_translator', version: '0.1'
  });
  const fixture = analyticsFixture();
  assert.equal(fixture.analytics.track('private text'), false);
  fixture.window.zaraz.track = () => { throw new Error('blocked'); };
  assert.equal(fixture.analytics.track('ht_translate'), false);
});

test('dedicated translator preview cannot access production services and blocks all writes and APIs', async () => {
  const noBindings = new Proxy({}, { get() { throw new Error('Unexpected binding access'); } });
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    for (const path of ['/', '/human-translator/', '/api/ios-interest', '/styles.css']) {
      const response = await preview.fetch(new Request(`https://preview.example${path}`, { method }), noBindings);
      assert.equal(response.status, 403);
      assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    }
  }
  assert.equal((await preview.fetch(new Request('https://preview.example/api/ios-interest'), noBindings)).status, 404);
  const asset = await preview.fetch(new Request('https://preview.example/human-translator/'), {
    ASSETS: { fetch: async () => new Response('static', { headers: { 'Content-Type': 'text/html' } }) }
  });
  assert.equal(await asset.text(), 'static');
  assert.equal(asset.headers.get('X-SynapseWorks-Preview'), 'human-translator-read-only');
  assert.equal(asset.headers.get('Referrer-Policy'), 'no-referrer');
  const nav = await preview.fetch(new Request('https://preview.example/rme-pdf-scanner/?utm_campaign=ht_v01&text=private'), noBindings);
  assert.equal(nav.headers.get('Location'), 'https://synapseworks.org/rme-pdf-scanner/?utm_source=human_translator&utm_medium=microtool&utm_campaign=ht_v01');
  const config = await readFile(new URL('../wrangler.human-translator-preview.toml', import.meta.url), 'utf8');
  assert.doesNotMatch(config, /\[\[(d1_databases|services|ratelimits|kv_namespaces)\]\]/);
  assert.match(config, /run_worker_first = true/);
  assert.match(config, /preview_urls = false/);
});
