<script lang="ts">
  let { onSelect }: { onSelect: (files: File[]) => void } = $props()
  let input: HTMLInputElement

  function handleChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement
    if (target.files?.length) onSelect(Array.from(target.files))
    target.value = ''
  }
</script>

<main class="entry-screen">
  <div class="earth" aria-hidden="true">
    <img src="./images/earth.jpg" alt="" />
  </div>
  <div class="entry-copy">
    <p class="eyebrow">A place for remembered moments</p>
    <h1>Memory Atlas</h1>
    <p class="intro">Rediscover a folder of photographs through the stories and places already held inside them.</p>
    <button class="choose-button" type="button" onclick={() => input.click()}>
      Choose photo folder
      <span aria-hidden="true">↗</span>
    </button>
    <input
      bind:this={input}
      class="visually-hidden"
      type="file"
      accept=".jpg,.jpeg"
      webkitdirectory
      multiple
      onchange={handleChange}
      aria-label="Choose photo folder"
    />
    <p class="privacy-note">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 10V7a4 4 0 0 1 8 0v3m-9 0h10v9H7z" /></svg>
      Your photos stay on this computer.
    </p>
  </div>
</main>
