# Memory Atlas MVP Description

Status: Accepted MVP definition  
Last updated: 2026-07-06

## MVP promise

Memory Atlas lets a person select a local folder of JPEG photos and immediately browse them in a calm, full-viewport presentation. They can move quickly between photos, read an embedded caption, and reveal the current photo's location beside it on a map.

The MVP should prove one central idea: viewing a photo becomes more meaningful when its context is available without getting in the way.

## Primary user journey

1. The app opens to a minimal entry screen.
2. The user chooses a local folder.
3. The app finds the JPEG photos in that folder and reads the metadata it needs.
4. A short loading state communicates scanning progress.
5. The first photo opens in the viewer.
6. The user moves through the folder with the keyboard or subtle on-screen controls.
7. The user can hide or restore the photo information overlay.
8. If the current photo has GPS coordinates, the user can toggle a split-screen map showing its location.
9. The user can leave the viewer and choose another folder.

## 1. Entry screen

The entry screen should be visually sparse and inviting rather than looking like a file-management utility.

It contains:

- The product name, **Memory Atlas**
- A distinctive visual, provisionally a restrained view of Earth or an abstract globe/atlas mark
- One primary action: **Choose photo folder**
- A short line explaining that photos stay on the user's computer

Choosing a folder begins scanning immediately. The MVP remembers no recent folders and has no library or account.

## 2. Folder and photo handling

For the first version:

- Accept files with `.jpg` and `.jpeg` extensions, case-insensitively.
- Scan the selected folder only; do not recurse into subfolders.
- Ignore unsupported files without treating them as errors.
- Never change, rename, move, or write metadata to original photos.
- Order photos by file name using a case-insensitive natural sort, with the
  original selection order only as a final tie-breaker.
- Correctly respect embedded image orientation.

The file name is the MVP's explicit sequence control. Prefixes such as `001`,
`002`, and `003` let a person arrange a presentation with ordinary file tools;
renaming a file outside Memory Atlas and selecting the folder again changes its
position. Embedded capture time remains useful context, but it does not override
the chosen file-name sequence.

The app needs clear states for:

- Scanning/loading
- A folder containing no JPEG photos
- A photo that cannot be decoded
- A selected photo file that can no longer be read

An unreadable individual photo should not prevent the rest of the folder from opening.
The MVP does not continuously monitor the source folder for changes after selection.

## 3. Main viewer

The viewer occupies the entire browser viewport. There is no permanent header, sidebar, framed card, page margin, or decorative border.

The current photo is as large as possible within the available viewport while preserving its aspect ratio. It is never stretched or cropped. Any unavoidable unused area caused by a mismatch between photo and screen proportions uses a quiet dark background and should feel like part of the viewing surface rather than a border.

The interface was implemented against current desktop browser APIs and is
optimized for keyboard and mouse. The accepted MVP testing package runs that
interface in Electron's bundled Chromium on macOS. Responsive mobile behavior
and distribution to other browser engines remain desirable but are not MVP
acceptance requirements.

Pressing `F` toggles the viewer through the browser Fullscreen API so the photo experience fills the physical display without browser chrome. The browser's standard `Escape` behavior exits fullscreen. If fullscreen is unavailable or denied, the viewer remains usable and briefly explains that it could not enter fullscreen.

### Navigation

The user can go to the previous or next photo with:

- Left and Right Arrow keys
- Large, subtle click targets at the left and right edges of the viewport

The pointer controls appear when the mouse moves and fade when idle. Their visual form can be bracket-like or chevron-like, but the click targets must remain comfortably large. At the first and last photo, the unavailable direction is disabled; the sequence does not wrap around.

Changing photos uses a very quick, understated horizontal transition that reinforces direction. A starting target is approximately 150–180 ms. The transition should not delay rapid keyboard navigation and must be removed when the operating system requests reduced motion.

## 4. Photo information

If the current photo contains a caption, a capture date and time, or both, the
available information is displayed by default in a readable overlay near the
bottom of the image.

- The overlay uses a subtle gradient or translucent background.
- It should remain legible without covering more of the photo than necessary.
- The user can toggle caption and capture time together with the `I` key and a
  visible-but-quiet information control, following Lightroom's familiar shortcut.
