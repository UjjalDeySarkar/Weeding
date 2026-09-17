import { createContext, use } from 'react'
import type { L, Lang } from '@/config/types'
import type { Strings } from './strings'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  /** Interface text in the current language */
  t: Strings
  /** Picks the current-language value of a config text */
  pick: (text: L) => string
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

export function useLang() {
  const ctx = use(LanguageContext)
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>')
  return ctx
}
