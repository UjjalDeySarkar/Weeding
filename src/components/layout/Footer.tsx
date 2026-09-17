import { Heart } from 'lucide-react'
import { Alpona } from '@/components/art/Alpona'
import { PaanLeaf } from '@/components/art/PaanLeaf'
import { Bn } from '@/components/ui/Bn'
import { wedding } from '@/config/wedding'
import { useLang } from '@/i18n/context'
import { formatDotDate } from '@/lib/format'
import { cn, coupleNames } from '@/lib/utils'

export function Footer() {
  const { lang, t } = useLang()
  const { hashtag, date, bengali } = wedding

  return (
    <footer className="scallop-t relative -mt-3.5 overflow-hidden bg-sindoor-deep px-6 pt-24 pb-12 text-center text-paper">
      <Alpona className="absolute top-1/2 left-1/2 size-[46rem] -translate-x-1/2 -translate-y-1/2 animate-turn text-paper/[0.05]" />

      <div className="relative">
        <div className="flex justify-center">
          <PaanLeaf className="w-14 translate-x-2 -rotate-[25deg]" />
          <PaanLeaf className="w-14 -translate-x-2 rotate-[25deg]" />
        </div>
        <p className="mx-auto mt-6 max-w-xl font-display text-3xl text-balance text-zari-light italic sm:text-4xl bn:not-italic">
          {t.footer.blessing}
        </p>

        <p
          className={cn(
            'mt-10',
            lang === 'en' ? 'font-script text-5xl' : 'font-bengali-display text-4xl leading-normal',
          )}
        >
          {coupleNames(lang)}
        </p>
        <p className="mt-2 text-sm tracking-[0.3em] text-paper/80">{formatDotDate(date, lang)}</p>
        {lang === 'en' && hashtag && <p className="mt-5 font-display text-xl text-zari-light italic">{hashtag}</p>}
        {lang === 'bn' && bengali?.greeting && (
          <Bn display className="mt-4 block text-3xl leading-normal text-zari-light">
            {bengali.greeting}
          </Bn>
        )}

        <p className="mt-12 flex items-center justify-center gap-1.5 text-xs text-paper/50 bn:text-sm">
          {t.footer.before}
          <Heart className="size-3 fill-current text-zari" aria-hidden="true" />
          {t.footer.after}
        </p>
      </div>
    </footer>
  )
}
