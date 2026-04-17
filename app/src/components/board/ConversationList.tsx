'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Plus, Search, MessageSquare, MoreHorizontal,
  Share2, Pin, PinOff, Pencil, Archive, Trash2, X, Check,
  Layers, ClipboardList, Calendar, ChevronRight, Copy, Link2, CheckCheck, Folder, LogOut,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils/cn'
import type { Conversation, Plan, Strategy } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Feature flags (temporary)
const SHARE_ENABLED = true

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
  onSelect: (id: string) => void
  onNew: () => void
  newConversationDisabled?: boolean
  newConversationDisabledReason?: string
  loading?: boolean
  plans?: Plan[]
  onPlanSelect?: (plan: Plan) => void
  strategies?: Strategy[]
  onStrategySelect?: (strategy: Strategy) => void
  onConversationUpdate?: (conv: Conversation) => void
  onConversationDelete?: (id: string) => void
  userName?: string
  onLogout?: () => void
  onToggleSidebar?: () => void
  sidebarOpen?: boolean
}

// ─── Conversation actions (API calls) ────────────────────────────────────────
async function patchConversation(id: string, update: Record<string, unknown>): Promise<Conversation | null> {
  const res = await fetch(`/api/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  })
  if (!res.ok) return null
  return res.json()
}

async function deleteConversation(id: string): Promise<boolean> {
  const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
  return res.ok
}

// ─── Delete confirmation dialog ──────────────────────────────────────────────
interface DeleteDialogProps {
  conv: Conversation
  onConfirm: () => void
  onCancel: () => void
}

function DeleteDialog({ conv, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <Dialog open onClose={onCancel}>
      <DialogHeader>
        <DialogTitle>Deletar conversa?</DialogTitle>
        <DialogDescription>
          A conversa <span className="font-medium text-[#2B1A07]/75">&ldquo;{conv.title}&rdquo;</span> será removida permanentemente. Esta ação não pode ser desfeita.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <button
          onClick={onCancel}
          className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[#2B1A07]/70 transition-colors hover:bg-[#2B1A07]/[0.05] hover:text-[#2B1A07] font-curia-serif"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 font-curia-serif"
        >
          Deletar conversa
        </button>
      </DialogFooter>
    </Dialog>
  )
}

// ─── Share dialog (ChatGPT-style) ─────────────────────────────────────────────
type ShareState = 'idle' | 'creating' | 'ready'

interface ShareDialogProps {
  conv: Conversation
  onClose: () => void
}

function ShareDialog({ conv, onClose }: ShareDialogProps) {
  const [state, setState] = useState<ShareState>('idle')
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)

  async function createLink() {
    setState('creating')
    try {
      const res = await fetch(`/api/conversations/${conv.id}/share`, { method: 'POST' })
      if (!res.ok) throw new Error('Falha ao criar link público')
      const data = await res.json()
      const url = `${window.location.origin}${data.url}`
      setShareUrl(url)
      setState('ready')
    } catch {
      setState('idle')
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }

  return (
    <Dialog open onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Compartilhar conversa</DialogTitle>
        <DialogDescription>
          Crie um link público para esta conversa. Qualquer pessoa com o link poderá visualizá-la.
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        {/* Conversation preview chip */}
        <div className="flex items-center gap-2.5 rounded-xl bg-[#2B1A07]/[0.04] px-3.5 py-2.5 mb-4">
          <MessageSquare size={14} className="shrink-0 text-[#FF6F1E]" />
          <span className="text-sm font-medium text-[#2B1A07]/80 font-curia-serif truncate">{conv.title}</span>
        </div>

        {state === 'idle' && (
          <p className="text-xs text-[#2B1A07]/45 font-curia-serif text-center py-2">
            Nenhum link criado ainda.
          </p>
        )}

        {state === 'creating' && (
          <div className="flex items-center justify-center gap-2 py-3">
            <span className="h-4 w-4 rounded-full border-2 border-[#FF6F1E] border-t-transparent animate-spin" />
            <span className="text-xs text-[#2B1A07]/50 font-curia-serif">Gerando link…</span>
          </div>
        )}

        {state === 'ready' && (
          <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[#2B1A07]/[0.03] px-3.5 py-2.5">
            <Link2 size={13} className="shrink-0 text-[#2B1A07]/35" />
            <span className="flex-1 truncate text-xs text-[#2B1A07]/60 font-curia-serif">{shareUrl}</span>
            <button
              onClick={copyLink}
              className="ml-1 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[#2B1A07]/[0.07] text-[#2B1A07]/70 hover:text-[#2B1A07] font-curia-serif"
            >
              {copied ? <CheckCheck size={13} className="text-green-600" /> : <Copy size={13} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        )}

        <p className="mt-3 text-[11px] text-[#2B1A07]/35 font-curia-serif leading-relaxed">
          O link dará acesso somente à leitura desta conversa. Você poderá revogá-lo a qualquer momento.
        </p>
      </DialogBody>

      <DialogFooter className="border-t border-[hsl(var(--border))]">
        <button
          onClick={onClose}
          className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[#2B1A07]/70 transition-colors hover:bg-[#2B1A07]/[0.05] hover:text-[#2B1A07] font-curia-serif"
        >
          Fechar
        </button>
        {state === 'ready' ? (
          <button
            onClick={copyLink}
            className="flex items-center gap-2 rounded-xl bg-[#FF6F1E] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 font-curia-serif"
          >
            {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
            {copied ? 'Link copiado!' : 'Copiar link'}
          </button>
        ) : (
          <button
            onClick={createLink}
            disabled={state === 'creating'}
            className="flex items-center gap-2 rounded-xl bg-[#FF6F1E] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 font-curia-serif"
          >
            <Link2 size={14} />
            Criar link
          </button>
        )}
      </DialogFooter>
    </Dialog>
  )
}

// ─── Logout confirmation dialog ───────────────────────────────────────────────
interface LogoutDialogProps {
  onConfirm: () => void
  onCancel: () => void
}

function LogoutDialog({ onConfirm, onCancel }: LogoutDialogProps) {
  return (
    <Dialog open onClose={onCancel}>
      <DialogHeader>
        <DialogTitle>Sair da Curia?</DialogTitle>
        <DialogDescription>
          Você será desconectado desta sessão e retornará à tela inicial.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <button
          onClick={onCancel}
          className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium text-[#2B1A07]/70 transition-colors hover:bg-[#2B1A07]/[0.05] hover:text-[#2B1A07] font-curia-serif"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF6F1E] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 font-curia-serif"
        >
          <LogOut size={14} />
          Sair
        </button>
      </DialogFooter>
    </Dialog>
  )
}

// ─── 3-dot popover ───────────────────────────────────────────────────────────
interface ConvMenuProps {
  conv: Conversation
  onClose: () => void
  onRename: () => void
  onPin: () => void
  onArchive: () => void
  onDelete: () => void
  onShare: () => void
}

function ConvMenu({ conv, onClose, onRename, onPin, onArchive, onDelete, onShare }: ConvMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const item = (icon: React.ReactNode, label: string, onClick: () => void, danger = false, skipClose = false) => (
    <button
      onClick={() => { onClick(); if (!skipClose) onClose() }}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors text-left',
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-[#2B1A07]/75 hover:bg-[#2B1A07]/[0.07] hover:text-[#2B1A07]'
      )}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div
      ref={ref}
      className="absolute right-0 top-7 z-50 w-48 rounded-xl border border-[hsl(var(--border))] bg-white py-1.5 shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      {SHARE_ENABLED && item(<Share2 size={13} />, 'Compartilhar', onShare, false, true)}
      {item(conv.pinned ? <PinOff size={13} /> : <Pin size={13} />, conv.pinned ? 'Desafixar' : 'Fixar conversa', onPin)}
      {item(<Pencil size={13} />, 'Renomear', onRename)}
      <div className="mx-3 my-1 border-t border-[hsl(var(--border))]" />
      {item(<Archive size={13} />, conv.archived ? 'Desarquivar' : 'Arquivar', onArchive)}
      {item(<Trash2 size={13} />, 'Deletar', onDelete, true, true)}
    </div>
  )
}

// ─── Single conversation row ──────────────────────────────────────────────────
interface ConvItemProps {
  conv: Conversation
  active: boolean
  onSelect: () => void
  onUpdate: (c: Conversation) => void
  onDelete: () => void
}

function ConvItem({ conv, active, onSelect, onUpdate, onDelete }: ConvItemProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(conv.title)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const renameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renaming) renameRef.current?.select()
  }, [renaming])

  async function submitRename() {
    const title = renameVal.trim()
    if (!title || title === conv.title) { setRenaming(false); return }
    const updated = await patchConversation(conv.id, { title })
    if (updated) onUpdate(updated)
    setRenaming(false)
  }

  async function handlePin() {
    const updated = await patchConversation(conv.id, { pinned: !conv.pinned })
    if (updated) onUpdate(updated)
  }

  async function handleArchive() {
    const updated = await patchConversation(conv.id, { archived: !conv.archived })
    if (updated) onUpdate(updated)
  }

  async function confirmDelete() {
    const ok = await deleteConversation(conv.id)
    if (ok) onDelete()
    setShowDeleteDialog(false)
  }

  function handleShare() {
    setShowShareDialog(true)
  }

  if (renaming) {
    return (
      <div className="flex items-center gap-1 rounded-xl px-2 py-1 bg-white border border-[rgba(255,111,30,0.4)]">
        <input
          ref={renameRef}
          className="flex-1 min-w-0 bg-transparent text-sm text-[#2B1A07] outline-none font-curia-serif"
          value={renameVal}
          onChange={(e) => setRenameVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitRename()
            if (e.key === 'Escape') setRenaming(false)
          }}
        />
        <button onClick={submitRename} className="text-[#FF6F1E] hover:opacity-75"><Check size={13} /></button>
        <button onClick={() => setRenaming(false)} className="text-[#2B1A07]/40 hover:opacity-75"><X size={13} /></button>
      </div>
    )
  }

  return (
    <div className="group relative">
      <button
        onClick={onSelect}
        className={cn(
          'w-full text-left rounded-xl px-3 py-2 font-curia-serif text-sm transition-all pr-8',
          active
            ? 'bg-black/30 text-[#2B1A07] font-medium'
            : 'text-[#2B1A07]/70 hover:bg-black/[0.30] hover:text-[#2B1A07]'
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Folder size={15} strokeWidth={2.5} className={cn('shrink-0', active ? 'opacity-70' : 'text-[#2B1A07]/35')} />
          <span className="truncate">{conv.title}</span>
          {conv.pinned && (
            <Pin size={9} className={cn('shrink-0 ml-0.5', active ? 'opacity-60' : 'text-[#C9A84C] opacity-70')} />
          )}
        </span>
      </button>

      {/* 3-dot button — visible on hover or when menu is open */}
      <button
        onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
        className={cn(
          'absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-lg transition-opacity',
          active ? 'text-[#2B1A07]/60 hover:bg-black/10' : 'text-[#2B1A07]/40 hover:bg-[#2B1A07]/10',
          menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <MoreHorizontal size={13} />
      </button>

      {menuOpen && (
        <ConvMenu
          conv={conv}
          onClose={() => setMenuOpen(false)}
          onRename={() => setRenaming(true)}
          onPin={handlePin}
          onArchive={handleArchive}
          onDelete={() => { setMenuOpen(false); setShowDeleteDialog(true) }}
          onShare={() => { setMenuOpen(false); setShowShareDialog(true) }}
        />
      )}

      {showDeleteDialog && (
        <DeleteDialog
          conv={conv}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}

      {showShareDialog && (
        <ShareDialog
          conv={conv}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  newConversationDisabled = false,
  newConversationDisabledReason = 'Ação indisponível no momento.',
  loading,
  plans = [],
  onPlanSelect,
  strategies = [],
  onStrategySelect,
  onConversationUpdate,
  onConversationDelete,
  userName,
  onLogout,
  onToggleSidebar,
  sidebarOpen,
}: ConversationListProps) {
  const [search, setSearch] = useState('')
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const activePlans = plans.filter((p) => p.status === 'active')
  const regularConvs = conversations.filter((c) => !c.strategy_id && !c.archived)
  const strategyConvs = conversations.filter((c) => c.strategy_id && !c.archived)
  const archivedConvs = conversations.filter((c) => c.archived)

  const convsByStrategy = strategyConvs.reduce<Record<string, Conversation[]>>((acc, c) => {
    const sid = c.strategy_id!
    if (!acc[sid]) acc[sid] = []
    acc[sid].push(c)
    return acc
  }, {})

  // Filter by search (case and accent insensitive)
  function normalizeText(text: string) {
    return text
      .normalize('NFD') // split accents from letters
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .toLowerCase()
  }

  const hasSearch = !!search.trim()
  const q = normalizeText(search.trim())

  const filtered = (list: Conversation[]) => {
    if (!hasSearch || !q) return list
    return list.filter((c) => normalizeText(c.title).includes(q))
  }

  // Filter strategies and plans when searching
  const visibleStrategies = hasSearch
    ? strategies.filter((s) => {
        const nameMatch = normalizeText(s.name).includes(q)
        const sConvs = convsByStrategy[s.id] ?? []
        const anyConvMatch = sConvs.some((c) => normalizeText(c.title).includes(q))
        return nameMatch || anyConvMatch
      })
    : strategies

  const visibleActivePlans = hasSearch
    ? activePlans.filter((p) => normalizeText(p.title).includes(q))
    : activePlans

  const pinnedConvs   = filtered(regularConvs.filter((c) => c.pinned))
  const unpinnedConvs = filtered(regularConvs.filter((c) => !c.pinned))

  const isEmpty = !loading && conversations.filter((c) => !c.archived).length === 0 && strategies.length === 0 && activePlans.length === 0

  function handleUpdate(updated: Conversation) {
    onConversationUpdate?.(updated)
  }

  function handleDelete(id: string) {
    onConversationDelete?.(id)
  }

  const renderConv = (conv: Conversation) => (
    <ConvItem
      key={conv.id}
      conv={conv}
      active={activeId === conv.id}
      onSelect={() => onSelect(conv.id)}
      onUpdate={handleUpdate}
      onDelete={() => handleDelete(conv.id)}
    />
  )

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#2B1A07]/40 hover:bg-[#2B1A07]/[0.06] hover:text-[#2B1A07]/70 transition-colors"
              title={sidebarOpen ? 'Fechar sidebar' : 'Abrir sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>
          )}
          <span className="font-curia-rounded text-[#2B1A07] text-2xl leading-none">Curia</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onNew}
          disabled={newConversationDisabled}
          title={newConversationDisabled ? newConversationDisabledReason : 'Nova consulta'}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-xl bg-[#2B1A07]/[0.05] px-3 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-[#2B1A07]/35" />
          <input
            type="text"
            placeholder="Buscar conversa…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-[#2B1A07] placeholder-[#2B1A07]/35 outline-none font-curia-serif"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-[#2B1A07]/35 hover:text-[#2B1A07]/60">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Strategies */}
        {visibleStrategies.length > 0 && (
          <div className="p-2 pb-0">
            <p className="px-3 py-1.5 font-notably-alt text-[10px] tracking-wider text-[#2B1A07]/40">Estratégias</p>
            <div className="space-y-1">
              {visibleStrategies.map((strategy) => {
                const sConvsAll = convsByStrategy[strategy.id] ?? []
                const sConvs = hasSearch ? filtered(sConvsAll) : sConvsAll
                const hasActive = sConvs.some((c) => c.id === activeId)
                return (
                  <div key={strategy.id}>
                    <button
                      onClick={() => onStrategySelect?.(strategy)}
                      className={cn(
                        'w-full text-left rounded-xl px-3 py-2 font-curia-serif text-sm transition-all',
                        hasActive ? 'bg-[#FF6F1E]/15 text-[#2B1A07] font-medium' : 'text-[#2B1A07]/70 hover:bg-[#2B1A07]/[0.06] hover:text-[#2B1A07]'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 shrink-0 text-[#FF6F1E]" />
                        <span className="truncate flex-1">{strategy.name}</span>
                        <ChevronRight className="h-3 w-3 shrink-0 text-[#2B1A07]/30" />
                      </div>
                    </button>
                    {sConvs.length > 0 && (
                      <div className="ml-4 mt-0.5 space-y-0.5 border-l border-[#FF6F1E]/20 pl-2">
                        {sConvs.map((conv) => renderConv(conv))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mx-3 mt-2 border-b" style={{ borderColor: 'rgba(201,168,76,0.1)' }} />
          </div>
        )}

        {/* Active Plans */}
        {visibleActivePlans.length > 0 && (
          <div className="p-2 pb-0">
            <p className="px-3 py-1.5 font-notably-alt text-[10px] tracking-wider text-[#2B1A07]/40">Planos Ativos</p>
            <div className="space-y-1">
              {visibleActivePlans.map((plan) => {
                const reviewDate = plan.review_date ? new Date(plan.review_date + 'T00:00:00') : null
                const today = new Date(); today.setHours(0,0,0,0)
                const daysLeft = reviewDate ? Math.ceil((reviewDate.getTime() - today.getTime()) / 86400000) : null
                const overdue = daysLeft !== null && daysLeft < 0
                const dueToday = daysLeft === 0
                return (
                  <button
                    key={plan.id}
                    onClick={() => onPlanSelect?.(plan)}
                    className="w-full text-left rounded-[var(--brand-radius-md)] px-3 py-2 text-sm transition-colors hover:bg-[#2B1A07]/[0.06]"
                  >
                    <div className="flex items-start gap-2">
                      <ClipboardList className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF6F1E]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-[#2B1A07]/80">{plan.title}</p>
                        {reviewDate && (
                          <p className={cn('text-[10px]', overdue || dueToday ? 'text-[#FF6F1E] font-medium' : 'text-[#2B1A07]/45')}>
                            {overdue ? 'Revisão atrasada' : dueToday ? 'Revisão hoje' : `Revisão em ${daysLeft}d`}
                          </p>
                        )}
                      </div>
                      {(overdue || dueToday) && <Calendar className="mt-0.5 h-3 w-3 shrink-0 text-[#FF6F1E]" />}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="mx-3 mt-2 border-b" style={{ borderColor: 'rgba(201,168,76,0.1)' }} />
          </div>
        )}

        {/* Conversations */}
        {loading ? (
          <div className="p-3 space-y-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 rounded-xl bg-[#2B1A07]/[0.06] animate-pulse" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2B1A07]/[0.06]">
              <MessageSquare className="h-5 w-5 text-[#2B1A07]/35" />
            </div>
            <p className="font-curia-serif text-sm text-[#2B1A07]/60 leading-relaxed">
              Você ainda não tem nenhuma conversa aberta.
            </p>
          </div>
        ) : (
          <nav className="p-2 space-y-0.5">
            {/* Pinned */}
            {pinnedConvs.length > 0 && (
              <>
                <p className="px-3 py-1.5 font-notably-alt text-[10px] tracking-wider text-[#2B1A07]/40">Fixadas</p>
                {pinnedConvs.map(renderConv)}
                {unpinnedConvs.length > 0 && <div className="mx-1 my-1.5 border-t border-[hsl(var(--border))]" />}
              </>
            )}

            {/* Regular */}
            {unpinnedConvs.length > 0 && (
              <>
                {pinnedConvs.length > 0 && (
                  <p className="px-3 py-1.5 font-notably-alt text-[10px] tracking-wider text-[#2B1A07]/40">Conversas</p>
                )}
                {unpinnedConvs.map(renderConv)}
              </>
            )}

            {/* Archived (collapsed) */}
            {!search && archivedConvs.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer list-none px-3 py-1.5 font-notably-alt text-[10px] tracking-wider text-[#2B1A07]/30 hover:text-[#2B1A07]/50 transition-colors select-none">
                  Arquivadas ({archivedConvs.length})
                </summary>
                <div className="mt-0.5 space-y-0.5">
                  {archivedConvs.map(renderConv)}
                </div>
              </details>
            )}
          </nav>
        )}
      </div>

      {/* Sidebar footer: user + logout */}
      <div className="mt-2 border-t border-[hsl(var(--border))] px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative">
              <Avatar className="h-7 w-7 rounded-lg">
                {/* Caso exista imagem do usuário algum dia: */}
                {/* <AvatarImage src="/avatar.jpg" alt={userName ?? 'Você'} /> */}
                <AvatarFallback>
                  {(userName ?? 'Você')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((s) => s[0]!.toUpperCase())
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 border-2 border-white">
                <span className="sr-only">Online</span>
              </span>
            </div>
            <span className="truncate font-curia-serif text-xs text-[#2B1A07]/70">{userName ?? 'Você'}</span>
          </div>
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="rounded-lg border border-[#2B1A07]/15 bg-white p-1.5 text-[#2B1A07]/70 shadow-sm transition-colors hover:border-[#FF6F1E]/40 hover:text-[#2B1A07]"
            title="Sair"
            aria-label="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
      {showLogoutDialog && (
        <LogoutDialog
          onCancel={() => setShowLogoutDialog(false)}
          onConfirm={() => { setShowLogoutDialog(false); onLogout?.() }}
        />
      )}
    </div>
  )
}
