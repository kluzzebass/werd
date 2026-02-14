import React from 'react'
import { useDocumentStore } from '../store/document'

interface StatusBarProps {
  zoom: number
  onZoomChange: (zoom: number) => void
}

export const StatusBar: React.FC<StatusBarProps> = ({ zoom, onZoomChange }) => {
  const word = useDocumentStore(state => state.word)

  const wordCount = (word.value !== null && word.value !== '') ? 1 : 0

  const zoomPresets = [50, 75, 100, 125, 150, 200]

  return (
    <div className="flex items-center h-7 px-3 bg-word-blue text-white text-xs gap-4 flex-shrink-0 z-10">
      {/* Word count */}
      <span>{wordCount} {wordCount === 1 ? 'Word' : 'Words'}</span>

      {/* Comment indicator */}
      {word.comment && (
        <>
          <div className="w-px h-4 bg-white/30" />
          <span className="opacity-80">Has comment</span>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        <button
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20"
          onClick={() => onZoomChange(Math.max(25, zoom - 25))}
          title="Zoom Out"
        >
          −
        </button>

        <input
          type="range"
          min="25"
          max="200"
          step="25"
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-20 h-1 accent-white"
        />

        <button
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20"
          onClick={() => onZoomChange(Math.min(200, zoom + 25))}
          title="Zoom In"
        >
          +
        </button>

        <select
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="px-1 py-0.5 rounded bg-white/20 text-white text-xs border-none outline-none"
        >
          {zoomPresets.map(z => (
            <option key={z} value={z} className="text-black">{z}%</option>
          ))}
        </select>
      </div>
    </div>
  )
}
