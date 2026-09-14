import type { GeographicArea, GeographicCatalog } from '../geo/catalog'
import { matchingGeographicAreas, type BoundaryExtent } from '../geo/catalog'
import type { GpxTrack, Photo, TrackPoint } from '../photos/types'
import type { MapMode } from './model'

export type MapCameraScopeKind =
  | 'current'
  | 'day'
  | 'surrounding-days'
  | 'geographic'
  | 'all-photos'
  | 'complete-track'

export type MapCameraScope = {
  id: string
  kind: MapCameraScopeKind
  levelKey: string
  label: string
  target:
    | { kind: 'center'; coordinate: TrackPoint }
    | { kind: 'bounds'; bounds: BoundaryExtent }
}

export type MapCameraScopeGroup = 'focus' | 'time' | 'place' | 'collection'

export type MapCameraScopeOption = {
  id: string
  group: MapCameraScopeGroup
  label: string
}

export type MapCameraScopeSelector = (scopeId: string) => void

export type CameraScopeInput = {
  mode: MapMode
  photos: Photo[]
  currentIndex: number
  tracks: GpxTrack[]
  catalog: GeographicCatalog
}

function recordedLocalDate(photo: Photo): string | undefined {
  if (photo.capturedLocalDate && dateNumber(photo.capturedLocalDate) !== undefined) {
    return photo.capturedLocalDate
  }
  const prefix = photo.capturedAt?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const date = prefix ? `${prefix[1]}-${prefix[2]}-${prefix[3]}` : undefined
  return date && dateNumber(date) !== undefined ? date : undefined
}

function dateNumber(date: string): number | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined
  const [year, month, day] = date.split('-').map(Number)
  const timestamp = Date.UTC(year, month - 1, day)
  const parsed = new Date(timestamp)
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) return undefined
  return timestamp / 86_400_000
}

export function extentForCoordinates(coordinates: TrackPoint[]): BoundaryExtent | undefined {
  if (!coordinates.length) return undefined
  const longitudes = coordinates
    .map(([longitude]) => ((longitude % 360) + 360) % 360)
    .sort((left, right) => left - right)
  let largestGap = longitudes[0] + 360 - longitudes.at(-1)!
  let gapIndex = longitudes.length - 1
  for (let index = 0; index < longitudes.length - 1; index += 1) {
    const gap = longitudes[index + 1] - longitudes[index]
    if (gap > largestGap) {
      largestGap = gap
      gapIndex = index
    }
  }
  const start = longitudes[(gapIndex + 1) % longitudes.length]
  const west = start > 180 ? start - 360 : start
  const latitudes = coordinates.map(([, latitude]) => latitude)
  const clean = (value: number) => Number(value.toFixed(12))
  return [clean(west), clean(Math.min(...latitudes)), clean(west + 360 - largestGap), clean(Math.max(...latitudes))]
}

export function sameExtent(left: BoundaryExtent | undefined, right: BoundaryExtent | undefined): boolean {
  if (!left || !right) return false
  return left.every((value, index) => Math.abs(value - right[index]) <= 1e-7)
}

function locatedCoordinates(photos: Photo[], predicate = (_photo: Photo) => true): TrackPoint[] {
  return photos.flatMap((photo) => photo.location && predicate(photo)
    ? [[photo.location.longitude, photo.location.latitude] as TrackPoint]
    : [])
}

function boundsScope(
  id: string,
  kind: MapCameraScopeKind,
  label: string,
  coordinates: TrackPoint[],
): MapCameraScope | undefined {
  const bounds = extentForCoordinates(coordinates)
  return bounds ? { id, kind, levelKey: kind, label, target: { kind: 'bounds', bounds } } : undefined
}

type CountryCameraFrame = {
  id: string
  levelKey: string
  label: string
  country: GeographicArea['country']
  includedAreaCategory: GeographicArea['category']
  excludedAreaIds: ReadonlySet<string>
}

const COUNTRY_CAMERA_FRAMES: CountryCameraFrame[] = [{
  id: 'frame:USA:contiguous',
  levelKey: 'geographic:country-frame:mainland',
  label: 'Contiguous United States',
  country: 'USA',
  includedAreaCategory: 'state',
  excludedAreaIds: new Set(['state:US-AK', 'state:US-HI']),
}]

function extentForAreas(areas: GeographicArea[]): BoundaryExtent | undefined {
  return extentForCoordinates(areas.flatMap((area) => {
    const [west, south, east, north] = area.extent
    return [[west, south], [east, north]] as TrackPoint[]
  }))
}

function countryCameraFrameScopes(
  catalog: GeographicCatalog,
  country: GeographicArea['country'],
): MapCameraScope[] {
  return COUNTRY_CAMERA_FRAMES.flatMap((frame) => {
    if (frame.country !== country) return []
    const includedAreas = catalog.areas.filter((area) =>
      area.country === frame.country
      && area.category === frame.includedAreaCategory
      && !frame.excludedAreaIds.has(area.id),
    )
    const bounds = extentForAreas(includedAreas)
    return bounds ? [{
      id: frame.id,
      kind: 'geographic' as const,
      levelKey: frame.levelKey,
      label: frame.label,
      target: { kind: 'bounds' as const, bounds },
    }] : []
  })
}

