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
notarized. After attempting launch, macOS may require **System Settings → Privacy &
Security → Open Anyway**. Follow [Apple’s instructions](https://support.apple.com/guide/mac-help/mh40616/mac).

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

## Third-party source and notices

The application includes dependency licenses and unmodified ExifReader MPL source
at `Memory Atlas.app/Contents/Resources/third-party`. Open
`SOURCE_AVAILABILITY.txt` there for exact source-location and licensing details.
