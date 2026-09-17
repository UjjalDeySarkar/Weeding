import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Heart } from 'lucide-react'
import { wedding } from '@/config/wedding'
import { useLang } from '@/i18n/context'
import { formatNumber } from '@/lib/format'
import type { Point } from '@/lib/geo'
import { fitProjection, toPath } from '@/lib/geo'
import { cn } from '@/lib/utils'
import { journeyStyles, venueRoutes } from './routes'

const W = 800
const { venue, city } = wedding

const routePoints = (id: string) => (venueRoutes[id]?.path ?? []).map(([lat, lng]) => ({ lat, lng }))

const projection = fitProjection(
  [venue.coordinates, ...venue.journeys.flatMap((j) => [j.coordinates, ...routePoints(j.id)])],
  W,
  { top: 150, right: 70, bottom: 70, left: 70 },
)
const H = projection.height
const venuePoint = projection.project(venue.coordinates)
const routes = venue.journeys.map((journey) => {
  const points = routePoints(journey.id).map(projection.project)
  const at = projection.project(journey.coordinates)
  return {
    journey,
    at,
    d: toPath(points),
    // Short walk from the hub itself to where the road route begins
    connector: points.length ? toPath([at, points[0]]) : '',
  }
})

const scaleKm = [0.5, 1, 2, 5, 10].find((km) => (km * 1000) / projection.metersPerUnit >= 80) ?? 10
const scaleLength = (scaleKm * 1000) / projection.metersPerUnit

