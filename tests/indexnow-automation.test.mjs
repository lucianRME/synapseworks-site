import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { changedCanonicalUrls, sitemapUrls } from '../tools/changed_indexnow_urls.mjs';

const current = `<urlset>
  <url><loc>https://synapseworks.org/</loc></url>
  <url><loc>https://synapseworks.org/rme-pdf-scanner/</loc></url>
  <url><loc>https://synapseworks.org/products/</loc></url>
</urlset>`;
const previous = `<urlset>
  <url><loc>https://synapseworks.org/</loc></url>
  <url><loc>https://synapseworks.org/rme-pdf-scanner/</loc></url>
</urlset>`;

test('IndexNow candidates are canonical same-host sitemap URLs only', () => {
  const xml = current.replace('</urlset>', `<url><loc>https://other.example/page/</loc></url>
    <url><loc>https://www.synapseworks.org/</loc></url>
    <url><loc>http://synapseworks.org/insecure/</loc></url></urlset>`);
  assert.equal(sitemapUrls(xml).length, 3);
});

test('changed product HTML submits exactly the canonical product page', () => {
  assert.deepEqual(changedCanonicalUrls(['rme-pdf-scanner/index.html'], current, current), [
    'https://synapseworks.org/rme-pdf-scanner/'
  ]);
});

test('changes that are not indexable HTML do not submit unrelated pages', () => {
  assert.deepEqual(changedCanonicalUrls(['worker.js', 'styles.css', 'tests/indexnow-automation.test.mjs'], current, current), []);
});

test('home page and relevant social-card changes resolve to canonical pages', () => {
  assert.deepEqual(changedCanonicalUrls(['index.html', 'rme-pdf-scanner/og.png'], current, current), [
    'https://synapseworks.org/',
    'https://synapseworks.org/rme-pdf-scanner/'
  ]);
});

test('shared navigation changes submit site pages, but unchanged sitemap does not', () => {
  assert.deepEqual(changedCanonicalUrls(['site-navigation.js'], current, current), sitemapUrls(current).sort());
  assert.deepEqual(changedCanonicalUrls(['sitemap.xml'], current, current), []);
});

test('sitemap additions and removals are notified without resubmitting unchanged URLs', () => {
  assert.deepEqual(changedCanonicalUrls(['sitemap.xml'], current, previous), [
    'https://synapseworks.org/products/'
  ]);
  assert.deepEqual(changedCanonicalUrls(['sitemap.xml'], previous, current), [
    'https://synapseworks.org/products/'
  ]);
});

test('RME page has one branded Google Play link and no duplicate text CTA', async () => {
  const html = await readFile('rme-pdf-scanner/index.html', 'utf8');
  assert.equal((html.match(/class="play-badge"/g) || []).length, 1);
  assert.equal((html.match(/Get RME on Google Play<\/a>/g) || []).length, 0);
  assert.equal((html.match(/href="https:\/\/play\.google\.com\/store\/apps\/details\?id=org\.synapseworks\.pageharbor/g) || []).length, 1);
  assert.match(html, /Get it on Google Play/);
});
