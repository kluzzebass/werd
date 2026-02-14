import React, { useState, useEffect } from 'react'
import { useDocumentStore } from '../store/document'
import { useSelectionStore } from '../store/selection'
import {
  WordFormat,
  CharFormat,
  TextAlign,
} from '@shared/types'
import { FONT_FAMILIES } from '../utils/formatValue'

interface FormatWordDialogProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'alignment' | 'font' | 'fill'

export const FormatWordDialog: React.FC<FormatWordDialogProps> = ({ isOpen, onClose }) => {
  const word = useDocumentStore(state => state.word)
  const updateWordFormat = useDocumentStore(state => state.updateWordFormat)
  const updateCharFormat = useDocumentStore(state => state.updateCharFormat)
  const updateAllCharFormat = useDocumentStore(state => state.updateAllCharFormat)
  const getCommonCharFormat = useDocumentStore(state => state.getCommonCharFormat)
  const getCharFormatAt = useDocumentStore(state => state.getCharFormatAt)

  const { selectionStart, selectionEnd, hasSelection } = useSelectionStore()

  const [activeTab, setActiveTab] = useState<TabType>('font')
  const [localWordFormat, setLocalWordFormat] = useState<WordFormat | null>(null)
  const [localCharFormat, setLocalCharFormat] = useState<CharFormat | null>(null)

  useEffect(() => {
    if (isOpen) {
      setLocalWordFormat({ ...word.format })

      // Get current char format based on selection
      const charFmt = hasSelection
        ? getCommonCharFormat(selectionStart, selectionEnd)
        : getCharFormatAt(Math.max(0, selectionStart - 1))

      // Fill undefined (mixed) values with defaults for the local editor
      setLocalCharFormat({
        bold: charFmt.bold ?? false,
        italic: charFmt.italic ?? false,
        underline: charFmt.underline ?? false,
        strikethrough: charFmt.strikethrough ?? false,
        fontSize: charFmt.fontSize ?? 14,
        fontFamily: charFmt.fontFamily ?? 'Arial',
        fontColor: charFmt.fontColor ?? '#000000',
        backgroundColor: charFmt.backgroundColor ?? 'transparent',
      })
    }
  }, [isOpen, word, hasSelection, selectionStart, selectionEnd, getCommonCharFormat, getCharFormatAt])

  if (!isOpen || !localWordFormat || !localCharFormat) return null

  const handleApply = () => {
    // Apply word-level format
    updateWordFormat(localWordFormat)

    // Apply char-level format to selection or all
    if (hasSelection) {
      updateCharFormat(localCharFormat, selectionStart, selectionEnd)
    } else {
      updateAllCharFormat(localCharFormat)
    }
    onClose()
  }

  const updateLocalWordFormat = (updates: Partial<WordFormat>) => {
    setLocalWordFormat(prev => prev ? { ...prev, ...updates } : prev)
  }

  const updateLocalCharFormat = (updates: Partial<CharFormat>) => {
    setLocalCharFormat(prev => prev ? { ...prev, ...updates } : prev)
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'font', label: 'Font' },
    { id: 'alignment', label: 'Alignment' },
    { id: 'fill', label: 'Fill' },
  ]

  const colorOptions = [
    '#000000', '#434343', '#666666', '#999999', '#cccccc', '#ffffff',
    '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff',
    '#9900ff', '#ff00ff', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3',
    '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc', '#800000', '#ff6600',
    '#808000', '#008000', '#008080', '#000080', '#800080', '#333333'
  ]

  const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Format Word</h2>
          <button
            className="text-gray-500 hover:text-gray-700 text-xl"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'alignment' && (
            <AlignmentTab format={localWordFormat} updateFormat={updateLocalWordFormat} />
          )}
          {activeTab === 'font' && (
            <FontTab
              format={localCharFormat}
              updateFormat={updateLocalCharFormat}
              colorOptions={colorOptions}
              fontSizes={fontSizes}
            />
          )}
          {activeTab === 'fill' && (
            <FillTab
              charFormat={localCharFormat}
              updateFormat={updateLocalCharFormat}
              colorOptions={colorOptions}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t">
          <button
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// Alignment Tab
interface AlignmentTabProps {
  format: WordFormat
  updateFormat: (updates: Partial<WordFormat>) => void
}

const AlignmentTab: React.FC<AlignmentTabProps> = ({ format, updateFormat }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2">Text alignment</h3>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Horizontal:</label>
          <select
            value={format.textAlign}
            onChange={(e) => updateFormat({ textAlign: e.target.value as TextAlign })}
            className="w-full px-2 py-1.5 border rounded text-sm"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// Font Tab
interface FontTabProps {
  format: CharFormat
  updateFormat: (updates: Partial<CharFormat>) => void
  colorOptions: string[]
  fontSizes: number[]
}

const FontTab: React.FC<FontTabProps> = ({ format, updateFormat, colorOptions, fontSizes }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {/* Font family */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Font:</label>
          <select
            value={format.fontFamily}
            onChange={(e) => updateFormat({ fontFamily: e.target.value })}
            className="w-full px-2 py-1.5 border rounded text-sm"
            style={{ fontFamily: format.fontFamily }}
          >
            {FONT_FAMILIES.map(font => (
              <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
            ))}
          </select>
        </div>

        {/* Font style */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Style:</label>
          <select
            value={`${format.bold ? 'bold' : 'normal'}${format.italic ? '-italic' : ''}`}
            onChange={(e) => {
              const value = e.target.value
              updateFormat({
                bold: value.includes('bold'),
                italic: value.includes('italic')
              })
            }}
            className="w-full px-2 py-1.5 border rounded text-sm"
          >
            <option value="normal">Regular</option>
            <option value="normal-italic">Italic</option>
            <option value="bold">Bold</option>
            <option value="bold-italic">Bold Italic</option>
          </select>
        </div>

        {/* Font size */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Size:</label>
          <select
            value={format.fontSize}
            onChange={(e) => updateFormat({ fontSize: parseInt(e.target.value) })}
            className="w-full px-2 py-1.5 border rounded text-sm"
          >
            {fontSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Effects */}
      <div>
        <label className="text-xs text-gray-500 block mb-2">Effects:</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={format.underline}
              onChange={(e) => updateFormat({ underline: e.target.checked })}
              className="rounded"
            />
            Underline
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={format.strikethrough}
              onChange={(e) => updateFormat({ strikethrough: e.target.checked })}
              className="rounded"
            />
            Strikethrough
          </label>
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="text-xs text-gray-500 block mb-2">Color:</label>
        <div className="grid grid-cols-8 gap-1">
          {colorOptions.map(color => (
            <button
              key={color}
              className={`w-6 h-6 border rounded hover:scale-110 transition-transform ${
                format.fontColor === color ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: color }}
              onClick={() => updateFormat({ fontColor: color })}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4 p-4 border rounded bg-gray-50">
        <div className="text-xs text-gray-500 mb-2">Preview</div>
        <div
          style={{
            fontFamily: format.fontFamily,
            fontSize: `${format.fontSize}px`,
            fontWeight: format.bold ? 'bold' : 'normal',
            fontStyle: format.italic ? 'italic' : 'normal',
            textDecoration: `${format.underline ? 'underline' : ''} ${format.strikethrough ? 'line-through' : ''}`.trim() || 'none',
            color: format.fontColor,
          }}
        >
          AaBbCcYyZz
        </div>
      </div>
    </div>
  )
}

// Fill Tab
interface FillTabProps {
  charFormat: CharFormat
  updateFormat: (updates: Partial<CharFormat>) => void
  colorOptions: string[]
}

const FillTab: React.FC<FillTabProps> = ({ charFormat, updateFormat, colorOptions }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-500 block mb-2">Background color:</label>
        <div className="grid grid-cols-8 gap-1">
          {colorOptions.map(color => (
            <button
              key={color}
              className={`w-6 h-6 border rounded hover:scale-110 transition-transform ${
                charFormat.backgroundColor === color ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: color }}
              onClick={() => updateFormat({ backgroundColor: color })}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4">
        <label className="text-xs text-gray-500 block mb-2">Preview:</label>
        <div
          className="w-full h-16 border rounded flex items-center justify-center"
          style={{ backgroundColor: charFormat.backgroundColor }}
        >
          <span style={{ color: charFormat.fontColor }}>Sample</span>
        </div>
      </div>

      {/* No fill button */}
      <button
        className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100"
        onClick={() => updateFormat({ backgroundColor: 'transparent' })}
      >
        No Fill
      </button>
    </div>
  )
}
