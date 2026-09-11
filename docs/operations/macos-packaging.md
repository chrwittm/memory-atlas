# Deploy Memory Atlas on macOS

**Status:** Current macOS packaging runbook
**Last updated:** 2026-09-11

This is the executable deployment runbook for producing the Memory Atlas MVP as
a macOS application and disk image. The rationale and alternatives remain in
[`0002-macos-electron-packaging.md`](../architecture/decisions/0002-macos-electron-packaging.md).

The current workflow creates an architecture-specific, ad-hoc-signed local
testing build. It does not publish anything, upload photos, or modify source
photos.

## Prerequisites

- A Mac with Node.js 24.20.0 or later in the 24.x line and npm 11.19.0
- The Memory Atlas repository checked out locally
- Enough free disk space for Electron's bundled Chromium and the build output
- A network connection for clean dependency installation and npm's advisory
  lookup

Run every command below from the repository root, where `package.json` lives.

## Preferred automated release gate

Use the automated gate for a release candidate. Before running it, set the
intended version in `package.json` and `package-lock.json`, prepare the release
notes, review the source, and commit that release-candidate state. The default
gate requires a clean working tree so its source commit is unambiguous.

```bash
nvm use
npm run release:mac -- --allow-network-audit
```

The explicit option authorizes npm to receive the dependency metadata needed
for its two advisory lookups. It does not authorize dependency changes,
publishing, commits, tags, application installation, or access to photo files.

The gate performs these steps once, in order:

1. verify macOS, architecture, Node, npm, source commit, and Git cleanliness;
2. install exactly `package-lock.json` with `npm ci --no-audit --no-fund`,
   avoiding npm's redundant automatic audit output;
3. require zero production vulnerabilities and compare the complete audit with
   the reviewed residual-risk policy in `scripts/release-policy.json`;
4. run Svelte/TypeScript checks, automated tests, and the Vite build;
5. make the architecture-specific Electron application and DMG;
6. inspect the ASAR for the renderer, metadata worker, locally bundled MapLibre
   worker, and Electron entry files;
7. verify both the temporary app and the DMG-embedded app with deep/strict
   `codesign` checks;
8. verify the DMG, bundle versions, `io.github.chrwittm.memoryatlas` identity,
   exact custom icon bytes, Electron license resources, full dependency notices and MPL source parity,
   and executable architecture;
9. confirm that the source tree did not change during the build; and
10. calculate the DMG size and SHA-256 and generate release evidence.

Successful terminal output is intentionally compact. Full stdout and stderr for
every command, a machine-readable `release-report.json`, and a Markdown
`verification-draft.md` are written below:

```text
out/release/<version>-<architecture>-<timestamp>/
```

`out/` is ignored by Git. Review the draft, copy the relevant evidence into a
dated file under `docs/delivery/verifications/`, and complete the installed-app
check below before calling the release verified. Do not paste verbose build
logs into project documentation unless they explain a material failure.

The gate stops at the first failed step and prints the failing log path plus a
short tail of the output. Do not rerun it repeatedly when the failure is a new
security advisory or changed dependency baseline; open a separate dependency
review instead. The script never runs `npm audit fix`.

For an intentionally non-reproducible local experiment only, the clean-tree
check can be bypassed explicitly:

```bash
npm run release:mac -- --allow-network-audit --allow-dirty
```

The dirty paths are recorded in the report. Do not publish or tag such an
artifact.

The gate also refuses to overwrite a DMG with the same version and
architecture. Normally, preserve the existing artifact and choose the correct
new version. `--replace-artifact` exists only for an explicitly reviewed retry
of an unaccepted artifact; never use it to replace an artifact that was already
published or recorded as accepted.

## Test the current source in Electron

Use this short workflow to manually exercise the current working tree without
creating or installing a DMG. It is useful for focused UI checks during
development, but it is not a replacement for the independent packaged-app
smoke test below.

1. Build the current renderer and open it in Electron:

   ```bash
   npm run build
   ./node_modules/.bin/electron .
   ```

   The terminal remains occupied while the Electron window is open. Quit the
   app with Command-Q to return to the shell.

   `npm run desktop` performs the same production build before starting
   Electron Forge. On a OneDrive-backed checkout, Forge can fail or stall while
   reading a dependency with an `ETIMEDOUT` filesystem error. In that case, use
   the direct Electron command above. Keeping the checkout and `node_modules`
   available offline, or using a local non-synchronised working copy, prevents
   that OneDrive-specific failure.

