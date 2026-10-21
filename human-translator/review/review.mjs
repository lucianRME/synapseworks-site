import { MODES } from '../phrases.mjs?v=05';
import { CATALOG, THEMES } from '../catalog.mjs?v=05';
import { REFERENCES, RESEARCHED_ON } from '../catalog-sources.mjs?v=05';
import { resultFor, shareFragment } from '../engine.mjs?v=05';
import { SOURCE_COVERAGE } from '../source-coverage.mjs?v=05';
import { reviewExport } from '../review-state.mjs?v=05';

const $ = id => document.getElementById(id);
const choices = new Map();
const text = (tag, value, className) => {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  return element;
};
const stateFor = pair => choices.get(pair.id) || 'unreviewed';
function status(count) {
  const kept = [...choices.values()].filter(value => value === 'keep').length;
  const dropped = [...choices.values()].filter(value => value === 'drop').length;
  $('review-status').textContent = `${count} shown · ${kept} keep · ${dropped} drop · ${CATALOG.length - kept - dropped} unreviewed. Choices are not submitted.`;
}
function render() {
  const source = SOURCE_COVERAGE.find(item => item.reference === $('review-source').value);
  const sourceIds = source && new Set(source.items.map(item => item.pairId));
  const shown = CATALOG.filter(pair => (!$('review-mode').value || pair.mode === $('review-mode').value)
    && (!sourceIds || sourceIds.has(pair.id))
    && (!$('review-heat').value || pair.heat === $('review-heat').value)
    && (!$('review-state').value || stateFor(pair) === $('review-state').value));
  const cards = shown.map(pair => {
    const card = document.createElement('article');
    card.className = 'review-card';
    card.dataset.id = pair.id;
    const heading = text('h2', `${pair.id} · ${MODES[pair.mode].label}`);
    card.append(heading, text('p', `${THEMES[pair.theme]} · ${pair.heat === 'roast' ? 'Roast' : 'Cheeky'}`, 'review-badge'),
      text('p', pair.left, 'review-input'), text('p', `→ ${pair.right}`, 'review-output'));
    const reference = REFERENCES[pair.reference];
    const source = text('p', 'Original punchline · ', 'review-source');
    if (reference.url) {
      const link = text('a', 'Reference family');
      link.href = reference.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.title = reference.scope;
      source.append(link);
    } else source.append(text('span', 'original setup'));
    card.append(source);
    const actions = text('div', '', 'review-actions');
    for (const [value, label] of [['keep', 'Keep'], ['drop', 'Drop'], ['unreviewed', 'Undo']]) {
      const button = text('button', label);
      button.type = 'button';
      button.dataset.choice = value;
      button.setAttribute('aria-label', `${label} ${pair.id}`);
      button.setAttribute('aria-pressed', String(stateFor(pair) === value));
      button.addEventListener('click', () => {
        if (value === 'unreviewed') choices.delete(pair.id);
        else choices.set(pair.id, value);
        if ($('review-state').value) { render(); $('review-state').focus(); }
        else {
          actions.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.choice === stateFor(pair))));
          status(shown.length);
        }
      });
      actions.append(button);
    }
    const tryIt = text('a', 'Try result ↗');
    tryIt.href = `/human-translator/${shareFragment(resultFor(pair))}`;
    actions.append(tryIt);
    card.append(actions);
    return card;
  });
  $('review-cards').replaceChildren(...cards);
  if (!shown.length) $('review-cards').append(text('p', 'No candidates match these filters.'));
  status(shown.length);
}
for (const id of ['review-mode', 'review-source', 'review-heat', 'review-state']) $(id).addEventListener('change', render);
$('export-review').addEventListener('click', () => {
  const payload = new Blob([JSON.stringify(reviewExport(choices), null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(payload);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'human-translator-content-review.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
for (const coverage of SOURCE_COVERAGE) {
  const reference = REFERENCES[coverage.reference];
  $('review-source').append(new Option(reference.title, coverage.reference));
  const block = document.createElement('details');
  block.append(text('summary', `${reference.title} · ${coverage.items.length} positions → ${new Set(coverage.items.map(item => item.pairId)).size} candidates`), text('p', coverage.scope));
  const link = text('a', 'Open source ↗');
  link.href = reference.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  block.append(link);
  const list = document.createElement('ol');
  for (const item of coverage.items) {
    const pair = CATALOG.find(pair => pair.id === item.pairId);
    list.append(text('li', `${item.pairId} · ${pair.left}`));
  }
  block.append(list);
  $('requested-coverage').append(block);
}
for (const [key, reference] of Object.entries(REFERENCES)) {
  const block = document.createElement('p');
  if (reference.url) {
    const link = text('a', reference.title);
    link.href = reference.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    block.append(link);
  } else block.append(text('strong', reference.title));
  block.append(text('span', ` — ${reference.scope} ${reference.published || ''} Checked ${RESEARCHED_ON}.`));
  block.dataset.reference = key;
  $('source-list').append(block);
}
$('review-controls').disabled = false;
render();
