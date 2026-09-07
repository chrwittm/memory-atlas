# Known issues

**Status:** Living issue register
**Last updated:** 2026-09-07

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

**Status:** Candidate permission fix implemented; installed verification pending

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
