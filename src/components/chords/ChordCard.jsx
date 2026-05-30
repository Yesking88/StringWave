import { memo } from 'react'
import { motion } from 'framer-motion'
import { Heart, Play } from 'lucide-react'
import { playChordStrum } from '../../utils/tonePlayer'
import ChordDiagram from './ChordDiagram'

// ── Category colour map ───────────────────────────────────────────────────────
const CATEGORY_STYLE = {
  major:      { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', label: 'Major'     },
  minor:      { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Minor'     },
  dominant7:  { color: '#f472b6', bg: 'rgba(244,114,182,0.12)', label: '7th'       },
  maj7:       { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: 'Maj7'      },
  min7:       { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', label: 'Min7'      },
  sus:        { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  label: 'Sus'       },
  dim:        { color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  label: 'Dim'       },
  aug:        { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  label: 'Aug'       },
  other:      { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  label: 'Other'     },
}

function ChordCard({ chord, isFavorite, onToggleFavorite, onSelect, index = 0 }) {
  const cat = CATEGORY_STYLE[chord.category] ?? CATEGORY_STYLE.other

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: 12, scale: 0.96 }}
      transition={{
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
        delay: Math.min(index * 0.08, 0.4),
      }}
      whileHover={{ y: -4, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
      onClick={() => onSelect(chord)}
      style={{
        background : 'rgba(15, 15, 24, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border     : '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding    : '20px 16px 16px',
        position   : 'relative',
        cursor     : 'pointer',
      }}
      className="chord-card group"
    >
      {/* ── Play button ── */}
      <button
        onClick={(e) => {
          e.stopPropagation() // Prevent opening the modal
          playChordStrum(chord.frets)
        }}
        aria-label="Play chord audio preview"
        style={{
          position  : 'absolute',
          top       : 12,
          left      : 12,
          background: 'transparent',
          border    : 'none',
          cursor    : 'pointer',
          padding   : 4,
          borderRadius: 8,
          display   : 'flex',
          transition: 'transform 0.2s, color 0.2s',
          zIndex    : 10,
          color     : '#475569',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.2)'
          e.currentTarget.style.color = cat.color
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.color = '#475569'
        }}
      >
        <Play
          size={16}
          style={{
            fill      : 'currentColor',
          }}
        />
      </button>

      {/* ── Favorite button ── */}
      <button
        onClick={(e) => {
          e.stopPropagation() // Prevent opening the modal
          onToggleFavorite(chord.id)
        }}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        style={{
          position  : 'absolute',
          top       : 12,
          right     : 12,
          background: 'transparent',
          border    : 'none',
          cursor    : 'pointer',
          padding   : 4,
          borderRadius: 8,
          display   : 'flex',
          transition: 'transform 0.2s',
          zIndex    : 10,
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Heart
          size={16}
          style={{
            fill      : isFavorite ? '#f43f5e' : 'none',
            stroke    : isFavorite ? '#f43f5e' : '#475569',
            transition: 'all 0.2s',
          }}
        />
      </button>

      {/* ── Chord diagram ── */}
      <div style={{ maxWidth: 120, margin: '0 auto 14px' }}>
        <ChordDiagram chord={chord} />
      </div>

      {/* ── Chord name ── */}
      <div style={{ textAlign: 'center' }}>
        <span
          className="gradient-text text-lg sm:text-xl font-extrabold tracking-tight block mb-2"
          style={{
            fontFamily : 'Space Grotesk, sans-serif',
          }}
        >
          {chord.name}
        </span>

        {/* Category badge */}
        <span
          style={{
            display    : 'inline-block',
            padding    : '2px 10px',
            borderRadius: 99,
            fontSize   : '0.65rem',
            fontWeight : 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color      : cat.color,
            background : cat.bg,
            border     : `1px solid ${cat.color}25`,
          }}
        >
          {cat.label}
        </span>
      </div>

      {/* Hover glow overlay */}
      <div
        className="chord-card-glow"
        style={{
          position    : 'absolute',
          inset       : 0,
          borderRadius: 16,
          pointerEvents: 'none',
          background  : `radial-gradient(circle at 50% 90%, ${cat.color}12 0%, transparent 70%)`,
          opacity     : 0,
          transition  : 'opacity 0.3s',
          zIndex      : 1,
        }}
      />
    </motion.div>
  )
}

export default memo(ChordCard)
