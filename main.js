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
    title: 'メモ',
    show: false,
    skipTaskbar: true
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

  // hide dock icon on macOS so the app behaves like a menubar app
  if (process.platform === 'darwin') {
    try { app.dock.hide(); } catch (e) { /* ignore */ }
  }

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
        // try to position near tray if possible
        try {
          if (appTray) {
            const trayBounds = appTray.getBounds();
            const winBounds = mainWindow.getBounds();
            const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (winBounds.width / 2));
            const y = process.platform === 'darwin'
              ? Math.round(trayBounds.y + trayBounds.height + 4)
              : Math.round(trayBounds.y - winBounds.height - 4);
            mainWindow.setPosition(x, Math.max(0, y));
          }
        } catch (e) { /* ignore */ }
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

let appTray = null;

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
  appTray = tray;
  tray.setToolTip('デスクトップメモ');

  const autoLabel = settings.get('autoLaunch') ? '起動時に自動起動: 有効' : '起動時に自動起動: 無効';
  const contextMenu = Menu.buildFromTemplate([
    { label: '開く', click: () => { showWindowAtTray(); } },
    { type: 'separator' },
    { label: autoLabel, enabled: false },
    { label: '自動起動を切り替える', click: toggleAutoLaunch },
    { type: 'separator' },
    { label: '終了', click: () => { app.quit(); } }
  ]);

  tray.setContextMenu(contextMenu);

  // show/hide and position window near the tray icon
  function showWindowAtTray() {
    try {
      const trayBounds = tray.getBounds();
      const winBounds = mainWindow.getBounds();
      // center horizontally under tray icon
      const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (winBounds.width / 2));
      // position below the tray on macOS, above on windows/linux if needed
      const y = process.platform === 'darwin'
        ? Math.round(trayBounds.y + trayBounds.height + 4)
        : Math.round(trayBounds.y - winBounds.height - 4);

      mainWindow.setPosition(x, Math.max(0, y));
    } catch (e) {
      // fallback
    }

    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  }

  tray.on('click', () => {
    showWindowAtTray();
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
    const newLabel = next ? '起動時に自動起動: 有効' : '起動時に自動起動: 無効';
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: '開く', click: () => { showWindowAtTray(); } },
      { type: 'separator' },
      { label: newLabel, enabled: false },
      { label: '自動起動を切り替える', click: toggleAutoLaunch },
      { type: 'separator' },
      { label: '終了', click: () => { app.quit(); } }
    ]));
  }
}
app.on('will-quit', () => {
  try { globalShortcut.unregisterAll(); } catch (e) { /* ignore */ }
  try { if (appTray && typeof appTray.destroy === 'function') appTray.destroy(); } catch (e) { /* ignore */ }
});
