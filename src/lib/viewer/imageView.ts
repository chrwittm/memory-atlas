export const MAX_NATIVE_SCALE = 4
export const KEYBOARD_ZOOM_FACTOR = 1.25
export const KEYBOARD_PAN_DISTANCE = 80

const SCALE_EPSILON = 0.0001

export type Size = {
  width: number
  height: number
}

export type Point = {
  x: number
  y: number
}

export type NamedImageView = 'fit' | 'native' | 'custom'

export type ImageViewState = {
  activeView: NamedImageView
  focalPoint: Point
  customScale?: number
}

export type ImageGeometry = {
  fitScale: number
  maxScale: number
  scale: number
  width: number
  height: number
  left: number
  top: number
  canPan: boolean
}

export function createImageViewState(): ImageViewState {
  return {
    activeView: 'fit',
    focalPoint: { x: 0.5, y: 0.5 },
  }
}

export function calculateFitScale(image: Size, viewport: Size): number {
  if (!hasArea(image) || !hasArea(viewport)) return 1
  return Math.min(viewport.width / image.width, viewport.height / image.height)
}

export function reconcileImageView(
  state: ImageViewState,
  image: Size,
  viewport: Size,
): ImageViewState {
  const fitScale = calculateFitScale(image, viewport)
  const maxScale = Math.max(fitScale, MAX_NATIVE_SCALE)
  const focalPoint = clampPoint(state.focalPoint)

  if (state.activeView === 'native' && !isNativeAvailable(fitScale)) {
    return { ...state, activeView: 'fit', focalPoint }
  }

  if (
    state.activeView === 'custom' &&
    !isCustomAvailable(state.customScale, fitScale, maxScale)
  ) {
    return { ...state, activeView: 'fit', focalPoint }
  }

  return { ...state, focalPoint }
}

export function calculateImageGeometry(
  state: ImageViewState,
  image: Size,
  viewport: Size,
): ImageGeometry {
  const reconciled = reconcileImageView(state, image, viewport)
  const fitScale = calculateFitScale(image, viewport)
  const maxScale = Math.max(fitScale, MAX_NATIVE_SCALE)
  const scale = scaleForView(reconciled, fitScale, maxScale)
  const width = image.width * scale
  const height = image.height * scale
  const left = clampAxis(
    viewport.width / 2 - reconciled.focalPoint.x * width,
    width,
    viewport.width,
  )
  const top = clampAxis(
    viewport.height / 2 - reconciled.focalPoint.y * height,
    height,
    viewport.height,
  )

  return {
    fitScale,
    maxScale,
    scale,
    width,
    height,
    left,
    top,
    canPan: scale > fitScale + SCALE_EPSILON,
  }
}

export function zoomImageAt(
  state: ImageViewState,
  image: Size,
  viewport: Size,
  requestedScale: number,
  anchor: Point = { x: viewport.width / 2, y: viewport.height / 2 },
): ImageViewState {
  const current = calculateImageGeometry(state, image, viewport)
  const scale = clamp(requestedScale, current.fitScale, current.maxScale)
  if (nearlyEqual(scale, current.scale)) return reconcileImageView(state, image, viewport)

  const imagePoint = {
    x: clamp((anchor.x - current.left) / current.scale, 0, image.width),
    y: clamp((anchor.y - current.top) / current.scale, 0, image.height),
  }
  const desiredLeft = anchor.x - imagePoint.x * scale
  const desiredTop = anchor.y - imagePoint.y * scale
  const width = image.width * scale
  const height = image.height * scale
  const focalPoint = {
    x: clamp((viewport.width / 2 - desiredLeft) / width, 0, 1),
    y: clamp((viewport.height / 2 - desiredTop) / height, 0, 1),
  }

  if (nearlyEqual(scale, current.fitScale)) {
    return { ...state, activeView: 'fit', focalPoint }
  }

  if (isNativeAvailable(current.fitScale) && nearlyEqual(scale, 1)) {
    return { ...state, activeView: 'native', focalPoint }
  }

  return {
    activeView: 'custom',
    focalPoint,
    customScale: scale,
  }
}

export function panImageBy(
  state: ImageViewState,
  image: Size,
  viewport: Size,
  delta: Point,
): ImageViewState {
  const geometry = calculateImageGeometry(state, image, viewport)
  if (!geometry.canPan) return reconcileImageView(state, image, viewport)

  const desiredLeft = geometry.left + delta.x
  const desiredTop = geometry.top + delta.y
  const focalPoint = {
    x:
      geometry.width > viewport.width + SCALE_EPSILON
        ? clamp((viewport.width / 2 - desiredLeft) / geometry.width, 0, 1)
        : state.focalPoint.x,
    y:
      geometry.height > viewport.height + SCALE_EPSILON
        ? clamp((viewport.height / 2 - desiredTop) / geometry.height, 0, 1)
        : state.focalPoint.y,
  }

  return { ...state, focalPoint }
}

export function cycleImageView(
  state: ImageViewState,
  image: Size,
  viewport: Size,
): ImageViewState {
  const reconciled = reconcileImageView(state, image, viewport)
  const fitScale = calculateFitScale(image, viewport)
  const maxScale = Math.max(fitScale, MAX_NATIVE_SCALE)
  const views: NamedImageView[] = ['fit']

  if (isNativeAvailable(fitScale)) views.push('native')
  if (isCustomAvailable(reconciled.customScale, fitScale, maxScale)) views.push('custom')
  if (views.length === 1) return reconciled

  const currentIndex = views.indexOf(reconciled.activeView)
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % views.length
  return { ...reconciled, activeView: views[nextIndex] }
}

function scaleForView(state: ImageViewState, fitScale: number, maxScale: number): number {
  if (state.activeView === 'native' && isNativeAvailable(fitScale)) return 1
  if (state.activeView === 'custom' && isCustomAvailable(state.customScale, fitScale, maxScale)) {
    return state.customScale as number
  }
  return fitScale
}

function isNativeAvailable(fitScale: number): boolean {
  return 1 > fitScale + SCALE_EPSILON
}

function isCustomAvailable(
  customScale: number | undefined,
  fitScale: number,
  maxScale: number,
): boolean {
  return (
    customScale !== undefined &&
    customScale > fitScale + SCALE_EPSILON &&
    customScale <= maxScale + SCALE_EPSILON &&
    !nearlyEqual(customScale, 1)
  )
}

function clampAxis(position: number, contentSize: number, viewportSize: number): number {
  if (contentSize <= viewportSize) return (viewportSize - contentSize) / 2
  return clamp(position, viewportSize - contentSize, 0)
}

function clampPoint(point: Point): Point {
  return { x: clamp(point.x, 0, 1), y: clamp(point.y, 0, 1) }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function nearlyEqual(first: number, second: number): boolean {
  return Math.abs(first - second) <= SCALE_EPSILON
}

function hasArea(size: Size): boolean {
  return Number.isFinite(size.width) && Number.isFinite(size.height) && size.width > 0 && size.height > 0
}
