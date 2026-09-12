<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import LazyMap from './LazyMap.svelte'
  import { ObjectUrlWindow } from '../lib/photos/objectUrls'
  import {
    calculateImageGeometry,
    createImageViewState,
    cycleImageView,
    KEYBOARD_PAN_DISTANCE,
    KEYBOARD_ZOOM_FACTOR,
    panImageBy,
    reconcileImageView,
    zoomImageAt,
    type ImageViewState,
    type Point,
    type Size,
  } from '../lib/viewer/imageView'
  import type { Photo } from '../lib/photos/types'
  import type { MapKeyboardHandler } from '../lib/map/keyboard'

  let {
    photos,
    folderName,
    onChooseAnother,
  }: {
    photos: Photo[]
    folderName: string
    onChooseAnother: () => void
  } = $props()

  let currentIndex = $state(0)
  let informationVisible = $state(true)
  let mapOpen = $state(false)
  let splitPercent = $state(80)
  let resizingSplit = $state(false)
  let controlsVisible = $state(true)
  let notice = $state('')
  let decodeErrorIds = $state(new Set<string>())
  let viewState = $state<ImageViewState>(createImageViewState())
  let intrinsicSize = $state<Size | undefined>()
  let viewportSize = $state<Size>({ width: 0, height: 0 })
  let draggingPhoto = $state(false)
  let hideControlsTimer: ReturnType<typeof setTimeout>
  let noticeTimer: ReturnType<typeof setTimeout>
  let viewer: HTMLElement
  let photoSurface: HTMLElement
  let divider = $state<HTMLElement | undefined>()
  let mapRegion = $state<HTMLElement | undefined>()
  let photoResizeObserver: ResizeObserver | undefined
  let narrowLayoutQuery: MediaQueryList | undefined
  let syncNarrowLayout: (() => void) | undefined
  let narrowLayout = $state(false)
  let mapKeyboardHandler: MapKeyboardHandler | undefined
  let returningToEntry = false
  let previousDragPoint: Point | undefined
  const urlWindow = new ObjectUrlWindow()
  const viewStates = new Map<string, ImageViewState>()
  const intrinsicSizes = new Map<string, Size>()

  let current = $derived(photos[currentIndex])
  let currentUrl = $derived(urlWindow.sync(photos, currentIndex))
  let currentHasDecodeError = $derived(
    current.status === 'decode-error' || decodeErrorIds.has(current.id),
  )
  let readableCount = $derived(photos.filter((photo) => photo.status !== 'read-error').length)
  let imageGeometry = $derived(
    intrinsicSize && viewportSize.width > 0 && viewportSize.height > 0
      ? calculateImageGeometry(viewState, intrinsicSize, viewportSize)
      : undefined,
  )

  function showControls() {
    controlsVisible = true
    clearTimeout(hideControlsTimer)
    hideControlsTimer = setTimeout(() => {
      if (!viewer.contains(document.activeElement) || document.activeElement === photoSurface) {
        controlsVisible = false
      }
    }, 2200)
  }

  function handleFocusOut(event: FocusEvent) {
    const next = event.relatedTarget
    if (!(next instanceof Node) || !viewer.contains(next)) showControls()
  }

  function move(delta: number) {
    const next = Math.max(0, Math.min(photos.length - 1, currentIndex + delta))
    if (next === currentIndex) return
    stopDraggingPhoto()
    currentIndex = next
    const nextPhoto = photos[next]
    if (!nextPhoto.location) mapKeyboardHandler = undefined
    viewState = viewStates.get(nextPhoto.id) ?? createImageViewState()
    intrinsicSize = intrinsicSizes.get(nextPhoto.id)
    showControls()
  }

  function moveTo(index: number) {
    move(index - currentIndex)
  }

  function showNotice(message: string, duration = 2600) {
    notice = message
    clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => (notice = ''), duration)
  }

  function closeMap() {
    stopDraggingPhoto()
    const focusNeedsRecovery = divider === document.activeElement || mapRegion?.contains(document.activeElement)
    mapOpen = false
    mapKeyboardHandler = undefined
    showControls()
    if (focusNeedsRecovery) queueMicrotask(focusPhoto)
  }

  function toggleMap() {
    if (mapOpen) closeMap()
    else {
      stopDraggingPhoto()
      mapOpen = true
      showControls()
    }
  }

  function toggleInformation() {
    informationVisible = !informationVisible
    showControls()
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch {
        showNotice('Fullscreen could not be closed.')
      }
      return
    }

    if (!document.fullscreenEnabled || !viewer.requestFullscreen) {
      showNotice('Fullscreen is not available in this browser.')
      return
    }

    try {
      await viewer.requestFullscreen()
      showControls()
    } catch {
      showNotice('Fullscreen could not be opened.')
    }
  }

  function setSplitFromPointer(clientX: number) {
    const bounds = viewer.getBoundingClientRect()
    if (!bounds.width) return
    splitPercent = Math.max(20, Math.min(80, ((clientX - bounds.left) / bounds.width) * 100))
  }

  function measurePhotoSurface(): Size | undefined {
    const bounds = photoSurface?.getBoundingClientRect()
    if (!bounds?.width || !bounds.height) return undefined
    const size = { width: bounds.width, height: bounds.height }
    viewportSize = size
    if (intrinsicSize) commitView(reconcileImageView(viewState, intrinsicSize, size))
    return size
  }

  function commitView(next: ImageViewState) {
    viewState = next
    viewStates.set(current.id, next)
  }

  function handlePhotoLoad(event: Event) {
    const image = event.currentTarget as HTMLImageElement
    const width = image.naturalWidth || current.width || 0
    const height = image.naturalHeight || current.height || 0
    if (!width || !height) return
    const size = { width, height }
    intrinsicSizes.set(current.id, size)
    intrinsicSize = size
    const viewport = measurePhotoSurface()
    if (viewport) commitView(reconcileImageView(viewState, size, viewport))
  }

  function photoContext() {
    if (!intrinsicSize) return undefined
    const viewport = measurePhotoSurface() ?? viewportSize
    if (!viewport.width || !viewport.height) return undefined
    return { image: intrinsicSize, viewport }
  }

  function focusPhoto() {
    photoSurface?.focus({ preventScroll: true })
  }

  function focusDivider() {
    divider?.focus({ preventScroll: true })
  }

  function focusMap() {
    mapRegion?.focus({ preventScroll: true })
  }

  function visibleFocusRegions(): Array<() => void> {
    if (!mapOpen) return [focusPhoto]
    return narrowLayout ? [focusPhoto, focusMap] : [focusPhoto, focusDivider, focusMap]
  }

  function moveRegionFocus(reverse: boolean) {
    const regions = visibleFocusRegions()
    const elements = narrowLayout
      ? [photoSurface, mapRegion]
      : mapOpen
        ? [photoSurface, divider, mapRegion]
        : [photoSurface]
    const active = document.activeElement
    const activeIndex = elements.findIndex(
      (element) => element === active || (active instanceof Node && element?.contains(active)),
    )
    const nextIndex =
      activeIndex < 0
        ? reverse
          ? regions.length - 1
          : 0
        : (activeIndex + (reverse ? -1 : 1) + regions.length) % regions.length
    regions[nextIndex]?.()
  }

  function handlePhotoWheel(event: WheelEvent) {
    const context = photoContext()
    if (!context) return
    event.preventDefault()
    focusPhoto()
    const bounds = photoSurface.getBoundingClientRect()
    const deltaPixels =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? event.deltaY * 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? event.deltaY * context.viewport.height
          : event.deltaY
    const requestedScale = calculateImageGeometry(
      viewState,
      context.image,
      context.viewport,
    ).scale
    commitView(
      zoomImageAt(
        viewState,
        context.image,
        context.viewport,
        requestedScale * Math.exp(-deltaPixels * 0.002),
        { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
      ),
    )
  }

  function moveDraggedPhoto(event: PointerEvent) {
    if (!previousDragPoint) return
    const context = photoContext()
    if (!context) return
    const nextPoint = { x: event.clientX, y: event.clientY }
    commitView(
      panImageBy(viewState, context.image, context.viewport, {
        x: nextPoint.x - previousDragPoint.x,
        y: nextPoint.y - previousDragPoint.y,
      }),
    )
    previousDragPoint = nextPoint
  }

  function stopDraggingPhoto() {
    draggingPhoto = false
    previousDragPoint = undefined
    window.removeEventListener('pointermove', moveDraggedPhoto)
    window.removeEventListener('pointerup', stopDraggingPhoto)
    window.removeEventListener('pointercancel', stopDraggingPhoto)
  }

  function startDraggingPhoto(event: PointerEvent) {
    if (event.button !== 0) return
    focusPhoto()
    if (!imageGeometry?.canPan) return
    event.preventDefault()
    draggingPhoto = true
    previousDragPoint = { x: event.clientX, y: event.clientY }
    window.addEventListener('pointermove', moveDraggedPhoto)
    window.addEventListener('pointerup', stopDraggingPhoto)
    window.addEventListener('pointercancel', stopDraggingPhoto)
  }

  function cycleCurrentImageView(announce = false) {
    const context = photoContext()
    if (!context) return
    const next = cycleImageView(viewState, context.image, context.viewport)
    commitView(next)
    if (announce) showNotice(zoomModeLabel(next, context.image, context.viewport), 1200)
  }

  function zoomModeLabel(state: ImageViewState, image: Size, viewport: Size) {
    if (state.activeView === 'fit') return 'Zoom mode · Fitted view'
    if (state.activeView === 'native') return 'Zoom mode · 100%'
    const percentage = Math.round(calculateImageGeometry(state, image, viewport).scale * 100)
    return `Zoom mode · Custom (${percentage}%)`
  }

  function handlePhotoDoubleClick(event: MouseEvent) {
    if (event.button !== 0) return
    event.preventDefault()
    focusPhoto()
    cycleCurrentImageView()
  }

  function resizeSplit(event: PointerEvent) {
    setSplitFromPointer(event.clientX)
  }

  function stopResizingSplit() {
    resizingSplit = false
    window.removeEventListener('pointermove', resizeSplit)
    window.removeEventListener('pointerup', stopResizingSplit)
    window.removeEventListener('pointercancel', stopResizingSplit)
  }

  function startResizingSplit(event: PointerEvent) {
    if (event.button !== 0) return
    event.preventDefault()
    focusDivider()
    resizingSplit = true
    setSplitFromPointer(event.clientX)
    window.addEventListener('pointermove', resizeSplit)
    window.addEventListener('pointerup', stopResizingSplit)
    window.addEventListener('pointercancel', stopResizingSplit)
  }

  function handleDividerKeydown(event: KeyboardEvent) {
    if (hasShortcutModifier(event) || event.shiftKey) return
    const steps: Record<string, number> = { ArrowLeft: -2, ArrowRight: 2 }
    if (event.key in steps) splitPercent = Math.max(20, Math.min(80, splitPercent + steps[event.key]))
    else if (event.key === 'Home') splitPercent = 20
    else if (event.key === 'End') splitPercent = 80
    else return
    event.preventDefault()
    event.stopPropagation()
  }

  function hasShortcutModifier(event: KeyboardEvent) {
    return event.altKey || event.ctrlKey || event.metaKey || event.isComposing
  }

  function isPlainLetterShortcut(event: KeyboardEvent, letter: string) {
    return !hasShortcutModifier(event) && !event.shiftKey && event.key.toLowerCase() === letter
  }

  async function returnToEntry() {
    if (returningToEntry) return
    returningToEntry = true
    stopDraggingPhoto()
    stopResizingSplit()
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen()
      } catch {
        // Returning to folder selection must not require a second key press.
      }
    }
    onChooseAnother()
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented) return
    if (event.key === 'Tab' && !hasShortcutModifier(event)) {
      event.preventDefault()
      moveRegionFocus(event.shiftKey)
    } else if (isPlainLetterShortcut(event, 'h') && !event.repeat) {
      event.preventDefault()
      void returnToEntry()
    } else if (isPlainLetterShortcut(event, 'i') && !event.repeat) {
      event.preventDefault()
      toggleInformation()
    } else if (isPlainLetterShortcut(event, 'm') && !event.repeat) {
      event.preventDefault()
      toggleMap()
    } else if (
      isPlainLetterShortcut(event, 'f') &&
      !event.repeat &&
      !event.shiftKey
    ) {
      event.preventDefault()
      void toggleFullscreen()
    } else if (event.key === 'Escape' && mapOpen && !document.fullscreenElement) {
      closeMap()
    } else if (document.activeElement === photoSurface) {
      handlePhotoKeydown(event)
    } else if (mapRegion?.contains(document.activeElement) && !hasShortcutModifier(event)) {
      const shiftAllowedForPlus = event.key === '+'
      if ((!event.shiftKey || shiftAllowedForPlus) && mapKeyboardHandler?.(event)) {
        event.preventDefault()
      }
    }
  }

  function handlePhotoKeydown(event: KeyboardEvent) {
    if (hasShortcutModifier(event) || (event.shiftKey && event.key !== '+')) return

    if (event.key === 'PageUp') {
      event.preventDefault()
      move(-10)
      return
    }
    if (event.key === 'PageDown') {
      event.preventDefault()
      move(10)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      moveTo(0)
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      moveTo(photos.length - 1)
      return
    }

    const context = photoContext()
    const geometry = context
      ? calculateImageGeometry(viewState, context.image, context.viewport)
      : undefined

    if (event.key === 'ArrowLeft' && !geometry?.canPan) {
      event.preventDefault()
      move(-1)
      return
    }
    if (event.key === 'ArrowRight' && !geometry?.canPan) {
      event.preventDefault()
      move(1)
      return
    }
    if (event.key.startsWith('Arrow')) {
      event.preventDefault()
      if (!context || !geometry?.canPan) return
      const deltas: Record<string, Point> = {
        ArrowLeft: { x: KEYBOARD_PAN_DISTANCE, y: 0 },
        ArrowRight: { x: -KEYBOARD_PAN_DISTANCE, y: 0 },
        ArrowUp: { x: 0, y: KEYBOARD_PAN_DISTANCE },
        ArrowDown: { x: 0, y: -KEYBOARD_PAN_DISTANCE },
      }
      const delta = deltas[event.key]
      if (delta) commitView(panImageBy(viewState, context.image, context.viewport, delta))
      return
    }

    if (!context) return
    if (event.key === '+' || event.key === '-') {
      event.preventDefault()
      const factor = event.key === '+' ? KEYBOARD_ZOOM_FACTOR : 1 / KEYBOARD_ZOOM_FACTOR
      commitView(zoomImageAt(viewState, context.image, context.viewport, geometry!.scale * factor))
    } else if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
      event.preventDefault()
      cycleCurrentImageView(true)
    }
  }

  function markDecodeError() {
    stopDraggingPhoto()
    decodeErrorIds = new Set([...decodeErrorIds, current.id])
    intrinsicSize = undefined
  }

  function dateLabel(value?: string) {
    if (!value) return ''
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  }

  onMount(() => {
    showControls()
    focusPhoto()
    measurePhotoSurface()
    if (typeof ResizeObserver !== 'undefined') {
      photoResizeObserver = new ResizeObserver(measurePhotoSurface)
      photoResizeObserver.observe(photoSurface)
    }
    photoSurface.addEventListener('wheel', handlePhotoWheel, { passive: false })
    window.addEventListener('resize', measurePhotoSurface)
    document.addEventListener('fullscreenchange', measurePhotoSurface)
    if (typeof window.matchMedia === 'function') {
      narrowLayoutQuery = window.matchMedia('(max-width: 760px)')
      syncNarrowLayout = () => {
        narrowLayout = narrowLayoutQuery?.matches ?? false
        if (narrowLayout && document.activeElement === divider) focusPhoto()
      }
      syncNarrowLayout()
      narrowLayoutQuery.addEventListener('change', syncNarrowLayout)
    }
  })

  onDestroy(() => {
    clearTimeout(hideControlsTimer)
    clearTimeout(noticeTimer)
    stopDraggingPhoto()
    stopResizingSplit()
    photoResizeObserver?.disconnect()
    photoSurface?.removeEventListener('wheel', handlePhotoWheel)
    window.removeEventListener('resize', measurePhotoSurface)
    document.removeEventListener('fullscreenchange', measurePhotoSurface)
    if (syncNarrowLayout) narrowLayoutQuery?.removeEventListener('change', syncNarrowLayout)
    viewStates.clear()
    intrinsicSizes.clear()
    urlWindow.dispose()
  })
