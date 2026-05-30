import { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Music2 } from 'lucide-react'
import { GENRE_META, DIFFICULTY_META } from '../../data/songs'

function SongCard({ song, onSearch, index = 0 }) {
  const [launched, setLaunched] = useState(false)

  const genre      = GENRE_META[song.genre]      ?? GENRE_META['Rock']
  const difficulty = DIFFICULTY_META[song.difficulty] ?? DIFFICULTY_META['Beginner']

  function handleClick() {
    onSearch(song)
    setLaunched(true)
    setTimeout(() => setLaunched(false), 1800)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{   opacity: 0, y: 12, scale: 0.97 }}
      transition={{
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
        delay: Math.min(index * 0.08, 0.4),
      }}
      whileHover={{ y: -5, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
      style={{
        background   : 'rgba(15, 15, 24, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border       : `1px solid rgba(255, 255, 255, 0.05)`,
        borderTop    : `3px solid ${genre.color}`,
        borderRadius : 16,
        overflow     : 'hidden',
        display      : 'flex',
        flexDirection: 'column',
        cursor       : 'default',
        transition   : 'border-color 0.25s, box-shadow 0.25s',
      }}
      className="song-card"
    >
      {/* ── Card body ── */}
      <div style={{ padding: '18px 18px 14px', flex: 1 }}>

        {/* Badges row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {/* Genre */}
          <span style={{
            display      : 'inline-flex',
            alignItems   : 'center',
            padding      : '2px 9px',
            borderRadius : 99,
            fontSize     : '0.67rem',
            fontWeight   : 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            lineHeight   : '1.4',
            color        : genre.color,
            background   : genre.bg,
            border       : `1px solid ${genre.border}`,
          }}>
            {song.genre}
          </span>
          {/* Difficulty */}
          <span style={{
            display      : 'inline-flex',
            alignItems   : 'center',
            padding      : '2px 9px',
            borderRadius : 99,
            fontSize     : '0.67rem',
            fontWeight   : 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            lineHeight   : '1.4',
            color        : difficulty.color,
            background   : difficulty.bg,
            border       : `1px solid ${difficulty.color}44`,
          }}>
            {song.difficulty}
          </span>
        </div>

        {/* Title + Artist */}
        <h3 style={{
          fontFamily   : 'Space Grotesk, sans-serif',
          fontSize     : 'clamp(0.9rem, 2.5vw, 1.05rem)',
          fontWeight   : 700,
          color        : '#e2e8f0',
          lineHeight   : 1.3,
          marginBottom : 4,
          letterSpacing: '-0.01em',
        }}>
          {song.title}
        </h3>
        <p style={{
          fontSize  : '0.82rem',
          color     : '#64748b',
          marginBottom: 14,
          display   : 'flex',
          alignItems: 'center',
          lineHeight: '1.4',
          gap       : 5,
        }}>
          <Music2 size={11} style={{ color: genre.color, flexShrink: 0 }} />
          {song.artist}
          {song.year && (
            <span style={{ opacity: 0.5 }}>· {song.year}</span>
          )}
        </p>

        {/* Common chords */}
        {song.chords?.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {song.chords.slice(0, 5).map(chord => (
              <span
                key={chord}
                style={{
                  display      : 'inline-flex',
                  alignItems   : 'center',
                  padding      : '2px 8px',
                  borderRadius : 6,
                  fontSize     : '0.72rem',
                  fontWeight   : 600,
                  fontFamily   : 'monospace',
                  lineHeight   : '1.4',
                  background   : 'rgba(255,255,255,0.05)',
                  border       : '1px solid rgba(255,255,255,0.08)',
                  color        : '#94a3b8',
                }}
              >
                {chord}
              </span>
            ))}
            {song.chords.length > 5 && (
              <span style={{ fontSize: '0.7rem', color: '#475569', alignSelf: 'center' }}>
                +{song.chords.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Find Tabs button ── */}
      <button
        onClick={handleClick}
        style={{
          margin      : '0 14px 14px',
          padding     : '9px 0',
          borderRadius: 10,
          border      : 'none',
          cursor      : 'pointer',
          fontFamily  : 'Inter, sans-serif',
          fontSize    : '0.8rem',
          fontWeight  : 700,
          letterSpacing: '0.02em',
          display     : 'flex',
          alignItems  : 'center',
          justifyContent: 'center',
          gap         : 6,
          transition  : 'opacity 0.2s, transform 0.15s',
          background  : launched
            ? `linear-gradient(135deg, #34d399, #059669)`
            : `linear-gradient(135deg, ${genre.color}cc, ${genre.color}88)`,
          color       : launched ? '#fff' : '#fff',
          opacity     : launched ? 0.9 : 1,
        }}
        onMouseEnter={e => { if (!launched) e.currentTarget.style.opacity = '0.82' }}
        onMouseLeave={e => { if (!launched) e.currentTarget.style.opacity = '1' }}
      >
        {launched ? (
          '✓ Opening…'
        ) : (
          <>
            Find Tabs
            <ExternalLink size={12} strokeWidth={2.5} />
          </>
        )}
      </button>
    </motion.article>
  )
}

export default memo(SongCard)
