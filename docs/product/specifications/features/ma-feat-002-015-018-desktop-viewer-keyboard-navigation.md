# MA-FEAT-002, MA-FEAT-015, and MA-FEAT-018 — Desktop viewer keyboard navigation

**Status:** Implemented and user-tested; next packaged build deferred

**Last updated:** 2026-09-12

**Backlog items:** `MA-FEAT-002`, `MA-FEAT-015`, `MA-FEAT-018`

## User outcome

While viewing a collection, the user can move quickly to a distant photo or a
collection boundary, move predictably between the photo and map interaction
regions, and return to folder selection without traversing every fading viewer
control.

The keyboard model should feel spatial and calm: `Tab` moves right,
`Shift`+`Tab` moves left, shortcuts remain available wherever they make sense,
and keyboard focus does not draw a yellow or gold frame around the content.

## Scope

This specification combines three small, interdependent desktop-viewer changes:

- `MA-FEAT-018` adds ten-photo and collection-boundary navigation to the photo
  region with `Page Up`, `Page Down`, `Home`, and `End`.
- `MA-FEAT-015` replaces the viewer's control-by-control tab order with a
  circular focus loop over its visible spatial interaction regions.
- `MA-FEAT-002` makes the existing return-to-entry action available through
  the global `H` shortcut before shortcut-backed viewer controls leave the tab
  order.

The feature applies to the main viewer after a folder has loaded. The entry,
loading, empty, and folder-error screens retain their normal control-focused
keyboard order and visible focus treatment.

## Interaction

### Spatial focus loop

The main viewer has at most three spatial interaction regions:

1. **Photo** — the current photo surface, including its readable-photo and
   per-photo error states.
2. **Divider** — the resize handle between the photo and map, only while that
   divider is visible.
3. **Map** — the map side of the split view, including loading, network-error,
   and no-GPS placeholder states.

When the map is closed, the photo is the only region. `Tab` or `Shift`+`Tab`
therefore keeps focus on the photo.

In the desktop split layout, traversal is circular:

```text
Tab:         Photo -> Divider -> Map -> Photo
Shift+Tab:   Photo -> Map -> Divider -> Photo
```

`Tab` always moves one visible region to the right, and `Shift`+`Tab` always
moves one visible region to the left. Neither direction escapes from the viewer
into fading controls, browser chrome, or an invisible element.

If the existing narrow stacked layout is active, the hidden divider is omitted
and the forward order follows the visible document order: photo, map, then
photo. Touch-specific or mobile navigation remains outside this feature.

The photo receives focus when the viewer first opens. Changing photos retains
the active region. Opening the map retains photo focus; closing it while the
divider or map is focused moves focus safely to the photo. The same rule
applies when `Escape` closes the map. Focus must never remain on an element that
has been removed or hidden.

Pointer interaction updates the active region without creating a second focus
model: clicking or dragging the photo, divider, or map focuses that region.
Activating a shortcut-backed viewer control with the pointer returns focus to
the region that owns the resulting interaction. In particular, previous/next,
information, and map controls return focus to the photo; returning to the entry
screen focuses its primary folder action.

### Viewer controls and embedded map UI

The viewer's fading previous, next, choose-folder, information, and map buttons
do not participate in sequential `Tab` navigation. They remain pointer
operable, keep their accessible names and tooltips, and retain these keyboard
routes:

| Visible action | Keyboard route |
| --- | --- |
| Previous or next photo | Left/Right Arrow at fitted scale; quick navigation below at every scale |
| Choose another folder | `H` |
| Show or hide information | `I` |
| Open or close the map | `M` |

At enlarged photo scales, Left and Right Arrow continue to pan under
`MA-FEAT-001`; returning to fitted view with `Z` restores exact one-photo Arrow
navigation. This feature does not reassign those accepted zoom-and-pan keys.

The map is one focus stop. MapLibre's embedded navigation buttons, canvas, and
attribution links do not add stops to the spatial loop. With the map region
focused, the map retains its normal Arrow and `+`/`-` keyboard behavior. Map
attribution remains visibly rendered, pointer-operable, and available to
assistive technology as part of the map region, but its links do not enter the
viewer `Tab` loop.

