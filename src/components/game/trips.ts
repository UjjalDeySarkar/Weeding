import { distanceKm } from '@/components/journey/geometry'
import { venueRoutes, type RouteData } from '@/components/map/routes'
import type { GameOrigin, Journey, JourneyIcon, L } from '@/config/types'
import { wedding } from '@/config/wedding'

export type Mode = JourneyIcon
export type Character = 'man' | 'woman'

/** One playthrough: from a city by one mode to its Siliguri hub, then by bike to the venue */
export interface Trip {
  origin: GameOrigin
  mode: Mode
  /** Where the first leg ends and the bike ride starts */
  hub: Journey
  /** Places passed on the first leg */
  via: L[]
  /** Real driving route from the hub to the venue */
  route: RouteData
}

const MODES: Mode[] = ['plane', 'train', 'bus']

export const origins: GameOrigin[] = wedding.game?.origins ?? []

const hubFor = (mode: Mode) => wedding.venue.journeys.find((j) => j.icon === mode)

/** Modes offered from a city: listed in its `via`, with a hub and a bike route at the Siliguri end */
export const modesFrom = (origin: GameOrigin) =>
  MODES.filter((mode) => {
    const hub = hubFor(mode)
    return origin.via[mode] && hub && venueRoutes[hub.id]
  })

/** Straight-line distance to the venue, in km */
export const kmFrom = (origin: GameOrigin) => Math.round(distanceKm(origin.coordinates, wedding.venue.coordinates))

export function makeTrip(origin: GameOrigin, mode: Mode): Trip {
  const hub = hubFor(mode)!
  return { origin, mode, hub, via: origin.via[mode] ?? [], route: venueRoutes[hub.id]! }
}
