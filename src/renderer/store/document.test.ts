import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentStore, validateSingleWord } from './document'
import { DEFAULT_WORD_FORMAT } from '@shared/types'

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
    // Reset the store before each test
    useDocumentStore.getState().newDocument()
  })

  describe('initial state', () => {
    it('should have a default word', () => {
      const { word } = useDocumentStore.getState()
      expect(word).toBeDefined()
      expect(word.value).toBeNull()
      expect(word.format).toEqual(DEFAULT_WORD_FORMAT)
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
    })
  })

  describe('updateWordFormat', () => {
    it('should update word format', () => {
      const store = useDocumentStore.getState()
      store.updateWordFormat({ bold: true, fontSize: 20 })
      const { word } = useDocumentStore.getState()
      expect(word.format.bold).toBe(true)
      expect(word.format.fontSize).toBe(20)
    })

    it('should preserve other format properties', () => {
      const store = useDocumentStore.getState()
      store.updateWordFormat({ bold: true })
      const { word } = useDocumentStore.getState()
      expect(word.format.italic).toBe(false)
      expect(word.format.fontSize).toBe(14)
    })
  })

  describe('loadDocument', () => {
    it('should load document data (new format)', () => {
      const store = useDocumentStore.getState()
      const data = {
        version: '2.0',
        word: {
          value: 'loaded',
          format: { ...DEFAULT_WORD_FORMAT },
          comment: null
        }
      }
      store.loadDocument(data, '/path/to/file.werd')
      const { word, filePath } = useDocumentStore.getState()
      expect(word.value).toBe('loaded')
      expect(filePath).toBe('/path/to/file.werd')
    })

    it('should load old format (pages array) taking first page', () => {
      const store = useDocumentStore.getState()
      const oldData = {
        version: '1.0',
        pages: [
          {
            id: 'page-1',
            name: 'Page 1',
            word: {
              value: 'hello',
              format: { ...DEFAULT_WORD_FORMAT, bold: true },
              comment: null
            }
          },
          {
            id: 'page-2',
            name: 'Page 2',
            word: {
              value: 'world',
              format: { ...DEFAULT_WORD_FORMAT },
              comment: null
            }
          }
        ]
      }
      store.loadDocument(oldData, '/old/file.werd')
      const { word, filePath } = useDocumentStore.getState()
      expect(word.value).toBe('hello')
      expect(word.format.bold).toBe(true)
      expect(filePath).toBe('/old/file.werd')
    })

    it('should not be dirty after loading', () => {
      const store = useDocumentStore.getState()
      const data = {
        version: '2.0',
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
      expect(data.version).toBe('2.0')
      expect(data.word.value).toBe('test')
    })
  })
})
