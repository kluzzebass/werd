import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'

interface FileMenuProps {
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onSaveAs: () => void
  onExport: () => void
  onImport: () => void
  onAbout: () => void
}

export const FileMenu: React.FC<FileMenuProps> = ({
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onExport,
  onImport,
  onAbout
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 2,
        left: rect.left
      })
    }
  }, [isOpen])

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  const MenuItem: React.FC<{
    label: string
    shortcut?: string
    onClick: () => void
  }> = ({ label, shortcut, onClick }) => (
    <button
      className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex justify-between items-center"
      onClick={() => handleAction(onClick)}
    >
      <span>{label}</span>
      {shortcut && <span className="text-gray-400 text-xs ml-4">{shortcut}</span>}
    </button>
  )

  return (
    <>
      <button
        ref={buttonRef}
        className={`h-7 px-3 text-sm rounded hover:bg-gray-200 ${isOpen ? 'bg-gray-200' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        File
      </button>

      {isOpen && ReactDOM.createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-[9999] bg-white border border-gray-200 shadow-lg rounded min-w-[200px] py-1"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <MenuItem label="New" shortcut="Ctrl+N" onClick={onNew} />
            <MenuItem label="Open..." shortcut="Ctrl+O" onClick={onOpen} />
            <div className="h-px bg-gray-200 my-1" />
            <MenuItem label="Save" shortcut="Ctrl+S" onClick={onSave} />
            <MenuItem label="Save As..." onClick={onSaveAs} />
            <div className="h-px bg-gray-200 my-1" />
            <MenuItem label="Import..." onClick={onImport} />
            <MenuItem label="Export..." onClick={onExport} />
            <div className="h-px bg-gray-200 my-1" />
            <MenuItem label="About Werd" onClick={onAbout} />
          </div>
        </>,
        document.body
      )}
    </>
  )
}
