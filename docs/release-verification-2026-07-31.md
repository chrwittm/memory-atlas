# Slice B packaged-build verification

**Verification date:** 2026-07-31

**Status:** Verified baseline with one deferred low-severity known issue

**Source base:** `44c04c9` plus the uncommitted Slice B working tree

**Host:** macOS 26.5.2, Apple silicon (`arm64`)

**Toolchain:** Node 20.18.0, npm 10.9.0

This record covers the exact local artifact built during Slice B. It is not a
published release and will not be a reproducible source checkpoint until the
Slice B source is reviewed and committed.

## Automated source and packaging gates

- Clean `npm ci` from `package-lock.json`: passed.
- `npm run audit:prod`: passed with zero vulnerabilities.
- `npm run audit:all`: completed with 31 development/packaging-tree
  vulnerabilities (3 low, 27 high, 1 critical), all currently without a
  compatible fix after non-force remediation.
- `npm run check`: passed with zero errors and zero warnings.
- `npm test`: passed, 11 files and 36 tests.
- Map reconnect handler wiring: passed; the mocked component test confirms that
  an `online` event calls MapLibre for every source and that teardown removes
  the listener. It does not simulate usable network reachability.
- `npm run build`: passed; the metadata worker was emitted as a separate
  production asset.
- `npm run make:mac`: passed from the configured `/private/tmp` Forge output.
- Packaged ASAR inspection: contains `dist/index.html`, the emitted metadata
  worker, `electron/main.cjs`, and `electron/security.cjs`.

`npm audit fix` without `--force` updated seven transitive package instances,
including the available fixes for `fast-uri` and `postcss`. The residual
`brace-expansion`, `tar`, and `tmp` paths are build-time-only, with exposure,
ownership, and stable-upstream update triggers recorded in
[`dependency-security.md`](dependency-security.md).

## Artifact identity

| Property | Verified value |
| --- | --- |
| Application version | `0.1.0` |
| Architecture | `arm64` |
| Artifact | `out/make/Memory Atlas-0.1.0-arm64.dmg` |
| Size | 114,438,974 bytes |
| SHA-256 | `dc40052cb3f581d0c7c001770965d85916ab361b152eca76b9ba228b4aa74074` |
| Bundle identifier | `com.memoryatlas.app` |
| App CDHash | `5b807610e22167364bebb0c38f0bb0c81b4fa99b` |
| Signing | Ad hoc; deep/strict verification passed |
| Team identifier | Not set |
| Notarization | Not notarized |

The exact temporary `.app` and the app mounted read-only from the replacement
DMG both passed:

```bash
codesign --verify --deep --strict --verbose=2 "Memory Atlas.app"
```

The disk image itself passed `hdiutil` checksum verification while mounting
read-only. Its ASAR contains the production renderer, metadata worker, Electron
security module, and the reconnect-refresh implementation.

## Independent packaged smoke test

Before the reconnect defect was reported, the first Slice B DMG was mounted
read-only and its application copied to an isolated `/private/tmp` install
directory. The copy was launched without a Vite development server or project
Node runtime.

Using only the committed, non-personal `src/test/fixtures/` folder:

- the renderer loaded from `app.asar/dist/index.html` through `file://`;
- the native directory input opened and selected the folder;
- the packaged metadata worker completed and produced a two-photo collection;
- both generated JPEG fixtures displayed and Arrow-key navigation worked;
- map mode stayed open and showed the intentional no-GPS placeholder;
- **Choose another folder** returned to the entry screen;
- quit and relaunch returned to a fresh entry screen; and
- `F` entered presentation fullscreen and `Escape` returned from it.

This proved the relative renderer assets and metadata worker load independently
of Vite. The replacement DMG retains those verified assets and passed the fresh
build, signature, checksum, ASAR-content, and automated regression gates above.
No private fixture folder was opened, served, uploaded, or modified.

## Manual result and deferred issue

The user completed the broader installed-app experience checks with the first
Slice B DMG and reported that they passed. That testing exposed one map recovery
gap: tiles requested while fully offline remained blank after reconnecting until
the application restarted.

The follow-up source fix explicitly refreshes every active MapLibre tile source
when the renderer receives the browser's `online` event. Its component regression
test verifies both the refresh and listener cleanup. The artifact identity above
is the replacement build containing that change.

The user then installed the replacement DMG and repeated the physical
disconnect/reconnect sequence. The blank tiles still did not recover. The mocked
test therefore demonstrated handler wiring but did not demonstrate the real
outcome. The issue is deferred as
[`MA-001`](known-issues.md#ma-001-map-tiles-do-not-recover-after-an-offline-request),
with application restart as the current workaround and a packaged-runtime
investigation plan recorded there.
