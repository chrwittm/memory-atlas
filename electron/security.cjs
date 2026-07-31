const { URL } = require('node:url')

function isSafeExternalUrl(rawUrl) {
  try {
    return new URL(rawUrl).protocol === 'https:'
  } catch {
    return false
  }
}

function denyUnexpectedPermissions(targetSession) {
  targetSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false)
  })
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
