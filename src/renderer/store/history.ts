import { create } from 'zustand'
import { WordEntry } from '@shared/types'

interface HistoryEntry {
  word: WordEntry
  timestamp: number
  description: string
}

interface HistoryState {
  past: HistoryEntry[]
  future: HistoryEntry[]
  maxHistory: number

  // Actions
  pushState: (word: WordEntry, description: string) => void
  undo: () => HistoryEntry | null
  redo: () => HistoryEntry | null
  canUndo: () => boolean
  canRedo: () => boolean
  clear: () => void
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  maxHistory: 50,

  pushState: (word: WordEntry, description: string) => {
    const entry: HistoryEntry = {
      word: JSON.parse(JSON.stringify(word)), // Deep clone
      timestamp: Date.now(),
      description
    }

    set(state => ({
      past: [...state.past.slice(-state.maxHistory + 1), entry],
      future: [] // Clear future when new action is performed
    }))
  },

  undo: () => {
    const { past, future } = get()
    if (past.length <= 1) return null // Keep at least one state

    const previous = past[past.length - 2]
    const current = past[past.length - 1]

    set({
      past: past.slice(0, -1),
      future: [current, ...future]
    })

    return previous
  },

  redo: () => {
    const { past, future } = get()
    if (future.length === 0) return null

    const next = future[0]

    set({
      past: [...past, next],
      future: future.slice(1)
    })

    return next
  },

  canUndo: () => {
    return get().past.length > 1
  },

  canRedo: () => {
    return get().future.length > 0
  },

  clear: () => {
    set({ past: [], future: [] })
  }
}))
