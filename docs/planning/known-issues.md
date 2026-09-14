# Known issues

**Status:** Living issue register
**Last updated:** 2026-09-14

## MA-BUG-005: Selected grouped marker cycles twice on one click

**Status:** Resolved and verified in packaged 0.3.0 on 2026-09-14

**Severity:** High

### Behavior and cause

During the 0.3.0 installed-candidate check, clicking the selected marker for two
photos at the same coordinates could leave the same photo selected. The marker
button's click bubbled into MapLibre's coincident photo-point layer, so both
handlers advanced the deterministic group and a two-photo group returned to its
starting member.

### Resolution and verification

The selected marker now stops that handled click from reaching the underlying
map layer before advancing once. A regression test requires one selection and
no parent click. The exact replacement 0.3.0 DMG advanced the photo counter
`2 / 4` → `4 / 4` → `2 / 4` across two marker clicks.

## MA-BUG-004: Map opened without GPS stays blank after navigating to GPS

**Status:** Resolved and verified in packaged 0.3.0 on 2026-09-14

**Severity:** High

### Behavior and cause

During the 0.3.0 installed-candidate check, opening the map on a photo without
GPS correctly showed the placeholder, but navigating to the next located photo
left the map panel blank. Closing and reopening the map on that photo started
the renderer successfully.

The viewer deliberately deferred loading MapLibre while the active mode had no
renderable data. It started the renderer when the map opened with data or when
`G` changed to a mode with data, but omitted the equivalent transition after a
photo change. Earlier coverage began on a located photo, so its renderer was
already running before navigation crossed the no-GPS state.

### Resolution and verification

Photo navigation now explicitly starts the deferred renderer whenever the open
map's active mode gains renderable data. A regression test opens the map on an
unlocated photo, confirms that MapLibre remains deferred, navigates to a located
photo, and requires the renderer and Current photo camera scope to initialize.
The exact replacement 0.3.0 DMG repeated the observed transition: the
placeholder was visible on the unlocated photo and the renderer, tile layer,
selected marker, attribution, and Current photo scope initialized immediately
after navigation to the located photo.

## MA-BUG-003: Map panel collapses after the multi-photo map implementation

**Status:** Resolved and verified in packaged 0.3.0 on 2026-09-14

**Severity:** High

### Behavior and cause

After MA-FEAT-008/016, opening a map briefly showed **Opening map…** and then
left the split panel blank in Chrome and Safari. The mode control and legend
remained available because the map initialized successfully, but the MapLibre
canvas, marker, navigation controls, and tiles were not visible.

The feature change replaced the map container's inline dimensions with the
application's `.map-canvas` rule. MapLibre's dynamically imported stylesheet
then loaded its equally specific `.maplibregl-map { position: relative }` rule
later in the cascade. That changed the empty container from absolute to relative
positioning and collapsed its rendered height to zero.

### Resolution and verification

The application now sizes the renderer through the more specific
`.map-panel > .map-canvas` selector and explicitly retains both full width and
height. A source regression test protects the cascade boundary. Local browser
production-preview verification confirmed a non-zero full-panel map container
and visible basemap, marker, controls, and attribution across the three-mode
cycle. The exact packaged 0.3.0 app repeated that check with visible tiles,
marker, controls, attribution, and GPX geometry throughout the three-mode
cycle.

## MA-BUG-001: Map tiles do not recover after an offline request

**Status:** Deferred after Slice B

**Severity:** Low

**Affected installed app:** Memory Atlas 0.1.0 arm64, CDHash
`5b807610e22167364bebb0c38f0bb0c81b4fa99b`

**Observed DMG:** SHA-256
`4e364ac26dc1a3b411b0d5d6c62d8e384115c50db77cb541001914a428545fbe`

The post-audit DMG has the same installed-app CDHash, so its runtime behavior is
equivalent even though dependency-lock remediation changed the disk-image
checksum.

### Behavior

If map mode is already open, disconnecting every network connection and then
navigating to photos whose map areas are not cached leaves blank regions in the
map. Reconnecting the network does not fill those regions. Selecting the folder
again also did not recover them in the reported test. Quitting and restarting
Memory Atlas restores map loading.

Photo viewing, metadata, and original files are unaffected. The map is the
MVP's optional network-dependent feature, so the current workaround is to
restart the application after connectivity returns.

