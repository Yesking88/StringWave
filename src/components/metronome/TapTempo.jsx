import { useRef, useEffect } from 'react'
import { Disc } from 'lucide-react'

export default function TapTempo({ onBpmChange }) {
  const tapsRef = useRef([])
  const timeoutRef = useRef(null)

  // Clear taps after 2 seconds of inactivity
  const resetTaps = () => {
    tapsRef.current = []
  }

  const handleTap = () => {
    const now = Date.now()

    // Clear reset timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Append the new tap, holding at most 4 taps
    tapsRef.current = [...tapsRef.current, now].slice(-4)

    if (tapsRef.current.length >= 2) {
      // Calculate average interval between consecutive taps
      const intervals = []
      for (let i = 1; i < tapsRef.current.length; i++) {
        intervals.push(tapsRef.current[i] - tapsRef.current[i - 1])
      }

      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
      const computedBpm = Math.round(60000 / avgInterval)

      if (computedBpm >= 40 && computedBpm <= 240) {
        onBpmChange(computedBpm)
      }
    }

    // Set inactivity timeout for 2 seconds (2000ms)
    timeoutRef.current = setTimeout(resetTaps, 2000)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <button
      onClick={handleTap}
      className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.06] text-slate-300 hover:text-white transition-all text-xs font-bold active:scale-95 shrink-0"
    >
      <Disc size={13} className="animate-spin-slow" />
      Tap Tempo
    </button>
  )
}
