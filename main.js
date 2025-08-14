import { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage, clipboard, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { store, addEntry } from './store.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
