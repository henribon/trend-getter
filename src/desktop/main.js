import { app, BrowserWindow, dialog, Menu, nativeTheme, Notification, powerMonitor, shell, Tray } from 'electron';
import path from 'node:path';
import { startApp } from '../app.js';
import { DesktopSettingsFile, readDesktopEnv, SETTINGS_FILE_NAME } from './desktop-settings.js';
import { describeRunNotification } from './run-notification.js';

const PAGE_TRIGGER = 'manual';
const SETUP_PAGE = '/setup.html';
const RESUME_DELAY_MS = 15_000;
const TRAY_ICON = path.join(import.meta.dirname, 'icons', 'trayTemplate.png');
const BACKGROUND = Object.freeze({ light: '#f5f7f9', dark: '#0b0e11' });
const isMac = process.platform === 'darwin';

const settingsFile = new DesktopSettingsFile(path.join(app.getPath('userData'), SETTINGS_FILE_NAME));

let localApp = null;
let mainWindow = null;
let tray = null;
let lastNotification = null;
let quitting = false;

async function start() {
  const env = readDesktopEnv({ settingsFile, dataDir: app.getPath('userData') });
  localApp = await startApp(env);
  localApp.job.onRun(handleRun);
  powerMonitor.on('resume', () => setTimeout(() => localApp.resume(), RESUME_DELAY_MS));

  tray = createTray(env);
  mainWindow = createWindow(localApp.url);
  if (isMac && app.getLoginItemSettings().wasOpenedAtLogin) {
    app.dock.hide();
  } else {
    mainWindow.once('ready-to-show', showWindow);
  }
}

function createWindow(url) {
  const window = new BrowserWindow({
    width: 1120,
    height: 820,
    minWidth: 400,
    minHeight: 480,
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? BACKGROUND.dark : BACKGROUND.light,
  });
  window.webContents.setWindowOpenHandler(({ url: target }) => {
    openExternal(target);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, target) => {
    if (new URL(target).origin !== new URL(url).origin) {
      event.preventDefault();
      openExternal(target);
    }
  });
  window.on('close', (event) => {
    if (quitting) {
      return;
    }
    event.preventDefault();
    window.hide();
    app.dock?.hide();
  });
  window.loadURL(url);
  return window;
}

function createTray(env) {
  const icon = new Tray(TRAY_ICON);
  const times = new Intl.ListFormat('pt-BR', { type: 'conjunction' }).format(env.scheduleTimes.map(({ label }) => label));
  icon.setToolTip(app.name);
  icon.setContextMenu(
    Menu.buildFromTemplate([
      { label: `Abrir o ${app.name}`, click: showWindow },
      { type: 'separator' },
      {
        label: `Buscar sozinho às ${times}`,
        type: 'checkbox',
        checked: env.autoSearch,
        click: ({ checked }) => setAutoSearch(checked),
      },
      ...(isMac ? [createLoginItem()] : []),
      { label: 'Configurações avançadas…', click: openSettingsFile },
      { type: 'separator' },
      { label: `Sair do ${app.name}`, role: 'quit' },
    ]),
  );
  return icon;
}

function createLoginItem() {
  return {
    label: 'Abrir ao iniciar o Mac',
    type: 'checkbox',
    checked: app.getLoginItemSettings().openAtLogin,
    click: ({ checked }) => app.setLoginItemSettings({ openAtLogin: checked }),
  };
}

async function showWindow() {
  if (!mainWindow) {
    return;
  }
  await app.dock?.show();
  mainWindow.show();
  app.focus({ steal: true });
}

function handleRun(run, trigger) {
  if (trigger === PAGE_TRIGGER) {
    return;
  }
  if (!mainWindow.webContents.getURL().endsWith(SETUP_PAGE)) {
    mainWindow.webContents.reload();
  }
  notify(describeRunNotification(run));
}

function notify(message) {
  if (!message || !Notification.isSupported()) {
    return;
  }
  lastNotification = new Notification(message);
  lastNotification.on('click', showWindow);
  lastNotification.show();
}

function setAutoSearch(enabled) {
  settingsFile.setAutoSearch(enabled);
  app.relaunch();
  app.quit();
}

async function openSettingsFile() {
  const failure = await shell.openPath(settingsFile.path);
  if (failure) {
    shell.showItemInFolder(settingsFile.path);
  }
}

function openExternal(target) {
  if (['http:', 'https:'].includes(new URL(target).protocol)) {
    shell.openExternal(target);
  }
}

function fail(error) {
  dialog.showErrorBox(`Não foi possível abrir o ${app.name}`, `${error.message}\n\nConfigurações: ${settingsFile.path}`);
  app.exit(1);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);
  app.on('activate', showWindow);
  app.on('before-quit', () => {
    quitting = true;
  });
  app.on('will-quit', () => localApp?.close());
  // Fechar a janela não encerra o app: ele fica na barra de menus para fazer as buscas agendadas.
  app.on('window-all-closed', () => {});
  app.whenReady().then(start).catch(fail);
}
