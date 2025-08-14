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
