import { ReactNode, useState, useRef, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { platform } from '../../utils/platform'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const threshold = 80 // Pull distance to trigger refresh

  useEffect(() => {
    // Only enable on mobile
    if (!platform.isNative()) return

    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at top of scroll
      if (container.scrollTop === 0) {
        setStartY(e.touches[0].clientY)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (startY === 0 || isRefreshing) return

      const currentY = e.touches[0].clientY
      const distance = currentY - startY

      if (distance > 0 && container.scrollTop === 0) {
        setPullDistance(Math.min(distance, threshold * 1.5))

        // Haptic feedback at threshold
        if (distance >= threshold && distance < threshold + 5) {
          Haptics.impact({ style: ImpactStyle.Medium })
        }
      }
    }

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        await Haptics.impact({ style: ImpactStyle.Heavy })

        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }

      setPullDistance(0)
      setStartY(0)
    }

    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchmove', handleTouchMove)
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [startY, pullDistance, isRefreshing, onRefresh])

  const progress = Math.min(pullDistance / threshold, 1)
  const shouldTrigger = pullDistance >= threshold

  return (
    <div ref={containerRef} className="relative overflow-auto h-full">
      {/* Pull indicator */}
      {platform.isNative() && pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 transition-all"
          style={{ height: `${pullDistance}px` }}
        >
          <div className={`
            transition-all duration-200
            ${shouldTrigger ? 'text-brand-600 scale-110' : 'text-gray-400'}
          `}>
            <RefreshCw
              className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`}
              style={{
                transform: `rotate(${progress * 360}deg)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${isRefreshing ? '60px' : `${pullDistance}px`})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
