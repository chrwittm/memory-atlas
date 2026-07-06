import type { Photo } from './types'

type UrlApi = Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>
type PreloadHandle = { dispose: () => void }
type PreloadImage = (url: string) => PreloadHandle

function preloadImage(url: string): PreloadHandle {
  const image = new Image()
  image.decoding = 'async'
  image.src = url
  void image.decode?.().catch(() => undefined)
  return { dispose: () => { image.src = '' } }
}

export class ObjectUrlWindow {
  private urls = new Map<string, string>()
  private preloads = new Map<string, PreloadHandle>()

  constructor(
    private readonly api: UrlApi = URL,
    private readonly preload: PreloadImage = preloadImage,
  ) {}

  sync(photos: Photo[], currentIndex: number, radius = 1): string | undefined {
    const retainedIds = new Set<string>()
    const preloadIds = new Set<string>()
    for (let index = Math.max(0, currentIndex - radius); index <= Math.min(photos.length - 1, currentIndex + radius); index++) {
      const photo = photos[index]
      retainedIds.add(photo.id)
      if (!this.urls.has(photo.id)) this.urls.set(photo.id, this.api.createObjectURL(photo.file))
      if (index !== currentIndex) preloadIds.add(photo.id)
    }

    for (const id of preloadIds) {
      if (!this.preloads.has(id)) this.preloads.set(id, this.preload(this.urls.get(id)!))
    }

    for (const [id, handle] of this.preloads) {
      if (!preloadIds.has(id)) {
        handle.dispose()
        this.preloads.delete(id)
      }
    }

    for (const [id, url] of this.urls) {
      if (!retainedIds.has(id)) {
        this.api.revokeObjectURL(url)
        this.urls.delete(id)
      }
    }
    return photos[currentIndex] ? this.urls.get(photos[currentIndex].id) : undefined
  }

  dispose(): void {
    for (const handle of this.preloads.values()) handle.dispose()
    this.preloads.clear()
    for (const url of this.urls.values()) this.api.revokeObjectURL(url)
    this.urls.clear()
  }
}
