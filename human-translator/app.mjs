import { MODES } from './phrases.mjs?v=05';
import { CATALOG, THEMES } from './catalog.mjs?v=05';
import { selectResult, pairById, phrasesFor, resultFor, parseFragment, shareURL, shareFragment } from './engine.mjs?v=05';
import { createAnalytics } from './analytics.mjs?v=05';

const $ = id => document.getElementById(id);
const analytics = createAnalytics({ window, navigator });
let mode = 'corporate';
let direction = 'f';
let current = null;
let source = 'selected';
let visitRecorded = false;
const arrival = parseFragment(location.hash === '#main-content' ? '' : location.hash);

function track(name, data = {}) { return analytics.track(name, { mode, direction, ...data }); }
function message(text) { $('status').textContent = text; }
function clearURL() { history.replaceState(null, '', location.pathname); }

function resetResult() {
  current = null;
  $('result').hidden = true;
  $('manual-copy').hidden = true;
  $('shared-notice').hidden = true;
  message('');
  clearURL();
}

function renderControls(selectedId = '') {
  document.querySelectorAll('[data-mode]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  });
  const sides = MODES[mode].sides;
  const [from, to] = direction === 'f' ? sides : [...sides].reverse();
  $('from-label').textContent = from;
  $('to-label').textContent = to;
  $('swap').setAttribute('aria-label', `Swap direction: ${to} to ${from}`);
  $('mode-hint').textContent = MODES[mode].hint;
  $('input-help').textContent = `English · ${CATALOG.length} curated riffs · no AI`;
  $('examples-summary').textContent = `Browse all ${phrasesFor(mode).length} ${from} phrases`;
  const themes = [...new Set(phrasesFor(mode).map(pair => pair.theme))];
  const theme = themes.includes($('theme').value) ? $('theme').value : '';
  $('theme').replaceChildren(new Option('All themes', ''), ...themes.map(key => new Option(THEMES[key], key)));
  $('theme').value = theme;
  renderPhraseOptions(selectedId);
  const exampleButton = pair => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'example';
    button.textContent = direction === 'f' ? pair.left : pair.right;
    button.addEventListener('click', () => {
      source = 'example';
      $('theme').value = '';
      renderPhraseOptions(pair.id);
      showResult(resultFor(pair, direction));
      track('ht_translate', { source, outcome: 'matched' });
      $('result-title').focus();
    });
    return button;
  };
  $('examples').replaceChildren(...phrasesFor(mode).map(exampleButton));
  $('quick-examples').replaceChildren(...phrasesFor(mode).slice(0, 3).map(exampleButton));
}

function renderPhraseOptions(selectedId = '') {
  const pairs = phrasesFor(mode).filter(pair => !$('theme').value || pair.theme === $('theme').value);
  const groups = [...new Set(pairs.map(pair => pair.theme))].map(theme => {
    const group = document.createElement('optgroup');
    group.label = THEMES[theme];
    group.append(...pairs.filter(pair => pair.theme === theme).map(pair =>
      new Option(direction === 'f' ? pair.left : pair.right, pair.id)));
    return group;
  });
  const selected = pairById(selectedId);
  // Old shared examples remain exact, but are not mixed into the new editorial list.
  if (selected?.mode === mode && !pairs.some(pair => pair.id === selected.id)) {
    const group = document.createElement('optgroup');
    group.label = 'Shared example';
    group.append(new Option(direction === 'f' ? selected.left : selected.right, selected.id));
    groups.unshift(group);
  }
  $('phrase').replaceChildren(new Option('Choose a phrase…', ''), ...groups);
  $('phrase').value = selected?.mode === mode ? selected.id : '';
  updateSelection();
}

function updateSelection() {
  const pair = pairById($('phrase').value);
  $('chosen-phrase').hidden = !pair;
  $('chosen-phrase').textContent = pair ? (direction === 'f' ? pair.left : pair.right) : '';
  $('selection-note').textContent = pair ? (pair.heat === 'roast' ? 'Roast · a little sharp' : 'Playful satire') : 'Pick a line. No typing needed.';
}
function showResult(result, shared = false) {
  current = result;
  $('result').hidden = false;
  $('manual-copy').hidden = true;
  $('output').textContent = result.output;
  $('result-label').textContent = `${result.from} → ${result.to}`;
  $('shared-notice').hidden = !shared;
  $('result').classList.toggle('shared-result', shared);
  if (shared) $('translate-form').before($('result'));
  else $('status').after($('result'));
  message(shared ? 'Shared result loaded. Pick another line below.' : 'Your translation is ready.');
  if (shared) history.replaceState(null, '', location.pathname + shareFragment(result));
  else clearURL();
}

