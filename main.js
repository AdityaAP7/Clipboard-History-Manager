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
