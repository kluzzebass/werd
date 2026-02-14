import { describe, it, expect } from 'vitest'
import {
  createDefaultWord,
  DEFAULT_WORD_FORMAT
} from './types'

describe('types', () => {
  describe('createDefaultWord', () => {
    it('should create a word with null value', () => {
      const word = createDefaultWord()
      expect(word.value).toBeNull()
    })

    it('should create a word with default format', () => {
      const word = createDefaultWord()
      expect(word.format.bold).toBe(false)
      expect(word.format.italic).toBe(false)
      expect(word.format.fontSize).toBe(14)
      expect(word.format.fontFamily).toBe('Arial')
    })

    it('should create independent copies of format', () => {
      const word1 = createDefaultWord()
      const word2 = createDefaultWord()
      word1.format.fontColor = '#ff0000'
      expect(word2.format.fontColor).toBe('#000000')
    })
  })

  describe('DEFAULT_WORD_FORMAT', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_WORD_FORMAT.bold).toBe(false)
      expect(DEFAULT_WORD_FORMAT.italic).toBe(false)
      expect(DEFAULT_WORD_FORMAT.underline).toBe(false)
      expect(DEFAULT_WORD_FORMAT.strikethrough).toBe(false)
      expect(DEFAULT_WORD_FORMAT.fontSize).toBe(14)
      expect(DEFAULT_WORD_FORMAT.fontFamily).toBe('Arial')
      expect(DEFAULT_WORD_FORMAT.fontColor).toBe('#000000')
      expect(DEFAULT_WORD_FORMAT.backgroundColor).toBe('#ffffff')
      expect(DEFAULT_WORD_FORMAT.textAlign).toBe('left')
    })
  })
})
