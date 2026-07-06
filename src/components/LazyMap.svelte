<script lang="ts">
  import { onMount, type Component } from 'svelte'
  import type { PhotoLocation } from '../lib/photos/types'

  let { location }: { location: PhotoLocation } = $props()
  let LoadedMap = $state<Component<{ location: PhotoLocation }> | null>(null)
  let loadError = $state('')

  onMount(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!LoadedMap) {
        loadError = 'The map renderer took too long to open. Please close the map and try again.'
      }
    }, 15_000)

    import('./MapView.svelte')
      .then((module) => {
        if (!cancelled) LoadedMap = module.default
      })
      .catch((error: unknown) => {
        console.error('[Memory Atlas] Could not load the map renderer.', error)
        if (!cancelled) loadError = 'The map renderer could not be loaded. Please reload the page and try again.'
      })
      .finally(() => clearTimeout(timeout))

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  })
</script>

{#if LoadedMap}
  <LoadedMap {location} />
{:else}
  <section class="map-panel" aria-label="Opening map">
    <div class="map-loading" role="status">Loading map renderer…</div>
    {#if loadError}<p class="map-error" role="alert">{loadError}</p>{/if}
  </section>
{/if}

