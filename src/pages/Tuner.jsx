import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Info, Guitar, ChevronDown } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'

import { usePitchDetection } from '../hooks/usePitchDetection'
import TunerMeter    from '../components/tuner/TunerMeter'
import NoteDisplay   from '../components/tuner/NoteDisplay'
import StringSelector from '../components/tuner/StringSelector'
import MicButton     from '../components/tuner/MicButton'

// ── Tuning Presets Configuration ──────────────────────────────────────────────
const TUNING_PRESETS = [
  {
    id: 'standard',
    label: 'Standard Tuning',
    strings: [
      { string: 6, note: 'E', octave: 2, frequency: 82.41  },
      { string: 5, note: 'A', octave: 2, frequency: 110.00 },
      { string: 4, note: 'D', octave: 3, frequency: 146.83 },
      { string: 3, note: 'G', octave: 3, frequency: 196.00 },
      { string: 2, note: 'B', octave: 3, frequency: 246.94 },
      { string: 1, note: 'E', octave: 4, frequency: 329.63 },
    ]
  },
  {
    id: 'drop_d',
    label: 'Drop D Tuning',
    strings: [
      { string: 6, note: 'D', octave: 2, frequency: 73.42  },
      { string: 5, note: 'A', octave: 2, frequency: 110.00 },
      { string: 4, note: 'D', octave: 3, frequency: 146.83 },
      { string: 3, note: 'G', octave: 3, frequency: 196.00 },
      { string: 2, note: 'B', octave: 3, frequency: 246.94 },
      { string: 1, note: 'E', octave: 4, frequency: 329.63 },
    ]
  },
  {
    id: 'drop_c',
    label: 'Drop C Tuning',
    strings: [
      { string: 6, note: 'C', octave: 2, frequency: 65.41  },
      { string: 5, note: 'G', octave: 2, frequency: 98.00  },
      { string: 4, note: 'C', octave: 3, frequency: 130.81 },
      { string: 3, note: 'F', octave: 3, frequency: 174.61 },
      { string: 2, note: 'A', octave: 3, frequency: 220.00 },
      { string: 1, note: 'D', octave: 4, frequency: 293.66 },
    ]
  },
  {
    id: 'half_step',
    label: 'Half-Step Down',
    strings: [
      { string: 6, note: 'D#', octave: 2, frequency: 77.78  },
      { string: 5, note: 'G#', octave: 2, frequency: 103.83 },
      { string: 4, note: 'C#', octave: 3, frequency: 138.59 },
      { string: 3, note: 'F#', octave: 3, frequency: 185.00 },
      { string: 2, note: 'A#', octave: 3, frequency: 233.08 },
      { string: 1, note: 'D#', octave: 4, frequency: 311.13 },
    ]
  },
  {
    id: 'whole_step',
    label: 'Whole-Step Down',
    strings: [
      { string: 6, note: 'D', octave: 2, frequency: 73.42  },
      { string: 5, note: 'G', octave: 2, frequency: 98.00  },
      { string: 4, note: 'C', octave: 3, frequency: 130.81 },
      { string: 3, note: 'F', octave: 3, frequency: 174.61 },
      { string: 2, note: 'A', octave: 3, frequency: 220.00 },
      { string: 1, note: 'D', octave: 4, frequency: 293.66 },
    ]
  },
  {
    id: 'open_d',
    label: 'Open D Tuning',
    strings: [
      { string: 6, note: 'D', octave: 2, frequency: 73.42  },
      { string: 5, note: 'A', octave: 2, frequency: 110.00 },
      { string: 4, note: 'D', octave: 3, frequency: 146.83 },
      { string: 3, note: 'F#', octave: 3, frequency: 185.00 },
      { string: 2, note: 'A', octave: 3, frequency: 220.00 },
      { string: 1, note: 'D', octave: 4, frequency: 293.66 },
    ]
  },
  {
    id: 'open_e',
    label: 'Open E Tuning',
    strings: [
      { string: 6, note: 'E', octave: 2, frequency: 82.41  },
      { string: 5, note: 'B', octave: 2, frequency: 123.47 },
      { string: 4, note: 'E', octave: 3, frequency: 164.81 },
      { string: 3, note: 'G#', octave: 3, frequency: 207.65 },
      { string: 2, note: 'B', octave: 3, frequency: 246.94 },
      { string: 1, note: 'E', octave: 4, frequency: 329.63 },
    ]
  },
  {
    id: 'open_g',
    label: 'Open G Tuning',
    strings: [
      { string: 6, note: 'D', octave: 2, frequency: 73.42  },
      { string: 5, note: 'G', octave: 2, frequency: 98.00  },
      { string: 4, note: 'D', octave: 3, frequency: 146.83 },
      { string: 3, note: 'G', octave: 3, frequency: 196.00 },
      { string: 2, note: 'B', octave: 3, frequency: 246.94 },
      { string: 1, note: 'D', octave: 4, frequency: 293.66 },
    ]
  },
  {
    id: 'dadgad',
    label: 'DADGAD Tuning',
    strings: [
      { string: 6, note: 'D', octave: 2, frequency: 73.42  },
      { string: 5, note: 'A', octave: 2, frequency: 110.00 },
      { string: 4, note: 'D', octave: 3, frequency: 146.83 },
      { string: 3, note: 'G', octave: 3, frequency: 196.00 },
      { string: 2, note: 'A', octave: 3, frequency: 220.00 },
      { string: 1, note: 'D', octave: 4, frequency: 293.66 },
    ]
  }
]

