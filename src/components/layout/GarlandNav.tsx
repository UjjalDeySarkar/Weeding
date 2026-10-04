import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll } from 'motion/react'
import type { Variants } from 'motion/react'
import { BookHeart, CalendarHeart, House, Images, MapPin, Route, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { wedding } from '@/config/wedding'
import { useLang } from '@/i18n/context'
import { cn, initial } from '@/lib/utils'

type SectionId = 'home' | 'story' | 'journey' | 'events' | 'gallery' | 'venue'

const sections: { id: SectionId; icon: LucideIcon }[] = [
  { id: 'home', icon: House },
  { id: 'story', icon: BookHeart },
  { id: 'journey', icon: Route },
  { id: 'events', icon: CalendarHeart },
  { id: 'gallery', icon: Images },
  { id: 'venue', icon: MapPin },
]

// The garland unrolls upwards from the seal: bottom bead first
const garland: Variants = {
  open: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
  closed: { transition: { staggerChildren: 0.03 } },
}
const bead: Variants = {
  open: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 26 } },
  closed: { opacity: 0, y: 24, scale: 0.6, transition: { duration: 0.15 } },
}
const thread: Variants = {
  open: { scaleY: 1, transition: { duration: 0.35 } },
  closed: { scaleY: 0, transition: { duration: 0.15 } },
}

/**
 * Replaces a top menu bar: a wax seal (bottom-right) whose stitched ring tracks scroll progress.
 * Tapping it unrolls a garland of section "beads" on a kantha thread, with the language toggle on top.
 */
export function GarlandNav() {
  const { lang, t, pick } = useLang()
  const { groom, bride } = wedding
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<SectionId>('home')
  const [chip, setChip] = useState<SectionId | null>(null)
  const chipTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const sealRef = useRef<HTMLButtonElement>(null)
  const { scrollYProgress } = useScroll()

  // Scroll-spy: highlight the section in view and briefly name it next to the seal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const id = entry.target.id as SectionId
          setActive(id)
          clearTimeout(chipTimer.current)
          setChip(id === 'home' ? null : id)
          chipTimer.current = setTimeout(() => setChip(null), 1800)
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    for (const { id } of sections) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => {
      observer.disconnect()
      clearTimeout(chipTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      sealRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* column-reverse: the seal comes first for keyboard users, the garland sits above it */}
      <div className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex flex-col-reverse items-end sm:right-6 sm:bottom-6">
        <div className="relative">
          <svg viewBox="0 0 64 64" className="pointer-events-none absolute -inset-1.5 -rotate-90" aria-hidden="true">
            <circle cx="32" cy="32" r="30" fill="none" stroke="#c39035" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="2 3" />
            <motion.circle
              cx="32"
              cy="32"
              r="30"
              fill="none"
              stroke="#c39035"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ pathLength: scrollYProgress }}
            />
          </svg>

          <button
            ref={sealRef}
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="garland-menu"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            className="relative grid size-14 cursor-pointer place-items-center rounded-full bg-sindoor text-zari-light shadow-[0_8px_20px_rgba(109,14,19,0.45)] ring-4 ring-sindoor-deep transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zari active:scale-95"
          >
            <span className="absolute inset-1 rounded-full border border-dashed border-zari-light/70" />
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                >
                  <X className="size-6" aria-hidden="true" />
                </motion.span>
              ) : (
                <motion.span
                  key="seal"
                  className="font-script text-2xl leading-none"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  aria-hidden="true"
                >
                  {initial(pick(groom.firstName))}
                  <span className={cn('text-base', lang === 'bn' ? 'mx-1' : 'mx-px')}>{lang === 'bn' ? 'ও' : '&'}</span>
                  {initial(pick(bride.firstName))}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {!open && chip && (
              <motion.span
                key={chip}
                className="pointer-events-none absolute top-1/2 right-full mr-4 -translate-y-1/2 rounded-full bg-paper/95 px-3 py-1 text-sm font-medium whitespace-nowrap text-sindoor shadow-md ring-1 ring-ink/10"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                aria-hidden="true"
              >
                {t.nav[chip]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              id="garland-menu"
              aria-label={t.nav.label}
              className="mb-4 flex flex-col items-end gap-4"
              variants={garland}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <motion.div variants={bead}>
                <LanguageToggle />
              </motion.div>

              <ol className="relative flex w-14 flex-col items-center gap-3">
                <motion.span
                  variants={thread}
                  className="kantha-thread absolute -top-2 -bottom-4 left-1/2 w-6 origin-bottom -translate-x-1/2"
                  aria-hidden="true"
                />
                {sections.map(({ id, icon: Icon }) => {
                  const current = active === id
                  return (
                    <motion.li key={id} variants={bead} className="relative">
                      <a
                        href={`#${id}`}
                        onClick={close}
                        aria-current={current ? 'location' : undefined}
                        className="group flex items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zari"
                      >
                        <span
                          className={cn(
                            'absolute right-full mr-3 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap shadow-md ring-1 transition-colors bn:text-base',
                            current ? 'bg-sindoor text-paper ring-sindoor' : 'bg-paper text-ink ring-ink/10 group-hover:text-sindoor',
                          )}
                        >
                          {t.nav[id]}
                        </span>
                        <span
                          className={cn(
                            'relative grid size-11 place-items-center rounded-full border-2 shadow-md transition-transform group-hover:scale-110',
                            current ? 'border-zari-light bg-sindoor text-paper' : 'border-zari bg-paper text-sindoor',
                          )}
                        >
                          <Icon className="size-5" aria-hidden="true" />
                        </span>
                      </a>
                    </motion.li>
                  )
                })}
              </ol>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
