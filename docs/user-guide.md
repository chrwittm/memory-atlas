# Memory Atlas User Guide

**Status:** Current MVP user documentation
**Applies to:** Memory Atlas MVP 0.2.0
**Last updated:** 2026-09-04

Memory Atlas is a local-first macOS photo viewer. It opens a folder of JPEG
photos, presents them in file-name order, shows embedded captions and capture
times, and can display the current photo beside its embedded GPS location.

## Quick start

1. Launch **Memory Atlas**.
2. Select **Choose photo folder**.
3. Choose a folder containing JPEG photos.
4. Use the Left and Right Arrow keys, or click the left and right edges of the
   fitted viewer, to move through the photos.
5. Scroll over a photo or press `+` to inspect a detail, then drag or use the
   Arrow keys to pan.
6. Press `I` for photo information, `M` for the map, or `F` for fullscreen.

## Choosing a photo folder

Memory Atlas currently opens:

- `.jpg` and `.jpeg` files, including uppercase variants;
- files directly inside the selected folder; and
- one folder at a time.

Files inside subfolders and unsupported formats such as HEIC, RAW, PNG, and
video are ignored. Photos are ordered by file name using a case-insensitive
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

Hover over a control to see its name and shortcut. You can also use `Tab` and
`Shift`+`Tab` to move focus between available controls, then activate a button
with `Enter` or `Space`.

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
| `Z` | Cycle fitted, native 100%, and remembered custom views, with brief mode feedback |
| `I` | Show or hide photo information |
| `M` | Open or close the map |
| `F` | Enter or leave fullscreen |
| `Escape` | Leave fullscreen first; otherwise close the map when it is open |

If the map is open in fullscreen, the first `Escape` leaves fullscreen and
keeps the map open. Press `Escape` again to close the map.

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

The map represents the current photo only:

- A photo with valid GPS coordinates is shown with one location marker.
- Moving to another geotagged photo moves the marker and recenters the map.
- A photo without GPS shows **This photo doesn’t have GPS coordinates**. Map
  mode stays open, and the map returns automatically on the next geotagged
  photo.
- Drag the center divider horizontally to resize the photo and map. Each panel
  can occupy between 20% and 80% of the viewer.
- Drag the map to pan. Use the map's `+` and `−` controls, a mouse wheel, or a
  trackpad gesture to zoom.

Pointer input over the map changes only the map. Photo zoom and pan remain
scoped to the photo side of the split view.

The divider can also be operated with the keyboard. Move focus to it with
`Tab`, then use:

| Key | Divider action |
| --- | --- |
| Left Arrow | Give the photo 2 percentage points less width |
| Right Arrow | Give the photo 2 percentage points more width |
| `Home` | Set the photo to 20% and the map to 80% |
| `End` | Set the photo to 80% and the map to 20% |

The map requires an internet connection to load OpenFreeMap tiles. Photo files,
captions, and extracted metadata are not uploaded, but the map provider receives
normal requests for the displayed map area.

## Fullscreen

Press `F` to enter fullscreen presentation mode and press `F` again to leave.
There is currently no separate fullscreen button. The standard `Escape` key
also leaves fullscreen.

If fullscreen is unavailable or macOS rejects the request, the viewer remains
open and displays a brief explanation.

## Choosing another folder

Reveal the controls and select **Choose another folder** in the upper-left
corner. This returns to the entry screen and clears the current collection,
photo position, information preference, map state, and temporary image
resources, including remembered zoom views. It does not change the source
folder or its photos.

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

### A caption, time, or map location is missing

Memory Atlas can show only supported metadata actually embedded in the JPEG. A
missing value does not indicate that the original photo has been changed.

### The map cannot load

Check the internet connection, close the map with `M`, and open it again. A
known MVP issue can leave map tiles blank after a complete offline-to-online
transition; quitting and restarting Memory Atlas is the current workaround.
See [`MA-BUG-001`](planning/known-issues.md#ma-bug-001-map-tiles-do-not-recover-after-an-offline-request)
for details.

## Privacy and source files

- Original photos are read-only and remain unchanged.
- Photo files and extracted metadata remain on the computer.
- Memory Atlas has no account, upload, cloud synchronization, or library
  database in the MVP.
- Opening the optional map makes network requests for the displayed area.

For installation instructions and the complete list of current limitations,
return to the [project README](../README.md).
