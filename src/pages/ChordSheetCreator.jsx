import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Trash2, FolderOpen, Plus, Search, Info, HelpCircle, FileText, Check, Globe, X } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import { CHORDS } from '../data/chords'
import { playChordStrum } from '../utils/tonePlayer'
import ChordDiagram from '../components/chords/ChordDiagram'

const DEFAULT_SHEET = `[G]Yesterday, all my [Bm]troubles seemed so [Em]far away
[C]Now it [D]looks as though they're [G]here to stay
Oh, [Em]I be[A]lieve in [C]yester[G]day

[G]Suddenly, I'm not [Bm]half the man I [Em]used to be
[C]There's a [D]shadow hanging [G]over me
Oh, [Em]yester[A]day came [C]sudden[G]ly`

// Regex lyric cleaning function to strip Genius/Scraper garbage
const cleanLyricsText = (raw) => {
  if (!raw) return ''
  return raw
    .split('\n')
    .filter(line => {
      const trimmed = line.trim().toLowerCase()
      if (!trimmed) return true // Keep empty lines
      
      // Scraper / Cookie / genius lyrics pages patterns
      if (/^\d+\s+contributors/i.test(trimmed) || trimmed.includes('contributors')) return false
      if (trimmed.includes('cookie policy') || trimmed.includes('terms of use') || trimmed.includes('privacy policy') || trimmed.includes('cookie settings')) return false
      if (trimmed.includes('you might also like') || trimmed.includes('embed share')) return false
      if (trimmed.includes('genius translation') || trimmed.includes('genius romanizations')) return false
      if (trimmed === 'lyrics' || trimmed.endsWith(' lyrics')) {
        if (trimmed.length < 50) return false
      }
      if (trimmed.includes('more on genius') || trimmed.includes('about genius')) return false
      return true
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple consecutive empty lines to 2
    .trim()
}

export default function ChordSheetCreator() {
  const [sheetTitle, setSheetTitle] = useState('')
  const [sheetText, setSheetText] = useState('')
  const [savedSheets, setSavedSheets] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showLoadSidebar, setShowLoadSidebar] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState(false)

  // Sequencer playback states
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(120)
  const [activeStep, setActiveStep] = useState(null)

  // Web Import modal states
  const [showImportModal, setShowImportModal] = useState(false)
  const [importTab, setImportTab] = useState('search') // 'search' | 'paste'
  const [importArtist, setImportArtist] = useState('')
  const [importTitle, setImportTitle] = useState('')
  const [importError, setImportError] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [rawPasteText, setRawPasteText] = useState('')

  const textareaRef = useRef(null)
  const playIntervalRef = useRef(null)
  const activeStepRef = useRef(0)

  // Load sheets from local storage
  useEffect(() => {
    const loaded = localStorage.getItem('stringwave_chord_sheets')
    if (loaded) {
      try {
        setSavedSheets(JSON.parse(loaded))
      } catch (err) {
        console.warn('Failed to load chord sheets:', err)
      }
    }
  }, [])

  // Filter chord list based on search
  const filteredChords = useMemo(() => {
    if (!searchQuery) {
      // Show default popular chords
      const popular = ['G', 'C', 'D', 'Em', 'Am', 'F', 'A', 'Bm', 'Dm', 'E', 'B', 'F#m']
      return CHORDS.filter(c => popular.includes(c.name)).slice(0, 24)
    }
    const q = searchQuery.toLowerCase()
    return CHORDS.filter(c => c.name.toLowerCase().includes(q) || c.fullName.toLowerCase().includes(q)).slice(0, 24)
  }, [searchQuery])

  // Parse all chords sequentially from lyrics to create timeline
  const chordTimeline = useMemo(() => {
    const regex = /\[([^\]]+)\]/g
    const timeline = []
    let match
    while ((match = regex.exec(sheetText)) !== null) {
      timeline.push({ name: match[1], index: match.index })
    }
    return timeline
  }, [sheetText])

  // Sync active step to ref for interval access
  useEffect(() => {
    if (activeStep !== null) {
      activeStepRef.current = activeStep
    }
  }, [activeStep])

  // Downward acoustic guitar strum using existing chord player hooks
  const triggerStrum = (chordName) => {
    const found = CHORDS.find(c => c.name === chordName)
    if (found) {
      try {
        // Strum triggering has a 250ms decay release stage configured in tonePlayer
        playChordStrum(found.frets)
      } catch (_) {}
    }
  }

  // Playback transport triggers
  const startSequencer = () => {
    if (chordTimeline.length === 0) return
    setIsPlaying(true)
    activeStepRef.current = 0
    setActiveStep(0)
    triggerStrum(chordTimeline[0].name)
  }

  const stopSequencer = () => {
    setIsPlaying(false)
    setActiveStep(null)
    activeStepRef.current = 0
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
      playIntervalRef.current = null
    }
  }

  // Audio Sequencer Scheduler Loop
  useEffect(() => {
    if (isPlaying && chordTimeline.length > 0) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }

      const intervalMs = (60 / bpm) * 1000

      playIntervalRef.current = setInterval(() => {
        const nextStep = (activeStepRef.current + 1) % chordTimeline.length
        activeStepRef.current = nextStep
        setActiveStep(nextStep)
        triggerStrum(chordTimeline[nextStep].name)
      }, intervalMs)
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [bpm, isPlaying, chordTimeline])

  // Handle timeline bounds or empty values during playback
  useEffect(() => {
    if (isPlaying && chordTimeline.length === 0) {
      stopSequencer()
    }
    if (isPlaying && activeStep !== null && activeStep >= chordTimeline.length) {
      setActiveStep(0)
    }
  }, [chordTimeline, isPlaying, activeStep])

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

  // Save sheet handler
  const handleSave = () => {
    const title = sheetTitle.trim() || 'Untitled Sheet'
    const newSheet = {
      id: Date.now().toString(),
      title,
      text: sheetText,
      updatedAt: Date.now()
    }
    const updated = [newSheet, ...savedSheets.filter(s => s.id !== newSheet.id)]
    setSavedSheets(updated)
    localStorage.setItem('stringwave_chord_sheets', JSON.stringify(updated))
    
    setSaveFeedback(true)
    setTimeout(() => setSaveFeedback(false), 2000)
  }

  // Delete sheet
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this song sheet?')) {
      const updated = savedSheets.filter(s => s.id !== id)
      setSavedSheets(updated)
      localStorage.setItem('stringwave_chord_sheets', JSON.stringify(updated))
    }
  }

  // Load sheet
  const handleLoadSelect = (sheet) => {
    setSheetTitle(sheet.title)
    setSheetText(sheet.text)
    setShowLoadSidebar(false)
    stopSequencer()
  }

  // Clear text
  const handleClear = () => {
    if (window.confirm('Clear all lyrics and chord tags?')) {
      setSheetText('')
      stopSequencer()
    }
  }

  // Insert chord tag at current cursor selection
  const insertChordToken = (chordName) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)
    const token = `[${chordName}]`
    const newValue = before + token + after

    setSheetText(newValue)

    // Restore cursor position directly after token
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + token.length, start + token.length)
    }, 0)

    // Play preview audio of the stamped chord
    const chordObj = CHORDS.find(c => c.name === chordName)
    if (chordObj) {
      try {
        playChordStrum(chordObj.frets)
      } catch (_) {}
    }
  }

  // Chord sheet line parser
  const parseLineSegments = (line) => {
    const regex = /\[([^\]]+)\]/g
    let match
    let lastIndex = 0
    const segments = []

    if (!line.match(regex)) {
      return [{ chord: null, text: line || ' ' }]
    }

    while ((match = regex.exec(line)) !== null) {
      const chordName = match[1]
      const matchIndex = match.index

      // Grab text preceding the chord token
      if (matchIndex > lastIndex) {
        segments.push({ chord: null, text: line.substring(lastIndex, matchIndex) })
      }

      // Grab text aligned with this chord up to next chord or end
      const nextBracket = line.indexOf('[', regex.lastIndex)
      const textEnd = nextBracket === -1 ? line.length : nextBracket
      const text = line.substring(regex.lastIndex, textEnd)

      segments.push({ chord: chordName, text })
      lastIndex = textEnd
      regex.lastIndex = textEnd
    }

    return segments
  }

  // Split content by lines
  const sheetLines = useMemo(() => {
    return sheetText.split('\n')
  }, [sheetText])

  // Ingestion: Web Fetch Request
  const handleFetchLyrics = async () => {
    setImportError('')
    if (!importArtist.trim() || !importTitle.trim()) {
      setImportError('Please enter both artist name and song title.')
      return
    }
    setImportLoading(true)
    try {
      const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(importArtist.trim())}/${encodeURIComponent(importTitle.trim())}`)
      if (!res.ok) {
        throw new Error('Lyrics not found or API down. Try another song or use Quick Clean Paste!')
      }
      const data = await res.json()
      if (!data.lyrics) {
        throw new Error('No lyrics returned for this song.')
      }

      const cleanText = cleanLyricsText(data.lyrics)
      setSheetText(cleanText)
      setSheetTitle(`${importTitle.trim()} (${importArtist.trim()})`)
      setShowImportModal(false)
      setImportArtist('')
      setImportTitle('')
      stopSequencer()
    } catch (err) {
      setImportError(err.message || 'An error occurred during fetch.')
    } finally {
      setImportLoading(false)
    }
  }

  // Ingestion: Quick Clean Paste
  const handleCleanPasteImport = () => {
    setImportError('')
    if (!rawPasteText.trim()) {
      setImportError('Please paste some text first.')
      return
    }

    const cleanText = cleanLyricsText(rawPasteText)
    setSheetText(cleanText)

    // Try to guess title from first line or default
    const lines = cleanText.split('\n')
    const estimatedTitle = lines[0] && lines[0].length < 40 ? lines[0] : 'Imported Song'
    setSheetTitle(estimatedTitle)

    setShowImportModal(false)
    setRawPasteText('')
    stopSequencer()
  }

  return (
    <PageWrapper className="px-4 sm:px-6 lg:px-8 pb-16 flex flex-col">
      
      {/* Header */}
      <div className="relative z-10 text-center pb-6 pt-6 flex flex-col items-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: '#FF007A' }}>
          Creative Tools
        </span>
        <h1 className="gradient-text font-display leading-normal tracking-tight font-extrabold mb-1 text-4xl sm:text-5xl flex items-center justify-center gap-3" style={{ textShadow: '0 0 20px rgba(255, 0, 122, 0.15)' }}>
          <FileText className="text-[#FF007A]" size={40} strokeWidth={2} />
          <span>Chord Sheet Creator</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-xs leading-normal">
          Type your song lyrics, select chords to insert tags, and visualize dynamic interactive chord charts instantly.
        </p>
      </div>

      {/* Main Board */}
      <div className="relative z-10 max-w-6xl mx-auto w-full flex flex-col gap-4">
        
        {/* Top Control Action Bar */}
        <div className="glass p-4 rounded-2xl border border-white/5 bg-slate-950/40 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-64">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Song Title / Artist</span>
              <input
                type="text"
                value={sheetTitle}
                onChange={e => setSheetTitle(e.target.value)}
                placeholder="Yesterday - The Beatles..."
                className="w-full h-10 px-3 rounded-xl border border-white/10 bg-neutral-900/60 text-gray-200 text-sm font-semibold focus:outline-none focus:border-[#FF007A]/50 focus:ring-1 focus:ring-[#FF007A]/40 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-4 h-10 bg-[#FF007A]/10 border border-[#FF007A]/25 rounded-xl text-[#FF007A] hover:bg-[#FF007A]/20 transition-all text-xs font-semibold cursor-pointer"
            >
              <Globe size={14} />
              Import Song from Web
            </button>
            <button
              onClick={() => setShowLoadSidebar(true)}
              className="flex items-center gap-1.5 px-4 h-10 bg-white/[0.04] border border-white/10 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.08] transition-all text-xs font-semibold cursor-pointer"
            >
              <FolderOpen size={14} />
              Open Sheets ({savedSheets.length})
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-4 h-10 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-all text-xs font-semibold cursor-pointer"
            >
              <Trash2 size={14} />
              Clear
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 h-10 rounded-xl text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_0_15px_rgba(255,0,122,0.25)] border border-[#FF007A]/20"
              style={{ background: 'var(--gradient-cta)' }}
            >
              {saveFeedback ? (
                <>
                  <Check size={14} />
                  Saved!
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Sheet
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dual Split Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
          
          {/* LEFT PANE - EDITOR INPUT */}
          <div className="glass p-5 rounded-3xl border border-white/5 bg-slate-950/40 backdrop-blur-xl flex flex-col gap-4">
            
            {/* Chord Search / Select Stamp Toolbar */}
            <div className="flex flex-col gap-3 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Chord Selector Stamp</span>
                
                {/* Micro Search Input */}
                <div className="relative w-44">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search chord (e.g. C7)"
                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-white/10 bg-neutral-900/60 text-slate-200 text-xs font-semibold focus:outline-none focus:border-[#FF007A]/40 transition-all"
                  />
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {/* Grid of Chord stamp badges */}
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 select-none">
                {filteredChords.length === 0 ? (
                  <span className="text-[10px] text-slate-600 font-bold p-1">No chords match your search query.</span>
                ) : (
                  filteredChords.map(c => (
                    <button
                      key={c.id}
                      onClick={() => insertChordToken(c.name)}
                      className="px-2 py-1 rounded bg-white/[0.04] hover:bg-[#FF007A]/15 border border-white/[0.08] hover:border-[#FF007A]/30 text-white text-[11px] font-bold transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      {c.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Input Editor Textarea */}
            <div className="flex-1 flex flex-col gap-2 relative">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Editor Input (Brackets denote chord placement)</span>
              <textarea
                ref={textareaRef}
                value={sheetText}
                onChange={e => setSheetText(e.target.value)}
                placeholder="Type lyrics here. Use the buttons above to insert chords, or type them directly in brackets e.g. [C]Yesterday..."
                className="w-full flex-1 min-h-[360px] p-4 rounded-2xl border border-white/10 bg-slate-950/20 text-slate-200 text-sm font-mono focus:outline-none focus:border-[#FF007A]/60 focus:ring-1 focus:ring-[#FF007A]/40 shadow-inner focus:shadow-[0_0_15px_rgba(255,0,122,0.15)] transition-all leading-normal"
              />
            </div>
          </div>

          {/* RIGHT PANE - LIVE PREVIEW PANEL */}
          <div className="glass p-5 rounded-3xl border border-white/5 bg-slate-950/50 backdrop-blur-2xl shadow-2xl flex flex-col gap-4 relative overflow-visible">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-slate-950/10 via-transparent to-slate-950/20" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.06] pb-3 gap-3 z-10">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Live Chord Sheet Preview</span>
              
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold bg-white/5 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                <Info size={11} className="text-slate-500" />
                <span>Hover chords to view diagrams</span>
              </div>
            </div>

            {/* Floating Transport Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-white/5 bg-slate-950/65 backdrop-blur-md z-10 leading-normal select-none">
              <div className="flex items-center gap-3">
                {/* Play/Stop Button */}
                {isPlaying ? (
                  <button
                    onClick={stopSequencer}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/35 text-red-400 font-bold transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Stop Playback"
                  >
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={startSequencer}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF007A]/20 hover:bg-[#FF007A]/30 border border-[#FF007A]/35 text-[#FF007A] font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(255,0,122,0.15)]"
                    title="Play Chord Sequencer"
                  >
                    <svg className="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                )}

                {/* BPM Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-black tracking-wider text-slate-500">BPM</span>
                  <input
                    type="range"
                    min="60"
                    max="160"
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value))}
                    className="w-20 sm:w-28 accent-[#FF007A] cursor-ew-resize h-1 bg-white/10 rounded-lg appearance-none"
                  />
                  <span className="text-[10px] text-slate-300 font-extrabold w-8 text-right leading-none">{bpm}</span>
                </div>
              </div>

              {/* Active Chord Indicator */}
              <div className="flex items-center gap-2 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5 min-w-[100px] justify-between">
                <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Now Playing</span>
                <span className="text-xs font-black text-[#FF007A] font-mono leading-none tracking-tight">
                  {isPlaying && activeStep !== null && chordTimeline[activeStep] ? chordTimeline[activeStep].name : '—'}
                </span>
              </div>
            </div>

            {/* Live Lyric/Chord layout wrap */}
            <div className="flex-1 overflow-y-auto max-h-[500px] border border-white/5 rounded-2xl bg-[#09090f]/90 p-6 shadow-inner z-10 leading-normal flex flex-col gap-3 font-sans">
              
              {/* Sheet Title */}
              <div className="mb-4">
                <h3 className="text-lg font-black text-white leading-normal tracking-tight">{sheetTitle || 'Untitled Song'}</h3>
                <div className="h-0.5 w-12 bg-[#FF007A] mt-1 rounded-full shadow-[0_0_8px_#FF007A]" />
              </div>

              {/* Rendered lines */}
              {(() => {
                let chordCounter = 0
                return sheetLines.map((line, lineIdx) => {
                  const segments = parseLineSegments(line)
                  const isBlank = line.trim() === ''

                  if (isBlank) {
                    return <div key={lineIdx} className="h-4" />
                  }

                  return (
                    <div key={lineIdx} className="relative flex flex-wrap items-end min-h-10 py-1 my-3 leading-normal isolate">
                      {segments.map((seg, segIdx) => {
                        let currentChordIdx = -1
                        if (seg.chord) {
                          currentChordIdx = chordCounter
                          chordCounter++
                        }

                        const isActive = isPlaying && activeStep === currentChordIdx

                        return (
                          <span key={segIdx} className="inline-flex flex-col relative leading-normal">
                            {seg.chord ? (
                              <span className="h-6 flex items-end select-none pr-1">
                                <span className="relative group inline-block">
                                  <button
                                    onClick={() => {
                                      const found = CHORDS.find(c => c.name === seg.chord)
                                      if (found) {
                                        try {
                                          playChordStrum(found.frets)
                                        } catch (_) {}
                                      }
                                    }}
                                    className={`text-[11px] font-black rounded px-1.5 py-0.5 transition-all cursor-pointer ${
                                      isActive
                                        ? 'text-white bg-[#FF007A] border-[#FF007A] shadow-[0_0_12px_#FF007A] scale-110 ring-2 ring-[#FF007A]'
                                        : 'text-[#FF007A] bg-[#FF007A]/10 border border-[#FF007A]/25 hover:bg-[#FF007A]/25 hover:border-[#FF007A]/40'
                                    }`}
                                  >
                                    {seg.chord}
                                  </button>

                                  {/* Hover diagram popover - pointer-events-none prevents layout blocking */}
                                  <div className="absolute top-full left-0 mt-2 hidden group-hover:block pointer-events-none z-50 w-36 p-2 rounded-xl bg-slate-950/98 border border-white/10 shadow-2xl backdrop-blur-md">
                                    {(() => {
                                      const found = CHORDS.find(c => c.name === seg.chord)
                                      if (found) {
                                        return (
                                          <div className="flex flex-col gap-1 items-center">
                                            <span className="text-[9px] font-bold text-white/80 select-none leading-normal">{found.fullName}</span>
                                            <div className="w-28 h-28">
                                              <ChordDiagram chord={found} />
                                            </div>
                                          </div>
                                        )
                                      }
                                      return <span className="text-[9px] text-slate-500">Diagram not found</span>
                                    })()}
                                  </div>
                                </span>
                              </span>
                            ) : (
                              <span className="h-6 select-none" />
                            )}
                            <span className="text-slate-200 text-sm whitespace-pre font-medium leading-normal pr-1">{seg.text}</span>
                          </span>
                        )
                      })}
                    </div>
                  )
                })
              })()}

            </div>
          </div>
        </div>

      </div>

      {/* ── Web Import Modal ── */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(10,10,20,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl relative flex flex-col gap-4"
              style={{ background: 'rgba(12,12,22,0.98)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Globe className="text-[#FF007A]" size={18} />
                  <h2 className="text-sm font-bold text-white font-display">Fetch Lyrics from Web</h2>
                </div>
                <button onClick={() => setShowImportModal(false)} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10 p-0.5 bg-white/[0.03] rounded-lg">
                <button
                  onClick={() => { setImportTab('search'); setImportError('') }}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    importTab === 'search' ? 'bg-[#FF007A]/15 text-[#FF007A]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  API Search
                </button>
                <button
                  onClick={() => { setImportTab('paste'); setImportError('') }}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    importTab === 'paste' ? 'bg-[#FF007A]/15 text-[#FF007A]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Quick Clean Paste
                </button>
              </div>

              {/* Error view */}
              {importError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium">
                  {importError}
                </div>
              )}

              {/* Tab Content: Search API */}
              {importTab === 'search' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Artist Name</span>
                    <input
                      type="text"
                      value={importArtist}
                      onChange={e => setImportArtist(e.target.value)}
                      placeholder="e.g. The Beatles"
                      className="w-full h-10 px-3 rounded-xl border border-white/10 bg-neutral-900/60 text-slate-200 text-xs font-semibold focus:outline-none focus:border-[#FF007A]/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Song Title</span>
                    <input
                      type="text"
                      value={importTitle}
                      onChange={e => setImportTitle(e.target.value)}
                      placeholder="e.g. Yesterday"
                      className="w-full h-10 px-3 rounded-xl border border-white/10 bg-neutral-900/60 text-slate-200 text-xs font-semibold focus:outline-none focus:border-[#FF007A]/40"
                    />
                  </div>
                  <button
                    onClick={handleFetchLyrics}
                    disabled={importLoading}
                    className="w-full h-10 rounded-xl text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 mt-2"
                    style={{ background: 'var(--gradient-cta)' }}
                  >
                    {importLoading ? 'Searching & Fetching...' : 'Fetch Lyrics'}
                  </button>
                </div>
              )}

              {/* Tab Content: Clean Paste */}
              {importTab === 'paste' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Paste Lyrics text</span>
                    <textarea
                      value={rawPasteText}
                      onChange={e => setRawPasteText(e.target.value)}
                      placeholder="Paste raw song lyrics copied from Genius, Google, or other sites. The engine will strip away headers, timestamps, and advertising cookie policy scripts automatically."
                      className="w-full h-32 p-3 rounded-xl border border-white/10 bg-neutral-900/60 text-slate-200 text-xs font-mono focus:outline-none focus:border-[#FF007A]/40 leading-normal resize-none"
                    />
                  </div>
                  <button
                    onClick={handleCleanPasteImport}
                    className="w-full h-10 rounded-xl text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer mt-2"
                    style={{ background: 'var(--gradient-cta)' }}
                  >
                    Clean & Ingest Text
                  </button>
                </div>
              )}

              <p className="text-[10px] text-slate-500 leading-normal text-center mt-1">
                Ingested lyrics clear the editor. You can then click chords to place tags.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Saved Sheets Drawer/Sidebar ── */}
      <AnimatePresence>
        {showLoadSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoadSidebar(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 h-full w-80 bg-slate-950 border-l border-white/10 z-[101] shadow-2xl p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold text-white font-display">Saved Songs</h3>
                <button
                  onClick={() => setShowLoadSidebar(false)}
                  className="text-xs text-slate-500 hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-2.5">
                {savedSheets.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500">No saved sheets found. Click "Save Sheet" to store yours!</div>
                ) : (
                  savedSheets.map(s => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-center justify-between gap-3 group"
                    >
                      <div
                        onClick={() => handleLoadSelect(s)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <h4 className="text-xs font-bold text-white truncate leading-normal">{s.title}</h4>
                        <span className="text-[10px] text-slate-500 block mt-0.5 leading-normal">
                          {new Date(s.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </PageWrapper>
  )
}
