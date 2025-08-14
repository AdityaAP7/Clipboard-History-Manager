import Store from 'electron-store';

const schema = {
  history: {
    type: 'array',
    default: []
  },
  maxItems: {
    type: 'number',
    default: 200
  },
 captureImages: {
    type: 'boolean',
    default: true
  },
  blacklistApps: {
    type: 'array',
    default: [] // e.g., ['KeePass', '1Password']
  }
};
export const store = new Store({ schema });
export function addEntry(entry) {
  const max = store.get('maxItems');
  const history = store.get('history');
  // dedupe by content+type
  const key = `${entry.type}:${entry.text ?? entry.imgHash ?? ''}`;
  const existsIdx = history.findIndex(
    e => `${e.type}:${e.text ?? e.imgHash ?? ''}` === key
  );
  if (existsIdx !== -1) {
    // move to top with updated time
    const [existing] = history.splice(existsIdx, 1);
    existing.timestamp = Date.now();
    history.unshift(existing);
  } else {
    entry.timestamp = Date.now();
    history.unshift(entry);
  }
  if (history.length > max) history.length = max;
  store.set('history', history);
  return history;
}
