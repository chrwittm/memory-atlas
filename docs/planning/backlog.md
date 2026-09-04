# Memory Atlas Product Backlog

**Status:** Living post-MVP backlog

**Last updated:** 2026-09-04

**Purpose:** Capture, refine, and sequence product ideas without accidentally
turning them into accepted scope.

## How to use this backlog

Memory Atlas has a working desktop MVP. This document is the shared planning
surface for what comes next. A backlog item is an intention, not a commitment.
Only an item that has been explicitly selected for a release becomes accepted
scope; then create or update its product specification, record an architecture
decision if relevant, and update [`context.md`](../product/context.md).

### Workflow

1. **Capture** — add a short item to *Ideas / discovery* with the user need,
   without solving it prematurely.
2. **Refine** — before implementation, record the outcome, interaction model,
   non-goals, dependencies, privacy implications, and acceptance checks.
3. **Select** — give a sufficiently refined item its own feature specification
   under `product/specifications/features/` and place it in a named next slice.
   Keep the slice small enough to build and test end-to-end.
4. **Implement and verify** — add focused tests, exercise a real photo folder,
   and test the packaged macOS app where applicable.
5. **Record** — mark it delivered here, link its specification and the relevant
   PR/release when one exists, and promote durable decisions into the
   authoritative documents.

Use these states: **Idea**, **Needs research**, **Ready to specify**,
**Ready to build**, **In progress**, **Delivered**, or **Parked**. Prefer a
small number of *Ready to build* items over a large speculative queue.

### Definition of ready to build

An item is ready when it has a clear user outcome, interaction and keyboard/
pointer behavior, meaningful acceptance checks, known dependencies, an explicit
privacy and platform boundary, and a named non-goal. Visual alternatives or
unknown technical feasibility keep it in discovery/research.

### Suggested planning rhythm

For each next slice, choose one primary user outcome plus only the enabling
work it requires. Discuss the short specification together before coding;
implement a vertical slice; then update this backlog and the durable product
documents. This makes the work collaborative and traceable without creating a
heavy process.

## Current priorities at a glance

| Horizon | Theme | Why it belongs here |
| --- | --- | --- |
| Next desktop refinements | Quick collection navigation, a three-region focus loop, Home, file actions, and fullscreen reliability | High value while preserving the present viewer and making its keyboard model coherent |
| Next exploration views | Thumbnail gallery, all-photo map, and GPX overlays | Natural extensions of the existing temporary collection and shared selection |
| Media expansion | Videos in the file-name sequence | A demonstrated trip-viewing need that requires codec and playback-boundary research |
| Context and people | Tags, filename, people regions | Depends on representative metadata and an intentional side-panel model |
| Platform strategy | iPhone and iPad | Requires a product, storage, and distribution decision—not a responsive-CSS-only change |
| Performance and persistence | Disposable scan index/cache | Defer until measured scan cost justifies a new persistence boundary |

### Suggested sequence for the 2026-09-04 field feedback

1. Reproduce and fix MA-BUG-002 before changing the broader keyboard model.
2. Specify and implement MA-FEAT-001 and MA-FEAT-015 together because zoom,
   collection navigation, and region focus share the Arrow keys.
3. Specify MA-FEAT-018's quick collection-navigation keys alongside the focus
   model so their scope remains predictable.
4. Extend the present map with MA-FEAT-008's all-photo mode and two-way pin
   selection.
5. Inspect representative GPX files, then specify MA-FEAT-016 on top of that
   map-layer foundation.
6. Inspect representative trip videos and packaged-runtime codec behavior, then
   specify MA-FEAT-017 as a separate mixed-media vertical slice.

## Candidate next slice: desktop viewer essentials

These are narrow, valuable changes that can be specified and delivered without
changing the local-first model.

### MA-FEAT-001 — Image zoom and pan

- **State:** Implemented and user-tested 2026-09-04
- **Specification:**
  [`MA-FEAT-001 — Image zoom and pan`](../product/specifications/features/ma-feat-001-image-zoom-and-pan.md)
- **User outcome:** While viewing a photo, I can inspect a detail such as text
  on a sign without leaving Memory Atlas.