2. Verify malformed-metadata resilience using the committed non-personal test
   assets. In the app, choose another folder and select `src/test/fixtures/`.
   It contains a malformed-XMP JPEG and a valid neighboring JPEG. Both photos
   should display and Arrow-key navigation should work.

   The malformed-XMP file is intentionally still a decodable JPEG. ExifReader
   currently recovers from its malformed XMP block, so no visible error is
   expected. The automated loader-rejection regression test covers the distinct
   `metadata-error` path.

3. Verify map and fullscreen Escape priority with a folder containing both a
   GPS-tagged photo and a photo without GPS. The ignored local
   `fixtures/photo-folders/test-cases/` folder can be used when present.

   - On a GPS photo, press `M` and confirm the map opens.
   - Press `F`, then press Escape once. Fullscreen exits and map mode remains
     open.
   - Press Escape again. Map mode closes.
   - Navigate to a photo without GPS while map mode is open and confirm the
     no-GPS placeholder appears instead of closing the map.

4. Verify zoom and pan with representative large JPEGs:

   - Zoom with a mouse wheel and trackpad over the photo; confirm the pointed-at
     detail remains stationary until an edge bound is reached.
   - Drag the enlarged photo to every edge and confirm no additional empty
     canvas appears and the cursor changes from `grab` to `grabbing` only while
     dragging.
   - With the photo focused, use `+`, `-`, all Arrow keys, and `Z`; confirm Left
     and Right Arrow navigate only after the photo returns to its fitted view.
   - Navigate away and back, open and resize the map, and enter fullscreen;
     confirm each photo's active view and focal detail are retained.

## Manual packaging and diagnostic fallback

The commands in this section expose the individual operations for diagnosing a
failed gate. They are not a substitute for `npm run release:mac`, because they
do not create the consolidated machine report or verification draft.

1. Install exactly the dependency versions recorded in `package-lock.json`:

   ```bash
   npm ci
   ```

2. Review both the shipped runtime tree and the complete build tree:

   ```bash
   npm run audit:prod
   npm run audit:all
   ```

   Follow the reachability and residual-risk policy in
   [`dependency-security.md`](dependency-security.md). A complete-tree advisory
   count is not ignored merely because the affected packages are build tools.

3. Run the release checks and create the macOS artifacts:

   ```bash
   npm run make:mac
   ```

   This command runs the Svelte and TypeScript checks, automated tests, Vite
   production build, Electron packaging, and Electron Forge DMG maker. Forge
   targets the architecture of the Mac running the command unless `--arch` is
   supplied explicitly. The automated release gate invokes the same underlying
   tools directly so that none of these checks is repeated.

4. Find the retained DMG under `out/`; Forge keeps the intermediate `.app` in
   `/private/tmp` so OneDrive cannot attach Finder metadata that invalidates its
   macOS signature:

   ```text
   out/make/Memory Atlas-<version>-<architecture>.dmg
   /private/tmp/memory-atlas-forge-out/Memory Atlas-darwin-<architecture>/Memory Atlas.app
   ```

   On an Apple silicon Mac, `<architecture>` is `arm64`. On an Intel Mac, it is
   `x64`. The temporary `.app` working copy may be removed by macOS and is
   recreated by the next build; the DMG is the durable installation artifact.

5. Strictly verify the exact temporary application before installing the DMG:

   ```bash
   codesign --verify --deep --strict --verbose=2 \
     "/private/tmp/memory-atlas-forge-out/Memory Atlas-darwin-<architecture>/Memory Atlas.app"
   codesign -dv --verbose=4 \
     "/private/tmp/memory-atlas-forge-out/Memory Atlas-darwin-<architecture>/Memory Atlas.app"
   ```

   The first command must exit successfully. The detail output should identify
   an ad-hoc signature for the local MVP workflow.

## Install the local testing build

1. Open the generated `.dmg` in Finder.
2. Drag **Memory Atlas** to the **Applications** shortcut in the disk image.
3. Eject the disk image.
4. Open **Memory Atlas** from Applications.