### Reproduction

1. Open a folder containing several geotagged photos in different map areas.
2. Open map mode and allow the first photo's map to load.
3. Disconnect Wi-Fi and any wired network connection.
4. Navigate until MapLibre requests an uncached area and renders blank regions.
5. Restore the network connection and continue navigating.

Expected: failed tile requests are retried and the blank regions fill.

Actual: the blank regions remain until the application is restarted.

### Investigation so far

MapLibre marks failed requests as errored tiles. Slice B added a renderer
`online` listener that calls MapLibre's public `refreshTiles` API for every
active source. A mocked component test proves that the event is wired to those
API calls and that the listener is cleaned up, but a second installed-DMG test
proved that this is not sufficient in the real Electron runtime.

[Electron documents online/offline detection](https://www.electronjs.org/docs/latest/tutorial/online-offline-events/)
as heuristic: an online result does not guarantee that a particular internet
endpoint is reachable. The renderer event may therefore be absent or may occur
before OpenFreeMap requests can succeed. A one-shot refresh is not a reliable
recovery strategy.

### Follow-up acceptance path

A later investigation should use the packaged application with Chromium
metadata-only network logging and explicit timestamps for:

- renderer `online` and `offline` events;
- MapLibre tile error events;
- requests to the configured OpenFreeMap style and tile hosts; and
- successful responses after the network is restored.

Based on that evidence, implement either a bounded delayed retry that verifies
provider reachability, or a visible **Retry map** action that recreates the map
after reachability is confirmed. The issue is resolved only after the original
physical disconnect/reconnect sequence passes in an installed DMG; a mocked
event-to-method test is not sufficient.

## MA-BUG-002: `F` does not toggle fullscreen during normal viewer use

**Status:** Resolved in the 0.2.1 candidate; owner verified installed behavior on 2026-09-08

**Severity:** Medium

**Affected build:** Observed during the first real trip-viewing session; exact
application version, build hash, viewer state, and focused element were not
recorded.

### Behavior

Pressing `F` in the main viewer did not toggle fullscreen as documented. This
blocks the keyboard path into and out of the intended presentation mode, while
photo viewing otherwise remains usable.

### Reproduction to confirm

1. Open a representative photo folder in the packaged application.
2. In the full-width photo view, press `F` and observe whether the app enters
   fullscreen.
3. If it enters, press `F` again and confirm that it exits.
4. Repeat with the map open and with focus on each visible interaction region.
5. Repeat in the Vite development build and production preview to determine
   whether the failure is specific to Electron packaging.

Expected: `F` enters fullscreen from the viewer and a second `F` exits it;
standard `Escape` behavior continues to exit fullscreen.

Actual in the reported session: the `F` toggle did not work.

### Investigation and resolution path

Record the exact packaged build and macOS version, then inspect keyboard-event
dispatch, focused-element handling, Fullscreen API promise rejection, and any
Electron-specific fullscreen behavior. Test both key directions rather than
assuming one failed path explains the other.

The issue is resolved when focused regression tests cover the viewer's keyboard
dispatch and `F` reliably enters and exits fullscreen in an installed macOS
build with both the full-width photo and split map layouts.

### 2026-09-07 candidate fix

Electron's unconditional permission denial also rejected its documented
`fullscreen` permission. The 0.2.1 candidate permits only gesture-mediated
fullscreen requests from the exact packaged main-frame URL. Other permissions,
subframes, and automatic fullscreen remain denied. Regression tests cover both
directions from the photo, folder button, map toggle, and split divider, plus
rejection feedback and Escape priority. Native automation did not provide
reliable installed-app evidence, so this issue remains open. See the
[publication verification](../delivery/verifications/2026-09-07-publication-readiness.md).

### 2026-09-08 installed verification

The owner confirmed the installed 0.2.1 candidate opens the entry screen and a
JPEG folder, enters and exits fullscreen with `F` in both photo-only and split-map
layouts, and lets Escape exit fullscreen before closing the map. This resolves
the reported fullscreen failure. The tested artifact's source is
`acc9eeeeadda516a05a2146c8a99480b2065879a`; see the
[candidate record](../delivery/verifications/2026-09-08-v0.2.1-candidate.md).
A packaging-only rebuild will add dependency notices and source materials before
publication; its runtime equivalence and final artifact checks are separate.
