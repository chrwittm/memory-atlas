import { describe, expect, it } from 'vitest'
import packagedCatalogData from '../geo/catalog.json'
import { normalizeGeographicCatalog, type GeographicCatalog } from '../geo/catalog'
import { photo } from '../../test/factories'
import {
  availableCameraScopes,
  cameraScopeOptions,
  cameraScopeAfterPhotoChange,
  extentForCoordinates,
  primaryCameraScopes,
} from './cameraScopes'

const catalog: GeographicCatalog = {
  schemaVersion: 1,
  areas: [
    { id: 'country', name: 'United States', category: 'country', country: 'USA', area: 100,
      extent: [-130, 20, -60, 50], geometry: { type: 'Polygon', coordinates: [[[-130, 20], [-60, 20], [-60, 50], [-130, 50], [-130, 20]]] } },
    { id: 'state', name: 'California', category: 'state', country: 'USA', area: 20,
      extent: [-125, 32, -114, 42], geometry: { type: 'Polygon', coordinates: [[[-125, 32], [-114, 32], [-114, 42], [-125, 42], [-125, 32]]] } },
    { id: 'park', name: 'Lassen Volcanic National Park', category: 'park', country: 'USA', area: 1,
      extent: [-121.7, 40.3, -121.2, 40.7], geometry: { type: 'Polygon', coordinates: [[[-121.7, 40.3], [-121.2, 40.3], [-121.2, 40.7], [-121.7, 40.7], [-121.7, 40.3]]] } },
  ],
}

const photos = [
  photo({ id: 'current', capturedAt: '2026-06-20T22:30:00.000Z', capturedLocalDate: '2026-06-20', location: { latitude: 40.49, longitude: -121.42 } }),
  photo({ id: 'day', capturedLocalDate: '2026-06-20', location: { latitude: 40.55, longitude: -121.3 } }),
  photo({ id: 'minus-three', capturedLocalDate: '2026-06-17', location: { latitude: 39, longitude: -120 } }),
  photo({ id: 'plus-three', capturedLocalDate: '2026-06-23', location: { latitude: 38, longitude: -119 } }),
  photo({ id: 'outside', capturedLocalDate: '2026-06-24', location: { latitude: 37, longitude: -118 } }),
  photo({ id: 'untimed', location: { latitude: 36, longitude: -117 } }),
]

