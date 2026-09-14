import { beforeEach, describe, expect, it, vi } from 'vitest'
import { file } from '../../test/factories'
import { scanFolder } from './scanner'
import type { ScanOutcome, WorkerResponse } from './types'

class ControllableWorker extends EventTarget {
  static instances: ControllableWorker[] = []

  postMessage = vi.fn()
  terminate = vi.fn()

  constructor() {
    super()
    ControllableWorker.instances.push(this)
  }

  respond(message: WorkerResponse | object) {
    this.dispatchEvent(new MessageEvent('message', { data: message }))
  }

  crash(message = 'Worker crashed') {
    this.dispatchEvent(new ErrorEvent('error', { message, cancelable: true }))
  }

  sendUnreadableData() {
    this.dispatchEvent(new MessageEvent('messageerror'))
  }
}

function outcome(originalIndex: number, fileName: string): ScanOutcome {
  return {
    originalIndex,
    fileName,
    metadata: { tags: [], people: [] },
    status: 'ready',
  }
}

function currentWorker(): ControllableWorker {
  const worker = ControllableWorker.instances.at(-1)
  if (!worker) throw new Error('Expected a worker instance.')
  return worker
}

describe('scanFolder worker contract', () => {
  beforeEach(() => {
    ControllableWorker.instances = []
    vi.stubGlobal('Worker', ControllableWorker)
  })

  it('settles an empty scan and terminates its worker', async () => {
    const progress = vi.fn()
    const pending = scanFolder([], progress)
    const worker = currentWorker()

    worker.respond({ type: 'started', total: 0, folderName: 'Empty' })
    worker.respond({ type: 'complete', total: 0 })

    await expect(pending).resolves.toEqual({ photos: [], tracks: [], gpxFailures: [], folderName: 'Empty' })
    expect(progress).toHaveBeenCalledWith({ completed: 0, total: 0, folderName: 'Empty' })
    expect(worker.terminate).toHaveBeenCalledOnce()
  })

  it('collects successful outcomes, reports progress, and sorts the result', async () => {
    const files = [file('10-last.jpg', 'Trip/10-last.jpg'), file('2-first.jpg', 'Trip/2-first.jpg')]
    const progress = vi.fn()
    const pending = scanFolder(files, progress)
    const worker = currentWorker()

    worker.respond({ type: 'started', total: 2, folderName: 'Trip' })
    worker.respond({ type: 'photo-result', outcome: outcome(0, '10-last.jpg') })
    worker.respond({ type: 'progress', completed: 1, total: 2, fileName: '10-last.jpg' })
    worker.respond({ type: 'photo-result', outcome: outcome(1, '2-first.jpg') })
    worker.respond({ type: 'progress', completed: 2, total: 2, fileName: '2-first.jpg' })
    worker.respond({ type: 'complete', total: 2 })

    const result = await pending
    expect(result.photos.map(({ fileName }) => fileName)).toEqual(['2-first.jpg', '10-last.jpg'])
    expect(progress).toHaveBeenLastCalledWith({
      completed: 2,
      total: 2,
      fileName: '2-first.jpg',
      folderName: 'Trip',
    })
    expect(worker.terminate).toHaveBeenCalledOnce()
  })

  it('sorts GPX files naturally and returns valid tracks beside isolated failures', async () => {
    const files = [file('10-route.gpx', 'Trip/10-route.gpx'), file('2-route.gpx', 'Trip/2-route.gpx')]
    const pending = scanFolder(files, () => undefined)
    const worker = currentWorker()
    worker.respond({ type: 'started', total: 2, folderName: 'Trip' })
    worker.respond({ type: 'gpx-result', outcome: {
      originalIndex: 0, fileName: '10-route.gpx', tracks: [], status: 'error', error: 'Malformed XML',
    } })
    worker.respond({ type: 'gpx-result', outcome: {
      originalIndex: 1, fileName: '2-route.gpx', status: 'ready', tracks: [{
        id: 'route', fileName: '2-route.gpx', originalIndex: 1, documentIndex: 0,
        segments: [[[10, 47], [11, 48]]],
      }],
    } })
    worker.respond({ type: 'complete', total: 2 })

    await expect(pending).resolves.toMatchObject({
      photos: [],
      tracks: [{ fileName: '2-route.gpx' }],
      gpxFailures: [{ fileName: '10-route.gpx', error: 'Malformed XML' }],
    })
  })

  it('rejects a fatal worker response and ignores later terminal messages', async () => {
    const pending = scanFolder([file('one.jpg')], () => undefined)
    const worker = currentWorker()

    worker.respond({ type: 'failed', message: 'The selected folder could not be scanned.' })
    worker.respond({ type: 'complete', total: 1 })

    await expect(pending).rejects.toThrow('The selected folder could not be scanned.')
    expect(worker.terminate).toHaveBeenCalledOnce()
  })

  it('rejects and terminates on worker crashes and unreadable messages', async () => {
    const crashed = scanFolder([file('one.jpg')], () => undefined)
    const crashedWorker = currentWorker()
    crashedWorker.crash()
    await expect(crashed).rejects.toThrow('Worker crashed')
    expect(crashedWorker.terminate).toHaveBeenCalledOnce()

    const unreadable = scanFolder([file('two.jpg')], () => undefined)
    const unreadableWorker = currentWorker()
    unreadableWorker.sendUnreadableData()
    await expect(unreadable).rejects.toThrow('unreadable data')
    expect(unreadableWorker.terminate).toHaveBeenCalledOnce()
  })

  it('cancels predictably and terminates the worker', async () => {
    const controller = new AbortController()
    const pending = scanFolder([file('one.jpg')], () => undefined, { signal: controller.signal })
    const worker = currentWorker()

    controller.abort()

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(worker.terminate).toHaveBeenCalledOnce()
  })

  it('settles instead of stranding when the progress callback throws', async () => {
    const pending = scanFolder([file('one.jpg')], () => {
      throw new Error('UI update failed')
    })
    const worker = currentWorker()

    worker.respond({ type: 'started', total: 1, folderName: 'Trip' })

    await expect(pending).rejects.toThrow('could not report progress')
    expect(worker.terminate).toHaveBeenCalledOnce()
  })
})
