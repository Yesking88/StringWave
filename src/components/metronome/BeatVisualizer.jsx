import { motion } from 'framer-motion'

export default function BeatVisualizer({ bpm, isPlaying, currentBeat, beatsPerMeasure }) {
  const duration = (60 / bpm) * 0.3

  // Determine glow color: sunset pink for normal beats, emerald on beat 1
  const glowColor = currentBeat === 0 
    ? 'rgba(16,185,129,0.4)' // Emerald on beat 1
    : 'rgba(255,0,122,0.25)' // Sunset pink on other beats

  return (
    <div className="flex flex-col items-center gap-6 w-full mb-8 relative z-10">
      {/* Beat dots row */}
      <div className="flex items-center gap-4 py-2">
        {Array.from({ length: beatsPerMeasure }).map((_, idx) => {
          const isBeat1 = idx === 0
          const isActive = isPlaying && currentBeat === idx

          return (
            <div key={idx} className="relative flex items-center justify-center">
              <motion.div
                className={`rounded-full transition-all duration-150 ${
                  isBeat1 
                    ? 'h-6.5 w-6.5 border-2' 
                    : 'h-4.5 w-4.5 border border-white/20 bg-white/5'
                }`}
                style={
                  isActive
                    ? isBeat1
                      ? {
                          backgroundColor: '#CC00AA',
                          borderColor: '#CC00AA',
                          boxShadow: '0 0 22px rgba(204,0,170,0.75)',
                        }
                      : {
                          backgroundColor: '#FF007A',
                          borderColor: '#FF007A',
                          boxShadow: '0 0 16px rgba(255,0,122,0.65)',
                        }
                    : isBeat1
                    ? {
                        borderColor: 'rgba(255,0,122,0.5)',
                        backgroundColor: 'rgba(255,0,122,0.2)',
                      }
                    : {}
                }
                animate={isActive ? {
                  scale: [1, 1.25, 1],
                  opacity: [0.4, 1, 0.4]
                } : {
                  scale: 1,
                  opacity: isPlaying ? 0.45 : 0.7
                }}
                transition={{
                  duration: duration,
                  ease: 'easeInOut'
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Central BPM display with pulsing glow */}
      <div className="relative flex flex-col items-center justify-center my-2">
        {/* Pulsing radial glow behind the BPM */}
        <motion.div
          className="absolute w-56 h-56 rounded-full pointer-events-none z-0"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            filter: 'blur(32px)',
          }}
          animate={isPlaying ? {
            scale: [0.85, 1.12, 0.85],
            opacity: [0.45, 0.9, 0.45]
          } : {
            scale: 0.9,
            opacity: 0.25
          }}
          transition={{
            duration: 60 / bpm,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          key={`${isPlaying}-${currentBeat === 0}`}
        />

        <div className="relative z-10 text-center select-none">
          <motion.div
            className="font-display font-black text-white tracking-tight leading-tight"
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(4.5rem, 10vw, 7.5rem)',
            }}
            animate={isPlaying ? {
              scale: currentBeat === 0 ? [1, 1.04, 1] : [1, 1.01, 1]
            } : { scale: 1 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {bpm}
          </motion.div>
          <div className="text-[10px] font-bold tracking-[0.35em] uppercase text-slate-500 mt-2">
            Beats Per Minute
          </div>
        </div>
      </div>
    </div>
  )
}
