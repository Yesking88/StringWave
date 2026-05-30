import { useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Square, Save, FolderOpen, Plus, X, Music2, Guitar, Mic,
  Trash2, Clock, ChevronDown, Sparkles, Shuffle, SlidersHorizontal,
  Drum, Sliders,
} from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import chordProgressionBg from '../assets/chord-progression-new.png'
import ProgressionSection from '../components/progression/ProgressionSection'
import MixerPanel from '../components/progression/MixerPanel'
import { CHORDS } from '../data/chords'
import { useProgressionPlayer } from '../hooks/useProgressionPlayer'
import { useSavedProgressions } from '../hooks/useSavedProgressions'
import { DEFAULT_MIX } from '../utils/progressionAudio'

// ── Constants ─────────────────────────────────────────────────────────────────
const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

// ── Rhythmic Style definitions ────────────────────────────────────────────────
const STYLES = [
  {
    id: 'pop',
    label: 'Pop / Rock',
    description: 'Quarter-note strums, Kick on 1+3, Snare on 2+4',
    color: '#FF007A',
  },
  {
    id: 'arpeggio',
    label: 'Arpeggio',
    description: 'Rolling 8th-note guitar picking, soft piano pad',
    color: '#7B00FF',
  },
  {
    id: 'sustained',
    label: 'Sustained',
    description: 'Single whole-note strum, clean and minimal',
    color: '#FF7300',
  },
  {
    id: 'jazz',
    label: 'Jazz Swing',
    description: 'Swing syncopation, soft guitar comping, walking bassline',
    color: '#10b981',
  },
  {
    id: 'neosoul',
    label: 'Neo-Soul',
    description: 'Laid-back groovy chords, warm Rhodes pad, syncopated bass',
    color: '#3b82f6',
  },
  {
    id: 'blues',
    label: 'Blues Shuffle',
    description: '12-bar shuffle pattern comping, triplet swing drums',
    color: '#fbbf24',
  },
]

// ── Genre Templates ───────────────────────────────────────────────────────────
const GENRE_TEMPLATES = {
  Pop:   { label: 'Pop',   color: '#f472b6', description: 'I – V – vi – IV', degrees: [
    { degree: 1, quality: 'major' },
    { degree: 5, quality: 'major' },
    { degree: 6, quality: 'minor' },
    { degree: 4, quality: 'major' },
  ]},
  Rock:  { label: 'Rock',  color: '#ef4444', description: 'I – IV – V',      degrees: [
    { degree: 1, quality: 'major' },
    { degree: 4, quality: 'major' },
    { degree: 5, quality: 'major' },
  ]},
  Blues: { label: 'Blues', color: '#60a5fa', description: '12-Bar Blues',    degrees: [
    { degree: 1, quality: 'dominant7' },
    { degree: 1, quality: 'dominant7' },
    { degree: 1, quality: 'dominant7' },
    { degree: 1, quality: 'dominant7' },
    { degree: 4, quality: 'dominant7' },
    { degree: 4, quality: 'dominant7' },
    { degree: 1, quality: 'dominant7' },
    { degree: 1, quality: 'dominant7' },
    { degree: 5, quality: 'dominant7' },
    { degree: 4, quality: 'dominant7' },
    { degree: 1, quality: 'dominant7' },
    { degree: 5, quality: 'dominant7' },
  ]},
  Jazz:  { label: 'Jazz',  color: '#fbbf24', description: 'ii – V – I – VI', degrees: [
    { degree: 2, quality: 'min7' },
    { degree: 5, quality: 'dominant7' },
    { degree: 1, quality: 'maj7' },
    { degree: 6, quality: 'dominant7' },
  ]},
  Folk:  { label: 'Folk',  color: '#4ade80', description: 'I – V – vi – iii – IV', degrees: [
    { degree: 1, quality: 'major' },
    { degree: 5, quality: 'major' },
    { degree: 6, quality: 'minor' },
    { degree: 3, quality: 'minor' },
    { degree: 4, quality: 'major' },
  ]},
}

