import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const importFunction = async (path) => {
  let source = await readFile(path, 'utf8');
  if (source.includes("../lib/turnstile.js")) {
    const helper = await readFile('functions/lib/turnstile.js', 'utf8');
    source = `${helper.replace('export async function requireTurnstile', 'async function requireTurnstile')}\n${source.replace(/import .*turnstile.*;\n/, '')}`;
  }
  if (source.includes("../lib/rate-limit.js")) {
    const helper = await readFile('functions/lib/rate-limit.js', 'utf8');
    source = `${helper.replace('export async function requireMutationRateLimit', 'async function requireMutationRateLimit')}\n${source.replace(/import .*rate-limit.*;\n/, '')}`;
  }
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
};

class FakeD1 {
  interests = 0;
  emails = new Set();
  writes = 0;

  prepare(sql) {
    return {
      first: async () => ({ count: this.interests }),
      bind: (...values) => ({
        first: async () => ({ count: this.interests }),
        run: async () => {
          if (sql.includes('INSERT INTO ios_interest ')) this.interests += 1;
          if (sql.includes('INSERT OR IGNORE INTO ios_interest_email')) this.emails.add(values[0]);
          if (sql.startsWith('INSERT')) this.writes += 1;
          return { success: true };
        }
      })
    };
  }
}

const request = (url, method, body, token) => new Request(url, {
  method,
  headers: {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'X-Turnstile-Token': token } : {})
  },
  body: body ? JSON.stringify(body) : undefined
});

const db = new FakeD1();
const { onRequest: interest } = await importFunction('functions/api/ios-interest.js');
const { onRequest: email } = await importFunction('functions/api/ios-interest-email.js');
const context = (incomingRequest, env = {}) => ({
  request: incomingRequest,
  env: {
    IOS_INTEREST_DB: db,
    TURNSTILE_SECRET_KEY: 'test-secret',
    IOS_INTEREST_RATE_LIMIT: { limit: async () => ({ success: true }) },
    ...env
  }
});

const originalFetch = globalThis.fetch;
let siteverifyCalls = 0;
const siteverify = (result, status = 200) => {
  globalThis.fetch = async (url) => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    siteverifyCalls += 1;
    return new Response(JSON.stringify(result), { status, headers: { 'Content-Type': 'application/json' } });
  };
};

let response = await interest(context(request('https://example.test/api/ios-interest', 'GET')));
assert.deepEqual(await response.json(), { thresholdReached: false });
assert.equal(siteverifyCalls, 0, 'GET must remain public');

const writesBeforeMissing = db.writes;
response = await interest(context(request('https://example.test/api/ios-interest', 'POST')));
assert.equal(response.status, 400);
assert.equal(db.writes, writesBeforeMissing, 'missing token must not write to D1');

const writesBeforeLimit = db.writes;
response = await interest(context(
  request('https://example.test/api/ios-interest', 'POST', undefined, 'limited-token'),
  { IOS_INTEREST_RATE_LIMIT: { limit: async () => ({ success: false }) } }
));
assert.equal(response.status, 429);
assert.equal(db.writes, writesBeforeLimit, 'rate-limited request must not write to D1');

siteverify({ success: false, 'error-codes': ['invalid-input-response'] });
const writesBeforeInvalid = db.writes;
response = await interest(context(request('https://example.test/api/ios-interest', 'POST', undefined, 'invalid-token')));
assert.equal(response.status, 403);
assert.equal(db.writes, writesBeforeInvalid, 'invalid token must not write to D1');

globalThis.fetch = async () => { throw new Error('network unavailable'); };
const writesBeforeFailure = db.writes;
response = await interest(context(request('https://example.test/api/ios-interest', 'POST', undefined, 'network-failure-token')));
assert.equal(response.status, 502);
assert.equal(db.writes, writesBeforeFailure, 'Siteverify failure must not write to D1');

siteverify({ success: true });
response = await interest(context(request('https://example.test/api/ios-interest', 'POST', undefined, 'valid-interest-token')));
assert.equal(response.status, 200);
assert.deepEqual(await response.json(), { ok: true });
assert.equal(db.interests, 1);

siteverify({ success: true });
const emailWritesBeforeInvalidEmail = db.writes;
response = await email(context(request('https://example.test/api/ios-interest-email', 'POST', { email: 'not-an-email' }, 'valid-invalid-email-token')));
assert.equal(response.status, 400);
assert.equal(db.writes, emailWritesBeforeInvalidEmail, 'invalid email must not write to D1');

siteverify({ success: true });
response = await email(context(request('https://example.test/api/ios-interest-email', 'POST', { email: ' Person@Example.com ' }, 'valid-email-token')));
assert.equal(response.status, 200);
assert.deepEqual(await response.json(), { ok: true });
assert.deepEqual([...db.emails], ['person@example.com']);

siteverify({ success: true });
response = await email(context(request('https://example.test/api/ios-interest-email', 'POST', { email: 'person@example.com' }, 'duplicate-email-token')));
assert.equal(response.status, 200);
assert.deepEqual(await response.json(), { ok: true });
assert.equal(db.emails.size, 1, 'duplicate emails must have generic success behavior');