- **Accepted interaction:** Direct mouse-wheel/trackpad and `+`/`-` zoom from a
  fitted minimum through 400% of the JPEG's native scale; pointer zoom is
  anchored at the pointer and keyboard zoom at the photo center. Drag or Arrow
  keys pan an enlarged photo within its bounds. At fit, Left and Right Arrow
  navigate the collection. `Z` or double-click cycles through the fitted,
  native 100%, and per-photo remembered custom views, skipping unavailable or
  duplicate entries.
- **Implementation:** Photo zoom and pan dispatch is scoped to the focused photo
  region, while the divider and map retain their own input. Per-photo view state
  is transient, and the existing source-file and object-URL boundaries are
  preserved. The broader three-region `Tab` loop remains tracked by MA-FEAT-015.

### MA-FEAT-002 — Return to entry screen

- **State:** Ready to build
- **User outcome:** I can leave a collection and choose another folder quickly.
- **Proposed interaction:** `H` returns to the Home/entry screen; provide a
  quiet visible control. If fullscreen or a panel is open, define and document
  whether `H` exits it directly (recommended) or requires a second press.
- **Acceptance checks:** Object URLs are released; current collection and
  transient viewer state are cleared; no files are changed; focus reaches the
  entry-screen folder action.
- **Non-goal:** Recent folders or persistent library history.

### MA-FEAT-018 — Quick collection navigation

- **State:** Ready to specify
- **User outcome:** I can quickly inspect a distant part of a large collection,
  jump to its end, or restart at its beginning without stepping through every
  intervening photo.
- **Proposed interaction:** In the photo region, `Page Up` moves ten photos
  backward and `Page Down` moves ten photos forward. `Home` (`Pos1`) selects the
  first photo and `End` selects the last photo. Ten-photo jumps clamp to the
  first or last photo when fewer than ten positions remain.
- **Keyboard scope:** These shortcuts navigate the collection at both fitted
  and enlarged photo scales. When another spatial region or applicable control
  has focus, that region or control retains its established key behavior; in
  particular, `Home` and `End` continue to resize the focused map divider.
- **Acceptance checks:** All four shortcuts preserve case-insensitive natural
  file-name order; work with key repeat without moving beyond collection
  boundaries; keep the displayed photo, position indicator, metadata, map, and
  transient per-photo view state synchronized; and do not fire from a control
  that legitimately consumes the key.
- **Non-goal:** A thumbnail overview, arbitrary numeric jump dialog, or new
  pointer controls for ten-photo navigation.
- **Likely dependency:** Coordinate shortcut dispatch with MA-FEAT-015's
  spatial focus model.

### MA-FEAT-003 — Filename on demand

- **State:** Ready to specify
- **User outcome:** I can reveal the technical file name when captions are not
  enough, without making it permanent visual noise.
- **Proposed interaction:** Add filename to a deliberately named information
  detail mode, rather than extending the existing `I` overlay implicitly.
  Suggested shortcut: `D` for details; it may include filename and later other
  technical fields.
- **Decision needed:** Is filename a second level of the information overlay,
  or a separate details panel? The choice should align with MA-FEAT-006's one-panel
  model.
- **Non-goal:** File rename or metadata editing.

### MA-FEAT-004 — Reveal or export the current original

- **State:** Needs research
- **User outcome:** I can use the current original outside the viewer—either
  reveal it in Finder or copy it to Downloads.
- **Why research:** Browser-only code cannot reliably reveal a selected `File`
  in Finder or write a copy to Downloads. The packaged Electron app currently
  intentionally exposes no native bridge.
- **Options to evaluate:** (a) a minimal, tightly scoped Electron capability
  for *Reveal in Finder*; (b) browser-compatible download using the existing
  `File` object; (c) both, with language that makes the copy explicit.
- **Privacy and safety:** Never move, rename, or overwrite the original;
  downloads create a duplicate and need collision behavior; native access must
  not broaden renderer filesystem permissions.
- **Non-goal:** General file management or editing originals.

### MA-FEAT-005 — Friendly local-first explanation and future About surface

- **State:** Ready to build
- **User outcome:** I understand the privacy promise without repeatedly seeing
  a distracting pop-up.
