// Generates lib/world-dots.ts: a dotted world map (equirectangular grid) used by
// components/world-route-map.tsx. Run with: node scripts/generate-world-dots.mjs
//
// Every land cell becomes a zero-length stroke ("m dx dy h0") so the whole map is
// a single <path> rendered with round linecaps, far lighter than thousands of
// <circle> elements. China and Brazil are emitted as separate paths so they can be
// highlighted on top of the base land layer.

import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { geoBounds, geoContains } from 'd3-geo'

const require = createRequire(import.meta.url)
const topojson = require('topojson-client')

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = resolve(ROOT, 'lib/world-dots.ts')

// ---------------------------------------------------------------------------
// Framing. The crop keeps the Americas' west coast and Oceania at the edges so
// the Hong Kong -> Brasil route takes a good share of the width (Antarctica and
// the far north are dropped).
// ---------------------------------------------------------------------------
const RESOLUTION = '50m'
const LON_MIN = -128
const LON_MAX = 168
const LAT_MIN = -56
const LAT_MAX = 76
const STEP = 2.2 // degrees per cell (square cells)
const CELL = 10 // svg units per cell
const DOT_RADIUS = 2.9 // svg units (stroke-width = 2 * radius)
// A cell is land when its center is on land or enough of its 3x3 sub-samples are,
// which keeps thin coastlines and islands (Japan, UK, Italy, Indonesia) readable.
const SUBSAMPLE_THRESHOLD = 3

const CHINA_ID = '156'
const BRAZIL_ID = '076'

const PLACES = {
  ORIGIN: { name: 'Hong Kong', lon: 114.17, lat: 22.32 },
  DESTINATION: { name: 'São Paulo', lon: -46.63, lat: -23.55 },
}

// ---------------------------------------------------------------------------

const cols = Math.round((LON_MAX - LON_MIN) / STEP)
const rows = Math.round((LAT_MAX - LAT_MIN) / STEP)
const MAP_WIDTH = cols * CELL
const MAP_HEIGHT = rows * CELL

const round1 = (n) => Math.round(n * 10) / 10
const normalizeLon = (lon) => (lon > 180 ? lon - 360 : lon < -180 ? lon + 360 : lon)

function project(lon, lat) {
  return {
    x: round1(((lon - LON_MIN) / STEP) * CELL),
    y: round1(((LAT_MAX - lat) / STEP) * CELL),
  }
}

function readTopo(name) {
  return JSON.parse(readFileSync(require.resolve(`world-atlas/${name}-${RESOLUTION}.json`), 'utf8'))
}

/** Splits a (Multi)Polygon feature into single polygons with a bbox for fast rejection. */
function toIndexedPolygons(geoFeature) {
  const geometry = geoFeature.geometry
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates
        : []

  return polygons.map((coordinates) => {
    const polygon = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates } }
    const [[west, south], [east, north]] = geoBounds(polygon)
    return { polygon, west, south, east, north }
  })
}

function makeContains(indexed) {
  return (lon, lat) => {
    for (const { polygon, west, south, east, north } of indexed) {
      if (lat < south || lat > north) continue
      const inLon = west <= east ? lon >= west && lon <= east : lon >= west || lon <= east
      if (!inLon) continue
      if (geoContains(polygon, [lon, lat])) return true
    }
    return false
  }
}

const landTopo = readTopo('land')
const countriesTopo = readTopo('countries')

const landFeature = topojson.feature(landTopo, landTopo.objects.land)
const landPolygons = (landFeature.type === 'FeatureCollection' ? landFeature.features : [landFeature]).flatMap(
  toIndexedPolygons
)
const isLand = makeContains(landPolygons)

function countryContains(id) {
  const geometry = countriesTopo.objects.countries.geometries.find((g) => String(g.id) === id)
  if (!geometry) throw new Error(`Country ${id} not found in countries-${RESOLUTION}.json`)
  return makeContains(toIndexedPolygons(topojson.feature(countriesTopo, geometry)))
}

const isChina = countryContains(CHINA_ID)
const isBrazil = countryContains(BRAZIL_ID)

const OFFSETS = [-1 / 3, 0, 1 / 3]

/** @type {{ land: number[][]; china: number[][]; brazil: number[][] }} column indexes per row */
const layers = {
  land: Array.from({ length: rows }, () => []),
  china: Array.from({ length: rows }, () => []),
  brazil: Array.from({ length: rows }, () => []),
}

const started = Date.now()

