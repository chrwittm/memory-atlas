# MA-FEAT-008/016 multi-photo and GPX map verification

**Date:** 2026-09-13

**Status:** Source and packaged 0.3.0 interaction verification complete

## Implemented outcome

The existing split map now has exactly three cumulative modes: **Current
photo**, **All photos**, and **Photos + GPX track**. `G` and one compact named
control advance the same cycle while `M` remains the open/close action.

The implementation adds:

- synchronized viewer and marker selection, including map-focused located-photo
  `Page Up` and `Page Down` navigation;
- clustered photo coordinates, deterministic exact-coordinate groups, and a
  selected pin that remains visible above neutral photo markers;
- one shared camera across all modes: layer changes preserve the viewpoint,
  while navigation or marker selection recenters at the established close zoom;
- locally parsed GPX 1.0 and 1.1 tracks with file, track, segment, and
  invalid-point gaps preserved; and
- compact mode, legend, missing-data, non-drawable-track, and unavailable-source
  feedback without adding marker popups or a separate map screen.

GPX and photo work share the existing bounded-concurrency worker lifecycle.
Failures remain per source, cancellation still terminates the worker, and the
folder reset releases normalized track geometry with the rest of the temporary
collection.

## Automated evidence

The following checks passed from the source tree with Node.js 24.20.0 and npm
11.19.0:

| Check | Result |
| --- | --- |
| `npm run check` | Passed with zero Svelte or TypeScript diagnostics |
| `vitest run` | 19 test files passed; 92 tests passed |
| `npm run build` | Production Vite build passed; map and metadata workers remained locally bundled |

Focused coverage exercises the mode order, wrapping and reset boundary;
modified, composing, closed-map, and repeated `G` handling; degraded and empty
states; two-way and map-focused selection; duplicate-coordinate cycling;
cluster expansion behavior; shared-camera continuity, universal photo following,
and layer order; GPX 1.0/1.1,
multiple tracks and segments, invalid-point gaps, one-point tracks, malformed
XML, mixed-source isolation, top-level filtering, progress, cancellation, and
cleanup.

### Browser map-container regression and fix

Initial local Chrome and Safari interaction exposed a CSS cascade regression:
after **Opening map…**, MapLibre's dynamically loaded `.maplibregl-map` rule
overrode the application container positioning and collapsed the renderer to
zero height. The surrounding mode UI remained visible, which made the panel
appear blank. The application now uses a more specific full-panel selector with
explicit width and height, and a focused source test protects that integration
boundary. Local browser verification after the fix confirmed the map container
fills the panel and the basemap, selected marker, controls, and attribution are
visible. This finding and resolution are recorded as MA-BUG-003.

The private `2026-06-20-Schlossherrenrunde` GPX source was read without
modification through the implemented parser. It produced one track, one segment,
and all 847 expected points, matching the pre-implementation source findings.
No private fixture was copied, served, uploaded, or committed.

## Packaged verification

The exact 0.3.0 artifact completed the deferred physical check with controlled
fixtures and the private photo/GPX collection. All three `G` modes, individual
and exact-coordinate group selection, GPX rendering below markers, camera
continuity, map-focused collection navigation, compact overlays, fullscreen,
split focus and resizing, folder replacement, and unchanged source hashes
passed. Two unpublished candidate defects found by this work were fixed and
rechecked before release. See the
[`0.3.0 verification`](2026-09-14-v0.3.0-publication.md).
