'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/cn'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  return (
    <div className="flex items-end gap-2 rounded-xl border border-[#2B1A07]/12 bg-white p-3 shadow-sm transition-shadow focus-within:shadow-md focus-within:border-[#FF6F1E]/40">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        disabled={disabled}
        placeholder={placeholder || 'Traga uma decisão ou problema estratégico para o Board...'}
        rows={1}
        className={cn(
          'min-h-[36px] border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0',
          'font-curia-serif text-sm text-[#2B1A07] placeholder:text-[#2B1A07]/35'
        )}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF6F1E] text-[#2B1A07] shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  )
}
