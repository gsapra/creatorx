import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUrl } from '../config'

interface User {
  id: number
  email: string
  username: string
  full_name: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export const useAuth = () => {
  const navigate = useNavigate()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
  })

  // Get the appropriate storage based on rememberMe preference
  const getStorage = () => {
    const rememberMe = localStorage.getItem('rememberMe') === 'true' ||
                       sessionStorage.getItem('rememberMe') === 'true'
    return rememberMe ? localStorage : sessionStorage
  }

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Set up automatic token refresh (every 20 minutes)
  useEffect(() => {
    if (!authState.isAuthenticated) return

    // Refresh token every 20 minutes (tokens expire in 30 minutes)
    const refreshInterval = setInterval(async () => {
      console.log('[Auth] Auto-refreshing token...')
      const success = await refreshToken()
      if (!success) {
        console.log('[Auth] Auto-refresh failed, logging out...')
        logout()
      }
    }, 20 * 60 * 1000) // 20 minutes

    return () => clearInterval(refreshInterval)
  }, [authState.isAuthenticated])

  const checkAuth = async () => {
    try {
      // Check both localStorage and sessionStorage
      let token = localStorage.getItem('token') || sessionStorage.getItem('token')
      let userStr = localStorage.getItem('user') || sessionStorage.getItem('user')

      if (!token || !userStr) {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
        return false
      }

      // Verify token is still valid by calling /me endpoint
      const response = await fetch(apiUrl('/api/v1/auth/me'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setAuthState({
          user: userData,
          token,
          isAuthenticated: true,
          isLoading: false
        })
        return true
      } else {
        // Token is invalid or expired, try to refresh
        const refreshed = await refreshToken()
        if (!refreshed) {
          logout()
        }
        return refreshed
      }
    } catch (error) {
      console.error('[Auth] Check failed:', error)
      logout()
      return false
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const storage = getStorage()
      const refresh = storage.getItem('refresh_token')
      if (!refresh) return false

      const response = await fetch(apiUrl('/api/v1/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refresh })
      })

      if (response.ok) {
        const data = await response.json()
        storage.setItem('token', data.access_token)
        storage.setItem('refresh_token', data.refresh_token)

        // Get updated user info
        const userResponse = await fetch(apiUrl('/api/v1/auth/me'), {
          headers: {
            'Authorization': `Bearer ${data.access_token}`
          }
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()
          storage.setItem('user', JSON.stringify(userData))
          setAuthState({
            user: userData,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false
          })
          return true
        }
      }
      return false
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error)
      return false
    }
  }

  const logout = () => {
    // Clear from both storages
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('refresh_token')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('rememberMe')

    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    })
    navigate('/')
  }

  return {
    ...authState,
    checkAuth,
    logout,
    refreshToken
  }
}
