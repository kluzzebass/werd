import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { useDocumentStore } from '../store/document'
import { useSelectionStore } from '../store/selection'
import { WordFormat, CharFormat, WordComment, getFormatRuns } from '@shared/types'
import { ContextMenu, MenuItem } from './ContextMenu'
import { CommentDialog } from './CommentDialog'

// Walk text nodes to compute a character offset from a DOM selection point
function getCharOffset(container: HTMLElement, node: Node, offset: number): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let current = walker.nextNode()
  let charOffset = 0

  while (current) {
    if (current === node) return charOffset + offset
    charOffset += (current as Text).length
    current = walker.nextNode()
  }

  // node is the container itself — offset is child index
  if (node === container) {
    let co = 0
    for (let i = 0; i < container.childNodes.length && i < offset; i++) {
      co += container.childNodes[i].textContent?.length ?? 0
    }
    return co
  }

  // node is a child element (e.g. a span) — offset is child index within it
  let co = 0
  for (const child of Array.from(container.childNodes)) {
    if (child === node || child.contains(node)) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        for (let i = 0; i < offset && i < node.childNodes.length; i++) {
          co += node.childNodes[i].textContent?.length ?? 0
        }
      }
      return co
    }
    co += child.textContent?.length ?? 0
  }

  return container.textContent?.length ?? 0
}

function setCursorPosition(container: HTMLElement, targetOffset: number) {
  const sel = window.getSelection()
  if (!sel) return

  if (!container.firstChild) {
    const range = document.createRange()
    range.setStart(container, 0)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    return
  }

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let current = walker.nextNode()
  let accum = 0

  while (current) {
    const len = (current as Text).length
    if (accum + len >= targetOffset) {
      const range = document.createRange()
      range.setStart(current, targetOffset - accum)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
      return
    }
    accum += len
    current = walker.nextNode()
  }

  // Fallback: end of content
  const range = document.createRange()
  range.selectNodeContents(container)
  range.collapse(false)
  sel.removeAllRanges()
  sel.addRange(range)
}

function setSelectionRange(container: HTMLElement, start: number, end: number) {
  const sel = window.getSelection()
  if (!sel) return

  const range = document.createRange()
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let current = walker.nextNode()
  let accum = 0
  let startSet = false

  while (current) {
    const len = (current as Text).length
    if (!startSet && accum + len >= start) {
      range.setStart(current, start - accum)
      startSet = true
    }
    if (startSet && accum + len >= end) {
      range.setEnd(current, end - accum)
      sel.removeAllRanges()
      sel.addRange(range)
      return
    }
    accum += len
    current = walker.nextNode()
  }
}

function applySpanStyle(span: HTMLSpanElement, format: CharFormat) {
  span.style.fontWeight = format.bold ? 'bold' : 'normal'
  span.style.fontStyle = format.italic ? 'italic' : 'normal'
  const decorations: string[] = []
  if (format.underline) decorations.push('underline')
  if (format.strikethrough) decorations.push('line-through')
  span.style.textDecoration = decorations.length > 0 ? decorations.join(' ') : 'none'
  span.style.fontSize = `${format.fontSize}px`
  span.style.fontFamily = format.fontFamily
  span.style.color = format.fontColor
  span.style.backgroundColor = format.backgroundColor
}

function buildSpans(container: HTMLElement, value: string, charFormats: CharFormat[] | null) {
  container.innerHTML = ''
  if (!value) return

  const runs = getFormatRuns(value, charFormats)
  for (const run of runs) {
    const span = document.createElement('span')
    applySpanStyle(span, run.format)
    span.textContent = run.text
    container.appendChild(span)
  }
}

