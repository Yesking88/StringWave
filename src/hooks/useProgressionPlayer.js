/**
 * useProgressionPlayer
 *
 * Drift-free Web Audio scheduling for chord progressions with:
 *  - Multi-instrument style-based playback (pop | arpeggio | sustained)
 *  - Per-channel mixer state (enable/disable + volume)
 *  - stopRef flag checked before every loop iteration
 *  - Full node tracking with .stop() on every live node during teardown
 *  - AudioContext suspension on unmount
 *
 * Exposes: { isPlaying, playingSlotId, play, stop }
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { getSamplerCtx } from '../utils/tonePlayer'
import {
  scheduleStyleBlock,
  cleanupNodes,
  DEFAULT_MIX,
} from '../utils/progressionAudio'

/**
 * @param {Object} options
 * @param {Object[]} options.sections     - progression sections
 * @param {number}   options.bpm          - beats per minute
 * @param {string}   options.style        - 'pop' | 'arpeggio' | 'sustained'
 * @param {Object}   options.mix          - per-channel { enabled, volume } map
 * @param {Map}      options.chordsMap    - Map<id, chord>
 */
export function useProgressionPlayer({ sections, bpm, style = 'pop', mix = DEFAULT_MIX, chordsMap }) {
  const [isPlaying,     setIsPlaying]  = useState(false)
  const [playingSlotId, setPlayingId]  = useState(null)

  // ── Refs (survive re-renders, safe to read in closures) ─────────────────
  const stopRef      = useRef(false)
  const scheduledRef = useRef([])      // flat list of node groups for cleanup
  const timersRef    = useRef([])      // visual callback setTimeout handles
  const loopTimerRef = useRef(null)
  const ctxRef       = useRef(null)

  // ── Teardown helper ──────────────────────────────────────────────────────
  const cancelAll = useCallback(() => {
    stopRef.current = true

    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []

    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current)
      loopTimerRef.current = null
    }

    // Stop and disconnect every scheduled audio node immediately
    cleanupNodes(scheduledRef.current)
    scheduledRef.current = []

    setPlayingId(null)
  }, [])

  // ── Unmount cleanup ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopRef.current = true
      cleanupNodes(scheduledRef.current)
      scheduledRef.current = []
      timersRef.current.forEach(t => clearTimeout(t))
      timersRef.current = []
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current)
      ctxRef.current?.suspend()
    }
  }, [])

  // ── Schedule one full pass ───────────────────────────────────────────────
  const schedulePass = useCallback((ctx, startTime) => {
    const beatDuration = 60 / bpm
    let cursor = startTime
    const allNodes = []
    let measureIndex = 0

    sections.forEach(section => {
      section.chords.forEach(slot => {
        if (!slot.chordId) { 
          cursor += slot.beats * beatDuration
          measureIndex++
          return 
        }
        const chord = chordsMap.get(slot.chordId)
        if (!chord)  { 
          cursor += slot.beats * beatDuration
          measureIndex++
          return 
        }

        const chordDuration = slot.beats * beatDuration
        // Schedule full duration to allow seamless sustain overlaps via release tails
        const nodes = scheduleStyleBlock(
          ctx, chord, style, mix,
          cursor, chordDuration, bpm, measureIndex
        )
        allNodes.push(...nodes)

        // Visual callback — fires ~5 ms early (imperceptible)
        const delay  = Math.max(0, (cursor - ctx.currentTime) * 1000 - 5)
        const slotId = slot.id
        const t = setTimeout(() => {
          if (!stopRef.current) setPlayingId(slotId)
        }, delay)
        timersRef.current.push(t)

        cursor += chordDuration
        measureIndex++
      })
    })

    scheduledRef.current.push(...allNodes)
    return cursor - startTime   // total pass duration in seconds
  }, [sections, bpm, style, mix, chordsMap])

  // ── Play ─────────────────────────────────────────────────────────────────
  const play = useCallback(() => {
    const hasChords = sections.some(s => s.chords.some(c => c.chordId))
    if (!hasChords) return

    cancelAll()
    stopRef.current = false
    setIsPlaying(true)

    const ctx = getSamplerCtx()
    ctxRef.current = ctx
    if (ctx.state === 'suspended') ctx.resume()

    const loop = (startTime) => {
      if (stopRef.current) return

      const passDuration = schedulePass(ctx, startTime)
      // Re-schedule ~200ms before the pass ends to avoid gaps
      const delayMs = Math.max(50, (passDuration - 0.2) * 1000)

      loopTimerRef.current = setTimeout(() => {
        if (!stopRef.current) loop(startTime + passDuration)
      }, delayMs)
    }

    loop(ctx.currentTime + 0.05)
  }, [cancelAll, schedulePass, sections])

  // ── Stop ─────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    cancelAll()
    setIsPlaying(false)
  }, [cancelAll])

  return { isPlaying, playingSlotId, play, stop }
}
