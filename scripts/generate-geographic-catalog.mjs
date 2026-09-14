#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_TOLERANCE = 0.002
const PARK_TOLERANCE = 0.00035

function argument(name) {
  const index = process.argv.indexOf(name)
  return index < 0 ? undefined : process.argv[index + 1]
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function squaredDistance(point, start, end) {
  let x = start[0]
  let y = start[1]
  let dx = end[0] - x
  let dy = end[1] - y
  if (dx || dy) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy)
    if (t > 1) [x, y] = end
    else if (t > 0) {
      x += dx * t
      y += dy * t
    }
  }
  dx = point[0] - x
  dy = point[1] - y
  return dx * dx + dy * dy
}

function simplifyLine(points, tolerance) {
  if (points.length <= 2) return points
  const threshold = tolerance * tolerance
  const markers = new Uint8Array(points.length)
  markers[0] = markers[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [first, last] = stack.pop()
    let maximum = threshold
    let selected
    for (let index = first + 1; index < last; index += 1) {
      const distance = squaredDistance(points[index], points[first], points[last])
      if (distance > maximum) {
        maximum = distance
        selected = index
      }
    }
    if (selected !== undefined) {
      markers[selected] = 1
      stack.push([first, selected], [selected, last])
    }
  }
  return points.filter((_, index) => markers[index])
}

function simplifyRing(ring, tolerance) {
  if (ring.length < 4) return undefined
  const open = ring.slice(0, -1)
  if (open.length < 3) return undefined
  // Rotate away from a duplicated start/end point so Douglas-Peucker receives
  // a meaningful baseline, then close the simplified ring again.
  const anchor = Math.floor(open.length / 2)
  const rotated = [...open.slice(anchor), ...open.slice(0, anchor), open[anchor]]
  const simplified = simplifyLine(rotated, tolerance)
  if (simplified.length < 4) return ring
  simplified[simplified.length - 1] = simplified[0]
  return simplified
}

function simplifyPolygon(polygon, tolerance) {
  return polygon.map(ring => simplifyRing(ring, tolerance)).filter(Boolean)
}

function simplifyGeometry(geometry, tolerance) {
  if (!geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type)) {
    throw new Error(`Unsupported boundary geometry: ${geometry?.type ?? 'missing'}`)
  }
  const coordinates = geometry.type === 'Polygon'
    ? simplifyPolygon(geometry.coordinates, tolerance)
    : geometry.coordinates.map(polygon => simplifyPolygon(polygon, tolerance)).filter(polygon => polygon.length)
  return { type: geometry.type, coordinates }
}

function swapGeometryAxes(geometry) {
  const swapRing = ring => ring.map(([latitude, longitude]) => [longitude, latitude])
  return geometry.type === 'Polygon'
    ? { ...geometry, coordinates: geometry.coordinates.map(swapRing) }
    : { ...geometry, coordinates: geometry.coordinates.map(polygon => polygon.map(swapRing)) }
}

function rings(geometry) {
  return geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
}

function allPoints(geometry) {
  return rings(geometry).flat()
}

function longitudeExtent(points) {
  const values = points.map(([longitude]) => ((longitude % 360) + 360) % 360).sort((a, b) => a - b)
  if (!values.length) throw new Error('Boundary contains no coordinates')
  let gapIndex = values.length - 1
  let largestGap = values[0] + 360 - values.at(-1)
  for (let index = 0; index < values.length - 1; index += 1) {
    const gap = values[index + 1] - values[index]
    if (gap > largestGap) {
      largestGap = gap
      gapIndex = index
    }
  }
  const start = values[(gapIndex + 1) % values.length]
  const width = 360 - largestGap
  const west = start > 180 ? start - 360 : start
  return [west, west + width]
}

function extent(geometry) {
  const points = allPoints(geometry)
  const [west, east] = longitudeExtent(points)
  const latitudes = points.map(([, latitude]) => latitude)
  return [west, Math.min(...latitudes), east, Math.max(...latitudes)]
}

function ringArea(ring) {
  let area = 0
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index]
    const [x2, y2] = ring[index + 1]
    area += x1 * y2 - x2 * y1
  }
  return Math.abs(area / 2)
}

