/**
 * ChordSlot
 *
 * Renders one chord slot in a ProgressionSection.
 * - Empty: shows "+" placeholder
 * - Filled: shows chord name, beat selector, × remove button
 * - Active (playing): indigo pulsing glow
 * - Hover: purple glow border
 * - Click → opens ChordPicker via portal (positioned from getBoundingClientRect)
 */

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import ChordPicker from './ChordPicker'

const BEAT_OPTIONS = [1, 2, 4]

export default function ChordSlot({ slot, chord, isActive, onSelect, onRemove, onBeatsChange }) {
  const [pickerOpen,  setPickerOpen]  = useState(false)
  const [anchorRect,  setAnchorRect]  = useState(null)
  const tileRef = useRef(null)

  const isEmpty = !chord

  const handleTileClick = () => {
    if (tileRef.current) {
      setAnchorRect(tileRef.current.getBoundingClientRect())
    }
    setPickerOpen(true)
  }

  return (
    <div className="relative" style={{ minWidth: 0 }}>
      {/* Main slot tile */}
      <motion.div
        ref={tileRef}
        layout
        layoutId={slot.id}
        className={`relative flex flex-col items-center justify-center rounded-2xl cursor-pointer select-none transition-colors duration-200 border ${
          isActive
            ? 'bg-[#FF007A]/20 border-[#FF007A] shadow-[0_0_20px_rgba(255,0,122,0.4)]'
            : isEmpty
            ? 'bg-white/[0.04] border-white/15 hover:bg-white/[0.08] hover:border-[#FF007A]/40'
            : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-[#FF007A]/50'
        }`}
        style={{
          minWidth: 80,
          minHeight: 80,
          transition: 'box-shadow 0.3s ease, border-color 0.25s ease, background 0.2s ease',
        }}
        whileHover={{ scale: 1.04, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
        whileTap={{ scale: 0.96, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={handleTileClick}
      >
        {/* Indigo pulse ring when active */}
        {isActive && (
          <motion.span
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ border: '2px solid rgba(255,0,122,0.5)' }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
          />
        )}

        {/* Remove button */}
        {!isEmpty && (
          <button
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-neutral-800 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors z-10"
            onClick={e => { e.stopPropagation(); onRemove() }}
            title="Remove chord"
          >
            <X size={10} strokeWidth={2.5} />
          </button>
        )}

        {/* Chord name or empty placeholder */}
        <div className="flex flex-col items-center justify-center gap-0.5 px-2 pt-3 pb-1.5">
          {isEmpty ? (
            <span className="text-2xl text-white/20 font-light leading-tight">+</span>
          ) : (
            <>
              <span
                className="font-bold text-white leading-tight text-center"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: chord.name.length > 3 ? '1rem' : '1.2rem',
                }}
              >
                {chord.name}
              </span>
              {chord.suffix && (
                <span className="text-[9px] text-white/50 font-medium mt-0.5">{chord.suffix}</span>
              )}
            </>
          )}
        </div>

        {/* Beat selector — only visible when filled */}
        {!isEmpty && (
          <div
            className="flex gap-0.5 mb-2"
            onClick={e => e.stopPropagation()}
          >
            {BEAT_OPTIONS.map(b => (
              <button
                key={b}
                onClick={e => { e.stopPropagation(); onBeatsChange(b) }}
                className={`h-4 w-6 rounded text-[9px] font-bold transition-all border ${
                  slot.beats === b
                    ? 'text-[#FF007A]'
                    : 'bg-white/[0.06] border-transparent text-white/40 hover:bg-white/15 hover:text-white/70'
                }`}
                style={slot.beats === b ? { background: 'rgba(255,0,122,0.15)', borderColor: '#FF007A' } : {}}
              >{b}</button>
            ))}
          </div>
        )}

        {/* Duration label below beat buttons when filled */}
        {!isEmpty && (
          <span className="text-[9px] text-white/30 font-medium mb-1 leading-normal">
            {slot.beats} beat{slot.beats !== 1 ? 's' : ''}
          </span>
        )}
      </motion.div>

      {/* ChordPicker — mounted via portal to avoid overflow clipping */}
      <AnimatePresence>
        {pickerOpen && (
          <ChordPicker
            anchorRect={anchorRect}
            onSelect={(id) => { onSelect(id); setPickerOpen(false) }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
