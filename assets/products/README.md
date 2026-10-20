# Product preview sources

Checked 20 October 2026. Product interfaces are genuine. The 640px and 960px
variants are resized proportionally and encoded as WebP, without retouching,
cropping, or inventing interface content.

- `rme-tools-*`: approved `assets/play-store/screenshots/phone/04-pdf-tools.png`
  from the RME PDF Scanner repository, 1264 × 1264. The adjacent store-asset
  README identifies the set as finalized v1.7.0 marketing assets. It contains
  the actual app Tools screen and is published on the
  [official Google Play listing](https://play.google.com/store/apps/details?id=org.synapseworks.pageharbor).
- `submit-guard-confirmation-*`: new 960 × 600 browser capture of the real
  Submit Guard v0.4.0 confirmation dialog, replacing the previous store-popup
  settings image. The dialog is rendered by the **unmodified** `content_script.js`
  from the public `submit-guard-0.4.0.zip` package, verified byte-for-byte against
  [the official source](https://github.com/lucianRME/Submit-Guard-Confirm-Before-Submit/blob/7c6752cb8d18122627fe4c85259c1032f1bba6d9/extension/content_script.js).
  Script SHA-256: `fd94bd21c5bfb454360f087b80e2a8832c116975045b6492ab52c9916e709a25`.
  Original capture SHA-256: `f423ed45dc04f65ed68e1ce797fb94b0ca297536ca195e3448f66fc7682f03f0`.

  Capture setup: a local example form, explicitly marked "Fictional data only",
  uses `alex@example.com`, a fictional project subject, and a fictional message.
  A local adapter supplies Chrome storage/runtime APIs with protection enabled
  in `always_confirm` mode. The released dialog's HTML, styles, and handlers are
  unchanged; this is a source-rendered capture, not a capture of an installed
  Chrome extension. The adapter and example form are not shipped with the site.
  Escape and Cancel left the form unsubmitted; Submit continued only the local
  fixture action. No form data left the page. The saved image shows the dialog
  before confirmation.

Current raw RME screenshots are not available in this site; use the approved
store composition until suitable current captures are supplied. Published Jira
images show tenant or personal information, so Jira cards intentionally use text.

All four products have public installation listings. Jira development status
remains early-stage; that status does not mean the products are unavailable.
