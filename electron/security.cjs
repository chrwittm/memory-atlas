const { URL } = require('node:url')

function isSafeExternalUrl(rawUrl) {
  try {
    return new URL(rawUrl).protocol === 'https:'
  } catch {
    return false
  }
}

function denyUnexpectedPermissions(targetSession, rendererUrl) {
  targetSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    // Fullscreen is the only permission the viewer needs. Check the exact
    // packaged main frame, not merely the shared file:// origin. Chromium
    // retains its user-gesture requirement; automatic-fullscreen stays denied.
    callback(Boolean(
      rendererUrl && permission === 'fullscreen' &&
      webContents && !webContents.isDestroyed() &&
      webContents.getURL() === rendererUrl &&
      details?.isMainFrame === true && details.requestingUrl === rendererUrl
    ))
  })
  // A negative check routes fullscreen through the request handler above,
  // whose details expose the requesting frame. Other permissions stay denied.
  targetSession.setPermissionCheckHandler(() => false)
  targetSession.setDevicePermissionHandler(() => false)
}

function reportRendererLoadFailure(window, dialog, error, rendererPath) {
  console.error(`Memory Atlas failed to load its packaged renderer at ${rendererPath}.`, error)
  dialog.showErrorBox(
    'Memory Atlas could not start',
    'The application resources are missing or damaged. Reinstall Memory Atlas from a verified disk image.',
  )
  if (!window.isDestroyed()) window.destroy()
}

module.exports = {
  denyUnexpectedPermissions,
  isSafeExternalUrl,
  reportRendererLoadFailure,
}
