import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCatalog } from './generate-geographic-catalog.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('the packaged geographic catalog matches its provenance and deterministic generator', () => {
  const bytes = readFileSync(path.join(root, 'src/lib/geo/catalog.json'))
  const catalog = JSON.parse(bytes)
  const provenance = JSON.parse(readFileSync(path.join(root, 'src/lib/geo/catalog.provenance.json'), 'utf8'))
  const hash = createHash('sha256').update(bytes).digest('hex')

  assert.equal(hash, provenance.output.sha256)
  assert.equal(bytes.byteLength, provenance.output.bytes)
  assert.equal(catalog.areas.length, provenance.output.areaCount)
  assert.deepEqual(
    Object.fromEntries(['country', 'state', 'park'].map(category => [
      category,
      catalog.areas.filter(area => area.category === category).length,
    ])),
    provenance.output.counts,
  )
  assert.equal(new Set(catalog.areas.map(area => area.id)).size, catalog.areas.length)
  assert.deepEqual(catalog.simplification, {
    administrativeToleranceDegrees: 0.002,
    parkToleranceDegrees: 0.00035,
    algorithm: 'Douglas-Peucker per ring',
  })

  const square = (west, south, east, north) => ({
    type: 'Polygon',
    coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]],
  })
  const source = {
    countries: { features: [{ properties: { ADM0_A3: 'DEU' }, geometry: square(5, 47, 15, 55) }] },
    admin1: { features: [{ properties: { adm0_a3: 'DEU', iso_3166_2: 'DE-BE', name: 'Berlin' }, geometry: square(13, 52, 14, 53) }] },
    npsParks: { features: [] },
    bfnParks: { features: [{ properties: { ID: 'example', NAME: 'Example Park' }, geometry: square(13.1, 52.1, 13.2, 52.2) }] },
  }
  assert.deepEqual(buildCatalog(source), buildCatalog(source))
  assert.deepEqual(buildCatalog(source).areas.map(area => area.id), [
    'park:DE:example', 'state:DE-BE', 'country:DEU',
  ])
})
