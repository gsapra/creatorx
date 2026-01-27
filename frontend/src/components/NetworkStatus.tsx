import { useNetwork } from '../hooks/useNetwork'
import { WifiOff } from 'lucide-react'

export default function NetworkStatus() {
  const { connected } = useNetwork()

  if (connected) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
      <WifiOff className="w-4 h-4" />
      <span>You're offline. Some features may not be available.</span>
    </div>
  )
}
