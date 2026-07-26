# Deploy Memory Atlas on macOS

This is the executable deployment runbook for producing the Memory Atlas MVP as
a macOS application and disk image. The rationale and alternatives remain in
[`product/deployment-options.md`](product/deployment-options.md).

The current workflow creates an architecture-specific, ad-hoc-signed local
testing build. It does not publish anything, upload photos, or modify source
photos.

## Prerequisites

- A Mac with Node.js 20 or newer and npm installed
- The Memory Atlas repository checked out locally
- Dependencies installed with `npm install`
- Enough free disk space for Electron's bundled Chromium and the build output

Run every command below from the repository root, where `package.json` lives.

## Create the application and DMG

1. Install exactly the dependency versions recorded in `package-lock.json`:

   ```bash
   npm ci
   ```

2. Run the release checks and create the macOS artifacts:

   ```bash
   npm run make:mac
   ```

   This command runs the Svelte and TypeScript checks, automated tests, Vite
   production build, Electron packaging, and Electron Forge DMG maker. Forge
   targets the architecture of the Mac running the command unless `--arch` is
   supplied explicitly.

3. Find the retained DMG under `out/`; Forge keeps the intermediate `.app` in
   `/private/tmp` so OneDrive cannot attach Finder metadata that invalidates its
   macOS signature:

   ```text
   out/make/Memory Atlas-<version>-<architecture>.dmg
   /private/tmp/memory-atlas-forge-out/Memory Atlas-darwin-<architecture>/Memory Atlas.app
   ```

   On an Apple silicon Mac, `<architecture>` is `arm64`. On an Intel Mac, it is
   `x64`. The temporary `.app` working copy may be removed by macOS and is
   recreated by the next build; the DMG is the durable installation artifact.

## Install the local testing build

1. Open the generated `.dmg` in Finder.
2. Drag **Memory Atlas** to the **Applications** shortcut in the disk image.
3. Eject the disk image.
4. Open **Memory Atlas** from Applications.

The MVP artifact has a local ad-hoc signature, not an Apple Developer ID
signature, and is not notarized. macOS may block its first launch or report that
it cannot verify the developer. For a build you created and trust, Control-click
the application in Finder, choose **Open**, and confirm **Open**. Do not treat
this bypass as a public distribution method. Hardened Runtime is disabled only
for this local ad-hoc signature because it requires a consistent Apple Team ID
across Electron's nested frameworks.

## Verify the packaged MVP

Test the installed application without a Vite development server running:

- launch, quit, and relaunch it from Applications;
- select a folder and confirm that only top-level JPEG files are included;
- confirm natural file-name ordering, metadata progress, captions, capture time,
  image orientation, previous/next controls, `I`, `M`, `F`, and fullscreen exit;
- navigate across readable and unreadable files without losing the collection;
- open map mode for a located photo and confirm the no-GPS placeholder for an
  unlocated photo;
- disconnect the network and confirm that photo viewing still works while map
  tiles fail gracefully; and
- confirm that source photo checksums are unchanged after testing.

The packaged app loads only files embedded in the application. Selected photos
and extracted metadata remain local; opening the optional map contacts the
configured OpenFreeMap endpoints.

## Rebuild or target an architecture explicitly

`npm run make:mac` replaces artifacts with the same version and architecture.
Update `version` in `package.json` before making a release that must coexist with
an earlier build.

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
   [`.github/RELEASE_NOTES_TEMPLATE.md`](../.github/RELEASE_NOTES_TEMPLATE.md)
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
