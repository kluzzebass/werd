import React, { useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFillDrip } from '@fortawesome/free-solid-svg-icons'
import { useDocumentStore } from '../store/document'
import { TextAlign } from '@shared/types'
import { FONT_FAMILIES } from '../utils/formatValue'
import { ThemeToggle } from './ThemeToggle'
import { FileMenu } from './FileMenu'

interface ToolbarProps {
  onShowFormatDialog?: () => void
  onNew?: () => void
  onOpen?: () => void
  onSave?: () => void
  onSaveAs?: () => void
  onExport?: () => void
  onImport?: () => void
  onAbout?: () => void
}

// Reusable toolbar button component
const ToolbarButton: React.FC<{
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
  className?: string
}> = ({ active, onClick, title, children, className = '' }) => (
  <button
    className={`w-7 h-7 flex items-center justify-center rounded text-sm ${active ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-200'} ${className}`}
    onClick={onClick}
    title={title}
  >
    {children}
  </button>
)

// Section wrapper with label
const ToolbarSection: React.FC<{
  label: string
  children: React.ReactNode
}> = ({ label, children }) => (
  <div className="flex flex-col border-r border-gray-300 px-2">
    <div className="flex items-center gap-0.5 h-[52px]">
      {children}
    </div>
    <div className="text-[10px] text-gray-500 text-center pb-0.5">{label}</div>
  </div>
)