describe('map camera scopes', () => {
  it('builds the mode-dependent scope ladder in stable order', () => {
    const current = availableCameraScopes({ mode: 'current', photos, currentIndex: 0, tracks: [], catalog })
    expect(current.map(({ label }) => label)).toEqual([
      'Current photo', 'Lassen Volcanic National Park', 'California',
      'Contiguous United States', 'United States',
    ])

    const all = availableCameraScopes({ mode: 'all', photos, currentIndex: 0, tracks: [], catalog })
    expect(all.map(({ label }) => label)).toEqual([
      'Current photo', 'Day', 'Surrounding seven days',
      'Lassen Volcanic National Park', 'California', 'Contiguous United States',
      'United States', 'All photos',
    ])
    const surrounding = all.find(({ kind }) => kind === 'surrounding-days')
    expect(surrounding?.target).toEqual({ kind: 'bounds', bounds: [-121.42, 38, -119, 40.55] })

    const track = availableCameraScopes({
      mode: 'track', photos, currentIndex: 0, catalog,
      tracks: [{ id: 'route', fileName: 'route.gpx', originalIndex: 0, documentIndex: 0,
        segments: [[[-121.42, 40.49], [-117, 36]]] }],
    })
    expect(track.map(({ label }) => label).at(-1)).toBe('Complete track')
    expect(primaryCameraScopes(track).map(({ label }) => label)).toEqual([
      'Current photo', 'Day', 'Complete track', 'All photos',
    ])
    expect(cameraScopeOptions(track).map(({ label, group }) => `${group}:${label}`)).toEqual([
      'focus:Current photo',
      'time:Day',
      'time:Surrounding seven days',
      'place:Lassen Volcanic National Park',
      'place:California',
      'place:Contiguous United States',
      'place:United States',
      'collection:All photos',
      'collection:Complete track',
    ])
  })

  it('uses an explicit supplemental frame before the complete United States', () => {
    const alaskaCatalog: GeographicCatalog = {
      schemaVersion: 1,
      areas: [
        ...catalog.areas.filter(({ category }) => category !== 'country'),
        { id: 'country', name: 'United States', category: 'country', country: 'USA', area: 100,
          extent: [-170, 20, -60, 72], geometry: { type: 'MultiPolygon', coordinates: [
            [[[-130, 20], [-60, 20], [-60, 50], [-130, 50], [-130, 20]]],
            [[[-170, 51], [-130, 51], [-130, 72], [-170, 72], [-170, 51]]],
          ] } },
        { id: 'state:US-AK', name: 'Alaska', category: 'state', country: 'USA', area: 30,
          extent: [-170, 51, -130, 72], geometry: { type: 'Polygon', coordinates: [[[-170, 51], [-130, 51], [-130, 72], [-170, 72], [-170, 51]]] } },
      ],
    }
    const california = availableCameraScopes({ mode: 'current', photos, currentIndex: 0, tracks: [], catalog: alaskaCatalog })
    expect(california.find(({ label }) => label === 'Contiguous United States')?.target).toEqual({
      kind: 'bounds', bounds: [-125, 32, -114, 42],
    })
    const alaska = availableCameraScopes({
      mode: 'current', tracks: [], catalog: alaskaCatalog, currentIndex: 0,
      photos: [photo({ id: 'alaska', location: { latitude: 60, longitude: -150 } })],
    })
    expect(alaska.map(({ label }) => label)).toEqual([
      'Current photo', 'Alaska', 'Contiguous United States', 'United States',
    ])

    const contiguous = california.find(({ label }) => label === 'Contiguous United States')!
    expect(cameraScopeAfterPhotoChange({
      mode: 'current', tracks: [], catalog: alaskaCatalog, currentIndex: 1,
      photos: [photos[0], photo({ id: 'alaska', location: { latitude: 60, longitude: -150 } })],
    }, contiguous)?.label).toBe('Current photo')
  })

  it('falls back to Current photo when the selected geographic area no longer contains it', () => {
    const park = availableCameraScopes({ mode: 'all', photos, currentIndex: 0, tracks: [], catalog })
      .find(({ label }) => label === 'Lassen Volcanic National Park')!

    expect(cameraScopeAfterPhotoChange({
      mode: 'all', photos, currentIndex: 4, tracks: [], catalog,
    }, park)).toMatchObject({
      id: 'current',
      label: 'Current photo',
      target: { kind: 'center', coordinate: [-118, 37] },
    })
  })

  it('moves to the matching geographic scope at the same level when one is available', () => {
    const transitionCatalog: GeographicCatalog = {
      schemaVersion: 1,
      areas: [
        ...catalog.areas,
        { id: 'state:oregon', name: 'Oregon', category: 'state', country: 'USA', area: 18,
          extent: [-125, 42, -116, 47], geometry: { type: 'Polygon', coordinates: [[[-125, 42], [-116, 42], [-116, 47], [-125, 47], [-125, 42]]] } },
        { id: 'country:germany', name: 'Germany', category: 'country', country: 'DEU', area: 45,
          extent: [5, 47, 16, 56], geometry: { type: 'Polygon', coordinates: [[[5, 47], [16, 47], [16, 56], [5, 56], [5, 47]]] } },
      ],
    }
    const transitionPhotos = [
      photo({ id: 'california', location: { latitude: 38, longitude: -120 } }),
      photo({ id: 'oregon', location: { latitude: 44, longitude: -120 } }),
      photo({ id: 'germany', location: { latitude: 51, longitude: 10 } }),
    ]
    const californiaScopes = availableCameraScopes({
      mode: 'current', photos: transitionPhotos, currentIndex: 0, tracks: [], catalog: transitionCatalog,
    })
    const california = californiaScopes.find(({ label }) => label === 'California')!
    const unitedStates = californiaScopes.find(({ label }) => label === 'United States')!

    expect(cameraScopeAfterPhotoChange({
      mode: 'current', photos: transitionPhotos, currentIndex: 1, tracks: [], catalog: transitionCatalog,
    }, california)?.label).toBe('Oregon')
    expect(cameraScopeAfterPhotoChange({
      mode: 'current', photos: transitionPhotos, currentIndex: 2, tracks: [], catalog: transitionCatalog,
    }, unitedStates)?.label).toBe('Germany')
  })

  it('derives the contiguous-country frame from every packaged lower-48 state extent', () => {
    const packagedCatalog = normalizeGeographicCatalog(packagedCatalogData)
    const california = availableCameraScopes({
      mode: 'current', tracks: [], catalog: packagedCatalog, currentIndex: 0,
      photos: [photo({ id: 'california', location: { latitude: 38.58, longitude: -121.49 } })],
    })
    expect(california.find(({ label }) => label === 'Contiguous United States')?.target).toEqual({
      kind: 'bounds', bounds: [-124.734607, 24.542548, -66.977325, 49.369494],
    })
  })

  it('skips visually duplicate temporal stops but preserves semantic collection and track stops', () => {
    const one = [photo({ id: 'only', capturedLocalDate: '2026-06-20', location: { latitude: 1, longitude: 2 } })]
    const scopes = availableCameraScopes({
      mode: 'track', photos: one, currentIndex: 0, catalog: { schemaVersion: 1, areas: [] },
      tracks: [{ id: 'same', fileName: 'same.gpx', originalIndex: 0, documentIndex: 0, segments: [[[2, 1], [2, 1]]] }],
    })
    expect(scopes.map(({ label }) => label)).toEqual(['Current photo', 'All photos', 'Complete track'])
  })

  it('omits unavailable anchors and uses a short wrapped extent across the antimeridian', () => {
    expect(extentForCoordinates([[179, 10], [-179, 12]])).toEqual([179, 10, 181, 12])
    const scopes = availableCameraScopes({
      mode: 'track', photos: [photo({ id: 'missing', capturedLocalDate: '2026-06-20' })], currentIndex: 0,
      catalog, tracks: [{ id: 'route', fileName: 'route.gpx', originalIndex: 0, documentIndex: 0,
        segments: [[[179, 10], [-179, 12]]] }],
    })
    expect(scopes.map(({ label }) => label)).toEqual(['Complete track'])
    expect(scopes[0].target).toEqual({ kind: 'bounds', bounds: [179, 10, 181, 12] })
  })
})
