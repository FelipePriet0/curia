import { AlertTriangle } from 'lucide-react'

interface ContextDisclaimerProps {
  size?: 'compact' | 'normal'
  className?: string
  children?: React.ReactNode
}

export function ContextDisclaimer({ size = 'normal', className, children }: ContextDisclaimerProps) {
  const base = size === 'compact'
    ? 'rounded-lg border px-3 py-2 text-[11px]'
    : 'rounded-xl border px-4 py-3 text-xs'

  return (
    <div className={`${base} border-[hsl(var(--border))] bg-[hsl(var(--muted)/60%)] text-[hsl(var(--muted-foreground))] ${className ?? ''}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className={size === 'compact' ? 'h-3.5 w-3.5 mt-0.5' : 'h-4 w-4 mt-0.5'} />
        <div className="leading-relaxed">
          {children ?? (
            <>
              <span className="font-medium text-[#2B1A07]">Revise criticamente.</span>{' '}
              Este conteúdo não substitui assessoria profissional.
            </>
          )}
        </div>
      </div>
    </div>
  )
}

