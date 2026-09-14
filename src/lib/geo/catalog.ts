import type { TrackPoint } from '../photos/types'

export type GeographicCategory = 'park' | 'state' | 'country'
export type BoundaryExtent = [west: number, south: number, east: number, north: number]
export type BoundaryGeometry =
  | { type: 'Polygon'; coordinates: TrackPoint[][] }
  | { type: 'MultiPolygon'; coordinates: TrackPoint[][][] }

export type GeographicArea = {
  id: string
  name: string
  category: GeographicCategory
  country: 'DEU' | 'USA'
  area: number
  extent: BoundaryExtent
  geometry: BoundaryGeometry
}

export type GeographicCatalog = {
  schemaVersion: 1
  areas: GeographicArea[]
}

function isFinitePoint(value: unknown): value is TrackPoint {
  return Array.isArray(value) && value.length >= 2
    && typeof value[0] === 'number' && Number.isFinite(value[0])
    && typeof value[1] === 'number' && Number.isFinite(value[1])
    && value[0] >= -180 && value[0] <= 180
    && value[1] >= -90 && value[1] <= 90
}

function isRing(value: unknown): value is TrackPoint[] {
  return Array.isArray(value) && value.length >= 4 && value.every(isFinitePoint)
    && value[0][0] === value.at(-1)![0] && value[0][1] === value.at(-1)![1]
}

function isGeometry(value: unknown): value is BoundaryGeometry {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { type?: unknown; coordinates?: unknown }
  if (candidate.type === 'Polygon') {
    return Array.isArray(candidate.coordinates) && candidate.coordinates.length > 0
      && candidate.coordinates.every(isRing)
  }
  if (candidate.type === 'MultiPolygon') {
    return Array.isArray(candidate.coordinates) && candidate.coordinates.length > 0
      && candidate.coordinates.every(
        (polygon) => Array.isArray(polygon) && polygon.length > 0 && polygon.every(isRing),
      )
  }
  return false
}

function isExtent(value: unknown): value is BoundaryExtent {
  return Array.isArray(value) && value.length === 4
    && value.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate))
    && value[1] >= -90 && value[1] <= 90 && value[3] >= -90 && value[3] <= 90
    && value[0] >= -180 && value[0] <= 180 && value[2] <= 360
    && value[2] - value[0] <= 360
    && value[0] <= value[2] && value[1] <= value[3]
}

function isArea(value: unknown): value is GeographicArea {
  if (!value || typeof value !== 'object') return false
  const area = value as Partial<GeographicArea>
  return typeof area.id === 'string' && Boolean(area.id)
    && typeof area.name === 'string' && Boolean(area.name)
    && (area.category === 'park' || area.category === 'state' || area.category === 'country')
    && (area.country === 'DEU' || area.country === 'USA')
    && typeof area.area === 'number' && Number.isFinite(area.area) && area.area >= 0
    && isExtent(area.extent) && isGeometry(area.geometry)
}

export function normalizeGeographicCatalog(value: unknown): GeographicCatalog {
  if (!value || typeof value !== 'object') return { schemaVersion: 1, areas: [] }
  const candidate = value as { schemaVersion?: unknown; areas?: unknown }
  if (candidate.schemaVersion !== 1 || !Array.isArray(candidate.areas)) {
    return { schemaVersion: 1, areas: [] }
  }
  return { schemaVersion: 1, areas: candidate.areas.filter(isArea) }
}

function longitudeNear(longitude: number, reference: number): number {
  let result = longitude
  while (result - reference > 180) result -= 360
  while (result - reference < -180) result += 360
  return result
}

function pointOnSegment(point: TrackPoint, start: TrackPoint, end: TrackPoint): boolean {
  const x = point[0]
  const y = point[1]
  const x1 = start[0]
  const x2 = end[0]
  const cross = (x - x1) * (end[1] - start[1]) - (y - start[1]) * (x2 - x1)
  if (Math.abs(cross) > 1e-10) return false
  return x >= Math.min(x1, x2) - 1e-10 && x <= Math.max(x1, x2) + 1e-10
    && y >= Math.min(start[1], end[1]) - 1e-10 && y <= Math.max(start[1], end[1]) + 1e-10
}

function pointInRing(point: TrackPoint, ring: TrackPoint[]): boolean {
  const unwrapped = ring.map(([longitude, latitude], index): TrackPoint => [
    index ? longitudeNear(longitude, ring[index - 1][0]) : longitude,
    latitude,
  ])
  for (let index = 1; index < unwrapped.length; index += 1) {
    unwrapped[index][0] = longitudeNear(unwrapped[index][0], unwrapped[index - 1][0])
  }
  const candidate: TrackPoint = [longitudeNear(point[0], unwrapped[0][0]), point[1]]
  let inside = false
  for (let index = 0, previous = unwrapped.length - 1; index < unwrapped.length; previous = index++) {
    const start = unwrapped[previous]
    const end = unwrapped[index]
    if (pointOnSegment(candidate, start, end)) return true
    const crosses = (start[1] > candidate[1]) !== (end[1] > candidate[1])
      && candidate[0] < ((end[0] - start[0]) * (candidate[1] - start[1])) / (end[1] - start[1]) + start[0]
    if (crosses) inside = !inside
  }
  return inside
}

function pointInPolygon(point: TrackPoint, polygon: TrackPoint[][]): boolean {
  return pointInRing(point, polygon[0]) && !polygon.slice(1).some((hole) => pointInRing(point, hole))
}

export function containsCoordinate(area: GeographicArea, coordinate: TrackPoint): boolean {
  const polygons = area.geometry.type === 'Polygon'
    ? [area.geometry.coordinates]
    : area.geometry.coordinates
  return polygons.some((polygon) => pointInPolygon(coordinate, polygon))
}

const CATEGORY_ORDER: Record<GeographicCategory, number> = { park: 0, state: 1, country: 2 }

export function matchingGeographicAreas(
  catalog: GeographicCatalog,
  coordinate: TrackPoint,
): GeographicArea[] {
  if (!isFinitePoint(coordinate)) return []
  return catalog.areas
    .filter((area) => containsCoordinate(area, coordinate))
    .sort((left, right) =>
      CATEGORY_ORDER[left.category] - CATEGORY_ORDER[right.category]
      || left.area - right.area
      || left.name.localeCompare(right.name),
    )
}
