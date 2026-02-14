import React from 'react'
import iconUrl from '../assets/icon.png'

interface AboutDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 text-center">
        <img src={iconUrl} alt="Werd" className="w-40 h-40 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Werd</h1>
        <p className="text-gray-500 text-sm mb-4">The One-Word Word Processor</p>

        <p className="text-gray-600 text-sm mb-4">
          What if Word did what the name suggests?
        </p>

        <p className="text-gray-500 text-xs italic mb-4">
          Because sometimes, one word is all you need.
        </p>

        <div className="text-gray-400 text-xs mb-4">
          <p>Version {__APP_VERSION__}</p>
          <p className="mt-1">Copyright &copy; 2026 Jan Fredrik Leversund</p>
          <p>MIT License</p>
        </div>

        <a
          href="https://github.com/kluzzebass/werd"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 text-sm underline block mb-6"
        >
          github.com/kluzzebass/werd
        </a>

        <button
          onClick={onClose}
          className="px-4 py-2 bg-word-blue text-white rounded hover:bg-word-dark-blue text-sm"
        >
          Close
        </button>
      </div>
    </div>
  )
}

declare const __APP_VERSION__: string
