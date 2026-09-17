export type Lang = 'en' | 'bn'

/** Text in both languages */
export type L = Record<Lang, string>

export type EventIcon = 'blessing' | 'turmeric' | 'heart' | 'feast' | 'music' | 'party' | 'sparkles'

/** Card colour: dhaan (rice), haldi (turmeric), sindoor (vermilion), kolapata (banana leaf) */
export type EventTheme = 'dhaan' | 'haldi' | 'sindoor' | 'kolapata'

export interface Parents {
  relation: 'son' | 'daughter'
  /** English, e.g. "Mr. Uttam Dey Sarkar" */
  father: string
  mother: string
  /** Full Bengali line, e.g. "শ্রী … ও শ্রীমতী …-এর পুত্র" — written out so the grammar reads naturally */
  bn: string
}

export interface Person {
  firstName: L
  fullName: L
  parents?: Parents
  photo?: string
}

/** Painted scene on the story scroll */
export type StoryMotif = 'birds' | 'ring' | 'boat' | 'homes' | 'rings' | 'crowns'

export interface StoryMoment {
  year: string
  title: L
  text: L
  motif: StoryMotif
}

export interface WeddingEvent {
  id: string
  name: L
  icon: EventIcon
  theme: EventTheme
  /** ISO 8601 with offset, e.g. 2027-02-12T18:00:00+05:30 */
  start: string
  end: string
  venue: L
  address: L
  dressCode?: L
  description?: L
  /** Held at the main venue — directions use its exact coordinates */
  atVenue?: boolean
}

export interface LatLng {
  lat: number
  lng: number
}

export type JourneyIcon = 'plane' | 'train' | 'bus'

/** A travel hub guests arrive at; its driving route to the venue is drawn on the map */
export interface Journey {
  id: string
  icon: JourneyIcon
  name: L
  /** Label on the map */
  short: L
  coordinates: LatLng
  /** Where the map label sits relative to the marker */
  labelSide: 'left' | 'right' | 'bottom'
}

/** Required for Creative Commons photos (e.g. from Wikimedia Commons) */
export interface PhotoCredit {
  author: string
  license: string
  licenseUrl: string
  /** Where the original lives */
  source: string
}

export interface GalleryImage {
  /** Path under /public, e.g. /images/gallery/01.jpg. Omit to show a placeholder tile. */
  src?: string
  alt: L
  /** CSS object-position for the arch crop, e.g. 'center 30%' */
  position?: string
  credit?: PhotoCredit
}

export interface WeddingConfig {
  /** Language shown on first visit. Guests can switch; links with ?lang=bn open in Bengali. */
  defaultLang: Lang
  /** Listed first everywhere */
  groom: Person
  bride: Person
  hashtag?: string
  /** Who is inviting — shown on the cover */
  hosts?: {
    names: L[]
    /** e.g. "invite you to the wedding of their children" */
    message: L
  }
  /** Main ceremony start — drives the countdown. */
  date: string
  timeZone: string
  city: L
  heroImage?: string
  /** Traditional Bengali lines, shown only in the Bengali version. Remove a line to hide it. */
  bengali?: {
    /** Traditional opening line of a Bengali wedding card */
    invocation?: string
    /** e.g. শুভ বিবাহ */
    greeting?: string
    /** Formal invitation line under the intro */
    invitation?: string
    /** Bangla calendar date, e.g. '১৫ মাঘ ১৪৩৩' (confirm with your purohit / panjika) */
    banglaDate?: string
  }
  intro: L
  story: StoryMoment[]
  events: WeddingEvent[]
  venue: {
    name: L
    /** Label on the map pin */
    shortName: L
    address: L
    coordinates: LatLng
    parking?: boolean
    notes?: L
    journeys: Journey[]
  }
  gallery: GalleryImage[]
  /** Background music, e.g. /audio/song.mp3 (file in public/audio). Starts when the invitation is opened. */
  music?: string
}
