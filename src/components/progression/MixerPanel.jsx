/**
 * MixerPanel — Floating 4-channel instrument mixer
 *
 * Props:
 *   mix       { guitar, piano, bass, drums } — each: { enabled: bool, volume: 0-1 }
 *   onChange  (channel, patch) => void
 *   onClose   () => void
 */
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Guitar, Music2, Mic2, Drum } from 'lucide-react'

const CHANNELS = [
  { id: 'guitar', label: 'Guitar',  Icon: Guitar, color: '#FF007A' },
  { id: 'piano',  label: 'Piano',   Icon: Music2,  color: '#7B00FF' },
  { id: 'bass',   label: 'Bass',    Icon: Mic2,    color: '#FF7300' },
  { id: 'drums',  label: 'Drums',   Icon: Drum,    color: '#CC00AA' },
]

export default function MixerPanel({ mix, onChange, onClose }) {
  const panelRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.96, y: -6 }}
      animate={{ opacity: 1, scale: 1,    y: 0   }}
      exit={{    opacity: 0, scale: 0.96, y: -6   }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position        : 'absolute',
        top             : 'calc(100% + 8px)',
        right           : 0,
        zIndex          : 60,
        minWidth        : 260,
        background      : 'rgba(10, 10, 22, 0.97)',
        backdropFilter  : 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border          : '1px solid rgba(255,255,255,0.10)',
        borderRadius    : 20,
        boxShadow       : '0 0 48px rgba(255,0,122,0.15), 0 8px 32px rgba(0,0,0,0.6)',
        overflow        : 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display       : 'flex',
        alignItems    : 'center',
        justifyContent: 'space-between',
        padding       : '12px 16px 10px',
        borderBottom  : '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{
          fontSize    : 10,
          fontWeight  : 700,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color       : '#64748b',
          fontFamily  : 'Inter, sans-serif',
        }}>
          Instrument Mixer
        </span>
        <button
          onClick={onClose}
          style={{
            background : 'transparent',
            border     : 'none',
            cursor     : 'pointer',
            color      : '#475569',
            display    : 'flex',
            padding    : 2,
            borderRadius: 6,
            transition : 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.color = '#475569'}
        >
          <X size={14} />
        </button>
      </div>

      {/* Channel rows */}
      <div style={{ padding: '8px 0 12px' }}>
        {CHANNELS.map(({ id, label, Icon, color }) => {
          const ch      = mix[id] ?? { enabled: true, volume: 0.7 }
          const enabled = ch.enabled
          const volume  = ch.volume ?? 0.7

          return (
            <div
              key={id}
              style={{
                display      : 'flex',
                alignItems   : 'center',
                gap          : 12,
                padding      : '8px 16px',
                transition   : 'background 0.15s',
                opacity      : enabled ? 1 : 0.45,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Toggle */}
              <button
                onClick={() => onChange(id, { enabled: !enabled, volume })}
                style={{
                  width       : 32,
                  height      : 18,
                  borderRadius: 9,
                  border      : 'none',
                  cursor      : 'pointer',
                  position    : 'relative',
                  flexShrink  : 0,
                  transition  : 'background 0.2s',
                  background  : enabled
                    ? `linear-gradient(135deg, ${color}, ${color}bb)`
                    : 'rgba(255,255,255,0.08)',
                  boxShadow   : enabled ? `0 0 10px ${color}55` : 'none',
                }}
                aria-label={`Toggle ${label}`}
              >
                <span style={{
                  position  : 'absolute',
                  top       : 2,
                  left      : enabled ? 16 : 2,
                  width     : 14,
                  height    : 14,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.18s cubic-bezier(0.22,1,0.36,1)',
                  boxShadow : '0 1px 3px rgba(0,0,0,0.4)',
                }} />
              </button>

              {/* Icon + label */}
              <Icon size={13} style={{ color: enabled ? color : '#334155', flexShrink: 0, transition: 'color 0.2s' }} />
              <span style={{
                fontSize  : 12,
                fontWeight: 600,
                color     : enabled ? '#e2e8f0' : '#475569',
                minWidth  : 44,
                transition: 'color 0.2s',
                fontFamily: 'Inter, sans-serif',
              }}>
                {label}
              </span>

              {/* Volume slider */}
              <div style={{ flex: 1, position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
                {/* Track background */}
                <div style={{
                  position : 'absolute',
                  left     : 0,
                  right    : 0,
                  height   : 3,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.08)',
                  pointerEvents: 'none',
                }} />
                {/* Fill */}
                <div style={{
                  position : 'absolute',
                  left     : 0,
                  height   : 3,
                  borderRadius: 2,
                  width    : `${volume * 100}%`,
                  background: enabled
                    ? `linear-gradient(90deg, ${color}88, ${color})`
                    : 'rgba(255,255,255,0.15)',
                  pointerEvents: 'none',
                  transition: 'width 0.05s',
                }} />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={e => onChange(id, { enabled, volume: parseFloat(e.target.value) })}
                  disabled={!enabled}
                  style={{
                    width         : '100%',
                    height        : 20,
                    appearance    : 'none',
                    WebkitAppearance: 'none',
                    background    : 'transparent',
                    cursor        : enabled ? 'pointer' : 'default',
                    outline       : 'none',
                    position      : 'relative',
                    zIndex        : 1,
                  }}
                  aria-label={`${label} volume`}
                />
              </div>

              {/* Volume % label */}
              <span style={{
                fontSize   : 10,
                fontWeight : 600,
                color      : enabled ? color : '#334155',
                minWidth   : 28,
                textAlign  : 'right',
                fontFamily : 'Inter, sans-serif',
                tabularNums: true,
                transition : 'color 0.2s',
              }}>
                {Math.round(volume * 100)}
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
