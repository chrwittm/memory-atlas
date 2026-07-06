# MVP Technology Stack

**Status:** Accepted  
**Decision date:** 2026-07-05  
**Last updated:** 2026-07-06  
**Scope:** Memory Atlas MVP

## Decision summary

Memory Atlas will retain a browser-native application core and package it as a
self-contained macOS desktop application built with:

- **Svelte** for the user interface and reactive state
- **TypeScript** for application code and data contracts
- **Vite** for local development and production builds
- **Plain CSS** for the visual design
- **MapLibre GL JS** for the interactive map
- **ExifReader** for extracting EXIF/TIFF, IPTC, and XMP metadata from images
- **A Web Worker** for metadata scanning outside the UI thread
- **Electron** with bundled Chromium for the self-contained macOS application
- **Electron Forge** for versioned `.app` and `.dmg` packaging

The Svelte application remains browser-native internally, but the accepted MVP
testing and local distribution format is a macOS Electron package. The selected
folder, its image file names, and the metadata embedded in those
images are the MVP's source of truth. There will be no database, backend, cloud
storage, or browser persistence layer in the initial version. Optional Markdown
files may later add human-authored context that cannot be derived from an image,
but a Markdown system is not part of the initial stack.

## Guiding principle

The stack follows the principle that the best part is no part: every dependency
must solve an actual problem, save meaningful implementation effort, or reduce a
material risk.

At the same time, the project should not reimplement difficult, well-solved
problems merely to minimize the dependency count. The objective is a small and
understandable system that lets us reach the MVP quickly and iterate from there.

"Scalable" currently means easy to change and extend. It does not mean building
infrastructure for hypothetical traffic, accounts, editing, or synchronization.

### Filesystem-first authoring

Prefer explicit, portable artifacts that people can inspect and change with
ordinary file and metadata tools over hidden application-owned state. For the
MVP, the file name controls presentation order, while embedded properties supply
capture time, caption, location, and other context. Memory Atlas reads and
presents these artifacts; it does not duplicate them in a management layer.

This is a source model, not a claim that a folder is the lasting domain model or
a live application backend. The browser receives a snapshot of user-selected
files, and the broader product may eventually connect memories across folders
and media types. New storage or editing layers should be introduced only when a
real requirement cannot be expressed cleanly through the source artifacts.

## Runtime target and folder access

The current distribution target is macOS through Electron's bundled Chromium.
This produces a self-contained application that does not require a hosted
origin, Node.js installation, or local Vite server at runtime. The browser build
remains useful during development and keeps future static publishing possible,
but cross-browser distribution is no longer the current packaging target.

Windows, Linux, phone, and tablet runtimes are deferred. Electron's presence
must be kept at the application boundary so these future choices do not require
rewriting the Svelte UI or normalized photo model.

Folder selection will initially retain the existing file input with the
`webkitdirectory` and `multiple` attributes. The packaged spike must validate
this path in Electron before a native dialog or privileged filesystem bridge is
considered.

The browser returns files from the folder and its descendants. The ingestion
layer must inspect each file's `webkitRelativePath` and retain only `.jpg` and
`.jpeg` files directly inside the selected folder. This enforces the MVP's
non-recursive scan without relying on build tooling or a server.

`showDirectoryPicker()` may later be used as a progressive enhancement. During
browser development the application must still be served from localhost. The
packaged application must load its bundled production assets through a secure
Electron-compatible local mechanism; asking the user to open `dist/index.html`
directly remains unsupported.

Presentation fullscreen uses the standard browser Fullscreen API on the viewer
element. It is triggered only by the user's `F` key gesture, uses `F` as a
toggle, preserves the browser's standard `Escape` exit behavior, and handles
unsupported or rejected requests without disrupting the viewer.

## Why each part exists

### Svelte

The interface contains several synchronized views. Selecting a photo can affect
the gallery, map marker, map position, and memory detail at the same time. Svelte
provides components and reactive updates so this synchronization does not have
to be implemented through manual DOM manipulation and event wiring.

Svelte was chosen over React for this MVP because its component format stays
close to ordinary HTML, CSS, and JavaScript and requires fewer surrounding
patterns and library decisions. It gives the project useful structure without
requiring a larger application framework.

Svelte is an implementation accelerator rather than a technical browser
requirement. Its inclusion is justified by the already-interconnected nature of
the map and gallery interface and by the expectation that the UI will evolve.

### TypeScript

The core data contains optional and error-prone values such as capture dates,
GPS coordinates, image dimensions, and EXIF fields. TypeScript defines these
shapes explicitly and catches mismatches during development.

