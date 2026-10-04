// Regenerates src/components/journey/bengal-map.json — the outline of West Bengal, its neighbours and its main
// rivers for the journey map. Outlines: Natural Earth (public domain). Smaller rivers: OpenStreetMap via Overpass.
// Usage: npm run map   (downloads ~50 MB once; the output is ~40 KB)
import { writeFile } from 'node:fs/promises'

const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson'
const OVERPASS = 'https://overpass-api.de/api/interpreter'
// Everything the journey camera can see: [west, south, east, north]
const BOX = [84.6, 20.6, 91.4, 28.3]
const round = (n) => Math.round(n * 1000) / 1000

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

/** A closed ring starts and ends on the same point, so split it at its far side before simplifying */
function simplifyRing(ring, tolerance) {
  const [ax, ay] = ring[0]
  let far = 1
  ring.forEach(([x, y], i) => {
    if (Math.hypot(x - ax, y - ay) > Math.hypot(ring[far][0] - ax, ring[far][1] - ay)) far = i
  })
  return [...simplify(ring.slice(0, far + 1), tolerance).slice(0, -1), ...simplify(ring.slice(far), tolerance)]
}

const inBox = ([lng, lat]) => lng > BOX[0] && lng < BOX[2] && lat > BOX[1] && lat < BOX[3]
const roundAll = (points) => points.map(([lng, lat]) => [round(lng), round(lat)])
const clean = (points, tolerance) => roundAll(simplify(points, tolerance))
const cleanRing = (ring, tolerance) => roundAll(simplifyRing(ring, tolerance))
const rings = (geometry) =>
  geometry.type === 'Polygon' ? [geometry.coordinates[0]] : geometry.coordinates.map((polygon) => polygon[0])

async function getJson(url, init) {
  const response = await fetch(url, { ...init, headers: { 'User-Agent': 'wedding-invitation-site', ...init?.headers } })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.json()
}

// States and provinces: West Bengal in detail, everything around it coarser
console.log('Downloading Natural Earth states…')
const states = await getJson(`${NE}/ne_10m_admin_1_states_provinces.geojson`)
const westBengal = []
const land = []
for (const feature of states.features) {
  const isWestBengal = feature.properties.adm0_a3 === 'IND' && feature.properties.name === 'West Bengal'
  for (const ring of rings(feature.geometry)) {
    if (!ring.some(inBox)) continue
    if (isWestBengal) westBengal.push(cleanRing(ring, 0.005))
    else if (ring.length > 8) land.push(cleanRing(ring, 0.035))
  }
}

// Rivers: the Ganga system from Natural Earth, local rivers from OpenStreetMap
console.log('Downloading Natural Earth rivers…')
const neRivers = await getJson(`${NE}/ne_10m_rivers_lake_centerlines.geojson`)
const rivers = {}
const addLine = (name, line, tolerance) => {
  const inside = line.filter(inBox)
  if (inside.length < 2) return
  ;(rivers[name] ??= []).push(clean(inside, tolerance))
}
for (const feature of neRivers.features) {
  const name = { Ganges: 'ganga', Tista: 'teesta' }[feature.properties.name]
  if (!name) continue
  for (const line of feature.geometry.coordinates) addLine(name, line, 0.006)
}

console.log('Asking Overpass for local rivers…')
const query = `[out:json][timeout:90];way["waterway"="river"]["name"~"^(Damodar|Dwarakeshwar|Mahananda River|Mahananda|Rupnarayan)$"](${BOX[1]},${BOX[0]},${BOX[3]},${BOX[2]});out geom;`
let osm
// The public Overpass servers are often busy; try a mirror and wait between attempts
for (const [attempt, server] of [OVERPASS, 'https://overpass.kumi.systems/api/interpreter', OVERPASS].entries()) {
  try {
    osm = await getJson(server, { method: 'POST', body: new URLSearchParams({ data: query }) })
    break
  } catch (error) {
    if (attempt === 2) throw error
    console.log(`  ${error.message}, retrying…`)
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
}
for (const way of osm.elements) {
  const name = way.tags.name.replace(' River', '').toLowerCase()
  addLine(name, way.geometry.map(({ lon, lat }) => [lon, lat]), 0.006)
}

const json = JSON.stringify(
  {
    source: 'Natural Earth (public domain) · rivers © OpenStreetMap contributors',
    generatedAt: new Date().toISOString().slice(0, 10),
    westBengal,
    land,
    rivers,
  },
  null,
  0,
)
await writeFile(new URL('../src/components/journey/bengal-map.json', import.meta.url), `${json}\n`)
const count = (list) => list.reduce((n, line) => n + line.length, 0)
console.log(
  `Wrote bengal-map.json: West Bengal ${count(westBengal)} points, land ${count(land)}, rivers ${Object.entries(rivers)
    .map(([name, lines]) => `${name} ${count(lines)}`)
    .join(', ')} (${(json.length / 1024).toFixed(1)} KB)`,
)
