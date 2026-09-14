import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { photo } from '../test/factories'

vi.mock('./MapView.svelte', async () => ({
  default: (await import('../test/MapStub.svelte')).default,
}))

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
    const photoToast = screen.getByRole('status')
    expect(photoToast).toHaveTextContent('Zoom mode · 100%')
    expect(photoToast).toHaveClass('frame-toast')
    expect(photoToast.closest('.photo-panel')).toBeInTheDocument()

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
      photos: [photo({ id: 'unlocated' })],
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
    await screen.findByTestId('map-stub')
    await fireEvent.keyDown(window, { key: 'ArrowRight' })

    expect(screen.getByRole('button', { name: 'Close map' })).toBeInTheDocument()
    expect(screen.getByRole('separator', { name: 'Resize photo and map' })).toBeInTheDocument()
    expect(screen.getByText('This photo doesn’t have GPS coordinates.')).toBeInTheDocument()

    await fireEvent.keyDown(window, { key: 'm' })
    expect(screen.queryByText('This photo doesn’t have GPS coordinates.')).not.toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'M' })
    expect(screen.getByText('This photo doesn’t have GPS coordinates.')).toBeInTheDocument()

    await fireEvent.keyDown(window, { key: 'ArrowRight' })

    expect(screen.getByRole('button', { name: 'Close map' })).toBeInTheDocument()
    expect(screen.queryByText('This photo doesn’t have GPS coordinates.')).not.toBeInTheDocument()
  })

  it('starts the map renderer when a map opened without GPS reaches a located photo', async () => {
    render(Viewer, {
      photos: [
        photo({ id: 'unlocated' }),
        photo({ id: 'located', location: { latitude: 47.45, longitude: 10.99 } }),
      ],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    expect(screen.getByText('This photo doesn’t have GPS coordinates.')).toBeInTheDocument()
    expect(screen.queryByTestId('map-stub')).not.toBeInTheDocument()

    await fireEvent.keyDown(window, { key: 'ArrowRight' })

    expect(await screen.findByTestId('map-stub')).toBeInTheDocument()
    expect(screen.queryByText('This photo doesn’t have GPS coordinates.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Zoom view: Current photo/ })).toBeInTheDocument()
  })

  it('loops focus through the visible spatial regions in both directions', async () => {
    render(Viewer, {
      photos: [photo({ id: 'unlocated' })],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })

    const photoRegion = screen.getByRole('region', { name: 'Current photo' })
    expect(document.activeElement).toBe(photoRegion)
    await fireEvent.keyDown(window, { key: 'Tab' })
    expect(document.activeElement).toBe(photoRegion)
    await fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(photoRegion)

    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    const divider = screen.getByRole('separator', { name: 'Resize photo and map' })
    const mapRegion = screen.getByRole('region', { name: 'Map' })
    expect(document.activeElement).toBe(photoRegion)

    await fireEvent.keyDown(window, { key: 'Tab' })
    expect(document.activeElement).toBe(divider)
    await fireEvent.keyDown(window, { key: 'Tab' })
    expect(document.activeElement).toBe(mapRegion)
    await fireEvent.keyDown(window, { key: 'Tab' })
    expect(document.activeElement).toBe(photoRegion)

    await fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(mapRegion)
    await fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(divider)
    await fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(photoRegion)
  })

  it('omits the hidden divider from the narrow stacked focus loop', async () => {
    const originalMatchMedia = window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({
        matches: true,
        media: '(max-width: 760px)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    })

    try {
      render(Viewer, {
        photos: [photo({ id: 'unlocated' })],
        folderName: 'Trip',
        onChooseAnother: () => undefined,
      })
      await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
      const photoRegion = screen.getByRole('region', { name: 'Current photo' })
      const mapRegion = screen.getByRole('region', { name: 'Map' })
      expect(screen.getByRole('separator')).toHaveAttribute('tabindex', '-1')

      await fireEvent.keyDown(window, { key: 'Tab' })
      expect(document.activeElement).toBe(mapRegion)
      await fireEvent.keyDown(window, { key: 'Tab' })
      expect(document.activeElement).toBe(photoRegion)
    } finally {
      Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia })
    }
  })

  it('keeps viewer controls out of the loop and returns pointer actions to photo focus', async () => {
    render(Viewer, {
      photos: [photo({ id: 'one' }), photo({ id: 'two' })],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })

    const photoRegion = screen.getByRole('region', { name: 'Current photo' })
    for (const button of screen.getAllByRole('button')) expect(button).toHaveAttribute('tabindex', '-1')

    await fireEvent.click(screen.getByRole('button', { name: 'Next photo' }))
    expect(document.activeElement).toBe(photoRegion)
    await fireEvent.click(screen.getByRole('button', { name: 'Hide photo information' }))
    expect(document.activeElement).toBe(photoRegion)
    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    expect(document.activeElement).toBe(photoRegion)
  })

  it('moves focus safely to the photo when map state is closed', async () => {
    render(Viewer, {
      photos: [photo({ id: 'unlocated' })],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })
    const photoRegion = screen.getByRole('region', { name: 'Current photo' })
    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    const mapRegion = screen.getByRole('region', { name: 'Map' })
    mapRegion.focus()

    await fireEvent.keyDown(window, { key: 'Escape' })
    await Promise.resolve()
    expect(screen.queryByRole('region', { name: 'Map' })).not.toBeInTheDocument()
    expect(document.activeElement).toBe(photoRegion)
  })

  it('jumps ten positions with repeat, clamps boundaries, and supports Home and End', async () => {
    const photos = Array.from({ length: 25 }, (_, index) =>
      photo({ id: `photo-${index + 1}`, fileName: `photo-${index + 1}.jpg` }),
    )
    render(Viewer, { photos, folderName: 'Trip', onChooseAnother: () => undefined })

    await fireEvent.keyDown(window, { key: 'PageDown' })
    expect(screen.getByLabelText('Photo 11 of 25')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'PageDown', repeat: true })
    expect(screen.getByLabelText('Photo 21 of 25')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'PageDown', repeat: true })
    expect(screen.getByLabelText('Photo 25 of 25')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'PageDown', repeat: true })
    expect(screen.getByLabelText('Photo 25 of 25')).toBeInTheDocument()

    await fireEvent.keyDown(window, { key: 'PageUp' })
    expect(screen.getByLabelText('Photo 15 of 25')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'Home' })
    expect(screen.getByLabelText('Photo 1 of 25')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'End' })
    expect(screen.getByLabelText('Photo 25 of 25')).toBeInTheDocument()
  })

  it('synchronizes an unreadable-photo jump with information and map state', async () => {
    const photos = Array.from({ length: 11 }, (_, index) => photo({ id: `photo-${index}` }))
    photos[0] = photo({ id: 'unreadable', fileName: 'unreadable.jpg', status: 'read-error' })
    photos[10] = photo({
      id: 'destination',
      fileName: 'destination.jpg',
      caption: 'Distant memory',
      capturedAt: '2026-09-12T12:00:00.000Z',
      location: { latitude: 47.45, longitude: 10.99 },
    })
    const view = render(Viewer, { photos, folderName: 'Trip', onChooseAnother: () => undefined })
    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    expect(screen.getByText('This photo doesn’t have GPS coordinates.')).toBeInTheDocument()

    await fireEvent.keyDown(window, { key: 'PageDown' })

    expect(screen.getByAltText('Distant memory')).toBeInTheDocument()
    expect(screen.getByLabelText('Photo 11 of 11')).toBeInTheDocument()
    expect(view.container.querySelector('.information-overlay p')).toHaveTextContent('Distant memory')
    expect(view.container.querySelector('.information-overlay time')).toHaveAttribute(
      'datetime',
      '2026-09-12T12:00:00.000Z',
    )
    expect(screen.queryByText('This photo doesn’t have GPS coordinates.')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Map' })).toBeInTheDocument()
  })

  it('quick navigation works while enlarged and restores the destination photo view', async () => {
    const photos = Array.from({ length: 11 }, (_, index) =>
      photo({ id: `photo-${index + 1}`, fileName: `photo-${index + 1}.jpg` }),
    )
    render(Viewer, { photos, folderName: 'Trip', onChooseAnother: () => undefined })
    const surface = screen.getByRole('region', { name: 'Current photo' })
    const firstImage = screen.getByAltText('photo-1.jpg') as HTMLImageElement
    await loadPhotoAtSize(surface, firstImage, { width: 800, height: 800 }, { width: 1600, height: 1200 })
    await fireEvent.keyDown(window, { key: '+' })
    const rememberedWidth = firstImage.style.width

    await fireEvent.keyDown(window, { key: 'End' })
    expect(screen.getByLabelText('Photo 11 of 11')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'Home' })
    expect(screen.getByAltText('photo-1.jpg')).toHaveStyle({ width: rememberedWidth })
  })

  it('uses universal collection keys on the map and larger Page-key steps on the divider', async () => {
    const photos = Array.from({ length: 12 }, (_, index) => photo({ id: `photo-${index}` }))
    render(Viewer, { photos, folderName: 'Trip', onChooseAnother: () => undefined })
    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    const viewer = screen.getByRole('main')
    const divider = screen.getByRole('separator')
    divider.focus()

    await fireEvent.keyDown(divider, { key: 'Home' })
    expect(viewer).toHaveStyle('--photo-panel-width: 20%')
    expect(screen.getByLabelText('Photo 1 of 12')).toBeInTheDocument()
    await fireEvent.keyDown(divider, { key: 'PageUp' })
    expect(viewer).toHaveStyle('--photo-panel-width: 30%')
    await fireEvent.keyDown(divider, { key: 'PageDown' })
    expect(viewer).toHaveStyle('--photo-panel-width: 20%')
    expect(screen.getByLabelText('Photo 1 of 12')).toBeInTheDocument()
    await fireEvent.keyDown(divider, { key: 'End' })
    expect(viewer).toHaveStyle('--photo-panel-width: 80%')

    screen.getByRole('region', { name: 'Map' }).focus()
    await fireEvent.keyDown(window, { key: 'PageDown' })
    expect(screen.getByLabelText('Photo 11 of 12')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'End' })
    expect(screen.getByLabelText('Photo 12 of 12')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'Home' })
    expect(screen.getByLabelText('Photo 1 of 12')).toBeInTheDocument()
  })

  it('does not invoke shortcuts while modifier keys or composition are active', async () => {
    render(Viewer, {
      photos: [photo({ id: 'one' }), photo({ id: 'two' })],
      folderName: 'Trip',
      onChooseAnother: () => undefined,
    })
    const photoRegion = screen.getByRole('region', { name: 'Current photo' })

    await fireEvent.keyDown(window, { key: 'PageDown', ctrlKey: true })
    await fireEvent.keyDown(window, { key: 'End', shiftKey: true })
    await fireEvent.keyDown(window, { key: 'm', metaKey: true })
    await fireEvent.keyDown(window, { key: 'i', isComposing: true })
    await fireEvent.keyDown(window, { key: 'Tab', altKey: true })

    expect(screen.getByLabelText('Photo 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open map' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hide photo information' })).toBeInTheDocument()
    expect(document.activeElement).toBe(photoRegion)
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

  it.each(['photo', 'folder', 'divider', 'map toggle'])('toggles fullscreen from %s focus', async (focus) => {
    render(Viewer, {
      photos: [photo({ id: 'one' })], folderName: 'Trip', onChooseAnother: () => undefined,
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    const viewer = screen.getByRole('main')
    let fullscreenElement: Element | null = null
    const enter = vi.fn(async () => { fullscreenElement = viewer })
    const exit = vi.fn(async () => { fullscreenElement = null })
    Object.defineProperties(document, {
      fullscreenEnabled: { configurable: true, value: true },
      fullscreenElement: { configurable: true, get: () => fullscreenElement },
      exitFullscreen: { configurable: true, value: exit },
    })
    Object.defineProperty(viewer, 'requestFullscreen', { configurable: true, value: enter })
    const targets = {
      photo: screen.getByRole('region', { name: 'Current photo' }),
      folder: screen.getByRole('button', { name: 'Choose another folder' }),
      divider: screen.getByRole('separator', { name: 'Resize photo and map' }),
      'map toggle': screen.getByRole('button', { name: 'Close map' }),
    }
    const target = targets[focus as keyof typeof targets]
    target.focus()
    await fireEvent.keyDown(target, { key: 'f' })
    expect(enter).toHaveBeenCalledOnce()
    await fireEvent.keyDown(target, { key: 'f' })
    expect(exit).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Close map' })).toBeInTheDocument()
  })

  it('reports rejected fullscreen entry and exit promises', async () => {
    render(Viewer, {
      photos: [photo({ id: 'one' })], folderName: 'Trip', onChooseAnother: () => undefined,
    })
    const viewer = screen.getByRole('main')
    let fullscreenElement: Element | null = null
    Object.defineProperties(document, {
      fullscreenEnabled: { configurable: true, value: true },
      fullscreenElement: { configurable: true, get: () => fullscreenElement },
      exitFullscreen: { configurable: true, value: vi.fn().mockRejectedValue(new Error('Denied')) },
    })
    Object.defineProperty(viewer, 'requestFullscreen', {
      configurable: true, value: vi.fn().mockRejectedValue(new Error('Denied')),
    })
    await fireEvent.keyDown(window, { key: 'f' })
    expect(screen.getByRole('status')).toHaveTextContent('Fullscreen could not be opened.')
    fullscreenElement = viewer
    await fireEvent.keyDown(window, { key: 'f' })
    expect(screen.getByRole('status')).toHaveTextContent('Fullscreen could not be closed.')
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

  it('shows grouped direct zoom selection while preserving the three GPS modes', async () => {
    render(Viewer, {
      photos: [photo({ id: 'located', location: { latitude: 47.45, longitude: 10.99 } })],
      folderName: 'Trip', onChooseAnother: () => undefined,
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    expect(screen.getByRole('button', { name: /GPS content: Current photo/ })).toBeInTheDocument()
    const zoomControl = await screen.findByRole('button', { name: /Zoom view: Current photo/ })
    await fireEvent.click(zoomControl)
    expect(screen.getByRole('menu', { name: 'Choose zoom view' })).toBeInTheDocument()
    for (const group of ['Focus', 'Time', 'Place', 'Collection']) {
      expect(screen.getByRole('group', { name: group })).toBeInTheDocument()
    }
    expect(screen.getByRole('menuitemradio', { name: 'Current photo' })).toHaveAttribute('aria-checked', 'true')
    await fireEvent.click(screen.getByRole('menuitemradio', { name: 'California' }))
    expect(screen.queryByRole('menu', { name: 'Choose zoom view' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Zoom view: California/ })).toBeInTheDocument()
    expect(await screen.findByText('Map view: California')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: /Zoom view: California/ }))
    await fireEvent.pointerDown(screen.getByRole('region', { name: 'Current photo' }))
    expect(screen.queryByRole('menu', { name: 'Choose zoom view' })).not.toBeInTheDocument()

    await fireEvent.keyDown(window, { key: 'g' })
    expect(await screen.findByRole('button', { name: /GPS content: All photos/ })).toBeInTheDocument()
    expect(screen.getByText('GPS content: All photos')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'G', shiftKey: true })
    expect(screen.getByRole('button', { name: /GPS content: Photos \+ GPX track/ })).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'g', repeat: true })
    expect(screen.getByRole('button', { name: /GPS content: Photos \+ GPX track/ })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: /GPS content: Photos \+ GPX track/ }))
    expect(screen.getByRole('button', { name: /GPS content: Current photo/ })).toBeInTheDocument()

    await fireEvent.keyDown(window, { key: 'g' })
    await fireEvent.keyDown(window, { key: 'm' })
    await fireEvent.keyDown(window, { key: 'g' })
    await fireEvent.keyDown(window, { key: 'm' })
    expect(screen.getByRole('button', { name: /GPS content: All photos/ })).toBeInTheDocument()
  })

  it('ignores G while closed, modified, composing, or repeating', async () => {
    render(Viewer, {
      photos: [photo({ id: 'unlocated' })],
      folderName: 'Trip', onChooseAnother: () => undefined,
    })
    await fireEvent.keyDown(window, { key: 'g' })
    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    for (const event of [
      { key: 'g', ctrlKey: true }, { key: 'g', altKey: true }, { key: 'g', metaKey: true },
      { key: 'g', isComposing: true }, { key: 'g', repeat: true },
    ]) await fireEvent.keyDown(window, event)
    expect(screen.getByRole('button', { name: /GPS content: Current photo/ })).toBeInTheDocument()
  })

  it('routes labeled-Z camera shortcuts only from map focus and leaves Command+Z untouched', async () => {
    render(Viewer, {
      photos: [photo({ id: 'located', location: { latitude: 47.45, longitude: 10.99 } })],
      tracks: [{ id: 'route', fileName: 'route.gpx', originalIndex: 0, documentIndex: 0,
        segments: [[[10.9, 47.4], [11, 47.5]]] }],
      folderName: 'Trip', onChooseAnother: () => undefined,
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    await screen.findByTestId('map-stub')
    const mapRegion = screen.getByRole('region', { name: 'Map' })
    mapRegion.focus()

    const optionZ = new KeyboardEvent('keydown', {
      key: 'Ω', code: 'KeyY', altKey: true, bubbles: true, cancelable: true,
    })
    window.dispatchEvent(optionZ)
    expect(optionZ.defaultPrevented).toBe(true)
    const mapToast = await screen.findByText('Map view: Complete track')
    expect(mapToast).toHaveClass('frame-toast')
    expect(mapToast.closest('.map-region')).toBe(mapRegion)

    const commandZ = new KeyboardEvent('keydown', {
      key: 'z', metaKey: true, bubbles: true, cancelable: true,
    })
    window.dispatchEvent(commandZ)
    expect(commandZ.defaultPrevented).toBe(false)

    const commandOptionZ = new KeyboardEvent('keydown', {
      key: 'Ω', code: 'KeyY', altKey: true, metaKey: true, bubbles: true, cancelable: true,
    })
    window.dispatchEvent(commandOptionZ)
    expect(commandOptionZ.defaultPrevented).toBe(true)
    expect(await screen.findByText('Map view: All photos')).toBeInTheDocument()

    const repeated = new KeyboardEvent('keydown', {
      key: 'z', repeat: true, bubbles: true, cancelable: true,
    })
    window.dispatchEvent(repeated)
    expect(repeated.defaultPrevented).toBe(false)
  })

  it('explains unavailable camera shortcuts before a no-data map renderer starts', async () => {
    render(Viewer, {
      photos: [photo({ id: 'unlocated', capturedLocalDate: '2026-06-20' })],
      folderName: 'Trip', onChooseAnother: () => undefined,
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    const mapRegion = screen.getByRole('region', { name: 'Map' })
    mapRegion.focus()

    const current = new KeyboardEvent('keydown', {
      key: 'Z', shiftKey: true, bubbles: true, cancelable: true,
    })
    window.dispatchEvent(current)
    expect(current.defaultPrevented).toBe(true)
    expect(await screen.findByText('Current photo has no GPS')).toBeInTheDocument()

    await fireEvent.keyDown(window, { key: 'g' })
    const day = new KeyboardEvent('keydown', {
      key: 'z', ctrlKey: true, bubbles: true, cancelable: true,
    })
    window.dispatchEvent(day)
    expect(day.defaultPrevented).toBe(true)
    expect(await screen.findByText('No located photos were found for this day')).toBeInTheDocument()

    const allPhotos = new KeyboardEvent('keydown', {
      key: 'Ω', code: 'KeyY', altKey: true, metaKey: true, bubbles: true, cancelable: true,
    })
    window.dispatchEvent(allPhotos)
    expect(allPhotos.defaultPrevented).toBe(true)
    expect(await screen.findByText('No photos in this folder have GPS coordinates')).toBeInTheDocument()
  })

  it('uses universal ten-photo Page jumps and first/last keys with map focus', async () => {
    const photos = Array.from({ length: 25 }, (_, index) => photo({
      id: `photo-${index + 1}`,
      location: index % 3 === 0 ? { latitude: 47 + index / 100, longitude: 10 + index / 100 } : undefined,
    }))
    render(Viewer, {
      photos,
      folderName: 'Trip', onChooseAnother: () => undefined,
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    const mapRegion = screen.getByRole('region', { name: 'Map' })
    mapRegion.focus()

    await fireEvent.keyDown(window, { key: 'PageDown' })
    expect(screen.getByLabelText('Photo 11 of 25')).toBeInTheDocument()
    expect(document.activeElement).toBe(mapRegion)
    await fireEvent.keyDown(window, { key: 'PageDown' })
    expect(screen.getByLabelText('Photo 21 of 25')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'PageUp' })
    expect(screen.getByLabelText('Photo 11 of 25')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'End' })
    expect(screen.getByLabelText('Photo 25 of 25')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'Home' })
    expect(screen.getByLabelText('Photo 1 of 25')).toBeInTheDocument()
  })

  it('shows intentional overview and GPX degraded states without skipping modes', async () => {
    render(Viewer, {
      photos: [photo({ id: 'missing' })],
      tracks: [],
      gpxFailures: [{ fileName: 'broken.gpx', error: 'Malformed XML' }],
      folderName: 'Trip', onChooseAnother: () => undefined,
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Open map' }))
    expect(screen.getByText('This photo doesn’t have GPS coordinates.')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'g' })
    expect(screen.getByText('No photos in this folder have GPS coordinates.')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'g' })
    expect(screen.getByText('No photos with GPS or drawable GPX track lines were found in this folder.')).toBeInTheDocument()
    expect(screen.getByText('1 GPX file was unavailable.')).toBeInTheDocument()
  })
})
