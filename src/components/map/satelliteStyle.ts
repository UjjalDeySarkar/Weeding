import type { TransformStyleFunction } from 'maplibre-gl'

type StyleSpecification = Parameters<TransformStyleFunction>[1]
type LayerSpecification = StyleSpecification['layers'][number]
type SourceSpecification = StyleSpecification['sources'][string]

/**
 * EOxCloudless — free Sentinel-2 imagery for non-commercial use, no API key.
 * 10 m resolution, so tiles stop at zoom 15 and MapLibre scales them beyond that.
 */
const YEAR = 2024
const satelliteSource: SourceSpecification = {
  type: 'raster',
  tiles: [`https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-${YEAR}_3857/default/g/{z}/{y}/{x}.jpg`],
  tileSize: 256,
  maxzoom: 15,
  attribution: `<a href="https://cloudless.eox.at" target="_blank" rel="noreferrer">EOxCloudless ${YEAR}</a> by EOX IT Services GmbH (Contains modified Copernicus Sentinel data ${YEAR})`,
}

/** Vector layers that would paint over the imagery */
const HIDDEN = /^(natural_earth|park|landuse|landcover|water$|waterway_(tunnel|river|other)$|aeroway_fill|road_area_pattern|building|tunnel_)|(casing|rail|hatching)$/

/** Latin-script names: MapLibre can't shape Bengali conjuncts yet */
const LATIN_NAME = ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']]

function restyle(layer: LayerSpecification): LayerSpecification | LayerSpecification[] {
  switch (layer.type) {
    case 'background':
      return [
        { ...layer, paint: { 'background-color': '#16233f' } },
        { id: 'satellite', type: 'raster', source: 'satellite', paint: { 'raster-fade-duration': 250 } },
      ]
    case 'line':
      return layer.id.startsWith('boundary')
        ? { ...layer, paint: { ...layer.paint, 'line-color': 'rgba(255, 255, 255, 0.6)' } }
        : { ...layer, paint: { ...layer.paint, 'line-opacity': 0.55 } }
    case 'symbol': {
      // Shields and arrows are images — leave them as they are
      if (/shield|one_way/.test(layer.id)) return layer
      const hasName = JSON.stringify(layer.layout?.['text-field'] ?? '').includes('name')
      return {
        ...layer,
        layout: hasName ? { ...layer.layout, 'text-field': LATIN_NAME } : layer.layout,
        paint: {
          ...layer.paint,
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(12, 14, 24, 0.85)',
          'text-halo-width': 1.5,
        },
      } as LayerSpecification
    }
    default:
      return layer
  }
}

/** Turns the OpenFreeMap vector style into a satellite "hybrid": imagery with roads and labels on top */
export const toSatellite: TransformStyleFunction = (_previous, next) => ({
  ...next,
  sources: { ...next.sources, satellite: satelliteSource },
  layers: next.layers.filter((layer) => !HIDDEN.test(layer.id)).flatMap(restyle),
})
