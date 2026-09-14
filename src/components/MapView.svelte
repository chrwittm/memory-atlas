<script lang="ts">
  import * as maplibregl from 'maplibre-gl'
  import 'maplibre-gl/dist/maplibre-gl.css'
  import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
  import { onDestroy, onMount } from 'svelte'
  import type { FeatureCollection, LineString, Point } from 'geojson'
  import catalogData from '../lib/geo/catalog.json'
  import { normalizeGeographicCatalog } from '../lib/geo/catalog'
  import {
    availableCameraScopes,
    cameraScopeOptions,
    cameraScopeAfterPhotoChange,
    primaryCameraScopes,
    type CameraScopeInput,
    type MapCameraScope,
    type MapCameraScopeOption,
    type MapCameraScopeSelector,
  } from '../lib/map/cameraScopes'
  import { MAP_INITIAL_ZOOM, MAP_STYLE_URL } from '../lib/map/config'
  import {
    coordinateGroups,
    nextMemberInGroup,
    photoAccessibleName,
    type MapMode,
  } from '../lib/map/model'
  import { mapCameraCommand, type MapKeyboardHandler } from '../lib/map/keyboard'
  import type { GpxTrack, Photo, TrackPoint } from '../lib/photos/types'

  maplibregl.setWorkerUrl(mapWorkerUrl)

  const PHOTO_SOURCE = 'memory-photos'
  const TRACK_SOURCE = 'memory-tracks'
  const CLUSTER_LAYER = 'photo-clusters'
  const PHOTO_LAYER = 'photo-points'
  const CAMERA_OVERLAY_GUTTER = 24
  const geographicCatalog = normalizeGeographicCatalog(catalogData)

  let {
    photos,
    currentIndex,
    tracks,
    mode,
    onSelectPhoto,
    onCameraStatus = () => undefined,
    onCameraScopeChange = () => undefined,
    onCameraScopesChange = () => undefined,
    onCameraScopeSelectorChange = () => undefined,
    onKeyboardHandlerChange = () => undefined,
  }: {
    photos: Photo[]
    currentIndex: number
    tracks: GpxTrack[]
    mode: MapMode
    onSelectPhoto: (index: number) => void
    onCameraStatus?: (message: string) => void
    onCameraScopeChange?: (label: string | undefined) => void
    onCameraScopesChange?: (scopes: MapCameraScopeOption[]) => void
    onCameraScopeSelectorChange?: (selector: MapCameraScopeSelector | undefined) => void
    onKeyboardHandlerChange?: (handler: MapKeyboardHandler | undefined) => void
  } = $props()

  let container: HTMLDivElement
  let map: maplibregl.Map | undefined
  let selectedMarker: maplibregl.Marker | undefined
  let resizeObserver: ResizeObserver | undefined
  let tabStopObserver: MutationObserver | undefined
  let loaded = $state(false)
  let loadError = $state('')
  let loadTimer: ReturnType<typeof setTimeout>
  let previousCurrentIndex = -1
  let lastNamedScopeId: string | undefined
  let lastNamedScope: MapCameraScope | undefined

  let groups = $derived(coordinateGroups(photos))
  let accessiblePhotos = $derived(photos.filter((photo) => photo.location))
  let cameraScopeInput = $derived<CameraScopeInput>({
    mode,
    photos,
    currentIndex,
    tracks,
    catalog: geographicCatalog,
  })
  let cameraScopes = $derived(availableCameraScopes(cameraScopeInput))

  function rememberCameraScope(scope: MapCameraScope) {
    lastNamedScopeId = scope.id
    lastNamedScope = scope
    onCameraScopeChange(scope.label)
  }

  function reportError(error: unknown) {
    const detail = error instanceof Error ? error : new Error(String(error))
    console.error('[Memory Atlas] Map initialization failed.', detail)
    loadError = 'The map could not load. Check your internet connection and try again.'
    clearTimeout(loadTimer)
  }

  function photoData(): FeatureCollection<Point> {
    const visibleGroups = mode === 'current' ? [] : groups
    return {
      type: 'FeatureCollection',
      features: visibleGroups.map((group, index) => ({
        type: 'Feature',
        id: index,
        geometry: { type: 'Point', coordinates: group.coordinate },
        properties: {
          photoIndices: JSON.stringify(group.photoIndices),
          exactCount: group.photoIndices.length,
          label: group.photoIndices.map((photoIndex) => photoAccessibleName(photos[photoIndex])).join(', '),
        },
      })),
    }
  }

  function trackData(): FeatureCollection<LineString> {
    return {
      type: 'FeatureCollection',
      features: (mode === 'track' ? tracks : []).flatMap((track) => track.segments.map((segment, segmentIndex) => ({
        type: 'Feature' as const,
        id: `${track.id}:${segmentIndex}`,
        geometry: { type: 'LineString' as const, coordinates: segment },
        properties: { label: track.name || track.fileName },
      }))),
    }
  }

  function startingCoordinate(): TrackPoint {
    const location = photos[currentIndex]?.location
    if (location) return [location.longitude, location.latitude]
    const firstTrackPoint = tracks.find((track) => track.segments.some((segment) => segment.length))
      ?.segments.find((segment) => segment.length)?.[0]
    return groups[0]?.coordinate ?? firstTrackPoint ?? [0, 0]
  }

  function selectedGroup() {
    return groups.find((group) => group.photoIndices.includes(currentIndex))
  }

  function removeSelectedMarker() {
    selectedMarker?.remove()
    selectedMarker = undefined
  }

  function updateSelectedMarker() {
    removeSelectedMarker()
    if (!map) return
    const photo = photos[currentIndex]
    if (!photo?.location) return
    const group = selectedGroup()
    const element = document.createElement('button')
    element.type = 'button'
    element.tabIndex = -1
    element.className = `memory-marker${group && group.photoIndices.length > 1 ? ' grouped' : ''}`
    element.setAttribute('aria-label', `Current photo: ${photoAccessibleName(photo)}`)
    element.title = photoAccessibleName(photo)
    if (group && group.photoIndices.length > 1) {
      element.dataset.count = String(group.photoIndices.length)
      element.title = `${photoAccessibleName(photo)} · ${group.photoIndices.length} photos at this location`
      element.addEventListener('click', (event) => {
        event.stopPropagation()
        onSelectPhoto(nextMemberInGroup(group, currentIndex))
      })
    }
    selectedMarker = new maplibregl.Marker({ element })
      .setLngLat([photo.location.longitude, photo.location.latitude])
      .addTo(map)
  }

  function followCurrentPhoto(scope: MapCameraScope) {
    if (!map) return
    if (scope.target.kind !== 'center') return
    map.easeTo({
      center: scope.target.coordinate,
      duration: 500,
    })
    rememberCameraScope(scope)
  }

  function cameraPadding() {
    const width = container?.clientWidth || 600
    const height = container?.clientHeight || 600
    const horizontal = Math.max(28, Math.min(72, Math.round(width * 0.08)))
    const vertical = Math.max(36, Math.min(72, Math.round(height * 0.08)))
    const region = container.closest<HTMLElement>('.map-region') ?? container.parentElement ?? container
    const regionBounds = region.getBoundingClientRect()
    const requiredInset = (
      selectors: string,
      edge: 'top' | 'right' | 'bottom',
      fallback: number,
    ) => {
      let inset = fallback
      for (const element of region.querySelectorAll<HTMLElement>(selectors)) {
        const bounds = element.getBoundingClientRect()
        if (!bounds.width || !bounds.height) continue
        const occupied = edge === 'top'
          ? bounds.bottom - regionBounds.top
          : edge === 'right'
            ? regionBounds.right - bounds.left
            : regionBounds.bottom - bounds.top
        inset = Math.max(inset, Math.ceil(occupied + CAMERA_OVERLAY_GUTTER))
      }
      return inset
    }
    return {
      top: requiredInset('.map-mode-bar, .map-notice', 'top', vertical),
      right: requiredInset('.maplibregl-ctrl-group', 'right', horizontal),
      bottom: requiredInset('.map-legend, .maplibregl-ctrl-attrib', 'bottom', vertical),
      left: horizontal,
    }
  }

  function applyCameraScope(scope: MapCameraScope, announce = true) {
    if (!map) return
    if (scope.target.kind === 'center') {
      map.easeTo({ center: scope.target.coordinate, zoom: MAP_INITIAL_ZOOM, duration: 500 })
    } else {
      const [west, south, east, north] = scope.target.bounds
      map.fitBounds([[west, south], [east, north]], {
        padding: cameraPadding(),
        maxZoom: MAP_INITIAL_ZOOM,
        duration: 500,
      })
    }
    rememberCameraScope(scope)
    if (announce) onCameraStatus(`Map view: ${scope.label}`)
  }

  function sameCameraTarget(left: MapCameraScope, right: MapCameraScope): boolean {
    if (left.target.kind !== right.target.kind) return false
    if (left.target.kind === 'center' && right.target.kind === 'center') {
      return left.target.coordinate[0] === right.target.coordinate[0]
        && left.target.coordinate[1] === right.target.coordinate[1]
    }
    if (left.target.kind === 'bounds' && right.target.kind === 'bounds') {
      const rightBounds = right.target.bounds
      return left.target.bounds.every((value, index) => value === rightBounds[index])
    }
    return false
  }

  function synchronizeCameraAfterPhotoChange() {
    if (!lastNamedScope) return
    const replacement = cameraScopeAfterPhotoChange(cameraScopeInput, lastNamedScope)
    if (!replacement) return
    if (replacement.kind === 'current') {
      followCurrentPhoto(replacement)
    } else if (!sameCameraTarget(lastNamedScope, replacement)) {
      applyCameraScope(replacement, false)
    } else {
      rememberCameraScope(replacement)
    }
  }

  function cycleCameraScope() {
    const primaryScopes = primaryCameraScopes(cameraScopes)
    if (!primaryScopes.length) {
      onCameraStatus('No named map view is available')
      return
    }
    const currentPosition = primaryScopes.findIndex((scope) => scope.id === lastNamedScopeId)
    applyCameraScope(primaryScopes[currentPosition < 0 ? 0 : (currentPosition + 1) % primaryScopes.length])
  }

  function selectCameraScope(scopeId: string) {
    const scope = cameraScopes.find((candidate) => candidate.id === scopeId)
    if (scope) applyCameraScope(scope)
  }

  function directCameraScope(kind: 'current' | 'day' | 'complete-track' | 'all-photos') {
    const scope = cameraScopes.find((candidate) => candidate.kind === kind)
    if (scope) {
      applyCameraScope(scope)
      return
    }
    if (kind === 'current') onCameraStatus('Current photo has no GPS')
    else if (kind === 'day') {
      if (mode === 'current') onCameraStatus('Day view requires All photos or Photos + GPX track')
      else if (!photos[currentIndex]?.capturedAt && !photos[currentIndex]?.capturedLocalDate) {
        onCameraStatus('Current photo has no capture time')
      } else onCameraStatus('No located photos were found for this day')
    } else if (kind === 'complete-track' && mode !== 'track') {
      onCameraStatus('Complete track view requires Photos + GPX track')
    } else if (kind === 'complete-track') {
      onCameraStatus('No drawable GPX track line was found in this folder')
    } else if (mode === 'current') {
      onCameraStatus('All photos view requires All photos or Photos + GPX track')
    } else onCameraStatus('No photos in this folder have GPS coordinates')
  }

  function updateSources() {
    if (!map || !loaded) return
    ;(map.getSource(PHOTO_SOURCE) as maplibregl.GeoJSONSource | undefined)?.setData(photoData())
    ;(map.getSource(TRACK_SOURCE) as maplibregl.GeoJSONSource | undefined)?.setData(trackData())
  }

  function syncScene() {
    if (!map || !loaded) return
    updateSources()
    const photoChanged = previousCurrentIndex !== currentIndex
    updateSelectedMarker()
    if (photoChanged) synchronizeCameraAfterPhotoChange()
    previousCurrentIndex = currentIndex
  }

  function refreshTilesAfterReconnect() {
    if (!map || !loaded) return
    try {
      for (const sourceId of Object.keys(map.getStyle().sources)) map.refreshTiles(sourceId)
    } catch (error) {
      console.error('[Memory Atlas] Map tiles could not be refreshed after reconnecting.', error)
    }
  }

  function removeInternalTabStops() {
    for (const element of container.querySelectorAll<HTMLElement>('a, button, summary, [tabindex]')) element.tabIndex = -1
  }

  const handleKeyboard: MapKeyboardHandler = (event) => {
    if (!map) return false
    const cameraCommand = mapCameraCommand(event)
    if (cameraCommand === 'cycle') cycleCameraScope()
    else if (cameraCommand) directCameraScope(cameraCommand)
    if (cameraCommand) return true
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return false
    const panOffsets: Record<string, [number, number]> = {
      ArrowLeft: [100, 0], ArrowRight: [-100, 0], ArrowUp: [0, 100], ArrowDown: [0, -100],
    }
    const offset = panOffsets[event.key]
    if (offset) {
      map.panBy(offset, { duration: 300 }, { originalEvent: event })
      return true
    }
    if (event.key === '+' || event.key === '=') {
      map.zoomIn({}, { originalEvent: event })
      return true
    }
    if (event.key === '-') {
      map.zoomOut({}, { originalEvent: event })
      return true
    }
    return false
  }

  function addDataLayers() {
    if (!map) return
    map.addSource(TRACK_SOURCE, { type: 'geojson', data: trackData() })
    map.addLayer({ id: 'track-casing', type: 'line', source: TRACK_SOURCE, paint: {
      'line-color': '#f7f5ee', 'line-width': 6, 'line-opacity': 0.88,
    } })
    map.addLayer({ id: 'tracks', type: 'line', source: TRACK_SOURCE, paint: {
      'line-color': '#49665d', 'line-width': 3, 'line-opacity': 0.94,
    } })
    map.addSource(PHOTO_SOURCE, {
      type: 'geojson', data: photoData(), cluster: true, clusterRadius: 44, clusterMaxZoom: 17,
      clusterProperties: { photoCount: ['+', ['get', 'exactCount']] },
    })
    map.addLayer({ id: CLUSTER_LAYER, type: 'circle', source: PHOTO_SOURCE,
      filter: ['has', 'point_count'], paint: {
        'circle-color': '#e8e5dc', 'circle-stroke-color': '#27322e', 'circle-stroke-width': 2,
        'circle-radius': ['step', ['get', 'photoCount'], 14, 10, 17, 40, 20],
      } })
    map.addLayer({ id: 'photo-cluster-count', type: 'symbol', source: PHOTO_SOURCE,
      filter: ['has', 'point_count'], layout: {
        'text-field': ['to-string', ['get', 'photoCount']], 'text-size': 11,
      }, paint: { 'text-color': '#18201d' } })
    map.addLayer({ id: PHOTO_LAYER, type: 'circle', source: PHOTO_SOURCE,
      filter: ['!', ['has', 'point_count']], paint: {
        'circle-color': '#7c8984', 'circle-radius': ['case', ['>', ['get', 'exactCount'], 1], 12, 7],
        'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2,
      } })
    map.addLayer({ id: 'photo-group-count', type: 'symbol', source: PHOTO_SOURCE,
      filter: ['all', ['!', ['has', 'point_count']], ['>', ['get', 'exactCount'], 1]], layout: {
        'text-field': ['to-string', ['get', 'exactCount']], 'text-size': 10,
      }, paint: { 'text-color': '#101513' } })

    map.on('click', CLUSTER_LAYER, async (event) => {
      const feature = event.features?.[0]
      const clusterId = Number(feature?.properties?.cluster_id)
      if (!feature || !Number.isFinite(clusterId) || feature.geometry.type !== 'Point') return
      const source = map?.getSource(PHOTO_SOURCE) as maplibregl.GeoJSONSource | undefined
      const zoom = await source?.getClusterExpansionZoom(clusterId)
      if (zoom !== undefined) map?.easeTo({ center: feature.geometry.coordinates as TrackPoint, zoom, duration: 350 })
    })
    map.on('click', PHOTO_LAYER, (event) => {
      const raw = event.features?.[0]?.properties?.photoIndices
      if (typeof raw !== 'string') return
      const indices = JSON.parse(raw) as number[]
      const group = groups.find((candidate) => candidate.photoIndices.join(',') === indices.join(','))
      if (group) onSelectPhoto(nextMemberInGroup(group, currentIndex))
    })
  }

  onMount(() => {
    try {
      previousCurrentIndex = currentIndex
      lastNamedScopeId = photos[currentIndex]?.location ? 'current' : undefined
      lastNamedScope = cameraScopes.find((scope) => scope.id === lastNamedScopeId)
      onCameraScopeChange(lastNamedScope?.label)
      map = new maplibregl.Map({
        container, style: MAP_STYLE_URL, center: startingCoordinate(), zoom: MAP_INITIAL_ZOOM, attributionControl: {},
      })
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
      removeInternalTabStops()
      if (typeof MutationObserver !== 'undefined') {
        tabStopObserver = new MutationObserver(removeInternalTabStops)
        tabStopObserver.observe(container, { childList: true, subtree: true })
      }
      onKeyboardHandlerChange(handleKeyboard)
      onCameraScopeSelectorChange(selectCameraScope)
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => map?.resize())
        resizeObserver.observe(container)
      }
      map.on('load', () => {
        addDataLayers()
        loaded = true
        loadError = ''
        clearTimeout(loadTimer)
        syncScene()
      })
      map.on('error', (event) => { if (!loaded) reportError(event.error) })
      loadTimer = setTimeout(() => { if (!loaded) reportError(new Error('Map load timed out after 15 seconds.')) }, 15_000)
      window.addEventListener('online', refreshTilesAfterReconnect)
    } catch (error) {
      reportError(error)
    }
  })

  $effect(() => {
    photos; currentIndex; tracks; mode; cameraScopes
    onCameraScopesChange(cameraScopeOptions(cameraScopes))
    syncScene()
  })

  onDestroy(() => {
    clearTimeout(loadTimer)
    window.removeEventListener('online', refreshTilesAfterReconnect)
    resizeObserver?.disconnect()
    tabStopObserver?.disconnect()
    onKeyboardHandlerChange(undefined)
    onCameraScopeSelectorChange(undefined)
    onCameraScopesChange([])
    removeSelectedMarker()
    map?.remove()
  })
</script>

<div class="map-panel">
  <div class="map-canvas" bind:this={container}></div>
  {#if !loaded && !loadError}<div class="map-loading" role="status">Opening map…</div>{/if}
  {#if loadError}<p class="map-error" role="alert">{loadError}</p>{/if}
  <ul class="visually-hidden" aria-label="Located photos">
    {#each accessiblePhotos as photo}<li>{photoAccessibleName(photo)}</li>{/each}
  </ul>
</div>
