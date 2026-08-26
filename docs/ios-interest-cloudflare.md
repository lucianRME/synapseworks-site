# PageHarbor iOS interest signal: Cloudflare setup

The site includes Cloudflare Worker routes for an anonymous PageHarbor iOS-interest signal and optional beta-notification email. The existing `synapseworks-site` Worker serves static assets directly and invokes `worker.js` only for `/api/*`. The interest routes are not active until the Worker has a D1 binding named `IOS_INTEREST_DB`.

## Routes

- `POST /api/ios-interest` records one anonymous interest row and returns `{ "ok": true }`.
- `GET /api/ios-interest` returns `{ "thresholdReached": false }` below 1,000 rows. At or above 1,000, it returns a rounded `displayCount` such as `"1000+"`.
- `POST /api/ios-interest-email` accepts an optional email after interest registration. It normalizes it to lowercase, validates its format, and uses a unique database constraint. A duplicate returns the same generic success response as a new address.

No endpoint returns the below-threshold count. No public admin endpoint exists.

## D1 database and migration

1. The tracked `wrangler.toml` binds the production Worker to the existing `pageharbor-ios-interest` database as `IOS_INTEREST_DB`.
2. Apply the tracked schema only when ready: `npx wrangler d1 migrations apply pageharbor-ios-interest --remote`.

The schema is [0001_ios_interest.sql](../migrations/0001_ios_interest.sql). It stores an anonymous timestamped interest row, or an optional normalized email and timestamp. It does not have columns for document data, IP addresses, user agents, or device fingerprints.

## Owner-only counts and deletion

Use an authenticated Cloudflare account and D1 directly; do not create a public endpoint for this.

```sh
npx wrangler d1 execute pageharbor-ios-interest --remote --command "SELECT COUNT(*) AS total_interest FROM ios_interest"
npx wrangler d1 execute pageharbor-ios-interest --remote --command "SELECT COUNT(*) AS unique_notification_emails FROM ios_interest_email"
```

To action a verified deletion request for an email address, run an owner-authorized parameterized query or use the D1 dashboard SQL editor. Anonymous interest rows cannot be linked back to a person and therefore cannot be selectively deleted; they remain only as an aggregate product-interest signal.

## Turnstile and edge abuse protection

The client stores a local `pageharbor-ios-interest-recorded` marker and disables the button after a successful request. This is intentionally a directional signal, not proof of a unique person.

Both mutation routes require a fresh Cloudflare Turnstile token. `GET /api/ios-interest` remains public. The browser loads Cloudflare's official client script, obtains a token in managed `interaction-only` mode, sends it in the `X-Turnstile-Token` request header, and the Worker validates it with Siteverify before making a D1 write. The Worker never sends `remoteip` to Siteverify and never stores the token, IP address, user agent, or fingerprint.

Before deploying this feature:

1. In the Cloudflare dashboard, create a **Managed** Turnstile widget for PageHarbor. Restrict its hostnames to the production hostname and the `synapseworks-site.lucianirimie.workers.dev` deployment hostname if that environment will be used for testing.
2. Put its public sitekey in the `TURNSTILE_SITE_KEY` value in `wrangler.toml`, replacing `REPLACE_WITH_YOUR_TURNSTILE_SITEKEY`.
3. Set the private secret interactively; never add it to a file: `npx wrangler secret put TURNSTILE_SECRET_KEY`.
4. Deploy only after both values are configured. A deployment with the placeholder sitekey leaves registration unavailable by design.

The tracked Worker also has a native `IOS_INTEREST_RATE_LIMIT` binding. It caps each route key at 20 POST requests per minute per Cloudflare location. It is a privacy-preserving coarse circuit breaker for the `workers.dev` deployment: its key is only the route name, not an IP address, email address, token, or fingerprint. The binding is intentionally not an exact global accounting system.

For the stronger public-edge control, create two Cloudflare WAF rate-limiting rules, each scoped to the production zone and `POST` only:

- `/api/ios-interest`: 5 requests per 10 minutes per source IP; mitigate with a 10-minute Managed Challenge.
- `/api/ios-interest-email`: 5 requests per 10 minutes per source IP; mitigate with a 10-minute Managed Challenge.

These conservative limits allow retries while containing low-volume automated abuse. Cloudflare uses source IP information only at the edge for the WAF rule; the Worker and D1 schema do not receive or persist it. Start each rule in Log mode, review normal traffic, then enforce it.

## Email purpose and retention

Email is optional and is only for a possible PageHarbor iOS beta notification. Do not use it for unrelated marketing. Retain it only while that possible notification remains relevant, or delete it earlier on a verified request sent to `privacy@synapseworks.org`.
