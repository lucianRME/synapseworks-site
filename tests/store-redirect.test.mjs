import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = (await readFile('worker.js', 'utf8'))
  .replace(/^import .*;\n/gm, '')
  .replace('export default', 'globalThis.worker =');
const context = {
  URL,
  Response,
  iosInterest: () => { throw new Error('API handler should not run for redirects.'); },
  iosInterestConfig: () => { throw new Error('API handler should not run for redirects.'); },
  iosInterestEmail: () => { throw new Error('API handler should not run for redirects.'); }
};
vm.runInNewContext(source, context);

const responseFor = (url) => context.worker.fetch(
  new Request(url),
  { ASSETS: { fetch: () => { throw new Error('Asset fetch should not run for redirects.'); } } },
  {}
);

let response = await responseFor('https://synapseworks.org/store/');
assert.equal(response.status, 301);
assert.equal(response.headers.get('Location'), 'https://synapseworks.org/products/');

response = await responseFor('https://synapseworks.org/store/?ref=campaign');
assert.equal(response.status, 301);
assert.equal(response.headers.get('Location'), 'https://synapseworks.org/products/?ref=campaign');

response = await responseFor('https://synapseworks.org/pageharbor/');
assert.equal(response.status, 301);
assert.equal(response.headers.get('Location'), 'https://synapseworks.org/rme-pdf-scanner/');

response = await responseFor('https://synapseworks.org/pageharbor?ref=rebrand');
assert.equal(response.status, 301);
assert.equal(response.headers.get('Location'), 'https://synapseworks.org/rme-pdf-scanner/?ref=rebrand');

response = await responseFor('https://synapseworks.org/pageharbor/privacy/?source=policy');
assert.equal(response.status, 301);
assert.equal(response.headers.get('Location'), 'https://synapseworks.org/rme-pdf-scanner/privacy/?source=policy');

console.log('legacy redirects are permanent and preserve request query strings');
