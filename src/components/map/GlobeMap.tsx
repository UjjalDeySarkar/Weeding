import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { ExternalLink, RotateCcw } from 'lucide-react'
import { Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import type { CameraOptions } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { wedding } from '@/config/wedding'
import { useLang } from '@/i18n/context'
import { mapsEmbedUrl, mapsSearchUrl } from '@/lib/links'
import { MapLoading } from './MapLoading'
import { toSatellite } from './satelliteStyle'

setWorkerUrl(workerUrl)

/** Free vector tiles for roads & labels (no key); imagery is layered in by toSatellite */
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

const { venue } = wedding
const target: [number, number] = [venue.coordinates.lng, venue.coordinates.lat]
// Satellite imagery is 10 m/pixel, so land at neighbourhood level rather than street level
const ARRIVAL: CameraOptions = { center: target, zoom: 14.3, pitch: 40, bearing: -15 }

/** Whole globe in view, turned towards the Arabian Sea so it can spin to India */
function spaceView(container: HTMLElement): CameraOptions {
  const size = Math.min(container.clientWidth, container.clientHeight) * 0.78
  // Globe diameter is ~163px at zoom 0 and doubles per zoom level
  return { center: [52, 14], zoom: Math.log2(size / 163), pitch: 0, bearing: 0 }
}

const PIN_SVG = `<svg viewBox="0 0 44 56" width="44" height="56" aria-hidden="true" style="filter:drop-shadow(0 6px 6px rgba(109,14,19,.45))">
  <path d="M22 55 C 22 55 3 34 3 21 A 19 19 0 0 1 41 21 C 41 34 22 55 22 55Z" fill="#a51c1c" stroke="#ebcb85" stroke-width="2"/>
  <circle cx="22" cy="21" r="12" fill="#fbf5ea"/>
  <path d="M22 27 C 15 22.5 15.5 16 19 16 C 20.6 16 21.5 17 22 18 C 22.5 17 23.4 16 25 16 C 28.5 16 29 22.5 22 27Z" fill="#a51c1c"/>
</svg>`

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/** Venue pin as a DOM element for the MapLibre marker; hidden until the camera lands */
function createPin(label: string) {
  const root = document.createElement('div')
  root.className = 'pointer-events-none'
  const body = document.createElement('div')
  body.className = 'flex flex-col items-center transition duration-700 ease-out'
  const tag = document.createElement('span')
  tag.className =
    'mb-1 rounded-full bg-sindoor px-3 py-1 text-xs font-medium whitespace-nowrap text-paper shadow-md ring-2 ring-zari-light/70'
  tag.textContent = label
  const pin = document.createElement('div')
  pin.innerHTML = PIN_SVG
  body.append(tag, pin)
  root.append(body)

  const hidden = ['opacity-0', '-translate-y-8']
  return {
    root,
    show: () => body.classList.remove(...hidden),
    hide: () => body.classList.add(...hidden),
  }
}

interface GlobeMapProps {
  /** The card is currently showing this map */
  active: boolean
  /** Changes every time the card is flipped to the map — replays the flight */
  flight: number
}

/** Live map that starts as a spinning globe and flies down to the venue */
export function GlobeMap({ active, flight }: GlobeMapProps) {
  const { lang, t, pick } = useLang()
  const reduceMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const pinRef = useRef<ReturnType<typeof createPin> | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(() => !hasWebGL())
  const [replay, setReplay] = useState(0)

  // Create the map once (the parent remounts this component when the language changes)
  useEffect(() => {
    const container = containerRef.current
    if (!container || failed) return

    let map: MapLibreMap
    try {
      map = new MapLibreMap({
        container,
        ...spaceView(container),
        attributionControl: { compact: true },
        cooperativeGestures: true,
        locale: t.venue.mapControls,
        maxPitch: 70,
      })
    } catch {
      // WebGL context couldn't be created — fall back to the Google embed
      queueMicrotask(() => setFailed(true))
      return
    }

    map.setStyle(STYLE_URL, { transformStyle: toSatellite })
    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right')
    map.on('style.load', () => {
      map.setProjection({ type: 'globe' })
      map.setSky({ 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 8, 0] })
      setReady(true)
    })

    const pin = createPin(pick(venue.shortName))
    pin.hide()
    new Marker({ element: pin.root, anchor: 'bottom' }).setLngLat(target).addTo(map)

    pinRef.current = pin
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- runs once; remounted per language

  // The flight: space → turn towards India → dive to the venue
  useEffect(() => {
    const map = mapRef.current
    const pin = pinRef.current
    const container = containerRef.current
    if (!map || !pin || !container || !ready || !active) return

    if (reduceMotion) {
      map.jumpTo(ARRIVAL)
      pin.show()
      return
    }

    let cancelled = false
    map.stop()
    pin.hide()
    map.jumpTo(spaceView(container))

    // Wait for the card to finish flipping first
    const timer = setTimeout(() => {
      map.easeTo({ center: [target[0], 20], zoom: map.getZoom() + 0.4, duration: 2600, essential: true })
      map.once('moveend', () => {
        if (cancelled) return
        map.flyTo({ ...ARRIVAL, duration: 7000, curve: 1.5, essential: true })
        map.once('moveend', () => {
          if (!cancelled) pin.show()
        })
      })
    }, 900)

    return () => {
      cancelled = true
      clearTimeout(timer)
      map.stop()
    }
  }, [active, flight, replay, ready, reduceMotion])

  if (failed) {
    return (
      <iframe
        title={t.venue.map(pick(venue.name))}
        src={mapsEmbedUrl(venue.coordinates, lang)}
        className="size-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    )
  }

  const chip =
    'inline-flex items-center gap-1.5 rounded-full bg-paper/90 px-3 py-1.5 text-xs font-medium text-ink shadow ring-1 ring-ink/10 transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-zari bn:text-sm'

  return (
    <div className="starfield relative size-full overflow-hidden">
      {/* maplibre-gl.css forces position: relative on the container, so size it via a wrapper */}
      <div className="absolute inset-0">
        <div ref={containerRef} className="size-full" />
      </div>
      {!ready && <MapLoading label={t.venue.loadingMap} />}

      {/* Top-left, clear of the zoom controls (top-right) and the map credit (bottom) */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-2">
        <a
          href={mapsSearchUrl(`${venue.coordinates.lat},${venue.coordinates.lng}`)}
          target="_blank"
          rel="noreferrer"
          className={chip}
        >
          <ExternalLink className="size-3.5" aria-hidden="true" />
          {t.venue.openInGoogle}
        </a>
        <button
          type="button"
          onClick={() => setReplay((n) => n + 1)}
          disabled={!ready}
          className={`${chip} cursor-pointer disabled:opacity-50`}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {t.venue.replay}
        </button>
      </div>
    </div>
  )
}
