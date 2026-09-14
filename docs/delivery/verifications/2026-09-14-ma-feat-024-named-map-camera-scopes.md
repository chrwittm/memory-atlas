# MA-FEAT-024 named map-camera scope verification

**Date:** 2026-09-14

**Status:** Source and packaged 0.3.0 interaction verification complete

## Implemented outcome

The open map now separates content and camera choices explicitly. `G` retains
the implemented Current photo, All photos, and Photos + GPX track layer cycle.
Map-focused, non-repeating `Z` uses the short primary cycle Current photo, Day,
Complete track, and All photos, skipping stops the active mode cannot support.
The Zoom menu retains every available scope under Focus, Time, Place, and
Collection, including Surrounding seven days and the full geographic ladder.

`Shift+Z`, `Control+Z`, `Option+Z`, and `Command+Option+Z` directly select
Current photo, Day, Complete track, and All photos when available. Plain
`Command+Z`, unsupported mixed modifiers, composition, and repeat events remain
untouched. The binding follows the key labeled Z for the tested U.S. and German
layout event shapes, including the alternate character produced by Option.
Photo-focused `Z` and the divider are unchanged.

Stacked **GPS** and **Zoom** controls at the map's top-left persistently expose
the content mode and active camera scope. GPS retains its pointer cycle; Zoom
opens grouped direct selection and marks the active scope. Its label updates
when navigation switches to another geographic scope at the same level or
automatically falls back to Current photo.

Photo metadata normalization now preserves the recorded local calendar date
beside the existing display instant. Temporal scopes compare that date directly
and never infer membership from GPX timestamps. Duplicate fitted temporal
scopes are skipped, while All photos and Complete track remain semantically
separate. Camera fits use eight-percent viewport-relative base padding, clamped
to 28–72 horizontal and 36–72 vertical pixels, then expand affected edges to
clear measured persistent overlays with a 24-pixel feature-aware gutter. The close zoom cap
remains 15.

Manual pan or zoom and `G` do not change the last named-scope cursor. A located
photo selection preserves an applicable active scope and manual zoom: Current
photo follows the new pin without a zoom reset; temporal scopes refit when their
date context changes; geographic scopes remain fixed within their named area,
switch to an available destination scope at the same level, and otherwise fall
back to Current photo at the existing zoom; collection and track scopes remain
fixed. An
unlocated selection preserves the cursor and camera, and closing the map tears
down the retained renderer so reopening starts a fresh camera. The map remains
mounted behind a temporary mode-specific no-data placeholder when necessary,
preserving camera state across `G` without weakening the placeholder's
accessibility semantics.

Cluster expansion changes only the camera. Post-cluster marker selection now
uses the same scope-preserving rule as every other selection, removing the
earlier fixed-close-zoom reversal without introducing hidden cluster state.

Transient feedback is positioned by ownership: photo `Z` feedback is centered
at the bottom of the photo panel, map `Z` feedback at the bottom of the map
panel, and viewer-wide failures across the full viewer. Collection navigation
is universal across photo and map focus (`Page Up`/`Page Down` jump ten;
`Home`/`End` select first/last), while the divider uses Page keys for larger
ten-point split changes.

## Geographic catalog evidence

The source tree contains a generated 148-area catalog covering Germany and the
United States: two countries, 67 states/Bundesländer or equivalents, and 79
national parks. Runtime matching is local, validates malformed entries in
isolation, supports Polygon and MultiPolygon geometry with holes, and computes
containment and extents across the antimeridian without a reverse-geocoding or
boundary request.

`src/lib/geo/catalog.provenance.json` records the exact source URLs, retrieval
date, input hashes, feature selections, coordinate-axis transformation,
licenses, attribution, simplification tolerances, count, byte size, and output
SHA-256. The sources are Natural Earth vector 5.1.2 for countries and first-
order administrative areas, the NPS Land Resources Division service for U.S.
national parks, and the BfN Schutzgebiete WFS for German national parks.

The generated output is 3,221,695 bytes with SHA-256
`ed573540d50260ef7b08fb09554edb535c5d50fdc00845e05692084f0bcb607b`.
An automated integrity test binds those values to the committed asset and
checks deterministic generation, counts, identifiers, and simplification
parameters. Representative catalog tests resolve Lassen Volcanic National Park,
California, and the United States; Berlin and Germany; and Müritz-Nationalpark,
Mecklenburg-Western Pomerania, and Germany.

The U.S. ladder receives a derived **Contiguous United States** camera frame
before the complete country. Its extent is calculated from all packaged U.S.
state/equivalent extents except Alaska and Hawaii. The configuration can add
different intermediate frames for other countries without changing the catalog
schema or downloading new geometry at runtime.

Natural Earth is public-domain data. NPS attribution and non-survey guidance
are preserved. The BfN source is used under GeoNutzV with its source and
modification notice. `src/lib/geo/NOTICE.md` and the provenance record are
copied by the existing legal-material generator into
`Contents/Resources/third-party/geographic-data/` for packaged builds.

## Automated evidence

The repository's complete source-quality, test, and production-build gates pass
with Node.js 24.20.0 and npm 11.19.0. Focused coverage includes:

| Check | Result |
| --- | --- |
| `npm run check` | Passed with zero Svelte or TypeScript diagnostics |
| `npm test` | 23 test files passed; 111 tests passed |
| `npm run build` | Production Vite build passed; the map, catalog, and workers remain locally bundled |
| `node scripts/generate-third-party-notices.mjs` | Generated 43 component records, exact ExifReader source, and geographic-data notices |
| `node scripts/check-doc-links.mjs` | 47 Markdown files checked; zero local destination problems |

- the complete mode/scope matrix, stable order, unavailable scopes, and
  duplicate temporal fits;
- recorded-local-date boundaries and inclusive date-minus-three through
  date-plus-three behavior;
- labeled-Z primary-cycle, modifier, mixed-modifier, composition, repeat,
  focus, plain `Command+Z`, and `Command+Option+Z` handling;
- panel-scoped toasts, direct access, viewport fitting, `G` camera continuity,
  manual movement, preserved zoom, stable same-day views, changed-day refits,
  same-level geographic transitions, geographic-exit fallback, persistent
  GPS/Zoom state, grouped pointer selection, overlay-aware fit padding, photo
  selection, and map close/reopen lifecycle;
- deterministic geographic matching, overlapping independent categories,
  crossing parks, holes, multipolygons, malformed catalog isolation,
  antimeridian containment and fitting, the Contiguous United States extent,
  and real German/U.S. areas; and
- geographic asset integrity plus deterministic packaged legal materials.

## Packaged verification

The exact 0.3.0 artifact completed the consolidated physical check. The private
German collection exercised all `G` modes, the primary `Z` cycle on the host's
German keyboard layout, grouped Zoom-menu access, direct Baden-Württemberg and
Germany scopes, persistent GPS/Zoom state, scope-preserving Page navigation,
fullscreen, and split-region focus. Controlled fixtures covered located and
unlocated transitions plus grouped marker cycling. Automated release gates
bind U.S. and German catalog behavior, direct modifier variants, padding,
notices, and packaged asset integrity. See the
[`0.3.0 verification`](2026-09-14-v0.3.0-publication.md).
