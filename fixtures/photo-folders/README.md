# Representative photo folders

This directory contains local, read-only photo collections used to validate
folder selection, metadata extraction, stable ordering, image orientation,
caption behavior, GPS handling, decoding, and realistic scan performance.

## Current local corpus

`2026-06-20-Schlossherrenrunde/` contains 24 top-level JPEG files and is the
primary corpus for the first Memory Atlas implementation slice.

Treat every collection here as user source data:

- never rename, rewrite, rotate, optimize, or modify the photos;
- never generate sidecars or cache files inside a source folder;
- do not expose these folders through Vite's `public/` directory;
- do not upload image files or extracted metadata;
- do not commit local corpora unless their provenance, privacy, and reuse terms
  have been reviewed explicitly.

The `.gitignore` keeps local corpora untracked by default while preserving this
README as the stable location contract. Tests that require distributable fixtures
should use purpose-built, non-sensitive images in a separate tracked directory.

