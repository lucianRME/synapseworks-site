# Human Translator v0.1 — implementation and 30-day experiment

Date: 21 October 2026. Route: `/human-translator/`. Base: `cb6675a` on `main`.
Work is isolated on `feat/human-translator-mvp`. PR #6 was already merged before
this work began; neither its branch nor dedicated preview is an implementation target.

## What ships

- Mobile-first English phrasebook: Corporate ↔ Human, Gen Z ↔ Millennial,
  Polite ↔ Direct. Forty original editorial pairs per mode; 120 pairs, 240
  directional mappings and 327 reviewed alternatives (567 accepted whole phrases
  across modes/directions). Three quick examples plus all forty per mode.
- Exact deterministic matching after NFKC normalization, case folding,
  whitespace collapse, curly-quote conversion and final `. ! ?` removal.
  Reviewed alternatives are exact whole-phrase matches too. No substring
  replacement, inferred intent, generated output or paid AI.
- A 240-character limit and explicit empty, too-long and no-match responses.
  Editing, switching modes or swapping directions clears stale results.
- Copy text, copy result link and native Web Share with clipboard/manual-copy
  fallback. A cancelled share is separate from a resolved OS share promise.
- Permanent curated IDs, schema version and direction in a strict fragment:
  `/human-translator/#v=1&p=c01&d=f&src=share`. The fragment is not sent in HTTP
  requests. No free text, arbitrary return URL, HTML or identity is serialized.
  Unknown IDs, extra/duplicate fields, injection and unsupported versions fail
  closed. Shared results appear above the input and survive reload.
- RME product and Google Play links, using the already published Android
  package ID. Fixed UTMs: `human_translator / microtool / ht_v01`.
  No RME application or RME landing-page modifications.
- Canonical, description, Open Graph, Twitter card, original 1200×630 PNG and
  source SVG, WebApplication JSON-LD, sitemap entry and link-check seed.
  Social crawlers show the generic card, not a dynamic per-result image.
- Native controls, labelled mode buttons/direction swap/input, visible focus,
  skip navigation, live status, result focus, 44px interaction targets and
  readable no-JavaScript examples. No animation, external font or new site
  runtime dependency.

The phrasebook is entertainment. Generational language overlaps; the mappings
are playful examples, not universal definitions or reliable readings of intent.
Unrecognized input is deliberately not translated.

## Dictionary expansion — 21 October 2026

Follow-up branch: `feat/human-translator-dictionary`. The launch dictionary had
only 36 pairs. Everyday phrases such as “fire away” and “will get back to you”
were missing, while even “circle back” missed the existing “Let's circle back”.
The regression test reproduced that failure before the change.

The expansion adds 84 pairs and direction-specific, reviewed alternatives.
“Fire away” now maps to “Go ahead and ask”; “will get back to you”, “I will get
back to you” and “I'll get back to you” map to “I'll reply later”. Both are
available in Corporate → Human and Polite → Direct. Corporate additions also
cover touch base, action items, ETA, capacity, scope creep, sign-off and common
email wording. Slang additions include lowkey, NGL, bet, sus and red/green flags.
Tone additions cover updates, refusals, requests, timing and boundaries.

All 36 original pairs and IDs retain their exact text and meaning. Alternatives
share their canonical result, never the visitor's wording. Matching requires
one unambiguous complete phrase in the selected mode and direction. Negations,
added deadlines, compound sentences and unlisted context still fail honestly;
for example, “I'll get back to you tomorrow” is not silently reduced to a
promise with no deadline. No visitor input is collected to grow this list.

To maintain coverage, append permanent pairs in `phrases.mjs`; add alternatives
to `ALIASES` under the existing ID and `f`/`r` direction. Do not add a wording
variation that changes the subject, timing, certainty or meaning. Tests enforce
normalized uniqueness in each mode/direction, round-trip every accepted input
through safe canonical sharing, and protect unknown/negated/contextual input.
The UI derives browsing counts from the data; static SEO/social counts are
checked against it. Browser module URLs are versioned together for this update.

This change is prepared for review separately from production. QA runs on
localhost and the isolated preview, where the analytics adapter is disabled.
When released, record its deployment time in the 30-day KPI record and compare
typed match rates before/after; do not reset the observation window or mix
preview QA into production traffic.

## Files and boundaries

