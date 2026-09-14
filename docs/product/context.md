# Memory Atlas: Living Project Context

Status: Browser MVP implemented; macOS packaging accepted  
Last updated: 2026-09-14

## Purpose of this document

This is the durable handoff document for future work on Memory Atlas. It captures the current understanding of the product without treating early ideas as permanent decisions.

The product's historical evolution is captured in this order:

1. [`intent-v1.md`](../archive/product/intent-v1.md) — the original, concrete proposal for a local metadata-rich photo presentation viewer.
2. [`vision.md`](vision.md) — the later conceptual expansion from presenting photos to exploring memories.

For implementation, the accepted [`MVP specification`](specifications/mvp.md)
and [`MVP technology-stack decision`](../architecture/decisions/0001-mvp-technology-stack.md)
take precedence over both historical documents. When the historical documents
pull in different directions, `vision.md` takes
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

Thumbnail overview remains a likely follow-on view. Multi-photo and GPX map
exploration is now implemented as a post-MVP extension, while both remain
outside the accepted MVP baseline recorded in the MVP specification.

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
- Image zoom and pan is implemented for the desktop viewer. A photo fits
  the current photo region at its minimum and zooms to 400% of the JPEG's native
  dimensions. Pointer zoom is anchored under the pointer, keyboard zoom is
  centered, and panning is clamped so it cannot reveal additional empty canvas.
- At fitted scale, Left and Right Arrow navigate photos; at enlarged scales,
  the Arrow keys pan. `Z` and double-click cycle through the fitted view, native
  100% view, and a per-photo remembered custom view for the current folder
  session, skipping views that are unavailable or duplicate.
- The implemented desktop keyboard slice adds ten-position `Page Up`/`Page
  Down` jumps and first/last `Home`/`End` navigation with either photo or map
  focus, plus a global
  `H` return to folder selection. `Tab` and `Shift`+`Tab` form a circular
  photo/divider/map region loop in split view; shortcut-backed viewer controls
  do not lengthen that loop, and viewer focus no longer draws yellow/gold
  perimeter decoration.
- Caption and capture time form one optional information overlay, shown by
  default and toggled with `I`; either value remains useful without the other.
- Place is a meaningful exploration dimension, not merely a metadata field.
- Map mode is controlled explicitly by the user and remains open across photos
  without GPS. Current-photo mode uses a placeholder; overview modes retain
  their other markers or tracks and show a compact notice.
- The implemented multi-photo map slice adds exactly three map modes within the existing
  split panel: current photo, all located photos, and all located photos plus
  top-level GPX tracks. `G` and the quiet visible **GPS** control cycle the open map;
  `M` remains the map open/close action. Photo and marker selection stay
  synchronized, and source GPX files remain local, transient, and read-only.
- The implemented MA-FEAT-024 map-camera refinement keeps `G` responsible for
  visible layers. Map-focused `Z` uses the short primary cycle Current photo,
  Day, Complete track, and All photos, skipping unavailable stops; a grouped
  Zoom menu provides direct access to every available Focus, Time, Place, and
  Collection scope. `Shift+Z`, `Control+Z`, `Option+Z`, and
  `Command+Option+Z` go directly to Current photo, Day, Complete track, and All
  photos when available, while plain `Command+Z` remains the macOS Undo
  convention. Day uses recorded local dates, and the wider temporal scope is a
  rolling current-date ±3-day window available from the menu.
- Named geographic scopes use a locally packaged boundary catalog rather than
  approximate zoom levels or runtime geocoding. The first implementation covers
  German and U.S. national parks, Bundesländer/U.S. states, and countries as
  independently overlapping contexts. The U.S. ladder also includes a
  Contiguous United States frame before the complete country;
  country-specific intermediate frames are explicit and extensible.
  MA-FEAT-025 tracks additional countries. The committed catalog has
  reproducible source hashes, simplification settings, output integrity, and
  packaged notices.
