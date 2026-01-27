import { ReactNode, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { platform } from '../../utils/platform'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  snapPoints?: number[] // [0.5, 0.9] = 50% and 90% of screen height
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.6, 0.9],
}: BottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      if (platform.isNative()) {
        Haptics.impact({ style: ImpactStyle.Light })
      }
    } else {
      setTimeout(() => setIsVisible(false), 300)
    }
  }, [isOpen])

  if (!isVisible) return null

  const handleBackdropClick = async () => {
    if (platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Light })
    }
    onClose()
  }

  const content = (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div
        className={`
          relative w-full bg-white dark:bg-gray-900
          rounded-t-3xl shadow-2xl
          transition-transform duration-300 ease-out
          max-h-[90vh] flex flex-col
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ height: `${snapPoints[0] * 100}vh` }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
