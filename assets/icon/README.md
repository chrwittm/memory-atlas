# Memory Atlas application icon

Original atlas/compass artwork created for Memory Atlas on 2026-09-07 and
licensed with the project under Apache-2.0. It uses geometric shapes only;
there is no NASA imagery, insignia, stock artwork, or third-party font.

The editable vector source is
[`scripts/generate-icon.swift`](../../scripts/generate-icon.swift), using macOS
AppKit paths. From the repository root on macOS, run `npm run icon:mac` to
render the ten standard 16–1024-pixel PNG representations and assemble
`MemoryAtlas.icns` with Apple's `iconutil`. The same macOS/AppKit version
produces identical bytes. Commit the generated files so building the application
does not require Swift or an artwork download.

Electron Forge embeds the ICNS, and the release gate compares the packaged icon
byte-for-byte with this source artifact. Finder, Dock, application switcher, and
DMG appearance still require a visual check of the final installed artifact.
