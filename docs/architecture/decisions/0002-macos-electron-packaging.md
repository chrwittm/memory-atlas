# Architecture Decision 0002: macOS Electron Packaging

**Status:** Electron desktop packaging accepted for MVP testing  
**Decision date:** 2026-07-06  
**Scope:** MVP distribution and repeatable testing

## Decision summary

Memory Atlas will be packaged as a self-contained **macOS desktop application
using Electron**. The existing Svelte, TypeScript, and Vite application remains
the user interface and application core; Electron supplies the desktop window,
bundled Chromium runtime, application lifecycle, and distributable artifacts.

The first packaging target is macOS only. Windows, Linux, phones, and tablets
are future platform decisions and are not part of this slice.

For the MVP, releases will be versioned `.app` and `.dmg` artifacts with manual
installation and updates. The packaged application must not depend on a hosted
Memory Atlas website or a locally running development server.

“Local” describes the application and photo-processing path: application code,
selected photos, and extracted metadata remain on the computer. The optional
map still requires an internet connection and sends tile requests for the
displayed area to the configured map provider.

## Goals

- Launch Memory Atlas from Finder, Applications, Spotlight, or the Dock.
- Require no VS Code, Terminal, Node.js, npm command, or web host at runtime.
- Create named, versioned builds that can be kept and tested independently.
- Allow a build to be copied to another compatible Mac.
- Preserve the existing browser-based application architecture where practical.
- Keep selected photos read-only and local to the user's machine.

## Options considered

### Vite development server

`npm run dev` remains the fastest development workflow. It provides live reload
and useful diagnostics, but it requires the source checkout, Node.js, npm, and a
running terminal process. It is not a deployment format.

### Local production preview

`npm run build` creates optimized static files in `dist/`, and Vite can serve
them locally for production-build verification. This is useful before packaging
but is not an installed application: a server process and Node.js are still
required, and Vite's preview server is not intended as a permanent runtime.

### Static HTTPS website

The Vite output can be deployed to ordinary static hosting. This is operationally
simple, easy to update, and usable from multiple desktop browsers. The photos
would still remain local because the user selects them through the browser.

This option was not selected for MVP testing because launching the application
would depend on a hosted origin and an internet connection unless additional
offline caching were introduced.

### Progressive Web App

A PWA would add an installable manifest, icons, and optional offline caching to
the hosted application. It could appear in the Dock and launch in a standalone
window while retaining web-based distribution and automatic updates.

This is a strong future publishing option, but it is not a fully independent
desktop installation: initial installation and normal update delivery originate
from HTTPS hosting, and installation behavior varies by browser. PWA work is
therefore deferred.

### Tauri desktop application

Tauri could package the same frontend into a much smaller application by using
the operating system's webview. Its size and native integration are attractive,
but the runtime differs between platforms. Folder selection, workers, MapLibre,
fullscreen, and file behavior would require additional platform-specific
validation and could require a native filesystem bridge.

Tauri remains a possible later optimization if Electron's footprint becomes a
demonstrated problem.

### Electron desktop application

Electron packages the frontend with Chromium. It produces a conventional
desktop application and closely matches the browser engine in which the current
MVP has been developed and tested. The tradeoffs are a larger artifact, higher
memory use than a system-webview wrapper, and responsibility for Electron
security updates.

Electron is accepted because compatibility and a short path to a stable local
MVP build matter more than package size at this stage.

## Accepted macOS architecture

```text
Memory Atlas.app
├── Electron main process
│   ├── application lifecycle
│   ├── native window
│   └── secure loading of packaged application files
├── bundled Chromium runtime
└── existing Vite production build
    ├── Svelte interface
    ├── folder input and File objects
    ├── metadata Web Worker and ExifReader
    ├── lazy local image URLs
    └── dynamically loaded MapLibre map
```

The renderer must remain browser-like and unprivileged:

- disable Node.js integration in the renderer;
- enable context isolation and renderer sandboxing;
- expose no native bridge unless a demonstrated requirement needs one;
- apply a restrictive Content Security Policy compatible with the configured
  map provider;
- navigate only to packaged Memory Atlas content;
- open external links, if any are introduced, outside the application; and
- continue treating selected source photos as read-only.

The first implementation should try the existing directory file input unchanged.
A native folder dialog or filesystem bridge should be added only if packaged
testing demonstrates that the browser input is insufficient.

## Packaging and release approach

Use Electron Forge to package the application while retaining Vite as the
frontend build tool. A release build should:

1. run the existing checks and tests;
2. create the Vite production build;
3. package that output with Electron;
4. produce a macOS `.app` for direct local testing;
5. produce a versioned `.dmg` for installation or transfer; and
6. record whether the artifact targets Apple silicon, Intel, or both.

Early builds may be unsigned for development on the originating Mac. Builds
intended for routine installation on other Macs should be signed and notarized
so Gatekeeper can verify and open them normally. Apple silicon and Intel builds
may initially be separate; a universal build can be considered when its added
size and build complexity are justified.

Automatic updates are deliberately deferred. MVP testers install a newer
versioned build manually, which avoids requiring an update server and makes it
easy to retain or return to a known build. Update infrastructure can be added
when distribution frequency and tester count demonstrate the need.

## Verification requirements

The packaged application must be tested independently from the Vite development
server. At minimum, verify:

- first launch and subsequent launch from Applications or the Dock;
- folder selection and top-level JPEG filtering;
- metadata worker loading, progress, and per-file failure isolation;
- file-name ordering, image decoding, and orientation;
- object-URL cleanup when navigating or choosing another folder;
- all keyboard controls, pointer controls, and fullscreen behavior;
- MapLibre loading and the no-GPS placeholder;
- understandable behavior without a network connection;
- application quit and relaunch;
- installation from the generated `.dmg`; and
- installation and launch on another compatible Mac before calling a build
  transferable.

Original photos must remain byte-for-byte unchanged throughout packaging tests.

## Deferred platform and distribution decisions

- Windows packaging and signing
- Linux packaging formats and desktop integration
- iPhone and iPad delivery
- Android delivery
- app-store distribution
- hosted web deployment
- PWA installation and offline caching
- automatic desktop updates
- persistent folder authorization across application launches

These are future product decisions, not promises implicit in the Electron
choice. The Svelte application should remain sufficiently separated from the
Electron shell to keep those options open.

## Next implementation slice

Build the smallest macOS Electron spike that loads the existing Vite production
output and proves folder selection, metadata scanning, photo display, keyboard
navigation, fullscreen, and the optional map in a packaged `.app`. Once that
vertical slice passes, add the `.dmg`, application icon, version metadata,
security hardening, and release documentation.
