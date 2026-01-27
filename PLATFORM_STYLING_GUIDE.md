# 📱 Platform-Specific Styling Guide

## Overview

CreatorX now uses **platform-aware styling** that automatically adapts fonts, spacing, and UI elements based on whether the app is running on web, iOS, or Android.

---

## 🎨 Font Strategy

### Web (Browser)
- **Font**: Inter (custom brand font)
- **Why**: Maintains brand identity, modern web font
- **Class**: `font-sans`

### iOS (Native App)
- **Font**: SF Pro (Apple's system font)
- **Why**: Native iOS feel, better performance, familiar to iOS users
- **Class**: `font-sf-pro`

### Android (Native App)
- **Font**: Roboto (Google's system font)
- **Why**: Native Android feel, better performance, Material Design standard
- **Class**: `font-roboto`

---

## 🚀 How It Works

### Automatic Detection

The app automatically detects the platform and applies the appropriate font:

```typescript
import { getPlatformFont } from './utils/platformStyles'

const fontClass = getPlatformFont()
// Returns: 'font-sf-pro' on iOS
// Returns: 'font-roboto' on Android
// Returns: 'font-sans' on Web
```

### Global Application

The font is automatically applied to the entire app via `document.body` in App.tsx.

---

## 🛠️ Platform-Aware Components

### 1. PlatformText

Text component that automatically uses the right font and size:

```tsx
import PlatformText from '@/components/PlatformText'

<PlatformText size="lg" weight="bold">
  Welcome to CreatorX
</PlatformText>
```

**Props:**
- `size`: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'
- `weight`: 'normal' | 'medium' | 'semibold' | 'bold'
- `as`: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
- `className`: Additional Tailwind classes

**Size Adaptation:**
- Mobile gets slightly larger text for readability
- Web uses standard sizes

### 2. PlatformButton

Button with platform-specific styling and haptic feedback:

```tsx
import PlatformButton from '@/components/PlatformButton'

<PlatformButton variant="primary" size="md">
  Get Started
</PlatformButton>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: boolean

**Features:**
- ✅ Larger touch targets on mobile
- ✅ Haptic feedback on tap (mobile)
- ✅ Platform-appropriate font
- ✅ Rounder corners on mobile

### 3. PlatformCard

Card component with platform-specific styling:

```tsx
import PlatformCard from '@/components/PlatformCard'

<PlatformCard variant="glass" hover>
  <h3>Card Title</h3>
  <p>Card content</p>
</PlatformCard>
```

**Props:**
- `variant`: 'glass' | 'solid' | 'outline'
- `hover`: boolean
- `onClick`: () => void

**Features:**
- ✅ More padding on mobile
- ✅ Rounder corners on mobile
- ✅ Platform-appropriate font

---

## 📐 Platform Styling Utilities

### Spacing

```typescript
import { getPlatformSpacing } from '@/utils/platformStyles'

// Button spacing
const buttonClass = getPlatformSpacing('button')
// Mobile: 'px-6 py-4' (larger)
// Web: 'px-5 py-2.5' (standard)

// Input spacing
const inputClass = getPlatformSpacing('input')
// Mobile: 'px-4 py-4'
// Web: 'px-4 py-2.5'

// Card spacing
const cardClass = getPlatformSpacing('card')
// Mobile: 'p-6'
// Web: 'p-5'

// Gap spacing
const gapClass = getPlatformSpacing('gap')
// Mobile: 'gap-6'
// Web: 'gap-4'
```

### Text Sizes

```typescript
import { getPlatformTextSize } from '@/utils/platformStyles'

const textClass = getPlatformTextSize('base')
// Mobile: 'text-lg' (larger for readability)
// Web: 'text-base' (standard)
```

**Size Mapping:**

| Size | Web         | Mobile      | Why                      |
|------|-------------|-------------|--------------------------|
| xs   | text-xs     | text-sm     | Mobile needs larger text |
| sm   | text-sm     | text-base   | Better readability       |
| base | text-base   | text-lg     | Comfortable reading      |
| lg   | text-lg     | text-xl     | Headers pop more         |
| xl   | text-xl     | text-2xl    | Emphasis                 |
| 2xl  | text-2xl    | text-3xl    | Hero text                |

### Border Radius

```typescript
import { getPlatformRadius } from '@/utils/platformStyles'

const radiusClass = getPlatformRadius('md')
// Mobile: 'rounded-2xl' (rounder)
// Web: 'rounded-xl' (standard)
```

**Radius Mapping:**

| Size | Web          | Mobile       |
|------|--------------|--------------|
| sm   | rounded-lg   | rounded-xl   |
| md   | rounded-xl   | rounded-2xl  |
| lg   | rounded-2xl  | rounded-3xl  |
| full | rounded-full | rounded-full |

---

## 🎯 Best Practices

### 1. Use Platform Components

**Good:**
```tsx
<PlatformButton variant="primary">
  Click Me
</PlatformButton>
```

**Avoid:**
```tsx
<button className="px-4 py-2 rounded-lg">
  Click Me
</button>
```

### 2. Let the System Handle Fonts

**Good:**
```tsx
<PlatformText size="lg" weight="bold">
  Heading
</PlatformText>
```

**Avoid:**
```tsx
<h1 className="font-sans text-lg font-bold">
  Heading
</h1>
```

### 3. Use Utility Functions

**Good:**
```tsx
import { platformStyles } from '@/utils/platformStyles'

<div className={platformStyles.card}>
  Content
</div>
```

**Avoid:**
```tsx
<div className="p-5 rounded-xl">
  Content
</div>
```

---

## 🎨 Design Differences by Platform

### iOS Native
- **Font**: SF Pro (system font)
- **Feel**: Clean, minimal, iOS-like
- **Corners**: Rounder (rounded-2xl, rounded-3xl)
- **Spacing**: More generous
- **Touch Targets**: Minimum 44x44pt (Apple guideline)

### Android Native
- **Font**: Roboto (Material Design)
- **Feel**: Bold, Material Design
- **Corners**: Rounder (same as iOS for consistency)
- **Spacing**: More generous
- **Touch Targets**: Minimum 48x48dp (Material guideline)

### Web
- **Font**: Inter (brand font)
- **Feel**: Modern, professional
- **Corners**: Standard (rounded-xl, rounded-2xl)
- **Spacing**: Compact, efficient
- **Interactions**: Hover states, mouse-optimized

---

## 📱 Touch Target Sizes

### Mobile (iOS/Android)

```typescript
// Buttons
sm: 'px-4 py-2'    // ~40px height
md: 'px-6 py-4'    // ~48px height ✅ Meets guidelines
lg: 'px-8 py-5'    // ~56px height

// Inputs
'px-4 py-4'        // ~48px height ✅ Meets guidelines
```

### Web

```typescript
// Buttons
sm: 'px-3 py-1.5'  // ~32px height
md: 'px-5 py-2.5'  // ~40px height
lg: 'px-8 py-3'    // ~48px height
```

---

## 🔧 Manual Overrides

If you need platform-specific styling manually:

```tsx
import { platform } from '@/utils/platform'

<div className={`
  ${platform.isNative() ? 'text-lg px-6' : 'text-base px-4'}
`}>
  Content
</div>
```

Or using Tailwind variants (if configured):

```tsx
<div className="text-base lg:text-lg native:text-xl">
  Content
</div>
```

---

## 🎓 Migration Guide

### Updating Existing Components

**Before:**
```tsx
<button className="px-5 py-2 rounded-full font-sans">
  Click Me
</button>
```

**After:**
```tsx
<PlatformButton variant="primary">
  Click Me
</PlatformButton>
```

**Before:**
```tsx
<div className="p-5 rounded-xl font-sans">
  <h3 className="text-lg font-bold">Title</h3>
  <p className="text-base">Description</p>
</div>
```

**After:**
```tsx
<PlatformCard>
  <PlatformText as="h3" size="lg" weight="bold">
    Title
  </PlatformText>
  <PlatformText size="base">
    Description
  </PlatformText>
</PlatformCard>
```

---

## 🌟 Benefits

### Performance
- ✅ **System fonts load instantly** (no web font download on mobile)
- ✅ **Native rendering** (better text rendering on mobile)
- ✅ **Smaller bundle size** (no font files for mobile)

### User Experience
- ✅ **Feels native** on each platform
- ✅ **Familiar typography** (users know these fonts)
- ✅ **Better readability** (optimized for each platform)
- ✅ **Accessible** (system fonts have excellent accessibility)

### Developer Experience
- ✅ **Automatic adaptation** (write once, works everywhere)
- ✅ **Type-safe utilities** (TypeScript support)
- ✅ **Consistent API** (same components, different results)

---

## 📊 Before vs After

### Before (Single Font for All)
```
Web:     Inter font (brand)
iOS:     Inter font (not native feel)
Android: Inter font (not native feel)
```

### After (Platform-Aware)
```
Web:     Inter font (brand identity) ✅
iOS:     SF Pro (native iOS feel) ✅
Android: Roboto (native Android feel) ✅
```

---

## 🎯 Summary

Your app now:
- ✅ Uses **SF Pro** on iOS (native feel)
- ✅ Uses **Roboto** on Android (Material Design)
- ✅ Uses **Inter** on web (brand identity)
- ✅ Adapts **spacing** for touch vs mouse
- ✅ Adapts **text sizes** for readability
- ✅ Adapts **border radius** for platform conventions
- ✅ Provides **haptic feedback** on mobile
- ✅ Meets **accessibility guidelines** (44pt/48dp touch targets)

**Each platform now feels like a native app while maintaining your brand identity on web!** 🚀

---

## 📚 Reference

- **Components**: `src/components/Platform*`
- **Utilities**: `src/utils/platformStyles.ts`
- **Platform Detection**: `src/utils/platform.ts`
- **Tailwind Config**: `tailwind.config.js`

**Your app now adapts beautifully to each platform!** 🎨✨
