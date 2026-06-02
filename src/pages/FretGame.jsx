import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, Play, RefreshCw, Trophy, Volume2, Award, Info } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import { getSamplerCtx, playNote, getSamplerReady } from '../utils/tonePlayer'
import { CHROMATIC, OPEN_STRINGS } from '../data/scales'

// ── Constants ─────────────────────────────────────────────────────────────────
const OPEN_STRING_INDICES = [4, 11, 7, 2, 9, 4]
const OPEN_STRING_MIDIS = [64, 59, 55, 50, 45, 40] // High E down to Low E

export default function FretGame() {
  // Game state
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [highStreak, setHighStreak] = useState(0)
  const [timeLimit, setTimeLimit] = useState(5) // default 5s, options: 5, 10, 15
  const [timeLeft, setTimeLeft] = useState(5000) // countdown
  const [gameActive, setGameActive] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState(null)
  
  // Game preferences
  const [showGuide, setShowGuide] = useState(false) // reveals note names on fretboard (reduces points)
  const [loadingInstruments, setLoadingInstruments] = useState(true)

  // Visual/Animation triggers
  const [isShaking, setIsShaking] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)
  const [feedbackClick, setFeedbackClick] = useState(null) // { stringIdx, fretNum, isCorrect }

  // Sound feedback synthesizer
  const playBuzz = useCallback(() => {
    try {
      const ctx = getSamplerCtx()
      if (ctx.state === 'suspended') ctx.resume()
      
      const playTone = (freq, duration) => {
        const osc = ctx.createOscillator()
        const gainNode = ctx.createGain()
        
        osc.type = 'triangle' // softer and more organic than sawtooth
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
        
        osc.connect(gainNode)
        gainNode.connect(ctx.destination)
        
        osc.start()
        osc.stop(ctx.currentTime + duration)
      }
      
      // Play a short, professional dissonant tritone chime (250ms decay)
      playTone(293.66, 0.25) // D4
      playTone(415.30, 0.25) // G#4
    } catch (err) {
      console.warn('Failed to play error buzz audio:', err)
    }
  }, [])

  const playSuccessChime = useCallback(() => {
    try {
      const ctx = getSamplerCtx()
      if (ctx.state === 'suspended') ctx.resume()
      
      const playTone = (freq, delay, dur) => {
        const osc = ctx.createOscillator()
        const gainNode = ctx.createGain()
        
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + delay)
        gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + delay + 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur)
        
        osc.connect(gainNode)
        gainNode.connect(ctx.destination)
        
        osc.start(ctx.currentTime + delay)
        osc.stop(ctx.currentTime + delay + dur)
      }
      
      // E5 -> G#5 -> B5 arpeggio chime
      playTone(659.25, 0, 0.18)
      playTone(830.61, 0.06, 0.22)
      playTone(987.77, 0.12, 0.3)
    } catch (err) {
      console.warn('Failed to play success chime:', err)
    }
  }, [])

  // Preload soundbank
  useEffect(() => {
    const loadSound = async () => {
      try {
        await getSamplerReady('guitar')
      } catch (err) {
        console.warn('Failed to load guitar sampler:', err)
      } finally {
        setLoadingInstruments(false)
      }
    }
    loadSound()
  }, [])

  // Prompt generator
  const generateNextPrompt = useCallback((toAvoid = null) => {
    let stringIdx, noteName
    do {
      stringIdx = Math.floor(Math.random() * 6)
      noteName = CHROMATIC[Math.floor(Math.random() * 12)]
    } while (toAvoid && toAvoid.stringIdx === stringIdx && toAvoid.noteName === noteName)

    return {
      stringIdx,
      noteName,
      stringLabel: OPEN_STRINGS[5 - stringIdx]
    }
  }, [])

  // Game Handlers
  const startGame = () => {
    setScore(0)
    setStreak(0)
    setTimeLeft(timeLimit * 1000)
    const prompt = generateNextPrompt()
    setCurrentPrompt(prompt)
    setGameActive(true)
  }

  const stopGame = () => {
    setGameActive(false)
    setCurrentPrompt(null)
  }

  const handleTimeout = useCallback(() => {
    setIsShaking(true)
    setStreak(0)
    playBuzz()
    
    const next = generateNextPrompt(currentPrompt)
    setCurrentPrompt(next)
    setTimeLeft(timeLimit * 1000)
  }, [currentPrompt, generateNextPrompt, playBuzz, timeLimit])

  // Timer interval loop
  useEffect(() => {
    if (!gameActive || !currentPrompt) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 50) {
          clearInterval(interval)
          handleTimeout()
          return 0
        }
        return prev - 50
      })
    }, 50)

    return () => clearInterval(interval)
  }, [gameActive, currentPrompt, handleTimeout])

  const handleFretClick = (stringIdx, fretNum) => {
    if (!gameActive || !currentPrompt) return

    // Sound feedback - play note clicked
    const openNoteIdx = OPEN_STRING_INDICES[stringIdx]
    const clickedNoteName = CHROMATIC[(openNoteIdx + fretNum) % 12]
    const midi = OPEN_STRING_MIDIS[stringIdx] + fretNum
    
    try {
      const ctx = getSamplerCtx()
      playNote(midi, ctx, ctx.currentTime, 1.0, 0.4, 0.7, 'guitar')
    } catch (_) {}

    // Check correct note and string match
    const isCorrect = clickedNoteName === currentPrompt.noteName && stringIdx === currentPrompt.stringIdx

    setFeedbackClick({ stringIdx, fretNum, isCorrect })
    setTimeout(() => setFeedbackClick(null), 400)

    if (isCorrect) {
      setIsFlashing(true)
      setTimeout(() => setIsFlashing(false), 250)

      const points = showGuide ? 50 : 100
      setScore(prev => prev + points)
      setStreak(prev => {
        const next = prev + 1
        setHighStreak(h => Math.max(h, next))
        return next
      })
      playSuccessChime()

      const next = generateNextPrompt(currentPrompt)
      setCurrentPrompt(next)
      setTimeLeft(timeLimit * 1000)
    } else {
      setIsShaking(true)
      setStreak(0)
      playBuzz()

      const next = generateNextPrompt(currentPrompt)
      setCurrentPrompt(next)
      setTimeLeft(timeLimit * 1000)
    }
  }

  // Fretboard markers standard mapping
  const isMarkerFret = (fret) => [3, 5, 7, 9, 15].includes(fret)
  const isDoubleMarkerFret = (fret) => fret === 12

  return (
    <PageWrapper className="px-4 sm:px-6 lg:px-8 pb-16 flex flex-col">
      {/* Page Header */}
      <div className="relative z-10 text-center pb-8 pt-8 flex flex-col items-center">
        <h1 className="gradient-text font-display leading-normal tracking-tight font-extrabold mb-2 text-4xl sm:text-5xl flex items-center justify-center gap-3" style={{ textShadow: '0 0 20px rgba(255, 0, 122, 0.15)' }}>
          <Trophy className="text-[#FF007A]" size={40} strokeWidth={2} />
          <span>Fretboard Trainer</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm leading-normal">
          Train your muscle memory! Find the prompted note on the designated string before the timer runs out.
        </p>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full flex flex-col gap-6 items-center">
        
        {/* Start Game View */}
        {!gameActive ? (
          <div className="glass p-8 rounded-3xl border border-white/5 bg-slate-950/40 backdrop-blur-xl max-w-md w-full text-center flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#FF007A]/5 to-transparent" />
            
            <div className="w-16 h-16 rounded-full bg-[#FF007A]/10 border border-[#FF007A]/25 flex items-center justify-center text-[#FF007A] mb-2 animate-pulse shadow-[0_0_15px_rgba(255,0,122,0.2)]">
              <Award size={36} strokeWidth={1.5} />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-white leading-normal tracking-tight">Fretboard Arcade Challenge</h2>
              <p className="text-slate-400 text-sm leading-normal">
                Click on the correct note circles. Guide mode will reveal notes but halve your points. Can you beat the countdown?
              </p>
            </div>

            {/* Highscore Summary */}
            {highStreak > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl text-xs font-semibold text-[#FF7300]">
                <Trophy size={14} />
                <span>Best Streak: {highStreak} Rounds</span>
              </div>
            )}

            {/* Time Limit Selector */}
            <div className="flex flex-col gap-2 w-full">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 text-left">Time Limit per Round</span>
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl p-1 w-full justify-between">
                {[5, 10, 15].map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setTimeLimit(t)
                      setTimeLeft(t * 1000)
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                      timeLimit === t
                        ? 'bg-white/[0.12] text-white border border-white/10 shadow-sm'
                        : 'text-slate-400 hover:text-white border border-transparent'
                    }`}
                    style={timeLimit === t ? { color: '#FF007A' } : {}}
                  >
                    {t} Seconds
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              disabled={loadingInstruments}
              className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white transition-all cursor-pointer hover:scale-[1.03] active:scale-95 shadow-[0_0_24px_rgba(255,0,122,0.3)] border border-[#FF007A]/20 disabled:opacity-50"
              style={{ background: 'var(--gradient-cta)' }}
            >
              <Play size={16} fill="currentColor" />
              {loadingInstruments ? 'Loading Sounds...' : 'Start Challenge'}
            </button>
          </div>
        ) : (
          /* Active Game View */
          <motion.div
            animate={isShaking ? { x: [-10, 10, -10, 10, -5, 5, -2, 2, 0] } : {}}
            transition={{ duration: 0.4 }}
            onAnimationComplete={() => setIsShaking(false)}
            className="glass p-6 rounded-3xl border border-white/5 bg-slate-950/40 backdrop-blur-xl shadow-2xl relative overflow-hidden w-full flex flex-col"
          >
            {/* Flash Effect on Correct */}
            <AnimatePresence>
              {isFlashing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.25 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 pointer-events-none bg-[#FF007A] z-40 rounded-3xl"
                />
              )}
            </AnimatePresence>

            {/* Scoreboard Controls */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Score Card */}
              <div className="glass p-3 rounded-2xl border border-white/5 bg-slate-950/20 text-center flex flex-col justify-center">
                <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-widest">Score</span>
                <span className="text-xl font-black text-white mt-1 leading-normal tracking-tight">{score}</span>
              </div>

              {/* Timer Circular Countdown */}
              <div className="glass p-2 rounded-2xl border border-white/5 bg-slate-950/25 flex flex-col items-center justify-center relative">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle cx="28" cy="28" r="23" className="stroke-white/5" strokeWidth="4.5" fill="transparent" />
                  <motion.circle
                    cx="28"
                    cy="28"
                    r="23"
                    className="stroke-[#FF007A]"
                    strokeWidth="4.5"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 23}
                    animate={{ strokeDashoffset: (2 * Math.PI * 23) * (1 - timeLeft / (timeLimit * 1000)) }}
                    transition={{ duration: 0.05, ease: 'linear' }}
                    style={{ filter: 'drop-shadow(0 0 3px #FF007A)', strokeLinecap: 'round' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col pt-1">
                  <span className="text-xs font-black text-white tabular-nums leading-none">{(timeLeft / 1000).toFixed(1)}s</span>
                </div>
              </div>

              {/* Streak Card */}
              <div className="glass p-3 rounded-2xl border border-white/5 bg-slate-950/20 text-center flex flex-col justify-center">
                <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-widest">Streak</span>
                <span className="text-xl font-black text-[#FF7300] mt-1 leading-normal tracking-tight flex items-center justify-center gap-1">
                  {streak}
                  <span className="text-[10px] text-slate-500 font-bold">/ {highStreak}</span>
                </span>
              </div>
            </div>

            {/* active prompt challenge */}
            {currentPrompt && (
              <div className="text-center py-5 border-b border-white/[0.06] mb-6">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#FF007A] block mb-1">Active Challenge</span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white leading-normal tracking-tight">
                  Find note <span className="text-[#FF7300] bg-[#FF7300]/10 border border-[#FF7300]/25 px-2.5 py-0.5 rounded-md mx-1 font-mono font-black shadow-[0_0_8px_rgba(255,115,0,0.15)]">{currentPrompt.noteName}</span> on String {currentPrompt.stringIdx + 1} ({currentPrompt.stringLabel})!
                </h2>
              </div>
            )}

            {/* Game interactive board */}
            <div className="overflow-x-auto select-none rounded-2xl border border-slate-900 bg-[#07070b]/90 relative shadow-inner py-3">
              <div className="min-w-[840px] flex flex-col relative pr-4">
                
                {/* Grid wire layout */}
                <div className="flex flex-col gap-0.5 relative z-10">
                  {/* Fret wire labels */}
                  <div className="flex h-5 items-end mb-1">
                    <div className="w-10 flex-shrink-0" />
                    {Array.from({ length: 16 }).map((_, fretNum) => (
                      <div key={fretNum} className="flex-1 flex justify-center text-[9px] font-extrabold tracking-wider text-slate-500">
                        {fretNum === 0 ? 'OPEN' : fretNum}
                      </div>
                    ))}
                  </div>

                  {/* Fret overlays */}
                  <div className="absolute inset-0 pointer-events-none z-0 flex pr-1" style={{ top: '24px', bottom: '0px' }}>
                    <div className="w-10 flex-shrink-0" />
                    {Array.from({ length: 16 }).map((_, fretNum) => (
                      <div
                        key={fretNum}
                        className={`flex-1 relative h-full ${
                          fretNum === 0 
                            ? 'border-r-4 border-slate-300/80' 
                            : 'border-r border-slate-800/40 shadow-[1px_0_0_rgba(0,0,0,0.7)]'
                        }`}
                      >
                        {/* Fret markers dots */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-25">
                          {isMarkerFret(fretNum) && (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          )}
                          {isDoubleMarkerFret(fretNum) && (
                            <div className="flex flex-col gap-5">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 6 strings */}
                  {OPEN_STRING_INDICES.map((openNoteIdx, stringIdx) => {
                    const stringLabel = OPEN_STRINGS[5 - stringIdx];
                    const thicknessClass = [
                      'h-[0.75px]',
                      'h-[1.25px]',
                      'h-[1.75px]',
                      'h-[2.25px]',
                      'h-[2.75px]',
                      'h-[3.25px]',
                    ][stringIdx];

                    return (
                      <div key={stringIdx} className="flex h-9 items-center relative select-none">
                        {/* Left string name */}
                        <div className="w-10 flex-shrink-0 flex items-center justify-center pr-2 border-r border-slate-800/50">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center">
                            {stringLabel}
                          </span>
                        </div>

                        {/* String Line */}
                        <div className={`absolute left-10 right-0 top-1/2 -translate-y-1/2 bg-gradient-to-r from-slate-400/50 via-slate-300/40 to-slate-400/50 shadow-[0_1px_1px_rgba(0,0,0,0.3)] pointer-events-none z-0 ${thicknessClass}`} />

                        {/* Fret notes */}
                        {Array.from({ length: 16 }).map((_, fretNum) => {
                          const noteVal = (openNoteIdx + fretNum) % 12;
                          const noteName = CHROMATIC[noteVal];
                          
                          const isFeedback = feedbackClick && feedbackClick.stringIdx === stringIdx && feedbackClick.fretNum === fretNum
                          const feedbackBg = isFeedback
                            ? (feedbackClick.isCorrect
                                ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_12px_#10b981]'
                                : 'bg-red-500 border-red-400 text-white shadow-[0_0_12px_#ef4444]')
                            : ''

                          return (
                            <div key={fretNum} className={`flex-1 h-full flex items-center justify-center relative z-10 ${fretNum === 0 ? 'pr-3' : ''}`}>
                              <div
                                onClick={() => handleFretClick(stringIdx, fretNum)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[9px] shadow-md border transition-all duration-150 cursor-pointer select-none ${
                                  isFeedback
                                    ? feedbackBg
                                    : (showGuide
                                        ? 'border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                                        : 'border-white/5 bg-slate-950/20 text-transparent hover:border-[#FF007A]/40 hover:bg-[#FF007A]/15 hover:text-[#FF007A]')
                                }`}
                              >
                                {noteName}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* Game options / restart */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-white/[0.06]">
              {/* Guide Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGuide(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    showGuide
                      ? 'bg-[#FF7300]/15 border-[#FF7300]/30 text-white shadow-[0_0_8px_rgba(255,115,0,0.15)]'
                      : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <HelpCircle size={13} />
                  <span>Show Guide Notes {showGuide ? '(Half points)' : ''}</span>
                </button>
              </div>

              {/* Reset Control buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={stopGame}
                  className="px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 text-[11px] font-bold transition-all cursor-pointer"
                >
                  Stop Challenge
                </button>
                <button
                  onClick={startGame}
                  className="flex items-center gap-1 px-4 py-1.5 bg-white/[0.04] border border-white/10 rounded-xl text-[#FF007A] hover:bg-white/[0.08] text-[11px] font-bold transition-all cursor-pointer"
                >
                  <RefreshCw size={11} />
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Instructive Rules Panel */}
        <div className="glass p-5 rounded-2xl border border-white/5 bg-slate-950/20 max-w-2xl w-full flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Info size={14} className="text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider">How to Play</span>
          </div>
          <ul className="text-xs text-slate-400 list-disc list-inside flex flex-col gap-1.5 leading-normal">
            <li>A random target note and string challenge will appear in the prompt banner.</li>
            <li>Identify that note's fret coordinate on the designated string on the interactive fretboard.</li>
            <li>Click the circle within your chosen limit of <strong className="text-white">{timeLimit}.0 seconds</strong> before the countdown expires.</li>
            <li>Correct answers keep your streak alive and add points (100 pts without guides, 50 pts with guides).</li>
            <li>Timeouts or wrong clicks reset your active streak back to 0.</li>
          </ul>
        </div>

      </div>
    </PageWrapper>
  )
}
