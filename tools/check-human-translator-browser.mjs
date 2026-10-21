// Optional browser QA; no runtime site dependency. Supply an installed Playwright module.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { phrasesFor } from '../human-translator/engine.mjs';
const modulePath = process.env.HT_PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const base = process.env.HT_BASE_URL || 'http://127.0.0.1:8765';
assert.notEqual(new URL(base).hostname, 'synapseworks.org', 'Use localhost or the isolated preview so QA cannot pollute production KPIs.');
const output = process.env.HT_QA_OUTPUT || '/tmp/human-translator-qa';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true,
  ...(process.env.HT_CHROME_PATH ? { executablePath: process.env.HT_CHROME_PATH } : {}) });
const errors = [];
const metrics = [];
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${base}/human-translator/`);
    await page.waitForFunction(() => !document.getElementById('controls').disabled);
    metrics.push(await page.evaluate(() => ({ width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      translateBottom: Math.round(document.querySelector('.translate-button').getBoundingClientRect().bottom) })));
    assert.equal(metrics.at(-1).documentWidth, width, `Overflow at ${width}px`);
    if ([390, 1440].includes(width)) await page.screenshot({ path: path.join(output, `initial-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/human-translator/`);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(), 'Skip to translator');
  await page.keyboard.press('Enter');
  assert.match(page.url(), /#main-content$/);
  await page.locator('#translate-form').evaluate(form => form.requestSubmit());
  assert.match(await page.locator('#status').textContent(), /Choose a phrase/);
  assert.equal(await page.locator('input, textarea:not([readonly]), [contenteditable=true]').count(), 0);
  assert.equal(await page.locator('#phrase').evaluate(element => element.tagName), 'SELECT');
  assert.equal(await page.locator('#examples button').count(), phrasesFor('corporate').length);
  await page.locator('#quick-examples button').first().click();
  assert.equal(await page.locator('#output').textContent(), 'Same problem. Different calendar invite.');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'result-title');
  await page.locator('#swap').click();
  assert.equal(await page.locator('#phrase').inputValue(), 'c101');
  await page.locator('.translate-button').click();
  assert.equal(await page.locator('#output').textContent(), "Let's circle back.");
  for (const [mode, expected] of [['generation', 'I have temporarily disabled exaggeration.'], ['tone', 'I have wrapped the deadline in a small cardigan.']]) {
    await page.locator(`[data-mode=${mode}]`).click();
    assert.equal(await page.locator('#result').isVisible(), false);
    assert.equal(await page.locator('#examples button').count(), phrasesFor(mode).length);
    await page.locator('#quick-examples button').first().click();
    assert.equal(await page.locator('#output').textContent(), expected);
    const forwardInput = await page.locator('#phrase option:checked').textContent();
    await page.locator('#swap').click();
    await page.locator('.translate-button').click();
    assert.equal(await page.locator('#output').textContent(), forwardInput);
  }
  for (const [mode, id, expected] of [
    ['corporate', 'c101', 'Same problem. Different calendar invite.'],
    ['corporate', 'c144', 'Please make your entire afternoon disappear.'],
    ['tone', 'p162', 'The supporting facts are still on the free trial.'],
    ['generation', 'g124', 'Your screen time needs a field trip.']
  ]) {
    await page.locator(`[data-mode=${mode}]`).click();
    await page.locator('#phrase').selectOption(id);
    await page.locator('.translate-button').click();
    assert.equal(await page.locator('#output').textContent(), expected);
  }
  await page.locator('[data-mode=tone]').click();
  await page.locator('#quick-examples button').first().click();
  await page.evaluate(() => {
    window.copied = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async text => window.copied.push(text)
    } });
  });
  await page.locator('#copy-link').click();
  const shared = await page.evaluate(() => window.copied.at(-1));
  assert.equal(shared, `${base}/human-translator/#v=1&p=p101&d=f&src=share`);
  await page.locator('#copy-text').click();
  assert.equal(await page.evaluate(() => window.copied.at(-1)), 'I have wrapped the deadline in a small cardigan.');
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async () => {} }));
  await page.locator('#share').click();
  assert.match(await page.locator('#status').textContent(), /Delivery is not confirmed/);
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true,
    value: async () => { throw new DOMException('cancelled', 'AbortError'); } }));
  await page.locator('#share').click();
  assert.equal(await page.locator('#status').textContent(), 'Share cancelled.');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true,
    value: { writeText: async () => { throw new Error('denied'); } } }));
  await page.locator('#copy-link').click();
  assert.equal(await page.locator('#manual-copy').isVisible(), true);
  assert.equal(await page.locator('#copy-value').inputValue(), shared);
  await page.goto(shared);
  await page.waitForFunction(() => !document.getElementById('shared-notice').hidden);
  assert.equal(await page.locator('#shared-notice').isVisible(), true);
  assert.equal(await page.locator('#output').textContent(), 'I have wrapped the deadline in a small cardigan.');
  await page.reload();
  assert.equal(await page.locator('#output').textContent(), 'I have wrapped the deadline in a small cardigan.');
  await page.screenshot({ path: path.join(output, 'shared-390.png'), fullPage: true });
  await page.locator('#phrase').selectOption('p102');
  assert.equal(await page.locator('#result').isVisible(), false);
  assert.equal(new URL(page.url()).hash, '');
  await page.goto(`${base}/human-translator/#v=1&p=c01&d=f&src=share&text=private`);
  await page.waitForFunction(() => document.getElementById('status').textContent.includes('invalid'));
  assert.match(await page.locator('#status').textContent(), /invalid/);
  assert.equal(await page.locator('#result').isVisible(), false);
  assert.equal(new URL(page.url()).hash, '');
  assert.equal(await page.locator('script[src*="analytics"]').count(), 0);
  assert.equal(requests.some(url => !url.startsWith(base)), false, 'Unexpected external request');
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const noJSPage = await noJS.newPage();
  await noJSPage.goto(`${base}/human-translator/`);
  assert.match(await noJSPage.locator('noscript').textContent(), /Enable JavaScript/);
  assert.equal(await noJSPage.locator('#phrase').isDisabled(), true);
  await noJS.close();
  assert.deepEqual(errors, []);
  const report = { passed: true, metrics, pageErrors: errors,
    checks: ['six translation directions', 'native selectors only', 'no free text', 'stale result cleared',
      'share URL reload', 'invalid URL recovery', 'copy success/failure', 'share handoff/cancel',
      'keyboard skip and result focus', 'no JavaScript fallback', 'no external page requests'] };
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
