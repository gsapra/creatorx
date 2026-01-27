import { platform } from './platform'

/**
 * Platform-aware style utility
 * Returns appropriate CSS classes based on platform
 */

// Font families for different platforms
export const fontFamily = {
  // Native iOS uses SF Pro
  ios: 'font-sf-pro',
  // Native Android uses Roboto
  android: 'font-roboto',
  // Web uses Inter (custom brand font)
  web: 'font-sans',
}

// Get appropriate font class for current platform
export const getPlatformFont = (): string => {
  if (platform.isIOS()) return fontFamily.ios
  if (platform.isAndroid()) return fontFamily.android
  return fontFamily.web
}

// Spacing adjustments (mobile needs larger touch targets)
export const spacing = {
  mobile: {
    button: 'px-6 py-4',      // Larger buttons on mobile
    input: 'px-4 py-4',        // Larger inputs on mobile
    card: 'p-6',               // More padding on mobile
    gap: 'gap-6',              // More spacing on mobile
  },
  web: {
    button: 'px-5 py-2.5',     // Standard buttons on web
    input: 'px-4 py-2.5',      // Standard inputs on web
    card: 'p-5',               // Standard padding on web
    gap: 'gap-4',              // Standard spacing on web
  },
}

export const getPlatformSpacing = (element: 'button' | 'input' | 'card' | 'gap'): string => {
  return platform.isNative() ? spacing.mobile[element] : spacing.web[element]
}

// Text sizes (mobile needs slightly larger text for readability)
export const textSize = {
  mobile: {
    xs: 'text-sm',
    sm: 'text-base',
    base: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl',
  },
  web: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  },
}

export const getPlatformTextSize = (size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'): string => {
  return platform.isNative() ? textSize.mobile[size] : textSize.web[size]
}

// Border radius (mobile often uses rounder corners)
export const borderRadius = {
  mobile: {
    sm: 'rounded-xl',
    md: 'rounded-2xl',
    lg: 'rounded-3xl',
    full: 'rounded-full',
  },
  web: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },
}

export const getPlatformRadius = (size: 'sm' | 'md' | 'lg' | 'full'): string => {
  return platform.isNative() ? borderRadius.mobile[size] : borderRadius.web[size]
}

// Combined utility for common patterns
export const platformStyles = {
  // Primary button
  button: `${getPlatformFont()} ${getPlatformSpacing('button')} ${getPlatformRadius('full')}`,

  // Input field
  input: `${getPlatformFont()} ${getPlatformSpacing('input')} ${getPlatformRadius('md')}`,

  // Card
  card: `${getPlatformFont()} ${getPlatformSpacing('card')} ${getPlatformRadius('lg')}`,

  // Heading
  heading: `${getPlatformFont()} font-bold`,

  // Body text
  body: `${getPlatformFont()}`,
}

// Helper to merge platform styles with custom classes
export const mergePlatformStyles = (
  baseStyle: keyof typeof platformStyles,
  customClasses: string = ''
): string => {
  return `${platformStyles[baseStyle]} ${customClasses}`
}
