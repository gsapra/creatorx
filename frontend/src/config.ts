// API configuration
// Development: Backend on localhost:8000
// Production: nginx proxies /api/ to backend (same origin)
const apiBaseUrl = import.meta.env.DEV
  ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
  : ''; // Production uses same origin (nginx proxy)

export const API_BASE_URL = apiBaseUrl;

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
