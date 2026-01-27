import { ReactNode } from 'react'
import { cn } from '../utils/cn'
import { getPlatformFont, getPlatformTextSize } from '../utils/platformStyles'

interface PlatformTextProps {
  children: ReactNode
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  className?: string
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

/**
 * Platform-aware text component
 * Automatically uses appropriate font and size for each platform
 */
export default function PlatformText({
  children,
  size = 'base',
  weight = 'normal',
  className,
  as: Component = 'p',
}: PlatformTextProps) {
  const fontClass = getPlatformFont()
  const sizeClass = getPlatformTextSize(size)

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }

  return (
    <Component
      className={cn(
        fontClass,
        sizeClass,
        weightClasses[weight],
        className
      )}
    >
      {children}
    </Component>
  )
}
