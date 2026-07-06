# Project Specification: Metadata-Rich Photo Presentation Viewer

Status: Historical initial proposal; superseded for MVP implementation  
Current product name: Memory Atlas

This document preserves the original implementation-oriented proposal. Its MVP
scope and technology suggestions—including a local backend, ExifTool, Leaflet,
generated thumbnails, an album index, and multi-photo map pins—are not current
decisions. Use [`mvp-description.md`](mvp-description.md) for accepted MVP
behavior and [`mvp-technology-stack.md`](mvp-technology-stack.md) for the accepted
implementation stack. [`project-context.md`](project-context.md) explains how
this proposal informed the longer-term product direction.

## 1. Product Intent

Build a local-first web application that turns a folder of exported photos into an interactive presentation experience.

The application should not be just another static slideshow. Its core purpose is to make the hidden metadata inside photos useful during viewing and presenting: captions, GPS coordinates, dates, tags, people, and later GPS tracks.

The app should help the user answer questions such as:

* What is this photo?
* Where was it taken?
* What other photos were taken nearby?
* Who or what is shown?
* How does this photo fit into the album, trip, hike, or story?

The intended use case is personal photo presentation: reviewing travel photos alone or showing them to family and friends.

## 2. MVP Goal

Create a browser-based local photo viewer that can load a folder of JPEG images, extract relevant metadata, and provide an elegant slideshow UI with:

* Large photo display
* Previous/next navigation
* Toggleable caption overlay
* Metadata panel
* Interactive map with photo location
* Album map showing pins for all geotagged photos
* Clickable map pins to jump to another photo
* Thumbnail overview

## 3. Non-Goals for MVP

The MVP should not edit original photos.

The MVP should not require cloud upload.

The MVP should not implement AI captioning yet.

The MVP should not require a database server.

The MVP should not support Lightroom integration yet.

The MVP should not modify EXIF/IPTC/XMP metadata.

## 4. Target Platform

The first version should run locally.

Preferred approach:

* A small local backend, for example Python FastAPI or Node.js
* A browser frontend, for example React, Vue, or plain modern JavaScript
* User selects a local photo folder
* Backend scans the folder and extracts metadata
* Frontend renders the interactive presentation

## 5. Metadata Sources

The app should read metadata from image files.

Relevant fields:

* File name
* File path
* Image dimensions
* Capture date/time
* GPS latitude and longitude
* Caption / description
* Title
* Keywords / tags
* People tags, if available
* Camera model
* Lens
* Optional: altitude
* Optional: orientation

Implementation should use a robust metadata reader such as ExifTool.

## 6. Generated Album Index

For performance, the app should generate a sidecar index file after scanning a folder.

Suggested file:

`album.index.json`

This file should contain normalized metadata for all photos in the folder.

The app should use this file for fast startup. If image files changed after the index was generated, the app should offer to rescan.

Example structure:

```json
{
  "albumTitle": "Uzbekistan 2025",
  "generatedAt": "2026-06-15T12:00:00Z",
  "photos": [
    {
      "id": "img_0001",
      "fileName": "DSC_0001.jpg",
      "relativePath": "DSC_0001.jpg",
      "captureDate": "2025-08-12T14:32:00",
      "caption": "Registan Square in Samarkand",
      "title": "Registan Square",
      "tags": ["architecture", "Uzbekistan", "Samarkand"],
      "people": [],
      "gps": {
        "lat": 39.6542,
        "lon": 66.9758,
        "altitude": null
      },
      "camera": {
        "make": "Apple",
        "model": "iPhone",
        "lens": null
      }
    }
  ]
}
```

## 7. Main User Interface

The main screen should have a presentation layout.

Primary elements:

* Full-screen photo area
* Left/right navigation
* Caption overlay, hidden by default
* Small eye icon to show/hide caption and metadata
* Map toggle
* Thumbnail overview toggle
* Keyboard support

Keyboard shortcuts:

* Right arrow: next photo
* Left arrow: previous photo
* Space: toggle caption
* M: toggle map
* T: toggle thumbnails
* F: fullscreen
* Esc: close overlay/panel

## 8. Caption Behavior

Captions should be hidden by default to preserve the visual impact of the photo.

The user should be able to show captions instantly:

* By clicking or hovering over an eye icon
* By pressing Space
* Optionally by moving the mouse near the bottom of the screen

Caption overlay should be elegant and readable:

* Semi-transparent background
* Caption text
* Optional tags
* Optional date/location summary

## 9. Map Behavior

If the current photo has GPS coordinates, show its location on an interactive map.

The map should support:

* Pan
* Zoom
* Current photo marker
* Markers for all other geotagged photos in the album
* Click marker to jump to that photo
* Optional clustering for many photos

Recommended map library:

* Leaflet.js with OpenStreetMap tiles

## 10. Thumbnail Overview

The app should provide an overview mode similar to Finder or Lightroom grid view.

Features:

* Thumbnail grid
* Click thumbnail to open photo
* Current photo highlighted
* Optional filtering by tag/person/location later
* Smooth transition back to presentation view

## 11. GPS Track Support, Later Feature

A later version should support GPX files.

If a folder contains a `.gpx` file, the app should show the track on the map.

Use cases:

* Show a hiking route
* Show where each photo was taken along the route
* Jump between route and photo locations

This is not required for MVP.

## 12. Technical Architecture

Suggested architecture:

Frontend:

* React or Vue
* Leaflet.js for maps
* CSS animations for transitions
* Browser fullscreen API

Backend:

* Python FastAPI or Node.js/Express
* Metadata extraction using ExifTool
* Thumbnail generation
* Album index generation

Storage:

* Original photos remain untouched
* Generated thumbnails stored in `.photo-presenter/cache`
* Metadata stored in `album.index.json`

## 13. MVP Workflow

1. User starts local app.
2. User selects photo folder.
3. App scans folder for JPEG files.
4. App extracts metadata.
5. App generates `album.index.json`.
6. App generates thumbnails.
7. App opens presentation view.
8. User navigates photos.
9. User toggles captions and map.
10. User clicks map pins or thumbnails to jump between photos.

## 14. Acceptance Criteria

The MVP is successful when:

* A local folder with JPEG photos can be loaded.
* Captions can be read from metadata and displayed.
* GPS coordinates can be read from metadata.
* Current photo location appears on a map.
* All geotagged photos in the folder appear as map pins.
* Clicking a map pin changes the current photo.
* User can navigate photos left/right.
* User can toggle caption visibility.
* User can open a thumbnail overview.
* Original photo files are never modified.

## 15. Implementation Order

Phase 1: Metadata prototype

* Load one folder
* Read JPEG metadata
* Print normalized JSON

Phase 2: Album index

* Generate `album.index.json`
* Detect stale index
* Rescan folder on demand

Phase 3: Basic viewer

* Show one photo
* Previous/next navigation
* Caption overlay

Phase 4: Map integration

* Show current photo on map
* Show all album photo pins
* Click pin to navigate

Phase 5: Presentation polish

* Fullscreen mode
* Smooth transitions
* Keyboard shortcuts
* Thumbnail grid

Phase 6: Future features

* GPX track support
* AI-generated missing captions
* Reverse geocoding
* People/tag filtering
* Export shareable static album
* Lightroom export workflow
