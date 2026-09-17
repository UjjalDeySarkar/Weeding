import { useEffect, useId, useRef, type RefObject } from 'react'
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react'
import type { Lang } from '@/config/types'
import { useLang } from '@/i18n/context'
import { spline, type Point } from '@/lib/spline'

/*
 * A pair of Plain Tiger butterflies (Danaus chrysippus, common across Bengal) that fly in
 * once the invitation opens and settle on the couple's names.
 */

const FOREWING =
  'M1.5 -10 C 8 -20 22 -33 40 -40 C 44 -41.5 47.5 -39 47 -35 C 46 -27 43 -17 38 -9 C 35 -4 32 -1 28 1 C 20 0 10 -2 2 -3 Z'
const HINDWING =
  'M2 -5 C 10 -9 26 -8 36 -2 C 42 2 42 12 37 20 C 32 28 24 33 17 32 C 11 31 7 25 5 18 C 3.5 12 2.5 4 2 -5 Z'
const APEX = 'M20 -44 C 26 -32 33 -23 44 -15 L56 -12 L56 -50 Z'
// Only the outer edges carry the black border
const FOREWING_EDGE = 'M1.5 -10 C 8 -20 22 -33 40 -40 C 44 -41.5 47.5 -39 47 -35 C 46 -27 43 -17 38 -9 C 35 -4 32 -1 28 1'
// Orange centre of the hindwing; the black border is what's left around it, tapering at both ends
const HINDWING_DISC =
  'M2 -5 C 10 -9 26 -8 34 -2.5 C 38.5 2 38.8 11 34.5 18 C 30 25 23.5 29.5 17.5 29 C 12.5 28.5 8.8 24 7 17.5 C 5 12 2.5 4 2 -5 Z'

const FOREWING_VEINS = [
  'M3 -9 C 14 -20 26 -30 38 -37',
  'M4 -7 C 16 -15 28 -22 41 -27',
  'M4 -6 C 18 -10 30 -14 43 -19',
  'M4 -5 C 16 -6 28 -8 38 -9',
  'M3 -4 C 14 -3 24 -2 31 -1',
  'M19 -15 C 21 -12 21 -9 20 -6',
]
const HINDWING_VEINS = [
  'M3 -3 C 14 -5 26 -4 37 0',
  'M3 -2 C 14 2 26 6 40 10',
  'M3 0 C 12 6 22 13 36 20',
  'M3 1 C 10 10 18 20 26 31',
  'M3 2 C 7 12 11 22 16 32',
  'M13 -1 C 17 3 18 7 16 11',
]

const WHITE_BAND: Array<[number, number, number, number]> = [
  [28.8, -31.4, 2.1, 1.1],
  [32.4, -28.6, 2.5, 1.35],
  [36.3, -25.6, 2.2, 1.25],
  [39.6, -22.4, 1.6, 1],
  [42, -19.6, 1, 0.7],
]
const APEX_DOTS: Point[] = [
  [36, -36],
  [40, -34.5],
  [43.2, -31.5],
  [45.2, -27],
  [44.3, -21.5],
  [42.2, -15.8],
]
const HINDWING_DOTS: Point[] = [
  [38.6, 5],
  [39.2, 10.5],
  [37.3, 16.5],
  [34, 22],
  [29.6, 26.8],
  [24.4, 29.8],
  [19, 30.4],
  [12.5, 28],
]
// Second, finer row inside the hindwing border
const HINDWING_INNER_DOTS: Point[] = [
  [36.4, 8],
  [35.6, 13.5],
  [33, 19],
  [28.6, 23.6],
]

