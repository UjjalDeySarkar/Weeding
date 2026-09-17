import type { Lang } from '@/config/types'
import { wedding } from '@/config/wedding'

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

/** Personalised greeting from the link, e.g. https://site.com/?to=Rahul%20%26%20Family */
export function getGuestName() {
  const name = new URLSearchParams(window.location.search).get('to')?.trim()
  return name ? name.slice(0, 60) : null
}

/** Groom first: "Ujjal & Rupsha" / "উজ্জ্বল ও রূপসা" */
export function coupleNames(lang: Lang) {
  const { groom, bride } = wedding
  return `${groom.firstName[lang]} ${lang === 'bn' ? 'ও' : '&'} ${bride.firstName[lang]}`
}

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

/** First letter as a reader sees it: "Ujjal" → "U", "রূপসা" → "রূ" */
export const initial = (text: string) => [...graphemes.segment(text)][0]?.segment ?? ''
