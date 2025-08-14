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