export const Toolbar: React.FC<ToolbarProps> = ({
  onShowFormatDialog,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onExport,
  onImport,
  onAbout
}) => {
  const word = useDocumentStore(state => state.word)
  const updateWordFormat = useDocumentStore(state => state.updateWordFormat)
  const isDirty = useDocumentStore(state => state.isDirty)

  const [showFontColorPicker, setShowFontColorPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState(false)

  const fontColorButtonRef = useRef<HTMLButtonElement>(null)
  const bgColorButtonRef = useRef<HTMLButtonElement>(null)

  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  const calculateDropdownPosition = (buttonRef: React.RefObject<HTMLButtonElement | null>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left
      })
    }
  }

  const format = word.format

  const toggleFormat = (key: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    updateWordFormat({ [key]: !format[key] })
  }

  const setAlignment = (align: TextAlign) => {
    updateWordFormat({ textAlign: align })
  }

  const setFontSize = (size: number) => {
    updateWordFormat({ fontSize: size })
  }

  const setFontFamily = (family: string) => {
    updateWordFormat({ fontFamily: family })
  }

  const setFontColor = (color: string) => {
    updateWordFormat({ fontColor: color })
    setShowFontColorPicker(false)
  }

  const setBgColor = (color: string) => {
    updateWordFormat({ backgroundColor: color })
    setShowBgColorPicker(false)
  }

  const colorOptions = [
    '#000000', '#434343', '#666666', '#999999', '#cccccc', '#ffffff',
    '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff',
    '#9900ff', '#ff00ff', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3',
    '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc'
  ]

  const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]

  const closeAllMenus = () => {
    setShowFontColorPicker(false)
    setShowBgColorPicker(false)
  }

  return (
    <div className="bg-toolbar-gray border-b border-gray-300 flex-shrink-0">
      {/* Ribbon tab bar */}
      <div className="flex items-center h-7 px-2 border-b border-gray-200">
        <span className="text-xs font-medium text-word-blue border-b-2 border-word-blue px-3 py-1">Home</span>
      </div>

      {/* Main ribbon area */}
      <div className="flex items-end px-1 overflow-x-auto">
        {/* File Menu */}
        {onNew && onOpen && onSave && onSaveAs && (
          <div className="flex flex-col border-r border-gray-300 px-1.5">
            <div className="flex items-center h-[52px]">
              <FileMenu
                onNew={onNew}
                onOpen={onOpen}
                onSave={onSave}
                onSaveAs={onSaveAs}
                onExport={onExport || (() => {})}
                onImport={onImport || (() => {})}
                onAbout={onAbout || (() => {})}
              />
            </div>
            <div className="text-[10px] text-gray-500 text-center pb-0.5">File</div>
          </div>
        )}

        {/* Font Section */}
        <ToolbarSection label="Font">
          <div className="flex flex-col gap-0.5">
            {/* Row 1: Font family and size */}
            <div className="flex items-center gap-0.5">
              <select
                value={format.fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="h-6 px-1 text-xs border border-gray-300 rounded bg-white w-28"
                style={{ fontFamily: format.fontFamily }}
              >
                {FONT_FAMILIES.map(font => (
                  <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                ))}
              </select>
              <select
                value={format.fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="h-6 px-1 text-xs border border-gray-300 rounded bg-white w-14"
              >
                {fontSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            {/* Row 2: Formatting buttons */}
            <div className="flex items-center gap-0.5">
              <ToolbarButton active={format.bold} onClick={() => toggleFormat('bold')} title="Bold (⌘B)">
                <span className="font-bold">B</span>
              </ToolbarButton>
              <ToolbarButton active={format.italic} onClick={() => toggleFormat('italic')} title="Italic (⌘I)">
                <span className="italic font-serif">I</span>
              </ToolbarButton>
              <ToolbarButton active={format.underline} onClick={() => toggleFormat('underline')} title="Underline (⌘U)">
                <span className="underline">U</span>
              </ToolbarButton>
              <ToolbarButton active={format.strikethrough} onClick={() => toggleFormat('strikethrough')} title="Strikethrough">
                <span className="line-through">ab</span>
              </ToolbarButton>

              <div className="w-px h-5 bg-gray-300 mx-0.5" />

              {/* Highlight color */}
              <div className="relative">
                <button
                  ref={bgColorButtonRef}
                  className="w-7 h-7 flex flex-col items-center justify-center rounded hover:bg-gray-200"
                  onClick={() => {
                    closeAllMenus()
                    calculateDropdownPosition(bgColorButtonRef)
                    setShowBgColorPicker(!showBgColorPicker)
                  }}
                  title="Highlight Color"
                >
                  <FontAwesomeIcon icon={faFillDrip} className="text-xs" />
                  <div className="w-5 h-1 mt-px rounded-sm" style={{ backgroundColor: format.backgroundColor === '#ffffff' ? '#ffff00' : format.backgroundColor }} />
                </button>
              </div>

              {/* Font color */}
              <div className="relative">
                <button
                  ref={fontColorButtonRef}
                  className="w-7 h-7 flex flex-col items-center justify-center rounded hover:bg-gray-200"
                  onClick={() => {
                    closeAllMenus()
                    calculateDropdownPosition(fontColorButtonRef)
                    setShowFontColorPicker(!showFontColorPicker)
                  }}
                  title="Font Color"
                >
                  <span className="text-sm font-bold leading-none">A</span>
                  <div className="w-5 h-1 mt-px rounded-sm" style={{ backgroundColor: format.fontColor }} />
                </button>
              </div>
            </div>
          </div>
        </ToolbarSection>

        {/* Paragraph Section */}
        <ToolbarSection label="Paragraph">
          <div className="flex items-center gap-0.5">
            <ToolbarButton active={format.textAlign === 'left'} onClick={() => setAlignment('left')} title="Align Left">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5"><line x1="1" y1="3" x2="15" y2="3" stroke="currentColor" strokeWidth="2"/><line x1="1" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="2"/><line x1="1" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="2"/></svg>
            </ToolbarButton>
            <ToolbarButton active={format.textAlign === 'center'} onClick={() => setAlignment('center')} title="Center">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5"><line x1="1" y1="3" x2="15" y2="3" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="2"/><line x1="2" y1="13" x2="14" y2="13" stroke="currentColor" strokeWidth="2"/></svg>
            </ToolbarButton>
            <ToolbarButton active={format.textAlign === 'right'} onClick={() => setAlignment('right')} title="Align Right">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5"><line x1="1" y1="3" x2="15" y2="3" stroke="currentColor" strokeWidth="2"/><line x1="6" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="2"/></svg>
            </ToolbarButton>
          </div>
        </ToolbarSection>

        {/* Styles Section */}
        <ToolbarSection label="Styles">
          <div className="flex flex-col gap-0.5 justify-center h-full">
            {onShowFormatDialog && (
              <button
                className="h-10 px-3 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50"
                onClick={onShowFormatDialog}
                title="Format Word (⌘1)"
              >
                Format<br/>Word
              </button>
            )}
          </div>
        </ToolbarSection>

        {/* View Section */}
        <ToolbarSection label="View">
          <div className="flex items-center gap-1">
            <ThemeToggle />
          </div>
        </ToolbarSection>

        {/* Spacer and dirty indicator */}
        <div className="flex-1 flex items-center justify-end px-2 min-w-[100px]">
          {isDirty && (
            <span className="text-xs text-gray-500 whitespace-nowrap">
              Unsaved changes
            </span>
          )}
        </div>
      </div>

      {/* Portaled dropdowns */}
      {showFontColorPicker && ReactDOM.createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setShowFontColorPicker(false)} />
          <div
            className="fixed z-[9999] p-2 bg-white border border-gray-300 shadow-lg rounded-md"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            <div className="text-xs text-gray-500 mb-1 font-medium">Font Color</div>
            <div className="grid grid-cols-6 gap-1">
              {colorOptions.map(color => (
                <button
                  key={color}
                  className="w-6 h-6 border border-gray-300 rounded hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => setFontColor(color)}
                />
              ))}
            </div>
          </div>
        </>,
        document.body
      )}

      {showBgColorPicker && ReactDOM.createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setShowBgColorPicker(false)} />
          <div
            className="fixed z-[9999] p-2 bg-white border border-gray-300 shadow-lg rounded-md"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            <div className="text-xs text-gray-500 mb-1 font-medium">Highlight Color</div>
            <div className="grid grid-cols-6 gap-1">
              {colorOptions.map(color => (
                <button
                  key={color}
                  className="w-6 h-6 border border-gray-300 rounded hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => setBgColor(color)}
                />
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
