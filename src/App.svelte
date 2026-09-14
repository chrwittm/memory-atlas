<script lang="ts">
  import { onDestroy } from 'svelte'
  import EntryScreen from './components/EntryScreen.svelte'
  import LoadingScreen from './components/LoadingScreen.svelte'
  import EmptyState from './components/EmptyState.svelte'
  import Viewer from './components/Viewer.svelte'
  import { scanFolder, type ScanProgress } from './lib/photos/scanner'
  import type { GpxTrack, Photo } from './lib/photos/types'

  type Screen = 'entry' | 'loading' | 'empty' | 'error' | 'viewer'
  let screen = $state<Screen>('entry')
  let progress = $state<ScanProgress>({ completed: 0, total: 0 })
  let photos = $state<Photo[]>([])
  let tracks = $state<GpxTrack[]>([])
  let gpxFailures = $state<Array<{ fileName: string; error: string }>>([])
  let folderName = $state('')
  let errorMessage = $state('')
  let scanController: AbortController | undefined

  async function selectFolder(files: File[]) {
    scanController?.abort()
    const controller = new AbortController()
    scanController = controller
    screen = 'loading'
    progress = { completed: 0, total: 0 }
    errorMessage = ''
    try {
      const result = await scanFolder(files, (next) => {
        if (!controller.signal.aborted && scanController === controller) progress = next
      }, {
        signal: controller.signal,
      })
      if (controller.signal.aborted || scanController !== controller) return
      photos = result.photos
      tracks = result.tracks
      gpxFailures = result.gpxFailures
      folderName = result.folderName
      screen = photos.length ? 'viewer' : 'empty'
    } catch (error) {
      if (controller.signal.aborted || scanController !== controller) return
      errorMessage = error instanceof Error ? error.message : 'The selected folder could not be opened.'
      screen = 'error'
    } finally {
      if (scanController === controller) scanController = undefined
    }
  }

  function reset() {
    scanController?.abort()
    scanController = undefined
    photos = []
    tracks = []
    gpxFailures = []
    folderName = ''
    screen = 'entry'
  }

  onDestroy(() => scanController?.abort())
</script>

{#if screen === 'entry'}
  <EntryScreen onSelect={selectFolder} />
{:else if screen === 'loading'}
  <LoadingScreen {progress} onCancel={reset} />
{:else if screen === 'empty'}
  <EmptyState kind="empty" onBack={reset} />
{:else if screen === 'error'}
  <EmptyState kind="error" message={errorMessage} onBack={reset} />
{:else}
  <Viewer {photos} {tracks} {gpxFailures} {folderName} onChooseAnother={reset} />
{/if}
