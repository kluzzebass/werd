export type TextAlign = 'left' | 'center' | 'right' | 'justify'

export interface WordFormat {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  fontSize: number
  fontFamily: string
  fontColor: string
  backgroundColor: string
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
  comment?: WordComment | null
}

export interface WerdFile {
  version: string
  word: WordEntry
}

export const DEFAULT_WORD_FORMAT: WordFormat = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  fontSize: 14,
  fontFamily: 'Arial',
  fontColor: '#000000',
  backgroundColor: '#ffffff',
  textAlign: 'left',
}

export const createDefaultWord = (): WordEntry => ({
  value: null,
  format: { ...DEFAULT_WORD_FORMAT }
})

