import { useEffect, useEffectEvent, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bike, ChevronLeft, MapPin, Navigation, Pause, PersonStanding, Play, RotateCcw, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { journeyStyles } from '@/components/map/routes'
import type { GameOrigin, Lang } from '@/config/types'
import { wedding } from '@/config/wedding'
import { useLang } from '@/i18n/context'
import { formatLongDate, formatTime, localizeDigits } from '@/lib/format'
import { directionsUrl } from '@/lib/links'
import { cn, getGuestName, hasWebGL } from '@/lib/utils'
// Type-only imports keep three.js out of this chunk until the game starts
import type { Game, GameEvent, Hud, Message } from './engine'
import { createControls, type Controls } from './engine/input'
import manifest from './models.json'
import { kmFrom, makeTrip, modesFrom, origins, type Character, type Mode, type Trip } from './trips'

const loadEngine = () => import('./engine')

type Step = 'who' | 'from' | 'how' | 'play' | 'nowebgl'

const number = (n: number, lang: Lang) => localizeDigits(String(n), lang)

/** A rosogolla in its bowl */
function Rosogolla({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 13h18l-2.4 6.2a2 2 0 0 1-1.9 1.3H7.3a2 2 0 0 1-1.9-1.3Z" fill="#b5563a" />
      <circle cx="12" cy="10" r="6" fill="#fffaf0" stroke="#d9c9a8" strokeWidth="1" />
      <circle cx="10" cy="8" r="1.6" fill="#ffffff" />
    </svg>
  )
}

/** Held down: on; let go (or slide off): off */
function HoldButton({ label, icon: Icon, onHold, className, size = 'size-16' }: { label: string; icon: LucideIcon; onHold: (on: boolean) => void; className?: string; size?: string }) {
  const press = (on: boolean) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (on) e.currentTarget.setPointerCapture(e.pointerId)
    onHold(on)
  }
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={press(true)}
      onPointerUp={press(false)}
      onPointerCancel={press(false)}
      onLostPointerCapture={() => onHold(false)}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        'grid touch-none place-items-center rounded-full border-2 border-paper/70 bg-ink/45 text-paper shadow-lg backdrop-blur-sm select-none active:scale-95 active:bg-sindoor/80',
        size,
        className,
      )}
    >
      <Icon className="size-7" strokeWidth={2.4} />
    </button>
  )
}

function Choice({ icon, title, note, onClick }: { icon: ReactNode; title: string; note?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 border-zari/40 bg-paper px-4 py-3 text-left transition-colors hover:border-sindoor hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zari"
    >
      {icon}
      <span className="min-w-0">
        <span className="block font-display text-2xl leading-tight text-sindoor">{title}</span>
        {note && <span className="block text-sm text-muted bn:text-base">{note}</span>}
      </span>
    </button>
  )
}

const disc = (children: ReactNode, style: string) => <span className={cn('grid size-12 shrink-0 place-items-center rounded-full border-2', style)}>{children}</span>

function Credits() {
  const { t } = useLang()
  return (
    <details className="mt-5 text-xs text-muted bn:text-sm">
      <summary className="cursor-pointer">
        {t.game.credits} · {t.game.creditsVia}
      </summary>
      <ul className="mt-2 grid gap-0.5">
        {manifest.models.map((m) => (
          <li key={m.id}>
            <a href={m.page} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {m.name}
            </a>{' '}
            · {m.author} · {m.license}
          </li>
        ))}
      </ul>
    </details>
  )
}

