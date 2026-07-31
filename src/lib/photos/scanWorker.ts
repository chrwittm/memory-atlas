import { filterFolderFiles, selectedFolderName } from './folder'
import { createScanOutcome } from './outcome'
import { mapWithConcurrency } from './pool'
import type { ScanItem, ScanOutcome, WorkerResponse } from './types'

export const scanFailureMessage = 'The selected folder could not be scanned.'

type OutcomeTask = (item: ScanItem) => Promise<ScanOutcome>
type SendResponse = (message: WorkerResponse) => void

export async function runWorkerScan(
  files: File[],
  send: SendResponse,
  task: OutcomeTask = createScanOutcome,
): Promise<void> {
  try {
    const items = filterFolderFiles(files)
    const total = items.length
    let completed = 0
    send({ type: 'started', total, folderName: selectedFolderName(files) })

    await mapWithConcurrency(items, 4, task, (outcome) => {
      completed += 1
      send({ type: 'result', outcome })
      send({ type: 'progress', completed, total, fileName: outcome.fileName })
    })

    send({ type: 'complete', total })
  } catch (error) {
    console.error('Memory Atlas metadata scan failed.', error)
    send({ type: 'failed', message: scanFailureMessage })
  }
}
