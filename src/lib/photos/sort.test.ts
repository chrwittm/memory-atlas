import { describe, expect, it } from 'vitest'
import { photo } from '../../test/factories'
import { sortPhotos } from './sort'

describe('stable photo sorting', () => {
  it('uses natural file name order even when capture dates disagree', () => {
    const photos = [
      photo({ id: 'ten', fileName: '010-last.jpg', capturedAt: '2024-01-01T00:00:00.000Z' }),
      photo({ id: 'two', fileName: '2-second.jpg', capturedAt: '2024-01-02T00:00:00.000Z' }),
      photo({ id: 'one', fileName: '001-first.jpg', capturedAt: '2024-01-03T00:00:00.000Z' }),
    ]

    expect(sortPhotos(photos).map(({ id }) => id)).toEqual(['one', 'two', 'ten'])
  })

  it('uses original selection order when file names compare equally', () => {
    const photos = [
      photo({ id: 'later', fileName: 'Photo.jpg', originalIndex: 3 }),
      photo({ id: 'earlier', fileName: 'photo.jpg', originalIndex: 1 }),
    ]

    expect(sortPhotos(photos).map(({ id }) => id)).toEqual(['earlier', 'later'])
  })
})
