import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BnProps {
  children: ReactNode
  className?: string
  /** Decorative Galada face instead of the text face */
  display?: boolean
}

/** Bengali-script text: sets lang for screen readers and the Bengali font. */
export function Bn({ children, className, display = false }: BnProps) {
  return (
    <span lang="bn" className={cn(display ? 'font-bengali-display' : 'font-bengali', className)}>
      {children}
    </span>
  )
}
