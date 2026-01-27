import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { App } from '@capacitor/app'

export function useNativeFeatures() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let backButtonListener: any

    const setupNativeFeatures = async () => {
      // Configure status bar
      await StatusBar.setStyle({ style: Style.Light }).catch(console.error)
      await StatusBar.setBackgroundColor({ color: '#6366f1' }).catch(console.error)

      // Hide splash screen
      await SplashScreen.hide().catch(console.error)

      // Handle Android back button
      backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp()
        } else {
          window.history.back()
        }
      })
    }

    setupNativeFeatures()

    return () => {
      if (backButtonListener) {
        backButtonListener.remove()
      }
    }
  }, [])
}
