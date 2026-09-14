# Memory Atlas User Guide

**Status:** Current user documentation
**Applies to:** Memory Atlas 0.3.0 release candidate
**Last updated:** 2026-09-14

Memory Atlas is a local-first macOS photo viewer. It opens a folder of JPEG
photos, presents them in file-name order, shows embedded captions and capture
times, and can explore the current photo, all located photos, and GPX tracks on
a split-screen map.

## Quick start

1. Launch **Memory Atlas**.
2. Select **Choose photo folder**.
3. Choose a folder containing JPEG photos.
4. Use the Left and Right Arrow keys, or click the left and right edges of the
   fitted viewer, to move through the photos.
5. Scroll over a photo or press `+` to inspect a detail, then drag or use the
   Arrow keys to pan.
6. Press `I` for photo information, `M` for the map, `G` to change an open
   map's content, map-focused `Z` to change its framing, `F` for fullscreen,
   or `H` to return to folder selection.

## Choosing a photo folder

Memory Atlas currently opens:

- `.jpg`, `.jpeg`, and `.gpx` files, including uppercase variants;
- files directly inside the selected folder; and
- one folder at a time.

Files inside subfolders and unsupported formats such as HEIC, RAW, PNG, and
video are ignored. GPX files supply optional track lines and do not enter the
photo sequence. Photos are ordered by file name using a case-insensitive
natural sort. For example, `2-photo.jpg` appears before `10-photo.jpg`.
Capture time is displayed as context but does not change the sequence.

While the folder is being read, Memory Atlas shows its progress. Select
**Cancel** to stop and return to the entry screen. An unreadable metadata record
or photo does not prevent the remaining readable photos from opening.

The selected folder is temporary. Memory Atlas does not remember recent
folders, and it rescans a folder when it is selected again.

## Viewer controls

The viewer initially fits the current photo into the available space without
cropping or stretching it and respects the JPEG's embedded orientation.
Controls fade after a short period of inactivity so the photo remains visually
primary. Move the pointer or use keyboard focus to reveal them again. Keyboard
shortcuts continue to work while the controls are hidden.

| Location | Control | Action |
| --- | --- | --- |
| Left edge | Previous arrow | Open the previous photo. It is disabled on the first photo. |
| Right edge | Next arrow | Open the next photo. It is disabled on the last photo. |
| Upper left | **Choose another folder** | Close the current collection and return to folder selection. |
| Upper center | Photo counter | Shows the current position and total number of photos; it is not a button. |
| Upper right | Map icon | Open or close the map for the current photo. |
| Lower right | Information icon | Show or hide the caption and capture time together. |

Hover over a control to see its name and shortcut. The fading controls remain
pointer-operable but are intentionally omitted from the viewer's `Tab` order.
Their actions remain available through the keyboard shortcuts below.

Within the viewer, `Tab` moves right through the visible interaction regions
and `Shift`+`Tab` moves left. With the map closed, focus remains on the photo.
In a desktop split, the circular order is photo, divider, map, then photo; the
reverse shortcut follows the opposite order. In the narrow stacked layout, the
hidden divider is skipped. Clicking a region makes it the active region without
drawing a colored frame around the photo or map.

## Inspecting photo details

Zoom operates only when the pointer is over the photo or the photo region has
keyboard focus. The complete fitted photo is the minimum. The maximum is 400%
of the JPEG's native dimensions; a very small photo that already needs more
than 400% to fit simply remains fitted.

- Scroll a mouse wheel or use a trackpad zoom gesture over the photo. The detail
  under the pointer stays in place unless an image edge reaches its bound.
- Press `+` or `-` while the photo region has focus to zoom around its center.
- Drag an enlarged photo, or use any Arrow key, to pan. Panning stops at the
  photo edges and never adds empty canvas. The cursor changes from the normal
  arrow to an open hand, then to a closed hand while dragging.
- Press `Z` or double-click the photo to cycle through the fitted view, native
  100% view, and the most recent custom view. Unavailable or duplicate views
  are skipped. When you use `Z`, a short centered message names the selected
  view; custom views also show their zoom percentage.
