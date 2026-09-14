import { describe, expect, it, vi } from 'vitest'
import { file } from '../../test/factories'
import { runWorkerScan, scanFailureMessage } from './scanWorker'
import type { WorkerResponse } from './types'

describe('worker scan terminal behavior', () => {
  it('emits started and complete for an empty folder', async () => {
    const messages: WorkerResponse[] = []

    await runWorkerScan([], (message) => messages.push(message))

    expect(messages).toEqual([
      { type: 'started', total: 0, folderName: 'Selected folder' },
      { type: 'complete', total: 0 },
    ])
  })

  it('turns an unexpected task failure into one failed terminal response', async () => {
    const messages: WorkerResponse[] = []
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await runWorkerScan(
      [file('bad.jpg', 'Trip/bad.jpg')],
      (message) => messages.push(message),
      async () => {
        throw new Error('Unexpected parser infrastructure failure')
      },
    )

    expect(messages.at(0)).toEqual({ type: 'started', total: 1, folderName: 'Trip' })
    expect(messages.filter(({ type }) => type === 'complete')).toHaveLength(0)
    expect(messages.filter(({ type }) => type === 'failed')).toEqual([
      { type: 'failed', message: scanFailureMessage },
    ])
    consoleError.mockRestore()
  })

  it('scans photos and GPX files together while preserving per-file GPX failure isolation', async () => {
    const messages: WorkerResponse[] = []
    await runWorkerScan(
      [file('photo.jpg', 'Trip/photo.jpg'), file('route.gpx', 'Trip/route.gpx')],
      (message) => messages.push(message),
      async (item) => ({
        originalIndex: item.originalIndex, fileName: item.file.name,
        metadata: { tags: [], people: [] }, status: 'ready',
      }),
      async (item) => ({
        originalIndex: item.originalIndex, fileName: item.file.name,
        tracks: [], status: 'error', error: 'Malformed XML',
      }),
    )

    expect(messages[0]).toEqual({ type: 'started', total: 2, folderName: 'Trip' })
    expect(messages.some((message) => message.type === 'photo-result')).toBe(true)
    expect(messages.some((message) => message.type === 'gpx-result' && message.outcome.status === 'error')).toBe(true)
    expect(messages.at(-1)).toEqual({ type: 'complete', total: 2 })
  })
})
