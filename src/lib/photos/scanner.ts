import { sortPhotos } from './sort'
import type { Photo, ScanOutcome, WorkerRequest, WorkerResponse } from './types'

export type ScanProgress = {
  completed: number
  total: number
  fileName?: string
  folderName?: string
}

export async function scanFolder(
  files: File[],
  onProgress: (progress: ScanProgress) => void,
): Promise<{ photos: Photo[]; folderName: string }> {
  const worker = new Worker(new URL('./metadata.worker.ts', import.meta.url), { type: 'module' })
  const byIndex = new Map(files.map((file, originalIndex) => [originalIndex, file]))
  const outcomes: ScanOutcome[] = []
  let folderName = 'Selected folder'

  return new Promise((resolve, reject) => {
    worker.addEventListener('error', (event) => {
      worker.terminate()
      reject(new Error(event.message || 'The photo scanner stopped unexpectedly.'))
    })

    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const message = event.data
      if (message.type === 'started') {
        folderName = message.folderName
        onProgress({ completed: 0, total: message.total, folderName })
      } else if (message.type === 'result') {
        outcomes.push(message.outcome)
      } else if (message.type === 'progress') {
        onProgress({ ...message, folderName })
      } else if (message.type === 'complete') {
        worker.terminate()
        const photos = outcomes.flatMap((outcome) => {
          const file = byIndex.get(outcome.originalIndex)
          if (!file) return []
          return [{
            id: `${outcome.originalIndex}:${file.name}:${file.size}:${file.lastModified}`,
            file,
            fileName: outcome.fileName,
            originalIndex: outcome.originalIndex,
            ...outcome.metadata,
            status: outcome.status,
            error: outcome.error,
          } satisfies Photo]
        })
        resolve({ photos: sortPhotos(photos), folderName })
      }
    })

    worker.postMessage({ type: 'scan', files } satisfies WorkerRequest)
  })
}

