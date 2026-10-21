import { isMode, isDirection } from './engine.mjs';

const EVENTS = new Set(['ht_visit', 'ht_shared_visit', 'ht_mode_change', 'ht_translate', 'ht_copy_text',
  'ht_copy_link', 'ht_share_open', 'ht_share_handoff', 'ht_share_cancel', 'ht_rme_click']);
const ALLOWED = {
  outcome: new Set(['matched', 'unmatched', 'empty', 'too-long']),
  source: new Set(['typed', 'example', 'shared']),
  destination: new Set(['product', 'play'])
};

// No raw text, IDs for people, URLs, clipboard contents, or arbitrary properties.
export function eventProperties(data = {}) {
  const properties = { product: 'human_translator', version: '0.1' };
  if (isMode(data.mode)) properties.mode = data.mode;
  if (isDirection(data.direction)) properties.direction = data.direction;
  for (const [key, values] of Object.entries(ALLOWED)) {
    if (values.has(data[key])) properties[key] = data[key];
  }
  return properties;
}

export function createAnalytics({ window: win, navigator: nav }) {
  const ready = () => {
    if (win.location.hostname !== 'synapseworks.org' || nav.globalPrivacyControl === true
      || nav.doNotTrack === '1' || win.doNotTrack === '1') return false;
    const zaraz = win.zaraz;
    if (!zaraz?.consent?.APIReady || typeof zaraz.track !== 'function') return false;
    // Resolve the live purpose by its explicit name; do not guess a vendor purpose ID.
    const purposes = Object.entries(zaraz.consent.purposes || {})
      .filter(([, purpose]) => (typeof purpose.name === 'string' ? purpose.name : purpose.name?.en) === 'Analytics');
    return purposes.length === 1 && zaraz.consent.get(purposes[0][0]) === true;
  };
  return {
    ready,
    track(name, data) {
      if (!EVENTS.has(name)) return false;
      try {
        if (!ready()) return false;
        const pending = win.zaraz.track(name, eventProperties(data));
        if (pending?.catch) pending.catch(() => {});
        return true;
      } catch { return false; }
    }
  };
}
