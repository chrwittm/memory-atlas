# MA-FEAT-001 — Image zoom and pan

**Status:** Implemented and user-tested

**Last updated:** 2026-09-04

**Backlog item:** `MA-FEAT-001`

## User outcome

While viewing a photo, the user can inspect a detail such as text on a sign and
then return to the calm fitted presentation without leaving Memory Atlas or
losing the inspected place.

## Scope

The main photo viewer gains direct zoom and pan for readable JPEGs in both its
full-width and split-screen map layouts.

This specification uses three named views:

- **Fitted view:** The complete photo is scaled uniformly to fit inside the
  current photo region without cropping or distortion. Its fitted percentage is
  the smaller of the available-width/intrinsic-width and available-height/
  intrinsic-height ratios. One dimension touches the region boundary; empty
  space caused by a different photo and viewport aspect ratio is unavoidable,
  but the user cannot zoom out farther to create additional empty canvas. This
  is the minimum scale and the default for a photo that has not been viewed
  before.
- **Native 100% view:** The decoded JPEG is rendered at its intrinsic pixel
  dimensions, so one JPEG image pixel corresponds to one CSS layout pixel. This
  percentage is independent of the viewport and remains 100% when the photo
  region changes size.
- **Remembered custom view:** The most recent directly chosen zoom scale and
  detail focal point for that photo, when its scale is distinct from both the
  fitted and native 100% views.

The normal zoom-in limit is **400% of the JPEG's native scale**: four times its
intrinsic width and height, independent of the fitted scale. When the fitted
percentage is below 400%, the legal direct-zoom range runs from that fitted
percentage through 400%. If fitting a small JPEG already requires more than
100%, the native 100% view is below the legal minimum and is unavailable. If
fitting requires 400% or more, the fitted view remains valid but no further
enlargement is available; the fit requirement takes precedence over the normal
zoom-in cap.

Zoom and pan state is transient and belongs to each photo in the current folder
session. For each photo, Memory Atlas remembers:

- its current named view;
- its detail focal point; and
- its most recent distinct custom scale, when one has been established.

A previously unseen photo starts fitted. Navigating away and back restores that
photo's active view. If the user toggled the photo to fit before navigating,
returning shows it fitted and the native and remembered custom views remain
available through the zoom-view cycle. Choosing another folder clears all
remembered views.

## Interaction

### Pointer and trackpad

- A mouse wheel or trackpad zoom gesture over the photo changes its scale.
- Pointer-driven zoom keeps the image point beneath the pointer in the same
  screen position, subject to edge clamping.
- Primary-button drag pans an enlarged photo. Dragging at the fitted scale has
  no effect.
- In the fitted view, the photo surface keeps the normal cursor because it
  cannot be panned. In any enlarged view, the photo surface uses the standard
  open-hand **grab** cursor to signal that it can be moved. While the user is
  actively dragging the photo, it changes to the closed-hand **grabbing**
  cursor and returns to **grab** when the drag ends or is cancelled.
- A primary-button double-click advances through the same available named views
  as the `Z` shortcut: fitted, native 100%, remembered custom, then fitted.
- The existing left- and right-edge controls always navigate to the previous or
  next photo, including while the current photo is enlarged.

Wheel, trackpad, drag, and double-click input is scoped to the photo surface. It
must not zoom or pan the map. Map interaction retains the existing MapLibre
behavior when the pointer is over the map. Buttons and other interactive
controls layered over the photo keep their existing pointer feedback rather
than inheriting the photo surface's grab or grabbing cursor.

### Keyboard

When the photo region has keyboard focus:

| Key | Fitted photo | Enlarged photo |
| --- | --- | --- |
| `+` | Zoom in around the center | Zoom in around the center |
| `-` | No effect at the minimum | Zoom out around the center |
| Left Arrow | Previous photo | Pan left |
| Right Arrow | Next photo | Pan right |
| Up Arrow | No effect | Pan up |
| Down Arrow | No effect | Pan down |
| `Z` | Advance to the next available named view | Advance to the next available named view |

Keyboard zoom preserves the image point currently at the center of the photo
region. Arrow-key panning changes that focal position. Key repeat may continue a
zoom or pan action, but crossing a pan boundary must not turn a Left or Right
Arrow press into photo navigation. Collection navigation with those keys becomes
available only after the photo reaches the fitted scale.

The `Z` shortcut and double-click invoke the same per-photo cycle:

```text
Fitted view -> Native 100% view -> Remembered custom view -> Fitted view
```

Only distinct, legal views participate. Native 100% is skipped when it is at or
below the fitted minimum. The remembered custom view is skipped until direct
zoom has established a legal scale distinct from fit and 100%. If only fitted
and native 100% are available, they form a two-view cycle; if no other view is
available, the action has no effect.

Using `Z` briefly displays a centered status toast naming the selected view:
fitted view, native 100%, or custom with its rounded zoom percentage. The toast
clears after approximately one second and does not appear for double-click
cycling, which keeps pointer interaction visually quiet.

Direct wheel, trackpad, or keyboard zoom establishes or updates the remembered
custom scale whenever it stops away from fit and 100%. Panning updates the
photo's detail focal point. Entering native 100% or the remembered custom view
centers that focal point as closely as the pan bounds permit; before the user
has chosen one, it is the center of the image. The fitted view always centers
the complete image but does not erase the detail focal point.

These named views are presets, not separate modal interaction states: direct
zoom and pan remain available whenever the photo is the active interaction
region.

