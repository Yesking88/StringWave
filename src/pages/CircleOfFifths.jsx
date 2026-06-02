import { useState } from 'react'
import { motion } from 'framer-motion'
import { Disc, Play, HelpCircle, Info, Music2 } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import { CHORDS } from '../data/chords'
import { playChordStrum } from '../utils/tonePlayer'

const KEYS = [
  { major: 'C', minor: 'Am', sig: '0 Sharps/Flats', chords: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'], degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], qualities: ['Major', 'minor', 'minor', 'Major', 'Major', 'minor', 'diminished'] },
  { major: 'G', minor: 'Em', sig: '1 Sharp (F#)', chords: ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'], degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], qualities: ['Major', 'minor', 'minor', 'Major', 'Major', 'minor', 'diminished'] },
  { major: 'D', minor: 'Bm', sig: '2 Sharps (F#, C#)', chords: ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'], degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], qualities: ['Major', 'minor', 'minor', 'Major', 'Major', 'minor', 'diminished'] },
  { major: 'A', minor: 'F#m', sig: '3 Sharps (F#, C#, G#)', chords: ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'Abdim'], degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], qualities: ['Major', 'minor', 'minor', 'Major', 'Major', 'minor', 'diminished'] },
  { major: 'E', minor: 'C#m', sig: '4 Sharps (F#, C#, G#, D#)', chords: ['E', 'F#m', 'Abm', 'A', 'B', 'C#m', 'Ebdim'], degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], qualities: ['Major', 'minor', 'minor', 'Major', 'Major', 'minor', 'diminished'] },
  { major: 'B', minor: 'Abm', sig: '5 Sharps (F#, C#, G#, D#, A#)', chords: ['B', 'C#m', 'Ebm', 'E', 'F#', 'Abm', 'Bbdim'], degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], qualities: ['Major', 'minor', 'minor', 'Major', 'Major', 'minor', 'diminished'] },
  { major: 'F#', minor: 'Ebm', sig: '6 Sharps (F#, C#, G#, D#, A#, E#)', chords: ['F#', 'Abm', 'Bbm', 'B', 'C#', 'Ebm', 'Fdim'], degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], qualities: ['Major', 'minor', 'minor', 'Major', 'Major', 'minor', 'diminished'] },
  { major: 'C#', minor: 'Bbm', sig: '7 Sharps (F#, C#, G#, D#, A#, E#, B#)', chords: ['C#', 'Ebm', 'Fm', 'F#', 'Ab', 'Bbm', 'Cdim'], degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], qualities: ['Major', 'minor', 'minor', 'Major', 'Major', 'minor', 'diminished'] },
  { major: 'Ab', minor: 'Fm', sig: '4 Flats (Bb, Eb, Ab, Db)', chords: ['Ab', 'Bbm', 'Cm', 'C#', 'Eb', 'Fm', 'Gdim'], degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], qualities: ['Major', 'minor', 'minor', 'Major', 'Major', 'minor', 'diminished'] },
  { major: 'Eb', minor: 'Cm', sig: '3 Flats (Bb, Eb, Ab)', chords: ['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'Ddim'], degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], qualities: ['Major', 'minor', 'minor', 'Major', 'Major', 'minor', 'diminished'] },
  { major: 'Bb', minor: 'Gm', sig: '2 Flats (Bb, Eb)', chords: ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'Adim'], degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], qualities: ['Major', 'minor', 'minor', 'Major', 'Major', 'minor', 'diminished'] },
  { major: 'F', minor: 'Dm', sig: '1 Flat (Bb)', chords: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'], degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], qualities: ['Major', 'minor', 'minor', 'Major', 'Major', 'minor', 'diminished'] }
]

const getArcPath = (cx, cy, rInner, rOuter, startAngle, endAngle) => {
  const rad = Math.PI / 180
  const x1Inner = cx + rInner * Math.cos(startAngle * rad)
  const y1Inner = cy + rInner * Math.sin(startAngle * rad)
  const x2Inner = cx + rInner * Math.cos(endAngle * rad)
  const y2Inner = cy + rInner * Math.sin(endAngle * rad)
  
  const x1Outer = cx + rOuter * Math.cos(startAngle * rad)
  const y1Outer = cy + rOuter * Math.sin(startAngle * rad)
  const x2Outer = cx + rOuter * Math.cos(endAngle * rad)
  const y2Outer = cy + rOuter * Math.sin(endAngle * rad)
  
  return `
    M ${x1Inner} ${y1Inner}
    L ${x1Outer} ${y1Outer}
    A ${rOuter} ${rOuter} 0 0 1 ${x2Outer} ${y2Outer}
    L ${x2Inner} ${y2Inner}
    A ${rInner} ${rInner} 0 0 0 ${x1Inner} ${y1Inner}
    Z
  `
}

