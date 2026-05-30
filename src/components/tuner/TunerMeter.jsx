import { motion } from 'framer-motion'

const STATUS_COLORS = {
  'in-tune': '#10b981', // emerald
  'close':   '#f59e0b', // amber
  'sharp':   '#ef4444', // red
  'flat':    '#ef4444', // red
}

/**
 * TunerMeter — Horizontal precision spring-needle slider.
 * cents: -50 to +50, status: in-tune | close | sharp | flat
 */
export default function TunerMeter({ cents = 0, status = 'flat', active = false }) {
  // Lock needle to center (0 cents / 50%) when active and confidently in tune
  const displayCents = active && status === 'in-tune' ? 0 : cents
  const percentage = ((displayCents + 50) / 100) * 100
  const color = active ? STATUS_COLORS[status] : '#475569'

  // Precision ticks along the horizontal axis
  const TICKS = [0, 25, 50, 75, 100] // -50, -25, 0, +25, +50 cents

  return (
    <div className="w-full max-w-sm flex flex-col gap-2 pt-2 select-none">
      
      {/* Horizontal Slider Area */}
      <div className="relative h-10 flex items-center justify-center">
        
        {/* Outer track bar */}
        <div className="h-1.5 w-full bg-white/[0.03] border border-white/[0.04] rounded-full relative overflow-visible">
          
          {/* Subtle tick markers inside track */}
          {TICKS.map((t) => {
            const isCenter = t === 50
            return (
              <div
                key={t}
                className="absolute top-1/2 -translate-y-1/2 w-px rounded-full"
                style={{
                  left: `${t}%`,
                  height: isCenter ? '14px' : '6px',
                  background: isCenter
                    ? active && status === 'in-tune'
                      ? 'rgba(16, 185, 129, 0.4)'
                      : active ? 'rgba(255,255,255,0.18)' : 'transparent'
                    : 'rgba(255,255,255,0.06)',
                  zIndex: isCenter ? 10 : 1,
                  transform: `translate(-50%, -50%)`,
                }}
              />
            )}
          )}

          {/* Active Centered Target Indicator */}
          <motion.div
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full z-10"
            style={{
              background: active && status === 'in-tune' ? '#10b981' : 'rgba(255,255,255,0.12)',
              boxShadow: active && status === 'in-tune' ? '0 0 12px #10b981' : 'none',
              x: '-50%',
              y: '-50%',
            }}
            animate={
              active && status === 'in-tune'
                ? { scale: [1, 1.35, 1], opacity: [0.8, 1, 0.8] }
                : { scale: 1, opacity: 1 }
            }
            transition={
              active && status === 'in-tune'
                ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
                : {}
            }
          />

          {/* Spring-Animated Needle */}
          {active && (
            <motion.div
              className="absolute top-1/2 w-1 h-7 rounded-full z-20"
              animate={{
                left: `calc(${percentage}% - 2px)`,
                backgroundColor: color,
                boxShadow: active
                  ? status === 'in-tune'
                    ? '0 0 16px 2px #10b981'
                    : `0 0 12px ${color}`
                  : 'none',
                scaleY: active && status === 'in-tune' ? [1, 1.08, 1] : 1,
              }}
              transition={{
                left: { type: 'spring', stiffness: 220, damping: 24, restDelta: 0.05 },
                scaleY: active && status === 'in-tune'
                  ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
                  : { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
              }}
              style={{
                transform: 'translateY(-50%)',
              }}
            />
          )}

        </div>
      </div>

      {/* Label/Guide scale under the track */}
      <div className="flex items-center justify-between px-1 text-[10px] font-bold tracking-widest uppercase text-slate-600">
        <span className="flex items-center gap-1">
          <span style={{ color: active && cents < -5 ? '#ef4444' : 'inherit' }}>♭</span>
          <span>Flat</span>
        </span>
        <span
          className="font-mono text-xs tabular-nums font-semibold tracking-normal"
          style={{
            color: active && status === 'in-tune' ? '#10b981' : 'inherit',
            transition: 'color 0.3s',
          }}
        >
          {active ? (cents > 0 ? `+${cents}` : cents) : '0'}
        </span>
        <span className="flex items-center gap-1">
          <span>Sharp</span>
          <span style={{ color: active && cents > 5 ? '#ef4444' : 'inherit' }}>♯</span>
        </span>
      </div>

    </div>
  )
}

