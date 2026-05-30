import { motion, AnimatePresence } from 'framer-motion'

const STATUS_CONFIG = {
  'in-tune': {
    label: 'In Tune',
    color: '#10b981', // emerald-500
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.2)',
    glow: '0 0 35px rgba(16, 185, 129, 0.45)',
  },
  'close': {
    label: 'Close',
    color: '#f59e0b', // amber-500
    bg: 'rgba(245, 158, 11, 0.06)',
    border: 'rgba(245, 158, 11, 0.15)',
    glow: '0 0 25px rgba(245, 158, 11, 0.25)',
  },
  'sharp': {
    label: 'Sharp',
    color: '#ef4444', // red-500
    bg: 'rgba(239, 68, 68, 0.06)',
    border: 'rgba(239, 68, 68, 0.15)',
    glow: '0 0 25px rgba(239, 68, 68, 0.25)',
  },
  'flat': {
    label: 'Flat',
    color: '#ef4444', // red-500
    bg: 'rgba(239, 68, 68, 0.06)',
    border: 'rgba(239, 68, 68, 0.15)',
    glow: '0 0 25px rgba(239, 68, 68, 0.25)',
  },
}

// Tick marks for arc: -50 to +50 cents (every 10 cents)
const ARC_TICKS = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50]

export default function NoteDisplay({ pitch, active }) {
  const status = pitch?.status ?? 'flat'
  const cents = active && status === 'in-tune' ? 0 : (pitch?.cents ?? 0)
  const cfg = active && pitch ? STATUS_CONFIG[status] : {
    color: '#475569', // slate-600
    glow: 'none',
    bg: 'rgba(255,255,255,0.02)',
    border: 'rgba(255,255,255,0.04)',
    label: 'Silent'
  }

  // Polar conversion helper for arc. Center of SVG is at x=140, y=140. Radius is 110.
  // Angle 0 degrees corresponds to straight UP (12 o'clock).
  const polarToXY = (angleDeg, radius = 110) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return {
      x: 140 + radius * Math.cos(rad),
      y: 140 + radius * Math.sin(rad),
    }
  }

  // Map cents offset [-50, +50] to arc angle range [-110°, +110°]
  const centsAngle = (cents / 50) * 110

  // Background track path details
  const startPt = polarToXY(-110)
  const endPt = polarToXY(110)
  const trackPath = `M ${startPt.x} ${startPt.y} A 110 110 0 0 1 ${endPt.x} ${endPt.y}`

  // Filled active arc path details
  const fillStartAngle = Math.min(0, centsAngle)
  const fillEndAngle = Math.max(0, centsAngle)
  const fillStartPt = polarToXY(fillStartAngle)
  const fillEndPt = polarToXY(fillEndAngle)
  const fillPath = active && pitch
    ? `M ${fillStartPt.x} ${fillStartPt.y} A 110 110 0 0 1 ${fillEndPt.x} ${fillEndPt.y}`
    : ''

  // Position of active sliding indicator dot
  const dotPos = polarToXY(centsAngle)

  return (
    <div className="flex flex-col items-center gap-6 w-full select-none">
      
      {/* ── Visual Arc + Note Container ── */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        
        {/* SVG Arc Gauge */}
        <svg
          viewBox="0 0 280 280"
          className="absolute inset-0 w-full h-full z-0 overflow-visible"
        >
          {/* Subtle drop shadow under the active parts */}
          <defs>
            <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Active Arc Fill */}
          {active && pitch && Math.abs(cents) > 0 && (
            <motion.path
              d={fillPath}
              fill="none"
              stroke={cfg.color}
              strokeWidth="5"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${cfg.color})` }}
              transition={{ type: 'spring', stiffness: 180, damping: 20 }}
            />
          )}

          {/* Ticks along the arc */}
          {ARC_TICKS.map((t) => {
            const angle = t * 2.2 // mapping -50..+50 to -110..+110 degrees
            const isCenter = t === 0
            const innerR = isCenter ? 102 : 106
            const outerR = isCenter ? 118 : 112
            
            const p1 = polarToXY(angle, innerR)
            const p2 = polarToXY(angle, outerR)

            return (
              <line
                key={t}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={
                  isCenter && active && status === 'in-tune'
                    ? '#10b981'
                    : isCenter
                    ? active ? 'rgba(255,255,255,0.2)' : 'transparent'
                    : 'rgba(255, 255, 255, 0.06)'
                }
                strokeWidth={isCenter ? '2' : '1'}
                strokeLinecap="round"
              />
            )
          })}

          {/* Glowing active indicator dot */}
          {active && pitch && (
            <motion.circle
              cx={dotPos.x}
              cy={dotPos.y}
              r="6"
              fill={cfg.color}
              animate={{ cx: dotPos.x, cy: dotPos.y }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              style={{ filter: `drop-shadow(0 0 8px ${cfg.color})` }}
            />
          )}
        </svg>

        {/* Note letter positioned absolute center inside the circular SVG arc */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pt-4">
          
          {/* Breathing ambient emerald glow backing when in-tune */}
          {active && status === 'in-tune' && (
            <motion.div
              className="absolute w-36 h-36 rounded-full bg-emerald-500/10 blur-2xl -z-10 pointer-events-none"
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.6, 0.95, 0.6]
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: 'easeInOut'
              }}
            />
          )}

          <motion.div
            key={pitch?.fullName ?? '__empty__'}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{
              opacity: 1,
              scale: active && status === 'in-tune' ? [1, 1.04, 1] : 1,
            }}
            transition={{
              opacity: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
              scale: active && status === 'in-tune'
                ? { repeat: Infinity, duration: 2, ease: 'easeInOut' }
                : { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
            }}
            className="text-center flex items-start justify-center animate-none"
          >
            {active && pitch ? (
              <>
                <span
                  className="font-display font-black leading-tight tracking-tighter"
                  style={{
                    fontSize: 'clamp(5.5rem, 16vw, 7.5rem)',
                    color: cfg.color,
                    textShadow: cfg.glow,
                    transition: 'color 0.3s ease, text-shadow 0.3s ease',
                  }}
                >
                  {pitch.note}
                </span>
                <span
                  className="font-display font-bold ml-1.5 align-super text-2xl sm:text-3xl"
                  style={{
                    color: 'rgba(255,255,255,0.25)',
                  }}
                >
                  {pitch.octave}
                </span>
              </>
            ) : null}
          </motion.div>

          {/* Small Status Badge beneath Note Letter */}
          <div className="h-8 mt-2 flex items-center">
            <AnimatePresence mode="wait">
              {active && pitch && (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border"
                  style={{
                    background: cfg.bg,
                    borderColor: cfg.border,
                    color: cfg.color,
                    boxShadow: active && status === 'in-tune' ? cfg.glow : 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  {cfg.label}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* ── Monospaced Numeric details (Hz / Cents) ── */}
      <div className="flex items-center gap-6 justify-center bg-white/[0.02] border border-white/[0.04] px-6 py-3 rounded-2xl backdrop-blur-sm mt-2 w-full max-w-sm">
        
        {/* Detected frequency */}
        <div className="flex flex-col items-center gap-0.5 flex-1">
          <span
            className="font-mono font-medium tracking-tight tabular-nums text-sm sm:text-base"
            style={{
              color: active && pitch ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
              textShadow: active && pitch ? '0 0 10px rgba(255, 255, 255, 0.45)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {active && pitch ? `${pitch.frequency.toFixed(1)} Hz` : '— Hz'}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest transition-colors duration-200"
            style={{ color: active && pitch ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.35)' }}>
            Detected
          </span>
        </div>

        <div className="w-px h-6 bg-white/5 shrink-0" />

        {/* Target Frequency */}
        <div className="flex flex-col items-center gap-0.5 flex-1">
          <span
            className="font-mono font-medium tracking-tight tabular-nums text-sm sm:text-base"
            style={{
              color: active && pitch ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
              textShadow: active && pitch ? '0 0 10px rgba(255, 255, 255, 0.45)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {active && pitch ? `${pitch.targetFrequency.toFixed(1)} Hz` : '— Hz'}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest transition-colors duration-200"
            style={{ color: active && pitch ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.35)' }}>
            Target
          </span>
        </div>

        <div className="w-px h-6 bg-white/5 shrink-0" />

        {/* Cents offset */}
        <div className="flex flex-col items-center gap-0.5 flex-1">
          <span
            className="font-mono font-semibold tracking-tight tabular-nums text-sm sm:text-base"
            style={{
              color: active && pitch ? cfg.color : 'rgba(255, 255, 255, 0.3)',
              textShadow: active && pitch ? `0 0 10px ${cfg.color}88` : 'none',
              transition: 'all 0.2s',
            }}
          >
            {active && pitch
              ? `${pitch.cents > 0 ? '+' : ''}${pitch.cents}¢`
              : '0¢'}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest transition-colors duration-200"
            style={{ color: active && pitch ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.35)' }}>
            Offset
          </span>
        </div>

      </div>

    </div>
  )
}

