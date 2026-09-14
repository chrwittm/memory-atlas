# Geographic context catalog

The named map-camera scopes use `src/lib/geo/catalog.json`, a committed local
asset generated from four public source snapshots. Normal builds and runtime
code never fetch geographic boundaries. This runbook is only for deliberate
catalog maintenance under [ADR 0004](../architecture/decisions/0004-local-geographic-context-catalog.md).

The adjacent `catalog.provenance.json` is authoritative for exact URLs,
retrieval date, source SHA-256 hashes, selection rules, licenses, attribution,
generation parameters, byte size, area counts, and output hash. The adjacent
`NOTICE.md` contains the notices that ship with the desktop application.

## Reproduce the current catalog

Use Node.js 24.20.0. Retrieve inputs into a temporary directory; do not commit
the full upstream files:

```sh
catalog_inputs="$(mktemp -d)"

curl -fsSL \
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_countries.geojson \
  -o "$catalog_inputs/ne-countries.geojson"
curl -fsSL \
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_1_states_provinces.geojson \
  -o "$catalog_inputs/ne-admin1.geojson"

curl -fsSL --get \
  https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/NPS_Land_Resources_Division_Boundary_and_Tract_Data_Service/FeatureServer/2/query \
  --data-urlencode "where=UNIT_TYPE='National Parks' OR UNIT_CODE='NERI'" \
  --data-urlencode 'outFields=OBJECTID,UNIT_CODE,UNIT_NAME,PARKNAME,STATE,DATE_EDIT,Status' \
  --data-urlencode 'outSR=4326' \
  --data-urlencode 'geometryPrecision=6' \
  --data-urlencode 'f=geojson' \
  -o "$catalog_inputs/nps-parks.geojson"

curl -fsSL --get \
  https://geodienste.bfn.de/ogc/wfs/schutzgebiet \
  --data-urlencode 'SERVICE=WFS' \
  --data-urlencode 'VERSION=2.0.0' \
  --data-urlencode 'REQUEST=GetFeature' \
  --data-urlencode 'TYPENAMES=bfn_sch_Schutzgebiet:Nationalparke' \
  --data-urlencode 'OUTPUTFORMAT=GEOJSON' \
  --data-urlencode 'SRSNAME=EPSG:4326' \
  -o "$catalog_inputs/bfn-parks.geojson"
```

Verify the four input hashes against `catalog.provenance.json`, then generate:

```sh
shasum -a 256 "$catalog_inputs"/*

npm run generate:geo-catalog -- \
  --countries "$catalog_inputs/ne-countries.geojson" \
  --admin1 "$catalog_inputs/ne-admin1.geojson" \
  --nps-parks "$catalog_inputs/nps-parks.geojson" \
  --bfn-parks "$catalog_inputs/bfn-parks.geojson" \
  --output src/lib/geo/catalog.json
```

The BfN EPSG:4326 response uses latitude/longitude source-axis order; the
generator explicitly transforms it to GeoJSON longitude/latitude order. It
then simplifies each polygon ring, computes wrap-aware extents, and sorts
stable IDs deterministically. Do not preprocess a source silently outside the
generator.

For an unchanged source snapshot and generator, the command must report 148
areas, 3,221,695 bytes, and SHA-256
`ed573540d50260ef7b08fb09554edb535c5d50fdc00845e05692084f0bcb607b`.

## Updating the catalog

An update is release work, not an automatic refresh:

1. Inspect source schema, feature selection, coordinate order, and names.
2. Recheck the exact redistribution terms and required attribution. Omit any
   category whose terms cannot be documented compatibly.
3. Update the generator when a source contract changes; do not patch generated
   JSON by hand.
4. Regenerate `catalog.json`, then update every changed field in
   `catalog.provenance.json` and `NOTICE.md`.
5. Run `npm test`, `npm run check`, and `npm run build`. The tests validate the
   output hash, counts, stable identifiers, containment, multipolygons,
   antimeridian handling, and representative German and U.S. matches.
6. Run `node scripts/generate-third-party-notices.mjs` and confirm the notice
   and provenance appear under `out/legal/third-party/geographic-data/`.
7. Perform the packaged checks in the current delivery verification record.

The catalog frames photographic context only. It must not be described or used
as a legal, survey, land-ownership, navigation, or planning boundary source.
