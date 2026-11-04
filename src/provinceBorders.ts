// State, province, and similar region lines for every country except the U.S. (those come from us-atlas).
// The data file is big, so it loads only when the globe is zoomed in. Only the lines near the middle of the view are drawn.
import type { GeoPermissibleObjects } from 'd3-geo'

export interface ProvinceLine { points: number[][]; x: number; y: number; z: number; radius: number }
export interface ProvinceTier { start: number; lines: ProvinceLine[] }

const RAD = Math.PI / 180

function unit(lon: number, lat: number): [number, number, number] {
  const flat = Math.cos(lat * RAD)
  return [flat * Math.cos(lon * RAD), flat * Math.sin(lon * RAD), Math.sin(lat * RAD)]
}

function describe(points: number[][]): ProvinceLine {
  // The middle of each line and how far it reaches, so lines far from the view can be skipped quickly.
  let x = 0
  let y = 0
  let z = 0
  for (const point of points) {
    const [px, py, pz] = unit(point[0] as number, point[1] as number)
    x += px
    y += py
    z += pz
  }
  const length = Math.hypot(x, y, z) || 1
  x /= length
  y /= length
  z /= length
  let radius = 0
  for (const point of points) {
    const [px, py, pz] = unit(point[0] as number, point[1] as number)
    radius = Math.max(radius, Math.acos(Math.min(1, Math.max(-1, x * px + y * py + z * pz))))
  }
  return { points, x, y, z, radius }
}

/** Lines are grouped by the zoom level where they start to appear: countries with big states show first, countries with small ones later. */
export async function loadProvinceBorders(): Promise<ProvinceTier[]> {
  const module = await import('./geodata/world-admin1-lines.json')
  const raw = (module.default as unknown as { tiers: Array<{ start: number; coordinates: number[][][] }> }).tiers
  return raw.map((tier) => ({ start: tier.start, lines: tier.coordinates.map(describe) }))
}

/** The lines that could be on screen. `reach` is how far (in radians) from the middle of the view to look. */
export function visibleProvinceBorders(lines: ProvinceLine[], lon: number, lat: number, reach: number): GeoPermissibleObjects {
  const [cx, cy, cz] = unit(lon, lat)
  const coordinates: number[][][] = []
  for (const line of lines) {
    const angle = Math.acos(Math.min(1, Math.max(-1, cx * line.x + cy * line.y + cz * line.z)))
    if (angle <= reach + line.radius) coordinates.push(line.points)
  }
  return { type: 'MultiLineString', coordinates } as GeoPermissibleObjects
}
