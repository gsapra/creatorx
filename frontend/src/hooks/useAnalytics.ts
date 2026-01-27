import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { analytics } from '@/utils/analytics'

export function useAnalytics() {
  const location = useLocation()

  // Track page views
  useEffect(() => {
    analytics.page(location.pathname, {
      url: window.location.href,
      referrer: document.referrer,
    })
  }, [location])

  // Track app open on mount
  useEffect(() => {
    analytics.track('app_opened')
  }, [])

  return analytics
}
