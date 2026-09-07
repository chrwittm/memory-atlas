# Memory Atlas <version> — unnotarized tester prerelease

## Download

- Apple silicon: `Memory Atlas-<version>-arm64.dmg`
- macOS / Apple silicon only unless another architecture has independent evidence.

## Install

1. Download the DMG for your Mac architecture.
2. Open the DMG.
3. Drag **Memory Atlas** to **Applications**.
4. Launch **Memory Atlas** and choose a local JPEG folder.

This proof-of-concept build is ad-hoc signed and not Apple Developer ID
notarized. macOS may ask you to Control-click the app in Finder and choose
**Open** the first time.

## Checksums

```text
<sha256>  Memory Atlas-<version>-<architecture>.dmg
```

## Scope

- macOS local-first desktop POC
- JPEG folder browsing
- Embedded captions and capture time
- Optional map view for geotagged photos
- No uploads, accounts, cloud sync, or source-photo modification

## Known limitations

- JPEG only
- Top-level folder files only
- No automatic updates
- No Developer ID notarization yet

## Verification

- Source commit: `<full commit>`
- Automated release gate and installed-app checklist: `<evidence link>`
- Signing: ad hoc; no Developer ID, no notarization or stapled ticket.
- Verify the uploaded DMG by downloading it again and comparing SHA-256.
