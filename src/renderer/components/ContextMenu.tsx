import React, { useEffect, useRef } from 'react'

export interface MenuItem {
  label: string
  shortcut?: string
  onClick: () => void
  disabled?: boolean
  divider?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${x - rect.width}px`
      }
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${y - rect.height}px`
      }
    }
  }, [x, y])

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-300 rounded shadow-lg py-1 min-w-48"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        item.divider ? (
          <div key={index} className="border-t border-gray-200 my-1" />
        ) : (
          <button
            key={index}
            className={`w-full px-4 py-1.5 text-left text-sm flex justify-between items-center
              ${item.disabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'hover:bg-blue-500 hover:text-white'
              }`}
            onClick={() => {
              if (!item.disabled) {
                item.onClick()
                onClose()
              }
            }}
            disabled={item.disabled}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className={`ml-4 text-xs ${item.disabled ? 'text-gray-400' : 'text-gray-500'}`}>
                {item.shortcut}
              </span>
            )}
          </button>
        )
      ))}
    </div>
  )
}
