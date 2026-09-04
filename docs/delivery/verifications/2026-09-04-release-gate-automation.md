# macOS release-gate automation verification

**Verification date:** 2026-09-04

**Status:** Source and packaging paths verified; first clean release run pending

This record covers the introduction of the deterministic `release:mac` gate.
It does not represent a new Memory Atlas product release and does not replace
the immutable 0.2.0 packaged-build record.

## Automated checks

- `node --check scripts/release-mac.mjs`: passed.
- `npm run check`: passed with zero errors and zero warnings.
- `npm test`: passed, 13 files and 53 tests.
- `npm run build`: passed; the existing MapLibre chunk-size advisory remains.
- Release-helper coverage: six tests passed for option parsing, toolchain
  version comparison, audit normalization, accepted-baseline behavior,
  rejection of higher counts and new advisories, and verification-draft
  generation.
- Clean-source preflight: an intentionally dirty working tree stopped before
  dependency installation, audit submission, or packaging, and listed the
  changed paths.

## Packaging-path check

The lower-level `npm run make:mac -- --arch=arm64` path completed successfully
with the new shared policy configuration. The resulting diagnostic artifact:

- passed deep/strict signature verification in the temporary Forge output;
- passed `hdiutil verify`;
- contained `dist/index.html`, the hashed metadata worker,
  `electron/main.cjs`, and `electron/security.cjs` in its ASAR;
- excluded the new `scripts/` release tooling from the ASAR;
- reported bundle short and build versions `0.2.0`;
- contained a thin arm64 main executable; and
- mounted read-only, after which the embedded application independently passed
  deep/strict signature verification and the image detached successfully.

The regenerated 0.2.0 DMG was moved to ignored diagnostic output as
`out/release/automation-validation/Memory Atlas-0.2.0-arm64-automation-validation.dmg`
with SHA-256
`34eaf88d59f386a9a499cc82083eed0a363d3c2202b1db5187f3f6094e9d4923`.
It is not a release artifact and must not be published or substituted for the
previously recorded 0.2.0 DMG.

## Intentionally pending

The complete release command was not run through live npm audits because this
change is not a new release candidate, the working tree is intentionally dirty,
and an audit submits dependency metadata to npm. The first future release will
exercise the full command from its clean release-candidate commit with explicit
`--allow-network-audit` authorization. The lower-level package, ASAR, signature,
DMG, version, and architecture operations used by that command passed
independently here.

No app was installed or launched, no private photo corpus was read, and no
commit, tag, push, or publication was performed.
