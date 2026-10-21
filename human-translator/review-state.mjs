import { CATALOG, CATALOG_VERSION } from './catalog.mjs?v=05';

// Export only known content IDs and the reviewer's explicit button choices.
export function reviewExport(choices) {
  return { catalog_version: CATALOG_VERSION,
    decisions: CATALOG.map(pair => ({ id: pair.id,
      decision: ['keep', 'drop'].includes(choices.get(pair.id)) ? choices.get(pair.id) : 'unreviewed' })) };
}
