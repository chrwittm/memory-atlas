# Memory Atlas release notes

Memory Atlas is a local-first macOS photo viewer for browsing JPEG folders with
their embedded captions, capture times, and locations. These notes cover the
local proof-of-concept builds produced so far; no public release has been
published yet.

## 0.2.1 — Unreleased tester candidate

- Apache-2.0 licensing, verified NASA asset provenance, and public repository metadata.
- Original atlas/compass application icon and stable `io.github.chrwittm.memoryatlas` identity.
- Node 24 LTS build toolchain and Electron 42.11.2, patching the two known Electron runtime advisories.
- Candidate fullscreen permission fix with expanded focus and rejection regressions;
  installed-app verification remains pending (MA-BUG-002).
- Zero production audit findings; remaining Forge build-tool findings are reviewed
  in the [dependency policy](docs/operations/dependency-security.md).

This candidate is ad-hoc signed and unnotarized. No 0.2.1 public download is
claimed until the release gate, installed-app checks, and upload verification
are complete. The following 0.2.0 checksum identifies its historical local
artifact and must not be reused for 0.2.1.

## 0.2.0 — 2026-09-04 (unpublished local milestone)

This release makes individual photos much more useful for close inspection by
adding zoom, pan, and remembered views while preserving the calm presentation
experience of the original MVP.

### What's new

- Zoom from the fitted view up to 400% of the JPEG's native dimensions with a
  mouse wheel, trackpad gesture, or the `+` and `-` keys.
- Keep the detail under the pointer stationary while zooming until an image edge
  reaches its bound.
- Pan enlarged photos by dragging or with all four Arrow keys, with clamped
  bounds that do not reveal additional empty canvas.
- Press `Z` or double-click the photo to cycle through fitted, native 100%, and
  the most recent custom view; unavailable or duplicate views are skipped.
- See brief fitted, native, or custom-percentage feedback when cycling views
  with `Z`.
- Restore the active zoom and focal detail separately for each photo during the
  current folder session, including after navigation, map resizing, window
  resizing, and fullscreen changes.
- Continue using the left and right edge buttons to change photos while an
  image is enlarged; Left and Right Arrow navigation resumes at fitted scale.

### Reliability and security maintenance

- Updated `@xmldom/xmldom` to 0.9.12 to resolve a moderate runtime advisory.
- Updated compatible build transitives including `browserslist`, `fast-uri`,
  `ip-address`, and `nanoid`.
- Verified the production dependency audit with zero vulnerabilities.
- Retained the accepted Node 20.18.x toolchain and Electron 41.7.1 because the
  patched Electron 41 releases currently require Node 22.12 or later. Remaining
  Electron and packaging-tool findings, their limited reachability in Memory
  Atlas, and their update triggers are documented in the
  [dependency security review](docs/operations/dependency-security.md).

### Download and checksum

The current local build targets Apple silicon (`arm64`):

```text
Memory Atlas-0.2.0-arm64.dmg
SHA-256: d03e2a62e4494c45ab6c552508e955d2678d6e0c28e04974d9c6a33e3b05cf12
```

The DMG is available only in the local build output; it has not been uploaded
or tagged as a GitHub release. The complete build evidence is in the
[0.2.0 packaged-build verification](docs/delivery/verifications/2026-09-04-v0.2.0-packaged-build.md).

### Install

1. Open `Memory Atlas-0.2.0-arm64.dmg`.
2. Drag **Memory Atlas** to **Applications**.
3. Eject the disk image and open **Memory Atlas** from Applications.
4. If macOS blocks the first launch, Control-click the app, choose **Open**, and
   confirm **Open**.

This local testing build is ad-hoc signed and not Apple Developer ID notarized.
The app and mounted DMG passed strict signature and checksum verification, but
the installed-app interaction checklist remains outstanding.

### Known limitations

- macOS and Apple silicon only for this artifact; no Intel or universal build
  was produced.
- JPEG files directly inside one selected folder only; nested folders, HEIC,
  RAW, PNG, and video are not imported.
- No accounts, uploads, cloud synchronization, library database, automatic
  updates, or modification of source photos.
- The optional map requires an internet connection. Tiles requested while fully
  offline may remain blank after reconnection until the app is restarted; see
  [MA-BUG-001](docs/planning/known-issues.md#ma-bug-001-map-tiles-do-not-recover-after-an-offline-request).
- Normal distribution to other Macs still requires Developer ID signing,
  notarization, and compatible-hardware testing.

## 0.1.0 — 2026-07-31

The first packaged MVP established the complete local photo-viewing slice and
the hardened macOS application shell.

### Initial MVP

- Choose a local folder and include only top-level `.jpg` and `.jpeg` files.
- Browse in case-insensitive natural file-name order with previous/next controls
  and Arrow-key navigation.
- Extract EXIF, TIFF, IPTC, and XMP metadata in a Web Worker with bounded
  concurrency, visible progress, cancellation, and per-file failure isolation.
- Show embedded captions and capture time together, visible by default and
  toggleable with `I`.
- Open the current geotagged photo beside a MapLibre/OpenFreeMap map with `M`,
  resize the split view, and retain map mode across photos without GPS using an
  explanatory placeholder.
- Enter and leave presentation fullscreen with `F`, while preserving standard
  Escape priority for fullscreen and map dismissal.
- Keep original photos read-only and local, retain object URLs only for the
  current photo and nearby neighbors, and revoke them when no longer needed.
- Package the Vite application in an Electron shell with Node integration
  disabled, context isolation and sandboxing enabled, restrictive navigation
  and permissions, and explicit renderer-load failure handling.

### Baseline limitations

The 0.1.0 artifact was an Apple silicon, ad-hoc-signed, unnotarized local test
build. It was not a public release. Its verification evidence, including the
original checksum and packaged smoke-test results, remains in the
[0.1.0 packaged-build record](docs/delivery/verifications/2026-07-31-slice-b-packaged-build.md).
