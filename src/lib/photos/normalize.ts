import type { ExpandedTags } from 'exifreader'
import type { PhotoMetadata } from './types'

type TagLike = { description?: unknown; value?: unknown }
type TagGroup = Record<string, TagLike | undefined> | undefined

function text(group: TagGroup, ...names: string[]): string | undefined {
  for (const name of names) {
    const tag = group?.[name]
    const value = typeof tag?.description === 'string' ? tag.description.trim() : ''
    if (value) return value
  }
}

function numberValue(group: TagGroup, ...names: string[]): number | undefined {
  for (const name of names) {
    const tag = group?.[name]
    const raw = Array.isArray(tag?.value) ? tag.value[0] : tag?.value
    const value = typeof raw === 'number' ? raw : Number(raw)
    if (Number.isFinite(value)) return value
  }
}

function strings(group: TagGroup, ...names: string[]): string[] {
  for (const name of names) {
    const tag = group?.[name]
    const raw = tag?.value
    const values = Array.isArray(raw) ? raw : raw == null ? [] : [raw]
    const normalized = values
      .flatMap((value) => {
        if (typeof value === 'string') return value.split(/[;,]/)
        if (value && typeof value === 'object' && 'description' in value) {
          return String((value as TagLike).description ?? '')
        }
        return []
      })
      .map((value) => value.trim())
      .filter(Boolean)
    if (normalized.length) return [...new Set(normalized)]
  }
  return []
}

export function parseExifDate(value?: string): string | undefined {
  if (!value) return undefined
  const match = value.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/)
  if (!match) {
    const timestamp = Date.parse(value)
    return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString()
  }
  const [, year, month, day, hour, minute, second] = match
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  )
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function parseExifLocalDate(value?: string): string | undefined {
  if (!value) return undefined
  const match = value.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})(?:[ T]|$)/)
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    const parsed = new Date(Date.UTC(year, month - 1, day))
    if (
      parsed.getUTCFullYear() === year
      && parsed.getUTCMonth() === month - 1
      && parsed.getUTCDate() === day
    ) return `${match[1]}-${match[2]}-${match[3]}`
    return undefined
  }
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString().slice(0, 10)
}

export function normalizeMetadata(tags: ExpandedTags): PhotoMetadata {
  const exif = tags.exif as TagGroup
  const iptc = tags.iptc as TagGroup
  const xmp = tags.xmp as unknown as TagGroup
  const file = tags.file as unknown as TagGroup

  const title = text(xmp, 'title', 'Title') || text(iptc, 'Object Name', 'Headline')
  const description =
    text(xmp, 'description', 'Description') ||
    text(iptc, 'Caption/Abstract', 'Caption-Abstract') ||
    text(exif, 'ImageDescription')
  const latitude = tags.gps?.Latitude
  const longitude = tags.gps?.Longitude
  const validLocation =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180

  const capturedSource = text(exif, 'DateTimeOriginal', 'DateTimeDigitized')
    || text(xmp, 'DateCreated', 'CreateDate')

  return {
    capturedAt: parseExifDate(capturedSource),
    capturedLocalDate: parseExifLocalDate(capturedSource),
    title,
    caption: description || title,
    tags: (() => {
      const xmpTags = strings(xmp, 'subject', 'Subject', 'hierarchicalSubject')
      return xmpTags.length ? xmpTags : strings(iptc, 'Keywords')
    })(),
    people: strings(xmp, 'PersonInImage', 'Person Shown'),
    orientation: numberValue(exif, 'Orientation'),
    width: numberValue(file, 'Image Width', 'ImageWidth'),
    height: numberValue(file, 'Image Height', 'ImageHeight'),
    location: validLocation ? { latitude, longitude } : undefined,
  }
}

export function emptyMetadata(): PhotoMetadata {
  return { tags: [], people: [] }
}
