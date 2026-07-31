const { app, BrowserWindow, dialog, session, shell } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const {
  denyUnexpectedPermissions,
  isSafeExternalUrl,
  reportRendererLoadFailure,
} = require('./security.cjs')

const rendererPath = path.join(__dirname, '..', 'dist', 'index.html')
const rendererUrl = pathToFileURL(rendererPath).href

function openExternalUrl(url) {
  if (isSafeExternalUrl(url)) {
    void shell.openExternal(url).catch((error) => {
      console.error(`Memory Atlas could not open the external URL ${url}.`, error)
    })
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
    if (url === rendererUrl) return
    event.preventDefault()
    openExternalUrl(url)
  })

  window.once('ready-to-show', () => {
    if (!window.isDestroyed()) window.show()
  })
  void window.loadFile(rendererPath).catch((error) => {
    reportRendererLoadFailure(window, dialog, error, rendererPath)
  })
}

app.whenReady().then(() => {
  denyUnexpectedPermissions(session.defaultSession)
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
