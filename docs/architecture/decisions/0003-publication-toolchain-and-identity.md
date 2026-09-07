# 0003: Publication toolchain and application identity

**Status:** Accepted
**Date:** 2026-09-07

## Context

The Node 20 toolchain prevented updating Electron beyond the known runtime
advisories. Electron supports its latest three stable major lines; on this date
those are 42, 43, and 44. The first public tester artifact needs a supported
runtime and a stable identity while preserving the local 0.2.0 milestone.

## Decision

Use Node 24 LTS, minimum 24.20.0 and below 25, with npm 11.19.0. Pin `.nvmrc`
and CI to 24.20.0. Use Electron 42.11.2, the latest patch of the smallest
supported major, and retain stable Electron Forge 7.11.2. Review future patches
through the dependency policy; do not force overrides or adopt Forge prereleases.

Use `io.github.chrwittm.memoryatlas` as the macOS bundle identifier and the
original vector-drawn atlas/compass icon in `assets/icon/`. Generate its iconset
and ICNS with the checked-in Swift drawing and Apple's `iconutil`.

The new binary is version 0.2.1. Version 0.2.0 remains an immutable, unpublished
local milestone. The public tester prerelease is ad-hoc signed and unnotarized;
Developer ID signing and notarization remain Gate C, outside this release.

## Consequences

Contributors must activate the newer Node toolchain. Renderer architecture and
scope are unchanged. Node is needed for development and packaging, not to run
the self-contained application. Historical artifact records retain their old
identity, runtime, and checksums. Build-only residual advisories require a dated
review and exact release-policy update after installation.

## Sources

- [Electron support timeline](https://www.electronjs.org/docs/latest/tutorial/electron-timelines)
- [Electron stable releases](https://releases.electronjs.org/?channel=stable)
- [Node 24.20.0 archive](https://nodejs.org/en/download/archive/v24.20.0)
- [Electron Forge releases](https://github.com/electron/forge/releases)
