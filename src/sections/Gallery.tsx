import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Alpona } from '@/components/art/Alpona'
import { Section } from '@/components/ui/Section'
import type { GalleryImage } from '@/config/types'
import { wedding } from '@/config/wedding'
import { useLang } from '@/i18n/context'
import { cn } from '@/lib/utils'

const arrowClass =
  'grid size-11 cursor-pointer place-items-center rounded-full border border-sindoor/30 text-sindoor transition-colors hover:bg-sindoor hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zari'

/** Arch-framed photos on a horizontal strip */
export function Gallery() {
  const { t, pick } = useLang()
  const [active, setActive] = useState<GalleryImage | null>(null)
  const strip = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  const credited = wedding.gallery.filter((image) => image.credit)

  const scroll = (direction: 1 | -1) => {
    const el = strip.current
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <Section id="gallery" eyebrow={t.gallery.eyebrow} title={t.gallery.title}>
      <div
        ref={strip}
        className="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pt-2 pb-8 [scrollbar-width:none] sm:gap-8 [&::-webkit-scrollbar]:hidden"
      >
        {wedding.gallery.map((image, i) => (
          <figure key={image.src ?? image.alt.en} className={cn('shrink-0 snap-center', i % 2 === 1 && 'mt-14')}>
            <div className="rounded-t-full bg-paper p-2 shadow-[0_20px_40px_-24px_rgba(43,27,24,0.55)] ring-1 ring-zari/40">
              <div className="relative h-80 w-56 overflow-hidden rounded-t-full sm:h-96 sm:w-64">
                {image.src ? (
                  <button
                    type="button"
                    onClick={() => setActive(image)}
                    aria-label={t.gallery.view(pick(image.alt))}
                    className="group block size-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zari"
                  >
                    <img
                      src={image.src}
                      alt={pick(image.alt)}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                      style={image.position ? { objectPosition: image.position } : undefined}
                    />
                  </button>
                ) : (
                  <div className="grid size-full place-items-center bg-linear-to-b from-paper-deep to-[#e6cfb2] text-sindoor/40">
                    <Alpona className="absolute -bottom-16 left-1/2 size-64 -translate-x-1/2 text-sindoor/10" />
                    <Camera className="relative size-8" aria-hidden="true" />
                  </div>
                )}
              </div>
            </div>
            <figcaption className="mt-4 text-center font-display text-lg text-muted italic bn:not-italic">
              {pick(image.alt)}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-2 flex justify-center gap-3">
        <button type="button" onClick={() => scroll(-1)} aria-label={t.gallery.previous} className={arrowClass}>
          <ChevronLeft className="size-5" />
        </button>
        <button type="button" onClick={() => scroll(1)} aria-label={t.gallery.next} className={arrowClass}>
          <ChevronRight className="size-5" />
        </button>
      </div>

      {credited.length > 0 && (
        <details className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted bn:text-sm">
          <summary className="cursor-pointer hover:text-sindoor">{t.gallery.credits}</summary>
          <ul className="mt-3 space-y-1">
            {credited.map(({ src, alt, credit }) =>
              credit ? (
                <li key={src}>
                  {pick(alt)} —{' '}
                  <a href={credit.source} target="_blank" rel="noreferrer" className="underline hover:text-sindoor">
                    {credit.author}
                  </a>
                  ,{' '}
                  <a href={credit.licenseUrl} target="_blank" rel="noreferrer" className="underline hover:text-sindoor">
                    {credit.license}
                  </a>
                  , {t.gallery.via}
                </li>
              ) : null,
            )}
          </ul>
        </details>
      )}

      <AnimatePresence>
        {active?.src && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={pick(active.alt)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <button
              type="button"
              aria-label={t.gallery.close}
              autoFocus
              onClick={() => setActive(null)}
              className="absolute top-4 right-4 cursor-pointer rounded-full p-2 text-paper hover:bg-white/10"
            >
              <X className="size-6" />
            </button>
            <motion.figure
              key={active.src}
              className="flex max-h-full max-w-full flex-col items-center"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={active.src}
                alt={pick(active.alt)}
                className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
              <figcaption className="mt-3 text-center text-paper">
                <span className="font-display text-xl italic bn:not-italic">{pick(active.alt)}</span>
                {active.credit && (
                  <a
                    href={active.credit.source}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-xs text-paper/60 hover:text-paper"
                  >
                    © {active.credit.author} · {active.credit.license}
                  </a>
                )}
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  )
}