`human-translator/phrases.mjs` owns reviewed content and permanent IDs.
`engine.mjs` owns matching and the strict share contract. `app.mjs` owns DOM,
clipboard/share interactions and ephemeral state. `analytics.mjs` owns a
consent-gated event allowlist. The remaining directory files are the page,
scoped CSS and social artwork.

Shared homepage, catalog, navigation scripts, RME pages, production Worker,
existing preview entry/config, databases and Cloudflare global settings remain
unchanged. Shared integration changes are the sitemap, link-check seed, asset
exclusions, a narrow privacy-policy disclosure and a Node test step in the
existing CI workflow.

Never recycle or change an existing phrase ID's meaning. Append future IDs;
keep old mappings to preserve shared links. Breaking schema changes require a
new version and an explicit compatibility decision.

## Privacy and analytics

There is no new backend, account, database, translation API, saved phrase history,
cookie, fingerprint or persistent user ID. Text is handled in page memory.
The module never sends input, output, clipboard contents or user-provided URL
parameters as event properties. Ordinary hosting and any pre-existing edge
analytics remain subject to the website's privacy/cookie policies.

The adapter uses the existing `window.zaraz.track` only when all conditions hold:

1. The exact hostname is `synapseworks.org`, not localhost or a preview.
2. Neither Global Privacy Control nor Do Not Track is enabled.
3. The Zaraz Consent API is ready.
4. Exactly one live consent purpose is explicitly named `Analytics`, either as
   a plain string or the English label in Zaraz's localized `name.en` object.
5. Its live purpose ID returns `true` from `zaraz.consent.get(id)`.

The ID is discovered from the configured purpose; no platform ID is invented.
Missing, ambiguous or denied consent means no event call and no queued replay.
Withdrawal is checked on every action. The optional Analytics settings button
opens the existing Zaraz consent modal; it never grants or changes consent itself.
Visits are recorded at most once per loaded document after verified consent.
If a valid shared link was the initial arrival, a separate tagged-visit event is
also recorded. Same-document hash changes do not create new arrival events.

Only `product=human_translator`, `version=0.1`, mode, direction and enumerated
outcome/source/destination values can leave this module. Names and meanings:

| Event | Meaning | Does not establish |
| --- | --- | --- |
| `ht_visit` | Consented document visit | Unique person or session |
| `ht_shared_visit` | Initial valid `src=share` fragment, after consent | Verified referral, new person or delivery |
| `ht_mode_change` | Mode button chosen | A translation |
| `ht_translate` | Deliberate submit or example click; outcome `matched`, `unmatched`, `empty`, `too-long` | AI understanding |
| `ht_copy_text` | Clipboard promise resolved for the translation | A link share |
| `ht_copy_link` | Clipboard promise resolved for a result link | Sending it or a recipient visit |
| `ht_share_open` | Native share requested | A completed share |
| `ht_share_handoff` | Native share promise resolved | Message delivery or recipient visit |
| `ht_share_cancel` | Native share returned AbortError | A sent share |
| `ht_rme_click` | Product or Play CTA activated | Navigation completion, install or revenue |

Manual copy cannot be verified and is not counted as clipboard success. No
native Share API means the button uses the copy-link flow. Link fragments are
editable; self-opens, reloads, bots and reposts cannot be deduplicated without
adding identity/state. This MVP deliberately does not add either.

### Measurement readiness gate

The repository contains no analytics vendor IDs or forwarding rules. A generic
HTTP client did not receive an injected Zaraz script, but the production Chrome
page does load Zaraz and its consent API. The public runtime confirms the
localized Analytics purpose shape, which the adapter now supports. This alone
does not verify GA4 forwarding. Production event delivery requires the live
checks below; no baseline or growth result is claimed from the code tests.
The available Wrangler OAuth credential returned HTTP 403 on the read-only
Zaraz configuration endpoint, so the admin configuration could not be audited.

Before starting the 30-day clock, inspect the already configured Analytics
purpose and existing GA4 forwarding in the site's current admin/debug view.
Do not change global Cloudflare settings as part of this PR. If the purpose is
named differently, review a narrowly scoped adapter adjustment against the
actual configuration. If the integration is absent, leave collection off and
record a measurement blocker; functional launch can still proceed if approved.

