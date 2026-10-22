// Border lines for the globe. Loaded on demand, so pages that never zoom in never download them.
import { mesh } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import type { GeoPermissibleObjects } from 'd3-geo'

type CountryTopology = Topology<{ countries: GeometryCollection }>
type StateTopology = Topology<{ states: GeometryCollection }>

/** Lines between neighboring countries (not coastlines). `detail` uses the larger, sharper data. */
export async function loadCountryBorders(detail: boolean): Promise<GeoPermissibleObjects> {
  const module = detail ? await import('world-atlas/countries-50m.json') : await import('world-atlas/countries-110m.json')
  const topology = module.default as unknown as CountryTopology
  return mesh(topology, topology.objects.countries, (a, b) => a !== b) as GeoPermissibleObjects
}

/** Lines between U.S. states. */
export async function loadStateBorders(): Promise<GeoPermissibleObjects> {
  const module = await import('us-atlas/states-10m.json')
  const topology = module.default as unknown as StateTopology
  return mesh(topology, topology.objects.states, (a, b) => a !== b) as GeoPermissibleObjects
}
