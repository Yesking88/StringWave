/**
 * useSavedProgressions
 *
 * Persist and recall full progression states to localStorage.
 * Key: 'stringlab_progressions'
 *
 * Shape stored:
 * {
 *   id: string,
 *   name: string,
 *   savedAt: number (Date.now()),
 *   key: string,
 *   bpm: number,
 *   instrument: string,
 *   sections: [{ id, label, chords: [{ id, chordId, beats }] }]
 * }
 *
 * Exposes: { list, save, load, remove }
 */

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'stringlab_progressions'

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeStorage(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch { /* storage unavailable */ }
}

export function useSavedProgressions() {
  const [list, setList] = useState(() =>
    readStorage().sort((a, b) => b.savedAt - a.savedAt)
  )

  /** Save (or overwrite by name) a progression state */
  const save = useCallback((name, state) => {
    const existing = readStorage()
    // Check if same name already exists → overwrite
    const idx = existing.findIndex(p => p.name === name)
    const entry = {
      id: idx >= 0 ? existing[idx].id : crypto.randomUUID(),
      name,
      savedAt: Date.now(),
      ...state,
    }
    if (idx >= 0) {
      existing[idx] = entry
    } else {
      existing.unshift(entry)
    }
    writeStorage(existing)
    setList([...existing].sort((a, b) => b.savedAt - a.savedAt))
    return entry.id
  }, [])

  /** Load a progression by id — returns the state object or null */
  const load = useCallback((id) => {
    const existing = readStorage()
    return existing.find(p => p.id === id) ?? null
  }, [])

  /** Delete a saved progression by id */
  const remove = useCallback((id) => {
    const updated = readStorage().filter(p => p.id !== id)
    writeStorage(updated)
    setList(updated.sort((a, b) => b.savedAt - a.savedAt))
  }, [])

  return { list, save, load, remove }
}
