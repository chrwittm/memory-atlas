import { createRequire } from 'node:module'
import { describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const {
  denyUnexpectedPermissions,
  isSafeExternalUrl,
  reportRendererLoadFailure,
}: {
  denyUnexpectedPermissions: (targetSession: {
    setPermissionRequestHandler: (handler: (...args: never[]) => void) => void
    setPermissionCheckHandler: (handler: (...args: never[]) => boolean) => void
    setDevicePermissionHandler: (handler: (...args: never[]) => boolean) => void
  }, rendererUrl?: string) => void
  isSafeExternalUrl: (url: string) => boolean
  reportRendererLoadFailure: (
    window: { isDestroyed: () => boolean; destroy: () => void },
    dialog: { showErrorBox: (title: string, content: string) => void },
    error: unknown,
    rendererPath: string,
  ) => void
} = require('./security.cjs')

describe('Electron security boundary', () => {
  it('permits only valid HTTPS URLs to leave the application', () => {
    expect(isSafeExternalUrl('https://www.openstreetmap.org/copyright')).toBe(true)
    expect(isSafeExternalUrl('http://example.com')).toBe(false)
    expect(isSafeExternalUrl('file:///tmp/example')).toBe(false)
    expect(isSafeExternalUrl('not a URL')).toBe(false)
  })

  it('denies permission requests, permission checks, and device permissions', () => {
    let requestHandler: ((...args: never[]) => void) | undefined
    let checkHandler: ((...args: never[]) => boolean) | undefined
    let deviceHandler: ((...args: never[]) => boolean) | undefined
    const targetSession = {
      setPermissionRequestHandler: vi.fn((handler) => { requestHandler = handler }),
      setPermissionCheckHandler: vi.fn((handler) => { checkHandler = handler }),
      setDevicePermissionHandler: vi.fn((handler) => { deviceHandler = handler }),
    }

    denyUnexpectedPermissions(targetSession)

    const callback = vi.fn()
    requestHandler?.(undefined as never, 'camera' as never, callback as never)
    expect(callback).toHaveBeenCalledWith(false)
    expect(checkHandler?.()).toBe(false)
    expect(deviceHandler?.()).toBe(false)
  })

  it('allows fullscreen only for the exact live packaged main frame', () => {
    let requestHandler: ((...args: never[]) => void) | undefined
    const targetSession = {
      setPermissionRequestHandler: vi.fn((handler) => { requestHandler = handler }),
      setPermissionCheckHandler: vi.fn(),
      setDevicePermissionHandler: vi.fn(),
    }
    const url = 'file:///app/dist/index.html'
    const contents = { getURL: () => url, isDestroyed: () => false }
    const details = { requestingUrl: url, isMainFrame: true }
    denyUnexpectedPermissions(targetSession, url)
    const request = (permission: string, wc: unknown = contents, frame: unknown = details) => {
      const callback = vi.fn()
      requestHandler?.(wc as never, permission as never, callback as never, frame as never)
      return callback.mock.calls[0]?.[0]
    }
    expect(request('fullscreen')).toBe(true)
    for (const permission of ['automatic-fullscreen', 'camera', 'media', 'geolocation', 'notifications', 'clipboard-read']) {
      expect(request(permission)).toBe(false)
    }
    expect(request('fullscreen', null)).toBe(false)
    expect(request('fullscreen', { ...contents, isDestroyed: () => true })).toBe(false)
    expect(request('fullscreen', { ...contents, getURL: () => 'https://example.com' })).toBe(false)
    expect(request('fullscreen', contents, { ...details, isMainFrame: false })).toBe(false)
    expect(request('fullscreen', contents, { ...details, requestingUrl: 'file:///other.html' })).toBe(false)
    expect(request('fullscreen', contents, {})).toBe(false)
  })

  it('surfaces renderer load failure and closes the hidden unusable window', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const window = { isDestroyed: vi.fn(() => false), destroy: vi.fn() }
    const dialog = { showErrorBox: vi.fn() }

    reportRendererLoadFailure(window, dialog, new Error('Missing index.html'), '/app/dist/index.html')

    expect(dialog.showErrorBox).toHaveBeenCalledWith(
      'Memory Atlas could not start',
      expect.stringContaining('missing or damaged'),
    )
    expect(window.destroy).toHaveBeenCalledOnce()
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('/app/dist/index.html'),
      expect.any(Error),
    )
    consoleError.mockRestore()
  })
})
