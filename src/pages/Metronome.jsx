import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Play, Pause, Plus, Minus, Volume2, Volume1, VolumeX, Info, Timer
} from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import { useMetronome } from '../hooks/useMetronome'
import BeatVisualizer from '../components/metronome/BeatVisualizer'
import TapTempo from '../components/metronome/TapTempo'

// ── Preset Values ────────────────────────────────────────────────────────────
const TEMPO_PRESETS = [
  { label: 'Larghetto', bpm: 60 },
  { label: 'Andante', bpm: 76 },
  { label: 'Moderato', bpm: 108 },
  { label: 'Allegro', bpm: 132 },
  { label: 'Presto', bpm: 168 },
]

const GENRE_PRESETS = [
  { label: 'Ballad', bpm: 70 },
  { label: 'Blues', bpm: 90 },
  { label: 'Pop', bpm: 110 },
  { label: 'Rock', bpm: 130 },
  { label: 'Funk', bpm: 115 },
  { label: 'Metal', bpm: 160 },
]

const SIMPLE_SIGNATURES = [
  { label: '1/4', value: 1 },
  { label: '2/4', value: 2 },
  { label: '3/4', value: 3 },
  { label: '4/4', value: 4 },
  { label: '5/4', value: 5 },
  { label: '6/4', value: 6 },
  { label: '7/4', value: 7 },
]

const COMPOUND_SIGNATURES = [
  { label: '6/8', value: 6 },
]

const SUBDIVISIONS = [
  { label: '♩ Quarter', value: 'Quarter' },
  { label: '♪ Eighth', value: 'Eighth' },
  { label: '♬ Sixteenth', value: 'Sixteenth' },
]

