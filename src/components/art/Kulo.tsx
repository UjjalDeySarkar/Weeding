import { useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { spline, type Point } from '@/lib/spline'

/*
 * Biyer kulo (বিয়ের কুলো): the painted bamboo winnowing tray of the boron dala.
 * KuloFrame paints one around its content (crossbar, cane-bound rim, woven body and an
 * interlaced knot border), sized to whatever it holds. It hangs upside down: rounded end
 * on top, crossbar at the bottom. Gatchhora (গাঁটছড়া), the wedding knot,
 * and JodaMachh, the pair of fish, are the motifs painted inside.
 */

const INK = '#2b1b18'

type Segment = [Point, Point, Point, Point]

const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const straight = (a: Point, b: Point): Segment => [a, lerp(a, b, 1 / 3), lerp(a, b, 2 / 3), b]
const fmt = ([x, y]: Point) => `${x.toFixed(1)} ${y.toFixed(1)}`

/** Kulo shape in the box l–r × t–b: straight top, sides flaring out to full width, broad rounded end */
function kuloShape(l: number, t: number, r: number, b: number, flare: number, depth: number): Segment[] {
  const cx = (l + r) / 2
  const half = (r - l) / 2
  const yA = t + Math.min(0.2 * (b - t), 90)
  const yB = Math.max(b - depth, yA)
  const rise = yA - t
  const k = 0.5523 // quarter-ellipse handle length
  return [
    straight([l + flare, t], [r - flare, t]),
    [[r - flare, t], [r - flare * 0.55, t + rise * 0.35], [r, yA - rise * 0.45], [r, yA]],
    straight([r, yA], [r, yB]),
    [[r, yB], [r, yB + (b - yB) * k], [cx + half * k, b], [cx, b]],
    [[cx, b], [cx - half * k, b], [l, yB + (b - yB) * k], [l, yB]],
    straight([l, yB], [l, yA]),
    [[l, yA], [l, yA - rise * 0.45], [l + flare * 0.55, t + rise * 0.35], [l + flare, t]],
  ]
}

const toPath = (segments: Segment[]) =>
  `M${fmt(segments[0][0])}${segments.map(([, c1, c2, end]) => `C${fmt(c1)} ${fmt(c2)} ${fmt(end)}`).join('')}Z`

function bezier([p0, p1, p2, p3]: Segment, t: number): Point {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]
}

const TOP = 18 // room for the crossbar and stick ends
const RIM = 6 // half the rim's width
const BAND = 18 // rim → centre of the knot border
const BAND_HALF = 10
const SWING = 5 // how far each strand of the knot swings from the centre line
const TWIST = 30 // length of one repeat of the knot

/** One repeat of the two-strand knot, cut where the strands are furthest apart so repeats join cleanly */
function knotRepeat(length: number) {
  const strand = (sign: number, from: number, to: number, steps: number) => {
    const points: Point[] = []
    for (let i = 0; i <= steps; i++) {
      const x = from + ((to - from) * i) / steps
      const phase = Math.PI / 2 + 2 * Math.PI * (x / length + 0.5)
      points.push([x, sign * SWING * Math.sin(phase)])
    }
    return `M${points.map(fmt).join('L')}`
  }
  const end = length / 2 + 0.6
  return {
    a: strand(1, -end, end, 18),
    b: strand(-1, -end, end, 18),
    // strand b crosses over at x = -length/4; strand a (drawn after b) crosses over at +length/4
    bOver: strand(-1, -length / 4 - length * 0.11, -length / 4 + length * 0.11, 6),
  }
}

