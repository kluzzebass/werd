import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentStore, validateSingleWord } from './document'
import { DEFAULT_WORD_FORMAT, DEFAULT_CHAR_FORMAT } from '@shared/types'

describe('validateSingleWord', () => {
  it('should strip whitespace and join into one word', () => {
    expect(validateSingleWord('hello world')).toBe('helloworld')
  })

  it('should return a single word as-is', () => {
    expect(validateSingleWord('hello')).toBe('hello')
  })

  it('should trim whitespace', () => {
    expect(validateSingleWord('  hello  ')).toBe('hello')
  })

  it('should return empty string for empty input', () => {
    expect(validateSingleWord('')).toBe('')
    expect(validateSingleWord('   ')).toBe('')
  })
})

describe('document store', () => {
  beforeEach(() => {
    useDocumentStore.getState().newDocument()
  })

  describe('initial state', () => {
    it('should have a default word', () => {
      const { word } = useDocumentStore.getState()
      expect(word).toBeDefined()
      expect(word.value).toBeNull()
      expect(word.format).toEqual(DEFAULT_WORD_FORMAT)
      expect(word.charFormats).toBeNull()
    })

    it('should have no file path', () => {
      const { filePath } = useDocumentStore.getState()
      expect(filePath).toBeNull()
    })

    it('should not be dirty', () => {
      const { isDirty } = useDocumentStore.getState()
      expect(isDirty).toBe(false)
    })
  })

  describe('updateWordValue', () => {
    it('should update word value', () => {
      const store = useDocumentStore.getState()
      store.updateWordValue('hello')
      const { word } = useDocumentStore.getState()
      expect(word.value).toBe('hello')
    })

    it('should create charFormats array matching value length', () => {
      const store = useDocumentStore.getState()
      store.updateWordValue('hello')
      const { word } = useDocumentStore.getState()
      expect(word.charFormats).toHaveLength(5)
    })

    it('should strip whitespace into one word', () => {
      const store = useDocumentStore.getState()
      store.updateWordValue('hello world')
      const { word } = useDocumentStore.getState()
      expect(word.value).toBe('helloworld')
    })

    it('should mark document as dirty', () => {
      const store = useDocumentStore.getState()
      store.updateWordValue('test')
      const { isDirty } = useDocumentStore.getState()
      expect(isDirty).toBe(true)
    })

    it('should handle empty string as null', () => {
      const store = useDocumentStore.getState()
      store.updateWordValue('')
      const { word } = useDocumentStore.getState()
      expect(word.value).toBeNull()
      expect(word.charFormats).toBeNull()
    })
  })

  describe('updateWordFormat', () => {
    it('should update word format', () => {
      const store = useDocumentStore.getState()
      store.updateWordFormat({ textAlign: 'center' })
      const { word } = useDocumentStore.getState()
      expect(word.format.textAlign).toBe('center')
    })

    it('should preserve other format properties', () => {
      const store = useDocumentStore.getState()
      store.updateWordFormat({ textAlign: 'right' })
      const { word } = useDocumentStore.getState()
      expect(word.format.textAlign).toBe('right')
    })
  })

  describe('updateCharFormat', () => {
    it('should apply format to a range of characters', () => {
      const store = useDocumentStore.getState()
      store.updateWordValue('hello')
      store.updateCharFormat({ bold: true }, 0, 2)
      const { word } = useDocumentStore.getState()
      expect(word.charFormats![0].bold).toBe(true)
      expect(word.charFormats![1].bold).toBe(true)
      expect(word.charFormats![2].bold).toBe(false)
    })
  })

  describe('updateAllCharFormat', () => {
    it('should apply format to all characters', () => {
      const store = useDocumentStore.getState()
      store.updateWordValue('hello')
      store.updateAllCharFormat({ bold: true })
      const { word } = useDocumentStore.getState()
      word.charFormats!.forEach(f => {
        expect(f.bold).toBe(true)
      })
    })
  })

  describe('getCharFormatAt', () => {
    it('should return format at given index', () => {
      const store = useDocumentStore.getState()
      store.updateWordValue('hello')
      store.updateCharFormat({ bold: true }, 0, 1)
      const fmt = store.getCharFormatAt(0)
      expect(fmt.bold).toBe(true)
    })

    it('should return default for out-of-range index', () => {
      const store = useDocumentStore.getState()
      store.updateWordValue('hi')
      const fmt = store.getCharFormatAt(99)
      expect(fmt).toEqual(DEFAULT_CHAR_FORMAT)
    })
  })

  describe('getCommonCharFormat', () => {
    it('should return common format for uniform range', () => {
      const store = useDocumentStore.getState()
      store.updateWordValue('hello')
      store.updateAllCharFormat({ bold: true })
      const common = store.getCommonCharFormat(0, 5)
      expect(common.bold).toBe(true)
    })

    it('should return undefined for mixed values', () => {
      const store = useDocumentStore.getState()
      store.updateWordValue('hello')
      store.updateCharFormat({ bold: true }, 0, 2)
      const common = store.getCommonCharFormat(0, 5)
      expect(common.bold).toBeUndefined()
    })
  })

  describe('loadDocument', () => {
    it('should load document data', () => {
      const store = useDocumentStore.getState()
      const data = {
        version: '1.0',
        word: {
          value: 'loaded',
          format: { ...DEFAULT_WORD_FORMAT },
          charFormats: null,
          comment: null
        }
      }
      store.loadDocument(data, '/path/to/file.werd')
      const { word, filePath } = useDocumentStore.getState()
      expect(word.value).toBe('loaded')
      expect(filePath).toBe('/path/to/file.werd')
    })

    it('should not be dirty after loading', () => {
      const store = useDocumentStore.getState()
      const data = {
        version: '1.0',
        word: useDocumentStore.getState().word
      }
      store.loadDocument(data)
      const { isDirty } = useDocumentStore.getState()
      expect(isDirty).toBe(false)
    })
  })

  describe('getDocumentData', () => {
    it('should return document data in correct format', () => {
      const store = useDocumentStore.getState()
      store.updateWordValue('test')
      const data = store.getDocumentData()
      expect(data.version).toBe('1.0')
      expect(data.word.value).toBe('test')
      expect(data.word.charFormats).toHaveLength(4)
    })
  })
})
