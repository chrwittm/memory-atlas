# Memory Atlas Product Backlog

**Status:** Living post-MVP backlog

**Last updated:** 2026-09-14

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
| Next desktop refinements | File actions and further fullscreen reliability | The coherent keyboard model is implemented; the remaining work preserves the viewer while adding carefully scoped OS integration |
| Next exploration views | Thumbnail gallery | Named map-camera scopes and stable cluster drill-down are implemented in source; the next nonlinear view is the remaining exploration priority |
| Media expansion | Videos in the file-name sequence | A demonstrated trip-viewing need that requires codec and playback-boundary research |
| Context and people | Information-overlay modes, technical camera details, tags, filename, and people regions | Keeps useful embedded context close at hand while requiring representative metadata and a calm presentation model |
| Platform and OS integration | Open a Finder folder directly in Memory Atlas; later evaluate Windows Explorer integration | Makes the installed desktop app a natural part of the user's existing folder workflow, but requires a narrow native integration boundary |
| Platform strategy | iPhone and iPad | Requires a product, storage, and distribution decision—not a responsive-CSS-only change |
| Internationalization and localization | Prepare the UI for additional languages, with German as the first likely localization | American English remains the current default; localization should be designed deliberately when it becomes a selected product slice |
| Additional photo context | Elevation at the capture location | Makes embedded GPS altitude useful without requiring a new organizational model |
| Performance and persistence | Disposable scan index/cache | Defer until measured scan cost justifies a new persistence boundary |
| Development and release infrastructure | Representative public demo/test corpus | Public verification should not depend indefinitely on repetitive personal source photos or tiny synthetic fixtures |

### Suggested sequence for the 2026-09-04 field feedback

1. Reproduce and fix MA-BUG-002 before changing the broader keyboard model.
2. Specify and implement MA-FEAT-001 and MA-FEAT-015 together because zoom,
   collection navigation, and region focus share the Arrow keys.
3. MA-FEAT-002/015/018 was implemented and user-tested on 2026-09-12; repeat
   its packaged checks with the next consolidated feature build.
4. MA-FEAT-008/016/024 is implemented in source. Repeat the combined private-
   corpus and packaged checks, including the scope-stable cluster drill-down.
5. Inspect representative trip videos and packaged-runtime codec behavior, then
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

- **State:** Delivered and user-tested 2026-09-12
- **Specification:**
  [`Desktop viewer keyboard navigation`](../product/specifications/features/ma-feat-002-015-018-desktop-viewer-keyboard-navigation.md)
- **User outcome:** I can leave a collection and choose another folder quickly.
- **Accepted interaction:** One unmodified `H` press returns from any viewer
  region or state to the entry screen, leaving fullscreen if needed. The
  existing quiet visible control remains pointer-operable but leaves the viewer
  `Tab` loop.
- **Acceptance checks:** Object URLs are released; current collection and
  transient viewer state are cleared; no files are changed; focus reaches the
  entry-screen folder action.
- **Implementation evidence:**
  [`2026-09-12 verification`](../delivery/verifications/2026-09-12-ma-feat-002-015-018-desktop-viewer-keyboard-navigation.md)
- **Non-goal:** Recent folders or persistent library history.

### MA-FEAT-018 — Quick collection navigation

- **State:** Delivered and user-tested 2026-09-12
- **Specification:**
  [`Desktop viewer keyboard navigation`](../product/specifications/features/ma-feat-002-015-018-desktop-viewer-keyboard-navigation.md)
- **User outcome:** I can quickly inspect a distant part of a large collection,
  jump to its end, or restart at its beginning without stepping through every
  intervening photo.
- **Accepted interaction:** In the photo region, `Page Up` moves ten photos
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
- **Dependency:** Implement with MA-FEAT-015's accepted spatial focus model and
  MA-FEAT-002's `H` route back to folder selection.
- **Implementation evidence:**
  [`2026-09-12 verification`](../delivery/verifications/2026-09-12-ma-feat-002-015-018-desktop-viewer-keyboard-navigation.md)

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

- **State:** Delivered and user-tested 2026-09-12
- **User outcome:** I understand the privacy promise without repeatedly seeing
  a distracting pop-up.
- **Scope:** Review the present entry-screen wording and any repeated runtime
  notice; keep one calm, truthful explanation at folder choice and move fuller
  privacy/map-network details to a future About/help surface.
- **Acceptance checks:** Clearly distinguishes local photos/metadata from map
  tile requests; does not interrupt normal browsing; remains accessible.
