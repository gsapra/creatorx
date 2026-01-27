import { ReactNode, ButtonHTMLAttributes } from 'react'
import { cn } from '../utils/cn'
import { getPlatformFont, getPlatformSpacing, getPlatformRadius } from '../utils/platformStyles'
import { platform } from '../utils/platform'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

interface PlatformButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

/**
 * Platform-aware button component
 * - Uses system fonts on mobile, custom font on web
 * - Larger touch targets on mobile
 * - Haptic feedback on mobile
 */
export default function PlatformButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  onClick,
  className,
  disabled,
  ...props
}: PlatformButtonProps) {
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Haptic feedback on mobile
    if (platform.isNative() && !disabled) {
      await Haptics.impact({ style: ImpactStyle.Light })
    }

    if (onClick) {
      onClick(e)
    }
  }

  const fontClass = getPlatformFont()
  const radiusClass = getPlatformRadius('full')

  // Size classes
  const sizeClasses = {
    sm: platform.isNative() ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-sm',
    md: getPlatformSpacing('button'),
    lg: platform.isNative() ? 'px-8 py-5 text-lg' : 'px-8 py-3 text-lg',
  }

  // Variant classes
  const variantClasses = {
    primary: 'bg-gradient-to-r from-brand-600 to-purple-600 text-white hover:shadow-2xl hover:shadow-brand-500/50',
    secondary: 'bg-white text-brand-600 border-2 border-brand-600 hover:bg-brand-50',
    ghost: 'bg-transparent text-brand-600 hover:bg-brand-50',
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        fontClass,
        radiusClass,
        sizeClasses[size],
        variantClasses[variant],
        'font-semibold transition-all duration-200',
        'hover:scale-105 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
