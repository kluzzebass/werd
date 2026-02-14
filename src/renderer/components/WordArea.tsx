import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useDocumentStore } from '../store/document'
import { WordFormat, WordComment } from '@shared/types'
import { ContextMenu, MenuItem } from './ContextMenu'
import { CommentDialog } from './CommentDialog'

export const WordArea: React.FC = () => {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const word = useDocumentStore(state => state.word)
  const updateWordValue = useDocumentStore(state => state.updateWordValue)
  const updateWordFormat = useDocumentStore(state => state.updateWordFormat)
  const updateWordComment = useDocumentStore(state => state.updateWordComment)

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [clipboard, setClipboard] = useState<{ value: string | null; format: WordFormat } | null>(null)
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [showCommentTooltip, setShowCommentTooltip] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // Sync input value with store when not focused
  useEffect(() => {
    if (!isFocused) {
      setInputValue(String(word.value ?? ''))
    }
  }, [word.value, isFocused])

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [inputValue, word.format.fontSize, word.format.fontFamily])

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      return
    }
    const isLetterOrDigit = /^[\p{L}\p{N}]$/u.test(e.key)
    const isNavOrEdit = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)
    const isModCombo = e.metaKey || e.ctrlKey

    if (!isLetterOrDigit && !isNavOrEdit && !isModCombo) {
      e.preventDefault()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const filtered = e.target.value.replace(/[^\p{L}\p{N}]/gu, '')
    setInputValue(filtered)
  }

  const handleBlur = () => {
    setIsFocused(false)
    updateWordValue(inputValue)
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handlePageClick = () => {
    inputRef.current?.focus()
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const handleCut = useCallback(() => {
    setClipboard({
      value: word.value,
      format: { ...word.format }
    })
    updateWordValue('')
    setInputValue('')
  }, [word, updateWordValue])

  const handleCopy = useCallback(() => {
    setClipboard({
      value: word.value,
      format: { ...word.format }
    })
    const textValue = String(word.value ?? '')
    navigator.clipboard.writeText(textValue).catch(() => {})
  }, [word])

  const handlePaste = useCallback(async () => {
    if (clipboard) {
      const val = String(clipboard.value ?? '')
      updateWordValue(val)
      setInputValue(val)
    } else {
      try {
        const text = await navigator.clipboard.readText()
        updateWordValue(text)
        setInputValue(text)
      } catch {}
    }
  }, [clipboard, updateWordValue])

  const handlePasteFormattingOnly = useCallback(() => {
    if (clipboard) {
      updateWordFormat(clipboard.format)
    }
  }, [clipboard, updateWordFormat])

  const handleClearContents = useCallback(() => {
    updateWordValue('')
    setInputValue('')
  }, [updateWordValue])

  const handleClearFormatting = useCallback(() => {
    updateWordFormat({
      bold: false,
      italic: false,
      underline: false,
      fontSize: 14,
      fontColor: '#000000',
      backgroundColor: '#ffffff',
      textAlign: 'left'
    })
  }, [updateWordFormat])

  const handleClearAll = useCallback(() => {
    handleClearContents()
    handleClearFormatting()
  }, [handleClearContents, handleClearFormatting])

  const handleAddEditComment = useCallback(() => {
    setShowCommentDialog(true)
  }, [])

  const handleSaveComment = useCallback((comment: WordComment | null) => {
    updateWordComment(comment)
  }, [updateWordComment])

  const handleDeleteComment = useCallback(() => {
    updateWordComment(null)
  }, [updateWordComment])

  const contextMenuItems: MenuItem[] = [
    { label: 'Cut', shortcut: '⌘X', onClick: handleCut },
    { label: 'Copy', shortcut: '⌘C', onClick: handleCopy },
    { label: 'Paste', shortcut: '⌘V', onClick: handlePaste },
    { label: 'Paste Formatting Only', onClick: handlePasteFormattingOnly, disabled: !clipboard },
    { label: '', onClick: () => {}, divider: true },
    { label: word.comment ? 'Edit Comment' : 'Add Comment', onClick: handleAddEditComment },
    ...(word.comment ? [{ label: 'Delete Comment', onClick: handleDeleteComment }] : []),
    { label: '', onClick: () => {}, divider: true },
    { label: 'Clear Contents', shortcut: 'Delete', onClick: handleClearContents },
    { label: 'Clear Formatting', onClick: handleClearFormatting },
    { label: 'Clear All', onClick: handleClearAll },
  ]

  const getTextDecoration = (format: WordFormat): string => {
    const decorations: string[] = []
    if (format.underline) decorations.push('underline')
    if (format.strikethrough) decorations.push('line-through')
    return decorations.length > 0 ? decorations.join(' ') : 'none'
  }

  const getWordStyle = (format: WordFormat): React.CSSProperties => ({
    fontWeight: format.bold ? 'bold' : 'normal',
    fontStyle: format.italic ? 'italic' : 'normal',
    textDecoration: getTextDecoration(format),
    fontSize: `${format.fontSize}px`,
    fontFamily: format.fontFamily,
    color: format.fontColor,
    textAlign: format.textAlign as React.CSSProperties['textAlign'],
  })

  return (
    <div className="flex items-start justify-center p-8">
      {/* Document page */}
      <div
        className="document-page bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] relative cursor-text"
        style={{
          width: '8.5in',
          minHeight: '11in',
          padding: '1in',
        }}
        onContextMenu={handleContextMenu}
        onClick={handlePageClick}
      >
        {/* The word input — textarea so long words wrap naturally */}
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className="document-input w-full border-none outline-none bg-transparent caret-black resize-none overflow-hidden"
          style={{
            ...getWordStyle(word.format),
            padding: 0,
            lineHeight: 1.4,
            wordBreak: 'break-all',
            minHeight: '1.4em',
          }}
          rows={1}
          spellCheck={false}
        />

        {/* Comment indicator */}
        {word.comment && (
          <div
            className="absolute top-4 right-4 cursor-pointer"
            onMouseEnter={() => setShowCommentTooltip(true)}
            onMouseLeave={() => setShowCommentTooltip(false)}
            onClick={(e) => { e.stopPropagation(); setShowCommentDialog(true) }}
          >
            <div className="w-5 h-5 bg-yellow-300 shadow-sm flex items-center justify-center text-xs text-yellow-800 rounded-sm">
              !
            </div>
          </div>
        )}

        {/* Comment tooltip */}
        {word.comment && showCommentTooltip && (
          <div
            className="absolute top-10 right-4 z-50 p-3 bg-yellow-50 border border-yellow-200 rounded shadow-lg max-w-72"
            style={{ minWidth: '200px' }}
          >
            <div className="text-xs font-medium text-gray-600 mb-1">
              {word.comment.author || 'Comment'} — {new Date(word.comment.timestamp).toLocaleString()}
            </div>
            <div className="text-sm whitespace-pre-wrap text-gray-800">{word.comment.text}</div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Comment Dialog */}
      <CommentDialog
        isOpen={showCommentDialog}
        comment={word.comment}
        onSave={handleSaveComment}
        onClose={() => setShowCommentDialog(false)}
      />
    </div>
  )
}
