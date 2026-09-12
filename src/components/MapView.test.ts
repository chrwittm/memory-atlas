import { render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mapState = vi.hoisted(() => ({
  options: undefined as Record<string, unknown> | undefined,
  removed: false,
  resized: false,
  panOffsets: [] as Array<[number, number]>,
  zoomedIn: 0,
  zoomedOut: 0,
  refreshedSources: [] as string[],
  sources: {
    basemap: { type: 'vector' },
    labels: { type: 'vector' },
  } as Record<string, unknown>,
  listeners: {} as Record<string, Array<(event: { error?: Error }) => void>>,
}))

vi.mock('maplibre-gl', () => {
  class Map {
    constructor(options: Record<string, unknown>) {
      mapState.options = options
      const container = options.container as HTMLElement
      const canvas = document.createElement('canvas')
      canvas.tabIndex = 0
      container.append(canvas)
      const button = document.createElement('button')
      button.tabIndex = 0
      container.append(button)
      const attribution = document.createElement('a')
      attribution.href = 'https://example.com'
      attribution.tabIndex = 0
      container.append(attribution)
    }

    addControl() {}
    easeTo() {}
    getStyle() { return { sources: mapState.sources } }
    refreshTiles(sourceId: string) { mapState.refreshedSources.push(sourceId) }
    resize() { mapState.resized = true }
    panBy(offset: [number, number]) { mapState.panOffsets.push(offset) }
    zoomIn() { mapState.zoomedIn += 1 }
    zoomOut() { mapState.zoomedOut += 1 }
    remove() { mapState.removed = true }
    on(event: string, callback: (event: { error?: Error }) => void) {
      mapState.listeners[event] ??= []
      mapState.listeners[event].push(callback)
      if (event === 'load') queueMicrotask(() => callback({}))
    }
  }

  class Marker {
    setLngLat() { return this }
    addTo() { return this }
  }

  class NavigationControl {}

  return { Map, Marker, NavigationControl, setWorkerUrl: vi.fn() }
})

import MapView from './MapView.svelte'

describe('MapView', () => {
  beforeEach(() => {
    mapState.options = undefined
    mapState.removed = false
    mapState.resized = false
    mapState.panOffsets = []
    mapState.zoomedIn = 0
    mapState.zoomedOut = 0
    mapState.refreshedSources = []
    mapState.listeners = {}
  })

  it('constructs the map immediately and clears the loading state on load', async () => {
    const view = render(MapView, { location: { latitude: 47.456215, longitude: 10.99310432 } })

    expect(mapState.options).toMatchObject({
      center: [10.99310432, 47.456215],
      zoom: 15,
    })
    const container = document.querySelector('.map-canvas') as HTMLElement
    expect(container.style.position).toBe('absolute')
    expect(container.style.width).toBe('100%')
    expect(container.style.height).toBe('100%')
    await waitFor(() => expect(screen.queryByText('Opening map…')).not.toBeInTheDocument())

    view.unmount()
    expect(mapState.removed).toBe(true)
  })

  it('requests a source refresh on the online event and removes the listener on unmount', async () => {
    const view = render(MapView, { location: { latitude: 47.456215, longitude: 10.99310432 } })
    await waitFor(() => expect(screen.queryByText('Opening map…')).not.toBeInTheDocument())

    for (const listener of mapState.listeners.error ?? []) {
      listener({ error: new Error('Tile request failed while offline.') })
    }
    window.dispatchEvent(new Event('online'))

    expect(mapState.refreshedSources).toEqual(['basemap', 'labels'])

    view.unmount()
    window.dispatchEvent(new Event('online'))
    expect(mapState.refreshedSources).toEqual(['basemap', 'labels'])
  })

  it('excludes embedded controls from sequential focus and exposes map keyboard commands', async () => {
    let keyboardHandler: ((event: KeyboardEvent) => boolean) | undefined
    const view = render(MapView, {
      location: { latitude: 47.456215, longitude: 10.99310432 },
      onKeyboardHandlerChange: (handler) => { keyboardHandler = handler },
    })

    expect(keyboardHandler).toBeTypeOf('function')
    for (const element of view.container.querySelectorAll('canvas, button, a')) {
      expect(element).toHaveAttribute('tabindex', '-1')
    }

    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))).toBe(true)
    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: 'ArrowDown' }))).toBe(true)
    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: '+' }))).toBe(true)
    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: '-' }))).toBe(true)
    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: 'Home' }))).toBe(false)
    expect(mapState.panOffsets).toEqual([[100, 0], [0, -100]])
    expect(mapState.zoomedIn).toBe(1)
    expect(mapState.zoomedOut).toBe(1)

    view.unmount()
    expect(keyboardHandler).toBeUndefined()
  })
})
