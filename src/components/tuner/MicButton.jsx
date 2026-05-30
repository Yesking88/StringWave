import { motion } from 'framer-motion'
import { Mic, MicOff, AlertTriangle, Loader } from 'lucide-react'

/**
 * MicButton — the main start/stop control.
 * Handles all four states: idle, requesting, active, error.
 */
export default function MicButton({ state, onStart, onStop }) {
  const isActive     = state === 'active'
  const isRequesting = state === 'requesting'
  const isError      = state === 'error'

  const handleClick = () => {
    if (isActive)     return onStop()
    if (!isRequesting) return onStart()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Button */}
      <motion.button
        id="tuner-mic-button"
        onClick={handleClick}
        disabled={isRequesting}
        whileHover={isRequesting ? {} : { scale: 1.06 }}
        whileTap={isRequesting ? {}  : { scale: 0.94 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex items-center justify-center w-20 h-20 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF007A]"
        style={{
          background: isActive
            ? 'var(--gradient-cta)'
            : isError
            ? 'linear-gradient(135deg, #7f1d1d, #450a0a)'
            : 'rgba(255,255,255,0.05)',
          border: isActive
            ? 'none'
            : isError
            ? '1px solid rgba(248,113,113,0.3)'
            : '1px solid rgba(255,255,255,0.08)',
          boxShadow: isActive
            ? '0 0 40px rgba(255,0,122,0.45), 0 0 80px rgba(255,0,122,0.15)'
            : 'none',
          cursor: isRequesting ? 'not-allowed' : 'pointer',
        }}
        aria-label={isActive ? 'Stop tuner' : 'Start tuner'}
      >
        {/* Ripple animation when active */}
        {isActive && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ border: '1px solid rgba(255,0,122,0.5)' }}
              animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ border: '1px solid rgba(255,0,122,0.3)' }}
              animate={{ scale: [1, 2], opacity: [0.4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            />
          </>
        )}

        {/* Icon */}
        {isRequesting ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <Loader size={26} className="text-slate-400" />
          </motion.div>
        ) : isError ? (
          <AlertTriangle size={26} className="text-red-400" />
        ) : isActive ? (
          <MicOff size={26} className="text-white" />
        ) : (
          <Mic size={26} className="text-slate-400" />
        )}
      </motion.button>

      {/* Label */}
      <span
        className="text-xs font-medium"
        style={{ color: isActive ? '#FF007A' : isError ? '#f87171' : '#475569' }}
      >
        {isRequesting ? 'Requesting mic…'
          : isActive   ? 'Tap to stop'
          : isError    ? 'Mic error — tap to retry'
          : 'Tap to tune'}
      </span>
    </div>
  )
}
