'use client'

import { useState, useRef, useCallback } from 'react'
import { ArrowUp, Plus } from 'lucide-react'

interface CouncilInputProps {
  onSend: (text: string) => void
  isStreaming: boolean
  variant?: 'home' | 'chat'
}

export function CouncilInput({ onSend, isStreaming, variant = 'chat' }: CouncilInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const text = value.trim()
    if (!text || isStreaming) return
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
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
    el.style.height = Math.min(el.scrollHeight, variant === 'home' ? 200 : 160) + 'px'
  }

  const placeholder = isStreaming
    ? 'O conselho está deliberando…'
    : variant === 'home'
      ? 'Conte-nos o seu maior desafio, vamos resolvê-lo juntos.'
      : 'Submeta sua questão ao conselho'

  return (
    <div className={variant === 'home' ? 'council-input-home-wrap' : 'council-input-chat-wrap'}>
      <div className={`council-input-box ${isStreaming ? 'council-input-streaming' : ''}`}>
        <textarea
          ref={textareaRef}
          className={`council-textarea ${variant === 'home' ? 'council-textarea-home' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={isStreaming}
          rows={variant === 'home' ? 3 : 1}
        />
        <div className="council-input-footer">
          <div className="council-input-tools">
            <button
              className="council-tool-btn"
              title="Adicionar contexto"
              disabled={isStreaming}
              onClick={(e) => e.preventDefault()}
            >
              <Plus size={15} strokeWidth={2} />
            </button>
            <span className="council-model-badge">Sonnet 4.6</span>
          </div>
          <button
            className="council-send-round"
            onClick={handleSend}
            disabled={isStreaming || !value.trim()}
            aria-label="Deliberar"
          >
            {isStreaming ? (
              <span className="council-send-spinner" />
            ) : (
              <ArrowUp size={15} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
