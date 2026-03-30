'use client'

import { useState, useRef, useCallback } from 'react'

interface CouncilInputProps {
  onSend: (text: string) => void
  isStreaming: boolean
}

export function CouncilInput({ onSend, isStreaming }: CouncilInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const text = value.trim()
    if (!text || isStreaming) return
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    onSend(text)
  }, [value, isStreaming, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  return (
    <div className="council-input-wrapper">
      <div className={`council-input-container ${isStreaming ? 'council-input-streaming' : ''}`}>
        <textarea
          ref={textareaRef}
          className="council-textarea"
          placeholder={isStreaming ? 'O conselho está deliberando…' : 'Submeta sua questão ao conselho'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={isStreaming}
          rows={1}
        />
        <button
          className="council-send-btn"
          onClick={handleSend}
          disabled={isStreaming || !value.trim()}
          aria-label="Deliberar"
        >
          {isStreaming ? (
            <span className="council-send-spinner" />
          ) : (
            <span className="council-send-label">Deliberar</span>
          )}
        </button>
      </div>
      <p className="council-input-hint">
        Enter para deliberar · Shift+Enter para nova linha
      </p>
    </div>
  )
}
