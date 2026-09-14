# 0004: Local geographic context catalog

**Status:** Accepted
**Date:** 2026-09-14

## Context

MA-FEAT-024 adds named camera scopes such as Lassen Volcanic National Park,
California, and Germany. A fixed map zoom cannot represent administrative and
protected areas with very different sizes and shapes. Runtime reverse
geocoding or boundary downloads would add availability, privacy, provider, and
terms-of-service dependencies to a feature that can operate from static data.

Protected and administrative areas also do not form one universal hierarchy.
A national park may cross state boundaries, and useful administrative levels
vary by country. The first demonstrated need covers Germany and the United
States rather than a speculative global catalog.

## Decision

Generate a versioned, simplified geographic-context catalog at build time and
package it as an explicit local application asset. Runtime code performs local
point-in-polygon containment and uses precomputed extents for camera fitting; it
makes no geocoding or boundary request.

The first catalog contains:

- Germany, its Bundesländer, and its Nationalparke; and
- the United States, its states or equivalents, and designated national parks.

The camera may derive explicit country-specific intermediate frames from these
packaged areas when a complete national multipolygon produces a poor everyday
view. The first such frame is **Contiguous United States**, computed from every
packaged U.S. state or equivalent except Alaska and Hawaii. It precedes the
complete United States scope throughout the U.S. country ladder. These frames
are named configuration, not fixed
zoom levels or a universal assumption that every country has the same useful
hierarchy.

Each area records a stable identifier, display name, category, country,
polygon or multipolygon geometry, and fitting extent. Matching categories are
independent rather than forced into a parent-child hierarchy. The camera orders
them National park, State, then Country; multiple matches within one category
are ordered by polygon area and then display name.

Use versioned authoritative or appropriately maintained sources with compatible
redistribution terms. The implemented catalog uses Natural Earth 5.1.2 public-
domain country and first-order administrative boundaries, the official NPS Land
Resources Division boundary service for U.S. national parks, and the official
BfN Schutzgebiete WFS `Nationalparke` layer under GeoNutzV for German national
parks. Exact source URLs, snapshots, hashes, selection rules, attribution, and
modification notices are recorded beside the catalog.

The repository must contain a reproducible generation path and provenance
record covering the source URL and version, retrieval date, license and required
attribution, transformation and simplification parameters, and generated output
hash. Source acquisition is an explicit maintainer operation; normal builds and
the packaged application do not fetch boundary data.

If a proposed source cannot be redistributed compatibly, omit that category
until an acceptable source is selected. Do not replace it with an implicit
runtime service.

## Consequences

Named geographic camera scopes work offline once the basemap itself has loaded,
do not disclose the current coordinate to a new provider, and behave
deterministically across browser and packaged builds. The application grows by
a bounded static asset and must test multipolygons, overlapping areas,
antimeridian-aware extents, invalid catalog isolation, and generated-asset
integrity.

Boundary data can become stale, so updates are deliberate release work rather
than live synchronization. The map uses the catalog for context and camera
framing, not navigation, legal boundaries, land ownership, or survey purposes.
Unsupported countries simply omit named geographic scopes. MA-FEAT-025 tracks
country expansion based on demonstrated trips and locally meaningful area
types.

Derived country frames reuse the catalog's validated, precomputed extents and
therefore add no runtime boundary download or separately maintained geometry.

## Implementation record

The initial 2026-09-14 catalog contains 148 areas: two countries, 67 first-order
administrative areas, and 79 national parks. `scripts/generate-geographic-catalog.mjs`
selects and simplifies Polygon and MultiPolygon source geometry, precomputes
antimeridian-aware extents, and emits stable ordering and identifiers. The
committed asset and its machine-readable provenance live under `src/lib/geo/`.

Administrative rings use a 0.002-degree Douglas-Peucker tolerance and park
rings use 0.00035 degrees. The catalog's SHA-256 digest and byte size are
asserted by an automated integrity test. Source acquisition is not part of a
normal build: maintainers retrieve the four recorded inputs, verify their
hashes, and invoke the generator explicitly. The normal application imports
only the committed result.

`src/lib/geo/NOTICE.md` supplies the Natural Earth, National Park Service, and
BfN notices. The release notice generator copies it and the machine-readable
provenance into `Contents/Resources/third-party/geographic-data/` so the
packaged application carries the data notices without adding a persistent map
overlay.

## Sources

- [Natural Earth terms of use](https://www.naturalearthdata.com/about/terms-of-use/)
- [Natural Earth vector 5.1.2](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2)
- [U.S. National Park Service boundary guidance](https://www.nps.gov/subjects/gisandmapping/npmap.htm)
- [NPS Land Resources Division boundary service](https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/NPS_Land_Resources_Division_Boundary_and_Tract_Data_Service/FeatureServer/2)
- [GeoNutzV](https://www.gesetze-im-internet.de/geonutzv/BJNR054700013.html)
- [BfN national parks in Germany](https://www.bfn.de/daten-und-fakten/nationalparke-deutschland)
