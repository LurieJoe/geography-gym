// Major rivers for the globe (Natural Earth, public domain). The data file is small but only loads when the globe is zoomed in.
import type { GeoPermissibleObjects } from 'd3-geo'

export async function loadRivers(): Promise<GeoPermissibleObjects> {
  const module = await import('./geodata/world-rivers.json')
  const lines = (module.default as unknown as { lines: number[][][] }).lines
  return { type: 'MultiLineString', coordinates: lines } as GeoPermissibleObjects
}
