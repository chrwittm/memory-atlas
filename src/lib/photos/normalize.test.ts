import type { ExpandedTags } from 'exifreader'
import { describe, expect, it } from 'vitest'
import { normalizeMetadata, parseExifDate } from './normalize'

describe('metadata normalization', () => {
  it('uses a real-corpus XMP title as the caption fallback', () => {
    const tags = {
      file: {
        'Image Width': { value: 1994, description: '1994px' },
        'Image Height': { value: 2991, description: '2991px' },
      },
      exif: { DateTimeOriginal: { value: ['2026:06:20 10:58:52'], description: '2026:06:20 10:58:52' } },
      xmp: { title: { value: [], attributes: {}, description: 'Singdrossel juvenile' } },
    } as unknown as ExpandedTags

    expect(normalizeMetadata(tags)).toMatchObject({
      caption: 'Singdrossel juvenile',
      title: 'Singdrossel juvenile',
      width: 1994,
      height: 2991,
    })
  })

  it('normalizes valid GPS and rejects invalid coordinates', () => {
    expect(normalizeMetadata({ gps: { Latitude: 48.2, Longitude: 9.6 } } as ExpandedTags).location)
      .toEqual({ latitude: 48.2, longitude: 9.6 })
    expect(normalizeMetadata({ gps: { Latitude: 120, Longitude: 9.6 } } as ExpandedTags).location)
      .toBeUndefined()
  })

  it('parses EXIF local timestamps deterministically', () => {
    expect(parseExifDate('2026:06:20 10:58:52')).toBe(new Date(2026, 5, 20, 10, 58, 52).toISOString())
  })
})

