import type { LatLng, Lang, WeddingEvent } from '@/config/types'

const toUtcStamp = (iso: string) =>
  new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** Location stays in English so Google can resolve it. */
export function googleCalendarUrl(event: WeddingEvent, title: string, lang: Lang) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toUtcStamp(event.start)}/${toUtcStamp(event.end)}`,
    location: eventLocation(event),
    details: event.description?.[lang] ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

export const eventLocation = (event: WeddingEvent) => `${event.venue.en}, ${event.address.en}`

export const mapsSearchUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

const latLng = ({ lat, lng }: LatLng) => `${lat},${lng}`

/** Driving directions to exact coordinates, optionally from a given start */
export function directionsUrl(to: LatLng, from?: LatLng) {
  const params = new URLSearchParams({ api: '1', destination: latLng(to), travelmode: 'driving' })
  if (from) params.set('origin', latLng(from))
  return `https://www.google.com/maps/dir/?${params}`
}

export const mapsEmbedUrl = (at: LatLng, lang: Lang) =>
  `https://www.google.com/maps?q=${latLng(at)}&z=16&hl=${lang}&output=embed`
