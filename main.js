import { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage, clipboard, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { store, addEntry } from './store.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let win, tray, watcherInterval, lastClipboardSignature;
function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 720,
    minHeight: 420,
    show: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => win.show());
}
function setupTray() {
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'trayTemplate.png'));
  tray = new Tray(trayIcon);
  const ctx = Menu.buildFromTemplate([
    { label: 'Show/Hide', click: toggleWindow },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' }
  ]);
  tray.setToolTip('Clipboard Manager');
  tray.setContextMenu(ctx);
  tray.on('click', toggleWindow);
}
function toggleWindow() {
  if (!win) return;
  if (win.isVisible()) win.hide();
  else {
    win.show();
    win.focus();
  }
}
function hashBuffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}
