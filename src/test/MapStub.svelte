<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { mapCameraCommand, type MapKeyboardHandler } from '../lib/map/keyboard'
  import type { MapCameraScopeOption, MapCameraScopeSelector } from '../lib/map/cameraScopes'

  let {
    onCameraStatus = () => undefined,
    onCameraScopeChange = () => undefined,
    onCameraScopesChange = () => undefined,
    onCameraScopeSelectorChange = () => undefined,
    onKeyboardHandlerChange = () => undefined,
  }: {
    onCameraStatus?: (message: string) => void
    onCameraScopeChange?: (label: string | undefined) => void
    onCameraScopesChange?: (scopes: MapCameraScopeOption[]) => void
    onCameraScopeSelectorChange?: (selector: MapCameraScopeSelector | undefined) => void
    onKeyboardHandlerChange?: (handler: MapKeyboardHandler | undefined) => void
  } = $props()

  onMount(() => {
    let scope = 'Current photo'
    const scopes: MapCameraScopeOption[] = [
      { id: 'current', group: 'focus', label: 'Current photo' },
      { id: 'day', group: 'time', label: 'Day' },
      { id: 'surrounding-days', group: 'time', label: 'Surrounding seven days' },
      { id: 'area:park', group: 'place', label: 'Lassen Volcanic National Park' },
      { id: 'area:state', group: 'place', label: 'California' },
      { id: 'all-photos', group: 'collection', label: 'All photos' },
      { id: 'complete-track', group: 'collection', label: 'Complete track' },
    ]
    const labels = new Map(scopes.map(({ id, label }) => [id, label]))
    const selectScope = (scopeId: string) => {
      scope = labels.get(scopeId) ?? scopeId
      onCameraScopeChange(scope)
      onCameraStatus(`Map view: ${scope}`)
    }
    onCameraScopeChange(scope)
    onCameraScopesChange(scopes)
    onCameraScopeSelectorChange(selectScope)
    onKeyboardHandlerChange((event) => {
      const command = mapCameraCommand(event)
      if (!command) return false
      const scopeId = command === 'cycle' ? (scope === 'Current photo' ? 'day' : 'current') : command
      selectScope(scopeId)
      return true
    })
  })
  onDestroy(() => {
    onKeyboardHandlerChange(undefined)
    onCameraScopeSelectorChange(undefined)
    onCameraScopesChange([])
  })
</script>

<div class="map-panel" data-testid="map-stub"></div>
