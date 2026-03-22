'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export interface NavItem {
  name: string
  link: string
  icon?: React.ReactNode
}

interface FloatingNavProps {
  navItems: NavItem[]
  className?: string
  cta?: React.ReactNode
  brand?: React.ReactNode
}

export function FloatingNav({ navItems, className = '', cta, brand }: FloatingNavProps) {
  const [visible, setVisible] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY
      // Show whenever past the fold, hide only when back at the very top
      setVisible(current > 80)
      lastScrollY.current = current
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`
        fixed inset-x-0 top-8 z-[9999] flex justify-center
        transition-all duration-300 ease-in-out
        ${visible ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-6 opacity-0 pointer-events-none'}
        ${className}
      `}
    >
      <div className="
        flex items-center gap-1 rounded-full
        border border-white/20
        bg-white/80 dark:bg-black/80
        shadow-[0_8px_32px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.1)_inset]
        backdrop-blur-lg
        px-3 py-2
      ">
        {/* Brand */}
        {brand && (
          <div className="mr-2 pr-2 border-r border-neutral-200/60 dark:border-white/10 flex items-center">
            {brand}
          </div>
        )}
        {/* Nav links */}
        {navItems.map((item, i) => (
          <Link
            key={i}
            href={item.link}
            className="
              flex items-center gap-1.5 rounded-full px-4 py-1.5
              text-sm font-medium text-neutral-600 dark:text-neutral-300
              hover:text-neutral-900 dark:hover:text-white
              hover:bg-neutral-100 dark:hover:bg-white/10
              transition-colors duration-150
            "
          >
            {item.icon && (
              <span className="h-4 w-4 shrink-0">{item.icon}</span>
            )}
            <span>{item.name}</span>
          </Link>
        ))}

        {/* CTA button */}
        {cta && (
          <div className="ml-2 pl-2 border-l border-neutral-200 dark:border-white/10">
            {cta}
          </div>
        )}
      </div>
    </div>
  )
}
