'use client'

import React, { useEffect, useState } from 'react'

type Props = {
  children: React.ReactNode
  /**
   * delay in milliseconds before the element animates in
   */
  delay?: number
  className?: string
}

/**
 * Simple client-side mount animator.
 * - On mount waits `delay` ms then toggles styles to animate in.
 * - Uses Tailwind utility classes for transition.
 *
 * Usage:
 * <AnimateOnMount delay={120}>
 *   <div className="...">Animated content</div>
 * </AnimateOnMount>
 */
export default function AnimateOnMount({ children, delay = 0, className = '' }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  // initial: opacity-0 translate-y-4 scale-98
  // final: opacity-100 translate-y-0 scale-100
  // transition: transition-all duration-700 ease-out
  const base = 'transition-all duration-700 ease-out'
  const from = 'opacity-0 -translate-y-3 scale-98'
  const to = 'opacity-100 translate-y-0 scale-100'

  return (
    <div className={`${base} ${mounted ? to : from} ${className}`.trim()}>
      {children}
    </div>
  )
}
