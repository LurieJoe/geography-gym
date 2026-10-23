// Which Mapdle answers are a whole U.S. state or a whole country (not a city, landmark, waterway, or territory).
// For these, green means the pin is inside the state or country. Keyed by puzzle id, because the puzzle list is append-only.
// New state or country puzzles added later: add their ids below. Anything not listed keeps the distance rule.
import { feature } from 'topojson-client'
import { geoContains } from 'd3-geo'
import type { GeometryCollection, Topology } from 'topojson-specification'
import type { Coord } from './logic'

const US_STATE_IDS: number[] = [1,21,39,40,56,58,60,63,72,81,83,90,95,101,102,124,141,143,148,157,164,191,207,209,217,219,221,230,233,239,242,251,257,260,269,274,278,279,282,283,294,299,301,304,313,316,327,331,338]
const COUNTRY_IDS: number[] = [3,5,10,12,14,18,25,26,32,37,42,46,47,49,51,53,62,65,67,70,74,76,77,87,92,94,97,104,108,112,115,116,122,127,131,132,138,139,145,146,150,152,153,159,163,166,168,170,171,173,177,180,182,184,188,193,195,196,198,200,202,203,205,210,212,216,225,226,232,237,240,244,246,249,253,254,258,262,264,265,267,271,272,276,285,286,290,292,295,297,308,309,311,320,322,323,326,333,334,340]

export type RegionKind = 'state' | 'country'
export const REGION_KIND: Record<number, RegionKind> = {}
US_STATE_IDS.forEach((id) => { REGION_KIND[id] = 'state' })
COUNTRY_IDS.forEach((id) => { REGION_KIND[id] = 'country' })

/** How far outside the border still counts as inside, so pins on a coastline or border line are not unlucky. */
export const BORDER_MARGIN_KM = 10
/** Give up waiting for the map data after this long and use the plain distance rule instead. */
const LOAD_TIMEOUT_MS = 6000

type Shape = { type: string; coordinates: unknown }
type RegionFeature = { geometry: Shape }
type Loaded = RegionFeature[]

const cache: Partial<Record<RegionKind, Promise<Loaded>>> = {}
const shapes = new Map<number, RegionFeature | null>()

function load(kind: RegionKind): Promise<Loaded> {
  if (!cache[kind]) {
    cache[kind] = (kind === 'state'
      ? import('us-atlas/states-10m.json').then((m) => {
          const topology = m.default as unknown as Topology<{ states: GeometryCollection }>
          return feature(topology, topology.objects.states).features
        })
      : import('world-atlas/countries-50m.json').then((m) => {
          const topology = m.default as unknown as Topology<{ countries: GeometryCollection }>
          return feature(topology, topology.objects.countries).features
        })) as unknown as Promise<Loaded>
    cache[kind]!.catch(() => { delete cache[kind] }) // allow a retry if the download failed
  }
  return cache[kind]!
}

/** Finds the state or country shape that contains the puzzle's own answer point. */
async function shapeFor(id: number, target: Coord): Promise<RegionFeature | null> {
  const known = shapes.get(id)
  if (known !== undefined) return known
  const kind = REGION_KIND[id]
  if (!kind) return null
  const all = await load(kind)
  const found = all.find((f) => geoContains(f as never, [target.lon, target.lat])) ?? null
  shapes.set(id, found)
  return found
}

/** Starts downloading the map data in the background so the first pin does not have to wait. */
export function preloadRegion(id: number): void {
  const kind = REGION_KIND[id]
  if (kind) load(kind).catch(() => {})
}

const KM_PER_DEG = 111.195

function segmentDistanceKm(p: Coord, a: number[], b: number[]): number {
  const cos = Math.cos((p.lat * Math.PI) / 180)
  const wrap = (lon: number) => ((((lon - p.lon) % 360) + 540) % 360) - 180
  const ax = wrap(a[0]) * cos * KM_PER_DEG, ay = (a[1] - p.lat) * KM_PER_DEG
  const bx = wrap(b[0]) * cos * KM_PER_DEG, by = (b[1] - p.lat) * KM_PER_DEG
  const dx = bx - ax, dy = by - ay
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2))
  return Math.hypot(ax + t * dx, ay + t * dy)
}

/** Shortest distance (km) from a point to the outline of a shape. */
export function distanceToOutlineKm(p: Coord, geometry: Shape): number {
  let best = Infinity
  const ring = (points: number[][]) => {
    for (let i = 0; i + 1 < points.length; i++) {
      const d = segmentDistanceKm(p, points[i], points[i + 1])
      if (d < best) best = d
    }
  }
  if (geometry.type === 'Polygon') (geometry.coordinates as number[][][]).forEach(ring)
  else if (geometry.type === 'MultiPolygon') (geometry.coordinates as number[][][][]).forEach((poly) => poly.forEach(ring))
  return best
}

/**
 * true  = the pin is inside the answer's state or country (or within the small border margin)
 * false = it is outside
 * null  = this puzzle is not a state or country, or the map data was not available: use the plain distance rule
 */
export async function checkInside(id: number, target: Coord, pin: Coord): Promise<boolean | null> {
  if (!REGION_KIND[id]) return null
  try {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), LOAD_TIMEOUT_MS))
    const shape = await Promise.race([shapeFor(id, target), timeout])
    if (!shape) return null
    if (geoContains(shape as never, [pin.lon, pin.lat])) return true
    return distanceToOutlineKm(pin, shape.geometry) <= BORDER_MARGIN_KM
  } catch {
    return null
  }
}
