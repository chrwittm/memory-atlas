# Known issues

## MA-001: Map tiles do not recover after an offline request

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