document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode;
  direction = 'f';
  source = 'selected';
  $('theme').value = '';
  resetResult();
  renderControls();
  track('ht_mode_change');
}));

$('swap').addEventListener('click', () => {
  const previousId = current?.id || $('phrase').value;
  direction = direction === 'f' ? 'r' : 'f';
  resetResult();
  renderControls(previousId);
  source = 'selected';
});

$('theme').addEventListener('change', () => { source = 'selected'; resetResult(); renderPhraseOptions(); });
$('phrase').addEventListener('change', () => { source = 'selected'; resetResult(); updateSelection(); });
$('surprise').addEventListener('click', () => {
  const options = phrasesFor(mode).filter(pair => !$('theme').value || pair.theme === $('theme').value);
  const alternatives = options.filter(pair => pair.id !== $('phrase').value);
  const candidates = alternatives.length ? alternatives : options;
  const pair = candidates[Math.floor(Math.random() * candidates.length)];
  if (!pair) return;
  source = 'surprise';
  renderPhraseOptions(pair.id);
  showResult(resultFor(pair, direction));
  track('ht_translate', { source, outcome: 'matched' });
  $('result-title').focus();
});
$('translate-form').addEventListener('submit', event => {
  event.preventDefault();
  const response = selectResult($('phrase').value, mode, direction);
  track('ht_translate', { outcome: response.status, source });
  if (response.status === 'matched') {
    showResult(response.result);
    $('result-title').focus();
  } else {
    resetResult();
    message('Choose a phrase from the list or try an example below.');
    $('phrase').focus();
  }
});

async function copy(text, eventName) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    track(eventName);
    message(eventName === 'ht_copy_link' ? 'Result link copied. Only this curated example is included.' : 'Translation copied.');
  } catch {
    $('manual-copy').hidden = false;
    $('copy-value').value = text;
    $('copy-value').focus();
    $('copy-value').select();
    message('Automatic copy is unavailable. Select and copy the text below.');
  }
}

$('copy-text').addEventListener('click', () => { if (current) copy(current.output, 'ht_copy_text'); });
$('copy-link').addEventListener('click', () => { if (current) copy(shareURL(current, location.origin), 'ht_copy_link'); });
$('share').addEventListener('click', async () => {
  if (!current) return;
  const result = current;
  const url = shareURL(result, location.origin);
  if (!navigator.share) { await copy(url, 'ht_copy_link'); return; }
  track('ht_share_open');
  try {
    await navigator.share({ title: 'Human Translator · SynapseWorks',
      text: `“${result.input}” → “${result.output}”`, url });
    track('ht_share_handoff');
    message('Handed to your share app. Delivery is not confirmed.');
  } catch (error) {
    if (error.name === 'AbortError') { track('ht_share_cancel'); message('Share cancelled.'); }
    else { await copy(url, 'ht_copy_link'); }
  }
});

document.querySelectorAll('[data-rme]').forEach(link => link.addEventListener('click', () => {
  track('ht_rme_click', { destination: link.dataset.rme });
}));

function consentUI() {
  const available = location.hostname === 'synapseworks.org' && window.zaraz?.consent?.APIReady;
  $('analytics-settings').hidden = !available;
  $('analytics-state').textContent = analytics.ready()
    ? 'Anonymous usage events enabled by your Analytics consent.'
    : 'Human Translator usage events are off here.';
  if (!visitRecorded && analytics.ready()) {
    visitRecorded = track('ht_visit');
    if (visitRecorded && arrival.status === 'valid') track('ht_shared_visit', { source: 'shared' });
  }
}
$('analytics-settings').addEventListener('click', () => { window.zaraz.consent.modal = true; });
document.addEventListener('zarazConsentAPIReady', consentUI);
document.addEventListener('zarazConsentChoicesUpdated', consentUI);

function loadShared(parsed) {
  if (parsed.status === 'valid') {
    mode = parsed.result.mode;
    direction = parsed.result.direction;
    source = 'shared';
    $('theme').value = '';
    renderControls(parsed.result.id);
    showResult(parsed.result, true);
  } else if (parsed.status === 'invalid') {
    resetResult();
    message('That result link is invalid or from an unsupported version. Choose an example to start again.');
  }
}
window.addEventListener('hashchange', () => {
  if (!location.hash) resetResult();
  else if (location.hash !== '#main-content') loadShared(parseFragment(location.hash));
});
renderControls();
$('controls').disabled = false;
$('quick-examples-wrap').hidden = false;
$('examples-disclosure').hidden = false;
loadShared(arrival);
consentUI();
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  || location.hostname === 'human-translator-mvp-preview.lucianirimie.workers.dev') $('editorial-review').hidden = false;
