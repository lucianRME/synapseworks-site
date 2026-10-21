import { MODES } from './phrases.mjs';
import { MAX_INPUT, translate, phrasesFor, resultFor, parseFragment, shareURL, shareFragment } from './engine.mjs';
import { createAnalytics } from './analytics.mjs?v=02';

const $ = id => document.getElementById(id);
const analytics = createAnalytics({ window, navigator });
let mode = 'corporate';
let direction = 'f';
let current = null;
let source = 'typed';
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

function renderControls() {
  document.querySelectorAll('[data-mode]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  });
  const sides = MODES[mode].sides;
  const [from, to] = direction === 'f' ? sides : [...sides].reverse();
  $('from-label').textContent = from;
  $('to-label').textContent = to;
  $('swap').setAttribute('aria-label', `Swap direction: ${to} to ${from}`);
  $('mode-hint').textContent = MODES[mode].hint;
  $('phrase').placeholder = direction === 'f' ? phrasesFor(mode)[0].left : phrasesFor(mode)[0].right;
  const exampleButton = pair => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'example';
    button.textContent = direction === 'f' ? pair.left : pair.right;
    button.addEventListener('click', () => {
      source = 'example';
      $('phrase').value = button.textContent;
      updateCount();
      showResult(resultFor(pair, direction));
      track('ht_translate', { source, outcome: 'matched' });
      $('result-title').focus();
    });
    return button;
  };
  $('examples').replaceChildren(...phrasesFor(mode).map(exampleButton));
  $('quick-examples').replaceChildren(...phrasesFor(mode).slice(0, 3).map(exampleButton));
}

function updateCount() { $('count').textContent = `${$('phrase').value.length} / ${MAX_INPUT}`; }
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
  message(shared ? 'Shared example loaded. Try your own below.' : 'Curated match found.');
  if (shared) history.replaceState(null, '', location.pathname + shareFragment(result));
  else clearURL();
}

document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode;
  direction = 'f';
  source = 'typed';
  $('phrase').value = '';
  resetResult();
  renderControls();
  updateCount();
  track('ht_mode_change');
}));

$('swap').addEventListener('click', () => {
  const previous = current;
  direction = direction === 'f' ? 'r' : 'f';
  resetResult();
  renderControls();
  $('phrase').value = previous ? previous.output : '';
  source = 'typed';
  updateCount();
});

$('phrase').addEventListener('input', () => { source = 'typed'; resetResult(); updateCount(); });
$('translate-form').addEventListener('submit', event => {
  event.preventDefault();
  const response = translate($('phrase').value, mode, direction);
  track('ht_translate', { outcome: response.status, source });
  if (response.status === 'matched') {
    showResult(response.result);
    $('result-title').focus();
  } else {
    resetResult();
    const messages = {
      empty: 'Add a phrase or choose an example below.',
      'too-long': `Keep it to ${MAX_INPUT} characters or fewer.`,
      unmatched: "No curated match for that phrase yet. We won't invent a meaning. Try an example below."
    };
    message(messages[response.status] || 'Choose a mode and try again.');
    if (response.status === 'empty') $('phrase').focus();
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
    renderControls();
    $('phrase').value = parsed.result.input;
    showResult(parsed.result, true);
  } else if (parsed.status === 'invalid') {
    resetResult();
    message('That result link is invalid or from an unsupported version. Choose an example to start again.');
  }
  updateCount();
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
