import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { STANDARD_TUNING } from '../../utils/tunerUtils'
import { toggleReferenceTone, stopReferenceTone } from '../../utils/tonePlayer'

/**
 * StringSelector — shows the 6 guitar strings with note buttons.
 * Highlights the closest string to the detected pitch and allows
 * clicking a string to play its reference tone.
 */
export default function StringSelector({ closestString, activeTuning = STANDARD_TUNING }) {
  const [playingString, setPlayingString] = useState(null)

  // Stop reference tone if user starts plucking a string and pitch is detected
  useEffect(() => {
    if (closestString && playingString !== null) {
      stopReferenceTone()
      setPlayingString(null)
    }
  }, [closestString, playingString])

  // Cleanup reference tone when selector unmounts
  useEffect(() => {
    return () => {
      stopReferenceTone()
    }
  }, [])

  const handleStringClick = (s) => {
    const isPlaying = toggleReferenceTone(s.frequency, () => {
      setPlayingString(null)
    })
    
    if (isPlaying) {
      setPlayingString(s.string)
    } else {
      setPlayingString(null)
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-center mb-6 text-slate-500">
        Standard Tuning — Tap string to play reference pitch
      </p>

      {/* String grid — low E at left (string 6), high E at right (string 1) */}
      <div className="flex items-end justify-center gap-3 sm:gap-4 h-36">
        {activeTuning.map((s) => {
          const isMicActive = closestString?.string === s.string
          const isRefActive = playingString === s.string
          const isActive = isMicActive || isRefActive
          
          // String thickness visual: string 6 is thickest
          const thickness = Math.max(1.5, 4.5 - (s.string - 1) * 0.55)

          return (
            <motion.div
              key={s.string}
              className="flex flex-col items-center gap-2 cursor-pointer group"
              onClick={() => handleStringClick(s)}
              title={`Click to play String ${s.string}: ${s.note}${s.octave} (${s.frequency} Hz)`}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              
              {/* Vertical string line visual with plucking vibration */}
              <div className="relative flex flex-col items-center h-20 w-8 justify-end">
                
                {/* Active glow backing */}
                {isActive && (
                  <motion.div
                    layoutId="string-glow-line"
                    className="absolute bottom-0 w-3 rounded-full"
                    style={{
                      height: '80%',
                      background: isRefActive
                        ? 'linear-gradient(0deg, rgba(204,0,170,0.2), transparent)'
                        : 'linear-gradient(0deg, rgba(255,0,122,0.2), transparent)',
                      filter: 'blur(6px)',
                    }}
                  />
                )}

                {/* The vertical string line */}
                <motion.div
                  className="rounded-full origin-bottom"
                  style={{
                    width: `${thickness}px`,
                    height: '100%',
                    background: isRefActive
                      ? 'linear-gradient(180deg, #7B00FF, #CC00AA)'
                      : isMicActive
                      ? 'linear-gradient(180deg, #FF7300, #FF007A)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.12))',
                    boxShadow: isRefActive
                      ? '0 0 10px rgba(204,0,170,0.5)'
                      : isMicActive
                      ? '0 0 10px rgba(255,0,122,0.5)'
                      : 'none',
                    transition: 'background 0.3s, box-shadow 0.3s',
                  }}
                  // Vibration micro-animation
                  animate={
                    isActive
                      ? {
                          x: [-0.8, 0.8, -0.6, 0.6, -0.4, 0.4, 0],
                          skewX: [-1, 1, -0.8, 0.8, -0.5, 0.5, 0]
                        }
                      : { x: 0, skewX: 0 }
                  }
                  transition={
                    isActive
                      ? {
                          duration: 0.15,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }
                      : {}
                  }
                />
              </div>

              {/* Note button */}
              <div className="relative">
                {/* Visual ring on hover or active */}
                <div
                  className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    border: isRefActive
                      ? '1.5px solid rgba(204,0,170,0.3)'
                      : '1.5px solid rgba(255,0,122,0.25)',
                    background: isRefActive
                      ? 'rgba(204,0,170,0.05)'
                      : 'rgba(255,0,122,0.03)',
                    filter: 'blur(1px)',
                  }}
                />

                <div
                  className="w-10 h-10 rounded-xl flex flex-col items-center justify-center font-display font-bold text-xs select-none transition-all duration-300 relative z-10"
                  style={{
                    background: isRefActive
                      ? 'linear-gradient(135deg, #CC00AA, #7B00FF)'
                      : isMicActive
                      ? 'linear-gradient(135deg, #FF007A, #FF7300)'
                      : 'rgba(255,255,255,0.03)',
                    border: isRefActive
                      ? '1px solid rgba(204,0,170,0.4)'
                      : isMicActive
                      ? '1px solid rgba(255,0,122,0.4)'
                      : '1px solid rgba(255,255,255,0.06)',
                    color: isActive ? '#fff' : '#64748b',
                    boxShadow: isRefActive
                      ? '0 4px 16px rgba(204,0,170,0.3)'
                      : isMicActive
                      ? '0 4px 16px rgba(255,0,122,0.3)'
                      : 'none',
                  }}
                >
                  <span>{s.note}</span>
                  <span className="text-[8px] opacity-50 font-normal leading-tight -mt-0.5">{s.octave}</span>
                </div>
              </div>

              {/* String index label */}
              <span
                className="text-[9px] tabular-nums font-bold tracking-wider"
                style={{
                  color: isRefActive ? '#CC00AA' : isMicActive ? '#FF007A' : '#334155',
                  transition: 'color 0.3s',
                }}
              >
                {s.string}
              </span>

            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
