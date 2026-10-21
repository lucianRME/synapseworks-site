import assert from 'node:assert/strict';
import test from 'node:test';
import { MODES, PAIRS, ALIASES } from '../human-translator/phrases.mjs';
import { normalize, translate, resultFor, shareFragment, parseFragment, shareURL, inputsFor, MAX_INPUT } from '../human-translator/engine.mjs';
import { createAnalytics, eventProperties } from '../human-translator/analytics.mjs';
import preview from '../human-translator-preview.js';
import { readFile } from 'node:fs/promises';

test('everyday phrases and reviewed wording variations translate without guessing at extra context', () => {
  for (const [input, mode, output] of [
    ['fire away', 'corporate', 'Go ahead and ask.'],
    ['Fire away!', 'tone', 'Go ahead and ask.'],
    ['will get back to you', 'corporate', "I'll reply later."],
    ['I will get back to you', 'corporate', "I'll reply later."],
    ['I’ll get back to you.', 'tone', "I'll reply later."],
    ['circle back', 'corporate', "Let's talk about this later."],
    ['touch base', 'corporate', "Let's catch up briefly."],
    ['per my last email', 'corporate', 'I already sent this information.'],
    ['low key', 'generation', 'A little bit, honestly.'],
    ['ngl', 'generation', 'To be honest.'],
    ['please advise', 'tone', 'Tell me what to do next.']
  ]) {
    assert.equal(translate(input, mode).status, 'matched', `${mode}: ${input}`);
    assert.equal(translate(input, mode).result.output, output);
  }
  for (const [input, mode] of [
    ['Do not fire away.', 'corporate'], ['I will not get back to you', 'corporate'],
    ["I'll get back to you tomorrow", 'corporate'], ['fire away, will get back to you', 'corporate'],
    ['That is not a red flag.', 'generation'], ['no cap but longer', 'generation'],
    ['please advise me about my bank account', 'tone']
  ]) assert.deepEqual(translate(input, mode), { status: 'unmatched' });
});

test('120 unique curated pairs round-trip in all six directions without ambiguous normalized inputs', () => {
  assert.equal(PAIRS.length, 120);
  assert.equal(new Set(PAIRS.map(pair => pair.id)).size, PAIRS.length);
  for (const mode of Object.keys(MODES)) {
    const pairs = PAIRS.filter(pair => pair.mode === mode);
    assert.equal(pairs.length, 40);
    for (const side of ['left', 'right']) assert.equal(new Set(pairs.map(pair => normalize(pair[side]))).size, pairs.length);
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

test('reviewed alternatives are unambiguous whole phrases and share only permanent canonical results', () => {
  for (const id of Object.keys(ALIASES)) assert.ok(PAIRS.some(pair => pair.id === id), `Stale alias ID: ${id}`);
  let accepted = 0;
  for (const mode of Object.keys(MODES)) for (const direction of ['f', 'r']) {
    const seen = new Map();
    for (const pair of PAIRS.filter(pair => pair.mode === mode)) for (const input of inputsFor(pair, direction)) {
      assert.ok(input.length <= MAX_INPUT && input.trim(), `${pair.id}: invalid input`);
      const normalized = normalize(input);
      assert.ok(!seen.has(normalized), `${mode}/${direction}: duplicate input ${input}`);
      seen.set(normalized, pair.id);
      const response = translate(input, mode, direction);
      const canonical = resultFor(pair, direction);
      assert.deepEqual(response, { status: 'matched', result: canonical });
      assert.deepEqual(parseFragment(shareFragment(response.result)), { status: 'valid', result: canonical });
      assert.equal(translate(`  ${input.toUpperCase()}?!  `, mode, direction).result.id, pair.id);
    }
    accepted += seen.size;
  }
  assert.ok(accepted >= 500, `Expected broad reviewed coverage, found ${accepted} inputs`);
  assert.equal(shareFragment(translate('will get back to you', 'corporate').result), '#v=1&p=c13&d=f&src=share');
});

test('published counts describe the dictionary and old shared results retain their meaning', async () => {
  const html = await readFile(new URL('../human-translator/index.html', import.meta.url), 'utf8');
  const social = await readFile(new URL('../human-translator/social.svg', import.meta.url), 'utf8');
  assert.match(html, new RegExp(`${PAIRS.length} pairs \\+ variants`));
  assert.match(social, new RegExp(`${PAIRS.length} phrase pairs`));
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/)[1]);
  assert.ok(schema.description.startsWith(`${PAIRS.length} curated`));
  for (const [id, output] of [['c01', "Let's talk about this later."], ['g01', 'For real.'], ['p01', 'Please remember this.']]) {
    assert.equal(parseFragment(`#v=1&p=${id}&d=f&src=share`).result.output, output);
  }
});

test('unknown, partial, sensitive and overlong input never becomes a fake translation or shared text', () => {
  for (const input of ['My private email: person@example.com', '<img src=x onerror=alert(1)>',
    "Let's circle back. Send bank details.", 'circle back tomorrow', 'No cap but longer']) {
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

test('live Zaraz localized purpose names require the same explicit consent and fail closed on ambiguity', () => {
  const fixture = analyticsFixture();
  fixture.window.zaraz.consent.purposes = { fixture: {
    name: { en: 'Analytics' }, description: { en: 'We use analytics to understand site usage' }, order: 0
  } };
  assert.equal(fixture.analytics.track('ht_visit'), true);
  fixture.window.zaraz.consent.get = () => false;
  assert.equal(fixture.analytics.track('ht_translate'), false);
  fixture.window.zaraz.consent.get = () => true;
  fixture.window.zaraz.consent.purposes.duplicate = { name: 'Analytics' };
  assert.equal(fixture.analytics.track('ht_copy_link'), false);
  delete fixture.window.zaraz.consent.purposes.duplicate;
  fixture.window.zaraz.consent.purposes.fixture.name = { en: 'Marketing' };
  assert.equal(fixture.analytics.track('ht_visit'), false);
  assert.deepEqual(fixture.calls.map(call => call[0]), ['ht_visit']);
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
