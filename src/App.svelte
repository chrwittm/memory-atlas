<script lang="ts">
  import EntryScreen from './components/EntryScreen.svelte'
  import LoadingScreen from './components/LoadingScreen.svelte'
  import EmptyState from './components/EmptyState.svelte'
  import Viewer from './components/Viewer.svelte'
  import { scanFolder, type ScanProgress } from './lib/photos/scanner'
  import type { Photo } from './lib/photos/types'

  type Screen = 'entry' | 'loading' | 'empty' | 'error' | 'viewer'
  let screen = $state<Screen>('entry')
  let progress = $state<ScanProgress>({ completed: 0, total: 0 })
  let photos = $state<Photo[]>([])
  let folderName = $state('')
  let errorMessage = $state('')

  async function selectFolder(files: File[]) {
    screen = 'loading'
    progress = { completed: 0, total: 0 }
    errorMessage = ''
    try {
      const result = await scanFolder(files, (next) => (progress = next))
      photos = result.photos
      folderName = result.folderName
      screen = photos.length ? 'viewer' : 'empty'
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'The selected folder could not be opened.'
      screen = 'error'
    }
  }

  function reset() {
    photos = []
    folderName = ''
    screen = 'entry'
  }
</script>

{#if screen === 'entry'}
  <EntryScreen onSelect={selectFolder} />
{:else if screen === 'loading'}
  <LoadingScreen {progress} />
{:else if screen === 'empty'}
  <EmptyState kind="empty" onBack={reset} />
{:else if screen === 'error'}
  <EmptyState kind="error" message={errorMessage} onBack={reset} />
{:else}
  <Viewer {photos} {folderName} onChooseAnother={reset} />
{/if}