db.interests = 1000;
response = await interest(context(request('https://example.test/api/ios-interest', 'GET')));
assert.deepEqual(await response.json(), { thresholdReached: true, displayCount: '1000+' });

const pageSource = await readFile('pageharbor/index.html', 'utf8');
assert.match(pageSource, /https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/);
assert.match(pageSource, /appearance: 'interaction-only'/);
assert.match(pageSource, /X-Turnstile-Token/);
assert.match(pageSource, /pageharbor-ios-interest-recorded/);
assert.match(pageSource, /resetTurnstile\(\)/);

class ClientElement {
  constructor() {
    this.hidden = true;
    this.disabled = false;
    this.textContent = '';
    this.value = '';
    this.validity = { valid: true };
    this.listeners = {};
    this.classList = { toggle: () => {} };
  }

  addEventListener(type, handler) { this.listeners[type] = handler; }
  querySelector() { return this.submitButton; }
  focus() {}
}

const runClient = async (storage, interestPostOk = true) => {
  const elements = Object.fromEntries([
    'ios-interest-button',
    'ios-interest-status',
    'ios-interest-count',
    'ios-interest-email-follow-up',
    'ios-interest-email-form',
    'ios-interest-email',
    'ios-interest-email-status',
    'ios-interest-turnstile'
  ].map((id) => [id, new ClientElement()]));
  elements['ios-interest-email-form'].submitButton = new ClientElement();
  const script = pageSource.match(/<script>\s*([\s\S]*?)\s*<\/script>/)[1];
  let turnstileOptions;
  const storageWrites = [];
  const turnstile = {
    render: (_container, options) => {
      turnstileOptions = options;
      options.callback('browser-token');
      return 'widget-id';
    },
    reset: () => {}
  };
  const clientWindow = {
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => {
        storageWrites.push([key, value]);
        storage.set(key, value);
      }
    },
    turnstile,
    location: { origin: 'https://synapseworks-site.lucianirimie.workers.dev', search: '' }
  };
  vm.runInNewContext(script, {
    document: { getElementById: (id) => elements[id] },
    window: clientWindow,
    fetch: async (url, options = {}) => {
      if (url === '/api/ios-interest-config') return { ok: true, json: async () => ({ sitekey: 'public-test-sitekey' }) };
      if (url === '/api/ios-interest' && options.method === 'POST') return { ok: interestPostOk };
      return { ok: true, json: async () => ({ thresholdReached: false }) };
    },
    setTimeout,
    URLSearchParams,
    Promise,
    Error,
    JSON
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  return { elements, storageWrites, turnstileOptions };
};

const clientStorage = new Map();
let client = await runClient(clientStorage);
assert.equal(client.elements['ios-interest-button'].disabled, false, 'no marker leaves registration available');
await client.elements['ios-interest-button'].listeners.click();
assert.equal(clientStorage.get('pageharbor-ios-interest-recorded'), 'true', 'successful registration writes the marker');
assert.deepEqual(client.storageWrites, [['pageharbor-ios-interest-recorded', 'true']], 'success uses the exact production localStorage key');

client = await runClient(clientStorage);
assert.equal(client.elements['ios-interest-button'].disabled, true, 'refresh with marker keeps registration disabled');
assert.equal(client.elements['ios-interest-status'].textContent, 'Your interest has already been recorded in this browser.');
client.turnstileOptions.callback('later-turnstile-token');
assert.equal(client.elements['ios-interest-button'].disabled, true, 'later Turnstile callbacks cannot re-enable a recorded interest');

const failedClientStorage = new Map();
client = await runClient(failedClientStorage, false);
await client.elements['ios-interest-button'].listeners.click();
assert.equal(failedClientStorage.has('pageharbor-ios-interest-recorded'), false, 'failed registration does not write the marker');
assert.equal(client.storageWrites.length, 0, 'failed registration does not call localStorage.setItem');

const handlerSource = `${await readFile('functions/api/ios-interest.js', 'utf8')}\n${await readFile('functions/api/ios-interest-email.js', 'utf8')}\n${await readFile('functions/lib/turnstile.js', 'utf8')}\n${await readFile('functions/lib/rate-limit.js', 'utf8')}`;
assert.match(handlerSource, /TURNSTILE_SECRET_KEY/);
assert.match(handlerSource, /turnstile\/v0\/siteverify/);
assert.match(handlerSource, /IOS_INTEREST_RATE_LIMIT/);
assert.doesNotMatch(handlerSource, /cf-connecting-ip|user-agent|fingerprint/i);

const workerSource = await readFile('worker.js', 'utf8');
assert.match(workerSource, /'\/api\/ios-interest': iosInterest/);
assert.match(workerSource, /'\/api\/ios-interest-email': iosInterestEmail/);
assert.match(workerSource, /'\/api\/ios-interest-config': iosInterestConfig/);
assert.match(workerSource, /env\.ASSETS\.fetch\(request\)/);

const schemaSource = await readFile('migrations/0001_ios_interest.sql', 'utf8');
assert.doesNotMatch(schemaSource, /\b(ip|user_agent|fingerprint|document)\b/i);
globalThis.fetch = originalFetch;
console.log('ios-interest Turnstile, privacy, and client-side checks passed');
