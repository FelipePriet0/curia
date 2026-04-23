'use client'

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { ArrowUp, Plus, ChevronDown, Check, Paperclip, Image as ImageIcon } from 'lucide-react'

interface CouncilInputProps {
  onSend: (text: string) => void
  isStreaming: boolean
  variant?: 'home' | 'chat'
}

export interface CouncilInputHandle {
  focus: () => void
  fill: (text: string) => void
}

export const CouncilInput = forwardRef<CouncilInputHandle, CouncilInputProps>(
function CouncilInput({ onSend, isStreaming, variant = 'chat' }, ref) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Single model popover: Curia Strategist
  const [modelOpen, setModelOpen] = useState(false)
  // Attachments popover
  const [attachOpen, setAttachOpen] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    fill: (text: string) => {
      setValue(text)
      setTimeout(() => {
        textareaRef.current?.focus()
        handleInput()
      }, 0)
    },
  }))

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
            <div className="relative">
              <button
                className="council-tool-btn"
                title="Adicionar arquivos ou fotos"
                disabled={isStreaming}
                onClick={() =>
                  setAttachOpen((o) => {
                    const next = !o
                    if (next) setModelOpen(false)
                    return next
                  })
                }
                aria-haspopup="menu"
                aria-expanded={attachOpen}
              >
                <Plus size={15} strokeWidth={2} />
              </button>
              {attachOpen && (
                <div
                  role="menu"
                  className="absolute left-0 mt-1 w-52 rounded-lg border border-[hsl(var(--border))] bg-white py-1 shadow-lg z-50"
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      setAttachOpen(false)
                      fileInputRef.current?.click()
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-curia-serif text-[#0B0B0F]/80 hover:bg-[#0B0B0F]/[0.06]"
                  >
                    <Paperclip size={13} />
                    Adicionar arquivos ou fotos
                  </button>
                </div>
              )}
            </div>
            {/* Hidden file input (supports múltiplos e pastas em navegadores compatíveis) */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              // @ts-ignore — atributos não padronizados para seleção de pastas
              webkitdirectory=""
              // @ts-ignore
              directory=""
              accept="*/*,image/*"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                if (files.length) setAttachments((prev) => [...prev, ...files])
                // reset para permitir selecionar o mesmo arquivo novamente
                e.currentTarget.value = ''
              }}
            />
            {attachments.length > 0 && (
              <span className="ml-2 rounded-md border border-[#0B0B0F]/15 bg-white px-2 py-0.5 text-[10px] text-[#0B0B0F]/70 font-curia-serif">
                {attachments.length} anexo{attachments.length > 1 ? 's' : ''}
              </span>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setModelOpen((o) => {
                    const next = !o
                    if (next) setAttachOpen(false)
                    return next
                  })
                }
                className="council-model-badge inline-flex items-center gap-1"
                disabled={isStreaming}
                aria-haspopup="menu"
                aria-expanded={modelOpen}
              >
                Curia Strategist
                <ChevronDown size={12} />
              </button>
              {modelOpen && (
                <div
                  role="menu"
                  className="absolute left-0 mt-1 w-44 rounded-lg border border-[hsl(var(--border))] bg-white py-1 shadow-lg z-50"
                >
                  <button
                    role="menuitem"
                    onClick={() => setModelOpen(false)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-xs font-curia-serif text-[#0B0B0F]/80 hover:bg-[#0B0B0F]/[0.06] font-medium"
                  >
                    Curia Strategist
                    <Check size={12} className="text-[#0B0B0F]" />
                  </button>
                </div>
              )}
            </div>
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
})
