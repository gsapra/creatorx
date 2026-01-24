// API configuration
// Since nginx proxies /api/ to backend, we use the same origin
const apiBaseUrl = typeof window !== 'undefined' && (window as any).VITE_API_BASE_URL 
  ? (window as any).VITE_API_BASE_URL 
  : '';

export const API_BASE_URL = apiBaseUrl;

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
