# Ujjal & Rupsha — Wedding Invitation

A single-page, bilingual (English / বাংলা) wedding invitation built with **React 19 + TypeScript + Vite**,
styled with **Tailwind CSS v4** and animated with **Motion**.

## Design concept — "Lal Paar Shubho Drishti"

A Bengali folk-art storybook, inspired by 2026 stationery trends (arched tops, scalloped edges, wax seals,
heritage motifs) and scroll-driven storytelling on the web.

| Section | Idea |
| --- | --- |
| Navigation | No menu bar — a floating **wax seal** (bottom-right) whose stitched ring fills as you scroll; tap it to unroll a **garland** of section beads on a kantha thread, with the language toggle on top |
| Cover | **Shubho Drishti** — the couple's names hide behind two paan (betel) leaves; tapping the wax seal parts them |
| Hero | The names painted on an upside-down **biyer kulo** (bamboo winnowing tray) under a swaying marigold-and-red-rose **toran**: rounded end on top with a pair of fish, cane-bound rim, woven body, an interlaced knot border and the crossbar at the bottom, with a **gatchhora** knot joining the couple's initials. Two butterflies fly in and settle on the names |
| Ribbon | Scrolling marquee of names, date and city |
| Countdown | **Shakha-pola** bangles (conch-white and coral-red) |
| Our Story | Arch portraits, and a Bengal **patachitra** scroll that unrolls on its wooden rollers as you scroll — one hand-painted panel per chapter (`motif` on each story moment) |
| Celebrations | Ceremony cards that stack as you scroll, coloured by ritual: dhaan, haldi, sindoor, kolapata (banana leaf) |
| Gallery | Arch-framed photo strip |
| Venue | Vintage postcard (address, parking, copy/directions) beside an **illustrated route map** drawn from real OpenStreetMap driving routes — Bagdogra Airport, NJP station and the bus terminus stitched to the venue, under the Himalayas — which flips to a **live 3D satellite globe** that spins towards India and flies down to the venue |
| Footer | Scalloped edge, alpona, and a closing blessing |

Palette: rice-paper white, sindoor red, zari gold, marigold, haldi, durba green. A paper-grain texture sits over everything.

## Quick start

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the build locally
npm run lint      # oxlint
npm run routes    # re-fetch the driving routes drawn on the venue map
```

## Personalise it

Nearly everything lives in **`src/config/wedding.ts`**: names, parents, hosts, date, story, events, venue,
gallery and music. Text fields take both languages: `{ en: '…', bn: '…' }`.

| What | Where |
| --- | --- |
| Couple, parents, events, venue | `src/config/wedding.ts` |
| Venue pin & travel hubs | `venue.coordinates` / `venue.journeys` — then run `npm run routes` |
| Event card colour | `theme: 'dhaan' \| 'haldi' \| 'sindoor' \| 'kolapata'` on each event |
| Interface text (buttons, labels) | `src/i18n/strings.ts` |
| Default language | `defaultLang` in `src/config/wedding.ts` |
| Colours & fonts | `@theme` block in `src/index.css` (fonts loaded in `index.html`) |
| Share preview (WhatsApp / social) | `<title>` and `og:*` tags in `index.html` |
| Hero photo (shown inside the arch) | `public/images/hero.jpg` → `heroImage: '/images/hero.jpg'` |
| Couple photos (Our Story arches) | `public/images/couple/*` → `photo: '/images/couple/ujjal.jpg'` on `groom` / `bride` (3:4 portrait, face in the upper half) |
| Gallery | `public/images/gallery/*` → `{ src, alt: { en, bn } }` entries (the current photos are Creative Commons stock from Wikimedia Commons, credited on the page — replace them with your own) |
| Background music | Off by default. Uncomment `music: '/audio/shehnai.mp3'` for the bundled shehnai (re-render with `python3 scripts/make-shehnai.py`), or use your own: `public/audio/song.mp3` → `music: '/audio/song.mp3'` |

## Live map

The back of the venue card is a [MapLibre GL](https://maplibre.org/) satellite globe — no API keys:

- **Imagery:** [EOxCloudless 2024](https://cloudless.eox.at) (Sentinel-2, 10 m/pixel) — free for
  **non-commercial** use with visible attribution. Because of the 10 m resolution the flight lands at
  neighbourhood level (zoom ~14) rather than street level.
- **Roads & labels on top:** [OpenFreeMap](https://openfreemap.org/) vector tiles, restyled in
  `src/components/map/satelliteStyle.ts`.

MapLibre is loaded only when a guest flips the card, and falls back to a Google Maps embed on devices
without WebGL. The flight respects `prefers-reduced-motion`. Map labels stay in Latin script because
MapLibre can't shape Bengali yet.

## Languages (English / বাংলা)

The toggle in the navbar and on the cover switches the whole site; each version shows only its own language.
The traditional lines in `bengali` (শ্রী শ্রী প্রজাপতয়ে নমঃ, শুভ বিবাহ…) appear only in Bengali; the hashtag only in English.
The guest's choice is remembered, and links can pick the language:

- `https://your-site.com/?lang=bn&to=রাহুল%20ও%20পরিবার` — opens in Bengali, greeting the guest by name
- `https://your-site.com/?lang=en&to=Rahul%20%26%20Family` — opens in English

Dates, times and numbers are formatted per language (e.g. সন্ধ্যা ৬:০০).

## Project structure

```
src/
├── config/          # wedding.ts (your content), types.ts, venue-routes.json (generated)
├── i18n/            # UI strings (en/bn), language context + provider
├── components/
│   ├── art/         # Alpona, PaanLeaf, Toran, LalPaar, Kulo, PataArt, Butterflies (SVG illustrations)
│   ├── map/         # IllustratedMap, GlobeMap (lazy), satellite style, route data
│   ├── layout/      # GarlandNav, Footer, MusicPlayer
│   └── ui/          # Section, Reveal, Ornament, Marquee, LanguageToggle, Bn
├── sections/        # Cover, Hero, Ribbon, Countdown, OurStory, Events, Gallery, Venue
├── hooks/           # useCountdown
├── lib/             # date/number formatting, map projection, calendar & maps links, utils
├── App.tsx          # page composition — reorder/remove sections here
└── index.css        # theme tokens, textures (lal-paar, kantha, pata, scallop, stamp)
scripts/
└── fetch-venue-routes.mjs   # OSRM routes → src/config/venue-routes.json
```

All motion respects `prefers-reduced-motion`.

## Deploy

It's a static site, so any static host works. With Vercel:

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```
