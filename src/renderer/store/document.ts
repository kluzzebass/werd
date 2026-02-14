import { create } from 'zustand'
import {
  WordEntry,
  WordFormat,
  CharFormat,
  WordComment,
  WerdFile,
  DEFAULT_WORD_FORMAT,
  DEFAULT_CHAR_FORMAT,
  createDefaultWord,
} from '@shared/types'
import { useHistoryStore } from './history'

/**
 * Validate that a value is a single word (no whitespace).
 * Returns the trimmed word or empty string.
 */
export function validateSingleWord(value: string): string {
  return value.replace(/[^\p{L}\p{N}]/gu, '')
}

interface DocumentState {
  word: WordEntry
  filePath: string | null
  isDirty: boolean

  updateWordValue: (value: string, cursorPos?: number) => void
  updateWordFormat: (format: Partial<WordFormat>) => void
  updateWordComment: (comment: WordComment | null) => void

  updateCharFormat: (format: Partial<CharFormat>, start: number, end: number) => void
  updateAllCharFormat: (format: Partial<CharFormat>) => void
  getCharFormatAt: (index: number) => CharFormat
  getCommonCharFormat: (start: number, end: number) => Partial<CharFormat>

  newDocument: () => void
  loadDocument: (data: WerdFile, filePath?: string) => void
  getDocumentData: () => WerdFile
  setFilePath: (path: string | null) => void
  setDirty: (dirty: boolean) => void

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

function ensureCharFormats(word: WordEntry): CharFormat[] {
  const len = word.value ? word.value.length : 0
  if (!word.charFormats) {
    return Array.from({ length: len }, () => ({ ...DEFAULT_CHAR_FORMAT }))
  }
  if (word.charFormats.length === len) return word.charFormats
  if (word.charFormats.length < len) {
    const last = word.charFormats.length > 0
      ? word.charFormats[word.charFormats.length - 1]
      : DEFAULT_CHAR_FORMAT
    return [
      ...word.charFormats,
      ...Array.from({ length: len - word.charFormats.length }, () => ({ ...last }))
    ]
  }
  return word.charFormats.slice(0, len)
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  ...createInitialState(),

  updateWordValue: (value: string, cursorPos?: number) => {
    const processedValue = validateSingleWord(value)

    set(state => {
      const oldValue = state.word.value ?? ''
      const oldFormats = ensureCharFormats(state.word)
      const newLen = processedValue.length

      let newFormats: CharFormat[]
      if (newLen === 0) {
        newFormats = []
      } else if (oldValue.length === 0) {
        newFormats = Array.from({ length: newLen }, () => ({ ...DEFAULT_CHAR_FORMAT }))
      } else {
        const diff = newLen - oldValue.length
        if (diff > 0) {
          const inheritIdx = cursorPos !== undefined
            ? Math.max(0, Math.min(cursorPos - diff, oldFormats.length - 1))
            : Math.max(0, oldFormats.length - 1)
          const inheritFmt = oldFormats[inheritIdx] || DEFAULT_CHAR_FORMAT
          const insertPos = cursorPos !== undefined ? cursorPos - diff : oldValue.length
          newFormats = [
            ...oldFormats.slice(0, insertPos),
            ...Array.from({ length: diff }, () => ({ ...inheritFmt })),
            ...oldFormats.slice(insertPos),
          ]
        } else if (diff < 0) {
          const deleteCount = -diff
          const deleteStart = cursorPos !== undefined ? cursorPos : Math.max(0, oldValue.length + diff)
          newFormats = [
            ...oldFormats.slice(0, deleteStart),
            ...oldFormats.slice(deleteStart + deleteCount),
          ]
        } else {
          newFormats = [...oldFormats]
        }
      }

      if (newFormats.length > newLen) newFormats = newFormats.slice(0, newLen)
      while (newFormats.length < newLen) {
        newFormats.push({ ...DEFAULT_CHAR_FORMAT })
      }

      return {
        word: {
          ...state.word,
          value: processedValue === '' ? null : processedValue,
          charFormats: newLen > 0 ? newFormats : null,
        },
        isDirty: true
      }
    })
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

  updateCharFormat: (format: Partial<CharFormat>, start: number, end: number) => {
    set(state => {
      const formats = ensureCharFormats(state.word)
      const newFormats = formats.map((f, i) =>
        i >= start && i < end ? { ...f, ...format } : f
      )
      return {
        word: {
          ...state.word,
          charFormats: newFormats.length > 0 ? newFormats : null,
        },
        isDirty: true
      }
    })
  },

  updateAllCharFormat: (format: Partial<CharFormat>) => {
    set(state => {
      const formats = ensureCharFormats(state.word)
      const newFormats = formats.map(f => ({ ...f, ...format }))
      return {
        word: {
          ...state.word,
          charFormats: newFormats.length > 0 ? newFormats : null,
        },
        isDirty: true
      }
    })
  },

  getCharFormatAt: (index: number): CharFormat => {
    const { word } = get()
    if (!word.charFormats || index < 0 || index >= word.charFormats.length) {
      return { ...DEFAULT_CHAR_FORMAT }
    }
    return { ...word.charFormats[index] }
  },

  getCommonCharFormat: (start: number, end: number): Partial<CharFormat> => {
    const { word } = get()
    const formats = word.charFormats
    if (!formats || start >= end) return { ...DEFAULT_CHAR_FORMAT }

    const s = Math.max(0, start)
    const e = Math.min(formats.length, end)
    if (s >= e) return { ...DEFAULT_CHAR_FORMAT }

    const first = formats[s]
    const result: Partial<CharFormat> = { ...first }

    for (let i = s + 1; i < e; i++) {
      const f = formats[i]
      if (result.bold !== undefined && result.bold !== f.bold) result.bold = undefined
      if (result.italic !== undefined && result.italic !== f.italic) result.italic = undefined
      if (result.underline !== undefined && result.underline !== f.underline) result.underline = undefined
      if (result.strikethrough !== undefined && result.strikethrough !== f.strikethrough) result.strikethrough = undefined
      if (result.fontSize !== undefined && result.fontSize !== f.fontSize) result.fontSize = undefined
      if (result.fontFamily !== undefined && result.fontFamily !== f.fontFamily) result.fontFamily = undefined
      if (result.fontColor !== undefined && result.fontColor !== f.fontColor) result.fontColor = undefined
    }

    return result
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
    if (!data.word) {
      console.error('Invalid document data')
      return
    }

    const word: WordEntry = {
      value: data.word.value ?? null,
      format: { ...DEFAULT_WORD_FORMAT, ...data.word.format },
      charFormats: data.word.charFormats ?? null,
      comment: data.word.comment ?? null,
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
      version: '1.0',
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