- **Scope:** Review the present entry-screen wording and any repeated runtime
  notice; keep one calm, truthful explanation at folder choice and move fuller
  privacy/map-network details to a future About/help surface.
- **Acceptance checks:** Clearly distinguishes local photos/metadata from map
  tile requests; does not interrupt normal browsing; remains accessible.
- **Non-goal:** A marketing site, account system, or legal policy program.

### MA-FEAT-015 — Minimal viewer focus loop

- **State:** Ready to specify
- **User outcome:** I can move predictably between the large interactive areas
  of the viewer without tabbing through every fading on-screen control.
- **Proposed interaction:** In the main viewer, `Tab` and `Shift`+`Tab` cycle
  only through visible interaction regions. With the map closed, the photo is
  the only region. With the map open, the forward order is photo, divider, map;
  reverse traversal uses the opposite order. The no-GPS map placeholder still
  represents the visible map region.
- **Region behavior:** A visible focus indicator identifies the active region.
  Arrow and `+`/`-` input is dispatched by that focus: the photo zooms and pans
  under MA-FEAT-001, the divider keeps its existing Arrow-key resizing, and the
  map uses its normal pan and zoom behavior. Global shortcuts such as `I`, `M`,
  and `F` remain available independent of the active region.
- **Accessibility boundary:** Viewer buttons and MapLibre controls should not
  lengthen this spatial focus loop. Every excluded viewer action must retain a
  documented keyboard equivalent and an accessible name; the specification
  must also define non-disruptive keyboard access to required map attribution.
  Entry, loading, empty, and error screens retain their normal control-focused
  tab order.
- **Acceptance checks:** The loop contains exactly the regions currently
  visible; opening or closing the map moves focus safely; focus never becomes
  lost or trapped; the divider remains keyboard-resizable; and pointer use does
  not make keyboard focus ambiguous.
- **Non-goal:** Redesigning the visible controls or replacing global shortcuts.
- **Likely dependencies:** Coordinate keyboard dispatch with MA-FEAT-001 and
  ensure MA-FEAT-002 provides a keyboard route back to folder selection before
  removing that visible action from the tab order.

## Exploration views

These features share one selected temporary collection and one current-photo
selection. Their design should avoid fragmenting the viewer into unrelated
screens.

### MA-FEAT-006 — One contextual side-panel framework

- **State:** Ready to specify
- **User outcome:** I can open context such as a map or tags while keeping the
  photo primary, and the interface remains calm as new views arrive.
- **Proposed model:** At most one contextual panel is open at a time. Opening
  Map, Tags, or future Details replaces the panel content; closing it restores
  the full photo. Desktop begins with the current 80/20 split, while mobile
  receives a separate responsive interaction design.
- **Decision needed:** Whether the multi-photo map is a panel mode, an overview
  mode, or both. Resolve before MA-FEAT-008.
- **Non-goal:** A permanent dashboard/sidebar.

### MA-FEAT-007 — Thumbnail gallery / carousel

- **State:** Ready to specify
- **User outcome:** I can see and jump among several photos instead of stepping
  through a folder one image at a time.
- **Proposed interaction:** `T` toggles a thumbnail overview. Arrow keys move
  an active thumbnail; `Enter` opens it in the detail viewer; `Escape` returns
  to the current photo. Pointer selection is direct. Preserve filename order.
- **Questions to settle:** Grid versus filmstrip as the first form; whether the
  overview replaces the viewer or occupies a panel; how captions, location,
  unreadable photos, and focus are represented.
- **Acceptance checks:** Handles large folders without eagerly decoding every
  full image; selection, keyboard focus, and current photo stay synchronized;
  all object URLs and thumbnails are cleaned up.
- **Non-goal:** Editing, manual ordering, album management, or a permanent
  library.

### MA-FEAT-008 — Map all located photos and select from pins

- **State:** Ready to specify
- **User outcome:** I can understand a folder spatially and jump from a map pin
  to the associated photo.
- **Proposed interaction:** While the map is open, `G` changes its content from
  the current-photo-only view to a view containing every photo with valid GPS.
  The current photo and other photos use distinct marker colors documented in a
  compact legend. Clicking another photo marker changes the current photo;
  selecting a photo in the viewer updates the selected marker.
