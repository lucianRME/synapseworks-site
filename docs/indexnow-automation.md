# Automatic IndexNow notifications for SynapseWorks

The site already hosts the IndexNow verification file
`/1d4381dc307d4be794315e168b6b626c.txt` and has a manually callable
`tools/submit_indexnow.mjs`. The existing key and URL stay unchanged.

## Automatic production flow

`.github/workflows/indexnow-production.yml` runs after pushes to `main`:

1. Fetch repository history and compare the push's before/after commits.
2. Find changed canonical HTML pages listed in the existing `sitemap.xml`.
   The home page maps to `index.html`, and directory routes map to
   `<route>/index.html`. A site-navigation content update affects every
   sitemap page. A change to the RME social card refreshes that product URL.
   Sitemap additions/removals are also notified.
3. **Do not submit on documentation-only or style-only changes.**
4. Wait for the Cloudflare check named
   `Workers Builds: synapseworks-site` to succeed for the same commit.
   If the build fails or cannot be confirmed, fail without notifying.
5. POST only the selected URLs to `https://api.indexnow.org/indexnow`
   through the existing `tools/submit_indexnow.mjs`.

The workflow uses read-only GitHub permissions and requires no new secret,
backend, Cloudflare Worker route or request-time traffic. It cannot run on
pull-request branches. A manually dispatched rerun uses the last commit's
diff and still checks Cloudflare build success.

The GitHub repository and Cloudflare build-check name are intentionally fixed
to prevent a fork, PR or unrelated environment from notifying search engines
for `synapseworks.org`. If the Cloudflare integration changes its check name
or ceases reporting successful builds, update the workflow **after review**
instead of bypassing the deployment gate.

Submissions acknowledge **notification received**, not crawling or indexing.
Review the GitHub Actions run's `IndexNow after production deployment` job,
then Bing Webmaster Tools → IndexNow to confirm reception.

## Google Search

Google does not offer IndexNow for ordinary product and article pages. Its
Indexing API is limited to supported JobPosting and livestream BroadcastEvent
content, so this site must **not** use that API to force-index RME pages.

The existing `https://synapseworks.org/sitemap.xml` is linked from
`robots.txt`. Keep the sitemap's canonical URLs accurate, maintain meaningful
internal links, and submit/retain this one sitemap in Google Search Console.
Google discovers and revisits URLs automatically; a manual URL Inspection
request is optional for exceptional urgent changes, not a release step.

Do not use the discontinued Google sitemap ping endpoint, claim IndexNow
notifies Google, or fabricate `lastmod` dates. If `lastmod` is ever added,
it must reflect real page-content changes.

## Validation and boundaries

- Tests: `node --test tests/*.test.mjs`.
- Page: keep **one** official branded Google Play badge on
  `/rme-pdf-scanner/`. GitHub Releases and Obtainium remain available.
- Existing `tools/submit_indexnow.mjs` still supports manual submission when
  needed.
- IndexNow is domain-specific. This does not notify crawlers about updates to
  `lucianirimie.com`, `synapseworks.gitbook.io`, Google Play or SourceForge.
- No notifications fire merely because a draft PR was opened or a Cloudflare
  preview was built.
