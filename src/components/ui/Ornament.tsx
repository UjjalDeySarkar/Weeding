import { cn } from '@/lib/utils'

/** Lotus divider (পদ্ম) */
export function Ornament({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 text-zari', className)} aria-hidden="true">
      <span className="h-px w-14 bg-linear-to-r from-transparent to-current" />
      <svg width="34" height="22" viewBox="0 0 34 22" fill="none" stroke="currentColor" strokeWidth="1.1">
        <path d="M17 2 C 21 7 21 13 17 19 C 13 13 13 7 17 2Z" fill="currentColor" fillOpacity="0.3" />
        <path d="M17 19 C 12 17 8 12 7 6 C 12 7 15 11 17 19Z" />
        <path d="M17 19 C 22 17 26 12 27 6 C 22 7 19 11 17 19Z" />
        <path d="M17 19 C 11 20 5 18 1 13 C 7 12 13 14 17 19Z" />
        <path d="M17 19 C 23 20 29 18 33 13 C 27 12 21 14 17 19Z" />
      </svg>
      <span className="h-px w-14 bg-linear-to-l from-transparent to-current" />
    </div>
  )
}
