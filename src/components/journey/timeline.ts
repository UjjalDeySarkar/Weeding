import type { Point } from '@/lib/spline'
import type { JourneyCardId, StoryMotif } from '@/config/types'
import { wedding } from '@/config/wedding'
import { dist, distanceKm, ease, lerp, mix, project, route, smooth, span, toMap, via, type Route } from './geometry'
import map from './bengal-map.json'

/*
 * The whole story as a function of scroll progress p (0–1): where everyone is,
 * how they travel, what the camera frames and which card is showing.
 */

const { journey, venue } = wedding

export const PLACES = {
  groomHome: toMap(journey.groomHome.coordinates),
  brideHome: toMap(journey.brideHome.coordinates),
  city: toMap(journey.city.coordinates),
  venue: toMap(venue.coordinates),
}
const meetingSpot = toMap(journey.meeting.coordinates)
// While the venue is approximate, draw it a few kilometres from Ujjal's place so his bike ride shows
export const MEETING: Point = journey.meeting.approximate ? [meetingSpot[0] - 4, meetingSpot[1] - 3] : meetingSpot

/** Map units → kilometres on the ground, calibrated so the two homes are exactly as far apart as on Earth */
export const KM_PER_UNIT =
  distanceKm(journey.groomHome.coordinates, journey.brideHome.coordinates) / dist(PLACES.groomHome, PLACES.brideHome)

export const STAMPS = journey.explored.map((place) => ({ ...place, at: toMap(place.coordinates) }))
const stamp = (id: string) => STAMPS.find((s) => s.id === id)?.at ?? PLACES.city

// Main line Siliguri ↔ Kolkata: Malda, Farakka, Rampurhat, Bolpur, Bardhaman, Howrah
const MAIN_LINE: [number, number][] = [
  [88.3, 26.4],
  [88.2, 26.05],
  [88.12, 25.62],
  [88.14, 25.0],
  [87.92, 24.8],
  [87.78, 24.17],
  [87.68, 23.67],
  [87.86, 23.23],
  [88.2, 22.75],
]
// Into Kolkata from Bankura: Arambagh, Tarakeswar, Howrah
const WEST_LINE: [number, number][] = [
  [87.78, 22.88],
  [88.01, 22.89],
  [88.24, 22.66],
]
const ROAD: [number, number][] = [
  [88.25, 22.7],
  [88.01, 22.86],
  [87.78, 22.86],
]
const reverse = (stops: [number, number][]) => [...stops].reverse()

export const ROUTES = {
  toCity: via(PLACES.groomHome, MAIN_LINE, PLACES.city),
  herTrain: via(PLACES.brideHome, WEST_LINE, MEETING),
  hisBike: route([PLACES.city, [(PLACES.city[0] + MEETING[0]) / 2 - 1.5, (PLACES.city[1] + MEETING[1]) / 2 + 1.5], MEETING]),
  trainVisit: via(PLACES.city, reverse(WEST_LINE), PLACES.brideHome),
  road: via(PLACES.city, ROAD, PLACES.brideHome),
  tour: route([
    PLACES.city,
    stamp('eco-park'),
    stamp('biswa-bangla'),
    ...ROAD.map(([lng, lat]) => project(lng, lat)),
    stamp('kamarpukur'),
    stamp('joyrambati'),
    stamp('bishnupur'),
  ]),
  herWayHome: route([stamp('bishnupur'), mix(stamp('bishnupur'), PLACES.brideHome, 0.5), PLACES.brideHome]),
  hisWayHome: via(stamp('bishnupur'), reverse(ROAD), PLACES.city),
  north: via(PLACES.brideHome, reverse(MAIN_LINE).slice(1), PLACES.groomHome),
  toVenue: route([PLACES.groomHome, mix(PLACES.groomHome, PLACES.venue, 0.5), PLACES.venue]),
}
export const STAMP_AT = STAMPS.map((s) => ROUTES.tour.nearest(s.at))

/* ---------- chapters and cards ---------- */

export const CHAPTER_STARTS = [0, 0.14, 0.25, 0.39, 0.53, 0.67, 0.855, 0.925]

export interface CardSpec {
  id: JourneyCardId | 'proposal' | 'trip' | 'engagement' | 'wedding'
  a: number
  b: number
  /** Milestone cards take their text from the story moment with this motif */
  motif?: StoryMotif
  level?: number
}

