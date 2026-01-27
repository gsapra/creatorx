import { ReactNode } from 'react'
import { cn } from '../utils/cn'
import { getPlatformFont, getPlatformSpacing, getPlatformRadius } from '../utils/platformStyles'

interface PlatformCardProps {
  children: ReactNode
  variant?: 'glass' | 'solid' | 'outline'
  hover?: boolean
  onClick?: () => void
  className?: string
}

/**
 * Platform-aware card component
 * - Uses system fonts on mobile
 * - Larger padding on mobile
 * - Rounder corners on mobile
 */
export default function PlatformCard({
  children,
  variant = 'glass',
  hover = true,
  onClick,
  className,
}: PlatformCardProps) {
  const fontClass = getPlatformFont()
  const paddingClass = getPlatformSpacing('card')
  const radiusClass = getPlatformRadius('lg')

  const variantClasses = {
    glass: 'backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 shadow-xl',
    solid: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg',
    outline: 'bg-transparent border-2 border-gray-200 dark:border-gray-800',
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        fontClass,
        paddingClass,
        radiusClass,
        variantClasses[variant],
        hover && 'transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]',
        onClick && 'cursor-pointer active:scale-[0.98]',
        className
      )}
    >
      {children}
    </div>
  )
}
