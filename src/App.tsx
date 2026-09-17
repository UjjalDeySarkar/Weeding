import { useCallback, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { LalPaar } from '@/components/art/LalPaar'
import { Footer } from '@/components/layout/Footer'
import { MusicPlayer } from '@/components/layout/MusicPlayer'
import { GarlandNav } from '@/components/layout/GarlandNav'
import { wedding } from '@/config/wedding'
import { Countdown } from '@/sections/Countdown'
import { Cover } from '@/sections/Cover'
import { Events } from '@/sections/Events'
import { Gallery } from '@/sections/Gallery'
import { Hero } from '@/sections/Hero'
import { OurStory } from '@/sections/OurStory'
import { Ribbon } from '@/sections/Ribbon'
import { Venue } from '@/sections/Venue'

export default function App() {
  const [opened, setOpened] = useState(false)
  const handleOpen = useCallback(() => setOpened(true), [])

  return (
    <MotionConfig reducedMotion="user">
      <Cover open={!opened} onOpen={handleOpen} />
      <main>
        <Hero ready={opened} />
        <Ribbon />
        <Countdown />
        <LalPaar />
        <OurStory />
        <Events />
        <Gallery />
        <Venue />
      </main>
      <Footer />
      <GarlandNav />
      {wedding.music && <MusicPlayer src={wedding.music} start={opened} />}
    </MotionConfig>
  )
}
