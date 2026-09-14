import { filterFolderFiles, selectedFolderName } from './folder'
import { createScanOutcome } from './outcome'
import { createGpxOutcome } from '../gpx/parse'
import { mapWithConcurrency } from './pool'
import type { GpxOutcome, GpxScanItem, PhotoScanItem, ScanItem, ScanOutcome, WorkerResponse } from './types'

export const scanFailureMessage = 'The selected folder could not be scanned.'

type PhotoOutcomeTask = (item: PhotoScanItem) => Promise<ScanOutcome>
type GpxOutcomeTask = (item: GpxScanItem) => Promise<GpxOutcome>
type SendResponse = (message: WorkerResponse) => void

export async function runWorkerScan(
  files: File[],
  send: SendResponse,
  photoTask: PhotoOutcomeTask = createScanOutcome,
  gpxTask: GpxOutcomeTask = createGpxOutcome,
): Promise<void> {
  try {
    const items = filterFolderFiles(files)
    const total = items.length
    let completed = 0
    send({ type: 'started', total, folderName: selectedFolderName(files) })

    await mapWithConcurrency(items, 4, async (item: ScanItem) => {
      if (item.kind === 'photo') return { kind: 'photo' as const, outcome: await photoTask(item) }
      return { kind: 'gpx' as const, outcome: await gpxTask(item) }
    }, (result) => {
      completed += 1
      send(result.kind === 'photo'
        ? { type: 'photo-result', outcome: result.outcome }
        : { type: 'gpx-result', outcome: result.outcome })
      send({ type: 'progress', completed, total, fileName: result.outcome.fileName })
    })

    send({ type: 'complete', total })
  } catch (error) {
    console.error('Memory Atlas metadata scan failed.', error)
    send({ type: 'failed', message: scanFailureMessage })
  }
}