### Region-specific and global keyboard dispatch

Keyboard input is dispatched according to the active region:

| Key | Photo focus | Divider focus | Map focus |
| --- | --- | --- | --- |
| Left/Right Arrow | Navigate when fitted; pan when enlarged | Resize by the established two-percentage-point step | Pan the map |
| Up/Down Arrow | Pan when enlarged; otherwise no effect | No effect | Pan the map |
| `+` / `-` | Zoom the photo | No effect | Zoom the map |
| `Z` | Cycle the photo's named views | No effect | No effect |
| `Home` / `End` | First/last photo | Set the existing 20/80 or 80/20 split | No collection action |
| `Page Up` / `Page Down` | Jump through the collection | No collection action | No collection action |

`Tab` and `Shift`+`Tab` always control the spatial focus loop rather than a
region's internal behavior. Existing global shortcuts—`H`, `I`, `M`, `F`, and
the established `Escape` priority—remain independent of the active region.

Only unmodified shortcut presses invoke collection or viewer actions. `Tab`
uses `Shift` only to reverse direction; `Control`, `Option`/`Alt`, `Command`/
Meta, or composing text must not accidentally invoke the shortcuts. Key repeat
is allowed for `Page Up` and `Page Down` and retains the existing behavior of
repeatable region controls.

### Quick collection navigation

With the photo region focused, the new navigation keys operate on positions in
the case-insensitive natural file-name sequence:

| Key | Action |
| --- | --- |
| `Page Up` | Select the photo ten positions earlier |
| `Page Down` | Select the photo ten positions later |
| `Home` (`Pos1`) | Select the first photo |
| `End` | Select the last photo |

A ten-photo jump clamps to the first or last photo when fewer than ten
positions remain. A key press at its applicable boundary keeps the current
photo selected and does not wrap. The shortcuts work for fitted and enlarged
photos and for a current photo that cannot be read or decoded.

After a jump, the photo, position indicator, information overlay, and current
map content all represent the newly selected item. Map-open, information,
fullscreen, and divider-width preferences remain unchanged. The destination
photo restores its own transient fitted, native, or custom view under
`MA-FEAT-001`; jumping does not copy the source photo's view state to it.

Repeated quick navigation must not queue stale transitions or move beyond the
collection boundary. It adds no new pointer button, numeric jump dialog, or
intermediate loading screen.

### Return to the entry screen

An unmodified `H` press anywhere in the main viewer performs the existing
**Choose another folder** action in one step. It works with any interaction
region focused, at any photo zoom, with the map open, and in fullscreen.

One press closes the current collection and returns to the entry screen. It
also leaves fullscreen when necessary; the user is never required to press `H`
twice to get back to folder selection. The entry screen's **Choose photo
folder** action receives keyboard focus.

The action clears the current collection, current-photo position, map state,
split width, information preference, notices, active focus region, and all
per-photo zoom and pan state. It disposes the map and revokes the collection's
object URLs. It never changes, moves, or deletes a source file.

### Focus appearance

Keyboard focus in the viewer must not add a yellow or gold outline, inset
border, box shadow, or full-height line around the photo, divider, map, or any
shortcut-backed viewer control.

The photo and map remain visually undecorated when focused so the media stays
primary. The focused divider may use its existing quiet handle emphasis—such
as a modest change in handle width or muted color—because its Arrow-key effect
otherwise has no visible affordance, but it must not draw a colored line across
the full viewer height.

Focus remains real DOM focus and each region retains a clear role and
accessible name so assistive technology can identify it. Operating-system
forced-color or high-contrast focus treatment must not be suppressed. Focus
styling on the entry, loading, empty, and error screens is unchanged.

## Acceptance criteria

1. With the map closed, the viewer has exactly one sequential focus stop: the
   photo. `Tab` and `Shift`+`Tab` keep focus there.
2. With the desktop split visible, repeated `Tab` follows photo, divider, map,
   photo; repeated `Shift`+`Tab` follows the exact reverse loop.
