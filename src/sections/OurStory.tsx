import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { PataArt } from '@/components/art/PataArt'
import { Bn } from '@/components/ui/Bn'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import type { Person } from '@/config/types'
import { wedding } from '@/config/wedding'
import { useLang } from '@/i18n/context'
import { localizeDigits } from '@/lib/format'
import { cn, initial } from '@/lib/utils'

function PersonCard({ person, role }: { person: Person; role: string }) {
  const { lang, t, pick } = useLang()
  const { parents } = person

  return (
    <figure className="flex max-w-xs flex-col items-center text-center">
      <div className="rounded-t-full bg-sindoor p-1.5 shadow-[0_24px_40px_-20px_rgba(109,14,19,0.6)]">
        <div className="rounded-t-full border border-dashed border-zari-light p-1">
          <div className="grid h-64 w-48 place-items-center overflow-hidden rounded-t-full bg-linear-to-b from-paper to-paper-deep sm:h-72 sm:w-52">
            {person.photo ? (
              <img src={person.photo} alt={pick(person.fullName)} className="size-full object-cover" />
            ) : (
              <span className="font-script text-8xl text-sindoor/50" aria-hidden="true">
                {initial(pick(person.firstName))}
              </span>
            )}
          </div>
        </div>
      </div>
      <figcaption>
        <p className="mt-6 text-xs tracking-[0.35em] text-zari uppercase bn:text-lg">{role}</p>
        <h3 className="mt-1 font-display text-3xl text-sindoor sm:text-4xl">{pick(person.fullName)}</h3>
        {parents &&
          (lang === 'en' ? (
            <div className="mt-3">
              <p className="text-xs tracking-[0.25em] text-muted uppercase">
                {parents.relation === 'son' ? t.story.son : t.story.daughter}
              </p>
              <p className="mt-1 font-display text-lg leading-snug">
                {parents.father}
                <br />
                &amp; {parents.mother}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-base leading-relaxed text-balance">{parents.bn}</p>
          ))}
      </figcaption>
    </figure>
  )
}

/** Wooden roller with brass finials. `roll` is the paper still wound around it. */
function Roller({ roll, tassels }: { roll?: MotionValue<number> | number; tassels?: boolean }) {
  const finial =
    'absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-radial-[at_35%_35%] from-zari-light via-zari to-[#7a5418] ring-1 ring-ink/60'
  const tassel = 'absolute top-1/2 mt-2 h-7 w-1.5 -translate-x-1/2 rounded-b-full bg-linear-to-b from-sindoor to-sindoor-deep'

  return (
    <div className="relative -mx-5 flex h-4 items-center sm:-mx-7" aria-hidden="true">
      <span className="h-3 w-full rounded-full bg-linear-to-b from-[#5a2a10] via-[#d49048] to-[#4a220c] shadow-[0_3px_6px_rgba(43,27,24,0.35)]" />
      {roll !== undefined && (
        <motion.span
          style={{ height: roll }}
          className="absolute inset-x-5 top-1/2 -translate-y-1/2 rounded-[40%] bg-linear-to-b from-[#b3935f] via-[#fbf0d8] to-[#a9895a] shadow-[0_4px_8px_rgba(43,27,24,0.3)] sm:inset-x-7"
        />
      )}
      {tassels && (
        <>
          <span className={cn(tassel, 'left-0')} />
          <span className={cn(tassel, 'left-full')} />
        </>
      )}
      <span className={cn(finial, '-left-2.5')} />
      <span className={cn(finial, '-right-2.5')} />
    </div>
  )
}

/**
 * Our story as a patachitra (পটচিত্র): the painted scroll Bengal's patuas unroll frame by frame as they sing.
 * The lower roller travels down with the page, unwinding one panel at a time.
 */