- Map navigation preserves the active camera scope and manual zoom. Current
  photo follows a new located pin without resetting zoom; temporal scopes refit
  when their date context changes; geographic scopes remain fixed within the
  same named area, switch to an available destination scope at the same level,
  and otherwise fall back to Current photo at the existing zoom; collection and
  track scopes remain fixed.
  Cluster-revealed marker selection follows the same rule. Persistent stacked
  **GPS** and **Zoom** controls expose the active content mode and camera scope;
  GPS cycles its modes while Zoom opens grouped direct selection.
- Named camera fits use viewport-relative base padding expanded by measured
  persistent overlays and a feature-aware gutter, keeping track geometry and
  in-scope markers clear of the GPS/Zoom controls, notices, navigation, legend,
  and required attribution.
- Transient feedback is centered within the region it describes: photo zoom in
  the photo panel, map framing in the map panel, and viewer-wide failures in the
  complete viewer.
- Future thumbnail views should navigate the same collection as the main viewer.
- Photo folders are the practical starting input.
- In the MVP, case-insensitive natural file-name order is the presentation
  sequence. Capture time remains context and does not override that explicit
  order.
- The long-term scope is memories and experiences, not photo management alone.
- MVP desktop releases use versioned `.app` and `.dmg` artifacts with manual
  updates. A hosted website, PWA, and automatic update service are deferred.
- The repository license is Apache-2.0. The first GitHub target is the owner's
  public personal repository at `https://github.com/chrwittm/memory-atlas`,
  followed by an explicitly unnotarized public tester prerelease. Normal
  notarized distribution remains a separate later gate.
- The durable macOS bundle identifier is `io.github.chrwittm.memoryatlas`,
  with an original atlas/compass icon. Historical artifacts retain their recorded
  generic identifier.
- The public repository uses GitHub private vulnerability reporting as its
  confidential security-reporting channel. Root `SECURITY.md` directs
  reporters there without publishing a personal email address or promising a
  response time, bounty, or support contract.

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

The original intent emphasizes presenting a sequence of travel photos. The later vision emphasizes nonlinear rediscovery. The MVP begins with a calm primary viewer and a split-screen map for the current photo. The implemented MA-FEAT-008/016 slice extends that same panel with all-photo selection and a GPX track overlay rather than introducing a separate map screen. Thumbnail overview remains a later nonlinear view.

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
when the Fullscreen API is unavailable or rejects the request. Readable photos
support pointer-anchored and centered keyboard zoom from fit through 400% of
their native dimensions, clamped pointer and Arrow-key panning, and per-photo
fitted/native/custom view restoration for the current folder session. Photos use
case-insensitive natural file-name order so a numeric prefix explicitly controls
the sequence; capture time is retained only as metadata. The
original 24-photo corpus established the following metadata behavior; the
expanded 31-photo corpus retains that coverage and adds representative GPS:

- capture time comes from EXIF `DateTimeOriginal`, then related EXIF/XMP dates;
- caption text prefers XMP/IPTC descriptions, then EXIF image description, with
  XMP/IPTC title as the fallback;
- the corpus includes two XMP titles that exercise the caption fallback;
- all 31 current photos contain valid latitude and longitude with 31 distinct
  coordinate pairs, so the private corpus now exercises the geotagged map path;
- controlled test metadata remains necessary for invalid, missing, duplicate,
  and densely clustered GPS edge cases;
- browser-native image display is relied on for embedded orientation, avoiding
  a second transform.

Scanning uses four concurrent metadata tasks, reports progress, and turns
individual parser/read failures into photo outcomes. The display layer retains
object URLs for only the current photo and one neighbor on each side and revokes
them as the window changes or the viewer closes.

The scan protocol is terminal on success and unexpected failure, exposes
AbortSignal cancellation, terminates its worker on every terminal path, and
prevents a cancelled or superseded folder scan from replacing the active
application state. The loading screen lets the user cancel back to folder
selection.

Because browser Web Workers do not expose `DOMParser`, metadata ingestion passes
an `@xmldom/xmldom` parser to ExifReader so XMP captions and titles remain
available in both browser and packaged builds.

