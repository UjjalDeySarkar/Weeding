import { lazy, Suspense, useState } from 'react'
import { Bike, Gamepad2, MapPin } from 'lucide-react'
import { journeyStyles } from '@/components/map/routes'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import { wedding } from '@/config/wedding'
import { useLang } from '@/i18n/context'

// The dialog is small; three.js and the 3D models load only once a guest starts a trip
const GameDialog = lazy(() => import('@/components/game/GameDialog').then((m) => ({ default: m.GameDialog })))

/** "Ride to the wedding": fly, take the train or the bus to Siliguri, then ride a bike to the biye-bari */
export function RideGame() {
  const { t, pick } = useLang()
  const [open, setOpen] = useState(false)

  return (
    <Section id="ride" eyebrow={t.game.eyebrow} title={t.game.title}>
      <Reveal className="mx-auto max-w-2xl">
        <div className="rounded-[28px] border-[3px] border-ink bg-[#fffaf1] px-6 py-8 text-center shadow-[inset_0_0_0_5px_var(--color-haldi),inset_0_0_0_6.5px_var(--color-ink),0_14px_30px_-16px_rgba(43,27,24,.6)] sm:px-10">
          <ul className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-sm text-ink/80 bn:text-base" aria-hidden="true">
            {wedding.venue.journeys.map((j) => {
              const { icon: Icon, color } = journeyStyles[j.icon]
              return (
                <li key={j.id} className="flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 ring-1 ring-zari/40">
                  <Icon className="size-4" style={{ color }} /> {pick(j.short)}
                </li>
              )
            })}
            <li className="px-1 text-zari">→</li>
            <li className="flex items-center gap-1.5 rounded-full bg-sindoor px-3 py-1.5 text-paper">
              <Bike className="size-4" /> <MapPin className="size-4" /> {pick(wedding.venue.shortName)}
            </li>
          </ul>
          <p className="mx-auto mt-6 max-w-lg leading-relaxed text-ink/85">{t.game.intro}</p>
          <button type="button" onClick={() => setOpen(true)} className="btn btn-primary mt-6">
            <Gamepad2 className="size-5" /> {t.game.play}
          </button>
        </div>
      </Reveal>
      {open && (
        <Suspense fallback={null}>
          <GameDialog onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </Section>
  )
}
