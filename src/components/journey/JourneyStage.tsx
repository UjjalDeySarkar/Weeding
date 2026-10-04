import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { useReducedMotion, useScroll } from 'motion/react'
import type { JourneyCardId, L } from '@/config/types'
import { wedding } from '@/config/wedding'
import { useLang } from '@/i18n/context'
import { formatDate, localizeDigits } from '@/lib/format'
import type { Point } from '@/lib/spline'
import map from './bengal-map.json'
import { runJourney, type EngineText } from './engine'
import { distanceKm, project, toPath } from './geometry'
import { Badge, Bike, Bride, Butterfly, Car, Groom, Guests, HEART, House, Mandap, MeetPin, Parents, Stamp, Train } from './sprites'
import { CARDS, LEVELS, MEETING, PLACES, ROUTES, STAMPS, type CardSpec } from './timeline'

const { journey } = wedding
const story = (motif?: string) => wedding.story.find((m) => m.motif === motif)
const DISTANCES = {
  km: Math.round(distanceKm(journey.groomHome.coordinates, journey.brideHome.coordinates)),
  cityKm: Math.round(distanceKm(journey.city.coordinates, journey.brideHome.coordinates)),
}

const REGIONS: { name: L; at: Point }[] = [
  { name: { en: 'Nepal', bn: 'নেপাল' }, at: project(87.0, 27.0) },
  { name: { en: 'Sikkim', bn: 'সিকিম' }, at: project(88.45, 27.5) },
  { name: { en: 'Bhutan', bn: 'ভুটান' }, at: project(89.7, 27.25) },
  { name: { en: 'Bihar', bn: 'বিহার' }, at: project(86.8, 25.5) },
  { name: { en: 'Bangladesh', bn: 'বাংলাদেশ' }, at: project(89.5, 24.3) },
  { name: { en: 'Jharkhand', bn: 'ঝাড়খণ্ড' }, at: project(86.25, 23.95) },
  { name: { en: 'Odisha', bn: 'ওড়িশা' }, at: project(86.5, 21.6) },
  { name: { en: 'Bay of Bengal', bn: 'বঙ্গোপসাগর' }, at: project(88.4, 21.0) },
]

/** Static map art, built once */
function useMapArt() {
  return useMemo(() => {
    const ring = (points: number[][]) => toPath(points.map(([lng, lat]) => project(lng, lat)), true)
    const line = (points: number[][]) => toPath(points.map(([lng, lat]) => project(lng, lat)))
    let seed = 11
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    const peaks: [number, number][] = []
    for (let x = 30; x <= 440; x += 20 + random() * 12) peaks.push([x, 26 + random() * 26])
    peaks.push([254, 76])
    peaks.sort((a, b) => b[1] - a[1])
    const tea: Point[] = []
    for (const [lng, lat, cols, rows] of [
      [88.74, 26.62, 7, 4],
      [89.2, 26.7, 8, 3],
      [88.2, 26.96, 5, 3],
    ]) {
      const [cx, cy] = project(lng, lat)
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) tea.push([cx + (c - (cols - 1) / 2) * 5.4 + (r % 2) * 2.7, cy + (r - (rows - 1) / 2) * 4.4])
    }
    return {
      land: map.land.map(ring).join(''),
      westBengal: map.westBengal.map(ring).join(''),
      rivers: Object.values(map.rivers).map((lines) => lines.map(line).join('')),
      peaks,
      tea,
    }
  }, [])
}

/** Position a sprite at a map point; it keeps its size on screen */
const pin = ([x, y]: Point): CSSProperties => ({ '--x': `${x}px`, '--y': `${y}px` }) as CSSProperties

function Pop({ children }: { children: ReactNode }) {
  return <g className="transition-[scale,opacity] duration-500 ease-out group-data-hidden:scale-0 group-data-hidden:opacity-0">{children}</g>
}

const strokes = {
  map: '[stroke-width:calc(var(--u)*2.4px)] [stroke-linejoin:round]',
  thin: '[stroke-width:calc(var(--u)*1.4px)] [stroke-linejoin:round]',
}