- **Evolution:** MA-FEAT-016 extends the same `G` cycle with cumulative GPX
  point-of-interest and track layers. `M` continues to open or close the map;
  `G` changes what an open map displays.
- **Questions to settle:** Entry point and relationship to MA-FEAT-006; initial
  viewport (fit all points versus current photo); duplicate coordinates;
  filtering/photos without GPS; marker previews; dense-set clustering; mode
  persistence; and keyboard-accessible marker navigation.
- **Acceptance checks:** Metadata is normalized once during scan; two-way
  selection is reliable; the current and other-photo categories stay visually
  distinct; all-photo mode still shows located photos when the selected photo
  has no GPS; the active mode is understandable without memorizing `G`; map
  attribution/network disclosure remains visible; and no photo or metadata is
  uploaded beyond normal map-tile location requests.
- **Non-goal:** GPX parsing, route recording, editing GPS, or an offline map.

### MA-FEAT-016 — GPX points of interest, tracks, and layered map modes

- **State:** Needs research with representative trip GPX files
- **User outcome:** I can place portable GPX files beside a trip's photos and
  see noteworthy places and the traveled path as additional map context.
- **Source model:** Read one or more top-level `.gpx` files from the selected
  folder without modifying them. GPX waypoints are the first candidate for
  points of interest; GPX tracks, and routes if present in the real files, are
  rendered as lines. One invalid GPX file must not prevent photos or other GPX
  files from loading.
- **Proposed interaction:** With the map open, `G` cycles through cumulative
  modes: (1) current photo, (2) all located photos, (3) photos plus GPX points
  of interest, and (4) photos, points of interest, and GPX tracks. On entering
  the track mode, show by default every timed track whose time span intersects
  the current photo's capture date. This allows a trip-wide track and a
  same-day hike track to appear together while suppressing tracks from unrelated
  days. The cycle wraps and has a quiet visible mode indicator or control.
  Layers with no data must produce an intentional state rather than a misleading
  empty map, and the user must be able to understand when the default date
  filter excludes otherwise available tracks.
- **Legend:** Define stable, distinguishable treatments for the current photo,
  other photos, GPX points of interest, and tracks. When multiple matching
  tracks overlap, draw broader context such as a whole-trip track first in a
  quieter color, then draw a shorter, more specific track such as an individual
  hike above it in a stronger highlight color. Evaluate a small stable palette
  and the definition of track specificity against real files; do not assume
  that every track needs a unique color if labels, grouping, or selection
  communicates the distinction more clearly.
- **Research needed:** Inspect the trip files for GPX version, waypoints, routes,
  track segments, names, timestamps, duplicate points, and multiple tracks per
  file. Decide how a photo's local calendar date is compared with GPX timestamps
  and time zones, how untimed or partially timed tracks behave, how broad versus
  specific tracks are identified, viewport fitting, layer ordering,
  malformed-coordinate handling, and whether `G` visits unavailable modes or
  skips them while announcing the result.
- **Acceptance checks:** Multiple top-level GPX files are parsed locally and in
  isolation; entering track mode for a photo with a capture date shows all and
  only the timed tracks intersecting that date by default; overlapping broad and
  specific tracks remain distinguishable, with the specific track visible on
  top; navigating to a photo on another date updates the default track set;
  tracks do not obscure photo markers; the legend matches every visible
  category; the mode cycle and pointer control agree; and coordinates are not
  uploaded beyond ordinary basemap requests for the displayed area.
- **Non-goal:** Recording, editing, correcting, or exporting tracks; route
  planning; live location; or recursively scanning subfolders.
- **Dependencies:** Builds on MA-FEAT-008's photo-marker and selection model and
  may require a lasting ingestion/data-model architecture decision.

### MA-FEAT-009 — Map visual-style evaluation

- **State:** Ready to specify
- **User outcome:** The optional map feels as considered as the viewer while
  staying legible around photo locations.
- **Scope:** Compare a small set of MapLibre-compatible styles, including the
  present OpenFreeMap Positron style, using the same representative locations.
  Keep the selected style in the existing central configuration.
