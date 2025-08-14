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
function makeSignature({ text, imageBuf }) {
  if (text) return `text:${text}`;
  if (imageBuf) return `img:${hashBuffer(imageBuf)}`;
  return 'unknown';
}
function startClipboardWatcher() {
  stopClipboardWatcher(); // safety

  const POLL_MS = 700;
  watcherInterval = setInterval(() => {
    try {
      // Prefer text; if none and images allowed, try image
      const text = clipboard.readText().trim();
      let imageBuf = null;
      if (!text && store.get('captureImages')) {
        const img = clipboard.readImage();
        imageBuf = img && !img.isEmpty() ? Buffer.from(img.toPNG()) : null;
      }

      if (!text && !imageBuf) return;

      const sig = makeSignature({ text, imageBuf });
      if (sig === lastClipboardSignature) return;
      lastClipboardSignature = sig;

      // Optional: ignore blacklisted apps — Electron can’t directly fetch source app reliably cross-OS, so you can add heuristics later.

      let entry;
      if (text) {
        entry = {
          type: 'text',
          text,
          preview: text.length > 200 ? text.slice(0, 200) + '…' : text
        };
      } else if (imageBuf) {
        entry = {
          type: 'image',
          imgHash: hashBuffer(imageBuf),
          // store a small data URL preview to keep store size reasonable
          preview: 'data:image/png;base64,' + imageBuf.toString('base64').slice(0, 100000)
        };
      }

      const history = addEntry(entry);
      if (win && !win.isDestroyed()) win.webContents.send('history:updated', history);
    } catch (e) {
      // swallow; avoid crashing
      console.error('Clipboard watcher error:', e);
    }
  }, POLL_MS);
}

function stopClipboardWatcher() {
  if (watcherInterval) clearInterval(watcherInterval);
  watcherInterval = null;
}

app.whenReady().then(() => {
  createWindow();
  setupTray();
  startClipboardWatcher();

  // Global shortcut: open/close (Ctrl/Cmd+Shift+V)
  const shortcut = process.platform === 'darwin' ? 'Command+Shift+V' : 'Control+Shift+V';
  globalShortcut.register(shortcut, toggleWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  stopClipboardWatcher();
});

ipcMain.handle('history:get', () => store.get('history'));
ipcMain.on('history:clear', (e) => {
  store.set('history', []);
  e.sender.send('history:updated', []);
});
ipcMain.on('history:copy', (e, item) => {
  if (item.type === 'text') clipboard.writeText(item.text);
  // If image support is expanded to store full buffer, writeImage here
});
ipcMain.on('open:link', (e, url) => shell.openExternal(url));
