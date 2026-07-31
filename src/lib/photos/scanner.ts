import { sortPhotos } from './sort'
import type { Photo, ScanOutcome, WorkerRequest, WorkerResponse } from './types'

export type ScanProgress = {
  completed: number
  total: number
  fileName?: string
  folderName?: string
}

type ScanOptions = {
  signal?: AbortSignal
}

function cancellationError(): DOMException {
  return new DOMException('The photo scan was cancelled.', 'AbortError')
}

function scannerError(message?: string): Error {
  return new Error(message || 'The photo scanner stopped unexpectedly.')
}

export async function scanFolder(
  files: File[],
  onProgress: (progress: ScanProgress) => void,
  { signal }: ScanOptions = {},
): Promise<{ photos: Photo[]; folderName: string }> {
  if (signal?.aborted) throw cancellationError()

  const worker = new Worker(new URL('./metadata.worker.ts', import.meta.url), { type: 'module' })
  const byIndex = new Map(files.map((file, originalIndex) => [originalIndex, file]))
  const outcomes: ScanOutcome[] = []
  let folderName = 'Selected folder'

  return new Promise((resolve, reject) => {
    let settled = false

    const cleanup = () => {
      signal?.removeEventListener('abort', handleAbort)
      worker.terminate()
    }

    const settle = (complete: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      complete()
    }

    const fail = (error: Error) => settle(() => reject(error))

    const reportProgress = (next: ScanProgress) => {
      try {
        onProgress(next)
      } catch {
        fail(scannerError('The photo scan could not report progress.'))
      }
    }

    const handleAbort = () => fail(cancellationError())

    worker.addEventListener('error', (event) => {
      event.preventDefault()
      fail(scannerError(event.message))
    })

    worker.addEventListener('messageerror', () => {
      fail(scannerError('The photo scanner returned unreadable data.'))
    })

    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      if (settled) return
      const message = event.data
      if (!message || typeof message !== 'object' || !('type' in message)) {
        fail(scannerError('The photo scanner returned an invalid response.'))
        return
      }

      if (message.type === 'started') {
        folderName = message.folderName
        reportProgress({ completed: 0, total: message.total, folderName })
      } else if (message.type === 'result') {
        outcomes.push(message.outcome)
      } else if (message.type === 'progress') {
        reportProgress({
          completed: message.completed,
          total: message.total,
          fileName: message.fileName,
          folderName,
        })
      } else if (message.type === 'complete') {
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
        settle(() => resolve({ photos: sortPhotos(photos), folderName }))
      } else if (message.type === 'failed') {
        fail(scannerError(message.message))
      } else {
        fail(scannerError('The photo scanner returned an unknown response.'))
      }
    })

    signal?.addEventListener('abort', handleAbort, { once: true })

    try {
      worker.postMessage({ type: 'scan', files } satisfies WorkerRequest)
    } catch {
      fail(scannerError())
    }
  })
}
