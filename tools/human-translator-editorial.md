# Human Translator — selection-only editorial preview

21 October 2026 · catalog `2026-10-21-selection-2` · draft PR #12.

## Review contract

The active picker has **415 pairs / 830 directions**: 216 Corporate, 80 Gen Z,
119 Polite; 129 are labelled roast. Keep all three mode selectors and the
reverse direction. Native theme and phrase selects replace free-text entry.
The full selected phrase remains readable below the select, including on mobile.
Quick examples and theme-aware Surprise me select known IDs only.

Every candidate is pending owner validation. Humour is subjective and no claim
of comprehensive internet coverage, present-day virality or reliable intent
inference is made. Some terms are dated memes or historical vocabulary.
All comic readings are newly written. Source screenshots, creator reply lists,
article definitions and comments are not bundled into the site.

Review `/human-translator/review/` on the dedicated preview. Filter by mode,
roast/cheeky tone, or Keep/Drop decision. Sources appear only as reference links
at the bottom of both pages, not as a selector or on individual cards. The
source-position inventory remains in `source-coverage.mjs` for internal checks.
Keep, Drop and Undo affect page memory only. Export choices before reload or leaving;
the JSON contains the catalog version and known IDs plus decision enums.
No decision is sent to a server or treated as approval of a production release.

## Six requested sources — coverage checked

- [Atlassian](https://www.atlassian.com/blog/teamwork/6-examples-of-business-jargon-you-should-stop-using-now): all 31 named terms, ordered positions mapped to 31 candidates.
- [TechTarget](https://www.techtarget.com/whatis/feature/Awful-corporate-jargon-phrases-you-cant-escape): all 58 named terms mapped to 58 candidates.
- [Shubham Khurana on LinkedIn](https://www.linkedin.com/posts/shubham-khurana-1baa168_how-to-say-are-you-dumb-in-corporate-ugcPost-7320400535205941248-8iqP/): six carousel ideas, read from all seven public slides including the cover. Stock questions and original adaptations; an ordinary request for reasoning is not evidence of an insult.
- [The Language Nerds](https://thelanguagenerds.com/2022/30-translations-from-blunt-insults-and-angry-emails-into-professional-language-shared-by-this-tiktoker/): all 30 image positions covered by intent, using 29 candidates because positions 20/21 repeat the same item. Credit for the source series belongs to Laura Whaley / @loewhaley and Work Bestie. Our professional replies and punchlines are original adaptations.
- [Bored Panda](https://www.boredpanda.com/how-to-professionally-say-tiktok/): all 39 displayed image items covered by intent, including nine community additions beyond the 30 featured examples. Its item 16 is absent from the other roundup and has its own candidate, p210.
- [r/AskUK](https://www.reddit.com/r/AskUK/comments/18f5dxv/officecorporate_jargon_what_are_your_most/): 84 distinct workplace terms/variants in publicly loaded comments mapped to candidates. Repeated spellings and inflections can share a candidate. Deleted, collapsed, future and off-topic comments are outside the snapshot. Songs, threats and stereotypes are not phrase candidates.

Coverage means the term or underlying conversational intent is present; it does
not mean verbatim reproduction of the article or a creator's comic translations.
Source dates and scope live in `catalog-sources.mjs`; the six inventories live
in `source-coverage.mjs`. Tests protect known IDs and all named source positions.

## Compatibility and measurement

The earlier 120 pairs and their 327 reviewed alternatives remain unchanged in
`phrases.mjs`. Old result links keep exactly their released words. New candidate
IDs start at c101/g101/p101 and use the same strict ID-only fragment contract.
Neither arbitrary text nor source URLs can be serialized into shared results.

The existing analytics adapter adds only `selected` and `surprise` source enums;
it still excludes phrase IDs, phrase text and reviewer choices. Analytics stays
off on localhost and the preview. Share-open, share-handoff, share-cancel,
copy-link, attributed shared visits and RME clicks remain distinct events.
A successful OS handoff is not confirmed delivery; a copied link is not a visit.

If this preview is later approved and released, annotate the exact release time
in the running 30-day KPI experiment. Do not restart the observation window.
Typed match/fallback rates from the old version cannot be compared with this
picker's deterministic matched rate: all valid choices are curated by design.
Report selected, example, surprise and shared activity separately. Preserve all
existing consent, DNT/GPC and test-traffic exclusions.

## Validation

24/24 Node tests pass, including all 415 candidates in both directions, legacy
round trips, strict URL rejection, six source inventories, consent gating and
Worker isolation. Controlled Chrome verifies all six directions and the original source inventory, Keep/Drop/Undo,
a downloaded 415-decision JSON export and memory reset. The live preview version
`ea011587-ceb9-4ada-9364-390df80b3d51` serves all 15 tool assets byte-for-byte
with noindex; write/API checks return 403/404. Further evidence is recorded in
the PR and the implementation guide. The optional standalone browser script
was updated but controlled Chrome is used for this task's actual UI checks.
Physical mobile share sheets and a full assistive-technology audit remain outside
these checks. Production release and global Cloudflare changes are not part of
this editorial preview.
