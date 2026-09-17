import {
  CalendarDays,
  CalendarPlus,
  Clock,
  HandHeart,
  Heart,
  MapPin,
  Music,
  Navigation,
  PartyPopper,
  Shirt,
  Sparkles,
  Sun,
  UtensilsCrossed,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Alpona } from '@/components/art/Alpona'
import { Section } from '@/components/ui/Section'
import type { EventIcon, EventTheme } from '@/config/types'
import { wedding } from '@/config/wedding'
import { useLang } from '@/i18n/context'
import { formatLongDate, formatNumber, formatTime } from '@/lib/format'
import { directionsUrl, eventLocation, googleCalendarUrl, mapsSearchUrl } from '@/lib/links'
import { cn, coupleNames } from '@/lib/utils'

const icons: Record<EventIcon, LucideIcon> = {
  blessing: HandHeart,
  turmeric: Sun,
  heart: Heart,
  feast: UtensilsCrossed,
  music: Music,
  party: PartyPopper,
  sparkles: Sparkles,
}

const themes: Record<EventTheme, { card: string; accent: string; button: string }> = {
  dhaan: {
    card: 'bg-paper text-ink ring-1 ring-zari/40',
    accent: 'text-durba',
    button: 'border-ink/25 hover:bg-durba hover:text-paper hover:border-durba',
  },
  haldi: {
    card: 'bg-haldi text-ink',
    accent: 'text-sindoor-deep',
    button: 'border-ink/30 hover:bg-ink hover:text-haldi',
  },
  sindoor: {
    card: 'bg-sindoor text-paper',
    accent: 'text-zari-light',
    button: 'border-paper/40 hover:bg-paper hover:text-sindoor',
  },
  kolapata: {
    card: 'bg-durba text-paper',
    accent: 'text-zari-light',
    button: 'border-paper/40 hover:bg-paper hover:text-durba',
  },
}

/** Ceremony cards that stack on top of each other as you scroll (desktop). */
export function Events() {
  const { lang, t, pick } = useLang()

  return (
    <Section id="events" eyebrow={t.events.eyebrow} title={t.events.title} className="bg-paper-deep">
      <div className="mx-auto max-w-3xl">
        {wedding.events.map((event, i) => {
          const Icon = icons[event.icon]
          const theme = themes[event.theme]
          return (
            <div key={event.id} className="mb-8 md:sticky" style={{ top: `calc(2rem + ${i * 1.75}rem)` }}>
              <article
                className={cn(
                  'relative overflow-hidden rounded-[2rem] p-7 shadow-[0_24px_50px_-28px_rgba(43,27,24,0.6)] sm:p-10',
                  theme.card,
                )}
              >
                <Alpona className="absolute -right-24 -bottom-24 size-72 opacity-15" />
                <div className="relative grid items-center gap-6 sm:grid-cols-[auto_1fr] sm:gap-10">
                  <div className="flex flex-col items-center">
                    <div className="grid h-36 w-28 place-items-center rounded-t-full border-2 border-current/30">
                      <Icon className="size-10" aria-hidden="true" />
                    </div>
                    <span className={cn('mt-2 font-display text-5xl italic', theme.accent)}>
                      {formatNumber(i + 1, lang, 2)}
                    </span>
                  </div>

                  <div className="text-center sm:text-left">
                    <h3 className="font-display text-4xl sm:text-5xl">{pick(event.name)}</h3>
                    {event.description && <p className="mt-2 opacity-85">{pick(event.description)}</p>}

                    <dl className="mt-5 grid gap-2 text-sm sm:grid-cols-2 bn:text-base">
                      <Detail icon={CalendarDays} label={t.events.date}>
                        {formatLongDate(event.start, lang)}
                      </Detail>
                      <Detail icon={Clock} label={t.events.time}>
                        {formatTime(event.start, lang)} – {formatTime(event.end, lang)}
                      </Detail>
                      <Detail icon={MapPin} label={t.events.venue}>
                        {pick(event.venue)}, {pick(event.address)}
                      </Detail>
                      {event.dressCode && (
                        <Detail icon={Shirt} label={t.events.dressCode}>
                          {pick(event.dressCode)}
                        </Detail>
                      )}
                    </dl>

                    <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
                      <a
                        href={googleCalendarUrl(event, `${pick(event.name)} · ${coupleNames(lang)}`, lang)}
                        target="_blank"
                        rel="noreferrer"
                        className={cn('btn border px-5 py-2.5 text-xs bn:text-sm', theme.button)}
                      >
                        <CalendarPlus className="size-4" aria-hidden="true" />
                        {t.events.calendar}
                      </a>
                      <a
                        href={event.atVenue ? directionsUrl(wedding.venue.coordinates) : mapsSearchUrl(eventLocation(event))}
                        target="_blank"
                        rel="noreferrer"
                        className={cn('btn border px-5 py-2.5 text-xs bn:text-sm', theme.button)}
                      >
                        <Navigation className="size-4" aria-hidden="true" />
                        {t.events.directions}
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

function Detail({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-center gap-2 sm:justify-start">
      <dt className="pt-0.5">
        <Icon className="size-4 opacity-70" aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </dt>
      <dd>{children}</dd>
    </div>
  )
}
