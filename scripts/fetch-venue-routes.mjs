// Regenerates src/config/venue-routes.json — real driving routes from each travel hub
// in wedding.ts to the venue, via the public OSRM server (map data © OpenStreetMap contributors).
// Usage: npm run routes   (Node 24+, which can import the .ts config directly)
import { writeFile } from 'node:fs/promises'
import { wedding } from '../src/config/wedding.ts'

const OSRM = 'https://router.project-osrm.org/route/v1/driving'
const TOLERANCE = 0.0001 // ≈ 10 m — keeps the drawn path smooth but small
const round = (n) => Math.round(n * 1e5) / 1e5

/** Douglas–Peucker line simplification on [lng, lat] points */
function simplify(points, tolerance) {
  if (points.length < 3) return points
  const [ax, ay] = points[0]
  const [bx, by] = points.at(-1)
  const dx = bx - ax
  const dy = by - ay
  const length = Math.hypot(dx, dy) || 1
  let maxDistance = 0
  let index = 0
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i]
    const distance = Math.abs(dy * px - dx * py + bx * ay - by * ax) / length
    if (distance > maxDistance) {
      maxDistance = distance
      index = i
    }
  }
  if (maxDistance <= tolerance) return [points[0], points.at(-1)]
  return [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)]
}

const { venue } = wedding
const routes = {}

for (const journey of venue.journeys) {
  const from = journey.coordinates
  const to = venue.coordinates
  const url = `${OSRM}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
  const response = await fetch(url, { headers: { 'User-Agent': 'wedding-invitation-site' } })
  if (!response.ok) throw new Error(`OSRM returned ${response.status} for "${journey.id}"`)

  const [route] = (await response.json()).routes
  const path = simplify(route.geometry.coordinates, TOLERANCE).map(([lng, lat]) => [round(lat), round(lng)])
  routes[journey.id] = {
    distanceKm: Math.round(route.distance / 100) / 10,
    durationMin: Math.round(route.duration / 60),
    path,
  }
  console.log(`${journey.id}: ${routes[journey.id].distanceKm} km, ${routes[journey.id].durationMin} min, ${path.length} points`)
}

const json = JSON.stringify(
  { source: 'OSRM · © OpenStreetMap contributors', generatedAt: new Date().toISOString().slice(0, 10), routes },
  null,
  2,
).replace(/\[\s+(-?[\d.]+),\s+(-?[\d.]+)\s+\]/g, '[$1, $2]')

await writeFile(new URL('../src/config/venue-routes.json', import.meta.url), `${json}\n`)
console.log('Wrote src/config/venue-routes.json')
