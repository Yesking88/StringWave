/**
 * ChordPicker — renders via ReactDOM.createPortal into document.body
 *
 * Props:
 *   anchorRect  — DOMRect from the triggering element's getBoundingClientRect()
 *   onSelect(chordId) — called when a chord is chosen
 *   onClose()         — called when clicking backdrop or pressing Escape
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { CHORDS, CATEGORIES } from '../../data/chords'

const ROOT_NOTES = ['All', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

function getChordRoot(chordName) {
  if (!chordName) return ''
  if (
    chordName.startsWith('C#') || chordName.startsWith('D#') || chordName.startsWith('F#') || chordName.startsWith('G#') || chordName.startsWith('A#') ||
    chordName.startsWith('Db') || chordName.startsWith('Eb') || chordName.startsWith('Gb') || chordName.startsWith('Ab') || chordName.startsWith('Bb')
  ) {
    return chordName.slice(0, 2)
  }
  return chordName.charAt(0)
}

function matchesRoot(chord, root) {
  if (root === 'All') return true
  const chordRoot = getChordRoot(chord.name)
  const EQUIV = { 
    'C#': 'Db', 'Db': 'C#', 
    'D#': 'Eb', 'Eb': 'D#', 
    'F#': 'Gb', 'Gb': 'F#', 
    'G#': 'Ab', 'Ab': 'G#', 
    'A#': 'Bb', 'Bb': 'A#' 
  }
  return chordRoot === root || chordRoot === EQUIV[root]
}

/** Calculate fixed pixel position so the panel appears below+left of the anchor */
function calcPosition(rect) {
  if (!rect) return { top: 100, left: 20 }
  const PANEL_W = 288   // w-72
  const PANEL_H = 420   // approximate max height
  const MARGIN  = 8

  let top  = rect.bottom + MARGIN
  let left = rect.left

  // Flip upward if not enough room below
  if (top + PANEL_H > window.innerHeight - MARGIN) {
    top = rect.top - PANEL_H - MARGIN
  }
  // Clamp left so the panel doesn't overflow the viewport
  if (left + PANEL_W > window.innerWidth - MARGIN) {
    left = window.innerWidth - PANEL_W - MARGIN
  }
  if (left < MARGIN) left = MARGIN

  return { top, left }
}

export default function ChordPicker({ anchorRect, onSelect, onClose }) {
  const [rootFilter, setRootFilter] = useState('All')
  const [catFilter,  setCatFilter]  = useState('all')
  const [query,      setQuery]      = useState('')
  const inputRef = useRef(null)

  const pos = calcPosition(anchorRect)

  // Auto-focus search on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const filtered = useMemo(() => {
    return CHORDS.filter(c => {
      const matchesR = matchesRoot(c, rootFilter)
      const matchesC = catFilter === 'all' || c.category === catFilter
      let matchesQ = true
      if (query) {
        const q = query.toLowerCase()
        matchesQ = c.fullName.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      }
      return matchesR && matchesC && matchesQ
    })
  }, [rootFilter, catFilter, query])

  const panel = (
    <>
      {/* Transparent backdrop — captures outside clicks */}
      <div
        className="fixed inset-0 z-[199]"
        onClick={onClose}
      />

      {/* Picker panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -6 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed z-[200] w-72 rounded-2xl border border-white/10 shadow-[0_0_60px_rgba(255,0,122,0.22)] overflow-hidden"
        style={{
          top: pos.top,
          left: pos.left,
          background: 'rgba(10,10,20,0.97)',
          backdropFilter: 'blur(24px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/[0.06]">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Select Chord</span>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pt-2.5 pb-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/[0.07]">
            <Search size={12} className="text-slate-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search chords…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>
        </div>

        {/* Root Notes */}
        <div
          className="px-3 py-1.5 flex gap-1 hide-scrollbar"
          style={{
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {ROOT_NOTES.map(r => (
            <button
              key={r}
              onClick={() => setRootFilter(r === 'All' ? 'All' : r)}
              className={`shrink-0 py-1 px-2 rounded-md text-[10px] font-semibold leading-normal transition-all border flex items-center justify-center ${
                rootFilter === r
                  ? 'text-[#FF007A]'
                  : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'
              }`}
              style={rootFilter === r ? { background: 'rgba(255,0,122,0.15)', borderColor: '#FF007A' } : {}}
            >{r}</button>
          ))}
        </div>

        {/* Category Tabs */}
        <div className="px-3 pb-1.5 flex gap-1 overflow-x-auto hide-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCatFilter(cat.id)}
              className={`shrink-0 py-1 px-2.5 rounded-md text-[10px] font-semibold leading-normal transition-all border flex items-center justify-center ${
                catFilter === cat.id
                  ? 'text-[#FF007A]'
                  : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'
              }`}
              style={catFilter === cat.id ? { background: 'rgba(255,0,122,0.15)', borderColor: '#FF007A' } : {}}
            >{cat.label}</button>
          ))}
        </div>

        {/* Chord Grid */}
        <div
          className="px-3 pb-3 grid grid-cols-4 gap-1.5 hide-scrollbar"
          style={{ maxHeight: '60vh', overflowY: 'auto' }}
        >
          {filtered.length === 0 && (
            <div className="col-span-4 text-center py-4 text-[11px] text-slate-500">No chords found</div>
          )}
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => { onSelect(c.id); onClose() }}
              className="flex flex-col items-center justify-center py-2 rounded-xl text-center transition-all duration-150 border border-transparent hover:border-[#FF007A]/40 hover:bg-[#FF007A]/10 bg-white/[0.03]"
            >
              <span
                className="text-xs font-bold text-white leading-tight"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >{c.name}</span>
              {c.suffix && (
                <span className="text-[9px] text-slate-500 mt-0.5">{c.suffix}</span>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </>
  )

  return createPortal(panel, document.body)
}