The MVP artifact has a local ad-hoc signature, not an Apple Developer ID
signature, and is not notarized. macOS may block its first launch or report that
it cannot verify the developer. For a build you created and trust, follow Apple’s
[unknown-developer instructions](https://support.apple.com/guide/mac-help/mh40616/mac):
after attempting launch, open **System Settings → Privacy & Security → Open Anyway**. Do not treat
this bypass as a public distribution method. Hardened Runtime is disabled only
for this local ad-hoc signature because it requires a consistent Apple Team ID
across Electron's nested frameworks.

## Verify the packaged MVP

Test the installed application without a Vite development server running:

- launch, quit, and relaunch it from Applications;
- select a folder and confirm that only top-level JPEG files are included;
- confirm natural file-name ordering, metadata progress, captions, capture time,
  image orientation, previous/next controls, `I`, `M`, `F`, and fullscreen exit;
- confirm mouse-wheel and trackpad zoom, pointer drag, grab/grabbing cursor feel,
  focused keyboard zoom and pan, named-view cycling, and per-photo restoration;
- navigate across readable and unreadable files without losing the collection;
- open map mode for a located photo and confirm the no-GPS placeholder for an
  unlocated photo;
- disconnect the network and confirm that photo viewing still works while map
  tiles fail gracefully;
- while offline, navigate far enough for an uncached map area to remain blank,
  reconnect the network, and record whether the missing tiles load without
  restarting the application—see
  [`MA-BUG-001`](../planning/known-issues.md#ma-bug-001-map-tiles-do-not-recover-after-an-offline-request);
- confirm that source photo checksums are unchanged after testing.

The packaged app loads only files embedded in the application. Selected photos
and extracted metadata remain local; opening the optional map contacts the
configured OpenFreeMap endpoints.

After the installed smoke test, record the app version, target architecture,
DMG SHA-256, signing/notarization state, source commit, audit result, and any
manual checks still outstanding. A build is not a reproducible checkpoint until
the recorded source state is committed. The automated gate's verification draft
provides these fields but deliberately leaves the manual result outstanding.

## Rebuild or target an architecture explicitly

`npm run make:mac` replaces artifacts with the same version and architecture.
The automated release gate refuses that replacement unless
`--replace-artifact` is explicitly supplied. Update `version` in `package.json`
before making a release that must coexist with an earlier build.

To request a specific architecture, pass the Forge argument after `--`:

```bash
npm run make:mac -- --arch=arm64
npm run make:mac -- --arch=x64
```

Cross-architecture output still needs testing on a compatible Mac. The MVP does
not currently create a universal binary.

## Publish a POC build on GitHub

Do not commit DMG files to the repository. For a public proof-of-concept build,
publish the DMG as a GitHub Release asset:

1. Build and verify the DMG with the steps above.
2. Compute a checksum:

   ```bash
   shasum -a 256 "out/make/Memory Atlas-<version>-<architecture>.dmg"
   ```

3. On GitHub, draft a release for a matching tag such as `v0.1.0`.
4. Mark it as a pre-release while the app is still ad-hoc signed and not
   notarized.
5. Upload the DMG in the release asset box.
6. Include the checksum, supported architecture, install notes, and notarization
   caveat in the release notes. Use
   [`.github/RELEASE_NOTES_TEMPLATE.md`](../../.github/RELEASE_NOTES_TEMPLATE.md)
   as the starting point.

Equivalent GitHub CLI shape, after replacing the version and file name:

```bash
gh release create v0.1.0 \
  "out/make/Memory Atlas-0.1.0-arm64.dmg" \
  --title "Memory Atlas 0.1.0 POC" \
  --notes-file RELEASE_NOTES.md \
  --prerelease
```

## Signed distribution to other Macs

Routine distribution to other people requires an Apple Developer ID Application
certificate and Apple notarization credentials. Configure Electron Packager's
`osxSign` and `osxNotarize` options with Hardened Runtime after those credentials
are available, then rebuild and verify with `codesign`, `spctl`, and `stapler`.
Those credentials and release operations are intentionally outside this
ad-hoc-signed local MVP workflow.

## Application artwork

The original atlas/compass icon and editable source are documented in
[`assets/icon/README.md`](../../assets/icon/README.md). Run `npm run icon:mac`
on macOS only when changing the artwork, then review and commit the generated
iconset and ICNS. The release gate rejects an unexpected bundle identifier or
icon. Check Finder, Dock, the application switcher, and the mounted DMG visually.

## Public tester publication

Source publication (Gate A), an explicitly unnotarized tester prerelease
(Gate B), and ordinary notarized distribution (Gate C) are distinct. Follow the
[publication plan](../delivery/plans/2026-09-04-publication-readiness.md).
Keep 0.2.0 local artifact records unchanged; the next binary is 0.2.1. Use the
Releases listing for prereleases because GitHub's `/releases/latest` excludes
prereleases. Never tag or upload before the installed-app checklist passes.

The Forge asset hook generates [dependency notices and MPL source materials](third-party-notices.md)
from the exact installed lockfile. These ship in `Contents/Resources/third-party`,
and the release gate verifies every generated file against the packaged bytes.