- **Decision criteria:** Visual fit, place-label readability, contrast with
  markers, provider reliability/terms, attribution, performance, and network
  implications.
- **Non-goal:** Building a proprietary cartographic style before map exploration
  proves valuable.

## Context, tags, and people

### MA-FEAT-010 — Tags and keywords display

- **State:** Needs research
- **User outcome:** I can reveal the descriptive tags embedded in my photos.
- **Proposed interaction:** `T` is already reserved for thumbnails; use another
  shortcut only after the panel and gallery choices are settled. Tags belong in
  the contextual panel, not the default photo overlay.
- **Research needed:** Inspect representative exports for IPTC/XMP keyword
  fields, normalization requirements, language variants, duplicates, and real
  user value. The current primary corpus has no keyword examples.
- **Non-goal:** Creating or editing tags in the app.

### MA-FEAT-011 — People names and face regions

- **State:** Needs research
- **User outcome:** I can discover photos by the people identified in their
  embedded metadata, potentially including a highlighted face region.
- **Research needed:** Determine which metadata formats real Lightroom and
  Apple Photos exports retain: names, `mwg-rs:Regions`, Microsoft Photo Region,
  or vendor-specific fields; whether ExifReader exposes them consistently; and
  how normalized regions map to an oriented displayed image.
- **Potential delivery sequence:** (1) read/display person names; (2) filter or
  browse by person; (3) render normalized face boxes; only later consider local
  face recognition, which is a separate privacy, consent, and product decision.
- **Privacy:** People metadata is especially sensitive. Keep it local; do not
  send it to a recognition service; provide clear behavior for missing or
  inconsistent tags.
- **Non-goal:** Cloud recognition, person identity inference, or writing names
  back to originals.

## Platform expansion: iPhone and iPad

### MA-FEAT-012 — Mobile product and delivery strategy

- **State:** Needs discovery
- **User outcome:** I can browse a chosen photo collection on iPhone and iPad,
  including natural portrait/landscape layouts and touch navigation.
- **Why this is a product track:** iOS access to folders, NAS shares, iCloud,
  background work, browser/PWA capabilities, App Store rules, and offline
  expectations determine the experience. A responsive desktop layout alone
  does not create a usable iPhone product.
- **Discovery questions:**
  - Which source matters first: Files/iCloud Drive, a home NAS, a selected local
    album, or a managed cloud copy?
  - Is home-network-only access acceptable, and what happens away from home?
  - Is the first delivery a responsive hosted/PWA experiment, a native iOS app,
    or another route?
  - Must selected collections remain available offline?
  - What local-first and map-network promise can be made truthfully on iOS?
- **Interaction principles to validate:** Swipe left/right for navigation;
  portrait and landscape layouts designed intentionally; tap targets and panels
  suited to touch; keyboard support for iPad hardware keyboards; no dependence
  on hover.
- **Non-goal:** Committing now to NAS support, iCloud synchronization, accounts,
  or a cloud backend.

## Performance and derived data

### MA-FEAT-013 — Measure scanning and browsing performance

- **State:** Ready to build when a representative large corpus is available
- **User outcome:** Large collections open and browse smoothly, with changes
  driven by evidence rather than premature caching.
- **Scope:** Establish measurement scenarios (photo count, JPEG dimensions,
  metadata richness, GPS density), scan duration, time to first photo, memory,
  thumbnail cost when MA-FEAT-007 begins, and map-marker cost when MA-FEAT-008 begins.
- **Non-goal:** Persistence implementation before a measured need.

### MA-FEAT-014 — Disposable per-folder metadata index/cache

- **State:** Parked pending MA-FEAT-013 and platform strategy
- **User outcome:** Reopening a previously scanned collection can be faster
  without making the app the source of truth.
- **Proposed boundary:** Derived JSON/cache data is disposable and invalidated
  safely; originals and sidecars remain authoritative. The exact location,
  authorization model, invalidation rules, and schema are open decisions.
- **Dependencies:** A platform-specific storage capability and a clear privacy
  model. The current browser-native core intentionally does not persist folder
  authorization or scan data.
