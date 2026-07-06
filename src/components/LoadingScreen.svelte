<script lang="ts">
  import type { ScanProgress } from '../lib/photos/scanner'
  let { progress }: { progress: ScanProgress } = $props()
  let percentage = $derived(progress.total ? Math.round((progress.completed / progress.total) * 100) : 0)
</script>

<main class="loading-screen" aria-live="polite" aria-busy="true">
  <div class="loader-mark" aria-hidden="true"><span></span></div>
  <p class="eyebrow">Opening {progress.folderName || 'your collection'}</p>
  <h1>Reading the moments</h1>
  <p>{progress.total ? `${progress.completed} of ${progress.total} photos` : 'Finding JPEG photos…'}</p>
  <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax={progress.total || 1} aria-valuenow={progress.completed}>
    <span style={`width: ${percentage}%`}></span>
  </div>
</main>