- The information visibility preference persists while browsing the current folder.
- Missing caption text must not suppress an available capture date and time.
- A photo with neither caption nor capture time shows no empty overlay.

Caption precedence after representative-photo inspection is: XMP description,
IPTC caption/abstract, EXIF image description, then XMP or IPTC title as a
fallback. The MVP reads captions but does not create or edit them.

## 5. Map view

The map concerns the **current photo only** in the MVP. It does not yet show every photo in the folder.

The user toggles it with:

- The `M` key
- A map control in the upper-right area of the viewer

The upper-right is the selected location because map display is a global viewing-mode action, while the left and right edges remain dedicated to photo navigation. The control should appear with the other pointer controls and fade when idle.

When active:

- The viewport becomes a split view: photo on the left, map on the right.
- The initial split is 80% photo and 20% map.
- On desktop, the center divider can be dragged horizontally to resize the photo and map between 20/80 and 80/20.
- The photo refits inside its half without cropping or distortion.
- The map centers on the current photo's GPS coordinates and shows one clear marker.
- Pan and zoom work normally.
- Moving to another geotagged photo updates and recenters the map.
- Moving to a photo without GPS keeps map mode open and replaces the map with a
  message that the current photo has no GPS coordinates. Navigating to another
  geotagged photo restores the map automatically.
- Pressing `M` again or `Escape` closes the map and restores the full-width photo.

Map mode is a user-controlled viewing preference and must never close itself in
response to photo navigation. The map control and `M` remain available when the
current photo has no usable GPS coordinates; opening map mode then shows the
same no-GPS message in the map panel.

### Map technology decision

The MVP will use **MapLibre GL JS** as its map renderer, with **OpenFreeMap** vector tiles and the **Positron** style as the initial basemap. MapLibre is a committed MVP technology choice. OpenFreeMap is the initial tile provider and must remain replaceable rather than becoming embedded throughout the application.

This decision was made because:

- MapLibre is open source and does not require an API key, billing account, or per-map-load fee.
- Its WebGL vector rendering provides flexible styling and a responsive, modern map UI.
- It supports the expected evolution of the product: many photo points, clustering, click and hover interactions, custom popups, application-to-map selection updates, and GPS tracks represented as GeoJSON lines.
- Keeping photo selection and map data in application state allows two-way interaction: selecting a photo can update the map, and selecting a map feature can navigate to its photo.
- The renderer is independent of the basemap provider, reducing vendor lock-in and leaving a path to a paid provider or self-hosted tiles if reliability, scale, satellite imagery, or offline use later requires it.
- OpenFreeMap currently provides a free, API-key-free public vector-tile service based on OpenStreetMap data.
- Positron is visually restrained and should support the photographs rather than compete with them.

The MVP does not require place search, reverse geocoding, routing, satellite imagery, or Street View. These are separate services and may receive separate provider decisions if they enter the product scope.

Map attribution must remain visible. The photo and its metadata stay local, but opening the map requires an internet connection and sends tile requests for the viewed area to the configured provider. The UI should not imply that the entire application is offline when this feature is active. OpenFreeMap's public service currently has no SLA, so the tile-provider URL should be centralized in configuration and map interactions must not depend on provider-specific APIs.

## 6. Minimal controls

Keyboard controls for the MVP:

| Key | Action |
| --- | --- |
| Left Arrow | Previous photo |
| Right Arrow | Next photo |
| I | Show or hide photo information (caption and capture time) |
| M | Open or close map |
| F | Enter or leave browser fullscreen |
| Escape | Exit fullscreen; otherwise close the map or dismiss the active overlay |

Pointer controls:

- Previous photo at the left edge
- Next photo at the right edge
- Information toggle near the information overlay
- Map toggle in the upper-right
- A discreet **Choose another folder** action, revealed with the controls rather than permanently occupying the viewing surface

Every icon must have a tooltip and an accessible name. Keyboard focus must be visible when navigating controls without a mouse.

## 7. Desktop packaging and MVP distribution

