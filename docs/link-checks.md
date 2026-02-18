# Link Checks

This repo includes a lightweight internal link crawler at `tools/check_links.py`.

## Local run

1. Start a local static server from repo root:

   ```bash
   python3 -m http.server 8000
   ```

2. In another terminal, run:

   ```bash
   python3 tools/check_links.py --base-url http://127.0.0.1:8000
   ```

## What the checker validates

- Starts from these seed routes:
  - `/`
  - `/support/`
  - `/privacy/`
  - `/security/`
  - `/docs/`
  - `/docs/decision-register/`
  - `/apps/decision-register/`
  - `/apps/synapse/`
  - `/faq/decision-register/`
  - `/faq/synapse/`
- Crawls internal HTML links only.
- Ignores `mailto:`, `tel:`, hash links, and static assets (`.png`, `.svg`, `.css`, `.js`, `.ico`, etc.).
- Fails on broken internal pages (HTTP 4xx/5xx).
- Reports links missing a trailing slash when they redirect to folder routes (for example `/support` -> `/support/`).

## Exit codes

- `0`: no broken internal pages found.
- `1`: one or more broken internal pages found.
- Optional strict mode: add `--fail-on-trailing-slash` to fail when slash-redirect links are detected.

## CI workflow

`.github/workflows/link-check.yml` runs:

- Local crawl check on every push and pull request.
- Live smoke check for production URLs (`/support/`, `/privacy/`, `/security/`, `/docs/`, `/docs/decision-register/`) using `curl` retries.
  - Domain comes from `CNAME`.
  - If `CNAME` is missing or empty, live check is skipped.
