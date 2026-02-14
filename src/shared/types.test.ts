import { describe, it, expect } from 'vitest'
import {
  createDefaultWord,
  DEFAULT_WORD_FORMAT,
  DEFAULT_CHAR_FORMAT,
  expandCharFormats,
  getFormatRuns,
  charFormatsEqual,
} from './types'

describe('types', () => {
  describe('createDefaultWord', () => {
    it('should create a word with null value', () => {
      const word = createDefaultWord()
      expect(word.value).toBeNull()
    })

    it('should create a word with default format', () => {
      const word = createDefaultWord()
      expect(word.format.textAlign).toBe('left')
    })

    it('should create a word with null charFormats', () => {
      const word = createDefaultWord()
      expect(word.charFormats).toBeNull()
    })

    it('should create independent copies of format', () => {
      const word1 = createDefaultWord()
      const word2 = createDefaultWord()
      word1.format.textAlign = 'center'
      expect(word2.format.textAlign).toBe('left')
    })
  })

  describe('DEFAULT_WORD_FORMAT', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_WORD_FORMAT.textAlign).toBe('left')
    })
  })

  describe('DEFAULT_CHAR_FORMAT', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_CHAR_FORMAT.bold).toBe(false)
      expect(DEFAULT_CHAR_FORMAT.italic).toBe(false)
      expect(DEFAULT_CHAR_FORMAT.underline).toBe(false)
      expect(DEFAULT_CHAR_FORMAT.strikethrough).toBe(false)
      expect(DEFAULT_CHAR_FORMAT.fontSize).toBe(14)
      expect(DEFAULT_CHAR_FORMAT.fontFamily).toBe('Arial')
      expect(DEFAULT_CHAR_FORMAT.fontColor).toBe('#000000')
    })
  })

  describe('expandCharFormats', () => {
    it('should create array of formats matching string length', () => {
      const formats = expandCharFormats('hello', DEFAULT_CHAR_FORMAT)
      expect(formats).toHaveLength(5)
      formats.forEach(f => {
        expect(f.bold).toBe(false)
        expect(f.fontSize).toBe(14)
      })
    })

    it('should create independent copies', () => {
      const formats = expandCharFormats('ab', { ...DEFAULT_CHAR_FORMAT, bold: true })
      formats[0].bold = false
      expect(formats[1].bold).toBe(true)
    })
  })

  describe('getFormatRuns', () => {
    it('should return empty array for empty value', () => {
      expect(getFormatRuns('', null)).toEqual([])
    })

    it('should return single run for null charFormats', () => {
      const runs = getFormatRuns('hello', null)
      expect(runs).toHaveLength(1)
      expect(runs[0].text).toBe('hello')
      expect(runs[0].startIndex).toBe(0)
    })

    it('should group consecutive same-format chars', () => {
      const bold = { ...DEFAULT_CHAR_FORMAT, bold: true }
      const normal = { ...DEFAULT_CHAR_FORMAT }
      const charFormats = [bold, bold, normal, normal, normal]
      const runs = getFormatRuns('Hello', charFormats)
      expect(runs).toHaveLength(2)
      expect(runs[0].text).toBe('He')
      expect(runs[0].format.bold).toBe(true)
      expect(runs[1].text).toBe('llo')
      expect(runs[1].format.bold).toBe(false)
    })

    it('should handle each char having different format', () => {
      const f1 = { ...DEFAULT_CHAR_FORMAT, bold: true }
      const f2 = { ...DEFAULT_CHAR_FORMAT, italic: true }
      const f3 = { ...DEFAULT_CHAR_FORMAT }
      const runs = getFormatRuns('abc', [f1, f2, f3])
      expect(runs).toHaveLength(3)
    })
  })

  describe('charFormatsEqual', () => {
    it('should return true for identical formats', () => {
      expect(charFormatsEqual(DEFAULT_CHAR_FORMAT, { ...DEFAULT_CHAR_FORMAT })).toBe(true)
    })

    it('should return false for different formats', () => {
      expect(charFormatsEqual(DEFAULT_CHAR_FORMAT, { ...DEFAULT_CHAR_FORMAT, bold: true })).toBe(false)
    })
  })
})
