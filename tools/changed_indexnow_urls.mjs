#!/usr/bin/env node
// Select only changed canonical site pages for post-deployment IndexNow notification.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = 'synapseworks.org';

export function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)]
    .map((match) => match[1])
    .filter((value) => {
      try {
        const url = new URL(value);
        return url.protocol === 'https:' && url.hostname === HOST
          && !url.search && !url.hash;
      } catch {
        return false;
      }
    });
}

function pageFile(url) {
  const pathname = new URL(url).pathname;
  return pathname.endsWith('/')
    ? `${pathname.slice(1)}index.html`
    : pathname.slice(1);
}

export function changedCanonicalUrls(changedFiles, currentSitemap, previousSitemap = '') {
  const current = sitemapUrls(currentSitemap);
  const previous = sitemapUrls(previousSitemap);
  const known = new Set([...current, ...previous]);
  const changed = new Set(changedFiles.map((value) => value.replace(/^\.\//, '')));
  const urls = new Set();

  // A shared navigation content change affects the HTML rendered across the site.
  if (changed.has('site-navigation.js')) {
    current.forEach((url) => urls.add(url));
  }

  for (const url of known) {
    const path = pageFile(url);
    if (changed.has(path)) urls.add(url);
    // Refresh the social card's parent page when the image is replaced.
    if (path === 'rme-pdf-scanner/index.html' && changed.has('rme-pdf-scanner/og.png')) {
      urls.add(url);
    }
  }

  // Notify only sitemap additions and removals; editing the sitemap alone is
  // not a reason to re-submit every unchanged page.
  if (changed.has('sitemap.xml')) {
    const currentSet = new Set(current);
    const previousSet = new Set(previous);
    for (const url of current) if (!previousSet.has(url)) urls.add(url);
    for (const url of previous) if (!currentSet.has(url)) urls.add(url);
  }

  return [...urls].sort();
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function main() {
  const head = process.argv[3] || 'HEAD';
  let before = process.argv[2];
  if (!before || /^0+$/.test(before)) before = `${head}^`;

  const changedFiles = git('diff', '--name-only', '-z', before, head)
    .split('\0').filter(Boolean);
  const current = readFileSync('sitemap.xml', 'utf8');
  let previous = '';
  try {
    previous = git('show', `${before}:sitemap.xml`);
  } catch {
    // A brand-new repository has no previous sitemap.
  }
  const urls = changedCanonicalUrls(changedFiles, current, previous);
  if (urls.length) process.stdout.write(`${urls.join('\n')}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
