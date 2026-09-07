# Publication-readiness implementation verification

**Date:** 2026-09-07
**Status:** Source implementation verified; packaging and publication in progress

## Scope and authorization

The owner approved all steps of the publication plan, including history rewrite,
network audits, source import, and the unnotarized tester prerelease. Gate C
remains deferred by the accepted scope. Existing owner documentation changes
were preserved and incorporated into the release candidate.

## Source privacy

The 12 original local commits were rewritten to the approved GitHub noreply
identity, preserving names, timestamps, messages, parent structure, and trees.
A second approved cleanup removed EXIF/XMP, IPTC, and comment segments from the
historical Earth JPEG. Its compressed image scan and ICC color profile were
preserved; all other file trees and commit messages were unchanged. A recovery
bundle, working changes, private identity inventory, and both commit maps were
saved outside the repository before rewriting. No backup ref is configured for
publication. Historical verification documents retain their original commit IDs
and artifact facts; those IDs are historical provenance, not new release refs.

Current private photo directories, build outputs, dependencies, and Finder
metadata remain ignored. All three historically tracked image blobs were
reviewed; synthetic test JPEGs contain no private metadata. The current NASA
image has a verified source and no unrelated metadata. Gitleaks 8.30.1 found no
secrets in the rewritten local history. Targeted scans found no private corpus,
DMG, signing material, environment file, or home path in historical file content.

## Repository and assets

The remote was rechecked and fetched: public `chrwittm/memory-atlas`, default
branch `main`, sole commit `25c3ae3bc03c1cef22023f7007384be1884be694`, containing
only `LICENSE`. The local Apache-2.0 license matches its bytes. Repository URLs,
security-reporting instructions, runbook link, and README screenshot are prepared.
The screenshot contains only application UI and the provenance-cleared NASA image.

The application icon is original vector artwork with deterministic macOS
representations. The release gate checks exact icon bytes and bundle identifier
`io.github.chrwittm.memoryatlas`, and retains Electron license resources.

## Automated evidence

- Node 24.20.0, npm 11.19.0, Electron 42.11.2, Forge 7.11.2.
- Svelte/TypeScript: zero errors and warnings.
- Vitest: 14 files, 62 tests passed.
- Production audit: zero findings.
- Complete audit: 27 findings (3 low, 23 high, 1 critical), all remaining in
  reviewed Forge build-tool paths; no new leaf advisories.
- Local Markdown destination validation: passed.
- Vite production build: passed; known dynamically imported MapLibre size warning.

## Fullscreen candidate

Code inspection and a focused regression expose the old policy's unconditional
rejection of Electron's documented `fullscreen` permission. The candidate allows
only gesture-mediated fullscreen from the exact packaged main-frame URL; device,
automatic-fullscreen, subframe, and all unrelated permissions remain denied.
Tests cover both toggle directions from photo, folder button, divider, and map
toggle focus, rejected promises, and Escape priority.

Native automation could load synthetic JPEGs and toggle map mode, but subsequent
key and folder-picker actions behaved inconsistently, preventing trustworthy
installed fullscreen evidence. The original user report lacks an exact artifact
identity. MA-BUG-002 must remain open pending reliable installed-app checks.

## Outstanding publication gates

GitHub CLI has no authenticated account, and the in-app GitHub browser is signed
out. Remote settings, source push, hosted CI, tag, release, and upload verification
must be recorded only after they succeed. The installed-app checklist, including
fullscreen, map, zoom/pan, and icon surfaces, is still required before Gate B.
No public binary or completed gate is claimed by this source record.
