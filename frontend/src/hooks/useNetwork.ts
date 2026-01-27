import { useState, useEffect } from 'react'
import { Network } from '@capacitor/network'
import { platform } from '@/utils/platform'

interface NetworkStatus {
  connected: boolean
  connectionType: string
}

export function useNetwork() {
  const [status, setStatus] = useState<NetworkStatus>({
    connected: true,
    connectionType: 'unknown',
  })

  useEffect(() => {
    let networkListener: any

    const initNetwork = async () => {
      // Get initial network status
      const networkStatus = await Network.getStatus()

      setStatus({
        connected: networkStatus.connected,
        connectionType: networkStatus.connectionType,
      })

      // Listen for network changes
      networkListener = await Network.addListener('networkStatusChange', (newStatus) => {
        setStatus({
          connected: newStatus.connected,
          connectionType: newStatus.connectionType,
        })
      })
    }

    if (platform.isNative()) {
      // Use Capacitor Network plugin on mobile
      initNetwork()
    } else {
      // Use browser online/offline events on web
      const handleOnline = () => setStatus({ connected: true, connectionType: 'wifi' })
      const handleOffline = () => setStatus({ connected: false, connectionType: 'none' })

      // Set initial state
      setStatus({
        connected: navigator.onLine,
        connectionType: navigator.onLine ? 'unknown' : 'none',
      })

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }

    return () => {
      if (networkListener) {
        networkListener.remove()
      }
    }
  }, [])

  return status
}
