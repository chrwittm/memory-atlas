import { render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mapState = vi.hoisted(() => ({
  options: undefined as Record<string, unknown> | undefined,
  removed: false,
  resized: false,
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
    }

    addControl() {}
    easeTo() {}
    getStyle() { return { sources: mapState.sources } }
    refreshTiles(sourceId: string) { mapState.refreshedSources.push(sourceId) }
    resize() { mapState.resized = true }
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
})