/** One pair of wings (right side); the left side is the same art mirrored */
function Wings({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${uid}-fw`} cx="0.04" cy="0.75" r="1.05">
          <stop offset="0" stopColor="#a44a16" />
          <stop offset="0.2" stopColor="#dc7a28" />
          <stop offset="0.62" stopColor="#f2a043" />
          <stop offset="1" stopColor="#e5862f" />
        </radialGradient>
        <radialGradient id={`${uid}-hw`} cx="0.05" cy="0.15" r="1.05">
          <stop offset="0" stopColor="#a04915" />
          <stop offset="0.22" stopColor="#df7f2c" />
          <stop offset="0.7" stopColor="#f6aa52" />
          <stop offset="1" stopColor="#ea8c36" />
        </radialGradient>
        <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${uid}-fwc`}>
          <path d={FOREWING} />
        </clipPath>
        <clipPath id={`${uid}-hwc`}>
          <path d={HINDWING_DISC} />
        </clipPath>
      </defs>

      {/* hindwing */}
      <path d={HINDWING} fill="#1d1410" />
      <path d={HINDWING_DISC} fill={`url(#${uid}-hw)`} />
      <g clipPath={`url(#${uid}-hwc)`}>
        <g fill="none" stroke="#5a280c" strokeWidth="0.6" strokeOpacity="0.65" strokeLinecap="round">
          {HINDWING_VEINS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g fill="#1d1410">
          <circle cx="17.5" cy="4.5" r="1.4" />
          <circle cx="21.5" cy="8.2" r="1.25" />
          <circle cx="15.6" cy="9.4" r="1.1" />
          <ellipse cx="25.5" cy="11" rx="2" ry="1.4" transform="rotate(30 25.5 11)" />
        </g>
        <path d={HINDWING} fill={`url(#${uid}-sheen)`} />
      </g>
      <g fill="#fbf5ea">
        {HINDWING_DOTS.map(([cx, cy]) => (
          <circle key={cx} cx={cx} cy={cy} r="0.75" />
        ))}
        {HINDWING_INNER_DOTS.map(([cx, cy]) => (
          <circle key={cx} cx={cx} cy={cy} r="0.45" />
        ))}
      </g>

      {/* forewing */}
      <path d={FOREWING} fill={`url(#${uid}-fw)`} />
      <g clipPath={`url(#${uid}-fwc)`}>
        <g fill="none" stroke="#5a280c" strokeWidth="0.6" strokeOpacity="0.65" strokeLinecap="round">
          {FOREWING_VEINS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <path d={APEX} fill="#1d1410" />
        <path d={FOREWING_EDGE} fill="none" stroke="#1d1410" strokeWidth="3" strokeLinecap="round" />
        <g fill="#fbf5ea">
          {WHITE_BAND.map(([cx, cy, rx, ry]) => (
            <ellipse key={cx} cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(-38 ${cx} ${cy})`} />
          ))}
          {APEX_DOTS.map(([cx, cy], i) => (
            <circle key={cx} cx={cx} cy={cy} r={i < 3 ? 0.9 : 0.6} />
          ))}
        </g>
        <path d={FOREWING} fill={`url(#${uid}-sheen)`} />
      </g>
      <path d={FOREWING} fill="none" stroke="#2a1a10" strokeWidth="0.4" />
    </>
  )
}

function Body() {
  return (
    <g>
      <g fill="none" stroke="#1d1410" strokeWidth="0.7" strokeLinecap="round">
        <path d="M-0.8 -19.5 C -3 -27 -6 -34 -9.5 -40" />
        <path d="M0.8 -19.5 C 3 -27 6 -34 9.5 -40" />
      </g>
      <ellipse cx="-9.8" cy="-40.6" rx="1.1" ry="2" transform="rotate(-30 -9.8 -40.6)" fill="#1d1410" />
      <ellipse cx="9.8" cy="-40.6" rx="1.1" ry="2" transform="rotate(30 9.8 -40.6)" fill="#1d1410" />
      <path d="M-2.4 -1 C -3 9 -1.8 21 0 27 C 1.8 21 3 9 2.4 -1 Z" fill="#2c1b12" />
      <path d="M-1.2 0 C -1.5 9 -0.8 19 0 24" fill="none" stroke="#c9772f" strokeWidth="0.8" strokeOpacity="0.7" />
      <ellipse cy="-8" rx="3.3" ry="7.4" fill="#1b1310" />
      <circle cy="-17.2" r="2.8" fill="#1b1310" />
      <circle cx="-1.9" cy="-18" r="1.25" fill="#3b2a20" />
      <circle cx="1.9" cy="-18" r="1.25" fill="#3b2a20" />
      <g fill="#fbf5ea">
        <circle cx="-0.9" cy="-15.6" r="0.45" />
        <circle cx="0.9" cy="-15.6" r="0.45" />
        <circle cx="-1.4" cy="-11" r="0.5" />
        <circle cx="1.4" cy="-11" r="0.5" />
        <circle cy="-6" r="0.55" />
        <circle cx="-1.5" cy="4" r="0.4" />
        <circle cx="1.5" cy="4" r="0.4" />
        <circle cx="-1.4" cy="10" r="0.4" />
        <circle cx="1.4" cy="10" r="0.4" />
      </g>
    </g>
  )
}

/** Top-down butterfly. `wing` is how far the wings are raised, in degrees (0 = flat open). */
export function Butterfly({ wing }: { wing: MotionValue<number> }) {
  const uid = `bf${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const left = useTransform(wing, (a) => a)
  const right = useTransform(wing, (a) => -a)

  return (
    <div className="relative aspect-[10/9] w-full" style={{ perspective: 240 }}>
      <motion.svg
        viewBox="-50 -45 50 90"
        className="absolute inset-y-0 left-0 h-full w-1/2 overflow-visible"
        style={{ rotateY: left, transformOrigin: '100% 50%' }}
      >
        <g transform="scale(-1 1)">
          <Wings uid={`${uid}l`} />
        </g>
      </motion.svg>
      <motion.svg
        viewBox="0 -45 50 90"
        className="absolute inset-y-0 right-0 h-full w-1/2 overflow-visible"
        style={{ rotateY: right, transformOrigin: '0% 50%' }}
      >
        <Wings uid={`${uid}r`} />
      </motion.svg>
      <svg viewBox="-50 -45 100 90" className="absolute inset-0 size-full overflow-visible">
        <Body />
      </svg>
    </div>
  )
}

interface Perch {
  /** Screen edge the butterfly flies in from */
  from: 'left' | 'right'
  /** Landing spot as a fraction of the name's box, per language */
  at: Record<Lang, Point>
  /** Resting angle in degrees */
  tilt: number
  delay: number
  duration: number
  seed: number
}

const PERCHES: [Perch, Perch] = [
  { from: 'left', at: { en: [0.86, 0.14], bn: [0.8, 0.13] }, tilt: -16, delay: 0.9, duration: 5, seed: 3 },
  { from: 'right', at: { en: [0.18, 0.16], bn: [0.26, 0.1] }, tilt: 14, delay: 1.3, duration: 5.4, seed: 11 },
]

const REST_ANGLE = 16

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const lerpAngle = (a: number, b: number, t: number) => a + ((((b - a) % 360) + 540) % 360 - 180) * t

/** Wanders in from off-screen, loops once above the name and rises onto it (offsets from the landing spot) */
function route(from: Perch['from'], [tx]: Point, width: number) {
  return spline(
    from === 'left'
      ? [[-(tx + 90), 230], [-tx * 0.5, 90], [-70, -120], [60, -80], [40, 30], [6, 44], [0, 0]]
      : [[width - tx + 90, -250], [(width - tx) * 0.45, -120], [80, 60], [-60, 110], [-40, 70], [-6, 44], [0, 0]],
  )
}

/** Deterministic 0–1 randomness, so each butterfly keeps its own rhythm */
function random(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function FlyingButterfly({
  perch,
  stage,
  target,
  ready,
}: {
  perch: Perch
  stage: RefObject<HTMLElement | null>
  target: RefObject<HTMLElement | null>
  ready: boolean
}) {
  const { lang } = useLang()
  const reduceMotion = useReducedMotion()
  const langRef = useRef(lang)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useMotionValue(perch.tilt)
  const opacity = useMotionValue(0)
  const air = useMotionValue(0)
  const wing = useMotionValue(REST_ANGLE)
  const scale = useTransform(air, (a) => 1 + 0.28 * a)
  // Shadow drifts away and softens while the butterfly is up in the air
  const filter = useTransform(
    air,
    (a) =>
      `drop-shadow(${1.5 + 9 * a}px ${2.5 + 16 * a}px ${1.5 + 5 * a}px rgba(43, 27, 24, ${0.34 - 0.16 * a}))`,
  )

  useEffect(() => {
    langRef.current = lang
  }, [lang])

  useEffect(() => {
    const stageEl = stage.current
    if (!ready || !stageEl) return

    const locate = (): Point | null => {
      const el = target.current
      if (!el) return null
      const s = stageEl.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      const [fx, fy] = perch.at[langRef.current]
      return [r.left - s.left + r.width * fx, r.top - s.top + r.height * fy]
    }

    const rand = random(perch.seed)
    let path: ReturnType<typeof spline> | null = null
    let start = 0
    let last = 0
    let flap = 0
    let nextFlutter = 2 + rand() * 2
    let doubleFlutter = false
    let raf = 0

    /** Wings at rest: slow breathing, now and then a slow close or a quick double flutter */
    const restPose = (r: number) => {
      if (r < 0 || reduceMotion) return REST_ANGLE
      const u = r - nextFlutter
      const length = doubleFlutter ? 0.56 : 1.7
      if (u > length) {
        nextFlutter = r + 2.5 + rand() * 3.5
        doubleFlutter = rand() < 0.4
      }
      if (u < 0 || u > length) return REST_ANGLE + 2 * Math.sin(r * 1.9) ** 2
      return REST_ANGLE + (doubleFlutter ? 46 : 54) * Math.sin((Math.PI * u) / (doubleFlutter ? 0.28 : length)) ** 2
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (!start) start = now + perch.delay * 1000
      const dt = Math.min((now - (last || now)) / 1000, 0.05)
      last = now
      const e = (now - start) / 1000
      const spot = locate()
      if (e < 0 || !spot) return

      path ??= route(perch.from, spot, stageEl.clientWidth)
      const t = reduceMotion ? 1 : clamp01(e / perch.duration)
      const p = 1 - (1 - t) ** 1.7
      const landing = smoothstep(0.8, 1, p)
      const lift = 1 - landing
      flap += dt * 2 * Math.PI * (4.4 - 2.6 * landing)

      let dx = 0
      let dy = 0
      let angle = perch.tilt
      if (t < 1) {
        const { x: px, y: py, heading } = path.at(p)
        const sway = lift * 9 * Math.sin(e * 5.3 + perch.seed)
        dx = px - Math.sin(heading) * sway
        dy = py + Math.cos(heading) * sway - lift * 2.5 * Math.sin(flap)
        angle = lerpAngle((heading * 180) / Math.PI + 90, perch.tilt, smoothstep(0.86, 1, p))
      }

      x.set(spot[0] + dx)
      y.set(spot[1] + dy)
      rotate.set(angle)
      air.set(lift)
      opacity.set(reduceMotion ? clamp01(e / 0.6) : 1)
      const flying = 8 + 64 * (0.5 - 0.5 * Math.cos(flap))
      wing.set(flying + (restPose(e - perch.duration) - flying) * landing)
    }

    const play = () => {
      if (raf) return
      last = 0
      raf = requestAnimationFrame(tick)
    }
    const pause = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    // Only animate while the hero is on screen
    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause()))
    observer.observe(stageEl)
    return () => {
      observer.disconnect()
      pause()
    }
  }, [ready, reduceMotion, perch, stage, target, x, y, rotate, air, opacity, wing])

  return (
    <motion.div className="absolute top-0 left-0 size-0" style={{ x, y, rotate, scale, opacity }}>
      <motion.div className="absolute top-0 left-0 w-12 -translate-1/2 sm:w-14" style={{ filter }}>
        <Butterfly wing={wing} />
      </motion.div>
    </motion.div>
  )
}

/** Two butterflies that land on the groom's and the bride's names once `ready` */
export function Butterflies({
  ready,
  stage,
  names,
}: {
  ready: boolean
  stage: RefObject<HTMLElement | null>
  names: [RefObject<HTMLElement | null>, RefObject<HTMLElement | null>]
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      {PERCHES.map((perch, i) => (
        <FlyingButterfly key={perch.seed} perch={perch} stage={stage} target={names[i]} ready={ready} />
      ))}
    </div>
  )
}
