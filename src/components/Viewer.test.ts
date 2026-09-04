import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { photo } from '../test/factories'
import Viewer from './Viewer.svelte'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('viewer keyboard behavior', () => {
  async function loadPhotoAtSize(
    surface: HTMLElement,
    image: HTMLImageElement,
    viewport: { width: number; height: number },
    intrinsic: { width: number; height: number },
  ) {
    vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: viewport.width,
      bottom: viewport.height,
      width: viewport.width,
      height: viewport.height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    Object.defineProperties(image, {
      naturalWidth: { configurable: true, value: intrinsic.width },
      naturalHeight: { configurable: true, value: intrinsic.height },
    })
    await fireEvent.load(image)
  }

  it('attempts metadata-error photos and keeps neighboring photos navigable after a decode failure', async () => {
    render(Viewer, {
      photos: [
        photo({ id: 'metadata-error', fileName: 'metadata-error.jpg', status: 'metadata-error' }),
        photo({ id: 'neighbor', fileName: 'neighbor.jpg' }),
      ],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })

    const image = screen.getByAltText('metadata-error.jpg')
    expect(image).toBeInTheDocument()

    await fireEvent.error(image)
    expect(screen.getByRole('status')).toHaveTextContent('This photo can’t be displayed')

    await fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByAltText('neighbor.jpg')).toBeInTheDocument()
  })

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

  it('zooms around the pointer, exposes the grab cursor state, and clamps drag panning', async () => {
    render(Viewer, {
      photos: [photo({ id: 'one', fileName: 'one.jpg' })],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })
    const surface = screen.getByRole('region', { name: 'Current photo' })
    const image = screen.getByAltText('one.jpg') as HTMLImageElement
    await loadPhotoAtSize(surface, image, { width: 800, height: 800 }, { width: 1600, height: 1200 })

    expect(image).toHaveStyle({ width: '800px', height: '600px', left: '0px', top: '100px' })
    expect(surface).not.toHaveClass('can-pan')

    await fireEvent(
      surface,
      new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -350, clientX: 600, clientY: 350 }),
    )
    expect(surface).toHaveClass('can-pan')

    const pointBeforeDrag = { left: Number.parseFloat(image.style.left), top: Number.parseFloat(image.style.top) }
    await fireEvent(
      surface,
      new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX: 400, clientY: 400 }),
    )
    expect(surface).toHaveClass('dragging')
    expect(screen.getByRole('main')).toHaveClass('photo-dragging')
    await fireEvent(window, new MouseEvent('pointermove', { bubbles: true, clientX: 460, clientY: 430 }))
    expect(Number.parseFloat(image.style.left)).toBeGreaterThan(pointBeforeDrag.left)
    expect(Number.parseFloat(image.style.top)).toBeGreaterThan(pointBeforeDrag.top)
    await fireEvent(window, new MouseEvent('pointerup', { bubbles: true }))
    expect(surface).not.toHaveClass('dragging')
    expect(screen.getByRole('main')).not.toHaveClass('photo-dragging')
    expect(surface).toHaveClass('can-pan')
  })

  it('reserves every Arrow key for panning until the photo returns to fit', async () => {
    render(Viewer, {
      photos: [photo({ id: 'one', fileName: 'one.jpg' }), photo({ id: 'two', fileName: 'two.jpg' })],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })
    const surface = screen.getByRole('region', { name: 'Current photo' })
    const image = screen.getByAltText('one.jpg') as HTMLImageElement
    await loadPhotoAtSize(surface, image, { width: 800, height: 800 }, { width: 1600, height: 1200 })

    await fireEvent.keyDown(window, { key: '+' })
    expect(surface).toHaveClass('can-pan')
    for (let step = 0; step < 30; step += 1) await fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByAltText('one.jpg')).toBeInTheDocument()

    await fireEvent(
      surface,
      new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 5000, clientX: 400, clientY: 400 }),
    )
    expect(surface).not.toHaveClass('can-pan')
    await fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByAltText('two.jpg')).toBeInTheDocument()
  })

  it('restores independent per-photo views and lets edge controls navigate while enlarged', async () => {
    render(Viewer, {
      photos: [photo({ id: 'one', fileName: 'one.jpg' }), photo({ id: 'two', fileName: 'two.jpg' })],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })
    const surface = screen.getByRole('region', { name: 'Current photo' })
    const firstImage = screen.getByAltText('one.jpg') as HTMLImageElement
    await loadPhotoAtSize(surface, firstImage, { width: 800, height: 800 }, { width: 1600, height: 1200 })
    await fireEvent.keyDown(window, { key: '+' })
    const rememberedWidth = firstImage.style.width

    await fireEvent.click(screen.getByRole('button', { name: 'Next photo' }))
    expect(screen.getByAltText('two.jpg')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Previous photo' }))

    expect(screen.getByAltText('one.jpg')).toHaveStyle({ width: rememberedWidth })
    expect(surface).toHaveClass('can-pan')
  })

  it('cycles named views and preserves native scale when the viewport changes', async () => {
    render(Viewer, {
      photos: [photo({ id: 'one', fileName: 'one.jpg' })],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })
    const surface = screen.getByRole('region', { name: 'Current photo' })
    const image = screen.getByAltText('one.jpg') as HTMLImageElement
    let viewportWidth = 800
    vi.spyOn(surface, 'getBoundingClientRect').mockImplementation(() => ({
      left: 0,
      top: 0,
      right: viewportWidth,
      bottom: 800,
      width: viewportWidth,
      height: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }))
    Object.defineProperties(image, {
      naturalWidth: { configurable: true, value: 1600 },
      naturalHeight: { configurable: true, value: 1200 },
    })
    await fireEvent.load(image)

    await fireEvent.keyDown(window, { key: 'z' })
    expect(image).toHaveStyle({ width: '1600px', height: '1200px' })

    viewportWidth = 600
    await fireEvent(window, new Event('resize'))
    expect(image).toHaveStyle({ width: '1600px', height: '1200px' })

    await fireEvent.dblClick(surface, { button: 0 })
    expect(image).toHaveStyle({ width: '600px', height: '450px' })
  })

  it('briefly announces each zoom mode selected with Z', async () => {
    vi.useFakeTimers()
    render(Viewer, {
      photos: [photo({ id: 'one', fileName: 'one.jpg' })],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })
    const surface = screen.getByRole('region', { name: 'Current photo' })
    const image = screen.getByAltText('one.jpg') as HTMLImageElement
    await loadPhotoAtSize(surface, image, { width: 800, height: 800 }, { width: 1600, height: 1200 })

    await fireEvent.keyDown(window, { key: 'z' })
    expect(screen.getByRole('status')).toHaveTextContent('Zoom mode · 100%')

    await fireEvent.keyDown(window, { key: '+' })
    await fireEvent.keyDown(window, { key: 'z' })
    expect(screen.getByRole('status')).toHaveTextContent('Zoom mode · Fitted view')
    await fireEvent.keyDown(window, { key: 'z' })
    await fireEvent.keyDown(window, { key: 'z' })
    expect(screen.getByRole('status')).toHaveTextContent('Zoom mode · Custom (125%)')

    await vi.advanceTimersByTimeAsync(1200)
    expect(screen.queryByText('Zoom mode · Custom (125%)')).not.toBeInTheDocument()
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

  it('leaves map mode open for Escape in fullscreen, then closes it outside fullscreen', async () => {
    render(Viewer, {
      photos: [photo({ id: 'located', location: { latitude: 47.45, longitude: 10.99 } })],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })

    let fullscreenElement: Element | null = screen.getByRole('main')
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByRole('button', { name: 'Close map' })).toBeInTheDocument()

    fullscreenElement = null
    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByRole('button', { name: 'Open map' })).toBeInTheDocument()
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
