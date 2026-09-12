# MA-FEAT-002/015/018 desktop keyboard-navigation verification

**Verification date:** 2026-09-12

**Status:** Source implementation and user interaction verified; next packaged build deferred

## Implemented outcome

The viewer now uses a circular spatial focus loop containing the photo and, when
visible, the divider and map. Fading viewer controls and embedded MapLibre
controls stay pointer-operable but do not add sequential focus stops. The photo
region supports ten-position `Page Up`/`Page Down` jumps and first/last
`Home`/`End` navigation at every zoom scale. Global `H` leaves fullscreen when
needed, closes the collection, releases viewer resources, and focuses the entry
screen's primary folder action.

Normal viewer focus has no colored perimeter treatment. The divider retains a
quiet local handle cue, and focus suppression is limited to
`forced-colors: none` so operating-system high-contrast treatment remains
available.

## Automated evidence

The following commands passed with Node.js 24.20.0 and npm 11.19.0:

```text
npm run check
npm test -- --reporter=dot
npm run build
```

Results:

- Svelte/TypeScript: 0 errors and 0 warnings;
- Vitest: 17 files and 76 tests passed;
- Vite production build: 125 modules transformed and all application, metadata
  worker, MapLibre, and local MapLibre worker assets emitted successfully;
- focused coverage includes forward and reverse focus wrapping, the narrow
  stacked loop, map open/close focus recovery, excluded controls, MapLibre
  keyboard commands, quick-jump repeat and clamping, divider dispatch,
  per-photo view restoration, shortcut modifier rejection, one-press fullscreen
  return, object-URL cleanup, entry focus, and focus-appearance selectors.

## User verification and packaging decision

Christian reported successful testing of the complete interaction change on
2026-09-12. This confirms the quick-navigation keys, both focus-loop directions,
region-specific keyboard behavior, one-step return to folder selection, and
quiet viewer focus treatment in the tested source state.

No new `.app` or `.dmg` was produced, by explicit decision. More features will
be implemented before the next consolidated macOS build. When that build is
made, repeat the expanded checklist in
[`docs/operations/macos-packaging.md`](../../operations/macos-packaging.md) so
the exact packaged artifact receives the same physical keyboard and focus
coverage before release.
