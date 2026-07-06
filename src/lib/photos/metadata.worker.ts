/// <reference lib="webworker" />

import { filterFolderFiles, selectedFolderName } from './folder'
import { createScanOutcome } from './outcome'
import { mapWithConcurrency } from './pool'
import type { WorkerRequest, WorkerResponse } from './types'

const context = self as DedicatedWorkerGlobalScope

function send(message: WorkerResponse): void {
  context.postMessage(message)
}

context.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type !== 'scan') return

  const items = filterFolderFiles(event.data.files)
  const total = items.length
  let completed = 0
  send({ type: 'started', total, folderName: selectedFolderName(event.data.files) })

  await mapWithConcurrency(items, 4, createScanOutcome, (outcome) => {
    completed += 1
    send({ type: 'result', outcome })
    send({ type: 'progress', completed, total, fileName: outcome.fileName })
  })

  send({ type: 'complete', total })
})

export {}
