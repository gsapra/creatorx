import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, URLOpenListenerEvent } from '@capacitor/app'
import { platform } from '@/utils/platform'

export function useDeepLinks() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!platform.isNative()) return

    let urlListener: any

    const setupDeepLinks = async () => {
      // Handle deep links when app is opened from a URL
      urlListener = await App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        const url = event.url
        console.log('App opened with URL:', url)

        // Parse the URL and navigate
        const slug = url.split('.in').pop()

        if (slug) {
          // Navigate to the deep link path
          // Remove leading slash if present
          const path = slug.startsWith('/') ? slug : `/${slug}`

          // Use setTimeout to ensure navigation happens after app is ready
          setTimeout(() => {
            navigate(path)
          }, 100)
        }
      })

      // Check if app was launched with a URL (cold start)
      const checkAppLaunchUrl = async () => {
        const { url } = await App.getLaunchUrl() || {}

        if (url) {
          console.log('App launched with URL:', url)
          const slug = url.split('.in').pop()

          if (slug) {
            const path = slug.startsWith('/') ? slug : `/${slug}`

            setTimeout(() => {
              navigate(path)
            }, 100)
          }
        }
      }

      checkAppLaunchUrl()
    }

    setupDeepLinks()

    return () => {
      if (urlListener) {
        urlListener.remove()
      }
    }
  }, [navigate])
}
