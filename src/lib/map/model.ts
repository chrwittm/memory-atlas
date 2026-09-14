import type { Photo, TrackPoint } from '../photos/types'

export const MAP_MODES = ['current', 'all', 'track'] as const
export type MapMode = (typeof MAP_MODES)[number]

export const MAP_MODE_LABELS: Record<MapMode, string> = {
  current: 'Current photo',
  all: 'All photos',
  track: 'Photos + GPX track',
}

export type CoordinateGroup = {
  coordinate: TrackPoint
  photoIndices: number[]
}

export function nextMapMode(mode: MapMode): MapMode {
  return MAP_MODES[(MAP_MODES.indexOf(mode) + 1) % MAP_MODES.length]
}

export function coordinateGroups(photos: Photo[]): CoordinateGroup[] {
  const groups = new Map<string, CoordinateGroup>()
  photos.forEach((photo, index) => {
    if (!photo.location) return
    const coordinate: TrackPoint = [photo.location.longitude, photo.location.latitude]
    const key = `${coordinate[0]},${coordinate[1]}`
    const group = groups.get(key)
    if (group) group.photoIndices.push(index)
    else groups.set(key, { coordinate, photoIndices: [index] })
  })
  return [...groups.values()]
}

export function nextMemberInGroup(group: CoordinateGroup, currentIndex: number): number {
  const position = group.photoIndices.indexOf(currentIndex)
  return group.photoIndices[position < 0 ? 0 : (position + 1) % group.photoIndices.length]
}

export function photoAccessibleName(photo: Photo): string {
  return photo.caption || photo.title || photo.fileName
}