/** Position an HTML overlay at a map point */
const place = ({ x, y }: Point) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` })

const snowCap = (x: number, y: number) =>
  `M${x - 13} ${y + 12} L${x} ${y} L${x + 14} ${y + 12} L${x + 6} ${y + 8} L${x} ${y + 12} L${x - 6} ${y + 8}Z`

function Hills() {
  return (
    <g>
      <path
        d="M0 118 L40 92 L78 104 L122 60 L150 78 L196 38 L236 70 L270 56 L318 88 L360 50 L398 72 L446 28 L486 62 L520 48 L566 84 L612 44 L650 70 L700 36 L742 66 L800 52 L800 150 L0 150Z"
        fill="#c8b595"
        fillOpacity="0.5"
      />
      {[
        [122, 60],
        [196, 38],
        [446, 28],
        [612, 44],
        [700, 36],
      ].map(([x, y]) => (
        <path key={x} d={snowCap(x, y)} fill="#fffaf0" />
      ))}
      <path
        d="M0 132 L52 110 L96 124 L150 96 L206 120 L256 100 L310 124 L372 94 L430 118 L484 98 L540 124 L596 102 L660 122 L718 98 L766 116 L800 108 L800 160 L0 160Z"
        fill="#9fb07e"
        fillOpacity="0.45"
      />
    </g>
  )
}

function TeaGarden({ x, y, rows, cols }: { x: number; y: number; rows: number; cols: number }) {
  return (
    <g fill="#5b8a3c" fillOpacity="0.35">
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols - (r % 2) }, (_, c) => (
          <ellipse key={`${r}-${c}`} cx={x + c * 18 + (r % 2) * 9} cy={y + r * 14} rx="8" ry="5" />
        )),
      )}
    </g>
  )
}

function Compass({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#9a6b1f" fill="none">
      <circle r="24" strokeWidth="1" />
      <circle r="19" strokeWidth="0.8" strokeDasharray="1.5 3" />
      <path d="M0 -20 L5 0 L0 20 L-5 0Z" fill="#a51c1c" fillOpacity="0.8" stroke="none" />
      <path d="M-20 0 L0 -4 L20 0 L0 4Z" fill="#9a6b1f" fillOpacity="0.5" stroke="none" />
      <text y="-30" textAnchor="middle" fontSize="13" fill="#a51c1c" stroke="none" className="font-display font-semibold">
        {label}
      </text>
    </g>
  )
}

interface IllustratedMapProps {
  active: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}

/** Hand-drawn style map with the real driving routes stitched from each travel hub to the venue */
export function IllustratedMap({ active, onHover, onSelect }: IllustratedMapProps) {
  const { lang, t, pick } = useLang()
  const scroller = useRef<HTMLDivElement>(null)

  // On narrow screens the map scrolls sideways — start with the venue in view
  useEffect(() => {
    const el = scroller.current
    if (el && el.scrollWidth > el.clientWidth) {
      el.scrollLeft = (venuePoint.x / W) * el.scrollWidth - el.clientWidth / 2
    }
  }, [])

  return (
    <figure className="overflow-hidden rounded-3xl bg-[#f6ecd9] shadow-[0_30px_60px_-30px_rgba(43,27,24,0.55)] ring-1 ring-ink/10">
      <div ref={scroller} className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative min-w-[36rem]" style={{ aspectRatio: `${W} / ${H}` }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" role="img" aria-label={t.venue.mapLabel}>
            <Hills />
            <TeaGarden x={120} y={190} rows={5} cols={9} />
            <text x="196" y="272" textAnchor="middle" fontSize="13" fill="#5b8a3c" className="font-display italic">
              {t.venue.teaGardens}
            </text>
            <TeaGarden x={404} y={432} rows={4} cols={8} />
            <text
              x="705"
              y="330"
              textAnchor="middle"
              fontSize="26"
              letterSpacing="6"
              fill="#2b1b18"
              fillOpacity="0.14"
              className="font-display font-semibold uppercase"
            >
              {pick(city).split(',')[0]}
            </text>
            <Compass x={752} y={392} label={t.venue.north} />

            {routes.map(({ journey, d, connector }, i) => {
              const { color } = journeyStyles[journey.icon]
              const dimmed = active !== null && active !== journey.id
              return (
                <motion.g key={journey.id} animate={{ opacity: dimmed ? 0.18 : 1 }} transition={{ duration: 0.3 }}>
                  <path d={connector} fill="none" stroke={color} strokeWidth="2" strokeDasharray="1 5" strokeLinecap="round" />
                  <motion.path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={active === journey.id ? 7 : 5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 2.2, delay: 0.3 + i * 0.4, ease: 'easeInOut' }}
                  />
                  {/* kantha stitches along the thread */}
                  <path d={d} fill="none" stroke="#f6ecd9" strokeWidth="1.6" strokeDasharray="5 6" strokeLinecap="round" />
                </motion.g>
              )
            })}

            <g transform={`translate(70 ${H - 30})`} stroke="#2b1b18" strokeOpacity="0.55">
              <path d={`M0 -5 V0 H${scaleLength} V-5`} fill="none" strokeWidth="1.5" />
              <path d={`M0 0 H${scaleLength}`} strokeWidth="4" strokeDasharray="6 6" stroke="#a51c1c" strokeOpacity="0.5" />
              <text x={scaleLength + 10} y="4" fontSize="13" fill="#2b1b18" fillOpacity="0.6" stroke="none" className="font-display">
                {t.venue.km(formatNumber(scaleKm, lang))}
              </text>
            </g>
          </svg>

          <p className="absolute top-3 left-1/2 -translate-x-1/2 text-[11px] font-medium tracking-[0.3em] whitespace-nowrap text-ink/60 uppercase bn:text-xs">
            ↑ {t.venue.hills}
          </p>

          {routes.map(({ journey, at }) => {
            const { icon: Icon, color } = journeyStyles[journey.icon]
            const selected = active === journey.id
            const name = pick(journey.name)
            return (
              <button
                key={journey.id}
                type="button"
                aria-label={t.venue.showRoute(name)}
                aria-pressed={selected}
                onClick={() => onSelect(journey.id)}
                onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(journey.id)}
                onPointerLeave={(e) => e.pointerType === 'mouse' && onHover(null)}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zari"
                style={place(at)}
              >
                <span
                  className={cn(
                    'grid size-9 place-items-center rounded-full border-2 bg-paper shadow-md transition-transform',
                    selected && 'scale-125',
                  )}
                  style={{ borderColor: color, color }}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span
                  className={cn(
                    'absolute rounded-full bg-paper/95 px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-ink shadow-sm ring-1 ring-ink/10 bn:text-xs',
                    journey.labelSide === 'right' && 'top-1/2 left-full ml-2 -translate-y-1/2',
                    journey.labelSide === 'left' && 'top-1/2 right-full mr-2 -translate-y-1/2',
                    journey.labelSide === 'bottom' && 'top-full left-1/2 mt-1.5 -translate-x-1/2',
                  )}
                  aria-hidden="true"
                >
                  {pick(journey.short)}
                </span>
              </button>
            )
          })}

          {/* Venue pin */}
          <div className="absolute z-20" style={place(venuePoint)}>
            <span className="absolute size-12 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-sindoor/25 [animation-duration:2.2s]" />
            <motion.div
              className="relative -translate-x-1/2 -translate-y-full"
              initial={{ y: -40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', bounce: 0.55, delay: 0.2 }}
            >
              <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded-full bg-sindoor px-3 py-1 text-xs font-medium whitespace-nowrap text-paper shadow-md ring-2 ring-zari-light/70 bn:text-sm">
                {pick(venue.shortName)}
              </span>
              <svg viewBox="0 0 44 56" className="w-11 drop-shadow-[0_6px_6px_rgba(109,14,19,0.4)]" aria-hidden="true">
                <path
                  d="M22 55 C 22 55 3 34 3 21 A 19 19 0 0 1 41 21 C 41 34 22 55 22 55Z"
                  fill="#a51c1c"
                  stroke="#ebcb85"
                  strokeWidth="2"
                />
                <circle cx="22" cy="21" r="12" fill="#fbf5ea" />
              </svg>
              <Heart className="absolute top-[13px] left-1/2 size-4 -translate-x-1/2 fill-sindoor text-sindoor" aria-hidden="true" />
            </motion.div>
          </div>
        </div>
      </div>

      <figcaption className="flex items-center justify-between gap-3 border-t border-ink/10 px-5 py-3 text-xs text-muted bn:text-sm">
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="hover:text-sindoor">
          {t.venue.credit}
        </a>
        <span className="sm:hidden">{t.venue.swipe} ↔</span>
      </figcaption>
    </figure>
  )
}
