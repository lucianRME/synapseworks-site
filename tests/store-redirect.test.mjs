import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = (await readFile('worker.js', 'utf8'))
  .replace(/^import .*;\n/gm, '')
  .replace('export default', 'globalThis.worker =');
const context = {
  URL,
  Response,
  iosInterest: () => { throw new Error('API handler should not run for /store/.'); },
  iosInterestConfig: () => { throw new Error('API handler should not run for /store/.'); },
  iosInterestEmail: () => { throw new Error('API handler should not run for /store/.'); }
};
vm.runInNewContext(source, context);

const responseFor = (url) => context.worker.fetch(
  new Request(url),
  { ASSETS: { fetch: () => { throw new Error('Asset fetch should not run for /store/.'); } } },
  {}
);

let response = await responseFor('https://synapseworks.org/store/');
assert.equal(response.status, 301);
assert.equal(response.headers.get('Location'), 'https://synapseworks.org/products/');

response = await responseFor('https://synapseworks.org/store/?ref=campaign');
assert.equal(response.status, 301);
assert.equal(response.headers.get('Location'), 'https://synapseworks.org/products/?ref=campaign');

console.log('store redirect preserves the request query string');