The browser MVP is packaged in a hardened macOS Electron shell around the Vite
production build. Electron Forge produces versioned, architecture-specific
`.app` and `.dmg` artifacts for local testing. The renderer has no Node.js
integration or preload bridge and runs with context isolation, sandboxing, a
restrictive Content Security Policy, and navigation limited to packaged content.
The Electron session explicitly denies unneeded permission requests and checks,
opens only validated HTTPS links outside the app, and surfaces a packaged
renderer-load failure instead of leaving a hidden or blank window.
The initial ad-hoc-signed build targets Apple silicon; normal transfer to other
Macs still requires Developer ID signing, notarization, and compatible-hardware
verification.

The repeatable release path is automated by `npm run release:mac`. From a clean
source commit, it installs the reviewed lockfile, checks the production audit
and the accepted complete-tree advisory baseline, runs source checks, builds
the architecture-specific Electron artifact outside OneDrive, and verifies the
ASAR contents, temporary and DMG-embedded signatures, bundle version,
architecture, DMG integrity, and SHA-256. Detailed logs and a verification
draft remain in ignored `out/release/` output. Installation, interaction
quality, real-photo checks, publishing, commits, and tags remain explicit human
release decisions.

Electron was selected over a hosted PWA because the current testing requirement
is a self-contained application with no web-host dependency, and over Tauri
because bundled Chromium minimizes runtime variance for the already implemented
browser APIs. See [`macos-packaging.md`](../operations/macos-packaging.md) for the executable runbook
and [`0002-macos-electron-packaging.md`](../architecture/decisions/0002-macos-electron-packaging.md) for the comparison and
release boundary.

## Implemented multi-photo and GPX map slice

[`MA-FEAT-008/016 — Multi-photo and GPX map modes`](specifications/features/ma-feat-008-016-multi-photo-and-gpx-map-modes.md)
is implemented in source. It provides one three-state `G` cycle while the
map is visible: current photo, all located photos, and all located photos plus
every drawable top-level GPX track. The overview modes retain two-way photo
selection, compact state and legend feedback, intentional missing-data states,
and the existing map provider and privacy boundary.

The shared scan worker now retains top-level GPX files beside JPEGs, parses GPX
1.0 and 1.1 tracks locally with bounded concurrency, preserves track and segment
gaps, and isolates malformed sources. The map derives clustered coordinate
groups and separate GeoJSON track segments, keeps its selected photo synchronized
with the viewer, and uses one consistent camera across all modes: `G` preserves
the current viewpoint, while photo changes follow the active named scope without
resetting a manual zoom. Page-key ten-photo jumps and Home/End collection
boundaries are universal across photo and map focus; the divider uses Page keys
for larger split adjustments.

MA-FEAT-024 adds a second, deliberately separate map concept: `G` still chooses
visible content, while map-focused `Z` chooses camera framing. Its primary
cycle contains Current photo, recorded-local-date Day, Complete track, and All
photos when available. The grouped Zoom menu also exposes rolling ±3-day,
containing German or U.S. National park/State/country, and Contiguous United
States scopes. Direct shortcuts reach the four primary scopes, including
`Command+Option+Z` for All photos, without taking over plain `Command+Z`.
Manual navigation and `G` preserve the named-scope cursor. Photo selection
preserves an applicable geographic level by switching to the destination area
at that level when available, otherwise falling back to Current photo without
resetting zoom; changed temporal contexts refit;
closing the map discards the camera and cursor. Geographic matches use a static,
simplified, locally read catalog; only normal basemap requests remain a network
operation.

Representative inspection found that the private Schloss Herrenrunde GPX is a
valid GPX 1.1 document with one named track, one segment, and 847 points. Every
point has valid distinct coordinates, elevation, and a parseable nondecreasing
timestamp. Its 31 companion JPEGs all have valid GPS with distinct coordinates,
so the private corpus provides representative all-photo marker, selection,
track-line, and combined viewport coverage. The implemented parser was verified
against all 847 points. Repository-safe controlled test data covers GPS and GPX
edge cases without copying the private corpus into version control.

## Suggested starting point for the next session