function frameArt(width: number, height: number) {
  const l = RIM
  const r = width - RIM
  const b = height - RIM
  const flare = Math.min(0.07 * width, 28)
  const depth = Math.min(0.5 * (r - l), 0.42 * height)
  const inner = kuloShape(l + BAND, TOP + BAND, r - BAND, b - BAND, flare, depth - BAND)
  const centre = spline(
    inner.flatMap((segment) => Array.from({ length: 10 }, (_, i) => bezier(segment, i / 10))),
    { closed: true, steps: 6 },
  )
  const repeats = Math.max(8, Math.round(centre.length / TWIST))
  const edge = (offset: number) => {
    const points = Array.from({ length: 240 }, (_, i) => {
      const { x, y, heading } = centre.at(i / 240)
      return fmt([x - Math.sin(heading) * offset, y + Math.cos(heading) * offset])
    })
    return `M${points.join('L')}Z`
  }

  const outer = kuloShape(l, TOP, r, b, flare, depth)
  const upsideDown = outer.map((segment) => segment.map(([x, y]) => [x, height - y]) as Segment)

  return {
    outline: toPath(outer),
    clip: toPath(upsideDown),
    knot: knotRepeat(centre.length / repeats),
    repeats: Array.from({ length: repeats }, (_, k) => {
      const { x, y, heading } = centre.at((k + 0.5) / repeats)
      return `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((heading * 180) / Math.PI).toFixed(1)})`
    }),
    bandOuter: edge(BAND_HALF),
    bandInner: edge(-BAND_HALF),
    crossbar: { x: l + flare - 14, width: r - l - 2 * flare + 28 },
    sticks: [l + flare, r - flare],
  }
}

function useSize() {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<[number, number] | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const next: [number, number] = [Math.round(el.offsetWidth), Math.round(el.offsetHeight)]
      setSize((prev) => (prev?.[0] === next[0] && prev[1] === next[1] ? prev : next))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, size] as const
}

interface KuloFrameProps {
  children: ReactNode
  /** Painted inside the tray, clipped to its shape */
  backdrop?: ReactNode
  className?: string
}

export function KuloFrame({ children, backdrop, className }: KuloFrameProps) {
  const uid = `kulo${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [ref, size] = useSize()
  const art = useMemo(() => size && frameArt(...size), [size])

  return (
    <div ref={ref} className={cn('relative', className)}>
      {art && size && (
        <>
          <svg
            width={size[0]}
            height={size[1]}
            className="pointer-events-none absolute top-0 left-0 overflow-visible drop-shadow-[0_30px_40px_rgba(109,14,19,0.28)]"
            aria-hidden="true"
          >
            <defs>
              {/* herringbone weave */}
              <pattern id={`${uid}-weave`} width="18" height="9" patternUnits="userSpaceOnUse">
                <path d="M0 9 L9 0 M-2 2 L2 -2 M7 11 L11 7" stroke="#6b3a12" strokeOpacity="0.1" strokeWidth="1.8" />
                <path d="M9 0 L18 9 M7 -2 L11 2 M16 7 L20 11" stroke="#6b3a12" strokeOpacity="0.1" strokeWidth="1.8" />
                <path d="M0 4.8 L4.5 0.3 M9 4.8 L13.5 9.3" stroke="#fff" strokeOpacity="0.2" strokeWidth="0.8" />
              </pattern>
              <radialGradient id={`${uid}-base`} cx="0.5" cy="0.58" r="0.7">
                <stop offset="0" stopColor="#fcf3dc" />
                <stop offset="0.6" stopColor="#f6e4b6" />
                <stop offset="1" stopColor="#e6c381" />
              </radialGradient>
              <linearGradient id={`${uid}-bamboo`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#ecd49e" />
                <stop offset="0.5" stopColor="#d2ac68" />
                <stop offset="1" stopColor="#a47838" />
              </linearGradient>
              <clipPath id={`${uid}-clip`}>
                <path d={art.outline} />
              </clipPath>
              <g id={`${uid}-knot`} fill="none">
                <path d={art.knot.b} stroke={INK} strokeWidth="5.4" />
                <path d={art.knot.b} className="stroke-leaf" strokeWidth="3.4" />
                <path d={art.knot.a} stroke={INK} strokeWidth="5.4" />
                <path d={art.knot.a} className="stroke-sindoor" strokeWidth="3.4" />
                <path d={art.knot.bOver} stroke={INK} strokeWidth="5.4" />
                <path d={art.knot.bOver} className="stroke-leaf" strokeWidth="3.4" />
                <circle r="1.3" fill="#fbf5ea" />
              </g>
            </defs>

            {/* drawn upright, then turned upside down */}
            <g transform={`matrix(1 0 0 -1 0 ${size[1]})`}>
              {/* side sticks poking out past the crossbar */}
              <g fill={`url(#${uid}-bamboo)`} stroke="#6b3a12" strokeWidth="1">
                {art.sticks.map((x, i) => (
                  <rect
                    key={x}
                    x={x - 6}
                    y="-6"
                    width="12"
                    height={TOP + 22}
                    rx="5"
                    transform={`rotate(${i ? 8 : -8} ${x} ${TOP})`}
                  />
                ))}
              </g>

              {/* woven tray */}
              <path d={art.outline} fill={`url(#${uid}-base)`} />
              <path d={art.outline} fill={`url(#${uid}-weave)`} />

              {/* interlaced knot border */}
              <g clipPath={`url(#${uid}-clip)`}>
                <path d={art.bandOuter} fill="none" stroke={INK} strokeWidth="1.2" />
                <path d={art.bandInner} fill="none" stroke={INK} strokeWidth="1.2" />
                {art.repeats.map((transform) => (
                  <use key={transform} href={`#${uid}-knot`} transform={transform} />
                ))}
              </g>

              {/* painted bamboo rim with cane ties */}
              <path d={art.outline} fill="none" stroke="#6b3a12" strokeWidth={RIM * 2 + 1} strokeLinejoin="round" />
              <path d={art.outline} fill="none" className="stroke-sindoor" strokeWidth={RIM * 2 - 2} strokeLinejoin="round" />
              <path
                d={art.outline}
                fill="none"
                stroke="#fbf0d8"
                strokeWidth={RIM * 2 - 1}
                strokeDasharray="2.6 30"
                strokeDashoffset="12"
              />

              {/* crossbar */}
              <rect
                x={art.crossbar.x}
                y={TOP - 8}
                width={art.crossbar.width}
                height="16"
                rx="8"
                fill={`url(#${uid}-bamboo)`}
                stroke="#6b3a12"
                strokeWidth="1"
              />
              <g className="fill-sindoor">
                {Array.from({ length: Math.floor(art.crossbar.width / 34) }, (_, i) => (
                  <rect key={i} x={art.crossbar.x + 17 + i * 34} y={TOP - 7.5} width="10" height="15" rx="1.5" />
                ))}
              </g>
              <path
                d={`M${art.crossbar.x + 8} ${TOP + 3} H${art.crossbar.x + art.crossbar.width - 8}`}
                stroke="#fff6e0"
                strokeOpacity="0.55"
                strokeWidth="1.4"
              />
            </g>
          </svg>
          {backdrop && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ clipPath: `path('${art.clip}')` }}>
              {backdrop}
            </div>
          )}
        </>
      )}
      <div className="relative">{children}</div>
    </div>
  )
}

