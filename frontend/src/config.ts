import { Capacitor } from '@capacitor/core'

// Platform-aware API configuration
// Web dev: localhost:8000
// Web prod: nginx proxy (same origin)
// Mobile: absolute URL (no proxy available)
const apiBaseUrl = Capacitor.isNativePlatform()
  ? (import.meta.env.VITE_API_BASE_URL || 'https://api.minimalthreads.in')
  : import.meta.env.DEV
    ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
    : ''; // Web production uses same origin (nginx proxy)

export const API_BASE_URL = apiBaseUrl;

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