for (let row = 0; row < rows; row++) {
  const lat = LAT_MAX - (row + 0.5) * STEP
  for (let col = 0; col < cols; col++) {
    const lon = LON_MIN + (col + 0.5) * STEP

    const landSamples = []
    for (const dy of OFFSETS) {
      for (const dx of OFFSETS) {
        const sLon = normalizeLon(lon + dx * STEP)
        const sLat = lat + dy * STEP
        if (isLand(sLon, sLat)) landSamples.push([sLon, sLat])
      }
    }

    const centerOnLand = isLand(normalizeLon(lon), lat)
    if (!centerOnLand && landSamples.length < SUBSAMPLE_THRESHOLD) continue

    // Assign the dot to the country holding most of its land samples.
    const samples = landSamples.length > 0 ? landSamples : [[normalizeLon(lon), lat]]
    let china = 0
    let brazil = 0
    for (const [sLon, sLat] of samples) {
      if (isChina(sLon, sLat)) china++
      else if (isBrazil(sLon, sLat)) brazil++
    }
    const half = samples.length / 2

    if (china > 0 && china >= half) layers.china[row].push(col)
    else if (brazil > 0 && brazil >= half) layers.brazil[row].push(col)
    else layers.land[row].push(col)
  }
}

/** Encodes dots as one path: absolute M at the first dot of each row, relative m for the rest. */
function encode(layerRows) {
  let d = ''
  let count = 0
  layerRows.forEach((columns, row) => {
    if (columns.length === 0) return
    const y = (row + 0.5) * CELL
    columns.forEach((col, i) => {
      const x = (col + 0.5) * CELL
      d += i === 0 ? `M${round1(x)} ${round1(y)}h0` : `m${round1((col - columns[i - 1]) * CELL)} 0h0`
      count++
    })
  })
  return { d, count }
}

const land = encode(layers.land)
const china = encode(layers.china)
const brazil = encode(layers.brazil)

const origin = { ...PLACES.ORIGIN, ...project(PLACES.ORIGIN.lon, PLACES.ORIGIN.lat) }
const destination = { ...PLACES.DESTINATION, ...project(PLACES.DESTINATION.lon, PLACES.DESTINATION.lat) }

const file = `// AUTO-GENERATED by scripts/generate-world-dots.mjs. Do not edit.
// Source: Natural Earth via world-atlas (${RESOLUTION}). Equirectangular grid,
// lon ${LON_MIN}..${LON_MAX}, lat ${LAT_MIN}..${LAT_MAX}, ${STEP}° per cell.
// Regenerate with: node scripts/generate-world-dots.mjs

export const MAP_LON_MIN = ${LON_MIN}
export const MAP_LON_MAX = ${LON_MAX}
export const MAP_LAT_MIN = ${LAT_MIN}
export const MAP_LAT_MAX = ${LAT_MAX}
/** Degrees covered by one grid cell (square cells). */
export const MAP_STEP = ${STEP}
/** SVG units per grid cell. */
export const MAP_CELL = ${CELL}
export const MAP_WIDTH = ${MAP_WIDTH}
export const MAP_HEIGHT = ${MAP_HEIGHT}
/** Dot radius in SVG units; render the paths with strokeWidth = 2 * DOT_RADIUS and round linecaps. */
export const DOT_RADIUS = ${DOT_RADIUS}

export type MapPoint = { x: number; y: number }
export type MapPlace = MapPoint & { name: string; lon: number; lat: number }

/** Projects lon/lat (degrees) into map SVG units, matching the dot grid. */
export function project(lon: number, lat: number): MapPoint {
  return {
    x: Math.round(((lon - MAP_LON_MIN) / MAP_STEP) * MAP_CELL * 10) / 10,
    y: Math.round(((MAP_LAT_MAX - lat) / MAP_STEP) * MAP_CELL * 10) / 10,
  }
}

/** Hong Kong (partner supplier). */
export const ORIGIN: MapPlace = ${JSON.stringify(origin)}

/** São Paulo, Brasil (buyer). */
export const DESTINATION: MapPlace = ${JSON.stringify(destination)}

export const DOT_COUNT = { land: ${land.count}, china: ${china.count}, brazil: ${brazil.count} } as const

/** Land dots except China and Brazil. */
export const LAND_DOTS_PATH =
  '${land.d}'

export const CHINA_DOTS_PATH =
  '${china.d}'

export const BRAZIL_DOTS_PATH =
  '${brazil.d}'
`

writeFileSync(OUTPUT, file)

const kb = (statSync(OUTPUT).size / 1024).toFixed(1)
console.log(`world-dots: ${cols}x${rows} grid -> ${MAP_WIDTH}x${MAP_HEIGHT} units`)
console.log(`  dots: land ${land.count}, china ${china.count}, brazil ${brazil.count}`)
console.log(`  origin ${JSON.stringify(origin)}`)
console.log(`  destination ${JSON.stringify(destination)}`)
console.log(`  wrote ${OUTPUT} (${kb} KB) in ${Date.now() - started} ms`)
