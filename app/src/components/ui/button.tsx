import { cn } from '@/lib/utils/cn'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:pointer-events-none disabled:opacity-50 rounded-[var(--radius)]',
          {
            'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90':
              variant === 'primary',
            'hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]':
              variant === 'ghost',
            'border border-[hsl(var(--border))] bg-transparent hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]':
              variant === 'outline',
            'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:opacity-90':
              variant === 'destructive',
          },
          {
            'h-7 px-3 text-xs': size === 'sm',
            'h-9 px-4 text-sm': size === 'md',
            'h-11 px-6 text-base': size === 'lg',
            'h-9 w-9 p-0': size === 'icon',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
