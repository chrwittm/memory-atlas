import type { ExpandedTags } from 'exifreader'
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
})

