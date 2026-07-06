import type { Photo } from '../lib/photos/types'

export function file(name: string, path = name): File {
  const value = new File(['jpeg'], name, { type: 'image/jpeg', lastModified: 1 })
  Object.defineProperty(value, 'webkitRelativePath', { value: path })
  return value
}

export function photo(overrides: Partial<Photo> = {}): Photo {
  const source = overrides.file || file(overrides.fileName || 'photo.jpg')
  return {
    id: overrides.id || source.name,
    file: source,
    fileName: source.name,
    originalIndex: 0,
    tags: [],
    people: [],
    status: 'ready',
    ...overrides,
  }
}

