import { lazy, Suspense, useRef } from 'react'
import { useInView } from 'motion/react'
import { Section } from '@/components/ui/Section'
import { wedding } from '@/config/wedding'
import { useLang } from '@/i18n/context'

// The map, characters and engine load only when a guest scrolls near the section
const JourneyStage = lazy(() => import('@/components/journey/JourneyStage').then((m) => ({ default: m.JourneyStage })))

function Unrolling({ label }: { label: string }) {
  return (
    <div className="grid h-full place-items-center rounded-[20px] bg-pata text-muted shadow-[0_0_0_1px_rgba(43,27,24,.14)]">
      <p className="font-display text-xl italic bn:not-italic">{label}</p>
    </div>
  )
}

/**
 * Our journey as a little game: scrolling carries Ujjal and Rupsha across a painted map of West Bengal,
 * from two homes to the 2023 meeting in Kolkata and on to the wedding. The stage stays pinned while
 * the tall track below it scrolls past.
 */
export function Journey() {
  const { lang, t, pick } = useLang()
  const track = useRef<HTMLDivElement>(null)
  const near = useInView(track, { once: true, margin: '1200px 0px' })
  const { journey, story } = wedding
  const [meeting, marriage] = ['birds', 'crowns'].map((motif) => story.find((m) => m.motif === motif))
  const moments = story.filter((m) => ['ring', 'boat', 'homes', 'rings'].includes(m.motif))

  return (
    <Section id="journey" eyebrow={t.journey.eyebrow} title={t.journey.title} className="pb-8 sm:pb-12">
      <div className="mx-auto -mt-4 mb-6 flex max-w-2xl flex-col items-center gap-3 text-center">
        <p className="text-muted">{t.journey.intro}</p>
        <a href="#events" className="text-sm text-sindoor underline underline-offset-4 bn:text-base">
          {t.journey.skip}
        </a>
      </div>

      <div ref={track} className="relative -mx-3 h-[1200svh] sm:mx-0">
        <div className="sticky top-0 h-svh min-h-[480px] py-3">
          {near ? (
            <Suspense fallback={<Unrolling label={t.journey.loading} />}>
              <JourneyStage track={track} />
            </Suspense>
          ) : (
            <Unrolling label={t.journey.loading} />
          )}
        </div>
      </div>

      {/* The same story as plain text for screen readers */}
      <ol className="sr-only" lang={lang}>
        {journey.chapters.map((chapter, i) => (
          <li key={chapter.en}>
            {pick(chapter)}
            {i === 2 && meeting && `: ${pick(meeting.text)}`}
            {i === 5 && `: ${moments.map((m) => `${m.year} ${pick(m.title)}`).join(', ')}`}
            {i === 7 && marriage && `: ${pick(marriage.text)}`}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-center text-xs text-muted/80">{t.journey.credit}</p>
    </Section>
  )
}
