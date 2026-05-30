import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'stringlab-chord-favorites'

/**
 * Persists a Set of chord IDs in localStorage.
 * Returns { favorites: Set, toggleFavorite, isFavorite }
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch {
      return new Set()
    }
  })

  // Sync to localStorage whenever the Set changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]))
    } catch {
      // ignore quota errors
    }
  }, [favorites])

  const toggleFavorite = useCallback((id) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const isFavorite = useCallback((id) => favorites.has(id), [favorites])

  return { favorites, toggleFavorite, isFavorite }
}
