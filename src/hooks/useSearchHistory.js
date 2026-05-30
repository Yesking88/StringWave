import { useState, useCallback } from 'react'

const KEY = 'stringlab-song-history'
const MAX = 8   // maximum recent searches stored

/**
 * Persists recent search queries in localStorage (ordered most-recent first).
 * Returns { history, addSearch, removeSearch, clearHistory }
 */
export function useSearchHistory() {
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]')
    } catch {
      return []
    }
  })

  const save = (next) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  const addSearch = useCallback((query) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setHistory(prev => {
      // De-duplicate (case-insensitive), put new at front, cap at MAX
      const deduped = [trimmed, ...prev.filter(h => h.toLowerCase() !== trimmed.toLowerCase())]
      const next = deduped.slice(0, MAX)
      save(next)
      return next
    })
  }, [])

  const removeSearch = useCallback((query) => {
    setHistory(prev => {
      const next = prev.filter(h => h !== query)
      save(next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    try { localStorage.removeItem(KEY) } catch { /* ignore */ }
    setHistory([])
  }, [])

  return { history, addSearch, removeSearch, clearHistory }
}