export function availableCameraScopes(input: CameraScopeInput): MapCameraScope[] {
  const current = input.photos[input.currentIndex]
  const scopes: MapCameraScope[] = []
  let previousPhotoExtent: BoundaryExtent | undefined

  if (current?.location) {
    const coordinate: TrackPoint = [current.location.longitude, current.location.latitude]
    scopes.push({
      id: 'current', kind: 'current', levelKey: 'current', label: 'Current photo',
      target: { kind: 'center', coordinate },
    })
    previousPhotoExtent = extentForCoordinates([coordinate])
  }

  if (input.mode !== 'current') {
    const currentDate = current ? recordedLocalDate(current) : undefined
    if (currentDate) {
      const centerDay = dateNumber(currentDate)
      const day = boundsScope(
        'day',
        'day',
        'Day',
        locatedCoordinates(input.photos, (photo) => recordedLocalDate(photo) === currentDate),
      )
      if (day && !sameExtent(day.target.kind === 'bounds' ? day.target.bounds : undefined, previousPhotoExtent)) {
        scopes.push(day)
        previousPhotoExtent = day.target.kind === 'bounds' ? day.target.bounds : previousPhotoExtent
      }
      const surrounding = boundsScope(
        'surrounding-days',
        'surrounding-days',
        'Surrounding seven days',
        locatedCoordinates(input.photos, (photo) => {
          const date = recordedLocalDate(photo)
          const day = date ? dateNumber(date) : undefined
          return day !== undefined && centerDay !== undefined ? Math.abs(day - centerDay) <= 3 : false
        }),
      )
      if (surrounding && !sameExtent(
        surrounding.target.kind === 'bounds' ? surrounding.target.bounds : undefined,
        previousPhotoExtent,
      )) {
        scopes.push(surrounding)
      }
    }
  }

  if (current?.location) {
    const coordinate: TrackPoint = [current.location.longitude, current.location.latitude]
    const matchingAreas = matchingGeographicAreas(input.catalog, coordinate)
    for (const area of matchingAreas) {
      if (area.category === 'country') {
        scopes.push(...countryCameraFrameScopes(input.catalog, area.country))
      }
      scopes.push({
        id: `area:${area.id}`,
        kind: 'geographic',
        levelKey: `geographic:${area.category}`,
        label: area.name,
        target: { kind: 'bounds', bounds: area.extent },
      })
    }
  }

  if (input.mode !== 'current') {
    const allPhotos = boundsScope('all-photos', 'all-photos', 'All photos', locatedCoordinates(input.photos))
    if (allPhotos) scopes.push(allPhotos)
  }

  if (input.mode === 'track') {
    const completeTrack = boundsScope(
      'complete-track',
      'complete-track',
      'Complete track',
      input.tracks.flatMap((track) => track.segments.flat()),
    )
    if (completeTrack) scopes.push(completeTrack)
  }

  return scopes
}

export function cameraScopeOptions(scopes: MapCameraScope[]): MapCameraScopeOption[] {
  return scopes.map((scope) => ({
    id: scope.id,
    label: scope.label,
    group: scope.kind === 'current'
      ? 'focus'
      : scope.kind === 'day' || scope.kind === 'surrounding-days'
        ? 'time'
        : scope.kind === 'geographic'
          ? 'place'
          : 'collection',
  }))
}

const PRIMARY_SCOPE_ORDER: MapCameraScopeKind[] = [
  'current',
  'day',
  'complete-track',
  'all-photos',
]

export function primaryCameraScopes(scopes: MapCameraScope[]): MapCameraScope[] {
  return PRIMARY_SCOPE_ORDER.flatMap((kind) => scopes.find((scope) => scope.kind === kind) ?? [])
}

export function cameraScopeAfterPhotoChange(
  input: CameraScopeInput,
  previous: MapCameraScope,
): MapCameraScope | undefined {
  const current = input.photos[input.currentIndex]
  const currentLocation = current?.location
  if (!currentLocation) return undefined

  if (
    input.mode !== 'current'
    && (previous.kind === 'day' || previous.kind === 'surrounding-days')
  ) {
    const currentDate = recordedLocalDate(current)
    const centerDay = currentDate ? dateNumber(currentDate) : undefined
    if (currentDate && centerDay !== undefined) {
      const coordinates = locatedCoordinates(input.photos, (photo) => {
        const date = recordedLocalDate(photo)
        if (previous.kind === 'day') return date === currentDate
        const day = date ? dateNumber(date) : undefined
        return day !== undefined && Math.abs(day - centerDay) <= 3
      })
      const temporalScope = boundsScope(previous.id, previous.kind, previous.label, coordinates)
      if (temporalScope) return temporalScope
    }
  }

  const available = availableCameraScopes(input)
  const containsCurrentPhoto = (scope: MapCameraScope): boolean => {
    if (scope.kind !== 'geographic' || scope.target.kind !== 'bounds') return true
    const [west, south, east, north] = scope.target.bounds
    const longitude = currentLocation.longitude < west ? currentLocation.longitude + 360 : currentLocation.longitude
    return longitude >= west && longitude <= east
      && currentLocation.latitude >= south && currentLocation.latitude <= north
  }

  const exactScope = available.find((scope) => scope.id === previous.id && containsCurrentPhoto(scope))
  if (exactScope) return exactScope

  const equivalentScope = available.find(
    (scope) => scope.levelKey === previous.levelKey && containsCurrentPhoto(scope),
  )
  return equivalentScope ?? available.find((scope) => scope.kind === 'current')
}