export default function CircleOfFifths() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeChordName, setActiveChordName] = useState(null)

  const selectedKey = KEYS[selectedIndex]

  const handlePlayChord = (chordName) => {
    setActiveChordName(chordName)
    const chordObj = CHORDS.find(c => c.name === chordName)
    if (chordObj) {
      try {
        playChordStrum(chordObj.frets)
      } catch (err) {
        console.warn('Playback failed:', err)
      }
    }
    setTimeout(() => setActiveChordName(null), 800)
  }

  return (
    <PageWrapper className="px-4 sm:px-6 lg:px-8 pb-16 flex flex-col">
      
      {/* Header */}
      <div className="relative z-10 text-center pb-6 pt-6 flex flex-col items-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: '#FF007A' }}>
          Theory Tools
        </span>
        <h1 className="gradient-text font-display leading-normal tracking-tight font-extrabold mb-1 text-4xl sm:text-5xl flex items-center justify-center gap-3" style={{ textShadow: '0 0 20px rgba(255, 0, 122, 0.15)' }}>
          <Disc className="text-[#FF007A]" size={40} strokeWidth={2} />
          <span>Circle of Fifths</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-xs leading-normal">
          Explore key relationships, signatures, and relative minors. Select any key segment below to unlock and preview its 7 diatonic chords.
        </p>
      </div>

      {/* Main Wheel Board */}
      <div className="relative z-10 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center mt-4">
        
        {/* Left Side: SVG Interactive Wheel */}
        <div className="md:col-span-6 flex items-center justify-center">
          <div className="glass p-6 rounded-3xl border border-white/5 bg-slate-950/40 backdrop-blur-xl relative w-full max-w-[380px] sm:max-w-[420px] aspect-square flex items-center justify-center">
            
            <svg viewBox="0 0 400 400" className="w-full h-full select-none">
              <defs>
                <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Glowing backing for active segment */}
              {selectedIndex !== null && (
                <path
                  d={getArcPath(200, 200, 60, 170, -90 + selectedIndex * 30 - 15, -90 + selectedIndex * 30 + 15)}
                  fill="transparent"
                  stroke="#FF007A"
                  strokeWidth={4}
                  filter="url(#neon-glow)"
                  className="pointer-events-none opacity-80"
                />
              )}

              {/* Wheel slices */}
              {KEYS.map((key, i) => {
                const angle = -90 + i * 30
                const startAngle = angle - 15
                const endAngle = angle + 15
                const rad = Math.PI / 180

                const xTextMajor = 200 + 140 * Math.cos(angle * rad)
                const yTextMajor = 200 + 140 * Math.sin(angle * rad)

                const xTextMinor = 200 + 85 * Math.cos(angle * rad)
                const yTextMinor = 200 + 85 * Math.sin(angle * rad)

                const isSelected = selectedIndex === i

                return (
                  <g key={i} className="cursor-pointer group" onClick={() => setSelectedIndex(i)}>
                    {/* Outer Major segment */}
                    <path
                      d={getArcPath(200, 200, 110, 170, startAngle, endAngle)}
                      fill={isSelected ? 'rgba(255, 0, 122, 0.12)' : 'rgba(255, 255, 255, 0.015)'}
                      stroke={isSelected ? '#FF007A' : 'rgba(255, 255, 255, 0.06)'}
                      strokeWidth={isSelected ? 1.5 : 0.75}
                      className="transition-all duration-300 group-hover:fill-white/[0.04]"
                    />

                    {/* Inner Minor segment */}
                    <path
                      d={getArcPath(200, 200, 60, 110, startAngle, endAngle)}
                      fill={isSelected ? 'rgba(255, 0, 122, 0.18)' : 'rgba(255, 255, 255, 0.025)'}
                      stroke={isSelected ? '#FF007A' : 'rgba(255, 255, 255, 0.06)'}
                      strokeWidth={isSelected ? 1.5 : 0.75}
                      className="transition-all duration-300 group-hover:fill-white/[0.06]"
                    />

                    {/* Major key text */}
                    <text
                      x={xTextMajor}
                      y={yTextMajor}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`text-sm font-black transition-colors duration-300 pointer-events-none ${
                        isSelected ? 'fill-white' : 'fill-slate-300 group-hover:fill-white'
                      }`}
                    >
                      {key.major}
                    </text>

                    {/* Minor key text */}
                    <text
                      x={xTextMinor}
                      y={yTextMinor}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`text-[10px] font-bold transition-colors duration-300 pointer-events-none ${
                        isSelected ? 'fill-[#FF007A]' : 'fill-slate-500 group-hover:fill-slate-300'
                      }`}
                    >
                      {key.minor}
                    </text>
                  </g>
                )
              })}

              {/* Center Circle display */}
              <circle cx={200} cy={200} r={60} fill="#06060c" stroke="rgba(255, 255, 255, 0.1)" strokeWidth={1} />
              
              {/* Inner labeling */}
              <text x={200} y={185} textAnchor="middle" className="text-[9px] font-extrabold fill-slate-500 uppercase tracking-widest pointer-events-none">
                Key Sig
              </text>
              <text x={200} y={205} textAnchor="middle" className="text-xs font-black fill-slate-200 pointer-events-none">
                {selectedKey.major} / {selectedKey.minor}
              </text>
              <text x={200} y={222} textAnchor="middle" className="text-[9px] font-bold fill-slate-400 pointer-events-none">
                {selectedKey.sig.split(' ')[0]} {selectedKey.sig.split(' ')[1]}
              </text>
            </svg>

          </div>
        </div>

        {/* Right Side: Key Metadata and Diatonic Chords */}
        <div className="md:col-span-6 flex flex-col gap-6">
          
          {/* Key Summary Box */}
          <div className="glass p-5 rounded-2xl border border-white/5 bg-slate-950/40 backdrop-blur-xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Selected Signature</span>
              <span className="text-[10px] text-slate-400 font-bold bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Info size={10} className="text-slate-500" />
                Diatonic Modes
              </span>
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-black text-white leading-normal">
                  {selectedKey.major} Major / {selectedKey.minor} minor
                </h2>
                <p className="text-xs text-[#FF007A] font-bold mt-0.5">{selectedKey.sig}</p>
              </div>
            </div>
          </div>

          {/* Diatonic Chords grid */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              7 Diatonic Chords (Click card to down-strum guitar preview)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {selectedKey.chords.map((chordName, idx) => {
                const degree = selectedKey.degrees[idx]
                const quality = selectedKey.qualities[idx]
                const isPlaying = activeChordName === chordName

                return (
                  <motion.button
                    key={chordName}
                    onClick={() => handlePlayChord(chordName)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`flex flex-col items-center gap-1 p-3.5 rounded-xl border transition-all text-center relative overflow-hidden shadow-md cursor-pointer ${
                      isPlaying
                        ? 'bg-[#FF007A]/15 border-[#FF007A]/50 shadow-[0_0_15px_rgba(255,0,122,0.25)]'
                        : 'bg-neutral-900/40 hover:bg-neutral-800/40 border-white/5 hover:border-[#FF007A]/30'
                    }`}
                  >
                    {/* Tiny glowing background pulse */}
                    {isPlaying && (
                      <span className="absolute inset-0 bg-gradient-to-r from-[#FF007A]/5 to-transparent pointer-events-none animate-pulse" />
                    )}

                    <span className="text-[9px] font-black uppercase text-[#FF007A]/90 tracking-widest">{degree}</span>
                    <span className="text-lg font-black text-white tracking-tight leading-normal my-0.5">{chordName}</span>
                    <span className="text-[9px] font-semibold text-slate-500 leading-normal">{quality}</span>

                    <span className={`mt-2 flex items-center justify-center w-5 h-5 rounded-full transition-all ${
                      isPlaying ? 'bg-[#FF007A] text-white' : 'bg-white/5 text-slate-400 group-hover:text-white'
                    }`}>
                      <Play size={8} fill={isPlaying ? 'white' : 'transparent'} strokeWidth={3} />
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Quick tips alert */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-3">
            <Music2 size={16} className="text-[#FF007A] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-200">Theory Cheat Sheet</span>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                The Circle of Fifths showcases keys related by fifths. Major scales build chords on <span className="text-white font-bold">I, IV, V</span> (Major), <span className="text-white font-bold">ii, iii, vi</span> (minor), and <span className="text-white font-bold">vii°</span> (diminished). Play consecutive diatonic degrees to formulate hit progression sequences.
              </p>
            </div>
          </div>

        </div>

      </div>

    </PageWrapper>
  )
}
