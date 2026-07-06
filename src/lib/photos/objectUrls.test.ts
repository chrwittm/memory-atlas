import { describe, expect, it, vi } from 'vitest'
import { photo } from '../../test/factories'
import { ObjectUrlWindow } from './objectUrls'

describe('ObjectUrlWindow', () => {
  it('preloads neighbors, retains only their URL window, and cleans up on disposal', () => {
    const api = { createObjectURL: vi.fn((file: Blob) => `blob:${(file as File).name}`), revokeObjectURL: vi.fn() }
    const disposed: string[] = []
    const preload = vi.fn((url: string) => ({ dispose: () => disposed.push(url) }))
    const manager = new ObjectUrlWindow(api, preload)
    const photos = ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg'].map((fileName) => photo({ id: fileName, fileName }))

    manager.sync(photos, 0)
    expect(preload).toHaveBeenCalledWith('blob:b.jpg')
    manager.sync(photos, 2)
    expect(preload).toHaveBeenCalledWith('blob:d.jpg')
    expect(disposed).not.toContain('blob:b.jpg')
    expect(api.revokeObjectURL).toHaveBeenCalledWith('blob:a.jpg')
    manager.dispose()
    expect(disposed).toContain('blob:b.jpg')
    expect(disposed).toContain('blob:d.jpg')
    expect(api.revokeObjectURL).toHaveBeenCalledTimes(4)
  })
})
