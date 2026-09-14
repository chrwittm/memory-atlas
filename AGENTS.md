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

## Guiding product experience

Simplicity, ease of use, and delight are product-wide requirements, not a final
polish pass. Apply them when exploring ideas, writing specifications, choosing
architecture, implementing behavior, and reviewing completed work.

- Show only what helps the user with the task at hand. Remove decorative or
  redundant markers, borders, labels, controls, and persistent status elements
  when they compete with the memory itself.
- Prefer direct, calm interactions and strong keyboard support. Common actions
  should feel obvious and require as little attention and ceremony as possible.
- Keep powerful features available through context, progressive disclosure,
  and well-chosen defaults instead of exposing their full complexity at once.
- Every visible element and interaction must earn its place. Necessary state,
  feedback, and accessibility cues remain clear, but should not become visual
  decoration or distraction.
- When a proposed behavior makes the interface more confusing, visually noisy,
  or harder to operate, do not implement it as proposed. Find the simpler,
  more elegant expression of the underlying user need, and reflect that choice
  in the feature specification and acceptance criteria.
- Evaluate simplicity from the user's perspective rather than by implementation
  size. The hard product work is often making a rich capability feel natural,
  focused, and effortless.

## Project language

- Use American English by default for Memory Atlas conversations, source code,
  comments, documentation, specifications, plans, UI copy, and repository
  artifacts.
- Preserve source material that is intentionally written in another language,
  and use another language when the user explicitly requests it. The presence
  of German personal or memory files does not change the repository default.

## Read this first

Use these documents in this order:

1. [`docs/README.md`](docs/README.md) — documentation map, authority rules, and
   workflow for new specifications and plans.
2. [`docs/product/context.md`](docs/product/context.md) — durable
   product handoff and current interpretation.
3. [`docs/product/specifications/mvp.md`](docs/product/specifications/mvp.md) —
   authoritative MVP behavior and acceptance criteria.
4. [`docs/architecture/decisions/0001-mvp-technology-stack.md`](docs/architecture/decisions/0001-mvp-technology-stack.md)
   — authoritative implementation decisions.
5. [`docs/architecture/decisions/0002-macos-electron-packaging.md`](docs/architecture/decisions/0002-macos-electron-packaging.md) —
   accepted macOS Electron packaging decision and alternatives.
6. [`docs/product/vision.md`](docs/product/vision.md) — long-term
   product vision and naming rationale.
7. [`docs/archive/product/intent-v1.md`](docs/archive/product/intent-v1.md) — historical initial
   proposal only; its backend, ExifTool, thumbnail, index, and Leaflet choices
   are superseded.

When documents disagree about the MVP, the accepted MVP specification and
technology-stack decision win. For post-MVP work, accepted feature
specifications and later architecture decisions take precedence. Update
`docs/product/context.md` when a durable decision changes.

## Current technical decisions

- Product name: **Memory Atlas**. Use “Memory Explorer” only for naming history.
- Svelte, TypeScript, Vite, and plain CSS; no SvelteKit for the MVP.
- Node 24.20.0 LTS and npm 11.19.0 for development/releases; Electron 42.11.2
  and stable Forge 7.11.2 for the 0.3.0 tester release. MapLibre is pinned to patched 6.4.1; its ESM
  worker is bundled locally. Vitest 4.1.11 supplies the test runner.
- Browser-native Svelte application core packaged with Electron and bundled
  Chromium as a self-contained macOS `.app` and `.dmg` for MVP testing.
- `npm run release:mac -- --allow-network-audit` as the deterministic release
  gate; verbose logs and generated evidence stay under ignored `out/release/`.
- Windows, Linux, phones, tablets, hosted web deployment, PWA installation, and
  automatic updates are deferred platform and distribution decisions.
- The selected repository license is Apache-2.0. The initial GitHub target is
  the owner's public personal `chrwittm/memory-atlas` repository, followed by
  an explicitly unnotarized tester prerelease; normal public distribution still
  requires Developer ID signing and notarization.
- The selected durable macOS bundle identifier is
  `io.github.chrwittm.memoryatlas`, with an original atlas/compass icon;
  historical local artifacts retain their recorded identity.
- Use GitHub private vulnerability reporting as the public repository's
  confidential security-reporting route. The planned root `SECURITY.md` must
  direct reporters there rather than expose a personal email address, and must
  not promise response times, a bounty, or a support contract.
- Runtime folder selection through `<input type="file" webkitdirectory multiple>`;
  retain only top-level `.jpg`, `.jpeg`, and `.gpx` files, with GPX files kept
  outside the photo sequence.
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
- The split map has three cumulative `G` content modes. Map-focused `Z` cycles
  through the primary Current photo, Day, Complete track, and All photos camera
  scopes, skipping unavailable stops. A grouped Zoom menu retains direct access
  to every available temporal, packaged German/U.S. geographic, collection,
  and track scope; the U.S. ladder adds a Contiguous United States frame before
  the full country. `G` itself preserves the shared camera. Stacked GPS and Zoom
  controls expose both states. Photo changes
  preserve manual zoom and an applicable active scope: temporal contexts refit,
  geographic scopes move to a destination scope at the same level when
  available, and otherwise fall back to Current photo.
- Named map fits use base viewport padding expanded by measured persistent map
  overlays and a feature-aware gutter, so track geometry and in-scope markers
  do not sit beneath map UI or attribution.
- Lazy object URLs and image decoding: current photo plus a small neighbor window;
  revoke URLs when no longer needed.
- No server backend, database, uploads, accounts, persistence, generated index,
  or modification of original files in the MVP.

## Repository map

```text
AGENTS.md                    agent and contributor handoff
README.md                    human-facing repository entry point
docs/user-guide.md           user-facing MVP features, controls, and help
docs/product/                current product context, vision, and specifications
docs/planning/               feature backlog and confirmed known issues
docs/architecture/           accepted technical and platform decisions
docs/operations/             executable runbooks and operational policy
docs/delivery/               dated plans, reviews, and verification evidence
docs/archive/                superseded documents retained for history
electron/                    Electron main process for packaged desktop builds
scripts/                     deterministic macOS release gate, policy, and tests
src/                         Svelte application, photo ingestion, and tests
public/images/earth.jpg      provenance-cleared NASA entry-screen Earth image
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
- Keep documentation links valid when files move. Preserve the MVP specification
  as the accepted baseline except when correcting that baseline. Record new
  accepted scope in its feature specification and the product context, and
  record lasting technical changes in an architecture decision.
- Treat documentation as part of the definition of done in every subsequent
  session. Proactively update every affected public document in the same change
  without waiting for a separate documentation request. This includes the user
  guide for user-facing features, controls, shortcuts, supported inputs, visible
  states, and recovery paths; product specifications and context for accepted
  behavior; architecture decisions for lasting technical choices; operations
  documentation for changed workflows; and planning or delivery records when
  their status or evidence changes. Do not rewrite unaffected documents merely
  to create documentation activity.