TypeScript has no runtime cost in the browser because its type annotations are
removed during the build. The project will use straightforward TypeScript—plain
types and interfaces, without elaborate type-level abstractions.

### Vite

Vite provides the small amount of tooling a browser project of this kind needs:

- a fast local development server;
- automatic browser refresh during development;
- Svelte and TypeScript compilation;
- a production build consisting of static web files.

Without Vite or an equivalent tool, the project would need custom machinery for
these tasks. Vite does not discover user-selected photo folders: its asset and
glob-import features operate on files known during development and build. Runtime
folder discovery belongs to the browser ingestion layer described above.

### Plain CSS

The MVP will use handcrafted CSS with a small set of shared design variables for
color, spacing, typography, and shape. This is enough to create a polished,
consistent interface without adding a utility framework or component library.

Tailwind CSS is intentionally excluded. It may speed up some forms of styling,
but the MVP does not currently need the additional conventions and build-time
vocabulary. Plain CSS also keeps the visual language specific to Memory Atlas
rather than encouraging a generic application-dashboard appearance.

The desktop photo-and-map view uses a CSS Grid split with a pointer-driven,
keyboard-accessible divider. It starts at 80/20, is constrained to 20/80–80/20,
and notifies MapLibre of container resizes so the map canvas follows the divider.
Map-mode state is independent of whether the current photo has GPS: an unlocated
photo keeps the grid open with a lightweight placeholder, without initializing
MapLibre, and the map returns automatically for the next located photo.

### MapLibre GL JS

MapLibre supplies the genuinely complex map functionality: rendering map tiles,
zooming, panning, markers, layers, gestures, and future clustering. Rebuilding
that functionality would be costly and produce a worse result.

MapLibre is open-source, browser-native, and not tied to one commercial map-tile
provider. The tile provider and visual map style should remain configuration
choices so they can change without replacing the map integration.

MapLibre and its CSS should be dynamically imported when the map is first
opened. Folders without geotagged photos should not pay its startup, network, or
WebGL initialization cost. The OpenFreeMap style URL belongs in one configuration
module and no application behavior may depend on provider-specific APIs.

### Metadata reader: ExifReader

Photo metadata is not limited to EXIF. Capture time, GPS coordinates, dimensions,
and orientation are commonly stored in EXIF/TIFF, while captions, keywords, and
people-region data may be stored in IPTC or XMP. The MVP will use ExifReader
because it is browser-compatible, typed, configurable, and supports all three
metadata families for JPEG files.

The first implementation slice must test ExifReader against representative
photos from the actual collection. The primary local corpus is
`fixtures/photo-folders/2026-06-20-Schlossherrenrunde/`. At minimum, the test
corpus should exercise:

- capture time and orientation;
- GPS latitude and longitude;
- captions or descriptions from the metadata sources actually present;
- keywords or tags; and
- people tags or named regions, when representative files contain them.

The first corpus inspection found capture times and dimensions on all 24 files,
plus XMP titles on two files. It did not contain GPS, keyword, or people-region
examples. Normalization therefore uses XMP/IPTC descriptions and EXIF image
description before falling back to XMP/IPTC title for the visible caption;
controlled tests cover GPS validation until another representative corpus
supplies real geotagged examples.

The ingestion layer should request only the required metadata groups and allow
the library to read metadata-bearing file ranges rather than loading entire JPEGs
into memory. If the representative corpus exposes an important unsupported field,
the decision should be revisited before building a custom parser. A local
ExifTool-based service is the fallback only if browser extraction proves
materially insufficient; it is not part of the accepted MVP stack.

### Background ingestion

Scanning is application infrastructure, not UI-component behavior. A dedicated
ingestion module running in a Web Worker will receive the selected `File` objects,
filter and parse them with bounded concurrency, normalize the results, and emit
progress and per-file outcomes. Svelte components consume those outcomes but do
not inspect file paths or parse metadata themselves.

Scanning happens once per folder selection. Because the MVP deliberately has no
persistence, selecting the folder again after a page reload performs a new scan.
That tradeoff is acceptable for the MVP and should be measured with realistic
folder sizes before adding an index or browser storage.

### Electron and Electron Forge

Electron provides the macOS application window and a bundled Chromium runtime
for the existing Vite output. Bundling the engine costs more disk space and
memory than a system-webview wrapper, but it reduces behavior differences for
the folder input, Web Worker, Fullscreen API, object URLs, image decoding, and
MapLibre paths already implemented for the browser.

Electron Forge will produce the `.app` and `.dmg` artifacts. The renderer must
run without Node.js integration, with context isolation and sandboxing enabled,
and without a native preload bridge unless a concrete requirement demonstrates
one is necessary. Navigation must remain inside packaged application content,
and a restrictive Content Security Policy must allow only the resources needed
by Memory Atlas and its configured map provider.

