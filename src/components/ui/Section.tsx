import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Ornament } from './Ornament'
import { Reveal } from './Reveal'

interface SectionProps {
  id: string
  title: string
  eyebrow?: string
  className?: string
  children: ReactNode
}

export function Section({ id, title, eyebrow, className, children }: SectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-4 px-6 py-20 sm:py-28', className)}>
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-12 text-center sm:mb-16">
          {eyebrow && (
            <p className="mb-3 text-xs font-medium tracking-[0.35em] text-zari uppercase bn:text-sm">{eyebrow}</p>
          )}
          <h2 className="font-display text-5xl font-medium text-sindoor sm:text-6xl">{title}</h2>
          <Ornament className="mt-5" />
        </Reveal>
        {children}
      </div>
    </section>
  )
}