export default function Tuner() {
  const [selectedTuning, setSelectedTuning] = useState(TUNING_PRESETS[0])
  const { state, error, pitch, isListening, start, stop } = usePitchDetection(selectedTuning.strings)

  // Dynamic box-shadow glow based on tuning states
  const cardGlow = isListening && pitch
    ? pitch.status === 'in-tune'
      ? '0 0 80px rgba(16, 185, 129, 0.16), 0 25px 50px rgba(0,0,0,0.5)'
      : pitch.status === 'close'
      ? '0 0 80px rgba(245, 158, 11, 0.08), 0 25px 50px rgba(0,0,0,0.5)'
      : '0 0 80px rgba(239, 68, 68, 0.08), 0 25px 50px rgba(0,0,0,0.5)'
    : isListening
    ? '0 0 80px rgba(255, 0, 122, 0.08), 0 25px 50px rgba(0,0,0,0.5)'
    : '0 20px 40px rgba(0,0,0,0.5)'

  return (
    <PageWrapper className="flex flex-col items-center px-4 sm:px-6 lg:px-8 pb-16">
      {/* Dynamic ambient page backing glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background: isListening && pitch
              ? pitch.status === 'in-tune'
                ? 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(255, 0, 122, 0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(255, 0, 122, 0.08) 0%, transparent 70%)',
            filter: 'blur(70px)',
            transition: 'background 0.5s ease',
          }}
        />
      </div>

      {/* ── Page header ── */}
      <div className="w-full max-w-2xl mx-auto text-center mb-8 relative z-10 animate-none">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.25em] mb-2"
          style={{ color: '#FF007A' }}
        >
          Precision Tools
        </p>
        <h1
          className="gradient-text font-display text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight flex items-center justify-center gap-3"
          style={{ textShadow: '0 0 20px rgba(255, 0, 122, 0.15)' }}
        >
          <Guitar className="text-[#FF007A]" size={32} strokeWidth={2} />
          <span>Guitar Tuner</span>
        </h1>
        <p
          className="text-xs sm:text-sm font-medium drop-shadow-lg leading-relaxed mb-6"
          style={{ color: '#94a3b8' }}
        >
          Real-time pitch detection with string reference tones.
        </p>
      </div>

      {/* ── Error banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0,  height: 'auto' }}
            exit={{   opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg mx-auto mb-6 overflow-hidden relative z-10"
          >
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold"
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)',
                color: '#ef4444',
              }}
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main tuner card ── */}
      <div className="w-full max-w-lg mx-auto relative z-10">
        <div
          className="bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden"
          style={{
            boxShadow: cardGlow,
            transition: 'box-shadow 0.5s ease',
          }}
        >
          <div className="relative">
            {/* Background highlights inside card */}
            <div
              className="absolute inset-x-0 top-0 h-40 pointer-events-none"
              style={{
                background: isListening
                  ? pitch?.status === 'in-tune'
                    ? 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.06) 0%, transparent 70%)'
                    : 'radial-gradient(ellipse at 50% 0%, rgba(255, 0, 122, 0.06) 0%, transparent 70%)'
                  : 'none',
                transition: 'background 0.5s ease',
              }}
            />

            <div className="relative z-10 px-6 sm:px-10 py-10 flex flex-col items-center gap-7">

              {/* Tuning Selector Dropdown */}
              <div className="w-full flex flex-col gap-1.5 max-w-xs">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500 text-center">Tuning Preset</span>
                <div className="relative w-full">
                  <select
                    value={selectedTuning.id}
                    onChange={(e) => {
                      const found = TUNING_PRESETS.find(p => p.id === e.target.value)
                      if (found) setSelectedTuning(found)
                    }}
                    className="w-full h-11 px-3 pr-10 rounded-xl border border-white/10 bg-neutral-900/60 backdrop-blur-md text-gray-200 text-sm font-semibold focus:outline-none hover:border-magenta-500/50 focus:border-magenta-500/80 focus:ring-1 focus:ring-magenta-500/50 transition-all cursor-pointer appearance-none text-center"
                  >
                    {TUNING_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id} className="bg-slate-900 text-slate-200 font-semibold text-left">
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>

              {/* 1. Note display + Arc meter */}
              <NoteDisplay pitch={pitch} active={isListening} />

              {/* 2. Precision cent slider needle */}
              <TunerMeter
                cents={pitch?.cents ?? 0}
                status={pitch?.status ?? 'flat'}
                active={isListening && !!pitch}
              />

              {/* 3. Mic control button */}
              <MicButton state={state} onStart={start} onStop={stop} />

              {/* 4. String buttons and fretboards */}
              <div
                className="w-full pt-6 border-t border-white/[0.04]"
              >
                <StringSelector closestString={pitch?.closestString} activeTuning={selectedTuning.strings} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Info tip ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex items-start gap-2.5 px-5 py-4 rounded-2xl backdrop-blur-sm bg-white/5 border border-white/10"
        >
          <Info size={14} className="mt-0.5 shrink-0" style={{ color: '#FF007A' }} />
          <p className="text-xs leading-relaxed text-white/70 font-medium">
            Pluck one string at a time near the microphone. Tap a string button to hear its reference pitch.
          </p>
        </motion.div>
      </div>
    </PageWrapper>
  )
}
