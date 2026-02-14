import React, { useState, useEffect, useRef } from 'react'
import { WordComment } from '@shared/types'

interface CommentDialogProps {
  isOpen: boolean
  comment: WordComment | null | undefined
  onSave: (comment: WordComment | null) => void
  onClose: () => void
}

export const CommentDialog: React.FC<CommentDialogProps> = ({
  isOpen,
  comment,
  onSave,
  onClose
}) => {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      setText(comment?.text || '')
      setTimeout(() => textareaRef.current?.focus(), 0)
    }
  }, [isOpen, comment])

  if (!isOpen) return null

  const handleSave = () => {
    if (text.trim()) {
      onSave({
        text: text.trim(),
        author: comment?.author || 'User',
        timestamp: Date.now()
      })
    } else {
      onSave(null)
    }
    onClose()
  }

  const handleDelete = () => {
    onSave(null)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-96">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">
            {comment ? 'Edit Comment' : 'Add Comment'}
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 text-xl"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your comment..."
            className="w-full h-32 p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {comment && (
            <div className="mt-2 text-xs text-gray-500">
              Last edited: {new Date(comment.timestamp).toLocaleString()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-4 py-3 border-t">
          <div>
            {comment && (
              <button
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