The 0.3.0 package closes the current navigation, photo zoom, GPS-content, and
map-camera slice. Start the next product refinement with the carousel/thumbnail
view rather than reopening that delivered interaction surface. Keep alternate
map layouts, user-authored POIs, and multiple or overlapping GPX presentation
as later independent backlog work requiring representative fixtures and an
accepted visibility model.

The post-MVP idea inventory and the shared refinement workflow live in
[`backlog.md`](../planning/backlog.md). Backlog entries are not accepted
scope: give a selected feature its own accepted specification, record any
lasting technical change as an architecture decision, and update this context
only once its interaction and boundaries are decided.

## Source history

- `archive/product/intent-v1.md`: original implementation-oriented product specification.
- `vision.md`: later vision and naming exploration; expands the conceptual scope beyond photos and travel.
- `context.md`: synthesis of both documents and the current working interpretation. It should evolve as decisions are made.
- `specifications/mvp.md`: accepted behavioral definition and acceptance criteria for the first build.
- `architecture/decisions/0002-macos-electron-packaging.md`: deployment comparison and accepted macOS Electron
  packaging decision.
- 2026-07-05: **Memory Atlas** adopted as the final product and repository name; **Memory Explorer** retained only as the former working title.
- 2026-07-06: macOS Electron packaging adopted for stable, self-contained MVP
  testing; hosted web, PWA, and other platform distribution deferred.
- 2026-07-25: a living post-MVP product backlog and lightweight feature
  refinement workflow were established; no post-MVP feature scope was accepted
  by that act alone.
- 2026-09-04: MA-FEAT-001 image zoom and pan was accepted for the next desktop
  viewer slice, coordinated with MA-FEAT-015's interaction-region focus model.
- 2026-09-04: MA-FEAT-001 was implemented with pointer-anchored and centered
  keyboard zoom, bounded pointer and Arrow-key panning, per-photo remembered
  named views, and responsive fit recalculation. The broader three-region
  `Tab` loop remains tracked separately by MA-FEAT-015.
- 2026-09-07: Apache-2.0, the public personal GitHub repository, removal of the
  personal commit email, `io.github.chrwittm.memoryatlas`, and an unnotarized
  public tester prerelease were selected as the publication direction. Normal
  notarized distribution remains a later, independent gate.
- 2026-09-12: MA-FEAT-002, MA-FEAT-015, and MA-FEAT-018 were accepted as one
  desktop keyboard-navigation slice: `H` returns to folder selection,
  `Page Up`/`Page Down` jump ten photos, `Home`/`End` reach the collection
  boundaries from photo focus, and a circular photo/divider/map focus loop
  replaces control-by-control tabbing and yellow/gold viewer focus outlines.
- 2026-09-12: The combined keyboard-navigation slice was implemented in source.
  Automated coverage now exercises both focus-loop directions and responsive
  omission, region-specific dispatch, quick-jump boundaries and repeat, per-photo
  view restoration, modified-key rejection, fullscreen `H` cleanup, resource
  disposal, entry focus, and forced-color-safe focus selectors. Christian
  subsequently confirmed successful interaction testing. A standalone DMG was
  intentionally deferred until more features are ready for the next build.
- 2026-09-13: MA-FEAT-008 and MA-FEAT-016 were accepted as one map exploration
  slice with exactly three `G` modes: current photo, all located photos, and all
  located photos plus top-level GPX tracks. The specification adds two-way
  marker selection, clustered and duplicate locations, explicit empty states,
  and local isolated GPX parsing while deferring waypoints, routes, and time-
  based track filtering.
- 2026-09-13: MA-FEAT-008/016 was implemented in source. The shared worker now
  parses top-level GPX files in isolation, the split map cycles through all
  three modes with clustered and exact-coordinate groups, pointer and
  map-focused keyboard selection stay synchronized with the viewer. Follow-up
  browser testing replaced the separate overview-camera behavior with one
  universal camera: mode changes preserve the viewpoint, and photo changes
  recenter at the established close zoom in every mode. Automated checks and
  the production build pass; the consolidated packaged interaction check
  remains pending.
