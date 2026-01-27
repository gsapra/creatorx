import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Animated background circles */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-purple-100 dark:from-brand-900/20 dark:to-purple-900/20 rounded-full animate-pulse" />
        <div className="relative w-24 h-24 bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
          <Icon className="w-12 h-12 text-brand-500 dark:text-brand-400" />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
        {description}
      </p>

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