- The left- and right-edge buttons always change photos, even while enlarged.

Memory Atlas remembers the active view and inspected detail separately for each
photo in the current folder. Returning to a photo restores its view. Opening or
resizing the map, resizing the window, and entering fullscreen preserve that
view as closely as the photo bounds allow. Choosing another folder clears all
remembered views.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `+` / `-` | Zoom the focused photo in or out around its center |
| Left Arrow | Previous photo when fitted; pan left when enlarged |
| Right Arrow | Next photo when fitted; pan right when enlarged |
| Up / Down Arrow | Pan an enlarged photo vertically |
| `Page Up` / `Page Down` | Jump ten photos backward or forward, stopping at the first or last photo |
| `Home` / `End` | Open the first or last photo |
| `Z` with photo focus | Cycle fitted, native 100%, and remembered custom photo views, with brief mode feedback |
| `Z` with map focus | Cycle Current photo, Day, Complete track, and All photos, skipping unavailable views |
| `Shift+Z` with map focus | Return directly to the current photo's map view |
| `Control+Z` with map focus | Show the current photo's day when the map mode includes all photos |
| `Option+Z` with map focus | Show the complete track when **Photos + GPX track** is active |
| `Command+Option+Z` with map focus | Show all located photos when the map mode includes all photos |
| `I` | Show or hide photo information |
| `M` | Open or close the map |
| `G` | Cycle the open map through Current photo, All photos, and Photos + GPX track |
| `F` | Enter or leave fullscreen |
| `H` | Close the collection and return to folder selection |
| `Escape` | Leave fullscreen first; otherwise close the map when it is open |

If the map is open in fullscreen, the first `Escape` leaves fullscreen and
keeps the map open. Press `Escape` again to close the map.

Collection navigation keys apply while either the photo or map region is
focused, including when a photo is enlarged, cannot be displayed, or has no
GPS. `Page Up` and `Page Down` always jump ten positions in file-name order;
`Home` and `End` always select the first or last photo. A focused map keeps the
Arrow keys for panning and `+` or `-` for zooming. The divider keeps its own
Arrow, Page, `Home`, and `End` resizing behavior.
Global `H`, `I`, `M`, `G`, `F`, and `Escape` behavior remains available from
every region.

## Captions and capture time

When available, the embedded caption and capture time appear together near the
bottom of the photo. This information is visible by default.

Select the information icon in the lower-right corner or press `I` to hide or
restore it. The choice remains in effect while browsing the current folder. If
only a caption or only a capture time exists, Memory Atlas shows the available
value. A photo with neither value has no empty information panel.

Memory Atlas reads this information from metadata embedded in the image. It
does not create captions or edit metadata.

## Map view

Select the map icon in the upper-right corner or press `M` to open the map. The
desktop viewer initially gives approximately 80% of the width to the photo and
20% to the map.

The map opens in **Current photo** mode. Press `G`, or select the compact
**GPS** control at the top-left of the map, to cycle through exactly three
modes:

1. **Current photo** shows only the current photo's location.
2. **All photos** adds every photo with valid embedded GPS.
3. **Photos + GPX track** keeps all photo markers and adds every drawable track
   from valid top-level GPX files.

All three modes share one camera. Changing modes adds or removes layers without
changing its center or zoom. Photo navigation respects the last named camera
scope: Current photo recenters on the new pin without changing the chosen zoom;
Day and Surrounding seven days remain active and refit when navigation reaches
a new date context. A geographic view remains still while the new photo belongs
to the same named area. If the photo moves to another available area at the same
level, the map switches to and fits it—for example, Washington → Oregon →
California at State level, or Germany → United States at Country level. Only
when that level is unavailable does the map switch to Current photo and recenter
on the new pin without changing the chosen zoom. All photos and Complete track
remain still because their extents do not depend on the current photo. Manual
pan or zoom is preserved until a scope
actually changes or the user presses `Z` for a fresh named fit.

