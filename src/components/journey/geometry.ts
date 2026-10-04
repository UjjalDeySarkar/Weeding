import type { LatLng } from '@/config/types'
import { spline, type Point } from '@/lib/spline'

// Map units are kilometres with north up: a flat projection centred on West Bengal
const LNG0 = 85.6
const LAT0 = 27.4
const KX = 111.32 * Math.cos((24.4 * Math.PI) / 180)
const KY = 110.57

export const project = (lng: number, lat: number): Point => [(lng - LNG0) * KX, (LAT0 - lat) * KY]
export const toMap = ({ lat, lng }: LatLng) => project(lng, lat)

/** Great-circle distance, for the numbers we show */
export function distanceKm(a: LatLng, b: LatLng) {
  const rad = Math.PI / 180
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
/** Where `p` sits between `a` and `b`, 0–1 */
export const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
export const smooth = (t: number) => t * t * (3 - 2 * t)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const mix = (a: Point, b: Point, t: number): Point => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
export const dist = (a: Point, b: Point) => Math.hypot(b[0] - a[0], b[1] - a[1])

/** 0 → 1 → 0 as `p` passes from `a` to `b`, fading over `edge` at each end */
export const shown = (p: number, a: number, b: number, edge = 0.008) =>
  (a <= 0 ? 1 : smooth(span(p, a, a + edge))) * (b >= 1 ? 1 : 1 - smooth(span(p, b - edge, b)))

export interface Route {
  length: number
  at: (t: number) => Point
  /** Points between `from` and `to` (either order), for drawing the part already travelled */
  slice: (from: number, to: number) => Point[]
  /** How far along (0–1) the route passes closest to `point` */
  nearest: (point: Point) => number
}

export function route(points: Point[]): Route {
  const path = spline(points, { steps: 24 })
  const at = (t: number): Point => {
    const { x, y } = path.at(t)
    return [x, y]
  }
  const samples = Math.max(24, Math.round(path.length / 3))
  const all = Array.from({ length: samples + 1 }, (_, i) => at(i / samples))
  return {
    length: path.length,
    at,
    slice: (from, to) => {
      const [a, b] = from < to ? [from, to] : [to, from]
      return [at(a), ...all.slice(Math.ceil(clamp01(a) * samples), Math.floor(clamp01(b) * samples) + 1), at(b)]
    },
    nearest: (point) => {
      let best = 0
      all.forEach((q, i) => {
        if (dist(q, point) < dist(all[best], point)) best = i
      })
      return best / samples
    },
  }
}

/** Route through map points given as [lng, lat], with real places at either end */
export const via = (from: Point, stops: [number, number][], to: Point) =>
  route([from, ...stops.map(([lng, lat]) => project(lng, lat)), to])

export const toPath = (points: Point[], close = false) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('') + (close ? 'Z' : '')
