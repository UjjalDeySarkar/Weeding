import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { L, Lang } from '@/config/types'
import { wedding } from '@/config/wedding'
import { coupleNames } from '@/lib/utils'
import { LanguageContext } from './context'
import { strings } from './strings'

const STORAGE_KEY = 'wedding-lang'

const isLang = (value: unknown): value is Lang => value === 'en' || value === 'bn'

/** ?lang=bn in the link wins, then the guest's last choice, then the configured default. */
function initialLang(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (isLang(fromUrl)) return fromUrl
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLang(saved)) return saved
  } catch {
    // storage blocked (private mode etc.) — fall through
  }
  return wedding.defaultLang
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = strings[lang].pageTitle(coupleNames(lang))

    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore
    }

    // Keep a shared ?lang= link in sync so reloading keeps the choice
    const url = new URL(window.location.href)
    if (url.searchParams.has('lang') && url.searchParams.get('lang') !== lang) {
      url.searchParams.set('lang', lang)
      window.history.replaceState(null, '', url)
    }
  }, [lang])

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: strings[lang],
      pick: (text: L) => text[lang],
    }),
    [lang],
  )

  return <LanguageContext value={value}>{children}</LanguageContext>
}