With the map region focused, press `Z` to move through the short primary cycle:

```text
Current photo -> Day -> Complete track -> All photos -> Current photo
```

Unavailable views are skipped. Surrounding seven days and geographic views are
available from the Zoom menu but not from the `Z` cycle. Each change briefly
names the result.

The persistent **Zoom** control directly below **GPS** shows the active camera
scope at all times. Select it with the pointer to open a direct-selection menu
grouped as **Focus**, **Time**, **Place**, and **Collection**. The menu contains
every meaningful scope available for the current photo, map content, and
folder; the active scope has a checkmark. It closes after a selection, with
`Escape`, or when you point elsewhere. The Zoom label also updates when
navigation switches to another geographic scope at the same level or falls
back to Current photo, so the displayed state and map behavior stay in
agreement.

| Map mode | Camera scopes available in the Zoom menu |
| --- | --- |
| **Current photo** | Current photo; containing National park, State/Bundesland, and country frames |
| **All photos** | Current photo; Day; Surrounding seven days; applicable geographic scopes; All photos |
| **Photos + GPX track** | Every All-photos scope; Complete track |

Unavailable and visually duplicate temporal scopes are skipped. **Day** uses
the recorded local calendar date embedded in the current photo. **Surrounding
seven days** includes that date plus the three dates before and after it; GPX
timestamps are not used. Geographic names are currently available for Germany
and the United States from a packaged local catalog. The U.S. ladder includes
**Contiguous United States** before the complete **United States** view; the
intermediate extent excludes Alaska and Hawaii. Country-specific intermediate
frames can be added when they make a country easier to understand. Choosing a
geographic scope frames the area but
does not draw a boundary or hide data outside it.

**Complete track** frames every drawable GPX segment. Named fits reserve space
for the GPS and Zoom controls, map notices, navigation buttons, legend, and
required map attribution, including a small gutter for lines and markers. This
is especially useful for tall, narrow tracks: the route remains inside the
unobstructed map area instead of slipping beneath the bottom labels.

`Shift+Z`, `Control+Z`, `Option+Z`, and `Command+Option+Z` provide direct access
to Current photo, Day, Complete track, and All photos. If a direct scope is
unavailable, Memory Atlas briefly explains why and does not move the map. Plain
`Command+Z` remains unassigned. These shortcuts follow the key labeled Z on
supported German and U.S. Mac layouts, including when Option produces a
different character.

Dragging or zooming the map does not lose the position in the named-scope
cycle. `G` also preserves both the camera and any still-applicable cycle
position. Selecting or navigating to a photo preserves an applicable active
scope level as described above, switches to the destination area at that level
when available, and otherwise falls back to Current photo at the existing zoom.
An unlocated photo leaves the camera unchanged.
Closing the map discards its camera and named-scope position, while the selected
`G` content mode continues to persist for the folder session.

Brief feedback appears inside the region it describes: photo zoom feedback is
centered at the bottom of the photo panel, and map-camera feedback is centered
at the bottom of the map panel. Viewer-wide messages remain centered across the
viewer.

The mode persists if the map is closed and reopened. Choosing another folder
resets it to **Current photo**. The three-state cycle never skips an unavailable
mode; instead, the panel explains what data is missing.

Map behavior:

- A photo with valid GPS coordinates is shown with one location marker.
- In overview modes, the selected photo uses the outlined pin while other
  photos use smaller circular markers. Clicking a marker makes its photo
  current while preserving or contextually updating the active camera scope.
- Nearby markers cluster with a count; selecting a cluster zooms toward its
  contents. Photos at exactly the same coordinates remain a counted group, and
  repeated activation cycles through that group's photos.
- An unlocated current photo does not hide other markers. Current-photo mode
  shows **This photo doesn’t have GPS coordinates**, while overview modes keep
  the map and show a compact notice.
- GPX tracks preserve file, track, segment, and invalid-point gaps. Malformed
  files are isolated, and the track mode reports unavailable or non-drawable
  sources without hiding usable photos or tracks.
