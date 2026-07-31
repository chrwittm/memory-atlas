# Memory Atlas Product Backlog

**Status:** Living post-MVP backlog  
**Last updated:** 2026-07-25  
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
| Next desktop refinements | Zoom, Home, file actions, calmer privacy wording | High value while preserving the present single-photo viewer |
| Next exploration views | Thumbnail gallery and all-photo map | Natural extensions of the existing temporary collection and shared selection |
| Context and people | Tags, filename, people regions | Depends on representative metadata and an intentional side-panel model |
| Platform strategy | iPhone and iPad | Requires a product, storage, and distribution decision—not a responsive-CSS-only change |
| Performance and persistence | Disposable scan index/cache | Defer until measured scan cost justifies a new persistence boundary |

## Candidate next slice: desktop viewer essentials

These are narrow, valuable changes that can be specified and delivered without
changing the local-first model.

### MA-FEAT-001 — Image zoom and pan

- **State:** Ready to specify
- **User outcome:** While viewing a photo, I can inspect a detail such as text
  on a sign without leaving Memory Atlas.
- **Proposed interaction:** `Z` enters/exits zoom mode. Mouse-wheel or
  trackpad pinch changes scale; click-drag pans while enlarged. A visible quiet
  control and a compact hint make the mode discoverable. Resetting returns to
  the fitted, uncropped image.
- **Questions to settle:** Should the first `Z` use a fixed useful scale or
  center on the pointer? Should double-click also toggle zoom? What minimum and
  maximum scale feel useful with very large JPEGs?
- **Acceptance checks:** Fitted view remains the default; zoom never modifies
  source files; panning cannot expose an empty canvas unintentionally; keyboard
  photo navigation remains predictable; reduced-motion and touch behavior are
  considered.
- **Non-goal:** Image editing, crop, annotation, or permanently saving a zoom
  position.
- **Likely dependencies:** Viewer interaction state and object-URL/image-decoding
  behavior need regression tests.

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
- **Proposed interaction:** A map overview renders every photo with valid GPS,
  with a clear selected-photo state. Clicking a pin changes the current photo;
  selecting a photo updates the map. Clustering is considered for dense sets.
- **Questions to settle:** Entry point and relationship to MA-FEAT-006; initial
  viewport (fit all points versus current photo); duplicate coordinates;
  filtering/photos without GPS; marker previews; and keyboard access.
- **Acceptance checks:** Metadata is normalized once during scan; two-way
  selection is reliable; map attribution/network disclosure remains visible;
  no photo or metadata is uploaded beyond normal map-tile location requests.
- **Non-goal:** Route recording, editing GPS, or an offline map.

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

## Parking lot / future prompts

- A dedicated About/help surface, including shortcuts and a precise privacy/map
  network explanation.
- Timeline, topics, relationships, non-JPEG media, and multi-folder memories,
  consistent with the long-term product vision.
- Native filesystem integrations only when a narrowly scoped user outcome
  cannot be met by the browser-native core.

## Decision log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-07-25 | Establish this living backlog and lightweight refinement workflow. | The desktop MVP is proven; follow-on ideas need a shared, traceable route from discovery to implementation. |
| 2026-07-25 | Keep mobile, persistent indexing, face regions, and native file actions as discovery/research tracks. | Each changes platform, privacy, storage, or security boundaries and should not be implied by the desktop MVP. |
| 2026-07-25 | Reserve `T` as the working proposal for thumbnail overview, not tags. | It makes the suggested keyboard scheme internally consistent; it remains provisional until MA-FEAT-007 is specified. |