export default function Metronome() {
  const {
    isPlaying,
    bpm,
    setBpm,
    currentBeat,
    start,
    stop,
    volume,
    setVolume,
    beatsPerMeasure,
    setBeatsPerMeasure,
    subdivision,
    setSubdivision
  } = useMetronome()

  // ── Smooth BPM Counter Transition ───────────────────────────────────────────
  const [displayBpm, setDisplayBpm] = useState(bpm)
  const [selectedSig, setSelectedSig] = useState('4/4')

  useEffect(() => {
    let frame = null
    const startTime = performance.now()
    const startBpm = displayBpm
    const endBpm = bpm
    const duration = 250 // ms

    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3) // ease out cubic
      const current = Math.round(startBpm + (endBpm - startBpm) * easeProgress)
      
      setDisplayBpm(current)

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => {
      if (frame) cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm])

  // ── Incremental BPM Adjusters with Hold-to-Repeat ────────────────────────────
  const adjustBpm = useCallback((amount) => {
    setBpm((prev) => Math.max(40, Math.min(240, prev + amount)))
  }, [setBpm])

  const useHoldToRepeat = (amount) => {
    const timerRef = useRef(null)
    const delayTimerRef = useRef(null)

    const startRepeat = useCallback(() => {
      adjustBpm(amount)
      delayTimerRef.current = setTimeout(() => {
        timerRef.current = setInterval(() => {
          adjustBpm(amount)
        }, 85)
      }, 350)
    }, [amount])

    const stopRepeat = useCallback(() => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = null
      }
    }, [])

    useEffect(() => {
      return () => stopRepeat()
    }, [stopRepeat])

    return {
      onMouseDown: startRepeat,
      onMouseUp: stopRepeat,
      onMouseLeave: stopRepeat,
      onTouchStart: startRepeat,
      onTouchEnd: stopRepeat
    }
  }

  const minusHoldProps = useHoldToRepeat(-1)
  const plusHoldProps = useHoldToRepeat(1)

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const togglePlay = () => {
    if (isPlaying) stop()
    else start()
  }

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={15} className="text-slate-500" />
    if (volume < 50) return <Volume1 size={15} className="text-slate-400" />
    return <Volume2 size={15} className="text-slate-300" />
  }

  return (
    <PageWrapper className="flex flex-col items-center px-4 sm:px-6 lg:px-8 pb-16">
      {/* Backing glow effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full opacity-10"
          style={{
            background: isPlaying
              ? currentBeat === 0
                ? 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(255,0,122,0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(255,0,122,0.08) 0%, transparent 70%)',
            filter: 'blur(90px)',
            transition: 'background 0.5s ease',
          }}
        />
      </div>

      {/* ── Page Header ── */}
      <div className="w-full max-w-4xl mx-auto text-center mb-6 relative z-10 pt-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1.5" style={{ color: '#FF007A' }}>
          Precision Tools
        </p>
        <h1
          className="gradient-text font-display text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight flex items-center justify-center gap-3"
          style={{ textShadow: '0 0 20px rgba(255, 0, 122, 0.15)' }}
        >
          <Timer className="text-[#FF007A]" size={32} strokeWidth={2} />
          <span>Metronome</span>
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Beat visualizer, subdivisions, and tap tempo in one place.
        </p>
      </div>

      {/* ── Main Metronome Panel ── */}
      <div className="w-full max-w-lg mx-auto relative z-10 px-4">
        
        {/* Top Beats Vis + Large BPM display */}
        <BeatVisualizer
          bpm={bpm}
          isPlaying={isPlaying}
          currentBeat={currentBeat}
          beatsPerMeasure={beatsPerMeasure}
          displayBpm={displayBpm}
        />

        {/* Glassmorphic Control Panel Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40 flex flex-col items-center">
          
          {/* BPM Adjustment slider controls */}
          <div className="w-full flex items-center justify-between gap-4 mb-5">
            <button
              {...minusHoldProps}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.06] text-slate-400 hover:text-white transition-all active:scale-95 shrink-0"
              title="Decrease BPM (Hold to fast-scroll)"
            >
              <Minus size={14} />
            </button>

            <div className="flex-1 flex flex-col gap-1">
              {/* Overlaid slider track */}
              <div className="relative w-full flex items-center h-6 select-none">
                {/* Track background */}
                <div className="absolute left-0 right-0 h-1 bg-white/10 rounded-full pointer-events-none" />
                
                {/* Accent fill track */}
                <div 
                  className="absolute h-1 rounded-full pointer-events-none" 
                  style={{
                    background: 'var(--gradient-cta)',
                    left: 0,
                    width: `${((bpm - 40) / 200) * 100}%`,
                  }}
                />

                <input
                  type="range"
                  min="40"
                  max="240"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full h-6 appearance-none bg-transparent cursor-pointer focus:outline-none relative z-10"
                  style={{
                    WebkitAppearance: 'none',
                    outline: 'none',
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider px-1">
                <span>40 BPM</span>
                <span className="opacity-60 font-medium">Largo</span>
                <span className="opacity-60 font-medium">Moderato</span>
                <span className="opacity-60 font-medium">Presto</span>
                <span>240 BPM</span>
              </div>
            </div>

            <button
              {...plusHoldProps}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.06] text-slate-400 hover:text-white transition-all active:scale-95 shrink-0"
              title="Increase BPM (Hold to fast-scroll)"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Volume Control */}
          <div className="w-full flex items-center gap-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl px-4 py-2.5 mb-6">
            {getVolumeIcon()}
            <div className="flex-1 relative flex items-center h-4">
              <div className="absolute left-0 right-0 h-1 bg-white/5 rounded-full pointer-events-none" />
              <div 
                className="absolute h-1 bg-slate-500 rounded-full pointer-events-none" 
                style={{
                  left: 0,
                  width: `${volume}%`,
                }}
              />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-4 appearance-none bg-transparent cursor-pointer focus:outline-none relative z-10"
                style={{
                  WebkitAppearance: 'none',
                  outline: 'none',
                }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400 w-6 text-right tabular-nums">{volume}%</span>
          </div>

          {/* Time Signatures */}
          <div className="w-full mb-5 flex flex-col gap-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">Time Signature</span>
            
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 px-1">Simple</span>
              <div className="flex gap-1.5 w-full bg-white/[0.03] border border-white/[0.05] p-1 rounded-2xl flex-wrap">
                {SIMPLE_SIGNATURES.map((sig) => {
                  const isActive = selectedSig === sig.label
                  return (
                    <button
                      key={sig.label}
                      onClick={() => {
                        setSelectedSig(sig.label)
                        setBeatsPerMeasure(sig.value)
                      }}
                      className={`flex-1 min-w-[36px] py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                        isActive
                          ? 'text-[#FF007A]'
                          : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                      }`}
                      style={isActive ? { background: 'rgba(255,0,122,0.15)', borderColor: '#FF007A' } : {}}
                    >
                      {sig.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 px-1">Compound</span>
              <div className="flex gap-1.5 w-full bg-white/[0.03] border border-white/[0.05] p-1 rounded-2xl">
                {COMPOUND_SIGNATURES.map((sig) => {
                  const isActive = selectedSig === sig.label
                  return (
                    <button
                      key={sig.label}
                      onClick={() => {
                        setSelectedSig(sig.label)
                        setBeatsPerMeasure(sig.value)
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                        isActive
                          ? 'text-[#FF007A]'
                          : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                      }`}
                      style={isActive ? { background: 'rgba(255,0,122,0.15)', borderColor: '#FF007A' } : {}}
                    >
                      {sig.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Subdivisions */}
          <div className="w-full mb-8 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">Subdivision</span>
            <div className="flex gap-1.5 w-full bg-white/[0.03] border border-white/[0.05] p-1 rounded-2xl">
              {SUBDIVISIONS.map((sub) => {
                const isActive = subdivision === sub.value
                return (
                  <button
                    key={sub.value}
                    onClick={() => setSubdivision(sub.value)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                      isActive
                        ? 'text-[#FF007A]'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                    }`}
                    style={isActive ? { background: 'rgba(255,0,122,0.15)', borderColor: '#FF007A' } : {}}
                  >
                    {sub.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tap Tempo & Play buttons */}
          <div className="flex gap-4 w-full items-center justify-between">
            {/* Play Button matching MicButton styling */}
            <div className="flex flex-col items-center gap-1.5 shrink-0 pl-1">
              <motion.button
                onClick={togglePlay}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex items-center justify-center w-16 h-16 rounded-full focus:outline-none"
                style={{
                  background: isPlaying
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'rgba(255,255,255,0.05)',
                  border: isPlaying
                    ? 'none'
                    : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: isPlaying
                    ? '0 0 30px rgba(16,185,129,0.45), 0 0 60px rgba(16,185,129,0.15)'
                    : 'none',
                  cursor: 'pointer',
                }}
              >
                {/* Ripple animation when playing */}
                {isPlaying && (
                  <>
                    <motion.span
                      className="absolute inset-0 rounded-full"
                      style={{ border: '1px solid rgba(16,185,129,0.5)' }}
                      animate={{ scale: [1, 1.55], opacity: [0.6, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <motion.span
                      className="absolute inset-0 rounded-full"
                      style={{ border: '1px solid rgba(16,185,129,0.3)' }}
                      animate={{ scale: [1, 1.9], opacity: [0.4, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    />
                  </>
                )}

                {/* Play/Pause icon */}
                {isPlaying ? (
                  <Pause size={22} className="text-white" fill="currentColor" />
                ) : (
                  <Play size={22} className="text-slate-400 pl-0.5" fill="currentColor" />
                )}
              </motion.button>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {isPlaying ? 'Stop' : 'Start'}
              </span>
            </div>

            {/* Tap Tempo Component */}
            <TapTempo onBpmChange={setBpm} />
          </div>

          {/* Preset Tempos strip */}
          <div className="w-full flex flex-col gap-2.5 relative z-10 mt-6 border-t border-white/[0.05] pt-5 select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
              Tempo & Genre Presets
            </span>
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-0.5 w-full">
              {TEMPO_PRESETS.map((p) => {
                const isActive = bpm === p.bpm
                return (
                  <button
                    key={p.label}
                    onClick={() => setBpm(p.bpm)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 ${
                      isActive
                        ? 'text-[#FF007A]'
                        : 'bg-white/5 border-white/[0.05] text-slate-400 hover:text-white'
                    }`}
                    style={isActive ? { background: 'rgba(255,0,122,0.15)', borderColor: '#FF007A', boxShadow: 'var(--glow-pink)' } : {}}
                  >
                    {p.label} <span className="opacity-75 ml-0.5">{p.bpm}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-0.5 w-full">
              {GENRE_PRESETS.map((p) => {
                const isActive = bpm === p.bpm
                return (
                  <button
                    key={p.label}
                    onClick={() => setBpm(p.bpm)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 ${
                      isActive
                        ? 'text-[#FF007A]'
                        : 'bg-white/5 border-white/[0.05] text-slate-400 hover:text-white'
                    }`}
                    style={isActive ? { background: 'rgba(255,0,122,0.15)', borderColor: '#FF007A', boxShadow: 'var(--glow-pink)' } : {}}
                  >
                    {p.label} <span className="opacity-75 ml-0.5">{p.bpm}</span>
                  </button>
                )
              })}
            </div>
          </div>

        </div>

        {/* Tip section */}
        <div className="mt-10 flex items-start gap-2.5 px-5 py-4 rounded-2xl backdrop-blur-sm bg-white/5 border border-white/10">
          <Info size={14} className="mt-0.5 shrink-0" style={{ color: '#FF007A' }} />
          <p className="text-[11px] leading-relaxed text-slate-400 font-medium">
            Beat 1 plays an accented pitch to keep you locked in. Use tap tempo or a preset to set your BPM.
          </p>
        </div>
      </div>
    </PageWrapper>
  )
}
