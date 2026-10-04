import { useRef } from 'react'
import { motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { Alpona } from '@/components/art/Alpona'
import { Butterflies } from '@/components/art/Butterflies'
import { Gatchhora, JodaMachh, KuloFrame } from '@/components/art/Kulo'
import { PaanLeaf } from '@/components/art/PaanLeaf'
import { Toran } from '@/components/art/Toran'
import { Bn } from '@/components/ui/Bn'
import { wedding } from '@/config/wedding'
import { useLang } from '@/i18n/context'
import { formatLongDate } from '@/lib/format'
import { initial } from '@/lib/utils'

/** The names painted on a biyer kulo under a marigold toran. `ready` holds the entrance until the cover opens. */
export function Hero({ ready }: { ready: boolean }) {
  const { lang, t, pick } = useLang()
  const { groom, bride, date, city, heroImage } = wedding
  const bengali = lang === 'bn' ? wedding.bengali : undefined
  const longDate = [formatLongDate(date, lang), bengali?.banglaDate].filter(Boolean).join(' · ')
  const sectionRef = useRef<HTMLElement>(null)
  const groomRef = useRef<HTMLSpanElement>(null)
  const brideRef = useRef<HTMLSpanElement>(null)

  return (
    <section ref={sectionRef} id="home" className="relative overflow-hidden px-6 pb-20">
      <Alpona className="absolute top-[55%] left-1/2 size-[150vmin] -translate-x-1/2 -translate-y-1/2 animate-turn text-sindoor/[0.05]" />
      <Toran className="absolute inset-x-0 top-0" />

      <motion.div
        className="relative mx-auto mt-24 w-full max-w-sm sm:mt-28 sm:max-w-lg"
        initial={{ opacity: 0, y: 40 }}
        animate={ready ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
      >
        {/* Paan leaves tucked behind the kulo */}
        <PaanLeaf className="absolute bottom-24 -left-8 w-20 -rotate-[55deg] sm:-left-12 sm:w-24" />
        <PaanLeaf className="absolute -right-8 bottom-24 w-20 rotate-[55deg] sm:-right-12 sm:w-24" />

        {/* The couple's names painted on a biyer kulo */}
        <KuloFrame
          backdrop={
            <Alpona className="absolute top-8 left-1/2 size-96 -translate-x-1/2 text-sindoor/[0.07]" />
          }
        >
          <div className="px-12 pt-36 pb-16 text-center sm:px-14 sm:pt-40 sm:pb-20">
            {heroImage && <img src={heroImage} alt="" className="mx-auto mb-6 aspect-[4/5] w-full rounded-lg object-cover" />}

            {bengali?.greeting && (
              <Bn display className="block text-4xl leading-normal text-marigold-deep">
                {bengali.greeting}
              </Bn>
            )}
            <p className="text-xs tracking-[0.25em] text-sindoor-deep/75 uppercase sm:tracking-[0.35em] bn:text-base">
              {t.hero.eyebrow}
            </p>

            {lang === 'en' ? (
              <h1 className="mt-4 font-script text-7xl leading-[1.05] text-sindoor sm:text-8xl">
                {/* Flex keeps each name centred over the joiner even on screens too narrow for it */}
                <span className="flex justify-center">
                  <span ref={groomRef}>{groom.firstName.en}</span>
                </span>
                {/* Drops below the descenders of the name above; the name below tucks back up */}
                <span className="mt-[0.42em] -mb-[0.27em] block text-[0.55em] leading-none text-marigold-deep">&amp;</span>
                <span className="flex justify-center">
                  <span ref={brideRef}>{bride.firstName.en}</span>
                </span>
              </h1>
            ) : (
              <h1 className="mt-4 font-bengali-display text-6xl leading-snug text-sindoor sm:text-7xl">
                <span className="flex justify-center">
                  <span ref={groomRef}>{groom.firstName.bn}</span>
                </span>
                <span className="block text-4xl text-marigold-deep">ও</span>
                <span className="flex justify-center">
                  <span ref={brideRef}>{bride.firstName.bn}</span>
                </span>
              </h1>
            )}

            <Gatchhora
              initials={[initial(pick(groom.firstName)), initial(pick(bride.firstName))]}
              script={lang === 'en'}
              className="mx-auto mt-3 w-40 sm:w-44"
            />
            <p className="mt-3 font-display text-2xl text-ink sm:text-[1.7rem]">{longDate}</p>
            <p className="mt-1 text-sm tracking-[0.3em] text-ink/60 uppercase bn:text-base">{pick(city)}</p>
          </div>
          <JodaMachh className="absolute inset-x-0 top-14 mx-auto w-32 sm:top-16 sm:w-36" />
        </KuloFrame>
      </motion.div>

      <Butterflies ready={ready} stage={sectionRef} names={[groomRef, brideRef]} />

      <div className="relative mt-14 flex flex-col items-center gap-6">
        <a href="#events" className="btn btn-primary">
          {t.hero.cta}
        </a>
        <a href="#story" aria-label={t.hero.scroll} className="animate-bounce text-zari">
          <ChevronDown className="size-7" />
        </a>
      </div>
    </section>
  )
}
