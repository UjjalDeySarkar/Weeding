import { Fragment, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Alpona } from '@/components/art/Alpona'
import { PaanLeaf } from '@/components/art/PaanLeaf'
import { Bn } from '@/components/ui/Bn'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { wedding } from '@/config/wedding'
import { useLang } from '@/i18n/context'
import { formatDotDate } from '@/lib/format'
import { cn, getGuestName, initial } from '@/lib/utils'

interface CoverProps {
  open: boolean
  onOpen: () => void
}

const leafTransition = { duration: 1.1, ease: [0.65, 0, 0.35, 1] } as const

/**
 * Shubho Drishti opening: the couple's names sit hidden behind two betel leaves,
 * as the bride hides her face. Tapping the seal parts the leaves, then the invitation opens.
 */
export function Cover({ open, onOpen }: CoverProps) {
  const { lang, t, pick } = useLang()
  const reduceMotion = useReducedMotion()
  const [revealed, setRevealed] = useState(false)
  const guest = getGuestName()
  const { hosts, groom, bride } = wedding
  const bengali = lang === 'bn' ? wedding.bengali : undefined
  const joiner = lang === 'bn' ? 'ও' : '&'

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // Let the names be seen for a moment before the invitation opens
  useEffect(() => {
    if (!revealed) return
    const id = setTimeout(onOpen, reduceMotion ? 0 : 1900)
    return () => clearTimeout(id)
  }, [revealed, onOpen, reduceMotion])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cover"
          role="dialog"
          aria-modal="true"
          aria-label={t.cover.dialog}
          className="fixed inset-0 z-50 flex flex-col overflow-x-hidden overflow-y-auto bg-sindoor-deep px-8 py-12 text-center text-paper"
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <Alpona className="fixed top-1/2 left-1/2 size-[160vmax] -translate-x-1/2 -translate-y-1/2 animate-turn text-paper/[0.06] sm:size-[120vmax]" />
          <div className="pointer-events-none fixed inset-4 border border-zari/50 sm:inset-8" aria-hidden="true" />
          <div
            className="pointer-events-none fixed inset-6 border border-dashed border-zari/30 sm:inset-10"
            aria-hidden="true"
          />
          {/* Sits on the top frame line */}
          <LanguageToggle tone="light" className="fixed top-4 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 sm:top-8" />

          <div className="relative m-auto w-full max-w-lg">
            {bengali?.invocation && <Bn className="mb-1 block text-sm text-zari-light/80">{bengali.invocation}</Bn>}
            {bengali?.greeting && (
              <Bn display className="mb-3 block text-4xl leading-normal text-zari-light">
                {bengali.greeting}
              </Bn>
            )}
            {guest && <p className="font-display text-xl text-zari-light italic">{t.cover.dear(guest)}</p>}
            {hosts && (
              <p className="mt-3 font-display text-lg leading-snug sm:text-xl">
                {hosts.names.map((name, i) => (
                  <Fragment key={name.en}>
                    {i > 0 && (
                      <span className="block text-sm text-zari-light italic bn:text-base bn:not-italic">
                        {t.cover.and}
                      </span>
                    )}
                    <span className="block">{pick(name)}</span>
                  </Fragment>
                ))}
              </p>
            )}
            <p className="mt-2 text-xs tracking-[0.3em] text-balance text-paper/70 uppercase bn:text-base">
              {hosts ? pick(hosts.message) : t.cover.invited}
            </p>

            {/* The reveal stage */}
            <div className="relative mx-auto mt-4 h-56 w-full sm:h-64">
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={false}
                animate={
                  revealed
                    ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
                    : { opacity: 0, scale: 0.85, filter: 'blur(8px)' }
                }
                transition={{ duration: 0.9, delay: 0.35 }}
              >
                <h1
                  className={cn(
                    'leading-tight text-balance text-zari-light drop-shadow-[0_0_24px_rgba(235,203,133,0.45)]',
                    lang === 'en' ? 'font-script text-6xl sm:text-7xl' : 'font-bengali-display text-5xl leading-normal sm:text-6xl',
                  )}
                >
                  {pick(groom.firstName)} <span className="text-3xl text-paper/80 sm:text-4xl">{joiner}</span>{' '}
                  {pick(bride.firstName)}
                </h1>
              </motion.div>

              <motion.div
                className="absolute top-1/2 left-1/2 w-36 drop-shadow-[0_12px_18px_rgba(0,0,0,0.45)] sm:w-44"
                initial={false}
                animate={
                  revealed
                    ? { x: '-230%', y: '-40%', rotate: -80, opacity: 0 }
                    : { x: '-84%', y: '-50%', rotate: -14, opacity: 1 }
                }
                transition={leafTransition}
              >
                <PaanLeaf />
              </motion.div>
              <motion.div
                className="absolute top-1/2 left-1/2 w-36 drop-shadow-[0_12px_18px_rgba(0,0,0,0.45)] sm:w-44"
                initial={false}
                animate={
                  revealed
                    ? { x: '130%', y: '-40%', rotate: 80, opacity: 0 }
                    : { x: '-16%', y: '-50%', rotate: 14, opacity: 1 }
                }
                transition={leafTransition}
              >
                <PaanLeaf />
              </motion.div>

              {/* Wax seal */}
              <AnimatePresence>
                {!revealed && (
                  <motion.button
                    type="button"
                    onClick={() => setRevealed(true)}
                    aria-label={t.cover.open}
                    autoFocus
                    className="absolute top-1/2 left-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-sindoor text-zari-light shadow-[0_8px_24px_rgba(0,0,0,0.5)] ring-4 ring-sindoor-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zari-light"
                    exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <span className="absolute -inset-2 animate-ping rounded-full border border-zari-light/40 [animation-duration:2.4s]" />
                    <span className="absolute inset-1.5 rounded-full border border-dashed border-zari-light/70" />
                    <span className="font-script text-3xl leading-none">
                      {initial(pick(groom.firstName))}
                      <span className={cn('text-xl', lang === 'bn' ? 'mx-1.5' : 'mx-0.5')}>{joiner}</span>
                      {initial(pick(bride.firstName))}
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <motion.p
              className="text-xs tracking-[0.25em] text-zari-light/80 uppercase bn:text-sm"
              animate={{ opacity: revealed ? 0 : 1 }}
            >
              {t.cover.hint}
            </motion.p>
            <p className="mt-4 text-sm tracking-[0.3em]">{formatDotDate(wedding.date, lang)}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
