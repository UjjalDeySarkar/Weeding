import type { LatLng } from '@/config/types'

export interface Point {
  x: number
  y: number
}

interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

/** Flat projection that fits `points` into a box `width` units wide — accurate enough at city scale. */
export function fitProjection(points: LatLng[], width: number, padding: Padding) {
  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const kx = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180))
  const scale = (width - padding.left - padding.right) / ((maxLng - minLng) * kx)

  return {
    width,
    height: Math.round((maxLat - minLat) * scale + padding.top + padding.bottom),
    /** One unit on the map, in metres */
    metersPerUnit: 111_320 / scale,
    project: ({ lat, lng }: LatLng): Point => ({
      x: padding.left + (lng - minLng) * kx * scale,
      y: padding.top + (maxLat - lat) * scale,
    }),
  }
}

export const toPath = (points: Point[]) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
