import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Heart, Music2, BookOpen } from 'lucide-react'
import { CHORDS, CATEGORIES } from '../data/chords'
import { useFavorites } from '../hooks/useFavorites'
import ChordCard from '../components/chords/ChordCard'
import ChordModal from '../components/chords/ChordModal'
import PageWrapper from '../components/layout/PageWrapper'

// ── Root Notes configuration ──────────────────────────────────────────────────
const ROOT_NOTES = ['All', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

// Match root notes, resolving flat/sharp equivalent naming (e.g. Eb matches D#)
function checkRootMatch(chordName, filter) {
  if (filter === 'All') return true
  
  // Extract the root prefix (e.g. C#maj7 -> C#, C9 -> C)
  let root;
  if (
    chordName.startsWith('C#') || chordName.startsWith('D#') || chordName.startsWith('F#') || chordName.startsWith('G#') || chordName.startsWith('A#') ||
    chordName.startsWith('Db') || chordName.startsWith('Eb') || chordName.startsWith('Gb') || chordName.startsWith('Ab') || chordName.startsWith('Bb')
  ) {
    root = chordName.slice(0, 2)
  } else {
    root = chordName.charAt(0)
  }

  // Equivalent mapping for flats/sharps
  const equivalents = {
    'C#': ['C#', 'Db'],
    'Db': ['C#', 'Db'],
    'D#': ['D#', 'Eb'],
    'Eb': ['D#', 'Eb'],
    'F#': ['F#', 'Gb'],
    'Gb': ['F#', 'Gb'],
    'G#': ['G#', 'Ab'],
    'Ab': ['G#', 'Ab'],
    'A#': ['A#', 'Bb'],
    'Bb': ['A#', 'Bb']
  }

  if (equivalents[filter]) {
    return equivalents[filter].includes(root)
  }
  if (equivalents[root]) {
    return equivalents[root].includes(filter)
  }

  return root === filter
}

// ── Search matcher ────────────────────────────────────────────────────────────
function matchesQuery(chord, q) {
  if (!q) return true
  const s = q.toLowerCase()
  return (
    chord.name.toLowerCase().includes(s)       ||
    chord.fullName.toLowerCase().includes(s)   ||
    chord.suffix.toLowerCase().includes(s)     ||
    chord.category.toLowerCase().includes(s)   ||
    // Allow "sus" to match sus2 + sus4 at once
    (chord.category === 'sus' && 'suspended'.startsWith(s))
  )
}

// ── Category tabs config (with "Favorites" injected at front) ────────────────
const ALL_TABS = [
  { id: 'favorites', label: '♥ Saved' },
  ...CATEGORIES,
]

export default function Chords() {
  const [query,          setQuery]          = useState('')
  const [category,       setCategory]       = useState('all')
  const [rootFilter,     setRootFilter]     = useState('All')
  const [selectedChord,  setSelectedChord]  = useState(null)
  const [limit,          setLimit]          = useState(24) // Pagination limit

  const { toggleFavorite, isFavorite } = useFavorites()

  // ── Filtered chord list ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return CHORDS.filter(chord => {
      // 1. Favorites Filter
      if (category === 'favorites') {
        if (!isFavorite(chord.id)) return false
      } 
      // 2. Category Filter
      else if (category !== 'all' && chord.category !== category) {
        return false
      }

      // 3. Root Note Filter
      if (rootFilter !== 'All') {
        if (!checkRootMatch(chord.name, rootFilter)) return false
      }

      // 4. Query text Search
      return matchesQuery(chord, query)
    })
  }, [query, category, rootFilter, isFavorite])

  // ── Per-tab counts ────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const map = {}
    for (const tab of ALL_TABS) {
      if (tab.id === 'favorites') {
        map.favorites = CHORDS.filter(c => isFavorite(c.id)).length
      } else if (tab.id === 'all') {
        map.all = CHORDS.length
      } else {
        map[tab.id] = CHORDS.filter(c => c.category === tab.id).length
      }
    }
    return map
  }, [isFavorite])

  const clearQuery = useCallback(() => {
    setQuery('')
    setLimit(24)
  }, [])

  const handleCategoryChange = (tabId) => {
    setCategory(tabId)
    setLimit(24) // Reset limit
  }

  const handleRootFilterChange = (note) => {
    setRootFilter(note)
    setLimit(24) // Reset limit
  }

  const handleSearchChange = (e) => {
    setQuery(e.target.value)
    setLimit(24) // Reset limit
  }

  return (
    <PageWrapper className="px-4 sm:px-6 lg:px-8">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div
        style={{ textAlign: 'center', paddingBottom: 24, paddingTop: 16 }}
        className="relative z-10 flex flex-col items-center"
      >
        <h1
          className="gradient-text font-display leading-tight tracking-tight font-extrabold mb-2 flex items-center justify-center gap-3"
          style={{ 
            fontSize: 'clamp(2.25rem, 5vw, 3rem)',
            textShadow: '0 0 20px rgba(255, 0, 122, 0.15)'
          }}
        >
          <BookOpen className="text-[#FF007A]" size={36} strokeWidth={2} />
          <span>Chord Library</span>
        </h1>
        <p style={{ color: '#94a3b8', maxWidth: 460, margin: '0 auto', fontSize: '0.88rem', lineHeight: 1.6 }}>
          {CHORDS.length} guitar chords with fingering diagrams and instant search.
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }} className="relative z-10">
      {/* ── Search + filter bar ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          paddingBottom: 24,
          paddingTop: 24,
          paddingLeft: 20,
          paddingRight: 20,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(10, 10, 20, 0.55)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 24,
          marginBottom: 32,
        }}
      >
        {/* Search input */}
          <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto 16px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)',
                color: '#475569', pointerEvents: 'none',
              }}
            />
            <input
              id="chord-search"
              type="text"
              value={query}
              onChange={handleSearchChange}
              placeholder="Search chords…  e.g. Am, maj7, sus, dim"
              style={{
                width        : '100%',
                height       : 46,
                padding      : '6px 40px 6px 42px',
                borderRadius : 12,
                border       : '1px solid rgba(255,255,255,0.06)',
                background   : 'rgba(255,255,255,0.03)',
                color        : '#e2e8f0',
                fontSize     : '0.9rem',
                fontFamily   : 'Inter, sans-serif',
                lineHeight   : '1.4',
                outline      : 'none',
                transition   : 'all 0.2s',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(255, 0, 122, 0.4)'
                e.target.style.boxShadow   = '0 0 0 3px rgba(255, 0, 122, 0.08)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.06)'
                e.target.style.boxShadow   = 'none'
              }}
            />
            {/* Clear button */}
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1   }}
                  exit={{   opacity: 0, scale: 0.8  }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  onClick={clearQuery}
                  style={{
                    position  : 'absolute', right: 10, top: '50%',
                    transform : 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.08)',
                    border    : 'none', cursor: 'pointer',
                    borderRadius: 6, padding: '3px 5px',
                    display   : 'flex', alignItems: 'center',
                  }}
                >
                  <X size={12} style={{ color: '#94a3b8' }} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Root Note selector bar */}
          <div className="flex flex-col items-center gap-1.5 mb-4 w-full">
            <span className="text-[9px] uppercase font-extrabold tracking-[0.15em] text-slate-600">Filter by Root Note</span>
            <div
              className="flex gap-1.5 overflow-x-auto max-w-full pb-2 hide-scrollbar justify-start md:justify-center w-full max-w-2xl mx-auto md:px-4"
              style={{
                scrollbarWidth: 'none',
              }}
            >
              <div className="w-4 flex-shrink-0 md:hidden" />
              {ROOT_NOTES.map(note => {
                const active = rootFilter === note
                return (
                  <button
                    key={note}
                    onClick={() => handleRootFilterChange(note)}
                    className="flex-shrink-0 px-3.5 py-1 rounded-full text-xs font-semibold select-none cursor-pointer transition-all duration-200"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '1.4',
                      background: active
                        ? 'rgba(255,0,122,0.15)'
                        : 'rgba(255,255,255,0.02)',
                      border: active
                        ? '1px solid #FF007A'
                        : '1px solid rgba(255,255,255,0.05)',
                      color: active ? '#FF007A' : '#475569',
                    }}
                  >
                    {note}
                  </button>
                )
              })}
              <div className="w-4 flex-shrink-0 md:hidden" />
            </div>
          </div>

          {/* Category tabs */}
          <div
            className="flex flex-wrap items-center justify-center gap-3 w-full max-w-4xl mx-auto px-4"
          >
            {ALL_TABS.map(tab => {
              const active = category === tab.id
              const count  = counts[tab.id] ?? 0
              const isFavTab = tab.id === 'favorites'
              return (
                <button
                  key={tab.id}
                  onClick={() => handleCategoryChange(tab.id)}
                  style={{
                    padding     : '6px 14px',
                    borderRadius: 99,
                    border      : active
                      ? '1px solid #FF007A'
                      : '1px solid rgba(255,255,255,0.07)',
                    background  : active
                      ? 'rgba(255, 0, 122, 0.15)'
                      : 'rgba(255,255,255,0.03)',
                    color       : active ? '#FF007A' : '#64748b',
                    fontSize    : '0.8rem',
                    fontWeight  : active ? 700 : 500,
                    fontFamily  : 'Inter, sans-serif',
                    cursor      : 'pointer',
                    display     : 'inline-flex',
                    alignItems  : 'center',
                    justifyContent: 'center',
                    lineHeight  : '1.4',
                    gap         : 6,
                    transition  : 'all 0.2s',
                    whiteSpace  : 'nowrap',
                  }}
                >
                  {isFavTab && (
                    <Heart
                      size={11}
                      style={{
                        fill  : active ? '#f43f5e' : (count > 0 ? '#f43f5e55' : 'none'),
                        stroke: active ? '#f43f5e' : (count > 0 ? '#f43f5e'   : '#64748b'),
                      }}
                    />
                  )}
                  {tab.label}
                  {/* Count badge */}
                  <span style={{
                    background  : active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                    borderRadius: 99,
                    padding     : '1px 7px',
                    fontSize    : '0.7rem',
                    fontWeight  : 700,
                    color       : active ? '#e0e7ff' : '#475569',
                    display     : 'inline-flex',
                    alignItems  : 'center',
                    justifyContent: 'center',
                  }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
      </div>

      {/* ── Results summary line ──────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {(query || rootFilter !== 'All') && (
          <motion.p
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{   opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ color: '#475569', fontSize: '0.82rem', textAlign: 'center', marginBottom: 20 }}
          >
            {filtered.length === 0
              ? 'No chords matched your search.'
              : `Showing ${filtered.length} chord${filtered.length === 1 ? '' : 's'}`}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Chord grid ───────────────────────────────────────────────────── */}
      <div className="relative z-10">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            <motion.div
              key="grid"
              layout
              style={{
                display            : 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap                : 16,
                paddingBottom      : 40,
                maxWidth           : 1100,
                margin             : '0 auto',
              }}
            >
              {filtered.slice(0, limit).map((chord, i) => (
                <ChordCard
                  key={chord.id}
                  chord={chord}
                  index={i}
                  isFavorite={isFavorite(chord.id)}
                  onToggleFavorite={toggleFavorite}
                  onSelect={setSelectedChord}
                />
              ))}
            </motion.div>
          ) : (
            /* ── Empty state ── */
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y:  0 }}
              exit={{   opacity: 0         }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ textAlign: 'center', padding: '80px 20px 120px' }}
            >
              {category === 'favorites' ? (
                <>
                  <div style={{
                    width: 72, height: 72, borderRadius: 24, margin: '0 auto 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(244,63,94,0.08)',
                    border: '1px solid rgba(244,63,94,0.2)',
                  }}>
                    <Heart size={32} style={{ color: '#f43f5e', opacity: 0.6 }} strokeWidth={1.5} />
                  </div>
                  <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: '1rem', marginBottom: 8 }}>
                    No saved chords yet
                  </p>
                  <p style={{ color: '#475569', fontSize: '0.85rem' }}>
                    Tap the ♥ on any chord to save it here.
                  </p>
                </>
              ) : (
                <>
                  <div style={{
                    width: 72, height: 72, borderRadius: 24, margin: '0 auto 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,0,122,0.08)',
                    border: '1px solid rgba(255,0,122,0.2)',
                  }}>
                    <Music2 size={32} style={{ color: '#FF007A', opacity: 0.6 }} strokeWidth={1.5} />
                  </div>
                  <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: '1rem', marginBottom: 8 }}>
                    No chords found
                  </p>
                  <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: 20 }}>
                    Try searching by root note (C, G, Am) or switching root filters.
                  </p>
                  <button
                    onClick={clearQuery}
                    style={{
                      padding: '8px 20px', borderRadius: 10,
                      border: '1px solid rgba(255,0,122,0.3)',
                      background: 'rgba(255,0,122,0.1)',
                      color: '#FF007A', fontSize: '0.85rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    Clear search
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Pagination load more button ── */}
        {filtered.length > limit && (
          <div className="flex justify-center pb-20 mt-4">
            <button
              onClick={() => setLimit(prev => prev + 24)}
              className="px-6 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer shadow-lg"
            >
              Load More Chords ({filtered.length - limit} remaining)
            </button>
          </div>
        )}
      </div>
      </div>

      {/* ── Chord detailed modal ── */}
      <AnimatePresence>
        {selectedChord && (
          <ChordModal
            chord={selectedChord}
            onClose={() => setSelectedChord(null)}
            isFavorite={isFavorite(selectedChord.id)}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
