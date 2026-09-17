import { wedding } from '@/config/wedding'
import { useCountdown } from '@/hooks/useCountdown'
import { useLang } from '@/i18n/context'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Shakha (conch-white) and pola (coral-red) bangles, worn in pairs by Bengali brides */
const bangles = [
  { base: '#fffaf0', carving: '#a51c1c' },
  { base: '#a51c1c', carving: '#ebcb85' },
]

function Bangle({ value, label, index }: { value: string; label: string; index: number }) {
  const { base, carving } = bangles[index % 2]
  return (
    <div className="flex flex-col items-center">
      <div className="relative grid size-16 place-items-center min-[360px]:size-[4.75rem] sm:size-36">
        <svg
          viewBox="0 0 100 100"
          className={cn(
            'absolute inset-0 animate-turn drop-shadow-[0_6px_8px_rgba(109,14,19,0.25)]',
            index % 2 === 1 && '[animation-direction:reverse]',
          )}
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="42" fill="none" stroke={base} strokeWidth="14" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={carving}
            strokeWidth="6"
            strokeDasharray="1.5 4.5"
            strokeLinecap="round"
          />
          <circle cx="50" cy="50" r="34.5" fill="none" stroke="#c39035" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="49.3" fill="none" stroke="#c39035" strokeWidth="1.2" />
        </svg>
        <span className="relative font-display text-xl font-semibold text-ink tabular-nums min-[360px]:text-2xl sm:text-4xl">
          {value}
        </span>
      </div>
      <span className="mt-3 text-[10px] tracking-[0.2em] text-muted uppercase sm:text-xs bn:text-sm">{label}</span>
    </div>
  )
}

export function Countdown() {
  const { lang, t } = useLang()
  const { days, hours, minutes, seconds, isPast } = useCountdown(wedding.date)

  const units = [
    { label: t.countdown.days, value: days },
    { label: t.countdown.hours, value: hours },
    { label: t.countdown.minutes, value: minutes },
    { label: t.countdown.seconds, value: seconds },
  ]

  return (
    <section aria-label={t.countdown.label} className="bg-paper-deep px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl text-center">
        <p className="font-script text-5xl leading-normal text-sindoor sm:text-6xl bn:text-4xl">
          {isPast ? t.countdown.done : t.countdown.heading}
        </p>

        {!isPast && (
          <div className="mt-10 flex justify-center gap-2 sm:gap-8">
            {units.map(({ label, value }, i) => (
              <Bangle key={label} index={i} label={label} value={formatNumber(value, lang, 2)} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
