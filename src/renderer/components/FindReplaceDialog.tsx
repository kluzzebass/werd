import React, { useState, useEffect, useRef } from 'react'
import { useDocumentStore } from '../store/document'

interface FindReplaceDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const FindReplaceDialog: React.FC<FindReplaceDialogProps> = ({ isOpen, onClose }) => {
  const word = useDocumentStore(state => state.word)
  const updateWordValue = useDocumentStore(state => state.updateWordValue)
  const saveToHistory = useDocumentStore(state => state.saveToHistory)

  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [found, setFound] = useState(false)
  const [searched, setSearched] = useState(false)

  const findInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      findInputRef.current?.focus()
      setFound(false)
      setSearched(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const performSearch = () => {
    if (!findText) {
      setFound(false)
      setSearched(false)
      return
    }

    const valueToSearch = String(word.value ?? '')
    const searchTerm = matchCase ? findText : findText.toLowerCase()
    const searchIn = matchCase ? valueToSearch : valueToSearch.toLowerCase()

    setFound(searchIn.includes(searchTerm))
    setSearched(true)
  }

  const handleFind = () => {
    performSearch()
  }

  const handleReplace = () => {
    if (!found) return

    saveToHistory('Replace')

    const currentValue = String(word.value ?? '')
    const searchTerm = matchCase ? findText : findText.toLowerCase()
    const valueToSearch = matchCase ? currentValue : currentValue.toLowerCase()
    const index = valueToSearch.indexOf(searchTerm)

    if (index !== -1) {
      const newValue = currentValue.slice(0, index) + replaceText + currentValue.slice(index + findText.length)
      updateWordValue(newValue)
      setTimeout(performSearch, 100)
    }
  }

  const handleReplaceAll = () => {
    if (!found) return

    saveToHistory('Replace All')

    const currentValue = String(word.value ?? '')
    const regex = new RegExp(escapeRegExp(findText), matchCase ? 'g' : 'gi')
    const matches = currentValue.match(regex)

    if (matches && matches.length > 0) {
      const newValue = currentValue.replace(regex, replaceText)
      updateWordValue(newValue)
      alert(`Replaced ${matches.length} occurrence(s)`)
      performSearch()
    }
  }

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleFind()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/30">
      <div className="bg-white rounded-lg shadow-xl w-96">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Find and Replace</h2>
          <button
            className="text-gray-500 hover:text-gray-700 text-xl"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Find field */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">Find:</label>
            <input
              ref={findInputRef}
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search text..."
            />
          </div>

          {/* Replace field */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">Replace with:</label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Replacement text..."
            />
          </div>

          {/* Options */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded"
              />
              Match case
            </label>
          </div>

          {/* Results */}
          {searched && found && (
            <div className="text-sm text-gray-600">
              Found match in word: {String(word.value ?? '')}
            </div>
          )}

          {searched && !found && (
            <div className="text-sm text-gray-500">No matches found</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-4 py-3 border-t">
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              onClick={handleFind}
            >
              Find
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              onClick={handleReplace}
              disabled={!found}
            >
              Replace
            </button>
            <button
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              onClick={handleReplaceAll}
              disabled={!found}
            >
              Replace All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