- Drag the center divider horizontally to resize the photo and map. Each panel
  can occupy between 20% and 80% of the viewer.
- Drag the map to pan. Use the map's `+` and `−` controls, a mouse wheel, or a
  trackpad gesture to zoom.
- With the map region focused, use the Arrow keys to pan and `+` or `-` to zoom.

The compact legend identifies only the categories used by the active mode.
Marker selection, groups, and tracks differ by shape, outline, or count as well
as color. No marker popup or thumbnail is added.

Pointer input over the map changes only the map. Photo zoom and pan remain
scoped to the photo side of the split view.

The divider can also be operated with the keyboard. Move focus to it with
`Tab`, then use:

| Key | Divider action |
| --- | --- |
| Left Arrow | Give the photo 2 percentage points less width |
| Right Arrow | Give the photo 2 percentage points more width |
| `Page Up` | Give the photo 10 percentage points more width |
| `Page Down` | Give the photo 10 percentage points less width |
| `Home` | Set the photo to 20% and the map to 80% |
| `End` | Set the photo to 80% and the map to 20% |

The map requires an internet connection to load OpenFreeMap tiles. Photo files,
captions, extracted metadata, GPX documents, markers, and track geometry are not
uploaded, but the map provider receives normal requests for the displayed map
area. This can reveal the geographic area covered by the photos or track.

## Fullscreen

Press `F` to enter fullscreen presentation mode and press `F` again to leave.
There is currently no separate fullscreen button. The standard `Escape` key
also leaves fullscreen.

If fullscreen is unavailable or macOS rejects the request, the viewer remains
open and displays a brief explanation.

## Choosing another folder

Press `H`, or reveal the controls and select **Choose another folder** in the
upper-left corner. This returns to the entry screen in one step, including from
fullscreen, and focuses **Choose photo folder**. It clears the current
collection, photo position, information preference, map and split state,
notices, and temporary image resources, including remembered zoom views. It
does not change the source folder or its photos.

## Problems and recovery

### No JPEG photos found

Confirm that supported `.jpg` or `.jpeg` files are directly inside the selected
folder rather than only inside subfolders. Select **Choose another folder** to
try again.

### The folder could not be read

Memory Atlas shows the scan error and offers **Choose another folder**. Confirm
that the folder and files are still accessible, then select it again.

### One photo cannot be displayed

The viewer shows the file name and keeps the collection open. Use the Arrow
keys or edge controls to continue to another photo.

### A caption, time, map location, or GPX track is missing

Memory Atlas can show only supported metadata embedded in the JPEG and
drawable track segments in top-level GPX 1.0 or 1.1 files. A missing value,
one-point segment, invalid coordinate, or malformed GPX source does not change
the original file or prevent other usable sources from opening.

### The map cannot load

Check the internet connection, close the map with `M`, and open it again. A
known MVP issue can leave map tiles blank after a complete offline-to-online
transition; quitting and restarting Memory Atlas is the current workaround.
See [`MA-BUG-001`](planning/known-issues.md#ma-bug-001-map-tiles-do-not-recover-after-an-offline-request)
for details.

## Privacy and source files

- Original photos are read-only and remain unchanged.
- Photo and GPX files, extracted metadata, and normalized track geometry remain
  transient and on the computer.
- Named geographic matching uses a catalog packaged with the application and
  makes no reverse-geocoding or boundary-data request.
- Memory Atlas has no account, upload, cloud synchronization, or library
  database in the MVP.
- Opening the optional map makes network requests for the displayed area.

For installation instructions and the complete list of current limitations,
return to the [project README](../README.md).

## Duplicate app in Spotlight

Spotlight can find development builds outside Applications. If an old copy
appears, select it in Spotlight and press Command-Return to reveal its location
in Finder. Remove the obsolete app from that location; keep the current copy
in Applications. For a source checkout, generated copies may be under
`out/Memory Atlas-darwin-arm64/`. Eject old mounted installer images as well.
Spotlight may take a little time to stop showing a removed copy.
