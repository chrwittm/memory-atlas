# Memory Atlas repository guide

## Purpose

Memory Atlas is a local-first application for rediscovering personal experiences
through photos and their context. The accepted MVP is a calm desktop viewer for
a user-selected folder of JPEGs, with file-name-ordered navigation, embedded
captions, and an optional split-screen map for the current photo. Its existing
browser-native core is packaged with Electron for self-contained macOS testing.

The MVP implementation and local macOS DMG packaging path exist. Preserve the
narrow accepted MVP while keeping the architecture hospitable to later
thumbnail, multi-photo map, timeline, people, and topic views.

## Read this first

Use these documents in this order:

1. [`docs/product/project-context.md`](docs/product/project-context.md) — durable
   product handoff and current interpretation.
2. [`docs/product/mvp-description.md`](docs/product/mvp-description.md) —
   authoritative MVP behavior and acceptance criteria.
3. [`docs/product/mvp-technology-stack.md`](docs/product/mvp-technology-stack.md)
   — authoritative implementation decisions.
4. [`docs/product/deployment-options.md`](docs/product/deployment-options.md) —
   accepted macOS Electron packaging decision and alternatives.
5. [`docs/product/project-name.md`](docs/product/project-name.md) — long-term
   product vision and naming rationale.
6. [`docs/product/intent-v1.md`](docs/product/intent-v1.md) — historical initial
   proposal only; its backend, ExifTool, thumbnail, index, and Leaflet choices
   are superseded.

When documents disagree about the MVP, the accepted MVP description and
technology stack win. Update `project-context.md` when a durable decision changes.

## Current technical decisions

- Product name: **Memory Atlas**. Use “Memory Explorer” only for naming history.
- Svelte, TypeScript, Vite, and plain CSS; no SvelteKit for the MVP.
- Browser-native Svelte application core packaged with Electron and bundled
  Chromium as a self-contained macOS `.app` and `.dmg` for MVP testing.
- Windows, Linux, phones, tablets, hosted web deployment, PWA installation, and
  automatic updates are deferred platform and distribution decisions.
- Runtime folder selection through `<input type="file" webkitdirectory multiple>`;
  retain only top-level `.jpg` and `.jpeg` files.
- Case-insensitive natural file-name order controls the presentation sequence;
  capture time is context, not a sorting key.
- ExifReader for required EXIF/TIFF, IPTC, and XMP metadata.
- Metadata ingestion in a Web Worker with bounded concurrency and per-file
  failures; UI components must not parse metadata.
- MapLibre GL JS with a centrally configured OpenFreeMap style, dynamically
  imported on first map use.
- The information overlay combines caption and capture time, tolerates either
  value being absent, and is toggled with `I`.
- Map mode starts at an 80/20 photo-to-map split and stays open across photos
  without GPS, showing a placeholder until location data is available again.
- Lazy object URLs and image decoding: current photo plus a small neighbor window;
  revoke URLs when no longer needed.
- No server backend, database, uploads, accounts, persistence, generated index,
  or modification of original files in the MVP.

## Repository map

```text
AGENTS.md                    agent and contributor handoff
README.md                    human-facing repository entry point
docs/product/                product history, MVP, and architecture decisions
docs/deployment.md           executable macOS DMG deployment runbook
electron/                    Electron main process for packaged desktop builds
src/                         Svelte application, photo ingestion, and tests
public/images/earth.jpg      provisional entry-screen Earth image
public/images/README.md      asset purpose and provenance notes
fixtures/photo-folders/      local representative photo collections (untracked)
```

Keep runtime code in `src/`, public files in Vite's `public/` directory, and
tests beside relevant modules or in a named test directory. Prefer
feature/domain names over generic buckets.

## Documentation boundaries

- Public project documentation belongs in `README.md`, `docs/`, and
  `docs/product/`. Write it for external readers, contributors, and future
  maintainers.
- Personal learning notes, scratchpads, exploratory walkthroughs, and private
  operating notes must not be committed. Keep them in ignored local files when
  present.
- Do not add links from public documentation to ignored or private files,
  because those links will be broken for GitHub readers and fresh clones.
- When a private note captures a durable project decision, promote only the
  project-relevant decision into public docs; leave the personal explanation
  private.

## Implementation boundaries

- Treat one selected folder as one temporary collection, not as the permanent
  definition of a memory.
- Prefer explicit filesystem artifacts such as file names and embedded metadata
  over hidden app-owned state when they can express the requirement cleanly.
- Original files are read-only and must remain byte-for-byte unchanged.
- A bad metadata record or undecodable photo must not prevent other photos from
  opening.
- Captions are shown by default when present and remain toggleable for the
  current folder session together with capture time as photo information.
- The MVP map represents only the current photo. Thumbnail grids and markers for
  every photo are post-MVP.
- Map use requires network tile requests; photo files and extracted metadata
  must not be uploaded.
- Keep map-provider details behind configuration and normalized metadata behind
  a typed ingestion boundary.

## Working practices

- Before broad implementation, inspect representative real photos for caption,
  date, GPS, keyword, and people metadata compatibility. The primary local corpus
  is `fixtures/photo-folders/2026-06-20-Schlossherrenrunde/` when present.
- Treat everything under `fixtures/photo-folders/` as private, read-only user
  source data. Do not serve, upload, rewrite, or commit it by default.
- Build and verify the end-to-end vertical slice before presentation polish.
- Add dependencies only for a demonstrated requirement.
- Preserve unrelated user changes and never overwrite source photos or assets.
- After implementation begins, run the repository's documented checks and add
  focused tests for metadata normalization, stable sorting, folder filtering,
  error isolation, keyboard behavior, and object-URL cleanup.
- Keep documentation links valid when files move. Record accepted scope or stack
  changes in all three current documents: context, MVP description, and stack.
