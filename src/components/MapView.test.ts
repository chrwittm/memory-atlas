import { render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { photo } from '../test/factories'

const mapState = vi.hoisted(() => ({
  options: undefined as Record<string, unknown> | undefined,
  removed: false,
  resized: false,
  panOffsets: [] as Array<[number, number]>,
  zoomedIn: 0,
  zoomedOut: 0,
  refreshedSources: [] as string[],
  sources: {} as Record<string, {
    data?: unknown
    options?: Record<string, unknown>
    setData: ReturnType<typeof vi.fn>
    getClusterExpansionZoom?: ReturnType<typeof vi.fn>
  }>,
  layers: [] as Array<Record<string, unknown>>,
  eases: [] as Array<Record<string, unknown>>,
  fittedBounds: [] as Array<{ bounds: unknown; options: Record<string, unknown> }>,
  listeners: {} as Record<string, Array<(event: any) => void>>,
  markerElements: [] as HTMLElement[],
}))

vi.mock('maplibre-gl', () => {
  class Map {
    constructor(options: Record<string, unknown>) {
      mapState.options = options
      const container = options.container as HTMLElement
      for (const element of [document.createElement('canvas'), document.createElement('button'), document.createElement('a')]) {
        element.tabIndex = 0
        container.append(element)
      }
    }
    addControl() {}
    addSource(id: string, source: Record<string, unknown>) {
      mapState.sources[id] = {
        data: source.data,
        options: source,
        setData: vi.fn((data) => { mapState.sources[id].data = data }),
        getClusterExpansionZoom: vi.fn(async () => 12),
      }
    }
    addLayer(layer: Record<string, unknown>) { mapState.layers.push(layer) }
    getSource(id: string) { return mapState.sources[id] }
    easeTo(options: Record<string, unknown>) { mapState.eases.push(options) }
    fitBounds(bounds: unknown, options: Record<string, unknown>) { mapState.fittedBounds.push({ bounds, options }) }
    getStyle() { return { sources: { basemap: {}, labels: {} } } }
    refreshTiles(sourceId: string) { mapState.refreshedSources.push(sourceId) }
    resize() { mapState.resized = true }
    panBy(offset: [number, number]) { mapState.panOffsets.push(offset) }
    zoomIn() { mapState.zoomedIn += 1 }
    zoomOut() { mapState.zoomedOut += 1 }
    remove() { mapState.removed = true }
    on(event: string, layerOrCallback: string | ((event: any) => void), callback?: (event: any) => void) {
      const key = callback ? `${event}:${layerOrCallback}` : event
      const listener = callback || layerOrCallback as (event: any) => void
      mapState.listeners[key] ??= []
      mapState.listeners[key].push(listener)
      if (event === 'load' && !callback) queueMicrotask(() => listener({}))
    }
  }

  class Marker {
    element: HTMLElement
    constructor(options: { element: HTMLElement }) { this.element = options.element; mapState.markerElements.push(options.element) }
    setLngLat() { return this }
    addTo() { return this }
    remove() {}
  }
  class NavigationControl {}
  return { Map, Marker, NavigationControl, setWorkerUrl: vi.fn() }
})

import MapView from './MapView.svelte'

const locatedPhotos = [
  photo({ id: 'one', fileName: '1.jpg', location: { latitude: 47.4, longitude: 10.9 } }),
  photo({ id: 'two', fileName: '2.jpg', location: { latitude: 48.1, longitude: 11.5 } }),
]

describe('MapView', () => {
  beforeEach(() => {
    Object.assign(mapState, {
      options: undefined, removed: false, resized: false, panOffsets: [], zoomedIn: 0, zoomedOut: 0,
      refreshedSources: [], sources: {}, layers: [], eases: [], listeners: {}, markerElements: [],
      fittedBounds: [],
    })
  })

  it('renders current-photo mode with one selected pin and close zoom', async () => {
    const view = render(MapView, {
      photos: locatedPhotos, currentIndex: 0, tracks: [], mode: 'current', onSelectPhoto: vi.fn(),
    })
    expect(mapState.options).toMatchObject({ center: [10.9, 47.4], zoom: 15 })
    await waitFor(() => expect(screen.queryByText('Opening map…')).not.toBeInTheDocument())
    expect(mapState.markerElements.at(-1)).toHaveAccessibleName('Current photo: 1.jpg')
    const photoData = mapState.sources['memory-photos'].data as { features: unknown[] }
    expect(photoData.features).toHaveLength(0)
    view.unmount()
    expect(mapState.removed).toBe(true)
  })

  it('renders all coordinate groups, clusters them, and selects deterministic duplicate members', async () => {
    const onSelectPhoto = vi.fn()
    const photos = [...locatedPhotos, photo({ id: 'same', fileName: '3.jpg', location: locatedPhotos[0].location })]
    const view = render(MapView, { photos, currentIndex: 0, tracks: [], mode: 'all', onSelectPhoto })
    await waitFor(() => expect(screen.queryByText('Opening map…')).not.toBeInTheDocument())

    const sourceData = mapState.sources['memory-photos'].data as { features: Array<{ properties: { exactCount: number } }> }
    expect(sourceData.features.map((feature) => feature.properties.exactCount)).toEqual([2, 1])
    expect(mapState.sources['memory-photos'].options).toMatchObject({ cluster: true, clusterMaxZoom: 17 })
    expect(mapState.layers.map((layer) => layer.id)).toEqual([
      'track-casing', 'tracks', 'photo-clusters', 'photo-cluster-count', 'photo-points', 'photo-group-count',
    ])
    mapState.markerElements.at(-1)?.click()
    expect(onSelectPhoto).toHaveBeenCalledWith(2)
    await mapState.listeners['click:photo-clusters'][0]({
      features: [{ geometry: { type: 'Point', coordinates: [10.95, 47.5] }, properties: { cluster_id: 7 } }],
    })
    expect(mapState.sources['memory-photos'].getClusterExpansionZoom).toHaveBeenCalledWith(7)
    expect(mapState.eases.at(-1)).toMatchObject({ center: [10.95, 47.5], zoom: 12 })

    mapState.listeners['click:photo-points'][0]({
      features: [{ properties: { photoIndices: JSON.stringify([1]) } }],
    })
    expect(onSelectPhoto).toHaveBeenCalledWith(1)

    view.unmount()
  })

  it('keeps the camera across mode changes and follows the current scope without resetting zoom', async () => {
    const props = { photos: locatedPhotos, currentIndex: 0, tracks: [], mode: 'current' as const, onSelectPhoto: vi.fn() }
    const view = render(MapView, props)
    await waitFor(() => expect(screen.queryByText('Opening map…')).not.toBeInTheDocument())
    expect(mapState.eases).toHaveLength(0)

    await view.rerender({ ...props, mode: 'all' })
    expect(mapState.eases).toHaveLength(0)

    await view.rerender({ ...props, currentIndex: 1, mode: 'all' })
    expect(mapState.eases.at(-1)).toMatchObject({ center: [11.5, 48.1], duration: 500 })
    expect(mapState.eases.at(-1)).not.toHaveProperty('zoom')
    const movementsAfterAllPhotos = mapState.eases.length

    await view.rerender({ ...props, currentIndex: 1, mode: 'track' })
    expect(mapState.eases).toHaveLength(movementsAfterAllPhotos)

    await view.rerender({ ...props, currentIndex: 0, mode: 'track' })
    expect(mapState.eases.at(-1)).toMatchObject({ center: [10.9, 47.4], duration: 500 })
    expect(mapState.eases.at(-1)).not.toHaveProperty('zoom')
    view.unmount()
  })

  it('keeps GPX segments separate below markers and exposes map keyboard commands', async () => {
    let keyboardHandler: ((event: KeyboardEvent) => boolean) | undefined
    const view = render(MapView, {
      photos: locatedPhotos,
      currentIndex: 0,
      mode: 'track',
      tracks: [{ id: 'route', fileName: 'route.gpx', originalIndex: 2, documentIndex: 0,
        segments: [[[10.8, 47.3], [10.9, 47.4]], [[11.1, 47.6], [11.2, 47.7]]] }],
      onSelectPhoto: vi.fn(),
      onKeyboardHandlerChange: (handler) => { keyboardHandler = handler },
    })
    await waitFor(() => expect(screen.queryByText('Opening map…')).not.toBeInTheDocument())
    const trackData = mapState.sources['memory-tracks'].data as { features: unknown[] }
    expect(trackData.features).toHaveLength(2)
    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))).toBe(true)
    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: '+' }))).toBe(true)
    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: '-' }))).toBe(true)
    expect(mapState.panOffsets).toEqual([[100, 0]])
    expect(mapState.zoomedIn).toBe(1)
    expect(mapState.zoomedOut).toBe(1)
    for (const element of view.container.querySelectorAll('canvas, button, a')) expect(element).toHaveAttribute('tabindex', '-1')

    window.dispatchEvent(new Event('online'))
    expect(mapState.refreshedSources).toEqual(['basemap', 'labels'])
    view.unmount()
    expect(keyboardHandler).toBeUndefined()
  })

  it('cycles named camera scopes, supports direct access, and preserves the active G mode', async () => {
    let keyboardHandler: ((event: KeyboardEvent) => boolean) | undefined
    let scopeSelector: ((scopeId: string) => void) | undefined
    let scopeOptions: Array<{ id: string; group: string; label: string }> = []
    const statuses: string[] = []
    const scopePhotos = [
      photo({ id: 'current', fileName: 'current.jpg', capturedLocalDate: '2026-06-20',
        location: { latitude: 40.49, longitude: -121.42 } }),
      photo({ id: 'day', fileName: 'day.jpg', capturedLocalDate: '2026-06-20',
        location: { latitude: 40.55, longitude: -121.3 } }),
      photo({ id: 'nearby', fileName: 'nearby.jpg', capturedLocalDate: '2026-06-22',
        location: { latitude: 39.5, longitude: -120.5 } }),
    ]
    const tracks = [{ id: 'route', fileName: 'route.gpx', originalIndex: 0, documentIndex: 0,
      segments: [[[-121.5, 40.4] as [number, number], [-120, 39] as [number, number]]] }]
    const props = {
      photos: scopePhotos, currentIndex: 0, mode: 'all' as const, tracks, onSelectPhoto: vi.fn(),
      onCameraStatus: (message: string) => statuses.push(message),
      onCameraScopesChange: (scopes: typeof scopeOptions) => { scopeOptions = scopes },
      onCameraScopeSelectorChange: (selector: typeof scopeSelector) => { scopeSelector = selector },
      onKeyboardHandlerChange: (handler: typeof keyboardHandler) => { keyboardHandler = handler },
    }
    const view = render(MapView, props)
    await waitFor(() => expect(screen.queryByText('Opening map…')).not.toBeInTheDocument())
    const canvas = view.container.querySelector('.map-canvas')!
    Object.defineProperties(canvas, {
      clientWidth: { configurable: true, value: 800 },
      clientHeight: { configurable: true, value: 600 },
    })

    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: 'z' }))).toBe(true)
    expect(statuses.at(-1)).toBe('Map view: Day')
    expect(mapState.fittedBounds.at(-1)?.bounds).toEqual([[-121.42, 40.49], [-121.3, 40.55]])
    expect(mapState.fittedBounds.at(-1)?.options).toMatchObject({
      maxZoom: 15,
      duration: 500,
      padding: { top: 48, right: 64, bottom: 48, left: 64 },
    })

    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: 'Z', shiftKey: true }))).toBe(true)
    expect(statuses.at(-1)).toBe('Map view: Current photo')
    expect(mapState.eases.at(-1)).toMatchObject({ center: [-121.42, 40.49], zoom: 15 })

    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }))).toBe(true)
    expect(statuses.at(-1)).toBe('Map view: Day')

    expect(keyboardHandler?.(new KeyboardEvent('keydown', {
      key: 'Ω', code: 'KeyY', altKey: true, metaKey: true,
    }))).toBe(true)
    expect(statuses.at(-1)).toBe('Map view: All photos')

    const movements = mapState.eases.length + mapState.fittedBounds.length
    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: 'z', metaKey: true }))).toBe(false)
    expect(mapState.eases.length + mapState.fittedBounds.length).toBe(movements)
    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: 'Ω', code: 'KeyY', altKey: true }))).toBe(true)
    expect(statuses.at(-1)).toBe('Complete track view requires Photos + GPX track')

    const movementsBeforeModeChange = mapState.eases.length + mapState.fittedBounds.length
    await view.rerender({ ...props, mode: 'track' })
    expect(mapState.eases.length + mapState.fittedBounds.length).toBe(movementsBeforeModeChange)
    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: 'Ω', code: 'KeyY', altKey: true }))).toBe(true)
    expect(statuses.at(-1)).toBe('Map view: Complete track')
    expect(mapState.fittedBounds.at(-1)?.bounds).toEqual([[-121.5, 39], [-120, 40.4]])

    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: 'z' }))).toBe(true)
    expect(statuses.at(-1)).toBe('Map view: All photos')
    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: 'z' }))).toBe(true)
    expect(statuses.at(-1)).toBe('Map view: Current photo')

    const park = scopeOptions.find(({ label }) => label === 'Lassen Volcanic National Park')
    expect(park).toMatchObject({ group: 'place' })
    scopeSelector?.(park!.id)
    expect(statuses.at(-1)).toBe('Map view: Lassen Volcanic National Park')
    expect(keyboardHandler?.(new KeyboardEvent('keydown', { key: 'z' }))).toBe(true)
    expect(statuses.at(-1)).toBe('Map view: Current photo')
    view.unmount()
    expect(scopeSelector).toBeUndefined()
    expect(scopeOptions).toEqual([])
  })

  it('keeps fitted track content clear of visible map overlays', async () => {
    let keyboardHandler: ((event: KeyboardEvent) => boolean) | undefined
    const view = render(MapView, {
      photos: [photo({ id: 'current', location: { latitude: 38, longitude: -122 } })],
      currentIndex: 0,
      mode: 'track',
      tracks: [{ id: 'route', fileName: 'route.gpx', originalIndex: 0, documentIndex: 0,
        segments: [[[-121, 40] as [number, number], [-120, 42] as [number, number]]] }],
      onSelectPhoto: vi.fn(),
      onKeyboardHandlerChange: (handler) => { keyboardHandler = handler },
    })
    await waitFor(() => expect(screen.queryByText('Opening map…')).not.toBeInTheDocument())

    const panel = view.container.querySelector('.map-panel') as HTMLElement
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600,
      toJSON: () => ({}),
    })
    const overlays = [
      { className: 'map-mode-bar', rect: { left: 12, top: 12, right: 280, bottom: 112 } },
      { className: 'map-legend', rect: { left: 12, top: 532, right: 300, bottom: 588 } },
      { className: 'maplibregl-ctrl-attrib', rect: { left: 430, top: 548, right: 788, bottom: 588 } },
      { className: 'maplibregl-ctrl-group', rect: { left: 740, top: 450, right: 788, bottom: 530 } },
    ]
    for (const overlay of overlays) {
      const element = document.createElement('div')
      element.className = overlay.className
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        x: overlay.rect.left,
        y: overlay.rect.top,
        ...overlay.rect,
        width: overlay.rect.right - overlay.rect.left,
        height: overlay.rect.bottom - overlay.rect.top,
        toJSON: () => ({}),
      })
      panel.append(element)
    }

    keyboardHandler?.(new KeyboardEvent('keydown', { key: 'Ω', code: 'KeyY', altKey: true }))
    expect(mapState.fittedBounds.at(-1)?.bounds).toEqual([[-121, 40], [-120, 42]])
    expect(mapState.fittedBounds.at(-1)?.options.padding).toEqual({
      top: 136,
      right: 84,
      bottom: 92,
      left: 48,
    })
    view.unmount()
  })

  it('keeps the scope cursor through manual movement and falls back after leaving a geographic area', async () => {
    let keyboardHandler: ((event: KeyboardEvent) => boolean) | undefined
    let scopeSelector: ((scopeId: string) => void) | undefined
    let scopeOptions: Array<{ id: string; group: string; label: string }> = []
    const statuses: string[] = []
    const scopeLabels: Array<string | undefined> = []
    const scopePhotos = [
      photo({ id: 'lassen', location: { latitude: 40.49, longitude: -121.42 } }),
      photo({ id: 'california', location: { latitude: 38.58, longitude: -121.49 } }),
      photo({ id: 'oregon', location: { latitude: 44, longitude: -120.5 } }),
      photo({ id: 'unlocated' }),
    ]
    const props = {
      photos: scopePhotos, currentIndex: 0, mode: 'all' as const, tracks: [], onSelectPhoto: vi.fn(),
      onCameraStatus: (message: string) => statuses.push(message),
      onCameraScopeChange: (label: string | undefined) => scopeLabels.push(label),
      onCameraScopesChange: (scopes: typeof scopeOptions) => { scopeOptions = scopes },
      onCameraScopeSelectorChange: (selector: typeof scopeSelector) => { scopeSelector = selector },
      onKeyboardHandlerChange: (handler: typeof keyboardHandler) => { keyboardHandler = handler },
    }
    const view = render(MapView, props)
    await waitFor(() => expect(screen.queryByText('Opening map…')).not.toBeInTheDocument())
    scopeSelector?.(scopeOptions.find(({ label }) => label === 'Lassen Volcanic National Park')!.id)
    expect(statuses.at(-1)).toBe('Map view: Lassen Volcanic National Park')
    expect(scopeLabels.at(-1)).toBe('Lassen Volcanic National Park')
    keyboardHandler?.(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))

    await view.rerender({ ...props, currentIndex: 1 })
    expect(scopeLabels.at(-1)).toBe('Current photo')
    expect(mapState.eases.at(-1)).toMatchObject({ center: [-121.49, 38.58], duration: 500 })
    expect(mapState.eases.at(-1)).not.toHaveProperty('zoom')

    scopeSelector?.(scopeOptions.find(({ label }) => label === 'California')!.id)
    expect(statuses.at(-1)).toBe('Map view: California')

    const fitsBeforeStateChange = mapState.fittedBounds.length
    await view.rerender({ ...props, currentIndex: 2 })
    expect(scopeLabels.at(-1)).toBe('Oregon')
    expect(mapState.fittedBounds).toHaveLength(fitsBeforeStateChange + 1)

    keyboardHandler?.(new KeyboardEvent('keydown', { key: 'z' }))
    expect(statuses.at(-1)).toBe('Map view: Current photo')

    const movementsBeforeUnlocatedSelection = mapState.eases.length + mapState.fittedBounds.length
    await view.rerender({ ...props, currentIndex: 3 })
    expect(mapState.eases.length + mapState.fittedBounds.length).toBe(movementsBeforeUnlocatedSelection)
    view.unmount()
  })

  it('preserves a day camera within one day and refits it when navigation reaches another day', async () => {
    let keyboardHandler: ((event: KeyboardEvent) => boolean) | undefined
    const photos = [
      photo({ id: 'first', capturedLocalDate: '2026-06-20', location: { latitude: 40, longitude: -121 } }),
      photo({ id: 'same-day', capturedLocalDate: '2026-06-20', location: { latitude: 41, longitude: -120 } }),
      photo({ id: 'next-day', capturedLocalDate: '2026-06-21', location: { latitude: 42, longitude: -119 } }),
    ]
    const props = {
      photos, currentIndex: 0, mode: 'all' as const, tracks: [], onSelectPhoto: vi.fn(),
      onKeyboardHandlerChange: (handler: typeof keyboardHandler) => { keyboardHandler = handler },
    }
    const view = render(MapView, props)
    await waitFor(() => expect(screen.queryByText('Opening map…')).not.toBeInTheDocument())
    keyboardHandler?.(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }))
    const fitsAfterSelectingDay = mapState.fittedBounds.length

    await view.rerender({ ...props, currentIndex: 1 })
    expect(mapState.fittedBounds).toHaveLength(fitsAfterSelectingDay)

    await view.rerender({ ...props, currentIndex: 2 })
    expect(mapState.fittedBounds).toHaveLength(fitsAfterSelectingDay + 1)
    expect(mapState.fittedBounds.at(-1)?.bounds).toEqual([[-119, 42], [-119, 42]])
    view.unmount()
  })

  it('starts the named-scope cursor again after the map renderer is closed and reopened', async () => {
    let keyboardHandler: ((event: KeyboardEvent) => boolean) | undefined
    const statuses: string[] = []
    const props = {
      photos: [
        photo({ id: 'current', capturedLocalDate: '2026-06-20', location: { latitude: 1, longitude: 1 } }),
        photo({ id: 'day', capturedLocalDate: '2026-06-20', location: { latitude: 2, longitude: 2 } }),
        photo({ id: 'nearby', capturedLocalDate: '2026-06-21', location: { latitude: 3, longitude: 3 } }),
      ],
      currentIndex: 0,
      mode: 'all' as const,
      tracks: [],
      onSelectPhoto: vi.fn(),
      onCameraStatus: (message: string) => statuses.push(message),
      onKeyboardHandlerChange: (handler: typeof keyboardHandler) => { keyboardHandler = handler },
    }

    const first = render(MapView, props)
    await waitFor(() => expect(screen.queryByText('Opening map…')).not.toBeInTheDocument())
    keyboardHandler?.(new KeyboardEvent('keydown', { key: 'z' }))
    keyboardHandler?.(new KeyboardEvent('keydown', { key: 'z' }))
    expect(statuses.at(-1)).toBe('Map view: All photos')
    first.unmount()

    statuses.length = 0
    const reopened = render(MapView, props)
    await waitFor(() => expect(screen.queryByText('Opening map…')).not.toBeInTheDocument())
    keyboardHandler?.(new KeyboardEvent('keydown', { key: 'z' }))
    expect(statuses.at(-1)).toBe('Map view: Day')
    reopened.unmount()
  })
})
