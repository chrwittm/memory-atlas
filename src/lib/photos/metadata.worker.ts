/// <reference lib="webworker" />

import { runWorkerScan } from './scanWorker'
import type { WorkerRequest, WorkerResponse } from './types'

const context = self as DedicatedWorkerGlobalScope

function send(message: WorkerResponse): void {
  context.postMessage(message)
}

context.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type !== 'scan') return
  await runWorkerScan(event.data.files, send)
})

export {}
