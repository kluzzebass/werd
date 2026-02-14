import { useEffect, useRef } from 'react'
import { useDocumentStore } from '../store/document'

const AUTOSAVE_KEY = 'werd-autosave'
const AUTOSAVE_TIMESTAMP_KEY = 'werd-autosave-timestamp'
const AUTOSAVE_INTERVAL = 30000 // 30 seconds

export function useAutoSave() {
  const getDocumentData = useDocumentStore(state => state.getDocumentData)
  const loadDocument = useDocumentStore(state => state.loadDocument)
  const isDirty = useDocumentStore(state => state.isDirty)
  const filePath = useDocumentStore(state => state.filePath)

  const lastSaveRef = useRef<number>(Date.now())

  // Auto-save to localStorage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) {
        const data = getDocumentData()
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data))
        localStorage.setItem(AUTOSAVE_TIMESTAMP_KEY, String(Date.now()))
        lastSaveRef.current = Date.now()
      }
    }, AUTOSAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [isDirty, getDocumentData])

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        const data = getDocumentData()
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data))
        localStorage.setItem(AUTOSAVE_TIMESTAMP_KEY, String(Date.now()))

        // Show confirmation dialog
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, getDocumentData])

  // Check for recovery data on mount
  const checkForRecovery = (): { data: any; timestamp: number } | null => {
    try {
      const savedData = localStorage.getItem(AUTOSAVE_KEY)
      const savedTimestamp = localStorage.getItem(AUTOSAVE_TIMESTAMP_KEY)

      if (savedData && savedTimestamp) {
        const data = JSON.parse(savedData)
        const timestamp = parseInt(savedTimestamp)

        // Only offer recovery if it's recent (within 24 hours)
        const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000

        if (isRecent && data.word) {
          return { data, timestamp }
        }
      }
    } catch (e) {
      console.error('Failed to check recovery data:', e)
    }
    return null
  }

  const recoverFromAutosave = (data: any) => {
    loadDocument(data, undefined)
    clearAutosave()
  }

  const clearAutosave = () => {
    localStorage.removeItem(AUTOSAVE_KEY)
    localStorage.removeItem(AUTOSAVE_TIMESTAMP_KEY)
  }

  return {
    checkForRecovery,
    recoverFromAutosave,
    clearAutosave
  }
}
