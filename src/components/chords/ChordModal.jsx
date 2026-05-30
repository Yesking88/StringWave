import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Heart, Info, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { playChordStrum } from '../../utils/tonePlayer'
import ChordDiagram from './ChordDiagram'

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

const STRING_NAMES = [
  { name: 'Low E', num: 6 },
  { name: 'A', num: 5 },
  { name: 'D', num: 4 },
  { name: 'G', num: 3 },
  { name: 'B', num: 2 },
  { name: 'High E', num: 1 },
]

const FINGER_NAMES = {
  0: 'Open / No finger',
  1: '1 — Index',
  2: '2 — Middle',
  3: '3 — Ring',
  4: '4 — Pinky',
}

export default function ChordModal({ chord, onClose, isFavorite, onToggleFavorite }) {
  const cat = CATEGORY_STYLE[chord.category] ?? CATEGORY_STYLE.other

  // Define variations array, falling back to default chord properties
  const variations = chord.variations || [
    {
      frets: chord.frets,
      fingers: chord.fingers,
      baseFret: chord.baseFret || 1,
      barre: chord.barre
    }
  ]

  const [activeIdx, setActiveIdx] = useState(0)
  const activeVoicing = variations[activeIdx]

  // Reset variation slider index when chord changes
  useEffect(() => {
    setActiveIdx(0)
  }, [chord])

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Disable scroll behind modal
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Create chord object representation of current selected shape variation
  const diagramChord = {
    ...chord,
    ...activeVoicing
  }

  return (
    <div
      className="fixed inset-0 bg-[#0a0a0f]/85 backdrop-blur-md z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-neutral-950/80 backdrop-blur-md border border-white/10 max-w-lg w-full rounded-2xl p-6 sm:p-8 relative shadow-[0_0_80px_rgba(99,102,241,0.15)] flex flex-col md:flex-row gap-8 items-center max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close details"
          className="absolute top-4 right-4 bg-white/5 border border-white/10 rounded-full p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Column 1: Chord diagram */}
        <div className="flex flex-col items-center gap-4 w-full md:w-1/2">
          {/* Chord Name Header */}
          <div className="text-center">
            <h2 className="font-display font-black text-3xl text-white tracking-tight leading-tight mb-1.5">
              {chord.name}
            </h2>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
              {chord.fullName}
            </p>
            <span
              className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
              style={{
                color: cat.color,
                background: cat.bg,
                borderColor: `${cat.color}25`,
              }}
            >
              {cat.label}
            </span>
          </div>

          {/* Ultimate Guitar style Variation Slider */}
          {variations.length > 1 && (
            <div className="flex items-center justify-between w-full max-w-[180px] px-3 py-1 rounded-xl bg-white/5 border border-white/10 select-none">
              <button
                onClick={() => setActiveIdx((prev) => (prev - 1 + variations.length) % variations.length)}
                className="text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer p-1"
                aria-label="Previous variation shape"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold text-slate-300 font-mono">
                {activeIdx + 1} of {variations.length}
              </span>
              <button
                onClick={() => setActiveIdx((prev) => (prev + 1) % variations.length)}
                className="text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer p-1"
                aria-label="Next variation shape"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Large Diagram */}
          <div className="w-48 h-48 sm:w-52 sm:h-52 relative flex items-center justify-center p-2 rounded-2xl bg-white/[0.01] border border-white/[0.02]">
            <ChordDiagram chord={diagramChord} />
          </div>

          {/* Action Button Row: Play & Favorite */}
          <div className="flex gap-3 w-full justify-center">
            {/* Play Button */}
            <button
              onClick={() => playChordStrum(activeVoicing.frets)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold select-none cursor-pointer transition-all duration-200 border bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/30 hover:text-white w-1/2"
            >
              <Play size={14} fill="currentColor" />
              Play
            </button>

            {/* Favorite Toggle Button inside modal */}
            <button
              onClick={() => onToggleFavorite(chord.id)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold select-none cursor-pointer transition-all duration-200 border w-1/2"
              style={{
                background: isFavorite ? 'rgba(244,63,94,0.06)' : 'rgba(255,255,255,0.02)',
                borderColor: isFavorite ? 'rgba(244,63,94,0.25)' : 'rgba(255,255,255,0.08)',
                color: isFavorite ? '#f43f5e' : '#cbd5e1',
              }}
            >
              <Heart size={14} className={isFavorite ? 'fill-[#f43f5e]' : ''} />
              {isFavorite ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* Column 2: Detailed String layout table */}
        <div className="flex flex-col gap-4 w-full md:w-1/2 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-6">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
            <Info size={12} className="text-indigo-400" />
            Fretboard Fingering
          </h3>

          <div className="flex flex-col gap-2 w-full">
            {STRING_NAMES.map((str, idx) => {
              const fret = activeVoicing.frets[idx]
              const finger = activeVoicing.fingers[idx]
              const isMuted = fret === -1
              const isOpen = fret === 0

              return (
                <div
                  key={str.num}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg border border-white/[0.02]"
                  style={{
                    background: isMuted
                      ? 'rgba(239,68,68,0.01)'
                      : isOpen
                      ? 'rgba(99,102,241,0.01)'
                      : 'rgba(255,255,255,0.01)',
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-300">
                      String {str.num} ({str.name})
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono tracking-tight">
                      {isMuted
                        ? 'Muted'
                        : isOpen
                        ? 'Open String'
                        : `Fret ${fret} — ${FINGER_NAMES[finger] || 'No finger'}`}
                    </span>
                  </div>

                  {/* High-tech right-side bubble status */}
                  <span
                    className="font-mono text-xs font-extrabold px-2 py-0.5 rounded"
                    style={{
                      background: isMuted
                        ? 'rgba(239,68,68,0.1)'
                        : isOpen
                        ? 'rgba(99,102,241,0.1)'
                        : 'rgba(255,255,255,0.04)',
                      color: isMuted ? '#ef4444' : isOpen ? '#818cf8' : '#e2e8f0',
                    }}
                  >
                    {isMuted ? 'X' : isOpen ? '0' : fret}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Guide note */}
          {activeVoicing.baseFret > 1 && (
            <p className="text-[10px] leading-relaxed text-slate-500 font-medium mt-1">
              * This is a movable barre shape starting at Fret {activeVoicing.baseFret}. Place your index finger across the strings at fret {activeVoicing.baseFret} to barre.
            </p>
          )}
        </div>

      </motion.div>
    </div>
  )
}
