import type { Photo } from './types'

export function comparePhotos(a: Photo, b: Photo): number {
  const fileDifference = a.fileName.localeCompare(b.fileName, undefined, {
    sensitivity: 'base',
    numeric: true,
  })
  return fileDifference || a.originalIndex - b.originalIndex
}

export function sortPhotos(photos: Photo[]): Photo[] {
  return [...photos].sort(comparePhotos)
}