Keyboard dispatch follows
[`MA-FEAT-015`](../../../planning/backlog.md#ma-feat-015--minimal-viewer-focus-loop):
the photo receives these inputs when its region has focus, the divider keeps its
resize keys, and the map keeps its own controls. Existing global shortcuts such
as `I`, `M`, `F`, and `Escape` remain available.

### Bounds and viewport changes

Panning is clamped on each axis. Where the enlarged image is larger than the
photo region, it may move only until its edge meets the corresponding region
edge. Where it is smaller, it stays centered on that axis. Panning can therefore
never reveal additional empty canvas beyond the letterboxing or pillarboxing
inherent in fitting the photo.

Opening or closing the map, resizing the split, entering or leaving fullscreen,
or resizing the window recalculates the fitted scale. A fitted photo remains
fitted. While they remain legal, native 100% stays at the JPEG's intrinsic scale
and a remembered custom view retains its JPEG-relative percentage. Both
enlarged views retain the same logical focal point as closely as the new bounds
permit before being clamped to valid pan bounds. If a viewport change raises
the fitted minimum above the active or remembered scale, that view is clamped
to fit and any now-duplicate or illegal cycle entry is skipped.

Decode-error and read-error states are not zoomable. Their existing navigation
and recovery behavior remains unchanged.

## Acceptance criteria

1. Every newly encountered readable photo initially shows completely, without
   cropping or distortion, at its fitted minimum scale.
2. The user can zoom continuously from the fitted minimum through 400% of the
   JPEG's intrinsic dimensions and cannot exceed either bound, except that a
   fitted scale already at or above 400% remains valid and cannot be enlarged.
3. Pointer-driven zoom retains the image point under the pointer unless clamping
   at an image edge makes that impossible; keyboard zoom retains the centered
   image point.
4. Pointer drag and the Arrow keys pan an enlarged photo, with bounds that never
   expose unintended empty canvas.
5. The photo surface shows the normal cursor when fitted, the grab cursor when
   enlarged and available to pan, and the grabbing cursor only during an active
   drag; overlaid interactive controls retain their appropriate pointer cursor.
6. At fitted scale, Left and Right Arrow navigate the collection. At any
   enlarged scale, all Arrow keys are reserved for panning and never cause an
   incidental photo change, including at a pan boundary.
7. `Z` and primary-button double-click cycle through the distinct legal fitted,
   native 100%, and remembered custom views in that order, skipping unavailable
   or duplicate entries. `Z` briefly identifies the resulting mode and custom
   percentage in a centered status toast.
8. The active named view, detail focal point, and remembered custom scale are
   retained independently per photo while browsing the current folder and are
   discarded when that folder session ends.
9. Opening, closing, or resizing the map and changing the window or fullscreen
   dimensions preserve a valid, predictable photo view under the recalculation
   rules above.
10. Photo zoom input does not operate the map, map input does not operate the
   photo, and the existing divider and global keyboard shortcuts continue to
   work.
11. Zoom and pan work in both the browser build and packaged macOS app without
    modifying, replacing, or uploading the source JPEG.
12. Focused keyboard operation has a visible focus indication as defined by
    MA-FEAT-015, and all zoom/pan behavior is usable without a pointer.
13. Automated tests cover scale clamping, pointer anchoring, pan clamping,
    cursor-state changes, keyboard/navigation dispatch, per-photo restoration,
    viewport changes, and cleanup when the folder session ends. A manual
    packaged-app check covers mouse-wheel, trackpad, and drag-cursor feel with
    representative large JPEGs.

## Non-goals

- Image editing, cropping, rotation, annotation, or metadata changes
- Persisting zoom or pan state after the current folder session
- A navigator/minimap, loupe, pixel grid, or displayed zoom-percentage control
- Touch-specific gestures or mobile behavior
- Zoom and pan for videos, the map, error placeholders, or future thumbnail
  views
- Changing the existing photo sequence or pointer edge-navigation controls

## Product, privacy, and platform boundaries

Zoom and pan operate only on the already loaded local display image. They add no
network requests, uploads, derived image files, database, cache, or changes to
the originals. The accepted platform remains the browser-native Svelte core and
the packaged macOS Electron application; other desktop and mobile platforms
remain deferred.

## Dependencies and decisions

- This feature refines
  [`MA-FEAT-001`](../../../planning/backlog.md#ma-feat-001--image-zoom-and-pan).
- Keyboard focus and dispatch are coordinated with
  [`MA-FEAT-015`](../../../planning/backlog.md#ma-feat-015--minimal-viewer-focus-loop)
  and should be implemented in the same slice.
- Existing lazy object-URL and image-decoding behavior must remain intact.
- The accepted [MVP specification](../mvp.md) remains the baseline for photo
  fitting, navigation, map mode, fullscreen, error isolation, and source-file
  handling.
- No new architecture decision is required. The feature adds transient viewer
  interaction state without changing the accepted stack, persistence boundary,
  privacy model, or platform decision.

## Open questions

None blocking implementation. The feel of the 400%-of-native limit, zoom
increments, and keyboard pan distance should be tuned with representative large
JPEGs without changing the interaction and boundary rules in this
specification.

## Implementation record

Implemented on 2026-09-04. Image-relative geometry and per-photo session state
live behind a typed viewer boundary; the Svelte viewer applies the calculated
size and position to the decoded local image. Direct zoom, drag and keyboard
pan, named-view cycling, focused keyboard dispatch, responsive recalculation,
and teardown are covered by automated tests. No dependency or architecture
change was required.
