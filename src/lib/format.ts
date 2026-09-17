import type { Lang } from '@/config/types'
import { wedding } from '@/config/wedding'

const locales: Record<Lang, string> = { en: 'en-IN', bn: 'bn-IN' }

function format(iso: string, lang: Lang, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locales[lang], {
    timeZone: wedding.timeZone,
    ...options,
  }).format(new Date(iso))
}

/** 7 → "07" / "০৭" */
export const formatNumber = (value: number, lang: Lang, minDigits = 1) =>
  new Intl.NumberFormat(locales[lang], { minimumIntegerDigits: minDigits, useGrouping: false }).format(value)

/** 16.1 → "16.1" / "১৬.১" */
export const formatDecimal = (value: number, lang: Lang) =>
  new Intl.NumberFormat(locales[lang], { maximumFractionDigits: 1 }).format(value)

/** "2019" → "২০১৯" in Bengali */
export const localizeDigits = (text: string, lang: Lang) =>
  lang === 'bn' ? text.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]) : text

/** Friday, 12 February 2027 · শুক্রবার, ১২ ফেব্রুয়ারি, ২০২৭ */
export const formatLongDate = (iso: string, lang: Lang) =>
  format(iso, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** 12 February 2027 */
export const formatDate = (iso: string, lang: Lang) =>
  format(iso, lang, { day: 'numeric', month: 'long', year: 'numeric' })

/** 12 · 02 · 2027 */
export const formatDotDate = (iso: string, lang: Lang) =>
  [
    format(iso, lang, { day: '2-digit' }),
    format(iso, lang, { month: '2-digit' }),
    format(iso, lang, { year: 'numeric' }),
  ].join(' · ')

function bengaliDayPeriod(hour: number) {
  if (hour >= 4 && hour < 12) return 'সকাল'
  if (hour >= 12 && hour < 16) return 'দুপুর'
  if (hour >= 16 && hour < 18) return 'বিকেল'
  if (hour >= 18 && hour < 20) return 'সন্ধ্যা'
  return 'রাত'
}

/** 6:00 pm · সন্ধ্যা ৬:০০ */
export function formatTime(iso: string, lang: Lang) {
  if (lang === 'en') return format(iso, 'en', { hour: 'numeric', minute: '2-digit' })

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: wedding.timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const hour = Number(parts.find((p) => p.type === 'hour')?.value)
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00'
  return localizeDigits(`${bengaliDayPeriod(hour)} ${hour % 12 || 12}:${minute}`, 'bn')
}
