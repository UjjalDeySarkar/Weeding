import { BufferGeometry, Float32BufferAttribute } from 'three'
import { spline, type Point } from '@/lib/spline'

/**
 * Courses lie on the ground plane: 2D points are [x, z] in metres. A heading is a rotation about Y,
 * so an object facing +Z with `rotation.y = heading` faces along the course. "Right" is the driver's right.
 */
export interface Pose {
  x: number
  z: number
  heading: number
}

export const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

/** Development only: `?quick` in the URL shortens every leg, for testing */
export const SHORTEN = import.meta.env.DEV && new URLSearchParams(window.location.search).has('quick') ? 0.3 : 1

/** Seeded random numbers, so every course looks the same each time it's played */
export function random(seed: number) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** A road, rail line or flight path: a smooth centreline sampled every couple of metres */
export class Course {
  readonly length: number
  readonly count: number
  readonly spacing: number
  private readonly xs: Float32Array
  private readonly zs: Float32Array
  private readonly hs: Float32Array

  constructor(points: Point[], spacing = 2) {
    const path = spline(points, { steps: 16 })
    const count = Math.max(2, Math.ceil(path.length / spacing) + 1)
    this.length = path.length
    this.count = count
    this.spacing = path.length / (count - 1)
    this.xs = new Float32Array(count)
    this.zs = new Float32Array(count)
    this.hs = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const p = path.at(i / (count - 1))
      this.xs[i] = p.x
      this.zs[i] = p.y
      // spline headings run from +x towards +y; ours turn from +z towards +x
      this.hs[i] = Math.PI / 2 - p.heading
    }
  }

  at(s: number, out: Pose = { x: 0, z: 0, heading: 0 }): Pose {
    const f = Math.min(Math.max(s / this.spacing, 0), this.count - 1)
    const i = Math.min(Math.floor(f), this.count - 2)
    const t = f - i
    out.x = this.xs[i] + (this.xs[i + 1] - this.xs[i]) * t
    out.z = this.zs[i] + (this.zs[i + 1] - this.zs[i]) * t
    out.heading = this.hs[i] + wrapAngle(this.hs[i + 1] - this.hs[i]) * t
    // Past either end, carry straight on
    if (s > this.length || s < 0) {
      const over = s > this.length ? s - this.length : s
      out.x += Math.sin(out.heading) * over
      out.z += Math.cos(out.heading) * over
    }
    return out
  }

  /** The point `offset` metres to the right of the centreline */
  side(s: number, offset: number, out: Pose = { x: 0, z: 0, heading: 0 }): Pose {
    this.at(s, out)
    out.x -= Math.cos(out.heading) * offset
    out.z += Math.sin(out.heading) * offset
    return out
  }

  /**
   * The closest centreline point to (x, z): how far along it is and how far to the right of it (x, z) lies.
   * Past either end, `s` keeps counting along the straight extension (below 0 or above `length`).
   * With `hint` (a recent `s`) only the nearby stretch is searched, which keeps it cheap every frame.
   */
  project(x: number, z: number, hint?: number) {
    let lo = 0
    let hi = this.count - 1
    if (hint !== undefined) {
      const c = Math.round(hint / this.spacing)
      lo = Math.max(0, c - 60)
      hi = Math.min(this.count - 1, c + 60)
    }
    let best = lo
    let bestD = Infinity
    for (let i = lo; i <= hi; i++) {
      const d = (this.xs[i] - x) ** 2 + (this.zs[i] - z) ** 2
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    // Refine on the neighbouring segments
    let s = best * this.spacing
    let closest = Infinity
    for (const j of [best - 1, best]) {
      if (j < 0 || j >= this.count - 1) continue
      const ax = this.xs[j]
      const az = this.zs[j]
      const dx = this.xs[j + 1] - ax
      const dz = this.zs[j + 1] - az
      // Before the start or past the end, keep counting along the straight extension
      const raw = ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)
      const t = Math.min(j === this.count - 2 ? Infinity : 1, Math.max(j === 0 ? -Infinity : 0, raw))
      const d = (ax + dx * t - x) ** 2 + (az + dz * t - z) ** 2
      if (d < closest) {
        closest = d
        s = (j + t) * this.spacing
      }
    }
    const p = this.at(s)
    const offset = -(x - p.x) * Math.cos(p.heading) + (z - p.z) * Math.sin(p.heading)
    return { s, offset, distance: Math.sqrt(closest) }
  }

  /** Bends sharper than this many radians over the next `ahead` metres */
  bend(s: number, ahead: number) {
    return Math.abs(wrapAngle(this.at(s + ahead).heading - this.at(s).heading))
  }
}