- **Non-goal:** A hidden library database or automatic upload/synchronization.

## Additional media

### MA-FEAT-017 — Videos in the collection sequence

- **State:** Needs research with representative trip videos
- **User outcome:** Photos and short videos from the same experience appear in
  one uninterrupted presentation sequence.
- **Source and order:** Accept an explicit, tested set of top-level video file
  types and interleave readable videos with JPEGs using the same
  case-insensitive natural file-name order. Unsupported or undecodable videos
  must not prevent the rest of the collection from opening.
- **Proposed interaction:** A video appears in the primary media region with a
  restrained player for play/pause and timeline seeking. `K` toggles play and
  pause, `J` seeks 10 seconds backward, and `L` seeks 10 seconds forward, in
  line with the familiar YouTube shortcuts. Existing previous/next navigation
  continues to move between sequence items.
- **Playback lifecycle:** Videos do not autoplay when selected. Leaving a video
  pauses it; choosing another folder releases its object URL and playback
  resources. Seeking clamps safely at the beginning and end.
- **Zoom boundary:** Do not add video zoom/pan in the first video slice. It is
  technically possible to transform a video surface, but playback, seeking,
  codec reliability, and predictable keyboard focus are the demonstrated needs.
  Revisit zoom only after real use shows a need to inspect moving-image detail.
- **Research needed:** Test the actual trip's containers and codecs in the
  packaged Chromium runtime, especially phone-camera exports; choose the first
  supported extension/codec matrix; verify rotation, audio, duration, large-file
  memory behavior, and decode failures; and decide whether embedded video date,
  caption, or GPS metadata enters the initial slice or is deferred.
- **Acceptance checks:** Mixed media retains deterministic file-name order;
  pointer controls and `J`/`K`/`L` work in the packaged app; shortcuts do not
  fire while another applicable control is receiving text input; rapid
  navigation does not leave audio playing; and one bad video is isolated.
- **Non-goal:** Video editing, transcoding, automatic playback, subtitle
  authoring, video zoom/pan, or promising every container and codec.
- **Likely dependencies:** Generalize photo-specific collection/viewer types to
  media items without weakening the JPEG metadata path or lazy resource cleanup.

## Parking lot / future prompts

- A dedicated About/help surface, including shortcuts and a precise privacy/map
  network explanation.
- Timeline, topics, relationships, audio/document media, and multi-folder
  memories, consistent with the long-term product vision.
- Native filesystem integrations only when a narrowly scoped user outcome
  cannot be met by the browser-native core.

## Decision log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-07-25 | Establish this living backlog and lightweight refinement workflow. | The desktop MVP is proven; follow-on ideas need a shared, traceable route from discovery to implementation. |
| 2026-07-25 | Keep mobile, persistent indexing, face regions, and native file actions as discovery/research tracks. | Each changes platform, privacy, storage, or security boundaries and should not be implied by the desktop MVP. |
| 2026-07-25 | Reserve `T` as the working proposal for thumbnail overview, not tags. | It makes the suggested keyboard scheme internally consistent; it remains provisional until MA-FEAT-007 is specified. |
| 2026-09-04 | Replace MA-FEAT-001's modal `Z` concept with map-like direct zoom and pan. | First real trip use showed that shared pointer and focused-keyboard behavior is simpler than a separate image zoom mode. |
| 2026-09-04 | Treat photo, divider, and map as the viewer's spatial focus regions. | A short `Tab`/`Shift`+`Tab` loop preserves the useful keyboard-resizable divider without traversing every transient control. |
| 2026-09-04 | Grow the map through cumulative `G` modes and portable GPX files. | The desired experience connects the current photo, other photos, user-authored points of interest, and traveled tracks while keeping `M` as the map toggle. |
| 2026-09-04 | Default GPX track mode to tracks intersecting the current photo's date and layer specific tracks above broader context tracks. | A whole-trip track and a same-day hike should appear together with a clear visual hierarchy, without clutter from unrelated days. |
| 2026-09-04 | Promote mixed photo/video playback from the parking lot to MA-FEAT-017. | Real trip presentation needs videos in the same explicit file-name sequence, with familiar `J`/`K`/`L` playback controls. |
