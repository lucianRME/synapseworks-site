#!/usr/bin/env node

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const HOST = 'synapseworks.org';
const KEY = '1d4381dc307d4be794315e168b6b626c';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const requestedUrls = process.argv.slice(2);

if (requestedUrls.length === 0) {
  console.error('Usage: node tools/submit_indexnow.mjs <url> [url ...]');
  process.exit(2);
}

const urlList = [...new Set(requestedUrls)].map((value) => {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid URL: ${value}`);
  }

  if (url.protocol !== 'https:' || url.hostname !== HOST) {
    throw new Error(`URL must use https://${HOST}/: ${value}`);
  }

  return url.href;
});

const response = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  }),
});

const responseBody = (await response.text()).trim();
console.log(`IndexNow HTTP ${response.status}`);
if (responseBody) console.log(responseBody);

if (response.status !== 200 && response.status !== 202) {
  process.exit(1);
}