The accepted MVP testing format is a self-contained macOS desktop application
packaged with Electron. It reuses the existing Svelte and Vite application and
bundles Chromium rather than requiring a browser tab, hosted Memory Atlas site,
local development server, Node.js installation, or npm command at runtime.

The first release artifacts are a versioned `.app` and `.dmg`. Updates are
installed manually for the MVP so testers can keep and compare stable builds
without an update service. Builds routinely shared with other Macs should be
code-signed and notarized; early development builds may remain unsigned.

Application code, selected photos, and extracted metadata stay local. The map
is the explicit network-dependent exception and continues to request tiles for
the displayed area from the configured provider.

Only macOS packaging is in scope. Windows, Linux, phones, tablets, app stores,
hosted deployment, PWA installation, and automatic updates are deferred. See
[`deployment-options.md`](deployment-options.md) for the alternatives and
accepted boundary.

## 8. Explicitly outside this MVP

- Thumbnail grid or contact sheet
- Map markers for all photos
- Videos or non-JPEG image formats
- Recursive folder scanning
- GPX tracks and routes
- Timeline, people, tag, or topic views
- AI-generated captions or summaries
- Metadata editing
- In-app photo management, deletion, renaming, or drag-and-drop reordering
- Accounts, cloud upload, and synchronization
- Saved albums or a recent-folder library
- Fully offline maps
- Mobile-first gestures and touch-specific UI
- Windows and Linux application packages
- Phone and tablet applications
- Hosted web and PWA distribution
- Automatic desktop updates

These are excluded to keep the first build focused, not rejected from the longer-term vision.

## 9. Acceptance criteria

The MVP is successful when:

1. A user can choose a local folder from the entry screen.
2. All readable JPEG files directly inside that folder become available in
   case-insensitive natural file-name order, regardless of capture time.
3. The selected photo fills the available viewing area as much as possible without cropping, stretching, or modifying the file.
4. Left/right keyboard navigation and mouse controls work reliably.
5. Navigation has a quick directional transition that does not impede rapid browsing.
6. Available caption and capture time information is shown by default and can be
   toggled together with `I`; a capture time remains visible when no caption exists.
7. Map mode opens in an initially 80/20 photo-and-map view through both `M` and
   an on-screen control, and its center divider can resize the two panels.
8. The map shows the correct location and follows the current photo as the user
   navigates, while remaining open with an explanatory placeholder on photos
   without GPS.
9. Photos without displayable information or GPS data produce intentional,
   understandable UI states.
10. The user can return to folder selection without restarting the app.
11. Pressing `F` enters browser fullscreen, pressing `F` again or `Escape` exits it, and an unavailable or denied request fails gracefully.
12. Original photos remain byte-for-byte untouched.
13. On macOS, a packaged build launches from the `.app` without VS Code, Node.js,
    npm, a Vite server, or a hosted Memory Atlas origin, and the core journey
    works from an installation made with the versioned `.dmg`.

## 10. Questions to validate during implementation

These are best answered with a working slice rather than more abstract design:

- Does the globe/Earth entry visual feel evocative, or does it overstate the role of travel and geography?
- Is a horizontal slide transition elegant at speed, or is a very short crossfade calmer?
- Should the caption sit over the photo or occupy its own narrow region below it?
- Which real metadata fields contain captions and GPS coordinates in the user's exported photos?
- Is top-level-only folder scanning sufficient for the user's actual organization?
- Is OpenFreeMap's Positron style attractive enough, or should Memory Atlas eventually carry a custom map style?
- Does the existing directory input behave reliably in packaged Electron, or is
  a native folder dialog justified?

## 11. First implementation slice

The first build should prove the riskiest path end to end:

> Choose one folder, scan JPEGs, display one correctly oriented photo, navigate with Arrow keys, show one real embedded caption, and open one real GPS coordinate on the split-screen map.

Loading polish, pointer-control animation, error recovery, and visual refinement can follow once that path works with representative photos.

The packaging slice follows the implemented browser slice:

> Load the existing Vite production build in a hardened Electron window, prove
> the complete core journey from a packaged `.app`, and then produce a versioned
> `.dmg` that can be installed and tested without development tooling.