3. Loading, failed, and no-GPS map states occupy the same map position in the
   loop, while a visually hidden divider is omitted.
4. Viewer buttons and MapLibre descendants do not lengthen the `Tab` loop; the
   visible actions retain their documented pointer and keyboard routes,
   accessible names, and tooltips.
5. Opening and closing the map, changing photos, and using the pointer never
   leaves focus on a hidden or removed element or creates an ambiguous second
   active region.
6. Each region receives only its documented Arrow, zoom, `Home`, `End`, and
   collection-navigation behavior; global viewer shortcuts remain available
   from every region.
7. `Page Up` and `Page Down` move exactly ten positions when possible and clamp
   at the collection boundaries; key repeat never crosses a boundary.
8. With photo focus, `Home` selects the first photo and `End` the last at any
   zoom scale. With divider focus, the same keys retain their established split
   resizing behavior and never change photos.
9. Quick jumps preserve natural file-name order and synchronize the photo,
   counter, information, map or no-GPS state, and destination photo's remembered
   view without changing unrelated viewer preferences.
10. `H` returns from any viewer state to the entry screen with one press,
    leaves fullscreen if needed, clears all session state, disposes map
    resources, revokes object URLs, and focuses **Choose photo folder**.
11. No normal viewer focus state displays the current yellow/gold perimeter
    treatment. The divider retains only a quiet local handle cue, while forced
    colors and non-viewer screen focus styling continue to work.
12. Automated tests cover both focus-loop directions and wrapping; map state
    changes; excluded controls; region-specific dispatch; ten-photo jumps,
    boundaries, and repeat; `Home`, `End`, and `H`; session cleanup; and focus
    appearance selectors.
13. A packaged macOS check verifies the physical `Page Up`, `Page Down`,
    `Home`/`Pos1`, and `End` keys; both loop directions; map keyboard control;
    one-press return from fullscreen; and the absence of yellow viewer outlines
    with representative photos.

## Non-goals

- A thumbnail overview, filmstrip, arbitrary numeric jump, or search dialog
- New pointer controls for ten-photo or collection-boundary navigation
- Changing the accepted image zoom, pan, or named-view behavior
- Wrapping the photo sequence when navigating the collection
- Redesigning, removing, or permanently revealing the fading viewer controls
- Recent folders, persistent libraries, or restoring a folder after relaunch
- Touch-specific gestures or a mobile navigation redesign
- A general shortcut customization system

## Product, privacy, and platform boundaries

The feature changes transient viewer navigation only. It does not add storage,
network requests, telemetry, uploads, native filesystem privileges, or changes
to original photos. The optional map retains its existing network and
attribution behavior.

The acceptance target is the browser-native Svelte viewer in the packaged
macOS Electron application. The narrow responsive layout should remain usable,
but phone, tablet, Windows, and Linux interaction design remains deferred.

## Dependencies and decisions

- This specification accepts and combines
  [`MA-FEAT-002`](../../../planning/backlog.md#ma-feat-002--return-to-entry-screen),
  [`MA-FEAT-015`](../../../planning/backlog.md#ma-feat-015--minimal-viewer-focus-loop),
  and
  [`MA-FEAT-018`](../../../planning/backlog.md#ma-feat-018--quick-collection-navigation)
  as one implementation slice because their shortcut and focus dispatch must
  agree.
- [`MA-FEAT-001`](ma-feat-001-image-zoom-and-pan.md) remains authoritative for
  photo zoom, pan, fitted-scale Arrow navigation, and per-photo view state.
- The accepted [MVP specification](../mvp.md) remains the baseline. This
  post-MVP specification deliberately replaces the current viewer's
  control-by-control tab order and yellow/gold focus treatment while preserving
  normal focus behavior outside the viewer.
- No architecture decision is required. The work changes Svelte interaction
  behavior and styling without changing the accepted stack, security boundary,
  persistence model, or platform decision.
- Update the user guide and the packaged-app keyboard checklist in the same
  implementation change; they continue to describe the shipped behavior until
  this specification is implemented.

## Open questions

None blocking implementation.
