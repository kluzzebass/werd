import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useDocumentStore } from './store/document'
import { WordArea } from './components/WordArea'
import { Toolbar } from './components/Toolbar'
import { FormatWordDialog } from './components/FormatWordDialog'
import { StatusBar } from './components/StatusBar'
import { FindReplaceDialog } from './components/FindReplaceDialog'
import { AboutDialog } from './components/AboutDialog'
import { useAutoSave } from './hooks/useAutoSave'
import { exportToDocx, importFromDocx } from './utils/exportImport'

declare global {
  interface Window {
    electronAPI?: {
      onMenuAction: (callback: (action: string) => void) => void
      saveFile: (data: string, filePath?: string) => Promise<string | null>
      openFile: () => Promise<{ data: string; filePath: string } | null>
      setTitle: (title: string) => void
    }
  }
}

export const App: React.FC = () => {
  const word = useDocumentStore(state => state.word)
  const filePath = useDocumentStore(state => state.filePath)
  const isDirty = useDocumentStore(state => state.isDirty)
  const newDocument = useDocumentStore(state => state.newDocument)
  const loadDocument = useDocumentStore(state => state.loadDocument)
  const getDocumentData = useDocumentStore(state => state.getDocumentData)
  const setFilePath = useDocumentStore(state => state.setFilePath)
  const setDirty = useDocumentStore(state => state.setDirty)
  const updateWordFormat = useDocumentStore(state => state.updateWordFormat)
  const undo = useDocumentStore(state => state.undo)
  const redo = useDocumentStore(state => state.redo)
  const saveToHistory = useDocumentStore(state => state.saveToHistory)

  const [showFormatDialog, setShowFormatDialog] = useState(false)
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem('werd-zoom')
    return saved ? parseInt(saved) : 100
  })

  // Save zoom to localStorage
  useEffect(() => {
    localStorage.setItem('werd-zoom', String(zoom))
  }, [zoom])

  // Auto-save functionality
  const { checkForRecovery, recoverFromAutosave, clearAutosave } = useAutoSave()

  // Save initial state to history
  useEffect(() => {
    saveToHistory('Initial state')

    // Check for recovery data
    const recovery = checkForRecovery()
    if (recovery) {
      const timestamp = new Date(recovery.timestamp).toLocaleString()
      if (confirm(`Found auto-saved data from ${timestamp}. Would you like to recover it?`)) {
        recoverFromAutosave(recovery.data)
      } else {
        clearAutosave()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = useCallback((data: string) => {
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.werd'
    a.click()
    URL.revokeObjectURL(url)
    setDirty(false)
  }, [setDirty])

  const handleNew = useCallback(() => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to create a new document?')) {
        return
      }
    }
    newDocument()
  }, [isDirty, newDocument])

  const handleOpen = useCallback(async () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to open another file?')) {
        return
      }
    }

    if (window.electronAPI?.openFile) {
      const result = await window.electronAPI.openFile()
      if (result) {
        try {
          const data = JSON.parse(result.data)
          loadDocument(data, result.filePath)
        } catch (e) {
          alert('Failed to parse file')
        }
      }
    } else {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.werd,.json'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const text = await file.text()
          try {
            const data = JSON.parse(text)
            loadDocument(data, file.name)
          } catch {
            alert('Failed to parse file')
          }
        }
      }
      input.click()
    }
  }, [isDirty, loadDocument])

  const handleSave = useCallback(async () => {
    const data = JSON.stringify(getDocumentData(), null, 2)

    if (window.electronAPI?.saveFile) {
      const savedPath = await window.electronAPI.saveFile(data, filePath || undefined)
      if (savedPath) {
        setFilePath(savedPath)
        setDirty(false)
      }
    } else {
      handleDownload(data)
    }
  }, [filePath, getDocumentData, setFilePath, setDirty, handleDownload])

  const handleExport = useCallback(async () => {
    const fileName = filePath ? filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'document' : 'document'
    try {
      await exportToDocx(word, `${fileName}.docx`)
    } catch {
      alert('Failed to export .docx file')
    }
  }, [word, filePath])

  const handleImport = useCallback(async () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to import a file?')) {
        return
      }
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.docx'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const wordEntry = await importFromDocx(file)
          loadDocument({ version: '2.0', word: wordEntry })
        } catch {
          alert('Failed to import .docx file')
        }
      }
    }
    input.click()
  }, [isDirty, loadDocument])

  const handleSaveAs = useCallback(async () => {
    const data = JSON.stringify(getDocumentData(), null, 2)

    if (window.electronAPI?.saveFile) {
      const savedPath = await window.electronAPI.saveFile(data)
      if (savedPath) {
        setFilePath(savedPath)
        setDirty(false)
      }
    } else {
      handleDownload(data)
    }
  }, [getDocumentData, setFilePath, setDirty, handleDownload])

  // Store handlers in refs so IPC callback always gets latest version
  const handlersRef = useRef({
    handleNew, handleOpen, handleSave, handleSaveAs, handleExport, handleImport
  })
  useEffect(() => {
    handlersRef.current = {
      handleNew, handleOpen, handleSave, handleSaveAs, handleExport, handleImport
    }
  }, [handleNew, handleOpen, handleSave, handleSaveAs, handleExport, handleImport])

  // Update window title
  useEffect(() => {
    const fileName = filePath ? filePath.split('/').pop() : 'Untitled'
    const dirtyMark = isDirty ? ' *' : ''
    const title = `${fileName}${dirtyMark} - Werd`

    if (window.electronAPI?.setTitle) {
      window.electronAPI.setTitle(title)
    } else {
      document.title = title
    }
  }, [filePath, isDirty])

  // Handle menu actions
  useEffect(() => {
    if (window.electronAPI?.onMenuAction) {
      window.electronAPI.onMenuAction((action) => {
        switch (action) {
          case 'new':
            handlersRef.current.handleNew()
            break
          case 'open':
            handlersRef.current.handleOpen()
            break
          case 'save':
            handlersRef.current.handleSave()
            break
          case 'save-as':
            handlersRef.current.handleSaveAs()
            break
          case 'about':
            setShowAbout(true)
            break
        }
      })
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey

      // File shortcuts
      if (isMod && e.key === 's') {
        e.preventDefault()
        handlersRef.current.handleSave()
        return
      }
      if (isMod && e.key === 'o') {
        e.preventDefault()
        handlersRef.current.handleOpen()
        return
      }
      if (isMod && e.key === 'n') {
        e.preventDefault()
        handlersRef.current.handleNew()
        return
      }
      // Ctrl+1 to open Format Word dialog
      if (isMod && e.key === '1') {
        e.preventDefault()
        setShowFormatDialog(true)
        return
      }

      // Ctrl+Z to undo
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }

      // Ctrl+Y or Ctrl+Shift+Z to redo
      if ((isMod && e.key === 'y') || (isMod && e.key === 'z' && e.shiftKey)) {
        e.preventDefault()
        redo()
        return
      }

      // Ctrl+F to open Find/Replace
      if (isMod && e.key === 'f') {
        e.preventDefault()
        setShowFindReplace(true)
        return
      }

      // Ctrl+H to open Find/Replace (replace mode)
      if (isMod && e.key === 'h') {
        e.preventDefault()
        setShowFindReplace(true)
        return
      }

      // Formatting shortcuts (Ctrl+B/I/U)
      if (isMod && ['b', 'i', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        const format = word.format
        switch (e.key.toLowerCase()) {
          case 'b':
            updateWordFormat({ bold: !format.bold })
            break
          case 'i':
            updateWordFormat({ italic: !format.italic })
            break
          case 'u':
            updateWordFormat({ underline: !format.underline })
            break
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [word, updateWordFormat])

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Toolbar */}
      <Toolbar
        onShowFormatDialog={() => setShowFormatDialog(true)}
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onExport={handleExport}
        onImport={handleImport}
        onAbout={() => setShowAbout(true)}
      />

      {/* Main document area — gray background with page */}
      <div className="flex-1 overflow-auto bg-gray-400">
        <div
          className="min-h-full flex justify-center"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          <WordArea />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar zoom={zoom} onZoomChange={setZoom} />

      {/* Format Word Dialog */}
      <FormatWordDialog isOpen={showFormatDialog} onClose={() => setShowFormatDialog(false)} />

      {/* Find/Replace Dialog */}
      <FindReplaceDialog isOpen={showFindReplace} onClose={() => setShowFindReplace(false)} />

      {/* About Dialog */}
      <AboutDialog isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  )
}

export default App