export const CARDS: CardSpec[] = [
  { id: 'start', a: 0, b: 0.028 },
  { id: 'groomHome', a: 0.046, b: 0.07 },
  { id: 'brideHome', a: 0.09, b: 0.113 },
  { id: 'apart', a: 0.118, b: 0.142 },
  { id: 'city', a: 0.17, b: 0.247 },
  { id: 'meeting', a: 0.32, b: 0.387, motif: 'birds' },
  { id: 'distance', a: 0.4, b: 0.527 },
  { id: 'explored', a: 0.536, b: 0.667 },
  { id: 'proposal', a: 0.675, b: 0.71, motif: 'ring', level: 1 },
  { id: 'trip', a: 0.714, b: 0.745, motif: 'boat', level: 2 },
  { id: 'families', a: 0.749, b: 0.812, motif: 'homes', level: 3 },
  { id: 'engagement', a: 0.816, b: 0.852, motif: 'rings', level: 4 },
  { id: 'destination', a: 0.866, b: 0.918 },
  { id: 'wedding', a: 0.94, b: 1, motif: 'crowns' },
]

/** Level badges: where they pop and which story moment they stand for */
export const LEVELS = [
  { at: 0.68, motif: 'ring' as StoryMotif },
  { at: 0.718, motif: 'boat' as StoryMotif },
  { at: 0.802, motif: 'homes' as StoryMotif },
  { at: 0.822, motif: 'rings' as StoryMotif },
]

/** Forward-only celebrations */
export const BURSTS = { meeting: 0.316, celebration: 0.802, wedding: 0.95 }

/* ---------- travellers ---------- */

export type Mode = 'walk' | 'bike' | 'train' | 'car' | 'together' | 'hidden'

interface Leg {
  a: number
  b: number
  route: Route
  from?: number
  to?: number
  mode: Mode
}

export interface Place {
  pos: Point
  mode: Mode
  /** The leg being travelled, and how far along it */
  leg?: Leg
  t?: number
}

function locate(start: Point, legs: Leg[], p: number, rest: Mode = 'walk'): Place {
  let place: Place = { pos: start, mode: rest }
  for (const leg of legs) {
    if (p < leg.a) break
    const t = lerp(leg.from ?? 0, leg.to ?? 1, ease(span(p, leg.a, leg.b)))
    if (p <= leg.b) return { pos: leg.route.at(t), mode: leg.mode, leg, t }
    place = { pos: leg.route.at(t), mode: rest }
  }
  return place
}

const GROOM: Leg[] = [
  { a: 0.15, b: 0.226, route: ROUTES.toCity, mode: 'train' },
  { a: 0.27, b: 0.315, route: ROUTES.hisBike, mode: 'bike' },
  { a: 0.396, b: 0.42, route: ROUTES.hisBike, from: 1, to: 0, mode: 'bike' },
  { a: 0.43, b: 0.455, route: ROUTES.trainVisit, mode: 'train' },
  { a: 0.461, b: 0.478, route: ROUTES.trainVisit, from: 1, to: 0, mode: 'train' },
  { a: 0.486, b: 0.506, route: ROUTES.road, mode: 'bike' },
  { a: 0.511, b: 0.527, route: ROUTES.road, from: 1, to: 0, mode: 'bike' },
  { a: 0.553, b: 0.64, route: ROUTES.tour, mode: 'walk' },
  { a: 0.645, b: 0.667, route: ROUTES.hisWayHome, mode: 'bike' },
  { a: 0.776, b: 0.8, route: ROUTES.road, mode: 'car' },
  { a: 0.866, b: 0.918, route: ROUTES.north, mode: 'together' },
  { a: 0.926, b: 0.946, route: ROUTES.toVenue, mode: 'walk' },
]

const BRIDE: Leg[] = [
  { a: 0.255, b: 0.315, route: ROUTES.herTrain, mode: 'train' },
  { a: 0.396, b: 0.426, route: ROUTES.herTrain, from: 1, to: 0, mode: 'train' },
  { a: 0.53, b: 0.551, route: ROUTES.trainVisit, from: 1, to: 0, mode: 'train' },
  { a: 0.553, b: 0.64, route: ROUTES.tour, mode: 'walk' },
  { a: 0.645, b: 0.667, route: ROUTES.herWayHome, mode: 'walk' },
  { a: 0.866, b: 0.918, route: ROUTES.north, mode: 'hidden' },
  { a: 0.926, b: 0.946, route: ROUTES.toVenue, mode: 'walk' },
]