- **Non-goal:** A marketing site, account system, or legal policy program.

### MA-FEAT-015 — Minimal viewer focus loop

- **State:** Implemented and user-tested 2026-09-12; packaged verification pending
- **Specification:**
  [`Desktop viewer keyboard navigation`](../product/specifications/features/ma-feat-002-015-018-desktop-viewer-keyboard-navigation.md)
- **User outcome:** I can move predictably between the large interactive areas
  of the viewer without tabbing through every fading on-screen control.
- **Accepted interaction:** In the main viewer, `Tab` and `Shift`+`Tab` cycle
  only through visible interaction regions. With the map closed, the photo is
  the only region. With the map open, the forward order is photo, divider, map;
  reverse traversal uses the opposite order. The no-GPS map placeholder still
  represents the visible map region.
- **Region behavior:** Arrow and `+`/`-` input is dispatched by focus: the photo
  zooms and pans under MA-FEAT-001, the divider keeps its existing Arrow-key
  resizing, and the map uses its normal pan and zoom behavior. The viewer does
  not draw yellow/gold perimeter focus decoration; the divider retains only a
  quiet local handle cue. Global shortcuts remain available from every region.
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
- **Dependencies:** Coordinate keyboard dispatch with MA-FEAT-001 and implement
  with MA-FEAT-002 and MA-FEAT-018 as the accepted combined slice.
- **Implementation evidence:**
  [`2026-09-12 verification`](../delivery/verifications/2026-09-12-ma-feat-002-015-018-desktop-viewer-keyboard-navigation.md)

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
- **Resolved boundary for MA-FEAT-008/016:** Multi-photo and GPX map content
  remains inside the existing split map panel. The general one-panel framework
  is not a prerequisite and still needs its own design before unrelated context
  types are added.
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

- **State:** Implemented in source 2026-09-14; packaged verification pending
- **Specification:**
  [`Multi-photo and GPX map modes`](../product/specifications/features/ma-feat-008-016-multi-photo-and-gpx-map-modes.md)
- **User outcome:** I can understand a folder spatially and jump from a map pin
  to the associated photo.
- **Accepted interaction:** With the map open, `G` and the quiet visible **GPS** control
  cycle through current photo, all photos, and photos plus GPX track. All-photo
  mode distinguishes the current photo, clusters dense or duplicate positions,
  and supports two-way pointer and keyboard selection. All modes share one
  camera: `G` preserves its viewpoint, while photo selection preserves the
  applicable camera scope and manual zoom. Current photo follows the pin;
  temporal scopes refit when their date context changes, and geographic scopes
  switch to an available destination scope at the same level before falling
  back to Current photo at the existing zoom.
- **Acceptance checks:** Metadata is normalized once during scan; photos without
  GPS remain selectable without an invented marker; every located photo remains
  keyboard reachable; the active mode and visible categories are explained
  compactly; attribution/network disclosure remains visible; and source data is
  not uploaded beyond normal basemap requests for the displayed area.
- **Non-goal:** Marker previews, GPS editing, reverse geocoding, a standalone
  map screen, or an offline map.
- **Dependency:** Implement with MA-FEAT-016 under the combined specification.

### MA-FEAT-016 — GPX track overlay

- **State:** Implemented in source 2026-09-14; packaged verification pending
- **Specification:**
  [`Multi-photo and GPX map modes`](../product/specifications/features/ma-feat-008-016-multi-photo-and-gpx-map-modes.md)
- **User outcome:** I can place portable GPX files beside a trip's photos and
  see the traveled path with every located photo as additional map context.
- **Accepted interaction:** The third and final `G` mode adds every drawable
  track from valid top-level `.gpx` files to the all-photo map. Tracks fit with
  photo locations, preserve segment gaps, remain below markers, and are not
  filtered by photo date or time. Missing or invalid tracks leave photo markers
  useful and produce an intentional notice instead of an empty or failed map.
- **Representative finding:** The private Schloss Herrenrunde GPX is valid GPX
  1.1 with one named, 847-point track segment. Every point has valid distinct
  coordinates, elevation, and a parseable nondecreasing timestamp. The updated
  folder's 31 JPEGs all have GPS with distinct coordinates, so the private
  corpus now provides real all-photo selection and track-line coverage;
  controlled fixtures remain necessary for malformed and partial-data cases.
