# Memory Atlas

Memory Atlas is a local-first macOS photo viewer for rediscovering personal
photos through the context already embedded in them: captions, capture time, and
where available, location.

Status: **MVP / proof of concept.** The core app is implemented and can be
packaged as a self-contained macOS DMG for local testing.

## Try the app

The intended public download path is
[GitHub Releases](../../releases):

1. Open the [Releases page](../../releases).
2. Download the latest `Memory Atlas-<version>-<architecture>.dmg`.
3. Open the DMG and drag **Memory Atlas** to **Applications**.
4. Launch **Memory Atlas** and choose a local folder of JPEG photos.

For Apple silicon Macs, download the `arm64` DMG. For Intel Macs, download the
`x64` DMG if one is published. The current MVP build is ad-hoc signed for local
testing, not Developer ID notarized, so macOS may ask you to Control-click the
app and choose **Open** the first time.

For maintainers, the exact packaging runbook is in
[docs/deployment.md](docs/deployment.md). Generated DMGs belong on GitHub
Releases, not committed into the repository. If the Releases page has no DMG
assets yet, no public build has been published.

## What the MVP does

- Opens a user-selected local folder of top-level `.jpg` and `.jpeg` files.
- Shows photos in natural file-name order, so names like `001`, `002`, `003`
  control the sequence.
- Reads embedded EXIF, TIFF, IPTC, and XMP metadata in a Web Worker.
- Shows embedded captions and capture time when available.
- Opens an optional split photo-and-map view for the current geotagged photo.
- Keeps original photo files read-only and local.

Map mode loads map tiles from OpenFreeMap. Photo files and extracted metadata
are not uploaded by the app.

## Current limitations

This is intentionally a narrow POC:

- macOS only for now.
- JPEG folders only; no HEIC, RAW, videos, or nested folder import yet.
- No library database, accounts, cloud sync, uploads, generated index, or
  automatic updates.
- Public distribution still needs Apple Developer ID signing and notarization.

## Run from source

Memory Atlas requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local address printed by Vite, choose a folder, and select it through
the browser's folder picker.

Quality checks:

```bash
npm run check
npm test
npm run build
```

Package a macOS DMG:

```bash
npm run make:mac
```

## Project documentation

- [Living project context](docs/product/project-context.md)
- [Living product backlog and feature workflow](docs/product/product-backlog.md)
- [Accepted MVP description](docs/product/mvp-description.md)
- [Accepted technology stack](docs/product/mvp-technology-stack.md)
- [macOS deployment instructions](docs/deployment.md)
- [Deployment options and accepted packaging decision](docs/product/deployment-options.md)
- [Repository guide for agents and contributors](AGENTS.md)

The original proposal remains available at
[docs/product/intent-v1.md](docs/product/intent-v1.md), but it is historical and
not an implementation specification.

## Repository structure

```text
src/                  Svelte app, photo ingestion, metadata normalization, tests
electron/             Electron main process for the packaged desktop app
docs/                 product, testing, and deployment documentation
public/images/        public visual assets served unchanged by Vite
fixtures/             private local test-photo folders, ignored by Git
forge.config.cjs      Electron Forge packaging configuration
```

The local `fixtures/photo-folders/2026-06-20-Schlossherrenrunde/` collection is
the representative corpus for metadata and viewer testing when present. It is
kept outside `public/` and ignored by Git because it may contain personal and
location metadata.

## Publishing a POC release

Before pointing a blog post or external audience at the app:

1. Choose the repository license and add a root `LICENSE` file.
2. Run `npm run make:mac` on the target Mac architecture.
3. Create a [GitHub Release](../../releases/new), mark it as a pre-release if
   the POC caveats still apply, and upload the generated DMG as the release
   asset.
4. Include the DMG SHA-256 checksum and the notarization caveat in the release
   notes.
5. Link readers to the [latest release](../../releases/latest) rather than to a
   committed binary file.

## License

No license has been selected yet. Until a license is added, the code is visible
but not generally open source for reuse.