const MAJOR_INTERVALS    = [0, 2, 4, 5, 7, 9, 11]
const KEY_TO_SEMITONE    = { 'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11 }
const SEMITONE_TO_ROOTS  = { 0:['C'],1:['C#','Db'],2:['D'],3:['D#','Eb'],4:['E'],5:['F'],6:['F#','Gb'],7:['G'],8:['G#','Ab'],9:['A'],10:['Bb','A#'],11:['B'] }

function getChordRoot(name) {
  if (!name) return ''
  if (/^(C#|D#|F#|G#|A#|Db|Eb|Gb|Ab|Bb)/.test(name)) return name.slice(0, 2)
  return name.charAt(0)
}

function resolveChordId(key, degree, quality) {
  const rootSemitone   = KEY_TO_SEMITONE[key]
  if (rootSemitone === undefined) return CHORDS[0].id
  const targetSemitone = (rootSemitone + (MAJOR_INTERVALS[degree - 1] || 0)) % 12
  const allowed        = SEMITONE_TO_ROOTS[targetSemitone] || ['C']
  const try1 = CHORDS.find(c => c.category === quality && allowed.includes(getChordRoot(c.name)))
  if (try1) return try1.id
  const fb = (quality === 'dominant7' || quality === 'maj7' || quality === 'sus' || quality === 'aug' || quality === 'other') ? 'major' : 'minor'
  const try2 = CHORDS.find(c => c.category === fb && allowed.includes(getChordRoot(c.name)))
  if (try2) return try2.id
  const try3 = CHORDS.find(c => c.category === (fb === 'major' ? 'minor' : 'major') && allowed.includes(getChordRoot(c.name)))
  if (try3) return try3.id
  const try4 = CHORDS.find(c => allowed.includes(getChordRoot(c.name)))
  if (try4) return try4.id
  return CHORDS[0].id
}

function generateSlots(genreKey, key) {
  const template = GENRE_TEMPLATES[genreKey]
  if (!template) return []
  return template.degrees.map(({ degree, quality }) => ({
    id: crypto.randomUUID(), chordId: resolveChordId(key, degree, quality), beats: 2,
  }))
}

const GENRE_PILLS = [
  ...Object.entries(GENRE_TEMPLATES).map(([id, g]) => ({ id, ...g })),
  { id: 'Random', label: 'Random', color: '#818cf8', description: 'Surprise me' },
]

const DEFAULT_SECTION = (label = 'Verse') => ({ id: crypto.randomUUID(), label, chords: [] })
const DEFAULT_SLOT    = (chordId = null, beats = 2) => ({ id: crypto.randomUUID(), chordId, beats })

function formatDate(ts) {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ProgressionGenerator() {
  // Global controls
  const [selectedKey, setSelectedKey] = useState('C')
  const [bpm,         setBpm]         = useState(90)
  const [style,       setStyle]       = useState('pop')
  const [mix,         setMix]         = useState(DEFAULT_MIX)
  const [sections,    setSections]    = useState([DEFAULT_SECTION('Verse')])
  const [activeSectionId, setActiveSectionId] = useState(() => sections[0]?.id ?? null)

  // Modal / popover states
  const [saveModalOpen,   setSaveModalOpen]   = useState(false)
  const [loadModalOpen,   setLoadModalOpen]   = useState(false)
  const [genrePopover,    setGenrePopover]    = useState(false)
  const [keyDropdownOpen, setKeyDropdownOpen] = useState(false)
  const [mixerOpen,       setMixerOpen]       = useState(false)
  const [saveName,        setSaveName]        = useState('')
  const [saveError,       setSaveError]       = useState('')
  const genreButtonRef = useRef(null)
  const mixerButtonRef = useRef(null)

  // Chord lookup map
  const chordsMap = useMemo(() => {
    const map = new Map()
    CHORDS.forEach(c => map.set(c.id, c))
    return map
  }, [])

  // Player
  const { isPlaying, playingSlotId, play, stop } = useProgressionPlayer({
    sections, bpm, style, mix, chordsMap,
  })

  const handlePlayStop = useCallback(() => {
    if (isPlaying) stop(); else play()
  }, [isPlaying, play, stop])

  // Mixer channel change handler
  const handleMixChange = useCallback((channel, patch) => {
    setMix(prev => ({ ...prev, [channel]: { ...prev[channel], ...patch } }))
  }, [])

  // Count how many channels are enabled
  const enabledCount = Object.values(mix).filter(c => c.enabled).length

  // Saved progressions
  const { list: savedList, save: saveProgression, load: loadProgression, remove: removeProgression } = useSavedProgressions()

  const handleSave = useCallback(() => {
    const name = saveName.trim()
    if (!name) { setSaveError('Please enter a name.'); return }
    saveProgression(name, { key: selectedKey, bpm, style, mix, sections })
    setSaveModalOpen(false); setSaveName(''); setSaveError('')
  }, [saveName, saveProgression, selectedKey, bpm, style, mix, sections])

  const handleLoad = useCallback((id) => {
    const prog = loadProgression(id)
    if (!prog) return
    if (isPlaying) stop()
    setSelectedKey(prog.key ?? 'C')
    setBpm(prog.bpm ?? 90)
    setStyle(prog.style ?? 'pop')
    if (prog.mix) setMix(prog.mix)
    const loaded = prog.sections ?? [DEFAULT_SECTION()]
    setSections(loaded)
    setActiveSectionId(loaded[0]?.id ?? null)
    setLoadModalOpen(false)
  }, [loadProgression, isPlaying, stop])

  // Genre generation
  const applyGenre = useCallback((genreKey) => {
    const targetId = activeSectionId || sections[0]?.id
    if (!targetId) return
    const targetSection = sections.find(s => s.id === targetId)
    const hasChords = targetSection?.chords.some(c => c.chordId)
    const doApply = () => {
      const actualGenre = genreKey === 'Random'
        ? Object.keys(GENRE_TEMPLATES)[Math.floor(Math.random() * Object.keys(GENRE_TEMPLATES).length)]
        : genreKey
      const slots = generateSlots(actualGenre, selectedKey)
      if (actualGenre === 'Blues') {
        const firstPart  = slots.slice(0, 8)
        const secondPart = slots.slice(8, 12)
        setSections(prev => {
          const idx = prev.findIndex(s => s.id === targetId)
          if (idx === -1) return prev
          const updated = [...prev]
          updated[idx] = { ...updated[idx], chords: firstPart }
          updated.splice(idx + 1, 0, { id: crypto.randomUUID(), label: 'Blues Turnaround', chords: secondPart })
          return updated
        })
      } else {
        setSections(prev => prev.map(s => s.id === targetId ? { ...s, chords: slots } : s))
      }
    }
    if (hasChords) { if (window.confirm('Replace existing chords in this section?')) doApply() }
    else doApply()
    setGenrePopover(false)
  }, [activeSectionId, sections, selectedKey])

  // Section mutations
  const addSection    = useCallback(() => {
    const labels = ['Verse', 'Chorus', 'Bridge', 'Outro', 'Pre-Chorus', 'Intro', 'Solo']
    const newSection = DEFAULT_SECTION(`${labels[sections.length % labels.length]} ${sections.length + 1}`)
    setSections(prev => [...prev, newSection])
    setActiveSectionId(newSection.id)
  }, [sections.length])

  const deleteSection = useCallback((sectionId) => {
    setSections(prev => {
      const next = prev.filter(s => s.id !== sectionId)
      if (activeSectionId === sectionId) setActiveSectionId(next[0]?.id ?? null)
      return next
    })
  }, [activeSectionId])

  const updateLabel   = useCallback((sectionId, label) =>
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, label } : s)), [])

  const addChord      = useCallback((sectionId) =>
    setSections(prev => prev.map(s =>
      s.id === sectionId && s.chords.length < 8 ? { ...s, chords: [...s.chords, DEFAULT_SLOT()] } : s
    )), [])

  const removeChord   = useCallback((sectionId, slotId) =>
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, chords: s.chords.filter(c => c.id !== slotId) } : s
    )), [])

  const selectChord   = useCallback((sectionId, slotId, chordId) =>
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, chords: s.chords.map(c => c.id === slotId ? { ...c, chordId } : c) } : s
    )), [])

  const changeBeats   = useCallback((sectionId, slotId, beats) =>
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, chords: s.chords.map(c => c.id === slotId ? { ...c, beats } : c) } : s
    )), [])

  const reorderChords = useCallback((sectionId, newOrder) =>
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, chords: newOrder } : s)), [])

  const handleSectionFocus = useCallback((sectionId) => setActiveSectionId(sectionId), [])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <PageWrapper bgImage={chordProgressionBg} className="flex flex-col px-4 sm:px-6 lg:px-8 pb-16" overlayGradient="bg-black/75">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(204,0,170,0.2) 0%, transparent 70%)', filter: 'blur(90px)' }}
        />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(255,0,122,0.2) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
      </div>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="w-full max-w-5xl mx-auto px-4 text-center mb-2 relative z-10 pt-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: '#CC00AA' }}>
          Creative Tools
        </p>
        <h1 className="gradient-text font-display text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight flex items-center justify-center gap-3" style={{ textShadow: '0 0 20px rgba(255, 0, 122, 0.15)' }}>
          <Sliders className="text-[#FF007A]" size={32} strokeWidth={2} />
          <span>Progression Builder</span>
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Build and play chord progressions in any key with real instruments.
        </p>
      </div>

      {/* ── Sticky Controls Bar ────────────────────────────────────────────── */}
      <div className="sticky top-[64px] z-30 w-full max-w-5xl mx-auto px-4 py-2">
        <div style={{
          position: 'relative', zIndex: 10,
          paddingTop: 18, paddingBottom: 18, paddingLeft: 20, paddingRight: 20,
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(10, 10, 20, 0.55)',
          border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 24,
        }}>
          {/* Row 1 — Main controls */}
          <div className="flex flex-wrap items-center gap-4">

            {/* Key Selector */}
            <div className="relative flex items-center gap-2.5">
              <span className="text-white/80 text-[11px] uppercase tracking-widest shrink-0 font-bold">Key</span>
              <button
                onClick={() => setKeyDropdownOpen(v => !v)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.07] border border-white/[0.15] rounded-xl text-sm font-bold transition-all duration-200 text-white hover:bg-white/[0.12] active:scale-95 cursor-pointer min-w-[52px] justify-center"
              >
                {selectedKey}
                <ChevronDown size={11} className={`transition-transform duration-200 ${keyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {keyDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[49]" onClick={() => setKeyDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-0 top-full mt-2 z-[50] w-32 rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_40px_rgba(255,0,122,0.2)]"
                      style={{ background: 'rgba(10,10,20,0.97)', backdropFilter: 'blur(24px)' }}
                    >
                      <div className="py-1 max-h-60 overflow-y-auto">
                        {KEYS.map(k => (
                          <button key={k} onClick={() => { setSelectedKey(k); setKeyDropdownOpen(false) }}
                            className={`w-full px-4 py-2 hover:bg-white/[0.04] transition-colors text-left text-xs font-semibold ${selectedKey === k ? 'text-[#CC00AA] bg-white/[0.02]' : 'text-white'}`}
                          >
                            {k}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-white/10 shrink-0" />

            {/* BPM Slider */}
            <div className="flex items-center gap-3 min-w-[180px] max-w-[240px] flex-1">
              <span className="text-white/80 text-[11px] uppercase tracking-widest shrink-0 font-bold">BPM</span>
              <div className="flex-1 relative flex items-center h-6 select-none">
                <div className="absolute left-0 right-0 h-[3px] bg-white/10 border border-white/5 rounded-full pointer-events-none" />
                <div className="absolute h-[3px] rounded-full pointer-events-none"
                  style={{ background: 'var(--gradient-cta)', left: 0, width: `${((bpm - 40) / 160) * 100}%` }}
                />
                <input type="range" min="40" max="200" value={bpm} onChange={e => setBpm(Number(e.target.value))}
                  className="w-full h-6 appearance-none bg-transparent cursor-pointer focus:outline-none relative z-10"
                  style={{ WebkitAppearance: 'none', outline: 'none' }}
                />
              </div>
              <span className="text-sm font-bold text-[#CC00AA] w-10 text-right tabular-nums">{bpm}</span>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-white/10 shrink-0" />

            {/* Generate Popover */}
            <div className="relative">
              <button ref={genreButtonRef} onClick={() => setGenrePopover(v => !v)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 text-[#FF007A] bg-[#FF007A]/10 border border-[#FF007A]/25 hover:bg-[#FF007A]/20 hover:border-[#FF007A]/40 active:scale-95"
              >
                <Sparkles size={13} />
                Generate
                <ChevronDown size={11} className={`transition-transform duration-200 ${genrePopover ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {genrePopover && (
                  <>
                    <div className="fixed inset-0 z-[49]" onClick={() => setGenrePopover(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -4 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-0 top-full mt-2 z-[50] w-56 rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_40px_rgba(255,0,122,0.2)]"
                      style={{ background: 'rgba(10,10,20,0.97)', backdropFilter: 'blur(24px)' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="px-3 pt-2.5 pb-1 border-b border-white/[0.05]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Auto-fill active section</p>
                      </div>
                      <div className="py-1.5">
                        {[...Object.entries(GENRE_TEMPLATES), ['Random', { label: 'Random', color: '#818cf8', description: 'Picks a random genre' }]].map(([id, g]) => (
                          <button key={id} onClick={() => applyGenre(id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: g.color }} />
                            <div>
                              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                                {id === 'Random' && <Shuffle size={10} className="text-indigo-400" />}
                                {g.label}
                              </div>
                              <div className="text-[10px] text-slate-500">{g.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Play / Stop */}
            <motion.button
              onClick={handlePlayStop}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all duration-200 active:scale-95 border ${
                isPlaying
                  ? 'bg-red-500/15 border-red-500/30 hover:bg-red-500/25'
                  : 'bg-[#FF007A]/10 border-[#FF007A]/25 hover:bg-[#FF007A]/20 hover:border-[#FF007A]/40'
              }`}
              animate={isPlaying ? { boxShadow: ['0 0 0 0px rgba(239,68,68,0.4)', '0 0 0 6px rgba(239,68,68,0)'] } : {}}
              transition={isPlaying ? { duration: 1.6, repeat: Infinity, ease: [0.22, 1, 0.36, 1] } : {}}
            >
              {isPlaying ? <Square size={13} fill="currentColor" className="text-red-400" /> : <Play size={13} fill="currentColor" className="text-[#FF007A]" />}
              {isPlaying ? 'Stop' : 'Play'}
            </motion.button>

            {/* Mixer button (pushed right) */}
            <div className="flex items-center gap-1.5 ml-auto">
              {/* Mixer popover trigger */}
              <div className="relative" ref={mixerButtonRef}>
                <button
                  id="mixer-toggle"
                  onClick={() => setMixerOpen(v => !v)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    mixerOpen
                      ? 'bg-[#7B00FF]/20 border-[#7B00FF]/40 text-white'
                      : 'bg-white/[0.04] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <SlidersHorizontal size={12} />
                  Mixer
                  {enabledCount < 4 && (
                    <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                      style={{ background: '#FF007A', color: '#fff' }}>
                      {enabledCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {mixerOpen && (
                    <MixerPanel
                      mix={mix}
                      onChange={handleMixChange}
                      onClose={() => setMixerOpen(false)}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Save & Load */}
              <button onClick={() => { setSaveModalOpen(true); setSaveName('') }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.08] transition-all text-xs font-semibold"
              >
                <Save size={12} />
                Save
              </button>
              <button onClick={() => setLoadModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.08] transition-all text-xs font-semibold"
              >
                <FolderOpen size={12} />
                Load
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.08] my-3" />

          {/* Row 2 — Style selector + Quick Fill genre pills */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">

            {/* Style pills */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white/50 text-[10px] uppercase tracking-widest font-bold shrink-0">Style:</span>
              <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/10 rounded-xl p-0.5">
                {STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    title={s.description}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                      style === s.id
                        ? 'bg-white/[0.12] text-white border border-white/10 shadow-sm'
                        : 'text-white/50 hover:text-white/80 border border-transparent'
                    }`}
                    style={style === s.id ? { color: s.color } : {}}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-4 w-px bg-white/10 shrink-0 hidden sm:block" />

            {/* Quick Fill genre pills */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-1">
              <span className="text-white/50 text-[10px] uppercase tracking-widest shrink-0 font-bold">Fill:</span>
              {GENRE_PILLS.map(genre => (
                <button
                  key={genre.id}
                  onClick={() => applyGenre(genre.id)}
                  className="shrink-0 flex items-center gap-1.5 py-1 px-2.5 bg-white/[0.04] border border-white/[0.08] rounded-full text-[10px] font-semibold leading-normal transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer hover:border-white/20"
                  style={{ color: genre.color }}
                >
                  {genre.id === 'Random' && <Shuffle size={9} />}
                  {genre.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sections List ──────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 pt-6 pb-20 flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {sections.map(section => (
            <div
              key={section.id}
              onClick={() => handleSectionFocus(section.id)}
              className={`rounded-2xl transition-all duration-300 ${activeSectionId === section.id ? 'ring-1 ring-[#CC00AA]/40 ring-offset-0' : ''}`}
            >
              <ProgressionSection
                section={section}
                chordsMap={chordsMap}
                playingSlotId={playingSlotId}
                canDelete={sections.length > 1}
                onLabelChange={label => updateLabel(section.id, label)}
                onDelete={() => deleteSection(section.id)}
                onAddChord={() => addChord(section.id)}
                onRemoveChord={slotId => removeChord(section.id, slotId)}
                onSelectChord={(slotId, chordId) => selectChord(section.id, slotId, chordId)}
                onBeatsChange={(slotId, beats) => changeBeats(section.id, slotId, beats)}
                onReorder={newOrder => reorderChords(section.id, newOrder)}
              />
            </div>
          ))}
        </AnimatePresence>

        <button onClick={addSection}
          className="mt-1 flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-dashed border-white/10 text-slate-500 hover:text-white hover:border-[#FF007A]/40 hover:bg-[#FF007A]/[0.05] transition-all duration-200 text-sm font-semibold"
        >
          <Plus size={14} />
          Add Section
        </button>

        {sections.length === 1 && sections[0].chords.length === 0 && (
          <p className="text-white/20 text-sm text-center mt-6 select-none">
            Build your progression above, then hit Play to hear it
          </p>
        )}
      </div>

      {/* ── Save Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {saveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(10,10,20,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSaveModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl"
              style={{ background: 'rgba(12,12,22,0.98)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white font-display">Save Progression</h2>
                <button onClick={() => setSaveModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <input autoFocus type="text" placeholder="Progression name…" value={saveName}
                onChange={e => { setSaveName(e.target.value); setSaveError('') }}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                maxLength={48}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 outline-none focus:border-[#FF007A]/50 mb-1 transition-colors"
              />
              {saveError && <p className="text-xs text-red-400 mb-2">{saveError}</p>}
              <p className="text-[11px] text-slate-500 mb-4">
                {sections.reduce((t, s) => t + s.chords.length, 0)} chords · {bpm} BPM · {style} style · Key of {selectedKey}
              </p>
              <button onClick={handleSave}
                className="w-full py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'var(--gradient-cta)' }}
              >
                Save
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Load Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {loadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(10,10,20,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setLoadModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
              style={{ background: 'rgba(12,12,22,0.98)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <h2 className="text-sm font-bold text-white font-display">Saved Progressions</h2>
                <button onClick={() => setLoadModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[380px]">
                {savedList.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">No saved progressions yet.</div>
                ) : (
                  savedList.map(prog => (
                    <div key={prog.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-sm font-semibold text-white truncate">{prog.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                          <span>{prog.key} · {prog.bpm}bpm · {prog.style ?? prog.instrument ?? 'pop'}</span>
                          <span className="flex items-center gap-0.5">
                            <Clock size={9} />{formatDate(prog.savedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleLoad(prog.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#FF007A]/15 border border-[#FF007A]/20 text-[#FF007A] hover:bg-[#FF007A]/30 text-[11px] font-bold transition-all"
                        >
                          Load
                        </button>
                        <button onClick={() => removeProgression(prog.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
