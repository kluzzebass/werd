import { create } from 'zustand'

interface SelectionState {
  selectionStart: number
  selectionEnd: number
  hasSelection: boolean

  setSelection: (start: number, end: number) => void
  clearSelection: () => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectionStart: 0,
  selectionEnd: 0,
  hasSelection: false,

  setSelection: (start: number, end: number) => {
    set({
      selectionStart: Math.min(start, end),
      selectionEnd: Math.max(start, end),
      hasSelection: start !== end,
    })
  },

  clearSelection: () => {
    set({
      selectionStart: 0,
      selectionEnd: 0,
      hasSelection: false,
    })
  },
}))
