import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { photo } from '../test/factories'
import Viewer from './Viewer.svelte'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('viewer keyboard behavior', () => {
  it('shows available photo information and toggles it with I', async () => {
    const view = render(Viewer, {
      photos: [
        photo({ id: 'one', fileName: 'one.jpg', caption: 'First memory', capturedAt: '2024-01-01T12:00:00.000Z' }),
        photo({ id: 'two', fileName: 'two.jpg', capturedAt: '2024-01-02T12:00:00.000Z' }),
      ],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })

    expect(screen.getByAltText('First memory')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByAltText('two.jpg')).toBeInTheDocument()
    expect(view.container.querySelector('.information-overlay p')).not.toBeInTheDocument()
    expect(view.container.querySelector('.information-overlay time')).toHaveAttribute(
      'datetime',
      '2024-01-02T12:00:00.000Z',
    )
    await fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByLabelText('Photo 2 of 2')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'i' })
    expect(view.container.querySelector('.information-overlay')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show photo information' })).toBeInTheDocument()
  })

  it('resizes the photo and map split with the divider', async () => {
    render(Viewer, {
      photos: [photo({ id: 'located', location: { latitude: 47.45, longitude: 10.99 } })],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    const viewer = screen.getByRole('main')
    const divider = screen.getByRole('separator', { name: 'Resize photo and map' })
    expect(viewer).toHaveStyle('--photo-panel-width: 80%')
    expect(divider).toHaveAttribute('aria-valuenow', '80')
    vi.spyOn(viewer, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      width: 1000,
      top: 0,
      right: 1100,
      bottom: 800,
      height: 800,
      x: 100,
      y: 0,
      toJSON: () => ({}),
    })

    await fireEvent(divider, new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 600 }))
    await fireEvent(window, new MouseEvent('pointermove', { bubbles: true, clientX: 800 }))
    await fireEvent(window, new MouseEvent('pointerup', { bubbles: true }))

    expect(viewer).toHaveStyle('--photo-panel-width: 70%')
    expect(divider).toHaveAttribute('aria-valuenow', '70')
  })

  it('keeps map mode open while navigating across photos without GPS', async () => {
    render(Viewer, {
      photos: [
        photo({ id: 'located-one', location: { latitude: 47.45, longitude: 10.99 } }),
        photo({ id: 'unlocated' }),
        photo({ id: 'located-two', location: { latitude: 48.14, longitude: 11.58 } }),
      ],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    await fireEvent.keyDown(window, { key: 'ArrowRight' })

    expect(screen.getByRole('button', { name: 'Close map' })).toBeInTheDocument()
    expect(screen.getByRole('separator', { name: 'Resize photo and map' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('This photo doesn’t have GPS coordinates.')

    await fireEvent.keyDown(window, { key: 'm' })
    expect(screen.queryByText('This photo doesn’t have GPS coordinates.')).not.toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'M' })
    expect(screen.getByRole('status')).toHaveTextContent('This photo doesn’t have GPS coordinates.')

    await fireEvent.keyDown(window, { key: 'ArrowRight' })

    expect(screen.getByRole('button', { name: 'Close map' })).toBeInTheDocument()
    expect(screen.queryByText('This photo doesn’t have GPS coordinates.')).not.toBeInTheDocument()
  })

  it('toggles browser fullscreen with F', async () => {
    render(Viewer, {
      photos: [photo({ id: 'one' })],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })

    const viewer = screen.getByRole('main')
    let fullscreenElement: Element | null = null
    const requestFullscreen = vi.fn(async () => {
      fullscreenElement = viewer
    })
    const exitFullscreen = vi.fn(async () => {
      fullscreenElement = null
    })

    Object.defineProperties(document, {
      fullscreenEnabled: { configurable: true, value: true },
      fullscreenElement: { configurable: true, get: () => fullscreenElement },
      exitFullscreen: { configurable: true, value: exitFullscreen },
    })
    Object.defineProperty(viewer, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    })

    await fireEvent.keyDown(window, { key: 'f' })
    expect(requestFullscreen).toHaveBeenCalledOnce()

    await fireEvent.keyDown(window, { key: 'f', repeat: true })
    expect(exitFullscreen).not.toHaveBeenCalled()

    await fireEvent.keyDown(window, { key: 'F' })
    expect(exitFullscreen).toHaveBeenCalledOnce()
  })

  it('explains when fullscreen is unavailable', async () => {
    render(Viewer, {
      photos: [photo({ id: 'one' })],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })

    Object.defineProperties(document, {
      fullscreenEnabled: { configurable: true, value: false },
      fullscreenElement: { configurable: true, value: null },
    })

    await fireEvent.keyDown(window, { key: 'f' })

    expect(screen.getByRole('status')).toHaveTextContent('Fullscreen is not available in this browser.')
  })

  it('fades idle controls initially and reveals them for keyboard focus', async () => {
    vi.useFakeTimers()
    render(Viewer, {
      photos: [photo({ id: 'one' }), photo({ id: 'two' })],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })

    const viewer = screen.getByRole('main')
    await vi.advanceTimersByTimeAsync(2200)
    expect(viewer).toHaveClass('controls-hidden')

    const folderButton = screen.getByRole('button', { name: 'Choose another folder' })
    folderButton.focus()
    await fireEvent.focusIn(folderButton)
    expect(viewer).not.toHaveClass('controls-hidden')

    await vi.advanceTimersByTimeAsync(2200)
    expect(viewer).not.toHaveClass('controls-hidden')
  })
})