After an approved production release, use fictional sample content to verify:
consent denied → no Human Translator events; consent granted → visit, translate,
share-action and separately tagged-arrival events in the existing analytics
destination; withdrawal/GPC/DNT → no further Human Translator events. Register
mode, direction, outcome, source and destination as reporting dimensions only
if supported by the existing destination. Event delivery and destination mapping
require this live check; unit/browser fixtures do not prove collection.

References: [Cloudflare Consent API](https://developers.cloudflare.com/zaraz/consent-management/api/),
[consent/tool assignments](https://developers.cloudflare.com/zaraz/consent-management/).

## Thirty days of KPI review

Day 0 is the approved production release **with working measurement**, not this
draft PR or the preview. Use a single reporting timezone, Europe/Dublin. Export
daily aggregate counts from the existing analytics destination. Do not copy
visitor text, full URLs, IPs or identifiers into the report. No new database is
needed: the reporting destination/export is sufficient.

Use the same consented event population throughout. No data means **unknown**,
not zero. Do not compare consented counts directly with all-traffic hosting
requests as though their denominators matched.

| KPI | Calculation | Interpretation |
| --- | --- | --- |
| Consented visits | Count `ht_visit` | Document loads, not unique users |
| Match rate | matched / (matched + unmatched) `ht_translate` | Exclude empty and too-long; show typed vs example separately |
| Fallback demand | Typed unmatched / all typed matched+unmatched | Coverage gap; raw phrases are unavailable by design |
| Link-copy intensity | `ht_copy_link` per 100 matched translations | Action count; may exceed 100 |
| Share handoff intensity | `ht_share_handoff` per 100 matched translations | OS handoffs; may exceed 100 |
| Tagged arrival share | `ht_shared_visit` / `ht_visit` | Link-tagged traffic; not unique recipient conversion |
| RME discovery intensity | `ht_rme_click`, split product/Play, per 100 visits | CTA actions; not installs; may exceed 100 |
| Direction/mode interest | Translation counts by mode and direction | Split examples from typed input |

Never add `ht_share_open`, `ht_copy_link`, `ht_share_handoff` and
`ht_shared_visit` together and call the sum “shares”. Never claim a viral
coefficient, unique referral conversion, installs or revenue from these events.
An existing Play Console acquisition report may provide a separate signal for
the fixed campaign; availability/attribution has not been verified here.

- **Days 1–3:** confirm consent behavior and counts, broken links, mobile flow,
  generic social card and RME destinations. Annotate outages and incomplete days.
- **Days 4–7:** inspect mode/direction use, typed-only fallback rate and share
  actions versus tagged arrivals. Seek voluntary qualitative feedback without
  collecting pasted private messages. Do not buy traffic merely to fill a chart.
- **Days 8–14:** if a clear friction is supported by evidence, make one small
  content/UI change. Preserve IDs, record date and compare periods separately.
- **Days 15–21:** assess whether tagged visits and RME CTA actions recur beyond
  the initial launch spike. Keep acquisition-channel claims separate from causality.
- **Days 22–30:** export the complete daily series, note consent/sampling limits,
  total spending and time. Decide retain, iterate once, or archive the experiment.

Proposed experiment decision rules, **not market benchmarks or promised results**:
do not judge performance before 200 consented visits; below that, report
insufficient evidence. At that volume, 10 tagged arrivals and 5 RME CTA actions
are modest reasons to keep testing, not proof of demand. Below both, revisit
distribution before expanding the product. High example use alone does not
justify an AI backend. Any scope beyond the time/budget cap needs a new decision.

## Validation and reproduction

No site compilation is required; HTML/CSS/browser modules are served directly.
Use Node 22 or newer (existing Wrangler requirement) for the full test suite.

```sh
node --test tests/*.test.mjs
python3 -m http.server 8765 --bind 127.0.0.1
# In another terminal:
python3 tools/check_links.py --base-url http://127.0.0.1:8765 --fail-on-trailing-slash
git diff --check
npx wrangler deploy --dry-run --outdir /tmp/ht-production-build
npx wrangler deploy --config wrangler.human-translator-preview.toml --dry-run --outdir /tmp/ht-preview-build
```

Optional browser QA uses an already installed Playwright; it adds no runtime
dependency to the site. Run `node tools/check-human-translator-browser.mjs`
with `HT_PLAYWRIGHT_MODULE` pointing to Playwright's `index.mjs` if it is outside
normal module resolution. `HT_CHROME_PATH` selects an installed Chrome;
`HT_BASE_URL` and `HT_QA_OUTPUT` override localhost and the temporary output folder.
It covers 320/390/768/1024/1440px, six directions, honest fallback, no input
upload, copy success/denial, native share handoff/cancellation, shared reload,
malformed URL recovery, keyboard focus and no-JavaScript fallback.

Dictionary expansion evidence: 19/19 Node tests pass (including existing
production/PR #6 isolation tests); all 36 original pairs compare unchanged
against released `main`; 26 internal page URLs pass the strict local crawl.
Chrome confirms the reported phrases, eight typed examples, all six translation
directions, 40 examples per direction, negation fallback, link copy and shared
result reload. There is no horizontal overflow at 320/390/768/1024/1440px and no
captured browser errors. Analytics remains off locally. Both Wrangler dry-runs
pass. The optional standalone browser script was updated but not rerun for this
follow-up; browser checks here used the controlled Chrome session.
The refreshed public preview serves all eight application assets byte-for-byte
with noindex headers; live preview writes return 403 and APIs return 404.

Initial release evidence: Chrome checks
pass at all five widths without horizontal overflow, page errors or external
page requests. Sampled tool text contrast is at least 4.64:1; the input border
is 3.52:1 and the selected-mode border 5.40:1 against white. Both Wrangler
dry-runs pass. The public dedicated preview also passes the Chrome suite; its
seven application assets match the local files byte-for-byte, carry noindex,
and live preview write/API checks return 403/404. The default Python User-Agent
is blocked by Cloudflare; a normal browser User-Agent passes these read checks.
This is not a full assistive-technology,
physical iOS/Android share-sheet, Lighthouse or Core Web Vitals certification.

## Preview, production release and rollback

The dedicated config `wrangler.human-translator-preview.toml` targets only
`human-translator-mvp-preview`. Its entry imports no production code and has
only `ASSETS`: no D1, service, rate limit, secret or API binding. All requests
run through its read-only gate and receive noindex/nofollow. Non-GET/HEAD methods
return 403; APIs return 404. Existing-site navigation redirects only to a fixed
allowlist on the canonical domain. RME campaign parameters are reconstructed
from fixed values, not forwarded from arbitrary input.

The preview deployment command, already authorized for this task, is:

```sh
npx wrangler deploy --config wrangler.human-translator-preview.toml
```

This does not use or change `wrangler.toml`, `wrangler.preview.toml`, either
existing Worker's settings or the PR #6 preview. Global version URLs remain
disabled. The preview is a manual snapshot; future branch pushes do not update
it automatically. Refresh it with the explicit config after validation.

Review URL: <https://human-translator-mvp-preview.lucianirimie.workers.dev/human-translator/>.
Verified dictionary-expansion preview version: `03087acf-6af5-4f43-8bd6-d0c7b86a3d4a`.
The asset exclusion covers both `.git/` directories and the `.git` pointer file
used by isolated worktrees. Operational documentation/tests/tools are excluded
from static uploads by the existing asset policy.

Production launch remains a separate approval gate: review draft PR, approve
merge/release, verify measurement readiness, then use the existing production
release process. A merge to `main` may trigger its existing Cloudflare build;
do not merge before release approval. Confirm canonical route, social image,
share reload, consent events, RME links and no production API regressions after
the approved release. No IndexNow submissions or external launch messages are
part of this PR.

Rollback: revert this PR through the repository's approved process. There is no
schema or user-data migration. Removing the page breaks existing share links,
so prefer retaining a short retirement page at the route if the experiment ends.
The dedicated review Worker can be retired separately after review; do not
delete or alter the existing production or PR #6 Worker.

## Budget and scope accounting

New purchased services/assets/ads/API credits: **€0**. No paid AI, account,
database or backend was introduced. The €25 allowance remains unspent. Existing
hosting and Codex/account subscription billing are not newly purchased costs
and have not been audited. Preview traffic remains subject to the account's
existing Cloudflare limits; no plan upgrade or billing setting is authorized.

The worktree was created at 10:28 Europe/Dublin on 21 October 2026. Keep
development plus release within 18 hours and the complete experiment setup
within 24 hours; the thirty-day observation period is separate. A 30-day KPI
monitor with weekly reports was configured separately in the release chat;
its reporting state lives outside website assets. No external outreach was created.