/**
 * A flat strip along the course between two offsets (negative = left), facing up.
 * UVs: u runs across (0 at `left`, 1 at `right`), v counts metres along divided by `repeat`.
 */
export function ribbon(course: Course, left: number, right: number, { from = 0, to = course.length, y = 0, repeat = 10, step = 3 } = {}) {
  const n = Math.max(2, Math.ceil((to - from) / step) + 1)
  const position: number[] = []
  const uv: number[] = []
  const normal: number[] = []
  const index: number[] = []
  const p: Pose = { x: 0, z: 0, heading: 0 }
  for (let i = 0; i < n; i++) {
    const s = from + ((to - from) * i) / (n - 1)
    for (const [u, offset] of [
      [0, left],
      [1, right],
    ]) {
      course.side(s, offset, p)
      position.push(p.x, y, p.z)
      uv.push(u, s / repeat)
      normal.push(0, 1, 0)
    }
    if (i) {
      const a = (i - 1) * 2
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normal, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geometry.setIndex(index)
  return geometry
}

/** A gently winding line heading north (towards −z), `length` metres long */
export function winding(length: number, seed: number, { wiggle = 0.45, segment = 160, swing = 0.6 } = {}): Point[] {
  const rand = random(seed)
  const north = -Math.PI / 2
  let dir = north
  let x = 0
  let z = 0
  const points: Point[] = [[0, 0]]
  for (let d = 0; d < length; d += segment) {
    dir = Math.min(north + swing, Math.max(north - swing, dir + (rand() - 0.5) * wiggle))
    x += Math.cos(dir) * segment
    z += Math.sin(dir) * segment
    points.push([x, z])
  }
  return points
}

const pathLength = (points: Point[]) => points.reduce((sum, p, i) => (i ? sum + Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) : 0), 0)

/** Evenly spaced points along a polyline */
function resample(points: Point[], spacing: number): Point[] {
  const out: Point[] = [points[0]]
  let carry = 0
  for (let i = 1; i < points.length; i++) {
    const [ax, az] = points[i - 1]
    const [bx, bz] = points[i]
    const length = Math.hypot(bx - ax, bz - az)
    let d = spacing - carry
    while (d <= length) {
      out.push([ax + ((bx - ax) * d) / length, az + ((bz - az) * d) / length])
      d += spacing
    }
    carry = length - (d - spacing)
  }
  const last = points[points.length - 1]
  if (Math.hypot(last[0] - out[out.length - 1][0], last[1] - out[out.length - 1][1]) > spacing / 3) out.push(last)
  else out[out.length - 1] = last
  return out
}

/** Chaikin corner cutting: rounds the corners, keeps both ends */
function chaikin(points: Point[]): Point[] {
  const out: Point[] = [points[0]]
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i]
    const [bx, bz] = points[i + 1]
    out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25], [ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75])
  }
  out.push(points[points.length - 1])
  return out
}

/**
 * The shape of a real route ([lat, lng] pairs) shrunk to `length` metres, with corners rounded
 * so it can be ridden at speed. North is −z, east is +x.
 */
export function routeShape(path: number[][], length: number): Point[] {
  const [lat0, lng0] = path[0]
  const kx = 111_320 * Math.cos((lat0 * Math.PI) / 180)
  const real: Point[] = path.map(([lat, lng]) => [(lng - lng0) * kx, -(lat - lat0) * 110_540])
  const k = length / pathLength(real)
  const scaled = real.map(([x, z]): Point => [x * k, z * k])
  return chaikin(chaikin(resample(scaled, 28)))
}

/** Ends a winding course with a straight run, so set pieces at the end sit square */
export function straightEnd(points: Point[], length: number): Point[] {
  const [ax, az] = points[points.length - 2]
  const [bx, bz] = points[points.length - 1]
  const d = Math.hypot(bx - ax, bz - az)
  const ux = (bx - ax) / d
  const uz = (bz - az) / d
  return [...points, [bx + ux * length * 0.5, bz + uz * length * 0.5], [bx + ux * length, bz + uz * length]]
}
