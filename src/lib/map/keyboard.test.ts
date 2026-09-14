import { describe, expect, it } from 'vitest'
import { mapCameraCommand } from './keyboard'

describe('map camera keyboard commands', () => {
  it('maps the primary cycle and direct-access modifiers without taking plain Command+Z', () => {
    expect(mapCameraCommand(new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ' }))).toBe('cycle')
    expect(mapCameraCommand(new KeyboardEvent('keydown', { key: 'Z', code: 'KeyZ', shiftKey: true }))).toBe('current')
    expect(mapCameraCommand(new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ', ctrlKey: true }))).toBe('day')
    expect(mapCameraCommand(new KeyboardEvent('keydown', { key: 'Ω', code: 'KeyZ', altKey: true }))).toBe('complete-track')
    expect(mapCameraCommand(new KeyboardEvent('keydown', { key: 'Ω', code: 'KeyY', altKey: true }))).toBe('complete-track')
    expect(mapCameraCommand(new KeyboardEvent('keydown', {
      key: 'Ω', code: 'KeyY', altKey: true, metaKey: true,
    }))).toBe('all-photos')
    expect(mapCameraCommand(new KeyboardEvent('keydown', { key: 'z', metaKey: true }))).toBeUndefined()
  })

  it('ignores repeats, composition, unrelated labeled keys, and mixed modifiers', () => {
    expect(mapCameraCommand(new KeyboardEvent('keydown', { key: 'z', repeat: true }))).toBeUndefined()
    expect(mapCameraCommand(new KeyboardEvent('keydown', { key: 'z', isComposing: true }))).toBeUndefined()
    expect(mapCameraCommand(new KeyboardEvent('keydown', { key: 'y', code: 'KeyZ' }))).toBeUndefined()
    expect(mapCameraCommand(new KeyboardEvent('keydown', { key: 'z', shiftKey: true, ctrlKey: true }))).toBeUndefined()
    expect(mapCameraCommand(new KeyboardEvent('keydown', {
      key: 'z', altKey: true, metaKey: true, shiftKey: true,
    }))).toBeUndefined()
  })
})
