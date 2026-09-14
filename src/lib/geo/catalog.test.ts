import catalogData from './catalog.json'
import { describe, expect, it } from 'vitest'
import {
  containsCoordinate,
  matchingGeographicAreas,
  normalizeGeographicCatalog,
  type GeographicArea,
  type GeographicCatalog,
} from './catalog'

function area(overrides: Partial<GeographicArea>): GeographicArea {
  return {
    id: 'area',
    name: 'Area',
    category: 'country',
    country: 'USA',
    area: 100,
    extent: [-10, -10, 10, 10],
    geometry: { type: 'Polygon', coordinates: [[[-10, -10], [10, -10], [10, 10], [-10, 10], [-10, -10]]] },
    ...overrides,
  }
}

describe('geographic catalog', () => {
  it('matches independent park, state, and country contexts in stable order', () => {
    const catalog: GeographicCatalog = {
      schemaVersion: 1,
      areas: [
        area({ id: 'country', name: 'United States', category: 'country', area: 400 }),
        area({ id: 'state', name: 'West State', category: 'state', area: 200,
          geometry: { type: 'Polygon', coordinates: [[[-10, -10], [0, -10], [0, 10], [-10, 10], [-10, -10]]] } }),
        area({ id: 'park-large', name: 'Crossing Park', category: 'park', area: 80,
          geometry: { type: 'Polygon', coordinates: [[[-2, -2], [2, -2], [2, 2], [-2, 2], [-2, -2]]] } }),
        area({ id: 'park-small', name: 'Small Park', category: 'park', area: 20,
          geometry: { type: 'Polygon', coordinates: [[[-1, -1], [0, -1], [0, 1], [-1, 1], [-1, -1]]] } }),
      ],
    }
    expect(matchingGeographicAreas(catalog, [-0.5, 0]).map(({ name }) => name)).toEqual([
      'Small Park', 'Crossing Park', 'West State', 'United States',
    ])
  })

  it('handles multipolygons, holes, boundaries, and antimeridian polygons', () => {
    const multipolygon = area({
      geometry: { type: 'MultiPolygon', coordinates: [
        [[[170, -5], [-170, -5], [-170, 5], [170, 5], [170, -5]]],
        [[[-20, -20], [-10, -20], [-10, -10], [-20, -10], [-20, -20]], [[-18, -18], [-12, -18], [-12, -12], [-18, -12], [-18, -18]]],
      ] },
    })
    expect(containsCoordinate(multipolygon, [179, 0])).toBe(true)
    expect(containsCoordinate(multipolygon, [-179, 0])).toBe(true)
    expect(containsCoordinate(multipolygon, [-20, -15])).toBe(true)
    expect(containsCoordinate(multipolygon, [-15, -15])).toBe(false)
    expect(containsCoordinate(multipolygon, [0, 0])).toBe(false)
  })

  it('isolates malformed catalog entries and recognizes packaged German and U.S. contexts', () => {
    const normalized = normalizeGeographicCatalog({
      schemaVersion: 1,
      areas: [
        area({}),
        { id: 'broken', name: 'Broken' },
        area({ id: 'bad-coordinate', geometry: {
          type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 200], [0, 0]]],
        } }),
      ],
    })
    expect(normalized.areas).toHaveLength(1)
    expect(normalizeGeographicCatalog({ schemaVersion: 2, areas: [area({})] }).areas).toEqual([])
    expect(matchingGeographicAreas(normalized, [181, 0])).toEqual([])

    const packaged = normalizeGeographicCatalog(catalogData)
    expect(packaged.areas).toHaveLength(148)
    expect(matchingGeographicAreas(packaged, [-121.42, 40.49]).map(({ name }) => name)).toEqual([
      'Lassen Volcanic National Park', 'California', 'United States',
    ])
    expect(matchingGeographicAreas(packaged, [13.405, 52.52]).map(({ name }) => name)).toEqual([
      'Berlin', 'Germany',
    ])
    expect(matchingGeographicAreas(packaged, [12.8333, 53.4333]).map(({ name }) => name)).toEqual([
      'Müritz-Nationalpark', 'Mecklenburg-Western Pomerania', 'Germany',
    ])
  })
})
