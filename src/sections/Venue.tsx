import { lazy, Suspense, useEffect, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { Check, CircleParking, Copy, MapPin, Navigation, RotateCw } from 'lucide-react'
import { IllustratedMap } from '@/components/map/IllustratedMap'
import { MapLoading } from '@/components/map/MapLoading'
import { journeyStyles, venueRoutes } from '@/components/map/routes'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import type { Journey } from '@/config/types'
import { wedding } from '@/config/wedding'
import { useLang } from '@/i18n/context'
import { formatDecimal, formatDotDate, formatNumber } from '@/lib/format'
import { directionsUrl } from '@/lib/links'
import { cn } from '@/lib/utils'

const { venue } = wedding

// MapLibre is large — only load it when someone wants the live map
const loadGlobeMap = () => import('@/components/map/GlobeMap')
const GlobeMap = lazy(() => loadGlobeMap().then((m) => ({ default: m.GlobeMap })))

/** Two equal buttons that stay on one line, even on small phones */
const actionClass =
  'gap-1.5 px-3 text-xs whitespace-nowrap max-[360px]:gap-1 max-[360px]:px-2 max-[360px]:tracking-normal sm:gap-2 sm:px-5 sm:text-sm bn:text-sm'

function Postmark({ date, city }: { date: string; city: string }) {
  return (
    <svg
      viewBox="0 0 200 120"
      className="pointer-events-none absolute -top-3 right-0 w-40 rotate-[-10deg] text-sindoor/50 sm:-right-3 sm:w-44"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="54" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="44" strokeWidth="1" />
        {[40, 52, 64, 76].map((y) => (
          <path key={y} d={`M118 ${y} q 10 -6 20 0 t 20 0 t 20 0 t 20 0`} strokeWidth="2" />
        ))}
      </g>
      <text x="60" y="57" textAnchor="middle" fontSize="11" fill="currentColor" className="font-display">
        {date}
      </text>
      <text x="60" y="75" textAnchor="middle" fontSize="12" fill="currentColor" className="font-display">
        {city}
      </text>
    </svg>
  )
}

interface JourneyRowProps {
  journey: Journey
  active: boolean
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}

function JourneyRow({ journey, active, onHover, onSelect }: JourneyRowProps) {
  const { lang, t, pick } = useLang()
  const { icon: Icon, color } = journeyStyles[journey.icon]
  const route = venueRoutes[journey.id]
  const name = pick(journey.name)

  return (
    <li className="flex items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        aria-pressed={active}
        aria-label={t.venue.showRoute(name)}
        onClick={() => onSelect(journey.id)}
        onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(journey.id)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && onHover(null)}
        className={cn(
          'flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-xl border-2 px-2 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zari sm:gap-3 sm:px-3 sm:py-2.5',
          active ? 'bg-paper-deep' : 'border-transparent hover:bg-paper-deep/60',
        )}
        style={active ? { borderColor: color } : undefined}
      >
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full border-2 bg-paper sm:size-10"
          style={{ borderColor: color, color }}
        >
          <Icon className="size-4 sm:size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block leading-snug font-medium max-sm:text-[15px]">{name}</span>
          {route && (
            <span className="block text-[13px] leading-snug text-muted sm:text-sm">
              {t.venue.drive(formatDecimal(route.distanceKm, lang), formatNumber(route.durationMin, lang))}
            </span>
          )}
        </span>
      </button>
      <a
        href={directionsUrl(venue.coordinates, journey.coordinates)}
        target="_blank"
        rel="noreferrer"
        aria-label={t.venue.directionsFrom(name)}
        className="grid size-9 shrink-0 place-items-center rounded-full border border-sindoor/30 text-sindoor transition-colors sm:size-10 hover:bg-sindoor hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zari"
      >
        <Navigation className="size-4" aria-hidden="true" />
      </a>
    </li>
  )
}