export const WordArea: React.FC = () => {
  const editableRef = useRef<HTMLDivElement>(null)
  const word = useDocumentStore(state => state.word)
  const updateWordValue = useDocumentStore(state => state.updateWordValue)
  const updateWordFormat = useDocumentStore(state => state.updateWordFormat)
  const updateAllCharFormat = useDocumentStore(state => state.updateAllCharFormat)
  const updateWordComment = useDocumentStore(state => state.updateWordComment)
  const setSelection = useSelectionStore(state => state.setSelection)

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [clipboard, setClipboard] = useState<{ value: string | null; charFormats: CharFormat[] | null; format: WordFormat } | null>(null)
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [showCommentTooltip, setShowCommentTooltip] = useState(false)

  // Cursor position computed during handleInput — consumed by useLayoutEffect
  const pendingCursorRef = useRef<number | null>(null)

  const value = word.value ?? ''

  // Focus on mount
  useEffect(() => {
    const timer = setTimeout(() => editableRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [])

  // Imperatively rebuild spans whenever store state changes.
  // useLayoutEffect runs before paint, so no flicker.
  useLayoutEffect(() => {
    const el = editableRef.current
    if (!el) return

    const isFocused = document.activeElement === el
    const pendingCursor = pendingCursorRef.current
    pendingCursorRef.current = null

    // Determine what to restore after rebuild
    let cursorToRestore: number | null = pendingCursor
    let selectionToRestore: { start: number; end: number } | null = null

    if (pendingCursor === null) {
      const sel = window.getSelection()
      if (isFocused && sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
        // Read selection directly from DOM when focused
        const anchorOff = getCharOffset(el, sel.anchorNode!, sel.anchorOffset)
        const focusOff = getCharOffset(el, sel.focusNode!, sel.focusOffset)
        if (anchorOff !== focusOff) {
          selectionToRestore = {
            start: Math.min(anchorOff, focusOff),
            end: Math.max(anchorOff, focusOff),
          }
        } else {
          cursorToRestore = anchorOff
        }
      } else {
        // Focus lost (e.g. toolbar click) — fall back to selection store
        const { selectionStart, selectionEnd, hasSelection } = useSelectionStore.getState()
        if (hasSelection) {
          selectionToRestore = { start: selectionStart, end: selectionEnd }
        } else {
          cursorToRestore = selectionStart
        }
      }
    }

    // Rebuild DOM from store data
    buildSpans(el, value, word.charFormats)

    // Restore cursor/selection
    if (selectionToRestore) {
      setSelectionRange(el, selectionToRestore.start, selectionToRestore.end)
    } else if (cursorToRestore !== null) {
      setCursorPosition(el, cursorToRestore)
    }
  }, [value, word.charFormats])

  // Track selection changes for toolbar / keyboard shortcuts
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection()
      if (!sel || !editableRef.current) return
      if (!editableRef.current.contains(sel.anchorNode)) return

      const start = getCharOffset(editableRef.current, sel.anchorNode!, sel.anchorOffset)
      const end = getCharOffset(editableRef.current, sel.focusNode!, sel.focusOffset)
      setSelection(start, end)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [setSelection])

  const handleInput = useCallback(() => {
    const el = editableRef.current
    if (!el) return

    const rawText = el.textContent ?? ''
    const filtered = rawText.replace(/[^\p{L}\p{N}]/gu, '')

    // Compute cursor position in the filtered text
    const sel = window.getSelection()
    let cursorPos = filtered.length
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      let rawCursorOffset = 0
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let node = walker.nextNode()
      while (node) {
        if (node === sel.anchorNode) {
          rawCursorOffset += sel.anchorOffset
          break
        }
        rawCursorOffset += (node as Text).length
        node = walker.nextNode()
      }
      const textBeforeCursor = rawText.slice(0, rawCursorOffset)
      cursorPos = textBeforeCursor.replace(/[^\p{L}\p{N}]/gu, '').length
    }

    pendingCursorRef.current = cursorPos
    updateWordValue(filtered, cursorPos)
  }, [updateWordValue])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      return
    }
    const isLetterOrDigit = /^[\p{L}\p{N}]$/u.test(e.key)
    const isNavOrEdit = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)
    const isModCombo = e.metaKey || e.ctrlKey
    const isSelection = e.shiftKey && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)

    if (!isLetterOrDigit && !isNavOrEdit && !isModCombo && !isSelection) {
      e.preventDefault()
    }
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    const filtered = text.replace(/[^\p{L}\p{N}]/gu, '')
    if (filtered) {
      document.execCommand('insertText', false, filtered)
    }
  }, [])

  const handlePageClick = () => {
    editableRef.current?.focus()
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const handleCut = useCallback(() => {
    setClipboard({
      value: word.value,
      charFormats: word.charFormats ? [...word.charFormats] : null,
      format: { ...word.format }
    })
    updateWordValue('')
  }, [word, updateWordValue])

  const handleCopy = useCallback(() => {
    setClipboard({
      value: word.value,
      charFormats: word.charFormats ? [...word.charFormats] : null,
      format: { ...word.format }
    })
    const textValue = String(word.value ?? '')
    navigator.clipboard.writeText(textValue).catch(() => {})
  }, [word])

  const handlePasteFromClipboard = useCallback(async () => {
    if (clipboard) {
      updateWordValue(String(clipboard.value ?? ''))
    } else {
      try {
        const text = await navigator.clipboard.readText()
        updateWordValue(text)
      } catch {}
    }
  }, [clipboard, updateWordValue])

  const handlePasteFormattingOnly = useCallback(() => {
    if (clipboard && clipboard.charFormats && clipboard.charFormats.length > 0) {
      const fmt = clipboard.charFormats[0]
      updateAllCharFormat(fmt)
    }
  }, [clipboard, updateAllCharFormat])

  const handleClearContents = useCallback(() => {
    updateWordValue('')
  }, [updateWordValue])

  const handleClearFormatting = useCallback(() => {
    updateAllCharFormat({
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      fontSize: 14,
      fontColor: '#000000',
      fontFamily: 'Arial',
      backgroundColor: 'transparent',
    })
    updateWordFormat({
      textAlign: 'left'
    })
  }, [updateAllCharFormat, updateWordFormat])

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
    { label: 'Paste', shortcut: '⌘V', onClick: handlePasteFromClipboard },
    { label: 'Paste Formatting Only', onClick: handlePasteFormattingOnly, disabled: !clipboard },
    { label: '', onClick: () => {}, divider: true },
    { label: word.comment ? 'Edit Comment' : 'Add Comment', onClick: handleAddEditComment },
    ...(word.comment ? [{ label: 'Delete Comment', onClick: handleDeleteComment }] : []),
    { label: '', onClick: () => {}, divider: true },
    { label: 'Clear Contents', shortcut: 'Delete', onClick: handleClearContents },
    { label: 'Clear Formatting', onClick: handleClearFormatting },
    { label: 'Clear All', onClick: handleClearAll },
  ]

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
        {/* contentEditable div — NO React children, DOM managed imperatively */}
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="document-input w-full border-none outline-none bg-transparent caret-black"
          style={{
            textAlign: word.format.textAlign as React.CSSProperties['textAlign'],
            padding: 0,
            lineHeight: 1.4,
            wordBreak: 'break-all',
            minHeight: '1.4em',
            whiteSpace: 'pre-wrap',
          }}
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