</script>

<svelte:window onkeydown={handleKeydown} onmousemove={showControls} />

<main
  bind:this={viewer}
  class:map-open={mapOpen}
  class:resizing={resizingSplit}
  class:photo-dragging={draggingPhoto}
  class:controls-hidden={!controlsVisible}
  class="viewer"
  style={`--photo-panel-width: ${splitPercent}%`}
  aria-label={`${folderName} photo viewer`}
  onfocusin={showControls}
  onfocusout={handleFocusOut}
>
  <section class="photo-panel">
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_static_element_interactions (interactive image viewport) -->
    <div
      bind:this={photoSurface}
      class:can-pan={imageGeometry?.canPan}
      class:dragging={draggingPhoto}
      class="photo-surface"
      role="region"
      aria-label="Current photo"
      tabindex="0"
      onpointerdown={startDraggingPhoto}
      ondblclick={handlePhotoDoubleClick}
    >
    {#key current.id}
      {#if current.status === 'read-error' || currentHasDecodeError}
        <div class="photo-error" role="status">
          <span aria-hidden="true">!</span>
          <h1>This photo can’t be displayed</h1>
          <p>{current.fileName}</p>
          {#if photos.length > 1}<p>Use the arrow keys to continue.</p>{/if}
        </div>
      {:else if currentUrl}
        <img
          class="current-photo"
          src={currentUrl}
          alt={current.caption || current.title || current.fileName}
          style={imageGeometry
            ? `width: ${imageGeometry.width}px; height: ${imageGeometry.height}px; left: ${imageGeometry.left}px; top: ${imageGeometry.top}px;`
            : undefined}
          onload={handlePhotoLoad}
          onerror={markDecodeError}
        />
      {/if}
    {/key}
    </div>

    {#if informationVisible && (current.caption || current.capturedAt) && !currentHasDecodeError}
      <div class="information-overlay">
        {#if current.caption}<p>{current.caption}</p>{/if}
        {#if current.capturedAt}<time datetime={current.capturedAt}>{dateLabel(current.capturedAt)}</time>{/if}
      </div>
    {/if}

    <button
      class="edge-control previous"
      class:visible={controlsVisible}
      type="button"
      tabindex="-1"
      onclick={() => {
        move(-1)
        focusPhoto()
      }}
      disabled={currentIndex === 0}
      aria-label="Previous photo"
      title="Previous photo (Left Arrow)"
    ><span aria-hidden="true">‹</span></button>
    <button
      class="edge-control next"
      class:visible={controlsVisible}
      type="button"
      tabindex="-1"
      onclick={() => {
        move(1)
        focusPhoto()
      }}
      disabled={currentIndex === photos.length - 1}
      aria-label="Next photo"
      title="Next photo (Right Arrow)"
    ><span aria-hidden="true">›</span></button>

    <div class="top-controls" class:visible={controlsVisible}>
      <button
        type="button"
        class="text-control"
        tabindex="-1"
        onclick={() => void returnToEntry()}
        title="Choose another folder (H)"
      >
        <span aria-hidden="true">＋</span> Choose another folder
      </button>
      <span class="counter" aria-label={`Photo ${currentIndex + 1} of ${photos.length}`}>
        {currentIndex + 1}<i>/</i>{photos.length}
      </span>
      <button
        type="button"
        class:active={mapOpen}
        class="icon-control"
        tabindex="-1"
        onclick={() => {
          toggleMap()
          focusPhoto()
        }}
        aria-label={mapOpen ? 'Close map' : 'Open map'}
        title={`${mapOpen ? 'Close' : 'Open'} map (M)`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3.5 5 5-2.3 7 2.6 5-2.3v16l-5 2.3-7-2.6-5 2.3zm5-2.3v16m7-13.4v16" /></svg>
      </button>
    </div>

    <div class="bottom-controls" class:visible={controlsVisible}>
      <button
        type="button"
        class:active={informationVisible}
        class="icon-control information-control"
        tabindex="-1"
        onclick={() => {
          toggleInformation()
          focusPhoto()
        }}
        aria-label={informationVisible ? 'Hide photo information' : 'Show photo information'}
        title={`${informationVisible ? 'Hide' : 'Show'} photo information (I)`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 10.5v6m0-9h.01" /></svg>
      </button>
    </div>
  </section>

  {#if mapOpen}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (ARIA window splitter pattern) -->
    <div
      bind:this={divider}
      class="split-divider"
      role="separator"
      aria-label="Resize photo and map"
      aria-orientation="vertical"
      aria-valuemin="20"
      aria-valuemax="80"
      aria-valuenow={Math.round(splitPercent)}
      tabindex={narrowLayout ? -1 : 0}
      onpointerdown={startResizingSplit}
      onkeydown={handleDividerKeydown}
    ><span aria-hidden="true"></span></div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_static_element_interactions (interactive map region) -->
    <div
      bind:this={mapRegion}
      class="map-region"
      role="region"
      aria-label="Map"
      tabindex="0"
      onpointerdown={() => queueMicrotask(focusMap)}
    >
      {#if current.location}
        <LazyMap
          location={current.location}
          onKeyboardHandlerChange={(handler) => (mapKeyboardHandler = handler)}
        />
      {:else}
        <div class="map-panel">
          <div class="map-unavailable" role="status">This photo doesn’t have GPS coordinates.</div>
        </div>
      {/if}
    </div>
  {/if}

  {#if notice}<div class="toast" role="status">{notice}</div>{/if}
  <span class="visually-hidden">{readableCount} readable photos</span>
</main>
