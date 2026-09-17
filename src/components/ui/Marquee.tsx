import { Fragment } from 'react'
import { cn } from '@/lib/utils'

/** Endless scrolling ribbon. Decorative — the same details appear elsewhere on the page. */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const repeated = [...items, ...items, ...items]
  const row = (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {repeated.map((item, i) => (
        <Fragment key={i}>
          <span className="whitespace-nowrap">{item}</span>
          <span className="text-zari-light">✦</span>
        </Fragment>
      ))}
    </div>
  )

  return (
    <div className={cn('overflow-hidden', className)} aria-hidden="true">
      <div className="flex w-max animate-marquee">
        {row}
        {row}
      </div>
    </div>
  )
}
