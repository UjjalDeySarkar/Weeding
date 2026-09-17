import { useEffect, useState } from 'react'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function useCountdown(targetIso: string) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), SECOND)
    return () => clearInterval(id)
  }, [])

  const diff = Math.max(0, new Date(targetIso).getTime() - now)

  return {
    days: Math.floor(diff / DAY),
    hours: Math.floor(diff / HOUR) % 24,
    minutes: Math.floor(diff / MINUTE) % 60,
    seconds: Math.floor(diff / SECOND) % 60,
    isPast: diff === 0,
  }
}