/** Venue postcard, travel hubs, and a flip card: illustrated route map ↔ live map */
export function Venue() {
  const { lang, t, pick } = useLang()
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [liveMapRequested, setLiveMapRequested] = useState(false)
  const [flight, setFlight] = useState(0)
  const [copied, setCopied] = useState(false)
  const active = hovered ?? selected
  const reduceMotion = useReducedMotion()
  const rotation = useMotionValue(0)
  // Mobile browsers draw some layers (scroll areas, the map canvas) straight through
  // backface-visibility, which shows the far side mirrored, so hide it once the card turns past edge-on
  const frontVisibility = useTransform(rotation, (r) => (r < 90 ? 'visible' : 'hidden'))
  const backVisibility = useTransform(rotation, (r) => (r < 90 ? 'hidden' : 'visible'))

  useEffect(() => {
    const controls = animate(rotation, flipped ? 180 : 0, {
      duration: reduceMotion ? 0 : 0.9,
      ease: [0.65, 0, 0.35, 1],
    })
    return () => controls.stop()
  }, [flipped, reduceMotion, rotation])

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(id)
  }, [copied])

  const select = (id: string) => setSelected((current) => (current === id ? null : id))

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(`${pick(venue.name)}, ${pick(venue.address)}`)
      setCopied(true)
    } catch {
      // clipboard unavailable (insecure context / permission) — nothing to do
    }
  }

  const flip = () => {
    setLiveMapRequested(true)
    setFlipped(!flipped)
    if (!flipped) setFlight((n) => n + 1)
  }

  return (
    <Section id="venue" eyebrow={t.venue.eyebrow} title={t.venue.title} className="overflow-x-clip bg-paper-deep">
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-10 sm:gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <Reveal>
          <div className="relative -rotate-1 rounded-md bg-paper p-5 shadow-[0_40px_70px_-35px_rgba(43,27,24,0.6)] ring-1 ring-ink/10 sm:p-8">
            <Postmark date={formatDotDate(wedding.date, lang)} city={pick(wedding.city).split(',')[0]} />

            <p className="relative mt-16 text-xs tracking-[0.3em] text-zari uppercase sm:mt-0 sm:pr-36 bn:text-sm">
              {t.venue.postcard}
            </p>
            <h3 className="relative mt-3 font-display text-4xl leading-tight text-sindoor sm:pr-24 sm:text-[2.6rem]">
              {pick(venue.name)}
            </h3>
            <p className="mt-4 flex items-start gap-2 text-muted">
              <MapPin className="mt-0.5 size-5 shrink-0 text-zari" aria-hidden="true" />
              {pick(venue.address)}
            </p>
            {venue.parking && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-durba/10 px-3 py-1.5 text-sm font-medium text-durba bn:text-base">
                <CircleParking className="size-4" aria-hidden="true" />
                {t.venue.parking}
              </p>
            )}
            {venue.notes && <p className="mt-3 text-sm text-muted bn:text-base">{pick(venue.notes)}</p>}

            <div className="mt-6 grid grid-cols-2 gap-2 max-[360px]:gap-1.5 sm:gap-3">
              <a
                href={directionsUrl(venue.coordinates)}
                target="_blank"
                rel="noreferrer"
                className={cn('btn btn-primary', actionClass)}
              >
                <Navigation className="size-4 shrink-0" aria-hidden="true" />
                {t.venue.directions}
              </a>
              <button type="button" onClick={copyAddress} className={cn('btn btn-outline', actionClass)}>
                {copied ? (
                  <Check className="size-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Copy className="size-4 shrink-0" aria-hidden="true" />
                )}
                {copied ? t.venue.copied : t.venue.copy}
              </button>
            </div>
            <span role="status" className="sr-only">
              {copied ? t.venue.copiedStatus : ''}
            </span>

            <div className="mt-8 border-t border-dashed border-ink/20 pt-6">
              <h4 className="text-xs tracking-[0.3em] text-zari uppercase bn:text-sm">{t.venue.arriving}</h4>
              <ul className="mt-3 space-y-1.5">
                {venue.journeys.map((journey) => (
                  <JourneyRow
                    key={journey.id}
                    journey={journey}
                    active={active === journey.id}
                    onHover={setHovered}
                    onSelect={select}
                  />
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted bn:text-sm">{t.venue.approxNote}</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="perspective-[1800px]">
            <motion.div className="relative transform-3d" style={{ rotateY: rotation }}>
              <motion.div
                className={cn('backface-hidden', flipped && 'pointer-events-none')}
                style={{ visibility: frontVisibility }}
                inert={flipped}
              >
                <IllustratedMap active={active} onHover={setHovered} onSelect={select} />
              </motion.div>
              <motion.div
                className={cn('absolute inset-0 rotate-y-180 backface-hidden', !flipped && 'pointer-events-none')}
                style={{ visibility: backVisibility }}
                inert={!flipped}
              >
                <div className="stamp size-full bg-[#efe0c4] shadow-md">
                  <div className="relative size-full overflow-hidden">
                    {liveMapRequested && (
                      <Suspense fallback={<MapLoading label={t.venue.loadingMap} />}>
                        <GlobeMap key={lang} active={flipped} flight={flight} />
                      </Suspense>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className="mt-5 flex justify-center sm:mt-6">
            <button
              type="button"
              onClick={flip}
              onPointerEnter={() => void loadGlobeMap()}
              className="btn btn-outline"
              aria-pressed={flipped}
            >
              <RotateCw className="size-4" aria-hidden="true" />
              {flipped ? t.venue.illustratedMap : t.venue.liveMap}
            </button>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
