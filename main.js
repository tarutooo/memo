const { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const settings = require('./settings');

function createWindow() {
  const win = new BrowserWindow({
    width: 480,
    height: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'メモ'
  });

  win.loadFile('index.html');
  //win.webContents.openDevTools();
  return win;
}

app.whenReady().then(() => {
  // load or create settings
  settings.init();

  // create main window
  const mainWindow = createWindow();

  // create tray
  createTray(mainWindow);

  // apply auto-launch setting
  try {
    app.setLoginItemSettings({ openAtLogin: !!settings.get('autoLaunch') });
  } catch (e) {
    console.warn('setLoginItemSettings not available:', e.message);
  }

  // register global shortcut (Cmd/Ctrl+Alt+M)
  const shortcut = 'CommandOrControl+Alt+M';
  try {
    globalShortcut.register(shortcut, () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (e) {
    console.warn('globalShortcut failed to register:', e.message);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // macOS では Cmd+Q で明示終了するまではアプリを残す挙動が一般的
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // allow close handlers to see that we're quitting
  app.quitting = true;
});

function createTray(mainWindow) {
  // simple SVG icon as data URL for cross-platform convenience
  const svg = `data:image/svg+xml;utf8,` + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">' +
    '<rect rx="3" ry="3" width="20" height="16" x="2" y="4" fill="%23007aff"/>' +
    '<path d="M6 8h12v2H6zM6 11h12v2H6z" fill="white"/></svg>'
  );

  let trayIcon = nativeImage.createFromDataURL(svg);
  trayIcon = trayIcon.resize({ width: 16, height: 16 });

  const tray = new Tray(trayIcon);
  tray.setToolTip('デスクトップメモ');

  const contextMenu = Menu.buildFromTemplate([
    { label: '開く', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { type: 'separator' },
    { label: () => (settings.get('autoLaunch') ? '起動時に自動起動: 有効' : '起動時に自動起動: 無効'), enabled: false },
    { label: '自動起動を切り替える', click: toggleAutoLaunch },
    { type: 'separator' },
    { label: '終了', click: () => { app.quit(); } }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) mainWindow.hide(); else { mainWindow.show(); mainWindow.focus(); }
  });

  // intercept window close: hide to tray instead of quitting
  mainWindow.on('close', (e) => {
    if (!app.quitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  function toggleAutoLaunch() {
    const current = !!settings.get('autoLaunch');
    const next = !current;
    settings.set('autoLaunch', next);
    try {
      app.setLoginItemSettings({ openAtLogin: next });
    } catch (e) {
      console.warn('setLoginItemSettings failed:', e.message);
    }
    // rebuild menu to reflect change
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: '開く', click: () => { mainWindow.show(); mainWindow.focus(); } },
      { type: 'separator' },
      { label: next ? '起動時に自動起動: 有効' : '起動時に自動起動: 無効', enabled: false },
      { label: '自動起動を切り替える', click: toggleAutoLaunch },
      { type: 'separator' },
      { label: '終了', click: () => { app.quit(); } }
    ]));
  }
}
