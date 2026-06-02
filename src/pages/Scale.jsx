import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Music4, Sliders, Info, HelpCircle, ChevronDown } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import {
  CHROMATIC,
  OPEN_STRINGS,
  OPEN_STRING_MIDIS,
  SCALE_TYPES,
  getScaleNotes,
  getScaleMidiPitches,
} from '../data/scales';
import { playScaleSequence, getSamplerCtx, playNote } from '../utils/tonePlayer';

export default function Scale() {
  const [root, setRoot] = useState('C');
  const [scaleType, setScaleType] = useState('major');
  const [playingIndex, setPlayingIndex] = useState(null);
  
  const timerRef = useRef(null);

  // Stop scale sequence playback timer and state
  const stopScalePlayback = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlayingIndex(null);
    try {
      playScaleSequence([]); // silences by stopping all active scale notes
    } catch (_) {}
  };

  // Stop playback when leaving page or changing scale inputs
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    stopScalePlayback();
  }, [root, scaleType]);

  // Compute notes in active scale
  const activeScaleNotes = useMemo(() => {
    return getScaleNotes(root, scaleType);
  }, [root, scaleType]);

  // Compute scale pitches for audio sequencer
  const scalePitches = useMemo(() => {
    return getScaleMidiPitches(root, scaleType);
  }, [root, scaleType]);

  // Play scale sequence
  const handlePlayScale = () => {
    stopScalePlayback();
    
    // Play audio sequence
    playScaleSequence(scalePitches);

    // Track active playing index visually
    let idx = 0;
    setPlayingIndex(0);
    timerRef.current = setInterval(() => {
      idx++;
      if (idx < scalePitches.length) {
        setPlayingIndex(idx);
      } else {
        setPlayingIndex(null);
        clearInterval(timerRef.current);
      }
    }, 300);
  };

  // Find active note playing currently (pitch class index)
  const currentPlayingPitchClass = useMemo(() => {
    if (playingIndex === null || !scalePitches[playingIndex]) return null;
    return scalePitches[playingIndex] % 12;
  }, [playingIndex, scalePitches]);

  // Helper to check standard fret marker dot displays
  const isMarkerFret = (fret) => [3, 5, 7, 9, 15].includes(fret);
  const isDoubleMarkerFret = (fret) => fret === 12;

  // Standard guitar row mapping in inverted TAB layout order (top-to-bottom, High E down to Low E):
  // Row 1: E (String 1) -> Chromatic Index 4
  // Row 2: B (String 2) -> Chromatic Index 11
  // Row 3: G (String 3) -> Chromatic Index 7
  // Row 4: D (String 4) -> Chromatic Index 2
  // Row 5: A (String 5) -> Chromatic Index 9
  // Row 6: E (String 6) -> Chromatic Index 4
  const openStringIndices = [4, 11, 7, 2, 9, 4];

  // Play custom pitch when clicking note badge on the fretboard
  const handleNoteClick = (stringIdx, fretNum) => {
    // base MIDI mapping array reflecting top-to-bottom High E down to Low E:
    const stringOpenMidis = [64, 59, 55, 50, 45, 40];
    const midi = stringOpenMidis[stringIdx] + fretNum;
    try {
      const ctx = getSamplerCtx();
      playNote(midi, ctx, ctx.currentTime, 1.2, 0.35, 0.8, 'guitar');
    } catch (err) {
      console.warn('[Scale] Failed to play note at fret:', err);
    }
  };

  return (
    <PageWrapper className="px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="relative z-10 text-center pb-8 pt-8 flex flex-col items-center">
        <h1 className="gradient-text font-display leading-tight tracking-tight font-extrabold mb-2 text-4xl sm:text-5xl flex items-center justify-center gap-3" style={{ textShadow: '0 0 20px rgba(255, 0, 122, 0.15)' }}>
          <Music4 className="text-[#FF007A]" size={40} strokeWidth={2} />
          <span>Guitar Scale Visualizer</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
          Master the fretboard. Select a root key and scale formula to map notes, identify root anchors, and play audio sequences.
        </p>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full flex flex-col gap-6">
        {/* Controls Panel */}
        <div className="glass p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5 bg-slate-950/40 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* Root Selector */}
            <div className="flex flex-col gap-1 w-full sm:w-40">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500">Root Key</span>
              <div className="relative">
                <select
                  value={root}
                  onChange={(e) => setRoot(e.target.value)}
                  className="w-full h-11 px-3 pr-10 rounded-xl border border-white/10 bg-neutral-900/60 backdrop-blur-md text-gray-200 text-sm font-semibold focus:outline-none hover:border-magenta-500/50 focus:border-magenta-500/80 focus:ring-1 focus:ring-magenta-500/50 transition-all cursor-pointer appearance-none"
                  style={{ textShadow: '0 0 8px rgba(255,255,255,0.1)' }}
                >
                  {CHROMATIC.map((note) => (
                    <option key={note} value={note} className="bg-slate-900 text-slate-200 font-semibold">
                      {note}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            </div>

            {/* Scale Type Selector */}
            <div className="flex flex-col gap-1 w-full sm:w-60">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500">Scale Type</span>
              <div className="relative">
                <select
                  value={scaleType}
                  onChange={(e) => setScaleType(e.target.value)}
                  className="w-full h-11 px-3 pr-10 rounded-xl border border-white/10 bg-neutral-900/60 backdrop-blur-md text-gray-200 text-sm font-semibold focus:outline-none hover:border-magenta-500/50 focus:border-magenta-500/80 focus:ring-1 focus:ring-magenta-500/50 transition-all cursor-pointer appearance-none"
                >
                  {SCALE_TYPES.map((type) => (
                    <option key={type.id} value={type.id} className="bg-slate-900 text-slate-200 font-semibold">
                      {type.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {playingIndex !== null ? (
              <button
                onClick={stopScalePlayback}
                className="w-full sm:w-auto h-11 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-red-500/20 bg-red-950/20 hover:bg-red-900/30 text-red-400 transition-all cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(239,68,68,0.1)]"
              >
                <Square size={15} fill="currentColor" />
                Stop Scale
              </button>
            ) : (
              <button
                onClick={handlePlayScale}
                className="w-full sm:w-auto h-11 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white transition-all cursor-pointer hover:scale-[1.03] active:scale-95 shadow-[0_0_24px_rgba(255,0,122,0.3)] border border-[#FF007A]/20"
                style={{ background: 'var(--gradient-cta)' }}
              >
                <Play size={15} fill="currentColor" />
                Play Scale
              </button>
            )}
          </div>
        </div>

        {/* Scale Notes Summary List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-4 rounded-xl border border-white/5 bg-slate-950/20 md:col-span-2 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-slate-400">
              <Info size={14} className="text-slate-500" />
              <span className="text-xs font-semibold uppercase tracking-wider">Active Notes in Scale</span>
            </div>
            <div className="flex flex-wrap gap-2.5 items-center">
              {activeScaleNotes.map((note, index) => {
                const isRoot = note === root;
                return (
                  <div key={note} className="flex items-center gap-1.5">
                    <span
                      className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm border shadow-md transition-all ${
                        isRoot
                          ? 'border-[#FF7300] bg-[#FF7300]/10 text-[#FF7300] shadow-[0_0_8px_rgba(255,115,0,0.15)]'
                          : 'border-[#FF007A] bg-[#FF007A]/10 text-[#FF007A] shadow-[0_0_8px_rgba(255,0,122,0.15)]'
                      }`}
                    >
                      {note}
                    </span>
                    {index < activeScaleNotes.length - 1 && (
                      <span className="text-slate-700 font-extrabold text-xs">→</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scale Legend */}
          <div className="glass p-4 rounded-xl border border-white/5 bg-slate-950/20 flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2 text-slate-400">
              <Sliders size={14} className="text-slate-500" />
              <span className="text-xs font-semibold uppercase tracking-wider">Visual Anchor Legend</span>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#FF7300] to-orange-600 border border-[#FF7300]/30 shadow-[0_0_6px_rgba(255,115,0,0.4)]" />
                <span className="text-slate-300 font-medium">Root Anchor Note</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#FF007A] to-rose-600 border border-[#FF007A]/30 shadow-[0_0_6px_rgba(255,0,122,0.4)]" />
                <span className="text-slate-300 font-medium">Interval Scale Note</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fretboard Section */}
        <div className="glass p-6 rounded-3xl border border-white/5 bg-slate-950/50 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-slate-950/20 via-transparent to-slate-950/30" />
          
          <div className="flex items-center gap-2 mb-4 text-slate-400">
            <HelpCircle size={14} className="text-slate-500" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">15-Fret Interactive Fretboard Visualizer (Scroll horizontally on mobile)</span>
          </div>

          {/* Fretboard scrollable wrapper */}
          <div className="overflow-x-auto select-none rounded-2xl border border-slate-900 bg-[#0d0d14] relative shadow-inner pb-2 pt-1">
            <div className="min-w-[900px] flex flex-col relative py-2 pr-6">
              
              {/* String / Fret matrix layout */}
              <div className="flex flex-col gap-0.5 relative z-10">
                {/* Fret label column indices */}
                <div className="flex h-6 items-end mb-2">
                  <div className="w-12 flex-shrink-0" /> {/* spacing for open strings header */}
                  {Array.from({ length: 16 }).map((_, fretNum) => (
                    <div
                      key={fretNum}
                      className="flex-1 flex justify-center text-[10px] font-extrabold tracking-wider text-slate-500 select-none"
                    >
                      {fretNum === 0 ? 'OPEN' : `Fret ${fretNum}`}
                    </div>
                  ))}
                </div>

                {/* Vertical frets line overlay */}
                <div className="absolute inset-0 pointer-events-none z-0 flex pr-1.5" style={{ top: '32px', bottom: '0px' }}>
                  <div className="w-12 flex-shrink-0" />
                  {Array.from({ length: 16 }).map((_, fretNum) => (
                    <div
                      key={fretNum}
                      className={`flex-1 relative h-full ${
                        fretNum === 0 
                          ? 'border-r-8 border-slate-200/90' 
                          : 'border-r border-slate-700/60 shadow-[1px_0_0_rgba(0,0,0,0.8)]'
                      }`}
                    >
                      {/* Fret markers dots rendered behind notes */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
                        {isMarkerFret(fretNum) && (
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-slate-500/20" />
                        )}
                        {isDoubleMarkerFret(fretNum) && (
                          <div className="flex flex-col gap-10">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-slate-500/20" />
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-slate-500/20" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 6 rows representing guitar strings */}
                {openStringIndices.map((openNoteIdx, stringIdx) => {
                  // Label string mapping (High E to Low E, top-to-bottom)
                  const stringLabel = OPEN_STRINGS[5 - stringIdx];
                  // Set thickness classes for strings (1 is thinnest on top, 6 is thickest on bottom)
                  const thicknessClass = [
                    'h-[1.0px]',
                    'h-[1.5px]',
                    'h-[2.0px]',
                    'h-[2.5px]',
                    'h-[3.0px]',
                    'h-[3.5px]',
                  ][stringIdx];

                  return (
                    <div key={stringIdx} className="flex h-12 items-center relative select-none">
                      {/* Left Header - String name */}
                      <div className="w-12 flex-shrink-0 flex items-center justify-center pr-3 border-r-2 border-slate-800">
                        <span className="text-xs font-black text-slate-500 tracking-tighter uppercase text-center">
                          {stringLabel}
                          <span className="text-[9px] font-medium text-slate-600 block leading-tight">
                            Str {stringIdx + 1}
                          </span>
                        </span>
                      </div>

                      {/* Absolute string line representing the actual guitar string */}
                      <div
                        className={`absolute left-12 right-0 top-1/2 -translate-y-1/2 bg-gradient-to-r from-slate-400/70 via-slate-300/60 to-slate-400/70 shadow-[0_1px_2px_rgba(0,0,0,0.4)] pointer-events-none z-0 ${thicknessClass}`}
                      />

                      {/* 16 fret columns */}
                      {Array.from({ length: 16 }).map((_, fretNum) => {
                        const noteVal = (openNoteIdx + fretNum) % 12;
                        const noteName = CHROMATIC[noteVal];
                        const isInScale = activeScaleNotes.includes(noteName);
                        const isRoot = noteName === root;
                        
                        // Check if this note class is currently playing in audio sequencer
                        const isNotePlaying = currentPlayingPitchClass === noteVal;

                        return (
                          <div
                            key={fretNum}
                            className={`flex-1 h-full flex items-center justify-center relative z-10 ${
                              fretNum === 0 ? 'pr-4' : ''
                            }`}
                          >
                            {isInScale ? (
                              <motion.div
                                key={`${root}-${scaleType}-${stringIdx}-${fretNum}`}
                                onClick={() => handleNoteClick(stringIdx, fretNum)}
                                animate={isNotePlaying ? {
                                  scale: [1, 1.25, 1],
                                  boxShadow: isRoot
                                    ? '0 0 24px #FF7300, 0 0 10px #FF7300'
                                    : '0 0 24px #FF007A, 0 0 10px #FF007A'
                                } : {}}
                                transition={{ duration: 0.3 }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[11px] shadow-lg border cursor-pointer select-none relative group transition-all duration-200 ${
                                  isRoot
                                    ? 'border-orange-300 bg-gradient-to-br from-[#FF7300] to-orange-600 text-white shadow-[0_2px_8px_rgba(255,115,0,0.4)] hover:shadow-[0_0_16px_rgba(255,115,0,0.7)]'
                                    : 'border-pink-300 bg-gradient-to-br from-[#FF007A] to-rose-600 text-white shadow-[0_2px_8px_rgba(255,0,122,0.4)] hover:shadow-[0_0_16px_rgba(255,0,122,0.7)]'
                                }`}
                              >
                                {noteName}
                                
                                {/* Pulse glow outline when note is playing */}
                                {isNotePlaying && (
                                  <span className={`absolute -inset-1 rounded-full animate-ping border-2 opacity-75 ${
                                    isRoot ? 'border-[#FF7300]' : 'border-[#FF007A]'
                                  }`} />
                                )}
                              </motion.div>
                            ) : (
                              // Dim fret dots placeholders for non-scale notes
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-800/60 border border-slate-700/10 pointer-events-none" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
