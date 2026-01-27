import { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export default function GlassCard({ children, className, hover = true, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Glassmorphism base
        'relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70',
        'border border-white/20 dark:border-gray-700/30',
        'rounded-2xl shadow-xl',

        // Hover effects
        hover && 'transition-all duration-300',
        hover && 'hover:shadow-2xl hover:scale-[1.02]',
        hover && 'hover:bg-white/80 dark:hover:bg-gray-900/80',

        // Click effect
        onClick && 'cursor-pointer active:scale-[0.98]',

        className
      )}
    >
      {/* Glass shine effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
