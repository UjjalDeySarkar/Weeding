export type Point = [x: number, y: number]

export interface PathSample {
  x: number
  y: number
  /** Direction of travel in radians (0 = right, π/2 = down) */
  heading: number
}

const dist = (a: Point, b: Point) => Math.hypot(b[0] - a[0], b[1] - a[1])
const mix = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

/** One centripetal Catmull–Rom segment (p1 → p2), which never loops or cusps */
function segment(p0: Point, p1: Point, p2: Point, p3: Point, steps: number): Point[] {
  const k1 = Math.sqrt(dist(p0, p1)) || 1e-4
  const k2 = k1 + (Math.sqrt(dist(p1, p2)) || 1e-4)
  const k3 = k2 + (Math.sqrt(dist(p2, p3)) || 1e-4)
  const out: Point[] = []
  for (let i = 0; i < steps; i++) {
    const t = k1 + ((k2 - k1) * i) / steps
    const a1 = mix(p0, p1, t / k1)
    const a2 = mix(p1, p2, (t - k1) / (k2 - k1))
    const a3 = mix(p2, p3, (t - k2) / (k3 - k2))
    const b1 = mix(a1, a2, t / k2)
    const b2 = mix(a2, a3, (t - k1) / (k3 - k1))
    out.push(mix(b1, b2, (t - k1) / (k2 - k1)))
  }
  return out
}

/**
 * Smooth curve through `points`, sampled by distance travelled:
 * `at(0.5)` is halfway along the path, not halfway through the points.
 * A `closed` curve loops back to its first point.
 */
export function spline(points: Point[], { steps = 48, closed = false } = {}) {
  const n = points.length
  const ends: Point[] = closed
    ? [points[n - 1], ...points, points[0], points[1]]
    : [mix(points[1], points[0], 2), ...points, mix(points[n - 2], points[n - 1], 2)]
  const samples: Point[] = []
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    samples.push(...segment(ends[i], ends[i + 1], ends[i + 2], ends[i + 3], steps))
  }
  samples.push(closed ? points[0] : points[n - 1])
  const last = samples.length - 1
  // Neighbouring sample for the heading, wrapping around a closed curve
  const near = (i: number) => (closed ? samples[(i + last) % last] : samples[Math.min(Math.max(i, 0), last)])

  const lengths = [0]
  for (let i = 1; i < samples.length; i++) lengths.push(lengths[i - 1] + dist(samples[i - 1], samples[i]))
  const total = lengths[lengths.length - 1]

  return {
    length: total,
    at(progress: number): PathSample {
      const target = Math.min(Math.max(progress, 0), 1) * total
      let lo = 0
      let hi = lengths.length - 1
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if (lengths[mid] < target) lo = mid
        else hi = mid
      }
      const span = lengths[hi] - lengths[lo] || 1
      const [x, y] = mix(samples[lo], samples[hi], (target - lengths[lo]) / span)
      const before = near(lo - 2)
      const after = near(hi + 2)
      return { x, y, heading: Math.atan2(after[1] - before[1], after[0] - before[0]) }
    },
  }
}
