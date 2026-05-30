import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Clock, TrendingUp, Music2, ExternalLink, Zap } from 'lucide-react'
import { SONGS, GENRE_META, DIFFICULTY_META, buildUGUrl } from '../data/songs'
import { useSearchHistory } from '../hooks/useSearchHistory'
import SongCard from '../components/songs/SongCard'
import songFinderBg from '../assets/song-finder.png'
import PageWrapper from '../components/layout/PageWrapper'

// ── Constants ──────────────────────────────────────────────────────────────────
const DIFFICULTY_TABS = [
  { id: 'all',          label: 'All Songs' },
  { id: 'Beginner',     label: 'Beginner'  },
  { id: 'Intermediate', label: 'Intermediate' },
  { id: 'Advanced',     label: 'Advanced'  },
]

const SUGGESTION_LIMIT = 7

// ── Helpers ────────────────────────────────────────────────────────────────────
function matchesSong(song, q) {
  const s = q.toLowerCase()
  return (
    song.title.toLowerCase().includes(s)  ||
    song.artist.toLowerCase().includes(s) ||
    song.genre.toLowerCase().includes(s)
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SongFinder() {
  const [query,       setQuery]       = useState('')
  const [isOpen,      setIsOpen]      = useState(false)
  const [activeIdx,   setActiveIdx]   = useState(-1)
  const [difficulty,  setDifficulty]  = useState('all')

  const inputRef    = useRef(null)
  const dropdownRef = useRef(null)

  const { history, addSearch, removeSearch, clearHistory } = useSearchHistory()

  // ── Autocomplete suggestions ───────────────────────────────────────────────
  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    return SONGS.filter(s => matchesSong(s, query)).slice(0, SUGGESTION_LIMIT)
  }, [query])

  // Open dropdown whenever there are suggestions
  useEffect(() => {
    setIsOpen(suggestions.length > 0 && query.trim().length > 0)
    setActiveIdx(-1)
  }, [suggestions, query])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        inputRef.current    && !inputRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Filtered trending grid ─────────────────────────────────────────────────
  const trending = useMemo(() => {
    if (difficulty === 'all') return SONGS
    return SONGS.filter(s => s.difficulty === difficulty)
  }, [difficulty])

  // ── Core search action ─────────────────────────────────────────────────────
  const openInUG = useCallback((q) => {
    const trimmed = (q ?? query).trim()
    if (!trimmed) return
    addSearch(trimmed)
    window.open(buildUGUrl(trimmed), '_blank', 'noopener,noreferrer')
    setIsOpen(false)
    setQuery('')
  }, [query, addSearch])

  const handleSongClick = useCallback((song) => {
    const q = `${song.title} ${song.artist}`
    openInUG(q)
  }, [openInUG])

  // ── Keyboard navigation in dropdown ───────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        handleSongClick(suggestions[activeIdx])
      } else {
        openInUG()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIdx(-1)
    }
  }

  // ── Difficulty counts ──────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:          SONGS.length,
    Beginner:     SONGS.filter(s => s.difficulty === 'Beginner').length,
    Intermediate: SONGS.filter(s => s.difficulty === 'Intermediate').length,
    Advanced:     SONGS.filter(s => s.difficulty === 'Advanced').length,
  }), [])

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <PageWrapper
      bgImage={songFinderBg}
      bgPosition="bg-top"
      overlayGradient="bg-black/75"
      className=""
    >
      {/* ── Hero section ──────────────────────────────────────────────────── */}
      <div
        style={{
          position  : 'relative',
          overflow  : 'hidden',
          padding   : '40px 16px 48px',
          textAlign : 'center',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          zIndex    : 10,
        }}
      >
        {/* Background radial glow */}
        <div style={{
          position   : 'absolute',
          inset      : 0,
          background : 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(236,72,153,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position   : 'absolute',
          inset      : 0,
          background : 'radial-gradient(ellipse 40% 40% at 30% 80%, rgba(255,0,122,0.05) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y:  0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1
            className="gradient-text font-display leading-tight tracking-tight font-extrabold mb-2 flex items-center justify-center gap-3"
            style={{ 
              fontSize: 'clamp(2.25rem, 5vw, 3rem)',
              textShadow: '0 0 20px rgba(255, 0, 122, 0.15)'
            }}
          >
            <Search className="text-[#FF007A]" size={36} strokeWidth={2} />
            <span>Song Finder</span>
          </h1>
          <p style={{
            color    : '#94a3b8',
            maxWidth : 440,
            margin   : '0 auto 32px',
            fontSize : '0.95rem',
            lineHeight: 1.6,
          }}>
            Search any song or artist — opens tabs on Ultimate Guitar.
          </p>

          {/* ── Search input ──────────────────────────────────────────────── */}
          <div style={{ position: 'relative', maxWidth: 580, margin: '0 auto' }}>

            {/* Input wrapper */}
            <div
              style={{
                position    : 'relative',
                borderRadius: 16,
                // Glass wrapper for shadow / border
                boxShadow   : '0 4px 40px rgba(0,0,0,0.4)',
              }}
            >
              <Search
                size={18}
                style={{
                  position : 'absolute', left: 18, top: '50%',
                  transform: 'translateY(-50%)',
                  color    : '#475569', pointerEvents: 'none',
                  zIndex   : 1,
                }}
              />
              <input
                id="song-search"
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => query.trim() && setIsOpen(suggestions.length > 0)}
                placeholder="Search songs, artists…  e.g. Wonderwall, John Mayer"
                autoComplete="off"
                style={{
                  width       : '100%',
                  height      : 58,
                  padding     : '8px 120px 8px 52px',
                  borderRadius: 16,
                  border      : '1px solid rgba(255,255,255,0.09)',
                  background  : 'rgba(255,255,255,0.05)',
                  color       : '#e2e8f0',
                  fontSize    : '0.95rem',
                  fontFamily  : 'Inter, sans-serif',
                  lineHeight  : '1.4',
                  outline     : 'none',
                  transition  : 'border-color 0.2s, box-shadow 0.2s',
                  backdropFilter: 'blur(12px)',
                }}
                onFocusCapture={e => {
                  e.target.style.borderColor = 'rgba(244,114,182,0.45)'
                  e.target.style.boxShadow   = '0 0 0 3px rgba(244,114,182,0.1)'
                }}
                onBlurCapture={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.09)'
                  e.target.style.boxShadow   = 'none'
                }}
              />

              {/* Clear button */}
              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1   }}
                    exit={{   opacity: 0, scale: 0.7  }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => { setQuery(''); setIsOpen(false); inputRef.current?.focus() }}
                    style={{
                      position    : 'absolute', right: 80, top: '50%',
                      transform   : 'translateY(-50%)',
                      background  : 'rgba(255,255,255,0.08)',
                      border      : 'none', cursor: 'pointer',
                      borderRadius: 7, padding: '4px 6px',
                      display     : 'flex', alignItems: 'center',
                    }}
                  >
                    <X size={13} style={{ color: '#94a3b8' }} />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Search / Submit button */}
              <button
                onClick={() => openInUG()}
                disabled={!query.trim()}
                style={{
                  position    : 'absolute', right: 8, top: '50%',
                  transform   : 'translateY(-50%)',
                  height      : 42,
                  padding     : '0 16px',
                  borderRadius: 11,
                  border      : 'none',
                  cursor      : query.trim() ? 'pointer' : 'default',
                  background  : query.trim()
                    ? 'var(--gradient-cta)'
                    : 'rgba(255,255,255,0.06)',
                  color       : query.trim() ? '#fff' : '#475569',
                  fontSize    : '0.83rem',
                  fontWeight  : 700,
                  fontFamily  : 'Inter, sans-serif',
                  display     : 'flex',
                  alignItems  : 'center',
                  gap         : 5,
                  transition  : 'all 0.2s',
                  whiteSpace  : 'nowrap',
                }}
              >
                Search
                <ExternalLink size={12} strokeWidth={2.5} />
              </button>
            </div>

            {/* ── Autocomplete dropdown ─────────────────────────────────── */}
            <AnimatePresence>
              {isOpen && suggestions.length > 0 && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 4,  scaleY: 1    }}
                  exit={{   opacity: 0, y: -8, scaleY: 0.95  }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position    : 'absolute',
                    top         : '100%',
                    left        : 0,
                    right       : 0,
                    zIndex      : 100,
                    borderRadius: 16,
                    border      : '1px solid rgba(255,255,255,0.05)',
                    background  : 'rgba(15,15,24,0.95)',
                    backdropFilter: 'blur(24px)',
                    overflow    : 'hidden',
                    boxShadow   : '0 16px 48px rgba(0,0,0,0.5)',
                    transformOrigin: 'top',
                  }}
                >
                  {suggestions.map((song, i) => {
                    const genre = GENRE_META[song.genre] ?? GENRE_META['Rock']
                    const isActive = i === activeIdx
                    return (
                      <button
                        key={song.id}
                        onClick={() => handleSongClick(song)}
                        onMouseEnter={() => setActiveIdx(i)}
                        style={{
                          width      : '100%',
                          padding    : '11px 16px',
                          border     : 'none',
                          borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          background : isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                          cursor     : 'pointer',
                          display    : 'flex',
                          alignItems : 'center',
                          gap        : 12,
                          textAlign  : 'left',
                          transition : 'background 0.12s',
                        }}
                      >
                        {/* Coloured icon */}
                        <div style={{
                          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: genre.bg, border: `1px solid ${genre.border}`,
                        }}>
                          <Music2 size={15} style={{ color: genre.color }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            color     : '#e2e8f0',
                            fontSize  : '0.87rem',
                            fontWeight: 600,
                            fontFamily: 'Inter, sans-serif',
                            lineHeight: '1.4',
                            padding   : '2px 0',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {song.title}
                          </div>
                          <div style={{ color: '#475569', fontSize: '0.75rem', lineHeight: '1.4', padding: '1px 0' }}>
                            {song.artist}
                          </div>
                        </div>

                        {/* Genre pill */}
                        <span style={{
                          padding      : '2px 8px',
                          borderRadius : 99,
                          fontSize     : '0.65rem',
                          fontWeight   : 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color        : genre.color,
                          background   : genre.bg,
                          flexShrink   : 0,
                        }}>
                          {song.genre}
                        </span>
                      </button>
                    )
                  })}

                  {/* "Search UG for …" footer row */}
                  <button
                    onClick={() => openInUG()}
                    style={{
                      width      : '100%',
                      padding    : '10px 16px',
                      border     : 'none',
                      borderTop  : '1px solid rgba(255,255,255,0.06)',
                      background : activeIdx === suggestions.length ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                      cursor     : 'pointer',
                      display    : 'flex',
                      alignItems : 'center',
                      gap        : 8,
                      color      : '#FF007A',
                      fontSize   : '0.82rem',
                      fontWeight : 600,
                      fontFamily : 'Inter, sans-serif',
                    }}
                    onMouseEnter={() => setActiveIdx(suggestions.length)}
                  >
                    <ExternalLink size={13} />
                    Search Ultimate Guitar for "{query}"
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* ── Quick-tip line ─────────────────────────────────────────────── */}
          <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 12 }}>
            <Zap size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Try "Wonderwall Oasis" or "John Mayer" to open tabs on Ultimate Guitar.
          </p>
        </motion.div>
      </div>

      {/* ── Main content area ──────────────────────────────────────────────── */}
      <div
        style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 16px 80px' }}
        className="relative z-10 sm:px-6 lg:px-8"
      >

        {/* ── Recent Searches ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{   opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ marginBottom: 36, overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Clock size={14} style={{ color: '#475569' }} />
                  <span style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Recent
                  </span>
                </div>
                <button
                  onClick={clearHistory}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#334155', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.color = '#94a3b8'}
                  onMouseLeave={e => e.target.style.color = '#334155'}
                >
                  Clear all
                </button>
              </div>

              {/* Pills row */}
              <div style={{
                display        : 'flex',
                gap            : 8,
                flexWrap       : 'wrap',
              }}>
                <AnimatePresence>
                  {history.map(q => (
                    <motion.div
                      key={q}
                      layout
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1    }}
                      exit={{   opacity: 0, scale: 0.8, width: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        display    : 'flex',
                        alignItems : 'center',
                        gap        : 5,
                        padding    : '5px 10px 5px 12px',
                        borderRadius: 99,
                        border     : '1px solid rgba(255,255,255,0.08)',
                        background : 'rgba(255,255,255,0.04)',
                        maxWidth   : '100%',
                      }}
                    >
                      <button
                        onClick={() => openInUG(q)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif',
                          padding: '2px 0', maxWidth: 180,
                          lineHeight: '1.4',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {q}
                      </button>
                      <button
                        onClick={() => removeSearch(q)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '0 0 0 2px', display: 'flex', alignItems: 'center',
                          opacity: 0.5, transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                        aria-label={`Remove "${q}" from history`}
                      >
                        <X size={11} style={{ color: '#94a3b8' }} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Trending header + difficulty filter ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y:  0 }}
          transition={{ duration: 0.25, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display       : 'flex',
            alignItems    : 'center',
            justifyContent: 'space-between',
            flexWrap      : 'wrap',
            gap           : 12,
            marginBottom  : 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} style={{ color: '#f472b6' }} />
            <span style={{
              fontFamily   : 'Space Grotesk, sans-serif',
              fontSize     : '1.05rem',
              fontWeight   : 700,
              color        : '#e2e8f0',
              letterSpacing: '-0.01em',
            }}>
              Popular Songs
            </span>
            <span style={{
              background: 'rgba(244,114,182,0.12)',
              border    : '1px solid rgba(244,114,182,0.2)',
              color     : '#f472b6',
              fontSize  : '0.7rem',
              fontWeight: 700,
              padding   : '1px 8px',
              borderRadius: 99,
            }}>
              {counts[difficulty === 'all' ? 'all' : difficulty]}
            </span>
          </div>

          {/* Difficulty tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DIFFICULTY_TABS.map(tab => {
              const active = difficulty === tab.id
              const diff   = tab.id !== 'all' ? DIFFICULTY_META[tab.id] : null
              return (
                <button
                  key={tab.id}
                  onClick={() => setDifficulty(tab.id)}
                  style={{
                    padding    : '5px 13px',
                    borderRadius: 99,
                    border     : active
                      ? `1px solid ${diff ? diff.color + '55' : 'rgba(244,114,182,0.4)'}`
                      : '1px solid rgba(255,255,255,0.07)',
                    background : active
                      ? (diff ? diff.bg : 'rgba(244,114,182,0.1)')
                      : 'rgba(255,255,255,0.03)',
                    color      : active
                      ? (diff ? diff.color : '#f472b6')
                      : '#475569',
                    fontSize   : '0.78rem',
                    fontWeight : active ? 700 : 500,
                    fontFamily : 'Inter, sans-serif',
                    cursor     : 'pointer',
                    transition : 'all 0.2s',
                    whiteSpace : 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* ── Song Cards Grid ──────────────────────────────────────────────── */}
        <AnimatePresence mode="popLayout">
          {trending.length > 0 ? (
            <motion.div
              key="grid"
              layout
              style={{
                display            : 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap                : 16,
              }}
            >
              {trending.map((song, i) => (
                <SongCard
                  key={song.id}
                  song={song}
                  index={i}
                  onSearch={handleSongClick}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{   opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ textAlign: 'center', padding: '60px 20px' }}
            >
              <Music2 size={36} style={{ color: '#334155', margin: '0 auto 16px' }} />
              <p style={{ color: '#64748b', fontWeight: 600 }}>No songs in this filter</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── UG attribution footer ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            marginTop : 48,
            padding   : '20px 24px',
            borderRadius: 14,
            border    : '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.02)',
            display   : 'flex',
            alignItems: 'center',
            gap       : 14,
            flexWrap  : 'wrap',
          }}
        >
          <ExternalLink size={18} style={{ color: '#475569', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: 1.5 }}>
              Tab results are powered by{' '}
              <a
                href="https://www.ultimate-guitar.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}
              >
                Ultimate Guitar
              </a>
              {' '}— the largest online guitar tab database.
            </p>
          </div>
          <a
            href="https://www.ultimate-guitar.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding     : '7px 16px',
              borderRadius: 9,
              border      : '1px solid rgba(129,140,248,0.3)',
              background  : 'rgba(129,140,248,0.08)',
              color       : '#818cf8',
              fontSize    : '0.8rem',
              fontWeight  : 600,
              textDecoration: 'none',
              display     : 'flex',
              alignItems  : 'center',
              gap         : 5,
              flexShrink  : 0,
              transition  : 'all 0.2s',
              whiteSpace  : 'nowrap',
            }}
          >
            Visit UG
            <ExternalLink size={11} />
          </a>
        </motion.div>
      </div>
    </PageWrapper>
  )
}
