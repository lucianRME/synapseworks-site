# PR #6 dedicated preview automation

Cloudflare Builds connects `lucianRME/synapseworks-site` to the dedicated Worker
`feat-synapseworks-suite-refresh-synapseworks-site`. Its primary workers.dev URL is:

https://feat-synapseworks-suite-refresh-synapseworks-site.lucianirimie.workers.dev/

## Build settings

These settings live in Cloudflare, on the dedicated Worker only:

- Selected branch: `feat/synapseworks-suite-refresh`.
- Builds enabled; preview builds for other branches disabled.
- Root directory: `/`; include paths: `*`; no excluded paths.
- Build variable: `NODE_VERSION=22`.
- Build command: `node --test tests/*.test.mjs`.
- Deploy command:

```sh
test "$WORKERS_CI_BRANCH" = "feat/synapseworks-suite-refresh" && npx wrangler deploy --config wrangler.preview.toml
```

Each push to the selected branch runs the tests and then updates the dedicated
Worker. A failed test or a different branch prevents deployment. Wrangler also
checks that the configured Worker matches the Worker associated with the build.
The existing Cloudflare GitHub connection and build token are reused; no GitHub
secret or additional account token is required.

## Isolation requirements

- Keep `wrangler.preview.toml` pointed at `readonly-preview.js`, with
  `workers_dev = true`, `preview_urls = false`, and `run_worker_first = true`.
- The dedicated Worker has assets, a public widget key, and `PUBLIC_SITE_READ`.
  It has no D1, secret, or rate-limit bindings. The service binding is used only
  for the fixed public count GET; visitor input and credentials are not forwarded.
- Keep the unconditional mutation gate and noindex headers in the preview entry.
- Keep version URLs disabled on both this Worker and `synapseworks-site`.
  The site Worker's existing branch builds may upload versions, but those URLs
  remain disabled and do not serve this dedicated preview.
- Leave the production Worker's main-branch build settings and deployment intact.

## Verify a push

1. Confirm the dedicated Worker build for the pushed commit succeeds, and its
   deployed version receives 100% of traffic on the review URL.
2. Confirm the preview pages and public count GET return successfully with
   `X-Robots-Tag: noindex` and `X-SynapseWorks-Preview: pr-6-read-only`.
3. Confirm preview mutation requests return `403 / PREVIEW_READ_ONLY` before
   accessing bindings. Use no valid live Turnstile token; never probe production
   mutation handlers.
4. Confirm historical version URLs still return Cloudflare `404 / 1042`, including
   the newly uploaded version URL. Do not re-enable version URLs to test this.
5. Compare the production deployment/version and homepage/catalog with the
   pre-push baseline using read-only checks.

If a build fails, the last successful dedicated preview remains available.
Correct the branch build or retry it on the dedicated Worker. A manual preview
refresh, if separately authorized, must use `wrangler.preview.toml`; do not use
an unqualified deploy command. Disabling builds on the dedicated Worker stops
this automation without changing production or re-enabling historical URLs.