const PARENTS: Leg[] = [
  { a: 0.746, b: 0.772, route: ROUTES.toCity, mode: 'walk' },
  { a: 0.776, b: 0.8, route: ROUTES.road, mode: 'hidden' },
]

export function travellers(p: number) {
  const parents = locate(PLACES.groomHome, PARENTS, p)
  const parentsShown = (p >= 0.74 && p < 0.776) || (p > 0.8 && p < 0.855)
  return {
    groom: locate(PLACES.groomHome, GROOM, p),
    bride: locate(PLACES.brideHome, BRIDE, p),
    parents: { ...parents, mode: parentsShown ? parents.mode : ('hidden' as Mode) },
  }
}

/* ---------- camera ---------- */

/** What the camera should show: a box of map kilometres */
export interface Shot {
  cx: number
  cy: number
  w: number
  h: number
}

export function fit(points: Point[], min: number): Shot {
  const xs = points.map((q) => q[0])
  const ys = points.map((q) => q[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  return {
    cx: (x0 + x1) / 2,
    cy: (y0 + y1) / 2,
    w: Math.max((x1 - x0) * 1.25 + 30, min * 0.7),
    h: Math.max((y1 - y0) * 1.25 + 30, min),
  }
}
const blend = (a: Shot, b: Shot, t: number): Shot => ({
  cx: lerp(a.cx, b.cx, t),
  cy: lerp(a.cy, b.cy, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
})
const near = (point: Point, h: number): Shot => ({ cx: point[0], cy: point[1] - h * 0.08, w: h * 0.8, h })

const allLand = map.westBengal.flat().map(([lng, lat]) => project(lng, lat))
const FULL = fit([...allLand, [0, -40]], 0)
const HOMES = fit([PLACES.groomHome, PLACES.brideHome, PLACES.city], 0)
const REGION = fit([PLACES.city, PLACES.brideHome, MEETING], 160)

export function camera(p: number, groom: Point, bride: Point, parents: Point, tourT: number): Shot {
  if (p < 0.025) return FULL
  if (p < 0.045) return blend(FULL, near(PLACES.groomHome, 150), ease(span(p, 0.025, 0.045)))
  if (p < 0.07) return near(PLACES.groomHome, 150)
  if (p < 0.088) {
    const t = ease(span(p, 0.07, 0.088))
    const shot = blend(near(PLACES.groomHome, 150), near(PLACES.brideHome, 150), t)
    shot.h += Math.sin(Math.PI * t) * 280
    return shot
  }
  if (p < 0.113) return near(PLACES.brideHome, 150)
  if (p < 0.15) return blend(near(PLACES.brideHome, 150), HOMES, ease(span(p, 0.113, 0.135)))
  if (p < 0.25) return fit([groom, PLACES.brideHome, PLACES.city, MEETING], 160)
  if (p < 0.315) return blend(REGION, fit([groom, bride, MEETING], 36), smooth(span(p, 0.25, 0.27)))
  if (p < 0.39) return fit([MEETING], 36)
  if (p < 0.43) return fit([groom, bride], 36)
  if (p < 0.53) return REGION
  if (p < 0.553) return blend(REGION, fit([groom, bride], 30), smooth(span(p, 0.53, 0.553)))
  if (p < 0.64) return fit([groom, bride], lerp(30, 80, smooth(span(tourT, STAMP_AT[1] + 0.01, STAMP_AT[1] + 0.12))))
  if (p < 0.67) return blend(fit([groom, bride], 80), REGION, smooth(span(p, 0.64, 0.667)))
  if (p < 0.745) return REGION
  if (p < 0.776) return blend(REGION, fit([parents, PLACES.city], 160), smooth(span(p, 0.745, 0.756)))
  if (p < 0.815) return REGION
  if (p < 0.858) return blend(REGION, fit([groom, bride], 60), smooth(span(p, 0.815, 0.83)))
  if (p < 0.92) return blend(fit([groom, bride], 60), near(groom, 230), smooth(span(p, 0.858, 0.872)))
  return blend(near(PLACES.groomHome, 230), near(PLACES.venue, 44), ease(span(p, 0.92, 0.946)))
}
