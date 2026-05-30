import { useState, useEffect, useRef, useCallback } from 'react'

export function useMetronome() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(100)
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4)
  const [subdivision, setSubdivision] = useState('Quarter') // 'Quarter' | 'Eighth' | 'Sixteenth'
  const [volume, setVolume] = useState(80)
  const [currentBeat, setCurrentBeat] = useState(-1) // -1 means none (stopped)

  const audioCtxRef = useRef(null)
  const masterGainRef = useRef(null)
  const schedulerTimerRef = useRef(null)
  const animationFrameRef = useRef(null)

  const bpmRef = useRef(bpm)
  const beatsRef = useRef(beatsPerMeasure)
  const subRef = useRef(subdivision)
  const volumeRef = useRef(volume)

  useEffect(() => { bpmRef.current = bpm }, [bpm])
  useEffect(() => { beatsRef.current = beatsPerMeasure }, [beatsPerMeasure])
  useEffect(() => { subRef.current = subdivision }, [subdivision])
  useEffect(() => { volumeRef.current = volume }, [volume])

  // Next beat parameters
  const nextNoteTimeRef = useRef(0)
  const subStepIndexRef = useRef(0)
  const queueRef = useRef([])

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      audioCtxRef.current = new AudioContextClass()
      masterGainRef.current = audioCtxRef.current.createGain()
      masterGainRef.current.connect(audioCtxRef.current.destination)
    }
    masterGainRef.current.gain.value = volumeRef.current / 100
  }, [])

  // Update master gain node when volume changes
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume / 100
    }
  }, [volume])

  const playClick = useCallback((time, frequency, decay, clickVolume) => {
    const audioCtx = audioCtxRef.current
    const masterGain = masterGainRef.current
    if (!audioCtx || !masterGain) return

    const osc = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    osc.connect(gainNode)
    gainNode.connect(masterGain)

    osc.frequency.value = frequency
    gainNode.gain.setValueAtTime(clickVolume, time)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + decay)

    osc.start(time)
    osc.stop(time + decay + 0.02)
  }, [])

  const scheduleNote = useCallback((stepIndex, time) => {
    const currentSub = subRef.current
    const currentBeats = beatsRef.current

    let subFactor = 1
    if (currentSub === 'Eighth') subFactor = 2
    else if (currentSub === 'Sixteenth') subFactor = 4

    const isMainBeat = stepIndex % subFactor === 0
    const mainBeatIndex = Math.floor(stepIndex / subFactor) % currentBeats

    if (isMainBeat) {
      const isBeat1 = mainBeatIndex === 0
      if (isBeat1) {
        // Beat 1 accent: 880Hz, 10ms decay
        playClick(time, 880, 0.010, 1.0)
      } else {
        // Other beats: 440Hz, 15ms decay
        playClick(time, 440, 0.015, 0.7)
      }
    } else {
      // Subdivision: 220Hz, 8ms decay, lower gain
      playClick(time, 220, 0.008, 0.3)
    }
  }, [playClick])

  const start = useCallback(async () => {
    initAudio()
    const audioCtx = audioCtxRef.current
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume()
    }

    if (isPlaying) return
    setIsPlaying(true)
    setCurrentBeat(0)

    nextNoteTimeRef.current = audioCtx.currentTime + 0.05
    subStepIndexRef.current = 0
    queueRef.current = []

    const lookahead = 25 // ms
    const scheduleAheadTime = 0.1 // seconds

    const scheduler = () => {
      const bpmVal = bpmRef.current
      const subVal = subRef.current
      const beatsVal = beatsRef.current

      let subFactor = 1
      if (subVal === 'Eighth') subFactor = 2
      else if (subVal === 'Sixteenth') subFactor = 4

      const secondsPerBeat = 60.0 / bpmVal
      const secondsPerStep = secondsPerBeat / subFactor

      while (nextNoteTimeRef.current < audioCtx.currentTime + scheduleAheadTime) {
        scheduleNote(subStepIndexRef.current, nextNoteTimeRef.current)

        // Queue main beat timings for UI syncing
        const isMainBeat = subStepIndexRef.current % subFactor === 0
        if (isMainBeat) {
          const mainBeatIndex = Math.floor(subStepIndexRef.current / subFactor) % beatsVal
          queueRef.current.push({ time: nextNoteTimeRef.current, beat: mainBeatIndex })
        }

        nextNoteTimeRef.current += secondsPerStep
        subStepIndexRef.current++
      }

      schedulerTimerRef.current = setTimeout(scheduler, lookahead)
    }

    scheduler()

    const checkQueue = () => {
      const now = audioCtx.currentTime
      while (queueRef.current.length > 0 && queueRef.current[0].time <= now) {
        const played = queueRef.current.shift()
        setCurrentBeat(played.beat)
      }
      animationFrameRef.current = requestAnimationFrame(checkQueue)
    }
    animationFrameRef.current = requestAnimationFrame(checkQueue)

  }, [isPlaying, initAudio, scheduleNote])

  const stop = useCallback(() => {
    if (!isPlaying) return
    setIsPlaying(false)
    setCurrentBeat(-1)

    if (schedulerTimerRef.current) {
      clearTimeout(schedulerTimerRef.current)
      schedulerTimerRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    queueRef.current = []
  }, [isPlaying])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (schedulerTimerRef.current) clearTimeout(schedulerTimerRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [])

  return {
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
  }
}
