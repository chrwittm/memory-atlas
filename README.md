# Memory Atlas

Memory Atlas is a local-first application for rediscovering photos through the
context already attached to them. Its first release will let someone select a
local folder of JPEGs, browse them in a calm full-viewport presentation, read
embedded captions, and reveal the current photo beside its location on a map.

Status: **MVP implemented.**

The accepted next deployment slice packages the existing application with
Electron as a self-contained macOS `.app` and `.dmg` for stable local testing.
See [Deployment Options](docs/product/deployment-options.md).

## Run locally

Memory Atlas requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local address printed by Vite, choose a folder, and select it through
the browser's folder picker. The app keeps only top-level `.jpg` and `.jpeg`
files and displays them in natural file-name order, so prefixes such as `001`,
`002`, and `003` control the sequence. Photos and extracted metadata remain in
the browser; opening the optional map makes network requests for map tiles.

Quality checks:

```bash
npm run check
npm test
npm run build
```

For a beginner-friendly macOS workflow, including when to refresh or restart
the development server, see [How to Run and Test Memory Atlas on a Mac](docs/how-to-test.md).

## Start here

- [Living project context](docs/product/project-context.md)
- [Accepted MVP description](docs/product/mvp-description.md)
- [Accepted technology stack](docs/product/mvp-technology-stack.md)
- [Deployment options and accepted macOS packaging](docs/product/deployment-options.md)
- [Repository guide for agents and contributors](AGENTS.md)

The original proposal remains available at
[docs/product/intent-v1.md](docs/product/intent-v1.md), but is historical and not
an implementation specification.

## MVP in one sentence

Select a local folder of JPEG photos, browse them without uploading or changing
the originals, reveal embedded captions, and open the current geotagged photo in
a split photo-and-map view.

## Repository structure

```text
docs/product/       product context, accepted MVP, stack, and history
public/images/      public visual assets served unchanged by Vite
fixtures/           local, private representative input data
AGENTS.md           durable implementation and handoff guidance
```

Runtime code lives in `src/`. Photo ingestion runs in a Web Worker, normalizes
ExifReader output behind typed contracts, and isolates per-file failures. The
viewer lazily retains object URLs only for the current image and its immediate
neighbors. MapLibre and its CSS are loaded only when a geotagged photo opens the
map.

The local `fixtures/photo-folders/2026-06-20-Schlossherrenrunde/` collection is
the representative corpus for the first metadata and viewer spike. It is kept
outside `public/` and ignored by Git because it may contain personal and location
metadata.