- **Acceptance checks:** Multiple top-level GPX files are parsed locally and in
  isolation; invalid points never create false connecting lines; drawable
  segments render below photo markers; missing photo GPS and missing track data
  remain understandable; and no GPX content or coordinates are directly
  uploaded.
- **Non-goal:** Recording, editing, correcting, or exporting tracks; route
  planning; live location; waypoints, routes, date filtering, elevation
  profiles, or recursively scanning subfolders.
- **Dependency:** Implement with MA-FEAT-008 under the combined specification.

### MA-FEAT-024 — Named map camera scopes

- **State:** Implemented in source 2026-09-14; packaged verification pending
- **Specification:**
  [`Multi-photo and GPX map modes — tester change request`](../product/specifications/features/ma-feat-008-016-multi-photo-and-gpx-map-modes.md#tester-change-request-map-camera-scopes)
- **User outcome:** With the map focused, I can move directly between the
  current photo and meaningful day, surrounding-seven-day, named geographic,
  collection, and complete-track context without manually reconstructing each
  view.
- **Accepted interaction:** Keep `G` as the visible-layer cycle. Map-focused
  `Z` cycles only through Current photo, Day, Complete track, and All photos,
  skipping unavailable stops. `Shift+Z`, `Control+Z`, `Option+Z`, and
  `Command+Option+Z` directly select those four views; plain `Command+Z`
  remains unassigned. Every result receives a brief named toast in the map
  panel. Photo-focused `Z` remains unchanged and reports in the photo panel.
  Stacked **GPS** and **Zoom** controls persistently name both map dimensions;
  GPS cycles content while Zoom opens a grouped menu containing every
  available Focus, Time, Place, and Collection scope.
- **Accepted camera stability:** Photo changes preserve manual zoom and an
  applicable active scope. Current photo follows the new pin without resetting
  zoom; temporal scopes refit when their date context changes, and geographic
  scopes switch to an available destination scope at the same level before
  falling back to Current photo at the existing zoom. This same rule removes
  the fixed-close-zoom reversal after cluster expansion.
- **Accepted scope rules:** Day uses recorded local dates; the former Week scope
  is an inclusive current-date ±3-day window; untimestamped photos and GPX
  points do not participate. Germany and the United States gain locally bundled
  National park, State/Bundesland, and Country boundary scopes. The U.S. ladder
  adds Contiguous United States before the full country through an explicit
  country-specific frame. All photos and Complete track remain
  distinct even when their extents match; earlier visually duplicate scopes
  are skipped. Every named fit expands its base padding to clear measured
  persistent overlays plus a feature-aware gutter.
- **Acceptance direction:** Available scopes cycle deterministically according
  to the mode/scope matrix; direct access matches the corresponding cycle
  result; `Z` never changes the active `G` mode; unavailable direct access is
  explained; geographic matching makes no runtime lookup; and all computation
  retains the local, transient, read-only boundary.
- **Non-goal:** Automatic route/photo matching, runtime reverse geocoding,
  persistent map state, or changing photo zoom behavior.
- **Dependency:** Extend the combined MA-FEAT-008/016 specification, follow
  ADR 0004 for boundary generation and provenance, and verify the three
  features together.
- **Implementation evidence:**
  [`2026-09-14 verification`](../delivery/verifications/2026-09-14-ma-feat-024-named-map-camera-scopes.md)

### MA-FEAT-025 — Geographic context beyond Germany and the United States

- **State:** Idea
- **User outcome:** Named map scopes remain meaningful when a memory is located
  outside the two initially supported countries.
- **Scope:** Add countries deliberately, selecting administrative and
  experience-oriented areas that are locally meaningful rather than assuming
  one universal hierarchy. Consider provinces, regions, national parks, and
  other large protected areas through the same packaged-catalog boundary.
- **Questions to settle:** Which trips demonstrate the next need; authoritative
  boundary sources and redistribution terms; local naming; disputed-boundary
  policy; useful area categories and ordering; and acceptable package size.
- **Non-goal:** Runtime reverse geocoding, downloading an entire global high-
  resolution boundary database, or treating every administrative level as a
  useful memory context.
- **Dependency:** Builds on MA-FEAT-024 and ADR 0004 only after real use selects
  another country or area type.

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

### MA-FEAT-022 — Cycle title, caption, and camera details

- **State:** Needs research with representative photos
- **User outcome:** While presenting photos, I can press `I` repeatedly to choose
  the kind of embedded information shown without opening a separate panel.
- **Proposed interaction:** Replace the current shown/hidden `I` toggle with a
  repeating cycle through (1) no information, (2) title, (3) caption, and
  (4) technical camera details. The technical mode should present the available
  shutter speed, aperture/f-number, ISO, and focal length in a compact,
  Lightroom-like treatment while keeping the photo primary.
- **Mode feedback:** Every `I` press briefly shows the selected mode in the
  existing transient toast pattern used by the `Z` zoom cycle—for example,
  **Photo information · Off**, **Title**, **Caption**, or **Camera details**.
  The toast should also use the established non-disruptive status announcement
  so the active mode is available to assistive technology.
- **Metadata boundary:** Preserve title and caption as distinct normalized
  values when both exist. Each textual mode prefers its matching field but falls
  back to the other: Title mode shows caption when title is missing, and Caption
  mode shows title when caption is missing. Thus a photo with only one textual
  value remains described in both modes rather than unexpectedly appearing
  blank; the mode toast still identifies the selected mode. Research the
  representative Lightroom-exported metadata fields and ExifReader output for
  exposure time, f-number/aperture, ISO, and focal length, including absent,
  malformed, and equivalent vendor-specific values.
- **Questions to settle:** Choose the initial mode for a newly selected folder;
  define the intentional response when neither title nor caption exists; define
  whether the selected mode persists while navigating the current collection;
  and decide where capture time appears now that the existing combined caption-
  and-time overlay becomes several modes. Clarify the visible information
  control's label and state without lengthening the accepted spatial `Tab` loop.
- **Acceptance checks:** `I` advances through the modes in a stable order and
  wraps; the pointer control and keyboard cycle remain synchronized; each change
  produces a short mode toast; title and caption remain semantically distinct
  when both exist, while either one serves as the fallback when the selected
  textual field is absent; camera values are formatted readably with their
  units; missing or invalid metadata never prevents a photo from opening;
  navigation updates the displayed values for the current photo; and no metadata
  is written or uploaded.
- **Non-goal:** Editing metadata, calculating exposure values that are not
  embedded, adding histograms, or turning the overlay into a permanent camera
  inspector.
- **Related work:** Coordinate with MA-FEAT-003 before deciding whether filename
  belongs in the camera-details mode or remains a separate details surface; this
  item does not silently add filename to the requested `I` cycle.

### MA-FEAT-021 — Display photo elevation

- **State:** Needs research
- **User outcome:** When a photo contains reliable elevation metadata, I can
  see how high or low its capture location was as part of the photo's geographic
  context.
- **Source boundary:** Prefer embedded GPS altitude and altitude-reference
  metadata from the original photo. Normalize below-sea-level values correctly
  and distinguish a missing value from zero elevation. A terrain/elevation
  lookup based only on latitude and longitude would introduce a network,
  accuracy, provenance, and caching decision and is not implied by this item.
- **Presentation options to evaluate:** (a) add elevation to a future Details
  surface alongside coordinates and filename; (b) include it as a quiet third
  line in the existing `I` photo-information overlay; or (c) show it as map
  context near the current-photo marker. The first slice should expose one
  consistent value rather than duplicate it across surfaces.
- **Research needed:** Inspect representative photos for EXIF
  `GPSAltitude`/`GPSAltitudeRef`, rational-number decoding, missing reference
  fields, malformed or implausible values, and unit expectations. Decide
  metric/imperial presentation, rounding, localization, and whether the label
  should say elevation or altitude.
- **Acceptance checks:** A valid embedded value is displayed with an explicit
  unit; below-sea-level, zero, missing, and invalid values remain distinct; a
  bad altitude field does not discard otherwise valid coordinates or prevent
  the photo from opening; and no lookup or upload occurs unless a later
  specification explicitly accepts it.
- **Non-goal:** Correcting or writing GPS metadata, deriving terrain elevation
  from a remote service, or treating camera altitude as survey-grade data.

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

## Desktop operating-system integration

### MA-FEAT-020 — Open a folder in Memory Atlas from Finder

- **State:** Needs research
- **User outcome:** In macOS Finder, I can right-click a folder and choose an
  action such as **Open in Memory Atlas** to launch or activate the app and open
  that folder as the current temporary collection.
- **Platform direction:** Design and validate the first integration for macOS.
  Keep folder-opening semantics behind a platform boundary so a comparable
  Windows File Explorer action can be evaluated later without coupling the
  browser-native viewer to macOS APIs.
- **Behavior to define:** What happens when Memory Atlas is closed, already on
  the entry screen, scanning another folder, or displaying a collection with
  transient view state; whether multiple selected folders are rejected or
  handled; and how an empty, inaccessible, or JPEG-free folder is explained.
- **Research needed:** Compare supported macOS mechanisms—including opening a
  folder with the app, a Finder Quick Action/Service, and a Finder extension—for
  discoverability, installation and signing requirements, sandbox implications,
  Electron lifecycle behavior, and maintenance cost. Confirm the best Windows
  analogue separately before promising parity.
- **Privacy and safety:** Validate that the incoming target is a folder; retain
  the existing top-level JPEG filtering and read-only treatment of originals;
  expose only the minimum native capability needed to hand the selected folder
  to the ingestion path; and do not persist access or scan unrelated contents
  implicitly.
- **Acceptance checks:** The Finder action launches or focuses a packaged app;
  opens exactly the chosen folder through the normal filtering, ordering, and
  per-file failure path; produces an understandable empty/error state; handles
  a second request predictably; and never changes source files.
- **Non-goal:** General Finder replacement, recursive browsing, file editing,
  automatic background folder monitoring, or committing to Windows delivery in
  the macOS slice.
- **Likely dependency:** Requires a lasting native-integration architecture
  decision because the renderer currently has no filesystem bridge.

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

## Internationalization and localization

### MA-FEAT-023 — Localize Memory Atlas beyond American English

- **State:** Idea
- **User outcome:** I can use Memory Atlas in my preferred supported language
  without losing the calm, clear experience of the American English interface.
- **Initial direction:** Keep American English as the source and current default
  language. Treat German as the first likely localization, while choosing an
  approach that can support additional languages without redesigning each
  feature.
- **Questions to settle:** When localization becomes a selected slice, define
  the translation-resource and fallback model; locale-aware date, time, number,
  and keyboard-label formatting; language selection and persistence; treatment
  of user-authored metadata; accessibility behavior; and layout verification
  for text expansion.
- **Design boundary:** Localization must preserve the product-wide simplicity
  principle. Avoid exposing language machinery in normal use when the system or
  a quiet preference can provide an obvious result.
- **Non-goal:** Translating the application now, translating user-authored
  captions or source files, or committing to languages beyond German before
  their user need is established.

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

## Development and release infrastructure

### MA-FEAT-019 — Representative public demo and test corpus

- **State:** Needs research
- **Contributor outcome:** A fresh clone contains a compact, rights-cleared photo
  collection that demonstrates Memory Atlas without requiring access to the
  maintainer's personal source-photo folders.
- **Interim position:** The owner considers the existing
  `2026-06-20-Schlossherrenrunde` corpus useful for local testing, even though
  several images are repetitive. Its name may remain in public documentation,
  but the actual JPEGs remain private, read-only, ignored, and must not be
  committed. This item supplies a separate purpose-built public corpus rather
  than deriving one from those photos.
- **Target corpus:** Prefer a small but varied set that covers natural filename
  ordering, captions, capture time, valid/missing GPS, image orientation,
  different dimensions, an unreadable or malformed-metadata outcome, and enough
  visual variety for README screenshots and packaged smoke testing.
- **Distribution boundary:** Store only intentional, checksum-recorded public
  fixture copies in a dedicated tracked directory. Keep original personal
  corpora ignored and read-only. Remove unrelated EXIF/XMP/IPTC fields, reduce
  dimensions and file size to a documented budget, and include provenance and
  reuse terms for every image.
- **Acceptance checks:** The fixture works in a fresh clone; exercises the stated
  metadata and viewer paths; contains no unreviewed faces, plates, documents,
  coordinates, device identifiers, or editing history; has deterministic
  checksums; and is small enough for ordinary Git rather than Git LFS.
- **Non-goal:** Treating fixture publication as consent to upload arbitrary user
  folders, replacing focused synthetic unit fixtures, or modifying the original
  Schlossherrenrunde photos.

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
| 2026-09-07 | Track a compact public demo/test corpus separately from personal source-photo folders. | The current real corpus is useful but repetitive; public verification and screenshots need intentional rights, privacy, metadata, and repository-size boundaries. |
| 2026-09-12 | Add Finder folder launch as a macOS-first native integration research item, with Windows parity deferred. | Opening an existing photo folder from its normal filesystem context would shorten the path into Memory Atlas, but the secure platform mechanism must be selected deliberately. |
| 2026-09-12 | Add embedded photo elevation as a context-display research item without selecting its UI surface. | Elevation can enrich place context, but representative metadata, units, validity handling, and its relationship to the information overlay, details, and map need refinement first. |
| 2026-09-12 | Add an `I`-key information cycle for off, title, caption, and technical camera details, with transient mode feedback and reciprocal title/caption fallback. | Some photos carry distinct titles and captions while others use only one field; the available text should remain visible in either textual mode, and a Lightroom-like camera summary makes useful embedded exposure context available without permanently cluttering the viewer. |
| 2026-09-12 | Add future internationalization and localization, with American English as the source/default language and German as the first likely localization. | Memory Atlas should eventually serve users in additional languages, but localization is an idea rather than accepted near-term scope and needs deliberate formatting, accessibility, fallback, and layout decisions. |
| 2026-09-13 | Accept MA-FEAT-008 and MA-FEAT-016 as one slice with exactly three `G` modes: current photo, all photos, and photos plus GPX track. | A single cumulative cycle in the existing map panel keeps spatial exploration direct and understandable while sharing selection, camera, legend, and ingestion behavior. |
| 2026-09-13 | Show every drawable top-level GPX track in the third mode and defer waypoints, routes, and date-based filtering. | The selected interaction calls for one track layer rather than separate GPX submodes; the representative source is one timed track without waypoints or routes, so additional modes and inferred date grouping are not justified in this slice. |
| 2026-09-14 | Add MA-FEAT-024 as an in-refinement change request to MA-FEAT-008/016: map-focused `Z` should provide named camera scopes, while `G` continues to control visible layers. | Tester use validated the three map-content modes but created a repeated need to recover current-photo, temporal, geographic, collection, and track framing without manual zoom. |
| 2026-09-14 | Keep the post-cluster selection camera rule open and document that the current zoom reversal is product-owned rather than imposed by MapLibre. | MapLibre calculates cluster expansion, but Memory Atlas currently forces zoom 15 after marker selection; real use shows that these two individually reasonable rules may form a contradictory drill-down. |
| 2026-09-14 | Accept MA-FEAT-024 with mode-dependent camera scopes and direct shortcuts for Current photo, Day, and Complete track while leaving plain `Command+Z` unassigned. | Only framing currently drawn layers keeps `G` and camera scope conceptually separate, while direct access avoids taking over macOS Undo. The later release-candidate refinement narrows the plain-key cycle and adds an explicit Command+Option combination. |
| 2026-09-14 | Replace calendar Week with a rolling current-date ±3-day photo window and use recorded local wall-clock dates without GPX time matching. | A centered seven-day context follows the current experience across arbitrary week boundaries and does not imply timezone precision absent from typical photo metadata. |
| 2026-09-14 | Package real German and U.S. country, state/Bundesland, and national-park boundaries locally; track further country-specific context as MA-FEAT-025. | Real polygons produce meaningful place framing without runtime geocoding. Parks and administrative areas may overlap, so they form a deterministic context ladder rather than a false universal hierarchy. |
| 2026-09-14 | Replace forced photo-change zoom resets with scope-aware camera stability, place feedback in its owning panel, make collection navigation universal across photo and map focus, and add Contiguous United States before the full-country frame. | Hands-on multi-day and U.S. testing showed that spatial context should remain stable until the user selects another scope or navigation changes that scope's underlying day or area. |
| 2026-09-14 | Fall back from an exited geographic scope to Current photo at the existing zoom, and expose stacked GPS and Zoom controls. | A pin silently leaving a park or country frame made the retained scope misleading; explicit persistent labels keep content and camera state understandable while the zoom-preserving fallback avoids disruptive reframing. |
| 2026-09-14 | Preserve the active geographic level across named areas, using Current photo only when no same-level destination exists. | Flight sequences commonly cross states or countries; Washington-to-Oregon should remain a State-level journey, while leaving a park for a place without a park still needs the clear Current-photo fallback. |
| 2026-09-14 | Make named camera fits overlay-aware while keeping Complete track track-owned. | A tall flight-and-driving track exposed that capped generic padding could leave route geometry or an in-scope marker beneath attribution and other persistent map UI; adding arbitrary current photos to the track extent would instead destabilize or greatly widen the view. |
| 2026-09-14 | Reduce the map-focused `Z` cycle to Current photo, Day, Complete track, and All photos; expose every available scope through a grouped Zoom menu and add `Command+Option+Z` for All photos. | Eight or more dynamic stops made repeated cycling tedious. A short primary cycle keeps frequent keyboard access simple, while grouped direct selection preserves useful seven-day and geographic scopes without a configuration screen. |
