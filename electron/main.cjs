const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const isDev = !app.isPackaged;
  
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0a0b10', // Match your theme to prevent white flash
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: true, // Crucial: Throttles timers when minimized
      devTools: isDev,
    },
    titleBarStyle: 'hiddenInset',
    frame: true,
    show: false, // Don't show until ready to prevent stutter
  });

  // Performance optimization: Only show when the content is actually painted
  win.once('ready-to-show', () => {
    win.show();
  });

  const startURL = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  win.loadURL(startURL);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
