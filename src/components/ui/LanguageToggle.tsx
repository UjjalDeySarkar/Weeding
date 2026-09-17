import type { Lang } from '@/config/types'
import { useLang } from '@/i18n/context'
import { cn } from '@/lib/utils'

const options: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'bn', label: 'বাংলা' },
]

interface LanguageToggleProps {
  /** `light` for dark backgrounds */
  tone?: 'dark' | 'light'
  className?: string
}

export function LanguageToggle({ tone = 'dark', className }: LanguageToggleProps) {
  const { lang, setLang, t } = useLang()
  const light = tone === 'light'

  return (
    <div
      role="group"
      aria-label={t.language}
      className={cn(
        'inline-flex shrink-0 rounded-full border p-0.5',
        light ? 'border-zari-light/50 bg-sindoor-deep' : 'border-sindoor/25 bg-paper/70',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === lang
        return (
          <button
            key={option.value}
            type="button"
            lang={option.value}
            aria-pressed={active}
            onClick={() => setLang(option.value)}
            className={cn(
              'cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zari',
              active && (light ? 'bg-zari-light text-sindoor-deep' : 'bg-sindoor text-paper'),
              !active && (light ? 'text-paper/80 hover:text-paper' : 'text-sindoor hover:bg-sindoor/10'),
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