MVP updates are manual and versioned. Automatic updates are deferred because
they require hosted release infrastructure and are not necessary for the first
stable testing builds. Builds distributed normally to other Macs should be
signed and notarized. Architecture-specific Apple silicon and Intel artifacts
may precede a universal build.

## MVP data flow

The initial application should keep three concerns separate:

```text
image files
    -> browser folder input
    -> background filtering and EXIF/IPTC/XMP extraction
    -> normalized Photo objects
    -> Svelte viewer and lazy-loaded MapLibre view
```

This is a small boundary, not a repository or service architecture. UI
components should consume ordinary typed photo data rather than parsing EXIF or
discovering files themselves.

A representative data shape may look like:

```ts
type Photo = {
  id: string
  file: File
  fileName: string
  originalIndex: number
  capturedAt?: Date
  title?: string
  caption?: string
  tags: string[]
  people: string[]
  orientation?: number
  width?: number
  height?: number
  location?: {
    latitude: number
    longitude: number
  }
  status: 'ready' | 'metadata-error' | 'decode-error' | 'read-error'
}
```

The exact metadata precedence should emerge from the representative images. The
sort must be deterministic and follow user-authored file names: compare file
names case-insensitively with numeric segments in natural order, then use the
original selection index as a final tie-breaker. Capture time is context and
must not affect presentation order.

Current browsers normally respect embedded orientation when displaying an image.
The implementation must verify this with orientations from the representative
corpus and must not apply an additional transform when the browser has already
oriented the decoded image.

Object URLs are derived display resources rather than durable photo data. Create
them lazily for the current photo and a small number of adjacent photos, preload
the previous and next images, and revoke URLs when they leave that window or the
user chooses another folder. Do not decode every full-resolution image during
the metadata scan.

The folder input provides a selected set of `File` objects, not a permanent live
connection to the directory. If a file can no longer be read after selection,
the ingestion or decode step should mark that photo as `read-error` and let the
rest of the folder remain usable. The MVP does not promise to monitor later
changes to the source directory.

## Content and metadata

For the MVP, file names are authoritative for sequence, and image files are
authoritative for information they already contain. We should not duplicate
ordering, capture time, or GPS data in another store merely for convenience.

If human-authored context becomes necessary, a collection may receive a simple
Markdown sidecar file for information such as a title, description, or selected
cover image. Markdown should supplement image metadata rather than duplicate it.
A Markdown parser will only be added when formatted Markdown content is actually
displayed.

## Explicitly excluded from the MVP

The following are not part of the initial technology stack:

- database or IndexedDB wrapper;
- backend or API;
- cloud or object storage;
- authentication and user accounts;
- React;
- SvelteKit;
- Tailwind CSS;
- UI component library;
- global state-management library;
- application router;
- PWA and hosted web distribution;
- automatic desktop updates;
- Windows, Linux, phone, and tablet packages;
- generalized repository or adapter framework;
- Markdown renderer before formatted annotations exist.

These are deferred decisions, not permanently prohibited technologies.

## Deployment and future publishing

The accepted current path is the self-contained macOS Electron package described
in [`deployment-options.md`](deployment-options.md). Vite still produces the
frontend assets embedded in that package.

Vite produces a static website, so the same viewer can later be deployed to a
static web host. A published memory collection can initially remain a directory
of images plus generated static assets and optional annotations.

The separation between image ingestion, normalized photo data, and the UI means
that a future API or hosted media source can provide the same data shape without
requiring the map and gallery to be rewritten.

## When to revisit this decision

Technology should be added in response to demonstrated requirements:

- Add **Markdown parsing** when memories need formatted written narratives.
- Add a **router** when collections or memories need distinct, shareable URLs.
- Add **persistent local storage** when users can edit data in the browser and
  those edits must survive a reload.
- Add a **database or backend** when accounts, synchronization, collaboration,
  server-side queries, or centrally managed collections become requirements.
- Add **object storage** when images must be uploaded and managed independently
  of a static deployment.
- Add a **state library** only if Svelte's built-in state becomes demonstrably
  difficult to organize.
- Consider **SvelteKit or another server-capable framework** when server-side
  rendering, authentication, dynamic public pages, or SEO requirements cannot
  be handled by the static application.
- Reconsider **plain CSS** only if repeated styling patterns make it measurably
  slower or harder to maintain.

Any future change should document the concrete problem being solved, why the
current stack cannot solve it cleanly, and the ongoing cost of the new part.
