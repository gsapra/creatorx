import { useEffect } from 'react'

export function usePWA() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Service worker is registered automatically by vite-plugin-pwa
      // This hook can be used to add custom PWA behavior
      
      // Listen for app install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        // You can show a custom install button here
        console.log('PWA install prompt ready')
      }
      
      // Detect if app was installed
      const handleAppInstalled = () => {
        console.log('PWA was installed')
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }
  }, [])
}