function PataScroll() {
  const { lang, t, pick } = useLang()
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 85%'] })
  const clipPath = useTransform(scrollYProgress, (v) => `inset(0 0 ${(1 - v) * 100}% 0)`)
  const rollerTop = useTransform(scrollYProgress, (v) => `${v * 100}%`)
  const roll = useTransform(scrollYProgress, [0, 1], [34, 14])

  return (
    <div className="mx-auto mt-24 max-w-3xl px-2 sm:px-6">
      <p className="mb-8 text-center font-display text-lg text-muted italic bn:not-italic">{t.story.scroll}</p>

      {/* hanging cord */}
      <div className="relative mx-auto h-10" aria-hidden="true">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          <path d="M0 40 L50 3 L100 40" fill="none" className="stroke-ink/70" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="absolute top-0 left-1/2 size-3 -translate-1/2 rounded-full bg-zari ring-2 ring-ink/60" />
      </div>
      <Roller />

      <div ref={ref} className="relative">
        <motion.div
          style={reduceMotion ? undefined : { clipPath }}
          className="relative bg-pata px-8 py-10 shadow-[inset_0_0_40px_rgba(122,84,24,0.18)] sm:px-14 sm:py-12"
        >
          <div className="pata-vine absolute inset-y-0 left-1.5 w-5 border-x-2 border-ink sm:left-3 sm:w-7" aria-hidden="true" />
          <div className="pata-vine absolute inset-y-0 right-1.5 w-5 border-x-2 border-ink sm:right-3 sm:w-7" aria-hidden="true" />

          <ol>
            {wedding.story.map((moment, i) => (
              <li key={moment.title.en}>
                {i > 0 && <div className="pata-band my-8 h-5 border-x-2 border-ink sm:my-10" aria-hidden="true" />}
                <article className="grid items-center gap-5 border-[3px] border-ink bg-paper p-2.5 shadow-[inset_0_0_0_5px_var(--color-haldi),inset_0_0_0_6.5px_var(--color-ink)] sm:grid-cols-2 sm:gap-7 sm:p-3">
                  <motion.div
                    className={cn('border-2 border-ink', i % 2 === 1 && 'sm:order-last')}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.92, rotate: i % 2 ? 1.5 : -1.5 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  >
                    <PataArt motif={moment.motif} className="w-full" />
                  </motion.div>
                  <div className="px-3 pb-5 text-center sm:py-4 sm:text-left">
                    <p className="font-display text-5xl leading-none text-zari italic bn:not-italic">
                      {localizeDigits(moment.year, lang)}
                    </p>
                    <h3 className="mt-2 font-display text-2xl leading-tight text-sindoor sm:text-[1.7rem]">
                      {pick(moment.title)}
                    </h3>
                    <span className="mx-auto mt-3 block h-0.5 w-12 bg-linear-to-r from-sindoor to-zari sm:mx-0" />
                    <p className="mt-3 leading-relaxed text-ink/75">{pick(moment.text)}</p>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </motion.div>

        <motion.div
          style={{ top: reduceMotion ? '100%' : rollerTop }}
          className="absolute inset-x-0 -translate-y-1/2"
        >
          <Roller roll={reduceMotion ? 14 : roll} tassels />
        </motion.div>
      </div>
    </div>
  )
}

export function OurStory() {
  const { lang, t, pick } = useLang()
  const { groom, bride, intro } = wedding
  const bengali = lang === 'bn' ? wedding.bengali : undefined

  return (
    <Section id="story" eyebrow={t.story.eyebrow} title={t.story.title}>
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="font-display text-2xl leading-relaxed text-ink/85 text-balance sm:text-3xl">
          <span className="text-zari">“</span>
          {pick(intro)}
          <span className="text-zari">”</span>
        </p>
        {bengali?.invitation && <Bn className="mt-5 block text-xl text-sindoor">{bengali.invitation}</Bn>}
      </Reveal>

      <Reveal
        className="mt-16 flex flex-col items-center justify-center gap-8 sm:flex-row sm:items-start sm:gap-6 md:gap-12"
        delay={0.1}
      >
        <PersonCard person={groom} role={t.story.groom} />
        <span className="font-script text-6xl text-zari sm:mt-28" aria-hidden="true">
          {lang === 'bn' ? 'ও' : '&'}
        </span>
        <PersonCard person={bride} role={t.story.bride} />
      </Reveal>

      <PataScroll />
    </Section>
  )
}
