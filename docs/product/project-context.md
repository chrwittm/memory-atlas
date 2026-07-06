# Memory Atlas: Living Project Context

Status: Browser MVP implemented; macOS packaging accepted  
Last updated: 2026-07-06

## Purpose of this document

This is the durable handoff document for future work on Memory Atlas. It captures the current understanding of the product without treating early ideas as permanent decisions.

The product's historical evolution is captured in this order:

1. [`intent-v1.md`](intent-v1.md) — the original, concrete proposal for a local metadata-rich photo presentation viewer.
2. [`project-name.md`](project-name.md) — the later conceptual expansion from presenting photos to exploring memories.

For implementation, the accepted `mvp-description.md` and
`mvp-technology-stack.md` take precedence over both historical documents. When
the historical documents pull in different directions, `project-name.md` takes
precedence for the long-term product vision.

## Current working understanding

Memory Atlas is a local-first application for rediscovering personal experiences through the media and context attached to them.

The first useful version will make a folder of photos pleasurable to browse and present. It will combine a strong, uncluttered photo-viewing experience with information that is normally hidden or fragmented: captions, time, location, tags, people, and relationships to nearby photos.

The longer-term product is broader than a photo viewer or photo manager. A remembered experience may eventually bring together photos, videos, routes, places, notes, documents, audio, links, and generated context. It should be possible to explore this material from several perspectives—such as media, map, time, people, topics, and relationships—rather than only through folders or a linear slideshow.

The product's deeper job is not file organization. It is helping someone recover the shape and meaning of an experience.

## Product essence

### The user experience

The app should feel like an invitation to explore, not an administration interface. A photo remains visually primary. Context should be close at hand but quiet until wanted. Movement between an individual image and the wider experience—nearby images, a map, a timeline, or an overview—should feel immediate and spatially coherent.

The app should work both for private recollection and for showing an experience to family or friends. Those modes overlap, but they are not necessarily identical: solo exploration rewards discovery and depth, while presentation rewards visual calm and predictable control.

### The initial wedge

The initial product wedge is intentionally narrower than the vision:

- Local folders of JPEG photos
- Read-only metadata extraction
- A large-image browsing/presentation view
- Previous and next navigation
- Toggleable photo information combining available captions and capture time
- A split-screen map for the current geotagged photo
- No required cloud service and no modification of originals

Thumbnail overview and multi-photo map exploration remain likely follow-on views,
but they are explicitly outside the accepted MVP.

This is not a retreat from the broader vision. It is the smallest domain in which the central idea—media plus context becoming an explorable memory—can be tested honestly.

## Product principles

1. **The memory is the subject; files are evidence.** Photos and metadata are inputs, not the conceptual center of the product.
2. **Media first, context on demand.** Context should enrich the image without crowding it.
3. **Exploration over management.** Optimize for rediscovery, orientation, and storytelling rather than catalog maintenance.
4. **Local-first and non-destructive.** Originals remain untouched; the app should provide value without requiring upload.
5. **Multiple views of the same experience.** Image, overview, map, and eventually timeline or relationship views should be alternate perspectives on shared underlying material—not separate silos.
6. **A narrow MVP with extensible concepts.** Build for photos first, but avoid equating the lasting domain model with JPEG files or folders.
7. **Metadata should become meaningful context.** Raw technical fields are useful only when they help answer human questions such as what, where, when, who, and how this item relates to the experience.
8. **Filesystem-first authoring.** Prefer explicit, portable source artifacts—folder structure, file names, embedded metadata, and simple sidecars when needed—over hidden app-owned state. Let people express intent with ordinary tools, and keep Memory Atlas focused on reading and presenting it.

## What appears settled

- The application is local-first, at least initially.
- The implemented MVP core is a browser-native static application. The accepted
  testing and local distribution target is now a self-contained macOS Electron
  application that packages the existing Vite build and bundled Chromium.
- macOS is the only accepted packaging target for the current slice. Windows,
  Linux, phones, and tablets remain future platform decisions.
- Runtime folder access uses a directory file input; metadata extraction runs in a Web Worker with ExifReader.
- Svelte, TypeScript, Vite, plain CSS, and MapLibre GL JS are the accepted MVP stack.
- It must never modify original media in the MVP.
- Browsing should be visually strong enough for full-screen presentation.
- The viewer toggles true browser fullscreen with `F`; `Escape` retains its
  browser-standard fullscreen exit behavior.
- Caption and capture time form one optional information overlay, shown by
  default and toggled with `I`; either value remains useful without the other.
- Place is a meaningful exploration dimension, not merely a metadata field.
- Map mode is controlled explicitly by the user and remains open across photos
  without GPS, using a placeholder until a located photo is selected again.
- Future thumbnail and multi-photo map views should navigate the same collection as the main viewer.
- Photo folders are the practical starting input.
- In the MVP, case-insensitive natural file-name order is the presentation
  sequence. Capture time remains context and does not override that explicit
  order.
- The long-term scope is memories and experiences, not photo management alone.
- MVP desktop releases use versioned `.app` and `.dmg` artifacts with manual
  updates. A hosted website, PWA, and automatic update service are deferred.

## Historical alternatives and remaining open decisions

The following technology suggestions in `intent-v1.md` are historical
alternatives and are not current MVP decisions:

- React, Vue, or plain JavaScript
- Python/FastAPI versus Node.js
- ExifTool as the metadata reader
- Leaflet and OpenStreetMap tiles

The following decisions remain provisional for post-MVP evolution:

- The exact `album.index.json` schema and its location
- Cache-directory naming
- Whether a folder, album, event, and memory are the same concept
- When map pins for every photo should enter after the MVP

These should be decided in response to demonstrated needs, not inherited
accidentally from the first specification.

