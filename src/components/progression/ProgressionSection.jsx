/**
 * ProgressionSection
 *
 * A labelled group of ChordSlot components with drag-to-reorder support.
 *
 * Props:
 *   section       — { id, label, chords: [{ id, chordId, beats }] }
 *   chordsMap     — Map<chordId, chordObject>
 *   playingSlotId — id of the currently playing slot (or null)
 *   canDelete     — boolean, false when this is the only section
 *   onLabelChange — (newLabel) → void
 *   onDelete      — () → void
 *   onAddChord    — () → void
 *   onRemoveChord — (slotId) → void
 *   onSelectChord — (slotId, chordId) → void
 *   onBeatsChange — (slotId, beats) → void
 *   onReorder     — (fromIndex, toIndex) → void
 */

import { useRef, useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Trash2, Plus } from 'lucide-react'
import ChordSlot from './ChordSlot'

const MAX_CHORDS = 8

export default function ProgressionSection({
  section,
  chordsMap,
  playingSlotId,
  canDelete,
  onLabelChange,
  onDelete,
  onAddChord,
  onRemoveChord,
  onSelectChord,
  onBeatsChange,
  onReorder,
}) {
  const [editingLabel, setEditingLabel] = useState(false)
  const labelRef = useRef(null)

  const handleLabelClick = () => {
    setEditingLabel(true)
    setTimeout(() => labelRef.current?.select(), 20)
  }

  // Calculate total beats in this section
  const totalBeats = section.chords.reduce((sum, c) => sum + (c.beats || 2), 0)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-r-2xl rounded-l-none border border-white/20 bg-white/[0.07] backdrop-blur-sm p-4 sm:p-5"
      style={{
        borderLeft: '4px solid rgba(255, 0, 122, 0.6)',
        borderRadius: '0 16px 16px 0',
      }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        {/* Editable label + beat info */}
        <div className="flex items-center gap-3 min-w-0">
          {editingLabel ? (
            <input
              ref={labelRef}
              type="text"
              value={section.label}
              onChange={e => onLabelChange(e.target.value)}
              onBlur={() => setEditingLabel(false)}
              onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
              className="bg-transparent border-b border-[#FF007A]/60 text-white text-base font-semibold outline-none px-0 py-0.5 min-w-0 w-full max-w-[200px]"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              maxLength={32}
            />
          ) : (
            <button
              onClick={handleLabelClick}
              className="text-base font-semibold text-white hover:text-[#FF007A] transition-colors truncate"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              title="Click to rename"
            >
              {section.label || 'Untitled Section'}
            </button>
          )}

          {/* Beat count + slot count info */}
          <div className="flex items-center gap-2 shrink-0">
            {section.chords.length > 0 && (
              <span className="text-xs text-white/40 font-medium">
                {totalBeats} beat{totalBeats !== 1 ? 's' : ''}
              </span>
            )}
            <span className="text-[10px] text-white/20 font-mono">
              {section.chords.length}/{MAX_CHORDS}
            </span>
          </div>
        </div>

        {/* Delete section button */}
        <button
          onClick={onDelete}
          disabled={!canDelete}
          title={canDelete ? 'Delete section' : 'Cannot delete the only section'}
          className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
            canDelete
              ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'
              : 'text-slate-700 cursor-not-allowed'
          }`}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Empty state placeholder */}
      {section.chords.length === 0 && (
        <button
          onClick={onAddChord}
          className="flex items-center justify-center w-full py-8 rounded-xl border border-dashed border-white/20 text-white/30 text-sm gap-2 hover:border-[#FF007A]/40 hover:text-white/50 hover:bg-[#FF007A]/[0.04] transition-all duration-200 mb-3"
        >
          <Plus size={14} />
          Add your first chord to get started
        </button>
      )}

      {/* Chord slots — Framer Motion Reorder */}
      {section.chords.length > 0 && (
        <Reorder.Group
          axis="x"
          values={section.chords}
          onReorder={(newOrder) => {
            onReorder(newOrder)
          }}
          className="flex flex-wrap gap-2 mb-3"
          as="div"
        >
          <AnimatePresence initial={false}>
            {section.chords.map(slot => (
              <Reorder.Item
                key={slot.id}
                value={slot}
                as="div"
                dragListener={true}
                style={{ cursor: 'grab' }}
                className="w-[88px]"
              >
                <ChordSlot
                  slot={slot}
                  chord={slot.chordId ? chordsMap.get(slot.chordId) : null}
                  isActive={playingSlotId === slot.id}
                  onSelect={(chordId) => onSelectChord(slot.id, chordId)}
                  onRemove={() => onRemoveChord(slot.id)}
                  onBeatsChange={(beats) => onBeatsChange(slot.id, beats)}
                />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      {/* Add chord button — only shown when there are existing chords */}
      {section.chords.length > 0 && (
        <button
          onClick={onAddChord}
          disabled={section.chords.length >= MAX_CHORDS}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
            section.chords.length >= MAX_CHORDS
              ? 'border-white/[0.03] text-slate-700 cursor-not-allowed'
              : 'border-white/[0.1] text-slate-400 hover:text-white hover:border-[#FF007A]/40 hover:bg-[#FF007A]/[0.06]'
          }`}
        >
          <Plus size={12} />
          Add Chord
        </button>
      )}
    </motion.div>
  )
}