export function JourneyStage({ track }: { track: RefObject<HTMLElement | null> }) {
  const { lang, t, pick } = useLang()
  const reduce = useReducedMotion() ?? false
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const root = useRef<HTMLDivElement>(null)
  const art = useMapArt()
  const number = (n: number) => localizeDigits(String(n), lang)
  const fill = (text: string) => text.replace('{km}', number(DISTANCES.km)).replace('{cityKm}', number(DISTANCES.cityKm))

  const text = useRef<EngineText>(null)
  useEffect(() => {
    text.current = {
      chapter: (n) => t.journey.chapter(n, journey.chapters.length),
      title: (i) => pick(journey.chapters[i]),
      km: (km) => t.journey.apart(number(km)),
      together: t.journey.together,
      count: number,
      line: (who, i) => t.journey.lines[who][i] ?? '',
      message: t.journey.message,
    }
  })
  useEffect(() => {
    if (!root.current) return
    return runJourney(root.current, { progress: scrollYProgress, reduce, text: () => text.current! })
  }, [scrollYProgress, reduce])

  const card = (spec: CardSpec) => {
    const own = journey.cards[spec.id as JourneyCardId] as (typeof journey.cards)[JourneyCardId] | undefined
    const moment = story(spec.motif)
    const tag = own ? pick(own.tag) : spec.level && moment ? t.journey.level(spec.level, moment.year) : t.journey.finale(formatDate(wedding.date, lang))
    const title = own?.title ? fill(pick(own.title)) : moment && pick(moment.title)
    const body = own?.text ? fill(pick(own.text)) : moment && pick(moment.text)
    return (
      <article key={spec.id} data-card data-a={spec.a} data-b={spec.b} className="invisible absolute inset-x-3 bottom-[76px] group-data-[layout=wide]/stage:inset-x-auto group-data-[layout=wide]/stage:top-1/2 group-data-[layout=wide]/stage:right-[3%] group-data-[layout=wide]/stage:bottom-auto group-data-[layout=wide]/stage:w-[min(400px,37%)] group-data-[layout=wide]/stage:-translate-y-1/2">
        <div className="max-h-[42svh] overflow-auto border-[3px] border-ink bg-[#fffaf1] px-5 py-4 opacity-0 shadow-[inset_0_0_0_5px_var(--color-haldi),inset_0_0_0_6.5px_var(--color-ink),0_14px_30px_-16px_rgba(43,27,24,.6)] sm:px-6 sm:py-5">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#845e14] uppercase bn:text-sm bn:tracking-normal">{tag}</p>
          {moment && spec.id !== 'families' && (
            <p className="mt-1 font-display text-3xl leading-none text-zari italic sm:text-4xl bn:not-italic">{number(Number(moment.year))}</p>
          )}
          {title && <h3 className="mt-1 font-display text-2xl leading-tight text-sindoor sm:text-[1.7rem]">{title}</h3>}
          {body && <p className="mt-2 leading-relaxed text-ink/85">{body}</p>}
          {own?.note && <p className="mt-2 text-sm leading-relaxed text-muted">{fill(pick(own.note))}</p>}
          {spec.id === 'meeting' && (
            <button type="button" data-act="hello" className="btn btn-primary mt-3 px-5 py-2.5">
              {t.journey.sayHello}
            </button>
          )}
          {spec.id === 'wedding' && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary px-5 py-2.5" onClick={() => track.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })}>
                {t.journey.replay}
              </button>
              <a href="#events" className="btn btn-outline px-5 py-2.5">
                {t.journey.toEvents}
              </a>
            </div>
          )}
        </div>
      </article>
    )
  }

  const label = (key: string, rule: string, at: Point, name: string, className: string) => (
    <span key={key} data-label={rule} data-x={at[0]} data-y={at[1]} className={`absolute top-0 left-0 whitespace-nowrap opacity-0 transition-opacity duration-300 ${className}`}>
      {name}
    </span>
  )
  const cityLabel = 'text-[11px] font-semibold tracking-[0.14em] text-ink uppercase [text-shadow:0_0_3px_#fbf0d8,0_0_3px_#fbf0d8,0_0_6px_#fbf0d8] bn:text-sm bn:tracking-normal'
  const tagLabel = 'rounded border-[1.5px] border-ink bg-paper px-2 py-1 text-xs font-medium text-ink bn:text-sm'

  return (
    <div
      ref={root}
      className="group/stage relative h-full overflow-hidden rounded-[20px] bg-[radial-gradient(120%_90%_at_50%_40%,#f8ead0_0%,#efd9b2_70%,#e6c995_100%)] shadow-[0_22px_50px_-26px_rgba(43,27,24,.55),0_0_0_1px_rgba(43,27,24,.14)] select-none [-webkit-tap-highlight-color:transparent]"
    >
      <svg data-world role="img" aria-label={t.journey.stage} className="absolute inset-0 size-full" viewBox="0 0 460 760">
        {/* the sea, then the land around West Bengal */}
        <rect x="-3000" y="-3000" width="7000" height="7000" fill="#a7c5d3" />
        <path d={art.land} className={`fill-[#efdcaf] stroke-[#efdcaf] ${strokes.thin}`} />
        <g>
          {art.peaks.map(([x, h]) => {
            const b = 34
            const w = h * 0.95
            return (
              <g key={x}>
                <path d={`M${x - w} ${b} L${x} ${b - h} L${x + w} ${b} Z`} className={`fill-[#9ab7a5] stroke-ink ${strokes.thin}`} />
                <path
                  d={`M${x - w * 0.32} ${b - h * 0.66} L${x} ${b - h} L${x + w * 0.32} ${b - h * 0.66} L${x + w * 0.14} ${b - h * 0.57} L${x} ${b - h * 0.69} L${x - w * 0.14} ${b - h * 0.57} Z`}
                  fill="#fffdf6"
                />
              </g>
            )
          })}
        </g>
        <path d={art.westBengal} className="fill-[rgba(43,27,24,.14)] [translate:calc(var(--u)*5px)_calc(var(--u)*7px)]" />
        <path d={art.westBengal} className={`fill-[#f2d68c] stroke-ink ${strokes.map}`} />
        {art.rivers.map((d, i) => (
          <g key={i} className="fill-none [stroke-linecap:round] [stroke-linejoin:round]">
            <path d={d} className="stroke-ink [stroke-width:calc(var(--u)*3.6px)]" />
            <path d={d} className="stroke-[#3b6aa6] [stroke-width:calc(var(--u)*1.8px)]" />
          </g>
        ))}
        <g className="transition-opacity duration-500 [[data-near]_&]:opacity-0">
          {art.tea.map(([x, y]) => (
            <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.4" ry="1.6" className="fill-leaf stroke-ink [stroke-width:calc(var(--u)*.8px)]" />
          ))}
        </g>
        {/* terracotta temple at Bishnupur and a Bankura horse */}
        <g className="map-pin" style={pin(project(87.27, 23.12))}>
          <path d="M-11 0 L-11 -10 L11 -10 L11 0 Z" fill="#c4622d" stroke="#2b1b18" strokeWidth="1.2" />
          <path d="M-14.5 -9.5 C -9 -17 9 -17 14.5 -9.5 C 9 -12.5 -9 -12.5 -14.5 -9.5 Z" fill="#a24a1f" stroke="#2b1b18" strokeWidth="1.2" />
          <path d="M-8 -14 C -4.5 -19.5 4.5 -19.5 8 -14 C 4.5 -15.5 -4.5 -15.5 -8 -14 Z" fill="#a24a1f" stroke="#2b1b18" strokeWidth="1.2" />
          <path d="M0 -18 L0 -23" stroke="#2b1b18" strokeWidth="1.6" />
          <path d="M-3 0 L-3 -5 A 3 3 0 0 1 3 -5 L3 0 Z" fill="#2b1b18" />
        </g>
        <g className="map-pin" style={pin(project(86.95, 23.45))}>
          <path d="M-9 0 L-8 -8 C -9 -10 -8 -12 -5 -12 L 3 -12 C 4 -17 5 -23 7.5 -26 C 9 -28 12 -27.5 12.5 -25.5 L 14 -22.5 L 11.5 -21.5 C 10 -18 9 -14 8.5 -10 L 9 0 L 6 0 L 5 -6.5 L -4 -6.5 L -5.5 0 Z" fill="#c4622d" stroke="#2b1b18" strokeWidth="1.2" strokeLinejoin="round" />
        </g>
        {[project(88.0, 24.69), project(88.24, 22.3)].map((at, i) => (
          <path key={i} className="map-pin" style={pin(at)} d="M-5 0 C -2 -3 3 -3 5 0 C 3 3 -2 3 -5 0 Z M5 0 L8.5 -2.6 L8.5 2.6 Z" fill="#a51c1c" stroke="#2b1b18" strokeWidth="1" />
        ))}

        {/* roads being travelled */}
        <g className="fill-none stroke-sindoor [stroke-dasharray:calc(var(--u)*.1px)_calc(var(--u)*7px)] [stroke-linecap:round] [stroke-width:calc(var(--u)*3px)]">
          <path data-trace="groom" />
          <path data-trace="bride" />
        </g>

        {/* travel stamps */}
        {STAMPS.map((s, i) => (
          <g key={s.id} data-stamp data-x={s.at[0]} data-y={s.at[1]} className="map-pin [&[data-got]]:[--stamp-fill:#fbe7b8] [&[data-got]]:[--stamp-ink:#a51c1c]" style={{ ...pin(s.at), display: 'none' }} data-index={i}>
            <Stamp />
          </g>
        ))}

        {/* the red thread and the messages along it */}
        <g data-thread-group className="fill-none [stroke-linecap:round]" style={{ opacity: 0 }}>
          <path data-thread className="stroke-sindoor [stroke-dasharray:calc(var(--u)*7px)_calc(var(--u)*5px)] [stroke-width:calc(var(--u)*2.2px)]" />
          <path data-thread-hit className="cursor-pointer stroke-transparent [pointer-events:stroke] [stroke-width:calc(var(--u)*26px)]" />
        </g>
        {[0, 1, 2].map((i) => (
          <g key={i} data-message style={{ display: 'none' }}>
            <rect x="-6" y="-4.2" width="12" height="8.4" rx="1" fill="#fffaf1" stroke="#2b1b18" strokeWidth="1" />
            <path d="M-6 -4 L0 1 L6 -4" fill="none" stroke="#a51c1c" strokeWidth="1.1" />
          </g>
        ))}

        {/* hearts to collect on the first journeys */}
        {(['groom', 'bride'] as const).flatMap((who) =>
          [0.2, 0.42, 0.64, 0.86].map((at) => {
            const point = (who === 'groom' ? ROUTES.toCity : ROUTES.herTrain).at(at)
            return (
              <g key={`${who}${at}`} data-heart data-who={who} data-t={at} data-x={point[0]} data-y={point[1]} className="map-pin" style={{ ...pin(point), display: 'none' }}>
                <g className="transition-[scale,opacity] duration-300 [[data-got]_&]:scale-0 [[data-got]_&]:opacity-0">
                  <circle r="9" fill="rgba(255,255,255,.55)" />
                  <path d={HEART} fill="#d23a33" stroke="#2b1b18" strokeWidth="1" />
                </g>
              </g>
            )
          }),
        )}

        {/* homes, the meeting, the celebration, the mandap */}
        <g data-home className="group map-pin" style={pin(PLACES.groomHome)}>
          <Pop>
            <House side={1} />
          </Pop>
        </g>
        <g data-home className="group map-pin" style={pin(PLACES.brideHome)}>
          <Pop>
            <House side={-1} />
          </Pop>
        </g>
        <g data-guests data-hidden className="group map-pin" style={pin(PLACES.brideHome)}>
          <Pop>
            <Guests />
          </Pop>
        </g>
        <g data-meetpin data-hidden className="group map-pin [&_[data-part=heart]]:hidden [&[data-met]_[data-part=heart]]:inline [&[data-met]_[data-part=question]]:hidden [&[data-met]_[data-part=ring]]:hidden" style={pin(MEETING)}>
          <g data-part="lift">
            <Pop>
              <MeetPin />
            </Pop>
          </g>
        </g>
        <g data-mandap data-hidden className="group map-pin" style={pin(PLACES.venue)}>
          <Pop>
            <Mandap />
          </Pop>
        </g>
        {LEVELS.map((level) => (
          <g key={level.motif} data-badge data-hidden className="group">
            <Pop>
              <Badge year={localizeDigits(story(level.motif)?.year ?? '', lang)} />
            </Pop>
          </g>
        ))}

        {/* travellers */}
        <g data-actor="parents" style={{ opacity: 0 }}>
          <g data-look="walk">
            <Parents />
          </g>
        </g>
        <g data-actor="bride" className="cursor-pointer">
          <g data-look="walk">
            <Bride />
          </g>
          <g data-look="train" style={{ display: 'none' }}>
            <Train />
          </g>
        </g>
        <g data-actor="groom" className="cursor-pointer">
          <g data-look="walk">
            <Groom />
          </g>
          <g data-look="train" style={{ display: 'none' }}>
            <Train />
          </g>
          <g data-look="bike" style={{ display: 'none' }}>
            <Bike />
          </g>
          <g data-look="car" style={{ display: 'none' }}>
            <Car />
          </g>
          <g data-look="together" style={{ display: 'none' }}>
            <Train riders />
          </g>
        </g>
        <g data-butterfly className="cursor-pointer" style={{ display: 'none' }}>
          <Butterfly />
        </g>
      </svg>

      <canvas data-fx aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {label('groomHome', 'groomHome', PLACES.groomHome, pick(journey.groomHome.name), `mt-3 ${cityLabel}`)}
        {label('brideHome', 'brideHome', PLACES.brideHome, pick(journey.brideHome.name), `mt-3 ${cityLabel}`)}
        {label('city', 'city', PLACES.city, pick(journey.city.name), `mt-3 ${cityLabel}`)}
        {label('meeting', 'meeting', MEETING, pick(journey.meeting.name), `mt-4 ${tagLabel}`)}
        {label('venue', 'venue', PLACES.venue, pick(wedding.venue.shortName), `mt-5 ${tagLabel}`)}
        {label('darjeeling', 'minor', project(88.26, 27.04), lang === 'bn' ? 'দার্জিলিং' : 'Darjeeling', `-mt-7 ${cityLabel} text-[10px]`)}
        {STAMPS.map((s, i) => label(s.id, `stamp${i}`, s.at, pick(s.name), `mt-4 ${tagLabel}`))}
        {REGIONS.map((r) => label(r.name.en, 'region', r.at, pick(r.name), 'font-display text-sm tracking-[0.3em] text-ink/45 uppercase italic bn:tracking-normal bn:not-italic'))}
      </div>

      {/* game bar */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-wrap items-start justify-between gap-2">
        <div className="absolute inset-x-0 -top-1 h-[3px] overflow-hidden rounded bg-ink/15">
          <i data-hud="bar" className="block h-full w-0 bg-sindoor" />
        </div>
        <p className="mt-2 flex items-center gap-2 rounded border-[1.5px] border-ink bg-[#fbf0d8] px-3 py-1.5 shadow-[2px_2px_0_rgba(43,27,24,.25)]">
          <span data-hud="chapter" className="font-display text-[15px] font-semibold text-sindoor italic bn:not-italic" />
          <span data-hud="title" className="font-display text-[15px] font-semibold" />
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-end gap-2 text-[13px] tabular-nums">
          <span className="rounded border-[1.5px] border-ink bg-[#fbf0d8] px-2.5 py-1.5 shadow-[2px_2px_0_rgba(43,27,24,.25)]" data-hud="km" />
          <span className="rounded border-[1.5px] border-ink bg-[#fbf0d8] px-2.5 py-1.5 shadow-[2px_2px_0_rgba(43,27,24,.25)]" title={t.journey.hearts}>
            <span className="text-[#d23a33]">♥</span> <b data-hud="hearts" className="font-semibold" />
            /{localizeDigits('12', lang)}
          </span>
          <span data-hud="stampsPill" className="rounded border-[1.5px] border-ink bg-[#fbf0d8] px-2.5 py-1.5 shadow-[2px_2px_0_rgba(43,27,24,.25)]" title={t.journey.stamps}>
            <svg viewBox="-14 -14 28 28" className="mr-1 inline size-3.5 align-[-2px]" aria-hidden="true">
              <circle r="12" fill="#fbe7b8" stroke="#a51c1c" strokeWidth="2.4" strokeDasharray="3 2" />
            </svg>
            <b data-hud="stamps" className="font-semibold" />/{localizeDigits(String(STAMPS.length), lang)}
          </span>
        </div>
      </div>

      <div className="absolute inset-0 z-10 [&_[data-card]>div]:pointer-events-auto">{CARDS.map(card)}</div>

      {(['groom', 'bride'] as const).map((who) => (
        <div
          key={who}
          data-bubble={who}
          className="pointer-events-none absolute top-0 left-0 z-10 rounded-2xl border-[1.5px] border-ink bg-[#fffaf1] px-3 py-1.5 text-[13px] font-medium whitespace-nowrap opacity-0 shadow-md transition-opacity duration-200 data-on:opacity-100"
        />
      ))}
    </div>
  )
}