- 2026-09-14: Source testing validated the three `G` content modes and prompted
  MA-FEAT-024. Its release-candidate refinement gives map-focused `Z` the
  primary Current photo, Day, Complete track, and All photos cycle while a
  grouped Zoom menu retains direct access to every available named scope.
  `Shift+Z`, `Control+Z`, `Option+Z`, and `Command+Option+Z` directly select
  those four primary scopes when available; plain `Command+Z` stays unassigned.
  Day and rolling ±3-day scopes use
  recorded local photo dates, and real locally packaged German and U.S.
  national-park, state/Bundesland, and country polygons supply geographic
  scopes under ADR 0004. Further countries are MA-FEAT-025. Cluster selection
  remains unchanged pending more tester use.
- 2026-09-14: MA-FEAT-024 was implemented in source. Recorded local calendar
  dates now cross the metadata boundary without timezone conversion; the map
  computes only mode-appropriate named scopes, supports labeled-Z direct access,
  and preserves or resets its camera cursor according to the accepted lifecycle.
  A generated 148-area German/U.S. catalog is committed with exact source
  hashes, licensing, attribution, simplification parameters, an integrity test,
  and notices copied into the packaged third-party resources. Consolidated
  installed-app verification remains pending.
- 2026-09-14: A second tester pass replaced forced fixed-zoom photo following
  with scope-aware camera stability, made ten-photo and boundary navigation
  universal across photo and map focus, added larger divider Page-key steps,
  placed transient feedback in its owning panel, and added a Contiguous United
  States scope before the complete country. These refinements preserve manual
  zoom and remove the post-cluster fixed-zoom reversal.

## Publication toolchain

The accepted publication toolchain is Node 24.20.0 LTS and npm 11.19.0 with
Electron 42.11.2 and stable Forge 7.11.2; see
[ADR 0003](../architecture/decisions/0003-publication-toolchain-and-identity.md).
The first hardened tester candidate is 0.2.1, preserving the immutable local
0.2.0 artifact. Publication and installed-app verification are separate gates.

Fullscreen now permits Electron’s documented permission only for the exact
packaged main frame. Automated focus and rejection regressions pass. The owner verified installed
fullscreen entry, exit, and Escape priority on 2026-09-08, resolving MA-BUG-002.

The public source import is complete and GitHub CI passed. Repository protection,
private vulnerability reporting, dependency alerts, and secret scanning are
enabled. The 0.2.1 build passed the automated macOS gate and owner-installed
interaction checks. Its unnotarized Apple silicon tester prerelease was withdrawn to draft after
a new critical MapLibre advisory was found during final publication checks;
see the [publication record](../delivery/verifications/2026-09-11-v0.2.1-publication.md).
The 0.2.2 security replacement completes Gates A and B; Gate C remains deferred.

### 0.3.0 navigation and map verified candidate

Version 0.3.0 is the consolidated verified tester candidate for the implemented desktop
keyboard-navigation and MA-FEAT-008/016/024 map slices. It adds universal quick
collection navigation, the spatial focus loop, top-level GPX ingestion, three
cumulative map-content modes, photo and cluster selection, named temporal and
locally packaged German/U.S. geographic camera scopes, and overlay-aware map
fits. The release gate and exact installed-app checklist pass. Release
preparation keeps MA-BUG-001 as a documented limitation and
defers additional GPX sources, points of interest, alternate map layouts, and
the carousel to later work. The exact candidate and its two caught-and-resolved
packaged regressions are recorded in the
[0.3.0 verification](../delivery/verifications/2026-09-14-v0.3.0-publication.md);
public GitHub download verification remains pending.

### 0.2.2 security replacement

The owner authorized the replacement publication after the 0.2.1 withdrawal.
MapLibre is pinned to patched 6.4.1 with named ESM exports and a separately
bundled local worker; no worker is fetched from a CDN. Vitest is updated to
4.1.11. Fresh audits, 64 tests, the full packaged gate, installed verification, and
exact-source CI pass. The [0.2.2 tester prerelease](https://github.com/chrwittm/memory-atlas/releases/tag/v0.2.2)
is published; its [verification record](../delivery/verifications/2026-09-11-v0.2.2-publication.md)
identifies the exact artifact.