## Important conceptual tensions

### Product name: Memory Atlas

**Memory Atlas** is the final product and repository name. The naming document records why it fits the broader vision: structured exploration through maps, time, people, topics, and relationships. The earlier working title, **Memory Explorer**, expressed the same shift away from a slideshow, but with a different emphasis:

- **Explorer** describes the user's action and feels open-ended.
- **Atlas** describes the product as a structured world of memories and gives place/orientation a stronger role.

The naming decision is settled: use **Memory Atlas** consistently in product copy, documentation, code, and repository metadata. References to **Memory Explorer** should appear only when documenting the project's naming history.

### Folder versus memory

A folder is a convenient source of files, but a memory or experience may span folders, media types, dates, locations, and external artifacts. The MVP can treat one selected folder as one browsable collection without cementing that equivalence into the long-term model.

Filesystem-first authoring does not remove this distinction. It means using the
selected folder and its portable, user-visible properties as the simplest
available control surface before inventing an application database or editor.
For example, a numeric file-name prefix controls the MVP sequence. It does not
mean that a folder must permanently define a memory or that every future form of
context belongs inside an image file.

### Presentation versus exploration

The original intent emphasizes presenting a sequence of travel photos. The later vision emphasizes nonlinear rediscovery. The MVP begins with a calm primary viewer and a split-screen map for the current photo. Thumbnail overview and multi-photo map navigation are the next likely nonlinear views, but are deferred until the core slice is proven.

### Local-first versus map services

The application itself, photo access, and metadata processing do not require a
Memory Atlas server or photo upload. The accepted macOS Electron package can
launch without a hosted origin or local development server. Online map tiles
remain an explicit exception: opening the optional map requires network access
and sends requests for the displayed area to the configured provider. “Local”
must not be presented as meaning that every optional feature is offline.

### Generated index versus source of truth

A generated index can make startup fast, but it should remain disposable derived data. Original media and sidecar metadata are authoritative; rescanning should be safe and predictable.

## Questions the product should help answer

- What am I looking at?
- Where and when did this happen?
- What happened immediately before and after it?
- What else happened nearby?
- Who or what is connected to this moment?
- How does this item fit into the larger experience?
- What have I forgotten that this material can help me rediscover?

## Accepted MVP outcome

A good first milestone is not “the complete atlas.” It is a coherent vertical slice:

> Select a local folder of photos, enter a visually calm viewer, move through the images, reveal their human-readable context, and open the current photo beside its location on a map—without uploading or changing the originals.

This phrasing preserves the heart of both source documents. The implementation
spike should validate its technical assumptions before visual polish is added.

## MVP implementation status

The browser MVP is implemented in `src/` with the accepted Svelte, TypeScript,
Vite, ExifReader, Web Worker, and dynamically loaded MapLibre stack. The
desktop map opens at an initial 80/20 photo-to-map split that can be resized with
its center divider, and the closer initial map zoom emphasizes the photo
location. Map mode remains stable while navigating: photos without GPS show an
explanatory panel and the map returns for the next located photo. The combined
caption and capture-time overlay is toggled with `I`, and either value displays
when the other is absent. The viewer can enter and leave browser fullscreen with
`F`, with graceful feedback
when the Fullscreen API is unavailable or rejects the request. Photos use
case-insensitive natural file-name order so a numeric prefix explicitly controls
the sequence; capture time is retained only as metadata. The
representative 24-photo corpus established the following metadata behavior:

- capture time comes from EXIF `DateTimeOriginal`, then related EXIF/XMP dates;
- caption text prefers XMP/IPTC descriptions, then EXIF image description, with
  XMP/IPTC title as the fallback;
- the corpus includes two XMP titles that exercise the caption fallback;
- the corpus contains no GPS coordinates, so valid and invalid GPS
  normalization and the geotagged map path use controlled test metadata;
- browser-native image display is relied on for embedded orientation, avoiding
  a second transform.

Scanning uses four concurrent metadata tasks, reports progress, and turns
individual parser/read failures into photo outcomes. The display layer retains
object URLs for only the current photo and one neighbor on each side and revokes
them as the window changes or the viewer closes.

The browser MVP is not yet packaged. The accepted next deployment slice is a
macOS Electron shell around the existing Vite production build, producing
versioned `.app` and `.dmg` artifacts for stable local testing and transfer to
other compatible Macs. Electron was selected over a hosted PWA because the
current testing requirement is a self-contained application with no web-host
dependency, and over Tauri because bundled Chromium minimizes runtime variance
for the already implemented browser APIs. See
[`deployment-options.md`](deployment-options.md) for the comparison and release
boundary.

## Suggested starting point for the next session

Package the smallest macOS Electron vertical slice and prove that folder
selection, metadata scanning, image display, keyboard controls, fullscreen, and
MapLibre work from a packaged `.app` without Vite or a hosted origin. Then test
the implemented MVP against additional real folders, especially one with GPS,
non-default orientation, malformed metadata, and an undecodable JPEG.

## Source history

- `intent-v1.md`: original implementation-oriented product specification.
- `project-name.md`: later vision and naming exploration; expands the conceptual scope beyond photos and travel.
- `project-context.md`: synthesis of both documents and the current working interpretation. It should evolve as decisions are made.
- `mvp-description.md`: accepted behavioral definition and acceptance criteria for the first build.
- `deployment-options.md`: deployment comparison and accepted macOS Electron
  packaging decision.
- 2026-07-05: **Memory Atlas** adopted as the final product and repository name; **Memory Explorer** retained only as the former working title.
- 2026-07-06: macOS Electron packaging adopted for stable, self-contained MVP
  testing; hosted web, PWA, and other platform distribution deferred.