export function GameDialog({ onClose }: { onClose: () => void }) {
  const { lang, t, pick } = useLang()
  const reduceMotion = useReducedMotion() ?? false
  const dialog = useRef<HTMLDialogElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef<Game | null>(null)
  const [controls] = useState<Controls>(createControls)
  const [step, setStep] = useState<Step>(() => (hasWebGL() ? 'who' : 'nowebgl'))
  const [character, setCharacter] = useState<Character>('man')
  const [origin, setOrigin] = useState<GameOrigin | null>(null)
  /** A game to (re)start, fixed when it begins; the key changes on "try again" */
  const [run, setRun] = useState<{ trip: Trip; character: Character; reduceMotion: boolean; key: number } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [loaded, setLoaded] = useState(0)
  const [hud, setHud] = useState<Hud | null>(null)
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  const [pop, setPop] = useState<{ id: number; delta: number } | null>(null)
  const [card, setCard] = useState<'arrived' | 'finale' | null>(null)
  const [paused, setPaused] = useState(false)
  const [touch, setTouch] = useState(() => matchMedia('(pointer: coarse)').matches)
  const trip = run?.trip ?? null

  // A modal over the page: Esc closes it, the page behind doesn't scroll
  useEffect(() => {
    const el = dialog.current!
    if (!el.open) el.showModal()
    const root = document.documentElement
    const overflow = root.style.overflow
    root.style.overflow = 'hidden'
    // Start fetching three.js while the guest chooses
    if (hasWebGL()) void loadEngine()
    const onTouch = () => setTouch(true)
    window.addEventListener('touchstart', onTouch, { once: true, passive: true })
    return () => {
      root.style.overflow = overflow
      window.removeEventListener('touchstart', onTouch)
      if (el.open) el.close()
    }
  }, [])

  const words = (message: Message, current: Trip) => {
    const m = t.game.msg
    switch (message.key) {
      case 'passing':
      case 'station':
      case 'boarded':
      case 'park':
      case 'stopAt':
        return m[message.key](pick(message.place))
      case 'stopped':
        return m.stopped(message.perfect)
      case 'landing':
        return m.landing(pick(current.hub.short))
      default:
        return m[message.key]
    }
  }
  const onEvent = useEffectEvent((event: GameEvent) => {
    if (event.type === 'message' && trip) setToast({ id: performance.now(), text: words(event.message, trip) })
    else if (event.type === 'score') setPop({ id: performance.now(), delta: event.delta })
    else if (event.type === 'phase') setCard(event.phase)
  })

  // Run the game for the chosen trip; tear it down on replay or close
  useEffect(() => {
    if (!run) return
    let cancelled = false
    let started: Game | null = null
    loadEngine()
      .then(({ runGame }) =>
        runGame({
          canvas: canvas.current!,
          trip: run.trip,
          character: run.character,
          controls,
          reduceMotion: run.reduceMotion,
          onHud: setHud,
          onEvent: (event) => onEvent(event),
          onProgress: (done, total) => setLoaded(done / total),
        }),
      )
      .then((g) => {
        if (cancelled) return g.dispose()
        started = g
        game.current = g
        setStatus('ready')
      })
      .catch(() => !cancelled && setStatus('failed'))
    return () => {
      cancelled = true
      started?.dispose()
      game.current = null
    }
  }, [run, controls])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast((now) => (now?.id === toast.id ? null : now)), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (card !== 'arrived') return
    const timer = setTimeout(() => setCard((now) => (now === 'arrived' ? null : now)), 3200)
    return () => clearTimeout(timer)
  }, [card])

  /** Starts (or restarts) a game: fresh HUD, nothing held down */
  const begin = (next: Trip) => {
    Object.assign(controls, createControls())
    setStatus('loading')
    setLoaded(0)
    setHud(null)
    setCard(null)
    setToast(null)
    setPaused(false)
    setRun((prev) => ({ trip: next, character, reduceMotion, key: (prev?.key ?? 0) + 1 }))
    setStep('play')
  }
  const start = (mode: Mode) => origin && begin(makeTrip(origin, mode))
  const togglePause = () => {
    if (!game.current) return
    if (paused) game.current.resume()
    else game.current.pause()
    setPaused(!paused)
  }
  const backToMenu = () => {
    setRun(null)
    setStep('how')
  }
  const toEvents = () => {
    onClose()
    requestAnimationFrame(() => document.getElementById('events')?.scrollIntoView())
  }

  const hold = (key: 'throttle' | 'brake' | 'left' | 'right' | 'up' | 'down') => (on: boolean) => {
    if (key === 'left' || key === 'right') {
      const dir = key === 'left' ? -1 : 1
      controls.steer = on ? dir : controls.steer === dir ? 0 : controls.steer
    } else if (key === 'up' || key === 'down') {
      const dir = key === 'up' ? 1 : -1
      controls.pitch = on ? dir : controls.pitch === dir ? 0 : controls.pitch
    } else controls[key] = on ? 1 : 0
  }

  const playing = step === 'play' && status === 'ready'
  const mode = hud?.mode ?? 'none'
  const legFrom = trip && (hud?.leg === 2 ? pick(trip.hub.short) : pick(trip.origin.name))
  const legTo = trip && (hud?.leg === 2 ? pick(wedding.venue.shortName) : pick(trip.hub.short))
  const LegIcon = trip && hud?.leg !== 2 ? journeyStyles[trip.mode].icon : Bike
  const guest = getGuestName()
  const biye = wedding.events.find((e) => e.id === 'biye')

  return (
    <dialog
      ref={dialog}
      aria-label={t.game.dialog}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none overflow-hidden bg-ink p-0 text-ink backdrop:bg-ink/80"
    >
      {/* A fresh canvas per game: a canvas whose WebGL context was released can't make a new one */}
      <canvas key={run?.key} ref={canvas} aria-hidden="true" className={cn('absolute inset-0 block size-full cursor-grab touch-none select-none active:cursor-grabbing', !playing && 'invisible')} />

      {/* Menus */}
      {step !== 'play' && (
        <div className="absolute inset-0 overflow-y-auto bg-paper bg-[radial-gradient(circle_at_50%_0%,var(--color-paper-deep),var(--color-paper)_60%)]">
          <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-5 py-16">
            <p className="text-center text-xs font-medium tracking-[0.35em] text-zari uppercase bn:text-sm bn:tracking-normal">{t.game.eyebrow}</p>
            <h2 className="mt-2 text-center font-display text-4xl text-sindoor sm:text-5xl">{t.game.title}</h2>

            {step === 'nowebgl' && (
              <div className="mt-8 grid gap-3">
                <p className="text-center text-muted">{t.game.noWebgl}</p>
                {wedding.venue.journeys.map((j) => (
                  <a key={j.id} href={directionsUrl(wedding.venue.coordinates, j.coordinates)} target="_blank" rel="noreferrer" className="btn btn-outline">
                    <Navigation className="size-4" /> {t.game.finale.directions(pick(j.short))}
                  </a>
                ))}
              </div>
            )}

            {step === 'who' && (
              <div className="mt-8 grid gap-3">
                <h3 className="mb-1 text-center text-lg text-ink/80">{t.game.who}</h3>
                <Choice
                  icon={disc(<PersonStanding className="size-7 text-[#8a6a2e]" />, 'border-zari bg-[#efe3c4]')}
                  title={t.game.man}
                  onClick={() => {
                    setCharacter('man')
                    setStep('from')
                  }}
                />
                <Choice
                  icon={disc(<PersonStanding className="size-7 text-paper" />, 'border-zari bg-sindoor')}
                  title={t.game.woman}
                  onClick={() => {
                    setCharacter('woman')
                    setStep('from')
                  }}
                />
              </div>
            )}

            {step === 'from' && (
              <div className="mt-8 grid gap-3">
                <h3 className="mb-1 text-center text-lg text-ink/80">{t.game.from}</h3>
                {origins.map((o) => (
                  <Choice
                    key={o.id}
                    icon={disc(<MapPin className="size-6 text-sindoor" />, 'border-sindoor/40 bg-paper-deep')}
                    title={pick(o.name)}
                    note={t.game.away(number(kmFrom(o), lang))}
                    onClick={() => {
                      setOrigin(o)
                      setStep('how')
                    }}
                  />
                ))}
              </div>
            )}

            {step === 'how' && origin && (
              <div className="mt-8 grid gap-3">
                <h3 className="mb-1 text-center text-lg text-ink/80">{t.game.how}</h3>
                {modesFrom(origin).map((m) => {
                  const { icon: Icon, color } = journeyStyles[m]
                  const hub = wedding.venue.journeys.find((j) => j.icon === m)!
                  return (
                    <Choice
                      key={m}
                      icon={disc(<Icon className="size-6" style={{ color }} />, 'bg-paper')}
                      title={t.game.modes[m]}
                      note={`${t.game.arriveAt(pick(hub.short))}, ${t.game.thenBike}`}
                      onClick={() => start(m)}
                    />
                  )
                })}
              </div>
            )}

            {step !== 'who' && step !== 'nowebgl' && (
              <button type="button" onClick={() => setStep(step === 'how' ? 'from' : 'who')} className="mx-auto mt-5 inline-flex cursor-pointer items-center gap-1 text-sm text-sindoor underline underline-offset-4 bn:text-base">
                <ChevronLeft className="size-4" /> {t.game.back}
              </button>
            )}
            {step !== 'nowebgl' && <Credits />}
          </div>
        </div>
      )}

      {/* Loading or failed */}
      {step === 'play' && status !== 'ready' && (
        <div className="absolute inset-0 grid place-items-center bg-paper px-6">
          <div className="w-full max-w-xs text-center">
            {status === 'loading' ? (
              <>
                <p className="font-display text-2xl text-sindoor italic bn:not-italic">{t.game.loading}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper-deep" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(loaded * 100)}>
                  <div className="h-full rounded-full bg-sindoor transition-[width] duration-300" style={{ width: `${Math.max(6, loaded * 100)}%` }} />
                </div>
              </>
            ) : (
              <>
                <p className="text-muted">{t.game.failed}</p>
                <button type="button" onClick={() => trip && begin(trip)} className="btn btn-primary mt-4">
                  <RotateCcw className="size-4" /> {t.game.retry}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Heads-up display */}
      {playing && hud && trip && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start gap-2 p-3 sm:p-4">
            <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2 rounded-full bg-paper/90 px-3 py-2 shadow-lg ring-1 ring-zari/40">
              <span className="truncate text-xs font-medium text-ink/80 bn:text-sm">{legFrom}</span>
              <div className="relative h-1.5 min-w-12 flex-1 rounded-full bg-paper-deep">
                <div className="h-full rounded-full bg-sindoor" style={{ width: `${hud.progress * 100}%` }} />
                <LegIcon className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper p-0.5 text-sindoor" style={{ left: `${hud.progress * 100}%` }} />
              </div>
              <span className="truncate text-xs font-medium text-ink/80 bn:text-sm">{legTo}</span>
            </div>
            <div className="pointer-events-auto relative flex items-center gap-1.5 rounded-full bg-paper/90 py-1.5 pr-3 pl-2 shadow-lg ring-1 ring-zari/40" aria-label={`${t.game.score}: ${number(hud.score, lang)}`}>
              <Rosogolla className="size-6" />
              <span className="font-display text-xl leading-none font-semibold text-sindoor tabular-nums">{number(hud.score, lang)}</span>
              {pop && (
                <span key={pop.id} className={cn('absolute -bottom-5 left-1/2 -translate-x-1/2 animate-[rise_0.9s_ease-out_forwards] text-sm font-semibold', pop.delta > 0 ? 'text-durba' : 'text-sindoor')}>
                  {pop.delta > 0 ? '+' : '−'}
                  {number(Math.abs(pop.delta), lang)}
                </span>
              )}
            </div>
            <button type="button" onClick={togglePause} aria-label={paused ? t.game.resume : t.game.pause} className="pointer-events-auto grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-paper/90 text-sindoor shadow-lg ring-1 ring-zari/40">
              {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
            </button>
            <button type="button" onClick={onClose} aria-label={t.game.close} className="pointer-events-auto grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-paper/90 text-sindoor shadow-lg ring-1 ring-zari/40">
              <X className="size-5" />
            </button>
          </div>

          {/* Phones have no key hints: say once, early on, that the view can be dragged */}
          {touch && mode !== 'none' && hud.leg === 1 && hud.progress < 0.12 && (
            <p className="pointer-events-none absolute inset-x-0 top-36 mx-auto w-fit rounded-full bg-ink/45 px-3 py-1 text-xs text-paper/90 bn:text-sm">{t.game.lookAround}</p>
          )}

          <div aria-live="polite" className="pointer-events-none absolute inset-x-0 top-20 flex justify-center px-4">
            {toast && (
              <p key={toast.id} className="animate-[toast_2.8s_ease-out_forwards] rounded-2xl border-2 border-zari bg-paper/95 px-5 py-2.5 text-center font-display text-xl text-sindoor shadow-xl sm:text-2xl">
                {toast.text}
              </p>
            )}
          </div>

          {mode !== 'none' && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <span className="rounded-full bg-ink/55 px-3 py-1 font-display text-lg text-paper tabular-nums">
                {number(hud.speedKmh, lang)} <span className="text-xs bn:text-sm">{t.game.kmh}</span>
              </span>
              {!touch && (
                <span className="rounded-full bg-ink/45 px-3 py-1 text-center text-xs text-paper/90 bn:text-sm">
                  {t.game.keys[mode]} · {t.game.lookAround}
                </span>
              )}
            </div>
          )}

          {touch && mode !== 'none' && !paused && (
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex gap-3">
                {mode !== 'train' && (
                  <>
                    <HoldButton label={t.game.controls.left} icon={ArrowLeft} onHold={hold('left')} />
                    <HoldButton label={t.game.controls.right} icon={ArrowRight} onHold={hold('right')} />
                  </>
                )}
              </div>
              <div className="flex items-end gap-3">
                {mode === 'plane' ? (
                  <div className="flex flex-col gap-3">
                    <HoldButton label={t.game.controls.up} icon={ArrowUp} onHold={hold('up')} />
                    <HoldButton label={t.game.controls.down} icon={ArrowDown} onHold={hold('down')} />
                  </div>
                ) : (
                  <>
                    <HoldButton label={t.game.controls.brake} icon={ArrowDown} onHold={hold('brake')} />
                    <HoldButton label={t.game.controls.gas} icon={ArrowUp} onHold={hold('throttle')} size="size-20" className="bg-sindoor/70" />
                  </>
                )}
              </div>
            </div>
          )}

          {paused && (
            <div className="absolute inset-0 grid place-items-center bg-ink/60 px-6">
              <div className="grid w-full max-w-xs gap-3 rounded-3xl bg-paper p-6 text-center shadow-2xl">
                <p className="font-display text-3xl text-sindoor">{t.game.paused}</p>
                <button type="button" onClick={togglePause} className="btn btn-primary">
                  <Play className="size-4" /> {t.game.resume}
                </button>
                <button type="button" onClick={backToMenu} className="btn btn-outline">
                  <RotateCcw className="size-4" /> {t.game.restart}
                </button>
              </div>
            </div>
          )}

          {card === 'arrived' && (
            <div className="pointer-events-none absolute inset-x-0 top-20 flex animate-[toast_3.2s_ease-out_forwards] justify-center px-4">
              <div className="rounded-2xl border-2 border-zari bg-paper/95 px-6 py-3 text-center shadow-xl">
                <p className="font-display text-3xl text-sindoor sm:text-4xl">{t.game.welcome(pick(trip.hub.short))}</p>
                <p className="mt-1 text-ink/80">{t.game.bikeWaiting}</p>
              </div>
            </div>
          )}

          {card === 'finale' && (
            <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="w-full max-w-md animate-[rise-in_0.6s_ease-out_both] rounded-3xl border-[3px] border-ink bg-[#fffaf1] p-5 text-center shadow-[inset_0_0_0_5px_var(--color-haldi),inset_0_0_0_6.5px_var(--color-ink),0_20px_40px_-16px_rgba(43,27,24,.7)] sm:p-6">
                <p className="font-display text-3xl leading-tight text-sindoor">{guest ? t.game.finale.greet(guest) : t.game.finale.title}</p>
                {guest && <p className="mt-1 text-ink/80">{t.game.finale.title}</p>}
                <p className="mt-2 flex items-center justify-center gap-2 text-lg text-ink">
                  <Rosogolla className="size-6" /> {t.game.finale.score(number(hud.score, lang))}
                </p>
                {biye && (
                  <p className="mt-2 text-sm text-muted bn:text-base">
                    {formatLongDate(biye.start, lang)} · {formatTime(biye.start, lang)}
                    <br />
                    {pick(wedding.venue.name)}
                  </p>
                )}
                <div className="mt-4 grid gap-2">
                  <a href={directionsUrl(wedding.venue.coordinates, trip.hub.coordinates)} target="_blank" rel="noreferrer" className="btn btn-primary">
                    <Navigation className="size-4" /> {t.game.finale.directions(pick(trip.hub.short))}
                  </a>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={toEvents} className="btn btn-outline px-3">
                      {t.game.finale.events}
                    </button>
                    <button type="button" onClick={backToMenu} className="btn btn-outline px-3">
                      <RotateCcw className="size-4" /> {t.game.finale.again}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </dialog>
  )
}