function Fish({ x, y, flip }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -0.8 : 0.8} 0.8)`} stroke={INK} strokeWidth="1.3" strokeLinejoin="round">
      <path d="M-24 0 L-34 -8 L-32 0 L-34 8 Z" className="fill-sindoor-deep" />
      <path d="M-26 0 C -16 -12 6 -13 18 -4 C 21 -2 21 2 18 4 C 6 13 -16 12 -26 0 Z" className="fill-sindoor" />
      <path d="M-4 -9 C -2 -14 4 -14 6 -10" className="fill-sindoor-deep" />
      <g fill="none" stroke="#ebcb85" strokeWidth="0.9">
        {[-16, -10, -4, 2].map((sx) => (
          <path key={sx} d={`M${sx} -5 q 3 3 0 6 M${sx + 3} -2 q 3 3 0 6`} />
        ))}
      </g>
      <path d="M8 -8 C 5 -3 5 3 8 8" fill="none" strokeWidth="1" />
      <circle cx="12.5" cy="-2" r="2.4" fill="#fbf5ea" strokeWidth="1" />
      <circle cx="13" cy="-2" r="1.1" fill={INK} stroke="none" />
    </g>
  )
}

/** Joda machh (জোড়া মাছ): two fish facing a marigold, for plenty */
export function JodaMachh({ className }: { className?: string }) {
  return (
    <svg viewBox="38 168 124 26" className={cn('block', className)} aria-hidden="true">
      <Fish x={68} y={181} />
      <Fish x={132} y={181} flip />
      <g className="fill-leaf" stroke={INK} strokeWidth="0.8">
        <path d="M100 181 C 96 177 90 177 86.5 179.5 C 90 183.5 96 183.5 100 181 Z" />
        <path d="M100 181 C 104 177 110 177 113.5 179.5 C 110 183.5 104 183.5 100 181 Z" />
      </g>
      <circle cx="100" cy="181" r="2.6" className="fill-marigold" stroke={INK} strokeWidth="0.8" />
    </svg>
  )
}

function Medallion({ x, y, letter, script }: { x: number; y: number; letter: string; script: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="12.5" fill="#fbf5ea" stroke={INK} strokeWidth="1.4" />
      <circle r="9.5" fill="none" className="stroke-sindoor" strokeWidth="1" strokeDasharray="2 2" />
      <text
        y={script ? 5.5 : 4.5}
        textAnchor="middle"
        className={cn('fill-sindoor', script ? 'font-script' : 'font-bengali-display')}
        fontSize={script ? 17 : 12.5}
      >
        {letter}
      </text>
    </g>
  )
}

interface GatchhoraProps {
  /** Initials where each cloth begins: groom first */
  initials: [string, string]
  /** Latin initials use the script face */
  script: boolean
  className?: string
}

/** Gatchhora: the groom's cloth (left) tied to the bride's (right) */
export function Gatchhora({ initials, script, className }: GatchhoraProps) {
  return (
    <svg viewBox="46 82 108 76" className={cn('block', className)} aria-hidden="true">
      <g stroke={INK} strokeWidth="1.1" strokeLinejoin="round">
        <path d="M62 88 C 74 86 86 94 97 101 L 95 114 C 84 106 74 101 64 103 Z" fill="#fff3d6" />
        <path
          d="M64 91.5 C 76 89 86 96 96.5 104 M64.5 99.5 C 75 97 85 102 95.5 110.5"
          fill="none"
          className="stroke-zari"
          strokeWidth="1.3"
        />
        <path d="M80 92 C 83 96 83 101 80 104" fill="none" strokeWidth="0.6" />

        <path d="M138 88 C 126 86 114 94 103 101 L 105 114 C 116 106 126 101 136 103 Z" className="fill-sindoor" />
        <path
          d="M136 91.5 C 124 89 114 96 103.5 104 M135.5 99.5 C 125 97 115 102 104.5 110.5"
          fill="none"
          className="stroke-zari-light"
          strokeWidth="1.3"
        />
        <path d="M120 92 C 117 96 117 101 120 104" fill="none" strokeWidth="0.6" />

        {/* hanging ends with tassels */}
        <path d="M97 114 C 94 126 92 138 91 150 L 99 151 C 99 139 100 127 102 116 Z" fill="#fff3d6" />
        <path d="M93.5 128 L 101 129 M91.8 143 L 99.3 144" className="stroke-zari" strokeWidth="1.1" />
        <path d="M103 114 C 106 126 108 138 109 150 L 101 151 C 101 139 100 127 98 116 Z" className="fill-sindoor" />
        <path d="M106.5 128 L 99 129 M108.2 143 L 100.7 144" className="stroke-zari-light" strokeWidth="1.1" />
        <g className="stroke-zari" strokeWidth="0.9" strokeLinecap="round">
          {[91.8, 94, 96.2, 98.4, 101.6, 103.8, 106, 108.2].map((tx, i) => (
            <path key={tx} d={`M${tx} 151 l ${i < 4 ? -0.5 : 0.5} 5`} />
          ))}
        </g>

        {/* the knot */}
        <ellipse cx="100" cy="108" rx="10.5" ry="9" fill="#fff3d6" />
        <path
          d="M91 101.5 C 97.5 104 104 109.5 109 115 C 110.5 112.5 111.3 110 110.5 106.8 C 105.5 102.8 99 98.8 93.4 97.2 C 91.8 98 91 99.8 91 101.5 Z"
          className="fill-sindoor"
        />
        <path d="M92.8 110.5 C 96 112 98.5 115 98.5 116.5 M107.5 99.5 C 106 101 105 103 106 104.5" fill="none" strokeWidth="0.7" />
      </g>
      <Medallion x={62} y={96} letter={initials[0]} script={script} />
      <Medallion x={138} y={96} letter={initials[1]} script={script} />
    </svg>
  )
}
