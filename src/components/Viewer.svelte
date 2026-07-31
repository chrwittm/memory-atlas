<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import LazyMap from './LazyMap.svelte'
  import { ObjectUrlWindow } from '../lib/photos/objectUrls'
  import type { Photo } from '../lib/photos/types'

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
  let direction = $state<'next' | 'previous'>('next')
  let notice = $state('')
  let decodeErrorIds = $state(new Set<string>())
  let hideControlsTimer: ReturnType<typeof setTimeout>
  let noticeTimer: ReturnType<typeof setTimeout>
  let viewer: HTMLElement
  const urlWindow = new ObjectUrlWindow()

  let current = $derived(photos[currentIndex])
  let currentUrl = $derived(urlWindow.sync(photos, currentIndex))
  let currentHasDecodeError = $derived(
    current.status === 'decode-error' || decodeErrorIds.has(current.id),
  )
  let readableCount = $derived(photos.filter((photo) => photo.status !== 'read-error').length)

  function showControls() {
    controlsVisible = true
    clearTimeout(hideControlsTimer)
    hideControlsTimer = setTimeout(() => {
      if (!viewer.contains(document.activeElement)) controlsVisible = false
    }, 2200)
  }

  function handleFocusOut(event: FocusEvent) {
    const next = event.relatedTarget
    if (!(next instanceof Node) || !viewer.contains(next)) showControls()
  }

  function move(delta: number) {
    const next = Math.max(0, Math.min(photos.length - 1, currentIndex + delta))
    if (next === currentIndex) return
    direction = delta > 0 ? 'next' : 'previous'
    currentIndex = next
    showControls()
  }

  function showNotice(message: string) {
    notice = message
    clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => (notice = ''), 2600)
  }

  function toggleMap() {
    mapOpen = !mapOpen
    showControls()
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
    resizingSplit = true
    setSplitFromPointer(event.clientX)
    window.addEventListener('pointermove', resizeSplit)
    window.addEventListener('pointerup', stopResizingSplit)
    window.addEventListener('pointercancel', stopResizingSplit)
  }

  function handleDividerKeydown(event: KeyboardEvent) {
    const steps: Record<string, number> = { ArrowLeft: -2, ArrowRight: 2 }
    if (event.key in steps) splitPercent = Math.max(20, Math.min(80, splitPercent + steps[event.key]))
    else if (event.key === 'Home') splitPercent = 20
    else if (event.key === 'End') splitPercent = 80
    else return
    event.preventDefault()
    event.stopPropagation()
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented) return
    if (event.key === 'ArrowLeft') move(-1)
    else if (event.key === 'ArrowRight') move(1)
    else if (event.key.toLowerCase() === 'i') {
      event.preventDefault()
      toggleInformation()
    } else if (event.key.toLowerCase() === 'm') {
      event.preventDefault()
      toggleMap()
    } else if (
      event.key.toLowerCase() === 'f' &&
      !event.repeat &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      event.preventDefault()
      void toggleFullscreen()
    } else if (event.key === 'Escape' && mapOpen && !document.fullscreenElement) {
      mapOpen = false
      showControls()
    }
  }

  function markDecodeError() {
    decodeErrorIds = new Set([...decodeErrorIds, current.id])
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

  onMount(showControls)

  onDestroy(() => {
    clearTimeout(hideControlsTimer)
    clearTimeout(noticeTimer)
    stopResizingSplit()
    urlWindow.dispose()
  })
</script>

<svelte:window onkeydown={handleKeydown} onmousemove={showControls} />

<main
  bind:this={viewer}
  class:map-open={mapOpen}
  class:resizing={resizingSplit}
  class:controls-hidden={!controlsVisible}
  class="viewer"
  style={`--photo-panel-width: ${splitPercent}%`}
  aria-label={`${folderName} photo viewer`}
  onfocusin={showControls}
  onfocusout={handleFocusOut}
>
  <section class="photo-panel">
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
          class:from-right={direction === 'next'}
          class:from-left={direction === 'previous'}
          class="current-photo"
          src={currentUrl}
          alt={current.caption || current.title || current.fileName}
          onerror={markDecodeError}
        />
      {/if}
    {/key}

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
      onclick={() => move(-1)}
      disabled={currentIndex === 0}
      aria-label="Previous photo"
      title="Previous photo (Left Arrow)"
    ><span aria-hidden="true">‹</span></button>
    <button
      class="edge-control next"
      class:visible={controlsVisible}
      type="button"
      onclick={() => move(1)}
      disabled={currentIndex === photos.length - 1}
      aria-label="Next photo"
      title="Next photo (Right Arrow)"
    ><span aria-hidden="true">›</span></button>

    <div class="top-controls" class:visible={controlsVisible}>
      <button type="button" class="text-control" onclick={onChooseAnother} title="Choose another folder">
        <span aria-hidden="true">＋</span> Choose another folder
      </button>
      <span class="counter" aria-label={`Photo ${currentIndex + 1} of ${photos.length}`}>
        {currentIndex + 1}<i>/</i>{photos.length}
      </span>
      <button
        type="button"
        class:active={mapOpen}
        class="icon-control"
        onclick={toggleMap}
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
        onclick={toggleInformation}
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
      class="split-divider"
      role="separator"
      aria-label="Resize photo and map"
      aria-orientation="vertical"
      aria-valuemin="20"
      aria-valuemax="80"
      aria-valuenow={Math.round(splitPercent)}
      tabindex="0"
      onpointerdown={startResizingSplit}
      onkeydown={handleDividerKeydown}
    ><span aria-hidden="true"></span></div>
    {#if current.location}
      <LazyMap location={current.location} />
    {:else}
      <section class="map-panel" aria-label="No map location for current photo">
        <div class="map-unavailable" role="status">This photo doesn’t have GPS coordinates.</div>
      </section>
    {/if}
  {/if}

  {#if notice}<div class="toast" role="status">{notice}</div>{/if}
  <span class="visually-hidden">{readableCount} readable photos</span>
</main>
