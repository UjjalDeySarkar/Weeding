import { Marquee } from '@/components/ui/Marquee'
import { wedding } from '@/config/wedding'
import { useLang } from '@/i18n/context'
import { formatLongDate } from '@/lib/format'
import { coupleNames } from '@/lib/utils'

export function Ribbon() {
  const { lang, t, pick } = useLang()
  const greeting = lang === 'bn' ? wedding.bengali?.greeting : undefined
  const items = [greeting, coupleNames(lang), formatLongDate(wedding.date, lang), pick(wedding.city), t.ribbon.tagline]

  return (
    <Marquee
      items={items.filter((item): item is string => Boolean(item))}
      className="border-y-4 border-double border-zari bg-sindoor py-3 font-display text-xl text-paper italic sm:text-2xl bn:not-italic"
    />
  )
}
