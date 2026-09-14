<script lang="ts">
  import { onMount, type Component } from 'svelte'
  import type { MapMode } from '../lib/map/model'
  import type { MapKeyboardHandler } from '../lib/map/keyboard'
  import type { MapCameraScopeOption, MapCameraScopeSelector } from '../lib/map/cameraScopes'
  import type { GpxTrack, Photo } from '../lib/photos/types'

  type Props = {
    photos: Photo[]
    currentIndex: number
    tracks: GpxTrack[]
    mode: MapMode
    onSelectPhoto: (index: number) => void
    onCameraStatus: (message: string) => void
    onCameraScopeChange: (label: string | undefined) => void
    onCameraScopesChange: (scopes: MapCameraScopeOption[]) => void
    onCameraScopeSelectorChange: (selector: MapCameraScopeSelector | undefined) => void
    onKeyboardHandlerChange: (handler: MapKeyboardHandler | undefined) => void
  }
  let props: Props = $props()
  let LoadedMap = $state<Component<Props> | null>(null)
  let loadError = $state('')

  onMount(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!LoadedMap) loadError = 'The map renderer took too long to open. Please close the map and try again.'
    }, 15_000)
    import('./MapView.svelte')
      .then((module) => { if (!cancelled) LoadedMap = module.default })
      .catch((error: unknown) => {
        console.error('[Memory Atlas] Could not load the map renderer.', error)
        if (!cancelled) loadError = 'The map renderer could not be loaded. Please reload the page and try again.'
      })
      .finally(() => clearTimeout(timeout))
    return () => { cancelled = true; clearTimeout(timeout) }
  })
</script>

{#if LoadedMap}
  <LoadedMap {...props} />
{:else}
  <div class="map-panel">
    <div class="map-loading" role="status">Loading map renderer…</div>
    {#if loadError}<p class="map-error" role="alert">{loadError}</p>{/if}
  </div>
{/if}
