# MA-FEAT-008, MA-FEAT-016, and MA-FEAT-024 — Multi-photo and GPX map modes

**Status:** Implemented and verified in packaged 0.3.0

**Last updated:** 2026-09-14

**Backlog items:** `MA-FEAT-008`, `MA-FEAT-016`, `MA-FEAT-024`

## User outcome

While keeping the current photo visually primary, the user can move between a
precise location view, a spatial overview of every located photo, and that same
overview with the traveled GPX path. A photo marker can become the current
photo, and normal photo navigation updates the selected marker.

The map remains one contextual panel rather than becoming a separate screen or
dashboard.

Tester use of the source implementation on 2026-09-14 confirmed that the
three content modes, `G` cycle, and initial fitting are useful. It also exposed
the need for named map-camera scopes through `Z`. A second test pass clarified
that camera movement must follow the active scope instead of every photo change,
that transient feedback belongs to the affected panel, that collection keys
should remain universal, and that the United States benefits from a contiguous-
states frame before the complete country. The camera add-on in
[`Tester change request: map camera scopes`](#tester-change-request-map-camera-scopes)
now incorporates those refinements in source.

## Scope

This specification combines the two features because they share one map-mode
cycle, camera model, legend, marker-selection model, and folder-ingestion
boundary.

While the map is open, it has exactly three cumulative modes:

1. **Current photo** — the existing one-photo location view.
2. **All photos** — every photo in the selected folder with valid embedded GPS.
3. **Photos + GPX track** — the all-photo view plus every drawable track from
   valid top-level `.gpx` files in the selected folder.

`M` continues to open or close the map. `G` changes the content of an open map;
it does not open the map itself. The same three-mode cycle is available through
the quiet **GPS** pointer control in the map panel.

The selected folder remains one temporary collection. JPEG metadata and GPX
files are read once when the folder is selected, normalized behind typed
ingestion boundaries, and discarded when the folder session ends. Source files
remain unchanged.

## Interaction

### Opening, closing, and changing modes

The first time the map opens for a selected folder, it starts in **Current
photo**, preserving the accepted 80/20 photo-to-map split. A `G` press without
Control, Option/Alt, or Command/Meta while the map is visible advances one step
and wraps:

```text
Current photo -> All photos -> Photos + GPX track -> Current photo
```

Holding `G` does not race through modes; repeated keydown events are ignored.
`G` has no effect while the map is closed, while Control, Option/Alt, or
Command/Meta is pressed, or while text composition is active. Shift may produce
an uppercase `G` and does not reverse the cycle.

A single compact **GPS** content control shows the active mode by name and advances
the same cycle when clicked. It has an accessible name, exposes its current
state, and is omitted from the viewer's spatial `Tab` loop because `G` provides
the equivalent keyboard action. Each change is also announced through a
non-disruptive live status. The control, legend, notices, and attribution must
not compete with one another or obscure map content.

The active mode persists when the map is closed and reopened and while the user
navigates the current folder. Choosing another folder resets it to **Current
photo**. `Escape`, fullscreen, split resizing, and the photo/divider/map focus
loop retain their accepted behavior.

The cycle always contains all three modes, even when a mode has no data. A
missing layer produces the intentional state defined below; modes are not
silently skipped, so the control and `G` always agree.

### Current-photo mode

This mode preserves the accepted MVP behavior:

- A located current photo is shown with one selected-photo marker, and changing
  to another located photo recenters the map only while **Current photo** is the
  active camera scope. That follow preserves the current zoom; pressing `Z` to
  choose Current photo explicitly restores the established close zoom.
- A current photo without valid GPS replaces the map canvas with **This photo
  doesn’t have GPS coordinates.** Map mode remains open.
- Other photo markers and GPX tracks are not shown.

### All-photo mode

Every photo with valid normalized GPS is represented. The current photo uses a
selected treatment only when it has valid GPS; an unlocated current photo does
not hide the other located photos or create a marker at an invented position.

Changing to this mode adds the other located-photo markers without changing the
map center or zoom. All three modes share one camera for as long as the map is
open; `G` changes visible layers, not the viewpoint. The map does not impose a
separate fitted overview, so the user can zoom out when they want to see more of
the collection and return to close photo navigation simply by selecting a
located photo.

Changing the current photo updates marker selection without automatically
discarding the active camera. Current-photo scope follows the pin at the
existing zoom. Temporal scopes stay fixed while their date context remains
applicable and refit when navigation reaches another date context. A geographic
scope stays fixed while the destination remains inside the same named area. If
the destination has another available scope at the same level—National park,
State/Bundesland, configured country frame, or Country—the map switches to and
fits that scope. Otherwise it falls back to Current photo, recenters on the new
pin, and preserves the manual zoom. Collection and track scopes remain fixed.
An unlocated selection leaves the camera unchanged and shows a quiet **Current
photo has no GPS** notice without covering the map.

Clicking an individual photo marker makes that photo current. The viewer image,
position indicator, information overlay, per-photo zoom state, and marker
selection update together. The map remains open in the same mode, its camera is
updated under the same active-scope rule, and focus remains on the map region.

With the map region focused, `Page Up` and `Page Down` retain the universal
ten-position collection jumps in case-insensitive natural file-name order;
`Home` and `End` select the first and last photo. These keys work in every map
mode and may select an unlocated photo. Arrow keys still pan the focused map,
and `+`/`-` still zoom it. The divider consumes Page keys only for meaningful
ten-percentage-point split changes, while its Home/End extremes remain intact.

Markers that would overlap at the current zoom are represented by a cluster
with a visible count. Activating a cluster zooms toward its contents rather
than selecting an arbitrary photo. Photos with exactly the same normalized
coordinates remain one counted coordinate group at maximum zoom; activating
that group selects the next member in natural file-name order, wrapping within
that group. Universal collection navigation still reaches every photo,
including every member of an exact-coordinate group, without making markers
separate tab stops.

The current source uses MapLibre's GeoJSON clustering and
`getClusterExpansionZoom` calculation, but the product owns the cluster radius,
maximum cluster zoom, visual treatment, activation behavior, and subsequent
camera movement. Selecting a marker revealed by a cluster now follows the same
active-scope camera rule as every other photo selection, so an overview remains
stable instead of snapping back to a fixed close zoom.

No marker popup or thumbnail preview is introduced. A marker's accessible
description uses available photo information and falls back to file name, but
it does not make each marker an additional `Tab` stop.

### Photos-plus-track mode

This mode begins with all behavior and photo markers from **All photos** and
adds every drawable GPX track found directly inside the selected folder. The
track appears without changing the shared center or zoom. Photo navigation and
marker selection continue to use the active-scope camera rule, so the user can
inspect the route without a photo change discarding the chosen context.

Track lines are drawn above the basemap and below every photo marker and
cluster. A track uses a quiet contrasting line with a casing so it stays
legible over the configured light basemap without competing with selected
photos. Separate GPX track segments remain separate; Memory Atlas never draws
a straight connector across a recorded segment break, an invalid point, or two
different tracks. Multiple valid files and tracks share this stable treatment
and are drawn in case-insensitive natural GPX file-name order, then document
order.

If the mode has a drawable track but no located photos, the track still appears
and the panel quietly states that no photos have GPS. If it has located photos
but no drawable track, it preserves the photo overview and states **No drawable
GPX track line was found in this folder.** If it has neither, it shows one
intentional empty state rather than an empty basemap.

GPX track names may supply accessible descriptions but do not create persistent
labels over the map. Track timestamps and elevation are not displayed or used
to filter tracks in this slice. All drawable tracks in the selected folder are
shown; the feature does not guess which route belongs to the current photo or
date.

### Visual language and legend

The map uses a compact legend containing only categories visible in the active
mode:

- the current photo uses the established pin silhouette with a strong outline;
- other photos use a smaller neutral circular marker;
- photo clusters or exact-coordinate groups add a numeric count; and
- GPX tracks use a line sample matching the rendered track.

Selection, grouping, and tracks must differ by shape, outline, or count as well
as color. The final palette must remain legible over the configured map style,
in forced-colors/high-contrast use, and for common color-vision differences.
The selected photo remains recognizable when it belongs to a coordinate group.

### Folder scanning and GPX normalization

The directory input continues to receive the files chosen by the user. In
addition to top-level `.jpg` and `.jpeg` files, ingestion retains top-level
`.gpx` files case-insensitively. Files in descendants remain ignored.

GPX processing supports standards-shaped GPX 1.0 and 1.1 track content:

- each `<trk>` may contain one or more `<trkseg>` elements;
- each `<trkseg>` may contain ordered `<trkpt>` points;
- latitude and longitude must be finite and within their geographic ranges;
- invalid points split geometry rather than allowing a false line across them;
- a drawable line requires at least two consecutive valid points; and
- track/file names are optional and do not determine geometry.

Unknown extensions, links, author data, and XML schema locations are ignored.
Parsing a GPX file must not fetch schemas, linked resources, tiles, or any other
network content. Waypoints (`<wpt>`), routes (`<rte>`), elevation, and track
times are not normalized for display in this feature.

Each GPX file is parsed locally and in isolation away from UI components. A
malformed XML document fails only that GPX file. Within a readable document,
invalid points or non-drawable segments are skipped while other drawable
segments remain available. GPX progress and failures participate in the
existing folder-scan lifecycle without preventing readable JPEGs from opening.
After loading, a compact non-modal notice reports unavailable GPX sources when
the user enters **Photos + GPX track**.

GPX geometry is transient collection data. Memory Atlas creates no sidecar,
cache, corrected track, or generated index and releases the geometry when the
folder session ends. Parsing and normalization must not block the UI for a
representative large track; rendering may derive simplified display geometry,
but must preserve the source order and segment gaps and must not modify the
source file.

### Representative-source findings

The private Schloss Herrenrunde GPX sample inspected for this specification is
well-formed GPX 1.1 produced by gpx.studio. It contains one named track with one
segment and 847 track points. All 847 points have valid, distinct coordinates,
elevation, and parseable timestamps in nondecreasing order. The file contains no
waypoints or routes. It provides representative local coverage for GPX
discovery, normalization, line rendering, viewport fitting, and ordinary track
size, but not for multiple tracks or segments, invalid points, or partial-file
recovery.

The updated folder contains 31 JPEGs. Every image has valid latitude and
longitude, and the corpus supplies 31 distinct coordinate pairs. It now
provides representative local coverage for all-photo fitting, current-marker
selection, pointer selection, keyboard selection, and ordinary photo-marker
density. Repository-safe controlled fixtures are still required for automated
GPS coverage and edge cases such as missing or invalid photo coordinates,
duplicate positions, and dense clustering. Sanitized GPX fixtures are still
required for automated coverage of multiple files, tracks, and segments,
invalid-point gaps, one-point tracks, and malformed XML. Private fixtures remain
read-only, local, and uncommitted.

## Acceptance criteria

1. With the map open, non-repeating `G` presses without command modifiers and
   the visible pointer control cycle through exactly **Current photo**, **All
   photos**, and **Photos + GPX track** in that order and wrap consistently.
2. The active mode has persistent visible text and an accessible announcement;
   unavailable data produces the specified intentional state without skipping
   or silently renaming a mode.
3. The first map opening starts in **Current photo**, and the active mode
   persists while the current folder remains open. Cycling `G` changes visible
   layers without changing the shared map center or zoom.
4. Photo navigation follows the active camera scope without forced zooming:
   Current photo recenters at the existing zoom; temporal scopes refit when
   their date context changes; geographic scopes remain fixed within their
   named area, switch to an available destination scope at the same geographic
   level, and otherwise fall back to Current photo without resetting zoom;
   collection and track scopes remain fixed. Current-photo mode shows the
   existing no-GPS placeholder while keeping map mode open.
5. All-photo mode shows every and only photo with valid normalized GPS. A
   current photo without GPS leaves the other markers visible and receives no
   invented coordinate.
6. Clicking an individual marker selects its photo, and photo navigation updates
   the selected marker, viewer image, counter, information, and per-photo view
   state without closing the map; selection follows the same active-scope
   camera rule as sequential navigation.
7. With map focus, `Page Up`/`Page Down` jump ten collection positions and
   `Home`/`End` select the first/last photo in every mode. Divider Page keys make
   larger split changes; existing photo, map-pan, map-zoom, global shortcut,
   and spatial focus behaviors are preserved.
8. Dense markers cluster with a count and expand by zooming. Exact-coordinate
   groups retain a count, allow deterministic member selection, and keep the
   current photo visibly selected without hiding a member from keyboard
   navigation.
9. Photos-plus-track mode adds all drawable segments from every valid top-level
   GPX file without changing the shared camera, never connects separate
   segments or invalid-point gaps, and keeps tracks below photo markers.
10. Missing photo GPS, missing GPX, a one-point track, malformed XML, invalid
    coordinates, and a mixture of valid and invalid GPX sources each produce a
    useful non-blocking result; one GPX failure never prevents readable photos
    or another valid GPX track from loading.
11. The mode indicator, notices, legend, marker/group treatments, and track
    styling remain compact, do not obscure attribution, do not rely on color
    alone, and remain understandable with controls faded and in fullscreen.
12. Only top-level `.gpx` files are considered, source order and segment gaps
    are preserved, and GPX files, photos, metadata, and coordinates are never
    modified, persisted, or directly uploaded.
13. GPX parsing performs no network fetch. Opening any rendered map continues
    to make only the normal basemap requests for the displayed area, which may
    reveal the geographic area covered by photo or track coordinates to the
    configured provider.
14. Folder cancellation, replacement, `H`, component teardown, and choosing
    another folder terminate pending work, discard GPX geometry and map sources,
    remove event handlers, and preserve the existing object-URL cleanup.
15. Automated tests cover mode cycling and reset, scope-aware camera stability,
    context changes, preserved manual zoom, empty/degraded states,
    two-way selection, located-photo keyboard order, clustering and duplicate
    coordinates, camera rules, top-level filtering, GPX 1.0/1.1 parsing,
    multiple files/tracks/segments, invalid-point gaps, isolation, and cleanup.
16. A packaged macOS check uses the private Schloss Herrenrunde photos and GPX
    track to verify `G`, the pointer control, camera continuity and scope-aware
    photo following,
    marker selection, keyboard selection, track geometry and layering,
    fullscreen, and split resizing without changing its files. Controlled GPX
    fixtures verify malformed and partial-data edge cases.

## Non-goals

- GPX waypoints or point-of-interest markers
- GPX routes, route planning, directions, recording, live location, or track
  editing, correction, merging, export, or download
- Matching photos to track points, deriving missing photo coordinates, or
  filtering tracks by the current photo's date or time
- Track elevation profiles, speed, distance, duration, animation, playback, or
  per-track visibility controls
- Marker thumbnails, persistent popups, manual marker movement, GPS editing, or
  reverse geocoding
- A standalone map screen, full-screen map-only mode, thumbnail gallery, or
  general contextual-panel framework
- Offline basemaps, recursive folder scanning, a database, generated index, or
  session persistence after the collection closes

## Product, privacy, and platform boundaries

The feature expands the accepted read-only folder input from JPEG photos to
JPEG photos plus GPX track files. All source parsing and normalized collection
data remain local and transient. It adds no account, analytics, cloud storage,
native filesystem bridge, background monitoring, or source-file write path.

Map tiles remain the only network exception. Memory Atlas does not upload a
photo, GPX document, extracted metadata, marker collection, or track geometry,
but requesting basemap tiles necessarily discloses the viewed geographic area
to the configured provider. The existing attribution and network disclosure
remain visible and truthful in all three modes.

The acceptance target remains the browser-native Svelte core in the packaged
macOS Electron application. Windows, Linux, phones, tablets, touch-specific
interaction design, and hosted deployment remain deferred.

## Tester change request: map camera scopes

### Status and intent

This 2026-09-14 change request adds `MA-FEAT-024` to the current map slice. The
interaction decisions below are accepted and implemented in source. Installed
macOS verification remains part of the next consolidated feature build.

The user should be able to move quickly between the current photo and wider
spatial or temporal context without manually pinching, scrolling, or repeatedly
using the map controls. The mental model is explicit:

- `G` controls **what data is drawn**: current photo, all photos, or photos plus
  GPX tracks.
- Map-focused `Z` controls **how the camera frames that data and its wider
  context**.

Changing a `Z` camera scope must not silently change the active `G` content
mode. Direct pan or zoom remains available after any named scope. The available
`Z` scopes depend on the active `G` mode so collection and track scopes never
frame layers the map is not drawing.

### Camera scopes and active-layer dependencies

The **Zoom** menu exposes every available named scope in four stable groups:

1. **Focus:** **Current photo** — center the located current photo at the established close
   zoom.
2. **Time:** **Day** — fit the located photos captured on the current photo's local
   calendar day.
3. **Time:** **Surrounding seven days** — fit the located photos captured from three
   calendar dates before through three calendar dates after the current photo.
4. **Place:** **National park** — when supported boundary data contains the current photo,
   fit that named park.
5. **Place:** **State** — fit the containing German Bundesland or U.S. state.
6. **Place:** **Country-specific frame** — fit an additional meaningful country frame
   when configured, initially the contiguous United States.
7. **Place:** **Country** — fit Germany or the complete United States.
8. **Collection:** **All photos** — fit every located photo in the selected collection.
9. **Collection:** **Complete track** — fit the full extent of every drawable GPX track in the
   selected collection.

Only scopes supported by the active `G` content are included in the menu:

| Active `G` mode | Zoom menu |
| --- | --- |
| **Current photo** | Current photo, then applicable National park, State, country-specific frame, and Country scopes |
| **All photos** | Current photo, Day, Surrounding seven days, applicable geographic scopes, then All photos |
| **Photos + GPX track** | Every All-photos scope, then Complete track |

An unmodified, non-repeating `Z` press while the map region has focus uses a
short primary cycle rather than traversing that complete menu:

```text
Current photo -> Day -> Complete track -> All photos -> Current photo
```

Unavailable stops are skipped without reordering the remaining stops. Thus
All-photos mode normally cycles Current photo, Day, and All photos, while
Photos + GPX track can expose all four. Surrounding seven days and every Place
scope remain directly selectable from the menu but are deliberately excluded
from the `Z` cycle.

Current-photo mode may include geographic scopes because the basemap and the
current coordinate provide meaningful place context. It excludes Day,
Surrounding seven days, All photos, and Complete track because their photo or
track layers are not drawn. Complete track exists only in **Photos + GPX
track** mode and only when at least one drawable segment exists.

A scope with no usable anchor or extent is omitted. Day and Surrounding seven
days are also omitted from the menu when they would produce the same fitted
extent as the preceding temporal/photo scope. **All photos** and **Complete track**
remain separate semantic stops when both are available, even when their extents
are similar or identical; tester use, including tracks that contain flights,
will determine whether that distinction remains valuable.

Every `Z` action, direct menu selection, and direct-access shortcut briefly shows a status toast
centered at the bottom of the map panel using **Map view: _scope_**. Geographic scopes use the actual name, for
example **Map view: Lassen Volcanic National Park**, **Map view: California**,
or **Map view: Germany**. The toast follows the implemented photo-focused `Z`
feedback pattern, whose own toast is centered at the bottom of the photo panel.
Viewer-wide feedback remains centered across the viewer. Every toast is
announced non-disruptively to assistive technology and does not take focus or
obscure persistent map mode, notices, or attribution.

Two quiet controls remain at the top-left of the map. **GPS** names and cycles
the active `G` content mode. Directly below it, **Zoom** always names the last
active camera scope and opens the grouped direct-selection menu. Automatic
same-level transitions and fallback update the persistent Zoom label
immediately; the brief toast remains reserved for an explicit keyboard cycle,
direct shortcut, or menu selection. The menu closes after selection, on
`Escape`, or when the user points elsewhere.

The camera starts with compact, viewport-relative padding and expands each
affected edge to clear the persistent overlays actually present there, plus a
small visual gutter. This includes the GPS/Zoom controls and notices at the top,
MapLibre navigation controls at the right, and the legend and required map
attribution at the bottom. The gutter also accounts for the footprint of lines
and in-scope markers. Consequently, a tall or narrow Complete-track fit keeps
its track geometry visibly inside the usable map area rather than merely inside
the raw canvas.

The cycle belongs only to the focused map. Photo-focused `Z` retains its
implemented fitted/native/custom image cycle, and the divider continues to
ignore `Z`. Pointer-driven map pan and zoom establish a freely chosen view but
do not create another named scope.

### Direct access

Tester feedback asks for shortcuts that return directly to important scopes:

- `Shift+Z` — **Current photo**;
- `Control+Z` — **Day**;
- `Option+Z` — **Complete track**; and
- `Command+Option+Z` — **All photos**.

This left-to-right modifier progression on the tested Mac keyboard moves from
the narrow current-photo view toward wider day and complete-track context.
Plain `Command+Z` remains unassigned so Memory Atlas does not override the
familiar macOS Undo convention; the explicit Command+Option combination is
reserved for the All-photos view.

The shortcuts refer to the key labeled `Z` in the active keyboard layout, not
blindly to one U.S.-layout hardware code or to the character produced after
Option is applied. In particular, `Option+Z` and `Command+Option+Z` may produce
a non-`z` character on macOS. The implementation must verify the bindings on
representative German and U.S. Mac layouts without also claiming a differently
labeled key.

A direct shortcut is available only when its named scope exists in the active
`G` mode. An unavailable shortcut does not change `G` or move the camera; it
briefly announces, for example, **Day view requires All photos or Photos + GPX
track**, **Current photo has no GPS**, or **No drawable GPX track line was found
in this folder**. Modified and unmodified `Z` key-repeat events are ignored.

### Temporal inclusion

Day and Surrounding seven days use photo capture-time values only. A photo
without capture time is excluded from temporal extents. If the current photo
has no capture time, both temporal scopes are unavailable.

Embedded photo timestamps are interpreted as their recorded local wall-clock
values without timezone conversion. **Day** compares their recorded calendar
date. **Surrounding seven days** uses an inclusive seven-date window centered
on the current photo's recorded date; it is deliberately not a calendar week.
This rolling window avoids an arbitrary Monday/Sunday boundary while matching
the experience around the current photo.

GPX point timestamps do not participate in temporal extents. The current GPX
model retains geometry but not time, and this feature does not infer which
track section belongs to a photo date. In Photos + GPX track mode the complete
track remains drawn when a temporal camera scope frames only matching photo
locations; off-viewport track geometry is simply outside the current camera.

### Geographic context catalog

State, country, and national-park scopes are based on real boundary polygons,
not fixed zoom levels or runtime reverse geocoding. Fixed zoom levels cannot
represent areas as different in size and shape as California, Bremen, Germany,
and the United States.

The first implementation supports only Germany and the United States:

- Germany: a containing Nationalpark when present, Bundesland, and Germany;
- United States: a containing designated national park when present, U.S.
  state or equivalent, **Contiguous United States**, and the complete United
  States. The intermediate frame excludes Alaska and Hawaii from its extent but
  remains an explicit stop in the U.S. country ladder.

These scopes form a contextual-area ladder rather than a strict administrative
hierarchy. A park may cross one or more states; each matching scope is derived
independently from the current photo coordinate and appears in the stable order
National park, State, Country. If overlapping polygons of the same supported
category contain the coordinate, order them from smaller polygon area to
larger, then by localized display name for determinism.

The app fits the selected area's complete boundary extent with normal camera
padding. It does not filter the active layers or hide photos outside the area;
the viewport determines which currently drawn markers are visible. No boundary
outline or additional persistent label is added in this slice.

Country-specific frames are explicit configuration derived from packaged area
extents rather than hard-coded zoom numbers. This keeps the ladder extensible:
a country may define zero or more useful intermediate frames without forcing
the same administrative model on every country. The contiguous U.S. extent is
derived from every packaged U.S. state or equivalent except Alaska and Hawaii.

The boundary catalog is generated at build time from versioned sources,
simplified for camera framing, committed as an explicit application asset, and
read locally at runtime. It contains stable area identifiers, display names,
category, country, polygon or multipolygon geometry for containment, and a
precomputed fitting extent. The generation process records source version,
retrieval date, license, attribution, simplification parameters, and output
hash. Updating the catalog is an explicit maintainer action, never a runtime
network request.

Natural Earth supplies a suitable public-domain baseline for country and
first-order administrative boundaries. U.S. national-park boundaries should
come from the official National Park Service Lands dataset. German national-
park and administrative data should come from BfN/BKG sources with their
required attribution. Before checking in generated data, implementation must
verify the exact source files and redistribution terms and add the required
provenance and notices. A source that cannot be redistributed under compatible
terms blocks that category from shipping rather than triggering a runtime
lookup.

### Camera-scope state and lifecycle

The map keeps one last named camera scope while it remains open. A `Z` press
advances from that scope through the available primary cycle and wraps. If the
last scope was selected from the menu but is not part of the primary cycle,
the next `Z` starts at Current photo or the first remaining available primary
scope. A direct shortcut or menu selection makes its destination the last
named scope. Direct pan,
wheel/trackpad zoom, `+`/`-`, and MapLibre navigation controls move the camera
without changing that cycle cursor; the next `Z` advances from the last named
scope rather than attempting to classify the arbitrary camera.

Changing `G` preserves the camera. If the last named scope also exists in the
new mode, the next `Z` advances from it. If it does not, the next `Z` selects
the first available scope; `G` itself never causes a camera move or toast about
`Z`.

Navigating to or selecting a located photo preserves the last named scope when
its context remains applicable.
If it is **Current photo**, the camera follows the new coordinate without
changing zoom. Day and Surrounding seven days remain active and refit without a
toast when their date context changes. A National park, State/Bundesland,
country-specific frame, or Country scope remains fixed while the destination is
inside the same named area. When the destination belongs to another available
scope at that same level, the active scope switches and refits without a toast;
for example, State can progress from Washington to Oregon to California, and
Country can progress from Germany to the United States. Only when no equivalent
scope is available does it fall back to Current photo and recenter without
changing zoom. All photos and Complete track remain unchanged because their
extents are collection-owned. An
unlocated selection leaves both the camera and last named scope unchanged. This
includes marker, exact-coordinate-group, universal Page-key, Home, and End
selection; cluster activation itself changes only the camera.

Closing the map discards its camera and last named scope, as today. Reopening
starts at Current photo when it is located; otherwise no named scope is active
until an available scope is selected. The active `G` mode still persists for
the folder session under the implemented baseline. Choosing another folder or
using `H` clears all map mode and camera-scope state.

### Cluster-selection refinement

Cluster expansion and individual-photo selection form one coherent drill-down
interaction. The earlier implementation expanded a cluster to MapLibre's
calculated zoom and then returned to the fixed close zoom when the revealed
photo was selected. Tester feedback confirmed that clustering itself is useful
but rejected this immediate camera reversal.

The accepted rule is now scope-based rather than cluster-specific. Cluster
activation changes only the camera. Selecting a revealed marker then updates
the current photo under the same scope-preservation rule used for ordinary
markers, exact-coordinate groups, keyboard jumps, and sequential navigation.
This removes the fixed-close-zoom reversal without introducing a temporary or
hidden "after cluster" state.

### Add-on acceptance criteria

1. Map-focused, non-repeating `Z` cycles in the order Current photo, Day,
   Complete track, and All photos, skipping unavailable stops. The grouped
   Zoom menu exposes every available Focus, Time, Place, and Collection scope;
   photo-focused `Z` is unchanged and the divider ignores it.
2. Every cycle and direct-access result shows and announces the short **Map
   view: _scope_** toast centered within the map panel; photo and viewer feedback
   are likewise centered within the region they describe.
   Persistent stacked **GPS** and **Zoom** controls identify both dimensions;
   GPS cycles content while Zoom opens direct selection, and the Zoom label
   also reflects automatic same-level transitions and fallback.
3. `Shift+Z`, `Control+Z`, `Option+Z`, and `Command+Option+Z` directly select
   Current photo, Day, Complete track, and All photos respectively when
   available. They never change `G`; plain `Command+Z` remains unassigned, and
   unavailable direct access explains why without moving the camera.
   The labeled-Z bindings work on representative German and U.S. Mac keyboard
   layouts even when Option changes the produced character.
4. Day includes only located photos with the current photo's recorded local
   date. Surrounding seven days includes only located, timestamped photos from
   the inclusive current-date-minus-three through current-date-plus-three
   window. Missing capture times and GPX timestamps never produce inferred
   temporal membership.
5. Current-photo mode excludes photo-collection and track scopes; All-photo
   mode adds temporal and All-photo scopes; Photos + GPX track adds Complete
   track only when drawable geometry exists. Complete track reserves measured
   safe insets for persistent controls, notices, legend, and attribution.
6. Day and Surrounding-seven-days stops are skipped when their fitted result
   duplicates the preceding photo or temporal scope. All photos and Complete
   track remain separate named stops even when their extents match.
7. A supported current coordinate resolves locally and deterministically to
   zero or more National park scopes, one State scope, zero or more explicitly
   configured country frames, and one Country scope in the specified order.
   The U.S. ladder adds Contiguous United States before the complete country.
   Unsupported countries simply omit geographic scopes.
8. Geographic scopes fit actual packaged boundary extents without filtering
   layers, drawing new boundary decoration, or making a runtime geocoding or
   boundary request.
9. Direct pan, direct zoom, photo selection, universal collection navigation,
   fullscreen, split resizing, and map close/reopen remain coherent with the
   named camera scope and lifecycle rules. Changing `G` preserves the camera;
   located-photo selection preserves an applicable active scope level, moving
   to an available destination scope at that level before falling back to
   Current photo without resetting zoom;
   closing the map
   discards the camera-scope cursor; photo changes preserve manual zoom and update the
   camera only when the active scope requires it; choosing another folder clears
   all related state.
10. No scope uploads photos, metadata, GPX documents, or exact source geometry.
    Missing or invalid packaged boundary data fails only the affected
    geographic scope and never prevents photo or GPX viewing.
11. The generated boundary asset has reproducible provenance, licensing,
    attribution, simplification, and integrity evidence; shipping is blocked if
    redistribution terms are not compatible and documented.
12. Focused automated tests cover the mode/scope matrix, ordering, duplicate and
    unavailable scopes, modifier and repeat handling, temporal boundaries,
    polygon containment including a park crossing state lines, antimeridian and
    multipolygon fitting, fallback behavior, toasts, and camera lifecycle. A
    packaged check covers representative German and U.S. locations plus the
    private photo/GPX corpus.

## Dependencies and decisions

- This specification accepts and combines
  [`MA-FEAT-008`](../../../planning/backlog.md#ma-feat-008--map-all-located-photos-and-select-from-pins)
  and
  [`MA-FEAT-016`](../../../planning/backlog.md#ma-feat-016--gpx-track-overlay)
  as one implementation slice.
- Tester feedback adds
  [`MA-FEAT-024`](../../../planning/backlog.md#ma-feat-024--named-map-camera-scopes)
  as an implemented change request to the same slice. Its `Z` camera model is
  now part of the source behavior; cluster drill-down and subsequent photo
  selection use the same accepted scope-preservation rule as other selection.
- [`ADR 0004`](../../../architecture/decisions/0004-local-geographic-context-catalog.md)
  accepts a build-time-generated, locally packaged geographic boundary catalog
  for the German and U.S. scopes. MA-FEAT-025 tracks other countries and deeper
  or different geographic-area types.
- The accepted [MVP specification](../mvp.md) remains authoritative for the
  current-photo map, split layout, map lifecycle, provider, attribution,
  fullscreen, source-photo behavior, and error isolation. This specification
  extends the map after the MVP without rewriting that baseline.
- [`MA-FEAT-002/015/018`](ma-feat-002-015-018-desktop-viewer-keyboard-navigation.md)
  remains authoritative for the spatial focus loop and global shortcuts. This
  feature keeps ten-position `Page Up`/`Page Down` and first/last `Home`/`End`
  selection universal across photo and map focus. The divider uses those keys
  only for its own larger split adjustments.
  MA-FEAT-024's map-focused `Z` behavior supersedes only the older table cell
  that says `Z` has no map effect; photo and divider behavior remain unchanged.
- The existing directory input, background worker boundary, normalized typed
  data, MapLibre/GeoJSON capability, and local XML parser can support the photo
  and track scopes. Geographic containment may justify a small demonstrated
  runtime library, but prefer a narrow local implementation or an already
  present capability and add no dependency speculatively.
- MA-FEAT-006's general contextual-panel framework is not a prerequisite. This
  feature extends the existing single map panel without deciding how unrelated
  future panels behave.
- MA-FEAT-007's thumbnail overview is independent and remains out of scope.

## Open questions

None blocking the remaining packaged verification. Camera padding starts at
eight percent of the active viewport, clamped to 28–72 horizontal pixels and
36–72 vertical pixels, then expands on affected edges to clear measured
persistent overlays with a 24-pixel feature-aware gutter. Administrative and
park simplification tolerances are recorded
with the generated asset, and same-extent comparison is covered by focused
tests. Photo and cluster selection now follow the accepted scope-preservation
rule.
