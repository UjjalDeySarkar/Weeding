import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useLang } from '@/i18n/context'

interface MusicPlayerProps {
  src: string
  /** Browsers block autoplay until the user interacts — start after "Open invitation". */
  start: boolean
}

export function MusicPlayer({ src, start }: MusicPlayerProps) {
  const { t } = useLang()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!start || !audio) return
    audio.volume = 0.5
    audio.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    )
  }, [start])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().then(() => setPlaying(true), () => {})
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="none" />
      {start && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? t.music.pause : t.music.play}
          className="fixed bottom-5 left-5 z-40 flex size-12 cursor-pointer items-center justify-center rounded-full bg-sindoor text-zari-light shadow-lg ring-2 ring-zari-light/60 transition-colors hover:bg-sindoor-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zari"
        >
          {playing ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </button>
      )}
    </>
  )
}
