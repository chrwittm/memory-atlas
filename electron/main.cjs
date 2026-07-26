const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')

const rendererPath = path.join(__dirname, '..', 'dist', 'index.html')

function openExternalUrl(url) {
  if (url.startsWith('https://') || url.startsWith('http://')) {
    void shell.openExternal(url)
  }
}

function createWindow() {
  const window = new BrowserWindow({
    title: 'Memory Atlas',
    width: 1440,
    height: 960,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#101413',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternalUrl(url)
    return { action: 'deny' }
  })

  window.webContents.on('will-navigate', (event, url) => {
    if (url !== window.webContents.getURL()) {
      event.preventDefault()
      openExternalUrl(url)
    }
  })

  window.once('ready-to-show', () => window.show())
  void window.loadFile(rendererPath)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
