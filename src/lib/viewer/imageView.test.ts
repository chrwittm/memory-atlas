import { describe, expect, it } from 'vitest'
import {
  calculateImageGeometry,
  createImageViewState,
  cycleImageView,
  panImageBy,
  reconcileImageView,
  zoomImageAt,
} from './imageView'

const image = { width: 1600, height: 1200 }
const viewport = { width: 800, height: 800 }

describe('image view geometry', () => {
  it('fits a new photo and clamps direct zoom between fit and 400% native scale', () => {
    const fitted = calculateImageGeometry(createImageViewState(), image, viewport)
    expect(fitted).toMatchObject({ fitScale: 0.5, scale: 0.5, width: 800, height: 600 })
    expect(fitted.top).toBe(100)

    const belowFit = zoomImageAt(createImageViewState(), image, viewport, 0.1)
    expect(calculateImageGeometry(belowFit, image, viewport).scale).toBe(0.5)

    const aboveMaximum = zoomImageAt(createImageViewState(), image, viewport, 8)
    expect(calculateImageGeometry(aboveMaximum, image, viewport).scale).toBe(4)
  })

  it('keeps an image point beneath the pointer while zooming', () => {
    const anchor = { x: 600, y: 350 }
    const zoomed = zoomImageAt(createImageViewState(), image, viewport, 1, anchor)
    const geometry = calculateImageGeometry(zoomed, image, viewport)

    expect((anchor.x - geometry.left) / geometry.scale).toBeCloseTo(1200)
    expect((anchor.y - geometry.top) / geometry.scale).toBeCloseTo(500)
  })

  it('clamps panning at image edges without adding empty canvas', () => {
    const zoomed = zoomImageAt(createImageViewState(), image, viewport, 1)
    const panned = panImageBy(zoomed, image, viewport, { x: 5000, y: -5000 })
    const geometry = calculateImageGeometry(panned, image, viewport)

    expect(geometry.left).toBe(0)
    expect(geometry.top).toBe(viewport.height - image.height)
  })

  it('cycles fit, native, remembered custom, and fit while retaining the focal point', () => {
    const custom = zoomImageAt(createImageViewState(), image, viewport, 2, { x: 650, y: 300 })
    const fitted = { ...custom, activeView: 'fit' as const }
    const native = cycleImageView(fitted, image, viewport)
    const remembered = cycleImageView(native, image, viewport)
    const backToFit = cycleImageView(remembered, image, viewport)

    expect(native.activeView).toBe('native')
    expect(remembered.activeView).toBe('custom')
    expect(calculateImageGeometry(remembered, image, viewport).scale).toBe(2)
    expect(remembered.focalPoint).toEqual(custom.focalPoint)
    expect(backToFit.activeView).toBe('fit')
  })

  it('skips native and illegal custom views when the fitted minimum rises', () => {
    const smallImage = { width: 100, height: 100 }
    const largeViewport = { width: 500, height: 500 }
    const state = {
      activeView: 'custom' as const,
      focalPoint: { x: 0.8, y: 0.2 },
      customScale: 2,
    }

    expect(reconcileImageView(state, smallImage, largeViewport).activeView).toBe('fit')
    expect(calculateImageGeometry(state, smallImage, largeViewport).scale).toBe(5)
    expect(cycleImageView(state, smallImage, largeViewport).activeView).toBe('fit')
  })

  it('keeps native and custom scales relative to the JPEG across viewport changes', () => {
    const custom = zoomImageAt(createImageViewState(), image, viewport, 2)
    const resized = { width: 1000, height: 700 }

    expect(calculateImageGeometry(custom, image, resized).scale).toBe(2)
    expect(
      calculateImageGeometry({ ...custom, activeView: 'native' }, image, resized).scale,
    ).toBe(1)
  })
})
