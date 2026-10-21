import { MODES, PAIRS } from './phrases.mjs';

export const MAX_INPUT = 240;
export const isMode = mode => Object.hasOwn(MODES, mode);
export const isDirection = direction => direction === 'f' || direction === 'r';
export const phrasesFor = mode => PAIRS.filter(pair => pair.mode === mode);
export const normalize = text => String(text).normalize('NFKC').toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '').trim();

export function resultFor(pair, direction = 'f') {
  if (!pair || !isDirection(direction)) return null;
  const sides = MODES[pair.mode].sides;
  return { id: pair.id, mode: pair.mode, direction,
    from: sides[direction === 'f' ? 0 : 1], to: sides[direction === 'f' ? 1 : 0],
    input: direction === 'f' ? pair.left : pair.right,
    output: direction === 'f' ? pair.right : pair.left };
}

export function translate(text, mode, direction = 'f') {
  if (!isMode(mode) || !isDirection(direction)) return { status: 'invalid' };
  if (typeof text !== 'string' || !text.trim()) return { status: 'empty' };
  if (text.length > MAX_INPUT) return { status: 'too-long' };
  const pair = phrasesFor(mode).find(item => normalize(direction === 'f' ? item.left : item.right) === normalize(text));
  return pair ? { status: 'matched', result: resultFor(pair, direction) } : { status: 'unmatched' };
}

// The fragment is never sent in HTTP requests. No visitor text is serialized.
export function shareFragment(result) {
  const pair = PAIRS.find(item => item.id === result?.id);
  if (!pair || !isDirection(result.direction)) throw new Error('Only curated results can be shared.');
  return `#v=1&p=${pair.id}&d=${result.direction}&src=share`;
}

export function parseFragment(hash) {
  if (!hash) return { status: 'empty' };
  if (hash.length > 100 || !/^#v=1&p=[cgp]\d{2}&d=[fr]&src=share$/.test(hash)) return { status: 'invalid' };
  const params = new URLSearchParams(hash.slice(1));
  const pair = PAIRS.find(item => item.id === params.get('p'));
  return pair ? { status: 'valid', result: resultFor(pair, params.get('d')) } : { status: 'invalid' };
}

export function shareURL(result, origin) {
  const url = new URL(origin);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid origin');
  return `${url.origin}/human-translator/${shareFragment(result)}`;
}
