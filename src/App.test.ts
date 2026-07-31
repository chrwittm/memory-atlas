import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { file, photo } from './test/factories'

vi.mock('./lib/photos/scanner', () => ({
  scanFolder: vi.fn(),
}))

import App from './App.svelte'
import { scanFolder } from './lib/photos/scanner'

const scanFolderMock = vi.mocked(scanFolder)

function select(files: File[]) {
  return fireEvent.change(screen.getByLabelText('Choose photo folder'), {
    target: { files },
  })
}

afterEach(() => {
  cleanup()
  scanFolderMock.mockReset()
})

describe('application folder journey', () => {
  it('moves through loading, viewer, folder replacement, and empty states', async () => {
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL')
    scanFolderMock
      .mockImplementationOnce(async (_files, onProgress) => {
        onProgress({ completed: 0, total: 1, folderName: 'First trip' })
        return {
          photos: [photo({ id: 'first', fileName: 'first.jpg' })],
          folderName: 'First trip',
        }
      })
      .mockResolvedValueOnce({ photos: [], folderName: 'Empty trip' })

    render(App)
    expect(screen.getByRole('heading', { name: 'Memory Atlas' })).toBeInTheDocument()

    await select([file('first.jpg', 'First trip/first.jpg')])
    expect(await screen.findByRole('main', { name: 'First trip photo viewer' })).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Choose another folder' }))
    expect(screen.getByRole('heading', { name: 'Memory Atlas' })).toBeInTheDocument()
    expect(revokeObjectUrl).toHaveBeenCalled()

    await select([file('notes.txt', 'Empty trip/notes.txt')])
    expect(await screen.findByRole('heading', { name: 'No JPEG photos found' })).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Choose another folder' }))
    expect(screen.getByRole('heading', { name: 'Memory Atlas' })).toBeInTheDocument()
    revokeObjectUrl.mockRestore()
  })

  it('shows a terminal scan failure and lets the user return', async () => {
    scanFolderMock.mockImplementationOnce(async (_files, onProgress) => {
      onProgress({ completed: 0, total: 1, folderName: 'Broken trip' })
      throw new Error('The selected folder could not be scanned.')
    })

    render(App)
    await select([file('broken.jpg', 'Broken trip/broken.jpg')])

    expect(await screen.findByRole('heading', { name: 'The folder could not be read' })).toBeInTheDocument()
    expect(screen.getByText('The selected folder could not be scanned.')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Choose another folder' }))
    expect(screen.getByRole('heading', { name: 'Memory Atlas' })).toBeInTheDocument()
  })

  it('cancels a pending scan and prevents its stale result from replacing a later folder', async () => {
    let resolveFirst: ((value: Awaited<ReturnType<typeof scanFolder>>) => void) | undefined
    const firstScan = new Promise<Awaited<ReturnType<typeof scanFolder>>>((resolve) => {
      resolveFirst = resolve
    })
    scanFolderMock
      .mockImplementationOnce(async (_files, onProgress, options) => {
        onProgress({ completed: 0, total: 1, folderName: 'Slow trip' })
        expect(options?.signal?.aborted).toBe(false)
        return firstScan
      })
      .mockResolvedValueOnce({
        photos: [photo({ id: 'new', fileName: 'new.jpg' })],
        folderName: 'New trip',
      })

    render(App)
    await select([file('slow.jpg', 'Slow trip/slow.jpg')])
    expect(screen.getByRole('heading', { name: 'Reading the moments' })).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('heading', { name: 'Memory Atlas' })).toBeInTheDocument()

    await select([file('new.jpg', 'New trip/new.jpg')])
    expect(await screen.findByRole('main', { name: 'New trip photo viewer' })).toBeInTheDocument()

    resolveFirst?.({ photos: [], folderName: 'Slow trip' })
    await waitFor(() => {
      expect(screen.getByRole('main', { name: 'New trip photo viewer' })).toBeInTheDocument()
    })
  })
})
