import { LoaderCircle } from 'lucide-react'

/** Placeholder while the globe map (and its library) loads */
export function MapLoading({ label }: { label: string }) {
  return (
    <div className="starfield absolute inset-0 grid place-items-center text-paper/80">
      <span className="flex items-center gap-2 text-sm">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        {label}
      </span>
    </div>
  )
}
