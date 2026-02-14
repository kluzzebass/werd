import { create } from 'zustand'
import {
  WordEntry,
  WordFormat,
  WordComment,
  WerdFile,
  DEFAULT_WORD_FORMAT,
  createDefaultWord,
} from '@shared/types'
import { useHistoryStore } from './history'

/**
 * Validate that a value is a single word (no whitespace).
 * Returns the trimmed word or empty string.
 */
export function validateSingleWord(value: string): string {
  // Strip everything except Unicode letters and digits
  return value.replace(/[^\p{L}\p{N}]/gu, '')
}

interface DocumentState {
  word: WordEntry
  filePath: string | null
  isDirty: boolean

  // Word operations
  updateWordValue: (value: string) => void
  updateWordFormat: (format: Partial<WordFormat>) => void
  updateWordComment: (comment: WordComment | null) => void

  // File operations
  newDocument: () => void
  loadDocument: (data: WerdFile, filePath?: string) => void
  getDocumentData: () => WerdFile
  setFilePath: (path: string | null) => void
  setDirty: (dirty: boolean) => void

  // History
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  saveToHistory: (description: string) => void
}

const createInitialState = (): Pick<DocumentState, 'word' | 'filePath' | 'isDirty'> => {
  return {
    word: createDefaultWord(),
    filePath: null,
    isDirty: false
  }
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  ...createInitialState(),

  updateWordValue: (value: string) => {
    const processedValue = validateSingleWord(value)

    set(state => ({
      word: {
        ...state.word,
        value: processedValue === '' ? null : processedValue,
      },
      isDirty: true
    }))
  },

  updateWordFormat: (format: Partial<WordFormat>) => {
    set(state => ({
      word: {
        ...state.word,
        format: {
          ...state.word.format,
          ...format,
        }
      },
      isDirty: true
    }))
  },

  updateWordComment: (comment: WordComment | null) => {
    set(state => ({
      word: {
        ...state.word,
        comment
      },
      isDirty: true
    }))
  },

  newDocument: () => {
    set(createInitialState())
  },

  loadDocument: (data: any, filePath?: string) => {
    let word: WordEntry | undefined

    // New format: { version, word }
    if (data.word) {
      word = {
        value: data.word.value ?? null,
        format: { ...DEFAULT_WORD_FORMAT, ...data.word.format },
        comment: data.word.comment ?? null,
      }
    }
    // Old format: { version, pages: Page[] } — take first page's word
    else if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
      const firstPage = data.pages[0]
      word = {
        value: firstPage.word?.value ?? null,
        format: { ...DEFAULT_WORD_FORMAT, ...firstPage.word?.format },
        comment: firstPage.word?.comment ?? null,
      }
    }

    if (!word) {
      console.error('Invalid document data')
      return
    }

    set({
      word,
      filePath: filePath || null,
      isDirty: false
    })
  },

  getDocumentData: (): WerdFile => {
    const { word } = get()
    return {
      version: '2.0',
      word
    }
  },

  setFilePath: (path: string | null) => {
    set({ filePath: path })
  },

  setDirty: (dirty: boolean) => {
    set({ isDirty: dirty })
  },

  saveToHistory: (description: string) => {
    const { word } = get()
    useHistoryStore.getState().pushState(word, description)
  },

  undo: () => {
    const historyState = useHistoryStore.getState().undo()
    if (historyState) {
      set({
        word: historyState.word,
        isDirty: true
      })
    }
  },

  redo: () => {
    const historyState = useHistoryStore.getState().redo()
    if (historyState) {
      set({
        word: historyState.word,
        isDirty: true
      })
    }
  },

  canUndo: () => useHistoryStore.getState().canUndo(),

  canRedo: () => useHistoryStore.getState().canRedo()
}))
