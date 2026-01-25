import { apiUrl } from '../config'

// Get storage based on rememberMe preference
const getStorage = () => {
  const rememberMe = localStorage.getItem('rememberMe') === 'true' ||
                     sessionStorage.getItem('rememberMe') === 'true'
  return rememberMe ? localStorage : sessionStorage
}

// Decode JWT without verification (for client-side expiration check)
export const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

// Check if token is expired or will expire soon (within 5 minutes)
export const isTokenExpiringSoon = (token: string): boolean => {
  const decoded = decodeJWT(token)
  if (!decoded || !decoded.exp) return true

  const expirationTime = decoded.exp * 1000 // Convert to milliseconds
  const currentTime = Date.now()
  const fiveMinutes = 5 * 60 * 1000

  return expirationTime - currentTime < fiveMinutes
}

// Get current token from storage
export const getToken = (): string | null => {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

// Get refresh token from storage
const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token')
}

// Refresh the access token
export const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = getRefreshToken()
  if (!refresh) return null

  try {
    const response = await fetch(apiUrl('/api/v1/auth/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refresh })
    })

    if (response.ok) {
      const data = await response.json()
      const storage = getStorage()
      storage.setItem('token', data.access_token)
      storage.setItem('refresh_token', data.refresh_token)
      return data.access_token
    }
    return null
  } catch (error) {
    console.error('[API] Token refresh failed:', error)
    return null
  }
}

// Custom fetch wrapper that handles authentication
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  let token = getToken()

  // Proactively refresh token if it's expiring soon
  if (token && isTokenExpiringSoon(token)) {
    console.log('[API] Token expiring soon, refreshing proactively...')
    const newToken = await refreshAccessToken()
    if (newToken) {
      token = newToken
    }
  }

  // Add Authorization header if token exists
  const headers = new Headers(options.headers)
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Make the request
  let response = await fetch(url, {
    ...options,
    headers
  })

  // If we get a 401, try to refresh the token and retry
  if (response.status === 401) {
    console.log('[API] Got 401, attempting token refresh...')
    const newToken = await refreshAccessToken()

    if (newToken) {
      // Retry the request with the new token
      headers.set('Authorization', `Bearer ${newToken}`)
      response = await fetch(url, {
        ...options,
        headers
      })
    } else {
      // Refresh failed, clear auth and redirect to login
      console.log('[API] Token refresh failed, redirecting to login')
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/login'
    }
  }

  return response
}

// Helper function for GET requests
export const apiGet = async (path: string): Promise<Response> => {
  return authenticatedFetch(apiUrl(path), {
    method: 'GET'
  })
}

// Helper function for POST requests
export const apiPost = async (path: string, body: any): Promise<Response> => {
  return authenticatedFetch(apiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
}

// Helper function for PUT requests
export const apiPut = async (path: string, body: any): Promise<Response> => {
  return authenticatedFetch(apiUrl(path), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
}

// Helper function for DELETE requests
export const apiDelete = async (path: string): Promise<Response> => {
  return authenticatedFetch(apiUrl(path), {
    method: 'DELETE'
  })
}
