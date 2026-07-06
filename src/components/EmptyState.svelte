<script lang="ts">
  let { kind, message, onBack }: { kind: 'empty' | 'error'; message?: string; onBack: () => void } = $props()
</script>

<main class="empty-screen">
  <div class="empty-mark" aria-hidden="true">{kind === 'empty' ? '○' : '!'}</div>
  <p class="eyebrow">{kind === 'empty' ? 'Nothing to open' : 'Something went astray'}</p>
  <h1>{kind === 'empty' ? 'No JPEG photos found' : 'The folder could not be read'}</h1>
  <p>{message || 'Choose a folder containing .jpg or .jpeg files directly inside it.'}</p>
  <button class="choose-button" type="button" onclick={onBack}>Choose another folder</button>
</main>

