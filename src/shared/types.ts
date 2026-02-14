export type TextAlign = 'left' | 'center' | 'right' | 'justify'

// Per-character formatting properties
export interface CharFormat {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  fontSize: number
  fontFamily: string
  fontColor: string
  backgroundColor: string
}

// Word-level formatting (applies to the whole word, not individual characters)
export interface WordFormat {
  textAlign: TextAlign
}

export interface WordComment {
  text: string
  author: string
  timestamp: number
}

export interface WordEntry {
  value: string | null
  format: WordFormat
  charFormats: CharFormat[] | null
  comment?: WordComment | null
}

export interface WerdFile {
  version: string
  word: WordEntry
}

export const DEFAULT_CHAR_FORMAT: CharFormat = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  fontSize: 14,
  fontFamily: 'Arial',
  fontColor: '#000000',
  backgroundColor: 'transparent',
}

export const DEFAULT_WORD_FORMAT: WordFormat = {
  textAlign: 'left',
}

export const createDefaultWord = (): WordEntry => ({
  value: null,
  format: { ...DEFAULT_WORD_FORMAT },
  charFormats: null,
})

export function expandCharFormats(value: string, format: CharFormat): CharFormat[] {
  return Array.from({ length: value.length }, () => ({ ...format }))
}

export interface FormatRun {
  text: string
  format: CharFormat
  startIndex: number
}

export function getFormatRuns(value: string, charFormats: CharFormat[] | null): FormatRun[] {
  if (!value) return []

  if (!charFormats) {
    return [{ text: value, format: { ...DEFAULT_CHAR_FORMAT }, startIndex: 0 }]
  }

  const runs: FormatRun[] = []
  let currentRun: FormatRun | null = null

  for (let i = 0; i < value.length; i++) {
    const fmt = charFormats[i] || DEFAULT_CHAR_FORMAT

    if (currentRun && charFormatsEqual(currentRun.format, fmt)) {
      currentRun.text += value[i]
    } else {
      currentRun = { text: value[i], format: { ...fmt }, startIndex: i }
      runs.push(currentRun)
    }
  }

  return runs
}

export function charFormatsEqual(a: CharFormat, b: CharFormat): boolean {
  return (
    a.bold === b.bold &&
    a.italic === b.italic &&
    a.underline === b.underline &&
    a.strikethrough === b.strikethrough &&
    a.fontSize === b.fontSize &&
    a.fontFamily === b.fontFamily &&
    a.fontColor === b.fontColor &&
    a.backgroundColor === b.backgroundColor
  )
}
