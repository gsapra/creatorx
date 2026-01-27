import { platform } from './platform'

// Analytics event types
export type AnalyticsEvent =
  | 'app_opened'
  | 'user_signed_up'
  | 'user_logged_in'
  | 'user_logged_out'
  | 'script_generated'
  | 'title_generated'
  | 'thumbnail_generated'
  | 'social_caption_generated'
  | 'seo_optimized'
  | 'persona_created'
  | 'persona_selected'
  | 'content_shared'
  | 'camera_used'
  | 'offline_mode_triggered'
  | 'error_occurred'
  | 'page_viewed'

interface AnalyticsProperties {
  [key: string]: string | number | boolean | null | undefined
}

class Analytics {
  private enabled: boolean = true

  constructor() {
    // Initialize analytics
    this.init()
  }

  private init() {
    if (typeof window === 'undefined') return

    // TODO: Initialize your analytics provider
    // Examples:
    // - Google Analytics: gtag.js
    // - Firebase Analytics
    // - Mixpanel
    // - PostHog
    // - Amplitude

    console.log('[Analytics] Initialized')
  }

  /**
   * Track an event
   */
  track(event: AnalyticsEvent, properties?: AnalyticsProperties) {
    if (!this.enabled) return

    try {
      // Add platform and timestamp
      const enrichedProperties = {
        ...properties,
        platform: platform.getPlatform(),
        timestamp: new Date().toISOString(),
        session_id: this.getSessionId(),
      }

      // Log to console in development
      if (import.meta.env.DEV) {
        console.log(`[Analytics] ${event}`, enrichedProperties)
      }

      // TODO: Send to your analytics provider
      // Example for Google Analytics:
      // if (window.gtag) {
      //   window.gtag('event', event, enrichedProperties)
      // }

      // Example for custom backend:
      // fetch('/api/v1/analytics/track', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ event, properties: enrichedProperties })
      // })
    } catch (error) {
      console.error('[Analytics] Error tracking event:', error)
    }
  }

  /**
   * Identify user (after login/signup)
   */
  identify(userId: string, properties?: AnalyticsProperties) {
    if (!this.enabled) return

    try {
      localStorage.setItem('analytics_user_id', userId)

      if (import.meta.env.DEV) {
        console.log(`[Analytics] User identified: ${userId}`, properties)
      }

      // TODO: Send to your analytics provider
      // Example for Mixpanel:
      // mixpanel.identify(userId)
      // mixpanel.people.set(properties)
    } catch (error) {
      console.error('[Analytics] Error identifying user:', error)
    }
  }

  /**
   * Track page view
   */
  page(pageName: string, properties?: AnalyticsProperties) {
    this.track('page_viewed', {
      page_name: pageName,
      ...properties,
    })
  }

  /**
   * Log error for crash reporting
   */
  logError(error: Error, context?: AnalyticsProperties) {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...context,
        platform: platform.getPlatform(),
        timestamp: new Date().toISOString(),
      }

      console.error('[Analytics] Error logged:', errorData)

      // TODO: Send to your error tracking service
      // Examples:
      // - Sentry: Sentry.captureException(error)
      // - Firebase Crashlytics
      // - Bugsnag
      // - Custom backend endpoint
    } catch (logError) {
      console.error('[Analytics] Failed to log error:', logError)
    }
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id')

    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('analytics_session_id', sessionId)
    }

    return sessionId
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    console.log(`[Analytics] ${enabled ? 'Enabled' : 'Disabled'}`)
  }
}

// Export singleton instance
export const analytics = new Analytics()

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    analytics.logError(event.error || new Error(event.message), {
      type: 'uncaught_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    analytics.logError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      {
        type: 'unhandled_promise_rejection',
      }
    )
  })
}