function geometryArea(geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  return polygons.reduce((sum, polygon) => {
    const [outer, ...holes] = polygon
    return sum + ringArea(outer) - holes.reduce((holeSum, hole) => holeSum + ringArea(hole), 0)
  }, 0)
}

function area({ id, name, category, country, geometry }, tolerance) {
  const simplified = simplifyGeometry(geometry, tolerance)
  return {
    id,
    name,
    category,
    country,
    area: Number(geometryArea(simplified).toFixed(8)),
    extent: extent(simplified).map(value => Number(value.toFixed(6))),
    geometry: simplified,
  }
}

export function buildCatalog({ countries, admin1, npsParks, bfnParks }) {
  const areas = []
  for (const feature of countries.features) {
    const code = feature.properties.ADM0_A3
    if (!['DEU', 'USA'].includes(code)) continue
    areas.push(area({
      id: `country:${code}`,
      name: code === 'USA' ? 'United States' : 'Germany',
      category: 'country',
      country: code,
      geometry: feature.geometry,
    }, DEFAULT_TOLERANCE))
  }
  for (const feature of admin1.features) {
    const code = feature.properties.adm0_a3
    if (!['DEU', 'USA'].includes(code)) continue
    const subdivisionCode = feature.properties.iso_3166_2
    areas.push(area({
      id: `state:${subdivisionCode}`,
      name: subdivisionCode === 'US-DC'
        ? 'District of Columbia'
        : feature.properties.name_en || feature.properties.name,
      category: 'state',
      country: code,
      geometry: feature.geometry,
    }, DEFAULT_TOLERANCE))
  }
  for (const feature of npsParks.features) {
    areas.push(area({
      id: `park:US:${feature.properties.UNIT_CODE}`,
      name: feature.properties.UNIT_NAME,
      category: 'park',
      country: 'USA',
      geometry: feature.geometry,
    }, PARK_TOLERANCE))
  }
  for (const feature of bfnParks.features) {
    areas.push(area({
      id: `park:DE:${feature.properties.ID}`,
      name: feature.properties.NAME,
      category: 'park',
      country: 'DEU',
      // The BfN WFS snapshot declares EPSG:4326 and follows its latitude,
      // longitude axis order. The runtime catalog consistently stores GeoJSON
      // longitude, latitude pairs.
      geometry: swapGeometryAxes(feature.geometry),
    }, PARK_TOLERANCE))
  }
  const categoryOrder = { park: 0, state: 1, country: 2 }
  areas.sort((left, right) =>
    categoryOrder[left.category] - categoryOrder[right.category]
      || left.country.localeCompare(right.country)
      || left.name.localeCompare(right.name, 'en'),
  )
  return {
    schemaVersion: 1,
    simplification: {
      administrativeToleranceDegrees: DEFAULT_TOLERANCE,
      parkToleranceDegrees: PARK_TOLERANCE,
      algorithm: 'Douglas-Peucker per ring',
    },
    areas,
  }
}

export function generate({ countriesPath, admin1Path, npsParksPath, bfnParksPath, outputPath }) {
  const catalog = buildCatalog({
    countries: readJson(countriesPath),
    admin1: readJson(admin1Path),
    npsParks: readJson(npsParksPath),
    bfnParks: readJson(bfnParksPath),
  })
  const serialized = `${JSON.stringify(catalog)}\n`
  mkdirSync(path.dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, serialized)
  return {
    areaCount: catalog.areas.length,
    bytes: Buffer.byteLength(serialized),
    sha256: createHash('sha256').update(serialized).digest('hex'),
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const required = {
    countriesPath: argument('--countries'),
    admin1Path: argument('--admin1'),
    npsParksPath: argument('--nps-parks'),
    bfnParksPath: argument('--bfn-parks'),
    outputPath: argument('--output') || path.join(root, 'src/lib/geo/catalog.json'),
  }
  for (const [name, value] of Object.entries(required)) {
    if (!value) throw new Error(`Missing --${name.replace(/Path$/, '').replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`)
  }
  const result = generate(required)
  console.log(`Generated ${result.areaCount} geographic areas (${result.bytes} bytes, sha256 ${result.sha256})`)
}
