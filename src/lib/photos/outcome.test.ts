import { readFile } from 'node:fs/promises'
import { DOMParser, onErrorStopParsing } from '@xmldom/xmldom'
import type { ExpandedTags } from 'exifreader'
import ExifReader from 'exifreader'
import { describe, expect, it } from 'vitest'
import { file } from '../../test/factories'
import { createScanOutcome } from './outcome'

describe('scan error isolation', () => {
  it('turns a per-file parser failure into an outcome', async () => {
    const failed = await createScanOutcome(
      { file: file('bad.jpg'), originalIndex: 7 },
      async () => { throw new Error('Malformed metadata') },
    )
    const good = await createScanOutcome(
      { file: file('good.jpg'), originalIndex: 8 },
      async () => ({ file: {} }) as ExpandedTags,
    )

    expect(failed.status).toBe('metadata-error')
    expect(good.status).toBe('ready')
  })

  it.each(['Failed to read metadata', 'Could not load metadata', 'File not found'])(
    'keeps a metadata loader error as metadata-error: %s',
    async (message) => {
      const failed = await createScanOutcome(
        { file: file('displayable.jpg'), originalIndex: 3 },
        async () => { throw new Error(message) },
      )

      expect(failed).toMatchObject({
        status: 'metadata-error',
        error: message,
      })
    },
  )

  it('reads the committed malformed-XMP JPEG fixture without hiding the photo', async () => {
    const bytes = await readFile('src/test/fixtures/malformed-xmp-metadata.jpg')
    const outcome = await createScanOutcome(
      {
        file: new File([bytes], 'malformed-xmp-metadata.jpg', { type: 'image/jpeg' }),
        originalIndex: 9,
      },
      (fixture) =>
        ExifReader.load(fixture, {
          domParser: new DOMParser({ onError: onErrorStopParsing }),
          expanded: true,
          includeOffsets: true,
          length: 'auto',
          excludeTags: { icc: true, makerNotes: true, thumbnail: true },
        }),
    )

    expect(outcome).toMatchObject({
      fileName: 'malformed-xmp-metadata.jpg',
      status: 'ready',
      metadata: { width: 32, height: 32 },
    })
  })
})
