<script lang="ts">
  import maplibregl from 'maplibre-gl'
  import 'maplibre-gl/dist/maplibre-gl.css'
  import { onDestroy, onMount } from 'svelte'
  import { MAP_INITIAL_ZOOM, MAP_STYLE_URL } from '../lib/map/config'
  import type { PhotoLocation } from '../lib/photos/types'

  let { location }: { location: PhotoLocation } = $props()
  let container: HTMLDivElement
  let map: import('maplibre-gl').Map | undefined
  let marker: import('maplibre-gl').Marker | undefined
  let resizeObserver: ResizeObserver | undefined
  let loaded = $state(false)
  let loadError = $state('')
  let loadTimer: ReturnType<typeof setTimeout>

  function reportError(error: unknown) {
    const detail = error instanceof Error ? error : new Error(String(error))
    console.error('[Memory Atlas] Map initialization failed.', detail)
    loadError = 'The map could not load. Check your internet connection and try again.'
    clearTimeout(loadTimer)
  }

  function update(next: PhotoLocation) {
    if (!map || !marker) return
    const coordinates: [number, number] = [next.longitude, next.latitude]
    marker.setLngLat(coordinates)
    map.easeTo({ center: coordinates, duration: 500 })
  }

  function refreshTilesAfterReconnect() {
    if (!map || !loaded) return

    try {
      for (const sourceId of Object.keys(map.getStyle().sources)) {
        map.refreshTiles(sourceId)
      }
    } catch (error) {
      console.error('[Memory Atlas] Map tiles could not be refreshed after reconnecting.', error)
    }
  }

  onMount(() => {
    try {
      const coordinates: [number, number] = [location.longitude, location.latitude]
      map = new maplibregl.Map({
        container,
        style: MAP_STYLE_URL,
        center: coordinates,
        zoom: MAP_INITIAL_ZOOM,
        attributionControl: {},
      })
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => map?.resize())
        resizeObserver.observe(container)
      }
      const markerElement = document.createElement('div')
      markerElement.className = 'memory-marker'
      markerElement.setAttribute('aria-label', 'Photo location')
      marker = new maplibregl.Marker({ element: markerElement }).setLngLat(coordinates).addTo(map)
      map.on('load', () => {
        loaded = true
        loadError = ''
        clearTimeout(loadTimer)
      })
      map.on('error', (event) => {
        if (!loaded) reportError(event.error)
      })
      loadTimer = setTimeout(() => {
        if (!loaded) reportError(new Error('Map load timed out after 15 seconds.'))
      }, 15_000)
      window.addEventListener('online', refreshTilesAfterReconnect)
    } catch (error) {
      reportError(error)
    }
  })

  $effect(() => update(location))

  onDestroy(() => {
    clearTimeout(loadTimer)
    window.removeEventListener('online', refreshTilesAfterReconnect)
    resizeObserver?.disconnect()
    map?.remove()
  })
</script>

<section class="map-panel" aria-label="Map showing the current photo location">
  <div
    class="map-canvas"
    style="position: absolute; inset: 0; width: 100%; height: 100%;"
    bind:this={container}
  ></div>
  {#if !loaded && !loadError}<div class="map-loading" role="status">Opening map…</div>{/if}
  {#if loadError}<p class="map-error" role="alert">{loadError}</p>{/if}
</section>
